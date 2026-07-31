#!/usr/bin/env python3
"""did_deepdive_query.py -- DID economics deep-dive on a VICIdial replica (archive tables).

Follow-up to did_caps_query.py. Mines vicidial_dial_log_archive (+ vicidial_log_archive via
uniqueid) for: long-run per-DID daily caps, DID pool lifecycle/churn, the answer-rate-vs-
dials-per-DID decay curve (the DID cost-optimization calculus from the 7/29 meeting), hourly
dial/slot-time patterns (feeds concurrency sizing), SIP hangup-cause trends (carrier
blocking / spam-reputation signal -- TD's "603lock" world), and campaign mix.

Usage (PowerShell) -- same env vars as did_caps_query.py:
    $env:CCDB_TOPDIAL_USER = "..."
    $env:CCDB_TOPDIAL_PASS = "..."
    $env:CCDB_TOPDIAL_HOST = "116.202.196.60"   # td-windows; 142.132.197.142 = td-bathroom
    $env:CCDB_TOPDIAL_DB   = "asterisk"
    python scripts/did_deepdive_query.py

Read-only, aggregates only (no PII; DIDs are our own numbers). Archive scans are heavy but
bounded by call_date windows; each query is wrapped so one timeout doesn't kill the run.
Results -> C:\\Claude\\scratch\\did-caps\\<host>\\deepdive\\*.csv
"""
import csv
import os
import sys
import time

import pymysql

USER = os.environ.get("CCDB_TOPDIAL_USER")
PASS = os.environ.get("CCDB_TOPDIAL_PASS")
HOST = os.environ.get("CCDB_TOPDIAL_HOST")
DB = os.environ.get("CCDB_TOPDIAL_DB")

if not all([USER, PASS, HOST, DB]):
    sys.exit("Set CCDB_TOPDIAL_USER, CCDB_TOPDIAL_PASS, CCDB_TOPDIAL_HOST, CCDB_TOPDIAL_DB first.")

OUT_DIR = os.path.join(r"C:\Claude\scratch\did-caps", HOST, "deepdive")
os.makedirs(OUT_DIR, exist_ok=True)

# outbound_cid can be bare digits or '"Name" <digits>' -- normalize to the number
DID = "COALESCE(NULLIF(SUBSTRING_INDEX(SUBSTRING_INDEX(dl.outbound_cid,'<',-1),'>',1),''), dl.outbound_cid)"

# human_answered comes from campaign-specific status defs first, global defs second
ANSWERED = "CASE WHEN COALESCE(vcs.human_answered, vs.human_answered) = 'Y' THEN 1 ELSE 0 END"
STATUS_JOINS = (
    " LEFT JOIN vicidial_campaign_statuses vcs"
    "   ON vcs.status = vl.status AND vcs.campaign_id = vl.campaign_id"
    " LEFT JOIN vicidial_statuses vs ON vs.status = vl.status"
)

QUERIES = {
    # A. How much history does the archive actually hold? (COUNT is metadata-cheap on MyISAM)
    "A_archive_window": (
        "SELECT MIN(call_date) AS oldest, MAX(call_date) AS newest, COUNT(*) AS rows_archive "
        "FROM vicidial_dial_log_archive"
    ),

    # B. The 1,500-cap verdict over 60 days (long-run confirmation of the 2-day live answer)
    "B_verdict_60d": (
        f"SELECT dial_day, COUNT(*) AS dids_used, SUM(dials) AS total_dials,"
        f"       MAX(dials) AS max_per_did,"
        f"       SUM(dials >= 1500) AS did_days_1500_plus,"
        f"       SUM(dials >= 1000) AS did_days_1000_plus,"
        f"       SUM(dials >= 500)  AS did_days_500_plus"
        f" FROM (SELECT DATE(dl.call_date) AS dial_day, {DID} AS did, COUNT(*) AS dials"
        f"       FROM vicidial_dial_log_archive dl"
        f"       WHERE dl.call_date >= CURDATE() - INTERVAL 60 DAY"
        f"       GROUP BY dial_day, did) t"
        f" GROUP BY dial_day ORDER BY dial_day"
    ),

    # C. Full DID pool lifecycle, 90 days -- one row per DID (analyzed offline: lifespan,
    #    churn, blocks). ~10-30K rows, no LIMIT on purpose.
    "C_did_lifecycle_90d": (
        f"SELECT {DID} AS did,"
        f"       MIN(DATE(dl.call_date)) AS first_seen, MAX(DATE(dl.call_date)) AS last_seen,"
        f"       COUNT(DISTINCT DATE(dl.call_date)) AS active_days, COUNT(*) AS total_dials"
        f" FROM vicidial_dial_log_archive dl"
        f" WHERE dl.call_date >= CURDATE() - INTERVAL 90 DAY"
        f" GROUP BY did"
    ),

    # D. Weekly pool size + volume, 90 days (pool growth/rotation trend)
    "D_weekly_pool": (
        f"SELECT YEARWEEK(dl.call_date, 3) AS iso_week,"
        f"       COUNT(DISTINCT {DID}) AS dids_used, COUNT(*) AS dials"
        f" FROM vicidial_dial_log_archive dl"
        f" WHERE dl.call_date >= CURDATE() - INTERVAL 90 DAY"
        f" GROUP BY iso_week ORDER BY iso_week"
    ),

    # E. THE DECAY CURVE: answer rate vs dials-per-DID-per-day, 21 days.
    #    dial attempts from dial_log_archive; outcomes joined via uniqueid to log_archive.
    "E_decay_curve_21d": (
        f"SELECT bucket, COUNT(*) AS did_days, SUM(dials) AS dials, SUM(answered) AS answered,"
        f"       ROUND(SUM(answered) / SUM(dials) * 100, 2) AS answer_pct"
        f" FROM ("
        f"   SELECT t.did, t.dial_day, t.dials, t.answered,"
        f"     CASE WHEN t.dials <= 10 THEN '01: 1-10' WHEN t.dials <= 25 THEN '02: 11-25'"
        f"          WHEN t.dials <= 50 THEN '03: 26-50' WHEN t.dials <= 100 THEN '04: 51-100'"
        f"          WHEN t.dials <= 200 THEN '05: 101-200' ELSE '06: 200+' END AS bucket"
        f"   FROM ("
        f"     SELECT {DID} AS did, DATE(dl.call_date) AS dial_day,"
        f"            COUNT(*) AS dials, SUM({ANSWERED}) AS answered"
        f"     FROM vicidial_dial_log_archive dl"
        f"     LEFT JOIN vicidial_log_archive vl ON vl.uniqueid = dl.uniqueid"
        f"       AND vl.call_date >= CURDATE() - INTERVAL 22 DAY"
        f"     {STATUS_JOINS}"
        f"     WHERE dl.call_date >= CURDATE() - INTERVAL 21 DAY"
        f"     GROUP BY did, dial_day"
        f"   ) t"
        f" ) x GROUP BY bucket ORDER BY bucket"
    ),

    # F. Hourly dial pattern + slot time (feeds concurrency sizing: avg slot S by hour).
    #    Live vicidial_log window; server-local time (TD = MST).
    "F_hourly_slot": (
        f"SELECT HOUR(vl.call_date) AS hr, COUNT(*) AS dials,"
        f"       ROUND(AVG(vl.length_in_sec), 1) AS avg_slot_sec,"
        f"       SUM({ANSWERED}) AS answered,"
        f"       ROUND(AVG(CASE WHEN COALESCE(vcs.human_answered, vs.human_answered) = 'Y'"
        f"                      THEN vl.length_in_sec END), 1) AS avg_sec_answered"
        f" FROM vicidial_log vl"
        f" {STATUS_JOINS}"
        f" GROUP BY hr ORDER BY hr"
    ),

    # G. SIP hangup causes by day, 30 days (carrier rejection trend; 21=rejected,
    #    34=congestion, 17=busy, 19=no answer, 16=normal)
    "G_hangup_causes_30d": (
        "SELECT DATE(dl.call_date) AS d, dl.sip_hangup_cause, COUNT(*) AS dials"
        " FROM vicidial_dial_log_archive dl"
        " WHERE dl.call_date >= CURDATE() - INTERVAL 30 DAY"
        " GROUP BY d, dl.sip_hangup_cause ORDER BY d, dials DESC"
    ),

    # H. Worst DIDs by carrier-reject share, 30 days (min 300 dials) -- the spam-flag list
    "H_worst_dids_rejects": (
        f"SELECT {DID} AS did, COUNT(*) AS dials,"
        f"       SUM(dl.sip_hangup_cause = 21) AS rejected,"
        f"       ROUND(SUM(dl.sip_hangup_cause = 21) / COUNT(*) * 100, 2) AS reject_pct"
        f" FROM vicidial_dial_log_archive dl"
        f" WHERE dl.call_date >= CURDATE() - INTERVAL 30 DAY"
        f" GROUP BY did HAVING dials >= 300 ORDER BY reject_pct DESC LIMIT 30"
    ),

    # I. Campaign mix by day, 30 days (fresh vs revive vs solar on this box)
    "I_campaign_mix_30d": (
        f"SELECT vl.campaign_id, DATE(vl.call_date) AS d, COUNT(*) AS dials,"
        f"       SUM({ANSWERED}) AS answered"
        f" FROM vicidial_log_archive vl"
        f" {STATUS_JOINS}"
        f" WHERE vl.call_date >= CURDATE() - INTERVAL 30 DAY"
        f" GROUP BY vl.campaign_id, d ORDER BY d, dials DESC"
    ),
}


def main():
    conn = pymysql.connect(
        host=HOST, port=3306, user=USER, password=PASS, database=DB,
        charset="utf8mb4", read_timeout=1800, connect_timeout=15,
    )
    failures = []
    try:
        for name, sql in QUERIES.items():
            start = time.time()
            print(f"\n== {name} ...", flush=True)
            try:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    cols = [d[0] for d in cur.description]
                    rows = cur.fetchall()
            except Exception as exc:  # keep going; archives can time out
                print(f"   FAILED after {time.time() - start:.0f}s: {exc}")
                failures.append(name)
                continue

            path = os.path.join(OUT_DIR, f"{name}.csv")
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(cols)
                writer.writerows(rows)
            print(f"   {len(rows)} rows in {time.time() - start:.0f}s -> {path}")

            if len(rows) <= 25:
                print("   " + " | ".join(str(c) for c in cols))
                for row in rows:
                    print("   " + " | ".join(str(v) for v in row))
    finally:
        conn.close()

    print(f"\nDone. Results in {OUT_DIR}")
    if failures:
        print(f"Failed queries (rerun individually or shrink windows): {', '.join(failures)}")


if __name__ == "__main__":
    main()
