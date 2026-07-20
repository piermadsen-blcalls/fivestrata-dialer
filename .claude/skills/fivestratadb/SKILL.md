---
name: fivestratadb
description: "Answer questions about the FiveStrata MySQL database — its schemas, tables, columns, keys, relationships, and safe categorical lookup values. FiveStrata is a lead-revival and lead-distribution platform whose schemas are prefixed techss_ (techss_all_leads, techss_dl, techss_reporting, techss_RV, techss_RIB, techss_wv, techss_dwh, techss_audit, techss_log, techss_phone_system, techss_system, and more), covering leads, validation, DNC, affiliate and call-center data, client/ZIP distribution and bidding, the dialer, web-verify scripts, the Meridius warehouse, reporting, audit and logs. Use whenever the user asks about the FiveStrata or techss database: what tables or columns exist, how tables relate, a column's type or keys, what distinct status/type/disposition/source lookup values appear, or where lead/client/ZIP/pricing data lives. Trigger broadly. Unrelated to the AutoWeb VehicleCatalog database."
---

# FiveStrata Database Knowledge

Grounded knowledge about the **FiveStrata** MySQL database (MySQL 8.4.7) — a lead-revival and lead-distribution platform. The data was captured by a read-only profiling run that recorded structure (schemas, tables, columns, keys, foreign keys, indexes, row counts) plus distinct values for **safe categorical lookup columns only**. It answers "what does this database look like and how is it organized," not "what is the value of a specific lead."

## Data sensitivity — read first

This database holds large volumes of consumer lead data and PII. Per policy, **no consumer lead data, PII, payment data, credentials, tokens, or API keys are stored in this skill.** The profile that built it deliberately withheld:

- All fact-table sample rows.
- Any column whose name implies personal/sensitive data (names, emails, phones, addresses, ZIP, DOB, SSN, card/payment, passwords, secrets, tokens, hashes, lead ids, TrustedForm/Jornaya, etc.).
- Any value that looked like an email, a phone number, or free text over 40 characters.

What *is* included is structure and safe categorical lookups (statuses, types, dispositions, sources, client verticals, return reasons, codes, flags). When a user needs an actual lead value, a specific row, or any withheld column's contents, **the live database is the source of truth** — say so rather than guessing.

## Architecture in one paragraph

FiveStrata is organized as a set of MySQL schemas all prefixed `techss_` (plus a `darwin_poc` proof-of-concept). The center of gravity is **`techss_all_leads`** (~1.9B rows across 130 tables): raw leads, revived leads, validation data, LeadConduit/TrustedForm/Jornaya token data, DNC, affiliate data, call-center data, and transfer data. **`techss_dl`** ("distribution") is the routing brain — clients, ZIP coverage, bids and lead prices, transfer priorities, client verticals/types, and dialer/staging logs, with many distribution views. **`techss_RV`** and **`techss_RIB`** manage revived inventory and its daily/weekly state and batch timing (largely views). **`techss_wv`** ("web verify") holds visual-verification, review, return, and transfer scripts/providers plus dialer-lead views. **`techss_dwh`** is the warehouse, including the **Meridius** sent-leads dataset, per-client rate overrides, and a holiday calendar. **`techss_reporting`** is the reporting layer (dashboards, conversion views, intake facts, reporting dimensions). **`techss_phone_system`** covers the dialer/call facts; **`techss_audit`** and **`techss_log`** hold audit trails and operational/batch logs; **`techss_system`** holds app configuration (e.g. navigation menus); and smaller schemas (`techss_clientportal`, `techss_partners`, `techss_prism`, `techss_experiments`, `techss_QA`, `techss_call_center_data`) round it out. Four schemas were empty at profile time: `admin`, `innodb`, `techss_lead_inventory`, `tmp`.

## Where the detail lives

Consult these files (in the skill folder) in order of specificity:

1. **`references/schema_overview.md`** — every schema with table counts, classification (dimension/fact/view), approximate row totals, and a one-line purpose.
2. **`references/<schema>.md`** — per-schema deep dive: every table with its classification, row count, engine, primary key, full column list (name, type, nullable, key), and foreign keys. Read the one matching the user's question (e.g. `references/techss_dl.md`).
3. **`data/profile_summary.md`** — the 30 largest tables by row count, for a quick sense of scale.
4. **`data/safe_lookups.json`** — distinct values for safe categorical lookup columns, keyed by `schema.table.column`. ~1.8 MB. Don't read it whole; `grep`/`jq` the specific key. Example:
   ```bash
   jq '.["techss_dl.client_vertical.vt_desc"]' data/safe_lookups.json
   ```
5. **`data/sanitization_report.md`** — what was withheld and why (verification record).

## How to answer

- **"What schemas exist / what's the layout?"** — answer from this file and `references/schema_overview.md`.
- **"What tables are in schema X?"** or **"What columns/keys does table Y have?"** — read `references/<schema>.md`. Don't fabricate columns; if it isn't listed, say so.
- **"How does table A relate to table B?"** — use the foreign-key listings in the schema reference files. Note that this database makes heavy use of convention-based joins (e.g. lead-id columns) that may not be declared as formal FKs; flag when a relationship is by-convention rather than enforced.
- **"What distinct values does column Z have?"** (for a status/type/disposition/source/code/flag/vertical/reason) — look it up in `data/safe_lookups.json`. If the key isn't present, it was withheld as sensitive or wasn't a low-cardinality lookup — say the live DB is the source.
- **"What's the actual data for lead/customer/phone/email …?"** — not in this skill by design. Point to the live database.

## A few facts worth knowing

- 18 non-empty schemas, ~800 profiled tables. All application schemas are prefixed `techss_`.
- `techss_all_leads` is by far the largest schema (~1.9B rows). Its biggest tables include `revivedLeadsBatches` (~639M), `dncDate` (~256M), `validationData` (~169M), `leadTrustedForms` (~86M), `leadConduitData` (~81M), and `leadData` (~60M).
- "Revive" is a core domain concept: leads are ingested, validated, and later **revived** (re-marketed) and **distributed** to clients by ZIP, vertical, and bid.
- Client verticals seen in lookups include solar, auto insurance, autos, bathroom remodel, credit repair, debt relief, home security, home warranty, and roofing.
- The Meridius dataset in `techss_dwh` is a curated sent-leads fact set with per-client rate overrides and a holiday calendar (see table comments in `references/techss_dwh.md`).
- Profile captured 2026-06-23 against MySQL 8.4.7. Row counts are `information_schema` estimates (fast, approximate), not exact `COUNT(*)`.

## Call-center data — hard-won facts (2026-07)

- **The `techss_reporting.TD_*` mirror tables (TD_BR/WI/HW/SL/AU_vicidial_log, _agent_log, dial_logs, and all `_arc` twins) were EMPTY as of 2026-07-08**, with `CC_BehindMaster.secondsBehind` NULL for all TD rows. The TopDial ingestion pipeline exists but is dormant (mechanism deliberately treated as a black box, per Sean). Never assume prod holds current TD call data — check `SELECT 1 FROM <table> LIMIT 1` first, and source call-center analysis from the dialer replicas or partner reports instead.
- **`techss_reporting.CC_BehindMaster`** is the call-center replica source monitor: one row per source (host, VT, CC, dbname, secondsBehind). It maps which external dialer servers prod tracks per vertical.
- **`techss_log.call_center_import_logs`** is the audit of manual/CSV call-center imports: per-lead outcome keyed by `call_center`, `OLeadID`, `vertical`, `outcome`, `reason`, linked to `csv_files`/`csv_rows`. This is where to verify whether a partner pull actually landed.
- **`techss_log.fs_db_import_log` is NOT ingestion** despite the name — it's a JSON write-audit of FS app table changes (`json_data` row snapshots, `tableName`, batch `uuid`). Don't chase it for ETL questions.
- **`OLeadID` is the cross-system lead key** used with call centers (it's what partners are asked for, and what import logs key on). On the dialer side it typically maps to `vicidial_list.vendor_lead_code`.
- Disposition decoding for call-center statuses: `techss_dl.callcenter_dispos` and `techss_reporting.CC_dispos`.
- **Companion skill:** the external call-center replica databases (BareTel/Kombea "KB" and TopDial "TD" VICIdial servers) are covered by the **callcenterdb** skill — use both together for cross-DB questions. Mind timezones: KB replicas run EST/EDT, TD replicas MST, prod may differ.

## What this skill does NOT cover

- Any individual lead, customer, or contact record; any PII; any payment, credential, or token value.
- Exact row counts (estimates only) and per-row fact data.
- Values for high-cardinality or free-text columns.
- The four empty schemas (`admin`, `innodb`, `techss_lead_inventory`, `tmp`) and `dbo`-style system internals.

For anything in those categories, the live FiveStrata database is the source of truth.
                                                                                                                                                                                                                                                                                                                                                                    