#!/usr/bin/env python3
"""Read-only, sanitizing profiler for the call-center VICI replica databases.

Usage:
  python scripts/profile_server.py profile [--center baretel|topdial] [--server ALIAS]
  python scripts/profile_server.py merge

Credentials come ONLY from environment variables named in scripts/servers.json
(CCDB_<CENTER>_USER / CCDB_<CENTER>_PASS). Passwords are never accepted as CLI
arguments, never printed, and never written to output files.

Safety model (mirrors the fivestratadb profiling run):
  * structure only: schemas, tables, columns, keys, indexes, information_schema
    row estimates, server version + timezone
  * distinct values captured ONLY for low-cardinality categorical columns whose
    names look safe (status/disposition/type/code/flag/...) and whose names do
    NOT look like PII; values that look like emails/phones or exceed 40 chars
    are withheld anyway
  * every query is a SELECT; the session is set to READ ONLY
"""
import argparse, json, os, re, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
CATALOG_DIR = os.path.join(SKILL, "references", "catalogs")
DATA_DIR = os.path.join(SKILL, "data")

SAFE_NAME = re.compile(r"(status|dispo|type|source|flag|code|campaign|list_id|list_name|group|reason|active|category|vertical|term_reason|pause_type)", re.I)
PII_NAME = re.compile(r"(phone|email|name$|first|last|address|city|state|postal|zip|province|country|dob|birth|gender|ssn|card|pass|secret|token|hash|comment|security|vendor_lead|source_id|lead_id|owner|custom|ip$|filename|location|url)", re.I)
EMAILISH = re.compile(r"@")
PHONEISH = re.compile(r"\d{7,}")
MAX_DISTINCT = 100
MAX_VAL_LEN = 40

def load_registry():
    with open(os.path.join(HERE, "servers.json")) as f:
        return json.load(f)["call_centers"]

def iter_servers(center=None, server=None):
    for cname, cfg in load_registry().items():
        if center and cname != center:
            continue
        for srv in cfg["servers"]:
            if server and srv["alias"] != server:
                continue
            yield cname, cfg, srv

def get_creds(cfg):
    env = cfg["credential_env"]
    user, pw = os.environ.get(env["user"]), os.environ.get(env["password"])
    if not user or not pw:
        sys.exit(f"Missing credentials: set env vars {env['user']} and {env['password']} "
                 "(store the values in your secure store; do not paste them into chat or files).")
    return user, pw

def connect(cfg, srv):
    import pymysql
    user, pw = get_creds(cfg)
    conn = pymysql.connect(host=srv["host"], port=cfg.get("port", 3306),
                           user=user, password=pw, charset="utf8mb4",
                           read_timeout=120, connect_timeout=15,
                           cursorclass=pymysql.cursors.Cursor)
    with conn.cursor() as c:
        try:
            c.execute("SET SESSION TRANSACTION READ ONLY")
        except Exception:
            pass  # older MySQL; we only issue SELECTs regardless
    return conn

def q(conn, sql, args=None):
    with conn.cursor() as c:
        c.execute(sql, args or ())
        return c.fetchall()

def profile_one(cname, cfg, srv):
    alias = srv["alias"]
    print(f"[{alias}] connecting to {srv['host']} ...")
    conn = connect(cfg, srv)
    meta = {
        "alias": alias, "call_center": cname, "host": srv["host"],
        "business_line": srv.get("business_line"), "lead_type": srv.get("lead_type"),
        "profiled_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "version": q(conn, "SELECT VERSION()")[0][0],
        "time_zone": q(conn, "SELECT @@system_time_zone, @@time_zone")[0],
    }
    schemas = [r[0] for r in q(conn,
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN "
        "('information_schema','performance_schema','mysql','sys')")]
    tables, columns, lookups = {}, {}, {}
    for sch in schemas:
        for name, engine, rows in q(conn,
                "SELECT table_name, engine, table_rows FROM information_schema.tables "
                "WHERE table_schema=%s AND table_type='BASE TABLE'", (sch,)):
            key = f"{sch}.{name}"
            tables[key] = {"engine": engine, "approx_rows": int(rows or 0)}
            cols = q(conn,
                "SELECT column_name, column_type, is_nullable, column_key "
                "FROM information_schema.columns WHERE table_schema=%s AND table_name=%s "
                "ORDER BY ordinal_position", (sch, name))
            columns[key] = [list(c) for c in cols]
    # safe categorical lookups
    for key, cols in columns.items():
        sch, name = key.split(".", 1)
        if tables[key]["approx_rows"] > 50_000_000:
            continue  # too big to scan for distincts safely
        for cname_, ctype, _n, _k in cols:
            if not SAFE_NAME.search(cname_) or PII_NAME.search(cname_):
                continue
            if not re.match(r"(varchar|char|enum|tinyint|smallint|int)", ctype or ""):
                continue
            try:
                vals = q(conn, f"SELECT DISTINCT `{cname_}` FROM `{sch}`.`{name}` LIMIT {MAX_DISTINCT+1}")
            except Exception:
                continue
            if len(vals) > MAX_DISTINCT:
                continue
            clean = []
            for (v,) in vals:
                s = "" if v is None else str(v)
                if len(s) > MAX_VAL_LEN or EMAILISH.search(s) or PHONEISH.search(s):
                    continue  # withhold suspicious values
                clean.append(s)
            if clean:
                lookups[f"{key}.{cname_}"] = sorted(clean)
    conn.close()
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(CATALOG_DIR, exist_ok=True)
    raw_path = os.path.join(DATA_DIR, f"raw_profile_{alias}.json")
    with open(raw_path, "w") as f:
        json.dump({"meta": meta, "tables": tables, "columns": columns}, f, indent=1)
    with open(os.path.join(DATA_DIR, f"safe_lookups_{alias}.json"), "w") as f:
        json.dump(lookups, f, indent=1, sort_keys=True)
    write_markdown(alias, meta, tables, columns)
    print(f"[{alias}] done: {len(tables)} tables, {len(lookups)} safe lookup columns")

def write_markdown(alias, meta, tables, columns):
    lines = [f"# Catalog: `{alias}` ({meta['call_center']})", "",
             f"Host {meta['host']} · {meta['business_line']} / {meta['lead_type']} · "
             f"MySQL {meta['version']} · tz {meta['time_zone']} · profiled {meta['profiled_at']}", ""]
    for key in sorted(tables, key=lambda k: -tables[k]["approx_rows"]):
        t = tables[key]
        lines += [f"## `{key}` · ~{t['approx_rows']:,} rows · {t['engine']}", "",
                  "| column | type | null | key |", "|---|---|---|---|"]
        lines += [f"| `{c}` | {ty} | {n} | {k} |" for c, ty, n, k in columns[key]]
        lines.append("")
    with open(os.path.join(CATALOG_DIR, f"{alias}.md"), "w") as f:
        f.write("\n".join(lines))

def merge():
    """Build canonical_vici.md: tables/columns common to all profiled servers, plus per-server deltas."""
    profiles = {}
    for fn in os.listdir(DATA_DIR):
        m = re.match(r"raw_profile_(.+)\.json$", fn)
        if m:
            with open(os.path.join(DATA_DIR, fn)) as f:
                profiles[m.group(1)] = json.load(f)
    if not profiles:
        sys.exit("No raw profiles found — run `profile` first.")
    colsets = {a: {k: {c[0] for c in cols} for k, cols in p["columns"].items()} for a, p in profiles.items()}
    all_aliases = sorted(profiles)
    common_tables = set.intersection(*(set(cs) for cs in colsets.values()))
    lines = [f"# Canonical VICI catalog — tables present on ALL {len(all_aliases)} profiled servers",
             "", f"Servers: {', '.join(all_aliases)}. Generated {datetime.datetime.now():%Y-%m-%d}.",
             "", "| table | common columns | column drift |", "|---|---|---|"]
    for t in sorted(common_tables):
        common_cols = set.intersection(*(colsets[a][t] for a in all_aliases))
        drift = {a: sorted(colsets[a][t] - common_cols) for a in all_aliases if colsets[a][t] - common_cols}
        lines.append(f"| `{t}` | {len(common_cols)} | " +
                     ("; ".join(f"{a}: +{','.join(d)}" for a, d in drift.items()) or "none") + " |")
    lines += ["", "## Per-server extra tables (not on every server)", ""]
    for a in all_aliases:
        extra = sorted(set(colsets[a]) - common_tables)
        lines.append(f"- **{a}**: " + (", ".join(f"`{t}`" for t in extra) or "none"))
    with open(os.path.join(CATALOG_DIR, "canonical_vici.md"), "w") as f:
        f.write("\n".join(lines) + "\n")
    print(f"canonical_vici.md written: {len(common_tables)} common tables across {all_aliases}")

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("profile")
    p.add_argument("--center"), p.add_argument("--server")
    sub.add_parser("merge")
    a = ap.parse_args()
    if a.cmd == "merge":
        merge()
    else:
        targets = list(iter_servers(a.center, a.server))
        if not targets:
            sys.exit("No matching servers in servers.json")
        for cname, cfg, srv in targets:
            try:
                profile_one(cname, cfg, srv)
            except Exception as e:
                print(f"[{srv['alias']}] FAILED: {type(e).__name__}: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
