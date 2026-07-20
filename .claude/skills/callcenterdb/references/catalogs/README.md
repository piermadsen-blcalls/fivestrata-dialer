# Profiled catalogs

Profiled 2026-07-07/08 against all 7 servers. Files:

- `canonical_vici.md` — 293 tables present on ALL 7 servers (schema `asterisk`), with column-drift notes.
- `<alias>.md` — per-server full catalog (every table, column, row estimate, server version/timezone).
- `../../data/safe_lookups_<alias>.json` — safe categorical lookups per server, keyed `schema.table.column`. Grep/jq a key; don't read whole.
- `../../data/raw_profile_<alias>.json` — machine-readable structure (input to `profile_server.py merge`).

Key profiled facts:

| server | engine | tz | tables | campaigns |
|---|---|---|---|---|
| fsbr | MariaDB 10.1.25 | EST | 324 | FSFRESH, FSREVIVE, FSCFR, FSCRV |
| fsbrv | MariaDB 10.1.25 | EDT | 327 | FSFRESH, FSREVIVE, FSCFR, FSCRV |
| fshw | MariaDB 10.11.11 | EDT | 372 | FSFRESH, FSREVIVE, FSCFR, FSCRV |
| fswn | MariaDB 10.1.25 | EST | 342 | FSFRESH, FSREVIVE, FSCLOSER |
| fswr | MariaDB 10.6.20 | EDT | 382 | FSFRESH, FSREVIVE, FSCLOSER |
| td-bathroom | MariaDB 10.11.15 | MST | 394 | BRFresh, BRSafe, BREIS, BathRemo (+test) |
| td-windows | MariaDB 10.5.8 | MST | 474 | WIFresh, WISafe, WI5S, Window, Solar_Re (+test) |

Notes: these are MariaDB, not MySQL — 10.1 boxes (fsbr, fsbrv, fswn) have NO window functions. KB servers use one uniform FS* campaign scheme (fresh/revive split by campaign even though servers are also split); TD uses per-vertical campaign names, and td-windows also hosts a Solar campaign. Disposition vocabularies: Q1–Q8 (the "Qs" = qualified/transfer tiers), NI1–NI7 (not-interested tiers), NQ/NQA/NQD/NQH/NQS/NQT (not-qualified variants, TD-windows), plus BAD/DA/HUP/LAPSED/EXPIRE/MAX/PURGED etc. Per-server `custom_NNNN` tables are VICIdial per-list custom-field tables; `*_archive` tables exist for big logs.
