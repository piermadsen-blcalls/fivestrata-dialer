# Call-center metadata S.O.P.

Standard operating procedure for keeping this skill's catalog truthful as call centers, servers, and pipelines change. The skill is only as good as its metadata — stale server maps and unverified ❓ items are how cross-DB analysis quietly goes wrong.

## SOP 1 — Onboard a new server (existing call center)

1. Get from the call center: host, port, business line, fresh/revive designation, replica name.
2. Add the server to BOTH `references/servers.md` (human table) and `scripts/servers.json` (machine registry). Same alias in both.
3. Credentials: confirm whether the center's existing `CCDB_<CENTER>_*` env vars work. If a new credential is issued, the user stores it in their secure store and sets the env vars — the credential itself never enters chat, this skill, or servers.json.
4. Run the profiler for the new server: `python scripts/profile_server.py profile --server <alias>`, then `merge` to refresh deltas.
5. Sanity-check: run the "data recency" cookbook query; record retention/lag findings in `references/data_flow.md`.
6. Run the sanitization checklist (SOP 5).

## SOP 2 — Onboard a new call center

1. Add a new center block to `scripts/servers.json` (alias, port, `credential_env` names following the `CCDB_<CENTER>_USER/PASS` pattern) and a new section in `references/servers.md`.
2. Establish the basics and record them in `references/data_flow.md`: Is it VICIdial? (If not, the shared-schema assumption breaks — the center needs its own schema reference file, `references/<center>_schema.md`.) Connected or manual-pull? Who owns the relationship?
3. Profile all its servers; merge.
4. Extend `references/cross_db_joins.md`: verify whether vendor_lead_code carries FiveStrata lead ids for this center, and how its lists/campaigns are named.
5. Update the SKILL.md description to name the new center (triggering depends on it).

## SOP 3 — Re-profiling cadence

- Re-profile a server after: dialer upgrades, campaign restructures, new custom dispositions, or anything that makes catalog answers feel off.
- Otherwise, quarterly is a reasonable default for structure; safe lookups (dispositions, campaigns, lists) drift faster — refresh them when doing disposition-level analysis after a gap.
- Catalogs are cheap to regenerate; when in doubt, re-run. Each catalog records its profile date — check it before trusting fine-grained lookups.

## SOP 4 — Recording new knowledge (❓ resolution)

Reference files mark unverified items with ❓. When an answer arrives (from Brandon, Joseph, Cromwell, or a spot check), edit the relevant file: state the fact, the source, and the date; remove the ❓. Prime candidates: TD ingestion mechanism (data_flow.md), vendor_lead_code population (cross_db_joins.md), server timezones (vici_schema.md), the extra BareTel host (servers.md).

## SOP 5 — Sanitization checklist (before packaging/sharing any skill update)

1. `grep -riE "password|passwd|secret|token" --include="*.md" --include="*.json" .` — hits must be policy text only, never values.
2. Confirm no usernames anywhere (search for known account names).
3. Confirm generated catalogs contain no PII column values: profiler withholds them by design, but spot-check `data/safe_lookups_*.json` for anything email-, phone-, or name-shaped.
4. Confirm no lead ids or consumer rows in any file.
5. Only then package/share.

## SOP 6 — Decommission a server

Remove from servers.json (so tooling stops targeting it), but in servers.md move it to a "decommissioned" note with dates rather than deleting — historical analysis will ask which server held what and when. Delete its catalog files only if the historical data will never be referenced.
