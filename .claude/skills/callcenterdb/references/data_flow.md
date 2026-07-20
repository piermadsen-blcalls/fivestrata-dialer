# Data flow — how replica data reaches the FiveStrata ecosystem

Status as relayed by Brandon (Teams, ~2026-07). Items marked ❓ need confirmation — update this file as answers come in (see `references/metadata_sop.md`).

## Data freshness — the governing rule

Replicas are refreshed **approximately once daily (~2pm PDT per the partner — stated loosely, don't rely on the hour)**. Treat every replica query as up to ~1 day stale. Never frame replica-based answers as real-time. If real-time information is genuinely needed, the path is a request to the partner (particularly Bare/BareTelecom), not the replica.

## TopDial (TD) — connected

- Prod contains full TD ingestion infrastructure: per-vertical mirrors in `techss_reporting` (`TD_<VT>_vicidial_log`, `TD_<VT>_vicidial_agent_log`, `TD_<VT>_dial_logs`, each with `_arc`, for VT in BR, WI, HW, SL, AU), plus `TD_vici_archiving`, `TD_dispos`, `TD_DailyDashboard`/`TD_WeeklyDashboard` views, and a per-vertical source monitor **`techss_reporting.CC_BehindMaster`** (TD WI ← 116.202.196.60; TD BR **and HW** ← 142.132.197.142; TD SL ← 207.188.12.153 — a third TD server, Solar, separate access account, not yet profiled; plus the FS warehouse on RDS, secondsBehind=0).
- **BUT the pipeline appears DORMANT (checked 2026-07-08): all TD_* tables — live and _arc, every vertical — show 0 rows / NULL update_time; CC_BehindMaster secondsBehind is NULL for all TD rows; `information_schema.events` is empty (no in-DB scheduler — loader would be app-level cron).** Practical rule: do not expect TD call data in prod today; go to the TD replicas (T-1) or partner reports. Confirm emptiness cheaply with `SELECT 1 FROM techss_reporting.TD_BR_vicidial_log_arc LIMIT 1;` (InnoDB estimates can read 0 on non-empty tables). `_shane` suffixed copies are ad-hoc analyst tables. Mechanism deliberately unexamined (black box, per Sean 2026-07-08). Believed owner: **Joseph or Cromwell**.
- Likely landing zones to check in the prod DB (fivestratadb skill): `techss_dl` dialer/staging logs, `techss_phone_system` call facts, `techss_all_leads` call-center/transfer data, `techss_call_center_data`. ❓ Unverified — ask Joseph/Cromwell or trace by table timestamps.

## BareTel (KB) — NOT connected

- The 5 KB replicas have **no automated connection** to our ecosystem.
- Historically, KB data arrived as **emailed pulls prepared by BareTel** — meaning historical KB data inside our systems came pre-filtered/pre-aggregated by them.
- Brandon requested direct replica access specifically to gain flexibility for analysis. So any newer KB data in our hands comes from **manual pulls** against these replicas.
- Manual/CSV partner data lands in prod through the CSV import pipeline: `techss_log.csv_files` / `csv_rows` → per-lead outcomes in **`techss_log.call_center_import_logs`** (keyed by `call_center`, `OLeadID`, `vertical`, `outcome`, `reason`, `csv_file_id`) — confirmed by DESCRIBE 2026-07-08. This is where to audit what actually made it in from a pull.
- Implication for analysis: KB numbers in prod techss_ tables and KB numbers pulled live from replicas may disagree in coverage and definitions. When reconciling, state which source you used.

## Prod-side landing tables (partially confirmed)

The fivestratadb catalog shows per-vertical VICI mirror tables in prod: `techss_reporting.TD_BR_vicidial_log`, `TD_BR_vicidial_agent_log`, `TD_BR_dial_logs` (parallel sets for other verticals), plus `techss_dl.callcenter_API_log`, `callcenter_API_setup`, `callcenter_dispos`, and `techss_reporting.CC_dispos` for disposition decoding. This is very likely where the TD sync lands. ❓ Still confirm mechanism/cadence with Joseph/Cromwell.

## Partner-originated reporting (the omnichannel layer)

Independent of DB access, partners push reporting by email — often the fastest existing answer to "how did yesterday go":

- **BareTelecom automated report series** (from noreply@baretelecom.com to reporting@fivestrata.com + stratatech@buyerlink.com; rule-filed into per-series folders in the stratatech mailbox). Subject prefix `<SERVER> - FS <SITE> - ...` with tokens FSBR/FSBRV/FSHW/FSWR/**FSWF** (see servers.md on FSWF/FSWN). Series and cadences (weekdays' traffic only — Friday arrives Saturday, nothing Sun/Mon — EXCEPT the 7-day BT Wholesale billing series): daily agent report (current subject **"New Daily Report Format"** since ~Apr 2026, older mail says "Daily Report"; SPH/S/C%/DPH/Contact/Complete per hour split OVERALL/FRESH/REVIVE, estimated billable hours, daily+30-day drop rates, call-level CSV attachment), daily Qualified Leads CSV (OLeadID/phone), daily Hot Leads CSV, same-day Dialer Congestion rate, weekly DID xlsx (Sundays), daily reserve results links (VPN-gated), and the daily "BT Wholesale - daily usage report" (telecom cost/minutes/FUSF, 7 days/week).
- **TopDial emails DO exist** (correcting an earlier search miss): daily "Daily Topdial Non-Pause Hours" from richardg@topdialinc.com (weekdays; Thu+Fri can both arrive Monday), Sunday "Weekly_Report_{BR|WI}-{FR|RV} TD" + "Weekly NAs" zips from vicd@topdialinc.com (4/week not guaranteed), and daily "TopDial Invoice" PDFs from clarisse@jaintel.com (Jaintel = TD's billing intermediary). TD is thus BOTH email-reported and replica-connected.
- **CanadaDirect** — from clientservices@canadadirect.ca to stratatech@buyerlink.com: "BuyerLink Daily Report" (Tue–Sat, `DailyReport_YYYY-MM-DD.xlsx`, record count in body), "BuyerLink Reserve Report" (daily incl. weekends), and Monday weeklies "BuyerLink Weekly Report" (~35k records) + "BuyerLink Weekly User Report" (~4k records). The non-VICI partner's channel.
- Key ingest mailboxes: **reporting@fivestrata.com** and **stratatech@buyerlink.com**. When asked "do we already get X from a partner," check these before proposing a new pull.
- **The fivestrataops skill is the authority on this email layer** — retrieval steps, per-series field semantics, date binning (traffic-date rules), and the cross-source authority table live there. Use it together with this skill for any hours/cost reconciliation.

## Structural leverage

Both call centers run **VICIdial**, so the schema is essentially identical across all 7 servers — the same extraction query generally works everywhere (Brandon relies on this for manual pulls). Differences live in campaigns, lists, custom statuses, and any site-local tables — exactly what the per-server catalog deltas in `references/catalogs/` capture.

## Ownership map

| area | owner |
|---|---|
| TD connection/sync | Joseph or Cromwell ❓ (confirm which) |
| KB replica access, manual pulls | Brandon (and now Sean) |
| KB stack | Kombea = dialing software; BareTel = underlying carrier tech (confirmed Sean 2026-07-08) |
| Historical KB email pulls | BareTel staff |

## Open questions checklist

1. ~~TD pipeline history~~ CLOSED by decision (Sean, 2026-07-08): the TD pipeline mechanism is treated as a black box — do not investigate further. The operative facts stand on their own: TD_* prod tables are empty, the monitor is silent, and analysis must source TD data from the replicas (T-1) or partner reports, never from prod TD_* tables without checking them first. Reopen only if someone claims prod holds current TD data or the pipeline visibly springs to life.
2. ~~Full vs filtered~~ CLOSED with #1 (black-box decision): moot while the prod TD_* tables are empty; if the pipeline ever produces data, compare same-day counts against the replica before trusting coverage.
3. ~~Retention~~ ANSWERED (Chris Bare, Teams 2026-07): data is NOT kept in the dialer long ("they get slow") — expect archive tables (`vicidial_log_archive`, `call_log_archive`, per-list `custom_*_archive`) and a limited live window. Check `MIN(call_date)` per server before promising historical pulls.
4. ~~Replica lag~~ ANSWERED (partner statement, 2026-07): once-daily copy, nominally ~2pm PDT but loosely held. Treat as T-1 data. `CC_BehindMaster.secondsBehind` is NULL for TD rows, so don't trust the monitor for lag either — verify with MAX(call_date) when it matters.
5. ❓ Should KB get an automated ingestion path like TD's? (Decision, not fact.)
