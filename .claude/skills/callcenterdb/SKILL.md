---
name: callcenterdb
description: Catalog and query guidance for the replicated call-center (VICI dialer) MySQL databases that feed the FiveStrata ecosystem — BareTel/KB (5 replica servers - fsbr, fsbrv, fshw, fswn, fswr) and TopDial/TD (2 replica servers - bathroom, windows). Use whenever the user asks about BareTel, KB, TopDial, TD, VICI/VICIdial databases, dialer replicas or slave DBs, call-center call logs, dispositions, agents, campaigns, lists, recordings, which server holds which business line (bathroom/windows/home-warranty, fresh vs revive), how call-center data reaches FiveStrata, how to join dialer data back to techss_ tables, profiling/cataloging a replica server, or onboarding a new call center or server. Trigger broadly for any call-center database question. The prod internal FiveStrata DB itself is covered by the separate fivestratadb skill — use both together for cross-DB questions.
---

# Call-Center Replica Databases (callcenterdb)

Holistic catalog of the **replicated call-center databases** AutoWeb/FiveStrata works with. Two call centers today, more possible later:

| call center | alias | replicas | platform | status in our ecosystem |
|---|---|---|---|---|
| **BareTel/Kombea** (KB = Kombea, dialing software atop BareTel carrier tech) | KB | 5 (fsbr, fsbrv, fshw, fswn, fswr) | VICIdial (MariaDB) | NOT connected — manual pulls only |
| **TopDial** | TD | 2 (bathroom, windows) | VICIdial (MariaDB) | Connected — lands in techss_reporting TD_* mirrors (owner: Joseph/Cromwell) |

All 7 replicas are **VICIdial dialer databases**, so they share essentially the same schema. That is the key leverage point: learn the VICI structure once, apply it to every server, and track only the per-server *differences* (custom dispositions, campaigns, lists, business-line content).

## Credentials — read first

**This skill contains NO usernames, NO passwords, NO API keys — by policy, and it must stay that way.** It stores only hosts, ports, and business labels. At runtime, credentials come from environment variables (or a local config file the user maintains outside this skill):

- `CCDB_BARETEL_USER` / `CCDB_BARETEL_PASS`
- `CCDB_TOPDIAL_USER` / `CCDB_TOPDIAL_PASS`

If a credential env var is missing, ask the user to set it — never ask them to paste a password into chat, never echo one, and never write one to a file inside this skill. When updating this skill (new servers, regenerated catalogs), re-verify nothing credential-like slipped in (see the checklist in `references/metadata_sop.md`).

## Data freshness

Replicas refresh ~once daily (nominally 2pm PDT, loosely held). All replica answers are T-1 analytics, never real-time. Real-time needs go to the partner by request (see the partner-reporting section of `references/data_flow.md` — partners already email daily reports that may answer the question without any query).

## Data sensitivity

These databases hold consumer lead PII (names, phones, addresses, recordings metadata). The same rules as the fivestratadb skill apply: catalogs generated for this skill contain **structure and safe categorical lookups only** — no lead rows, no PII column values, no free text. `vicidial_list` in particular is PII-dense; never `SELECT *` from it into chat or files. When someone needs actual lead/call row values, query live with tight column lists and treat output as sensitive.

## Where the detail lives

1. **`references/servers.md`** — the server registry: every replica's host/port, business-line mapping (fresh vs revive), naming conventions, and open questions. Read this first for any "which server / what's on it" question.
2. **`references/vici_schema.md`** — the shared VICIdial schema: core tables (`vicidial_list`, `vicidial_log`, `vicidial_closer_log`, `vicidial_agent_log`, campaigns/lists/statuses, recordings), what each holds, PII flags, and status semantics. This is general VICIdial knowledge until per-server catalogs are generated — trust profiled catalogs over it where they exist.
3. **`references/catalogs/`** — POPULATED (profiled 2026-07-07/08, all 7 servers): `canonical_vici.md` (293 common tables + drift), per-server `<alias>.md`, and `catalogs/README.md` with the versions/timezones/campaigns summary table. Prefer these over general VICI knowledge.
4. **`references/data_flow.md`** — how each replica's data reaches the FiveStrata ecosystem (TD connected; KB manual pulls), who owns what, and open questions to confirm.
5. **`references/cross_db_joins.md`** — mapping VICI records back to `techss_` tables in the prod FiveStrata DB for holistic analysis. Use together with the **fivestratadb** skill.
6. **`references/query_cookbook.md`** — ready-made read-only VICI queries (call volumes, dispositions, agent stats, list penetration), parameterized by server.
7. **`references/metadata_sop.md`** — the S.O.P. for maintaining this catalog: onboarding a new call center or server, re-profiling cadence, sanitization checklist.

## How to answer

- **"Which server has X / what do the KB boxes hold?"** → `references/servers.md`.
- **"What tables/columns does the dialer have?"** → profiled catalog in `references/catalogs/` if present; otherwise `references/vici_schema.md`, flagged as general VICI knowledge pending profiling.
- **"Pull dispositions / call volume / agent stats"** → `references/query_cookbook.md`; adapt the parameterized query, remind which server(s) it targets. Read-only always.
- **"How does this data get into our system?"** → `references/data_flow.md`.
- **"How do I tie a dialer call back to a FiveStrata lead?"** → `references/cross_db_joins.md` + the fivestratadb skill.
- **"Catalog/profile a server" or "we added a new server/call center"** → `references/metadata_sop.md`, then `scripts/profile_server.py`.

## Running the profiler

```bash
pip install pymysql --break-system-packages   # once
export CCDB_BARETEL_USER=... CCDB_BARETEL_PASS=...   # set by the user, outside chat
python scripts/profile_server.py profile --center baretel            # all 5 KB replicas
python scripts/profile_server.py profile --server fsbr               # one replica
python scripts/profile_server.py merge                               # canonical catalog + per-server deltas
```

The profiler is **read-only** and sanitizing by design: structure (tables, columns, keys, indexes, row estimates) plus distinct values for safe low-cardinality categorical columns only, with PII-pattern columns and suspicious values withheld. Outputs land in `references/catalogs/` and `data/`.

## What this skill does NOT cover

- The prod internal FiveStrata DB (`techss_*`) — that's the **fivestratadb** skill.
- The live business/ops layer (Master Dashboard, partner report EMAILS, ops roles, cost sheets, KPI definitions) — that's the **fivestrataops** skill; its `source_crosswalk.md` defines which source is authoritative when replica data and business reports disagree.
- Any credential, password, or token — those live outside the skill, always.
- Individual lead/consumer records or PII values.
- The AutoWeb VehicleCatalog database.
