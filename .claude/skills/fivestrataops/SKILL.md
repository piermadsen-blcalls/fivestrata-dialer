---
name: fivestrataops
description: "Live FiveStrata business-ops knowledge — the real-time layer over the fivestratadb and callcenterdb skills. Maps every live metrics source: the Master Dashboard (MDB) on SharePoint (daily revenue/media-spend pace, RPL, CPL, DM%, COGS, SPH — Kinsey/Brandon/Alex), the Ops/Data Job Responsibilities Google Sheet (process owners, cadences, training status, guides), BareTel/BT Wholesale usage-charge emails, KB (Kombea) dialer reports (agent SPH/drop rates, hot/qualified leads, congestion, DID), TD hours/invoices/NAs, Reserve DB and CanadaDirect/CD feeds, the weekly CV Dashboard (MP conversion), plus the cost-analysis sheet. Use for ANY FiveStrata business/ops/people/metrics question: current or today's numbers, call-center hours or telecom cost, who owns/runs/is trained on a process (Darwin, Meridius, Maximus, Revive Batches, CTD, dashboards), roles, cadences, onboarding, client sentiment, or where a number comes from. DB-structure questions belong to the other two skills; this one locates live numbers and owners."
---

# FiveStrata Ops — Live Business Metrics, Roles & Cadences (fivestrataops)

This skill is the **real-time business layer** of the FiveStrata skill family:

| skill | covers | freshness model |
|---|---|---|
| **fivestratadb** | prod MySQL structure (`techss_*`) | profiled snapshot; live DB is truth |
| **callcenterdb** | KB/TD VICIdial replica catalogs | replicas are T-1 |
| **meridius** | the daily lead-cap SPROC (Sean's, fully automated) | engine layer; caps land in `client_market_caps` |
| **darwin** | biweekly zip-targeting/pricing pipeline | engine layer, biweekly |
| **fivestrataops** (this) | live ops metrics, owners, cadences, training | **fetch the live doc at question time** |

The core principle: **never answer a metric question from memory or from this skill's text.** This skill stores *where the numbers live and what they mean*; the numbers themselves must be fetched fresh from the source documents each time. Structure changes too (the Master Dashboard is versioned), so treat the reference files here as a map, and trust the live doc where they disagree.

## The live sources

1. **Master Dashboard (MDB)** — Excel workbook on SharePoint, updated **daily** by the ops/data team (Kinsey — manager; Brandon and Alex — analysts; Brandon does the daily update, ~3h/day). Site `FiveStrataCV`, library `Shared Documents/Master Dashboard/`. Today's live file sits in the library root; dailies are filed by month. The product "pulse": MTD revenue, media spend, pace, RPL/CPL/DM%, COGS, call-center hours and transfer metrics. → structure in `references/master_dashboard.md`, retrieval steps in `references/live_fetch.md`.
2. **Ops/Data Job Responsibilities** — Google Sheet (link-viewable; also readable via the Drive connector), the roles/responsibilities/cadence/training source. Tabs: the task-training matrix, `Tasks` (process → product → schedule → notes), `Roles/Responsibilities` (training log), and `alex brandon sean` (per-person assignments with frequency, hrs/week, trainer, training status, guide names). → content map in `references/ops_processes.md`, live CSV endpoints in `references/live_fetch.md`.
3. **Call Center Cost Analysis** — restricted Google Sheet (financial totals): monthly provider-level cost roll-up (Kombea+BareTel blended, TopDial, CanadaDirect) and CV MoM P&L. Structure in `references/cost_analysis.md`; read LIVE via the Google Drive connector (`references/live_fetch.md` §0/§3). Values in chat only — never persisted.
4. **BareTel Daily Usage emails** — automated daily telecom-charge reports (per KB server: cost, minutes, call attempts, ACD, FUSF, account balance) in the FiveStrataTech group mailbox folder `Baretel Daily Usage` (`stratatech@buyerlink.com`). The carrier-cost half of KB call-center cost; labor hours are the MDB Hours tab. → retrieval and field semantics in `references/live_fetch.md` §5.
5. **KB (Kombea/BareTel) report emails** — automated daily/weekly dialer reports per KB server (agent performance SPH/DPH/drop rates + billable hours, hot leads, qualified leads, congestion, DID health) in the FiveStrataTech mailbox. → `references/live_fetch.md` §6.
6. **TD (TopDial) report emails** — human-sent daily non-pause hours, Sunday weekly reports and NA lists, daily invoices (via Jaintel) in the same mailbox. → `references/live_fetch.md` §7.
7. **Reserve DB feeds** — daily reserve-inventory snapshot (CanadaDirect) and per-server reserve dial results (BareTel, VPN-gated links); provenance/freshness checks only. → `references/live_fetch.md` §8.
8. **CD (CanadaDirect) Daily Report** — daily results xlsx from the third call-center partner CanadaDirect (`BuyerLink Daily Report`, record counts in body). → `references/live_fetch.md` §9.
9. **CV Dashboard** — weekly (Monday) 12-month trended media-partner conversion workbook on SharePoint; feeds Pulse Reports and the MP Dashboard. → `references/live_fetch.md` §10.
10. **FiveStrata KPI mailer exports** — automated "CSV ready" notices (MDB Sent-Billable/Returns feeds, Revive Batch stats, Branding Audits, VTRVInventoryData, TD/EIS dashboard exports, DNC voicemails). **Largely silent since ~6/22 — verify before use.** → `references/live_fetch.md` §11.
11. **Dialable Lead Counts** — HOURLY per-server dialer inventory snapshots (fresh/revive active + reserve counts, ZCWL) — the skill's only intraday source. → `references/live_fetch.md` §12.
12. **Command Center** (platform, not a fetchable doc) — the ops web hub behind brand rules, budgets, zips, onboarding, Daily Summary Report, downloadable reports; route data needs to fivestratadb or the user. → `references/live_fetch.md` §13.
13. **FS BL Client Summary** — the client sentiment / account performance tracker (Google Sheet): per-client monthly performance with a hand-set sentiment Status enum (Great/Steady/Pulse Check/At Risk/Paused/Canceled...), MoM revenue, winbacks, rejections, CSM capacity, BD markets. Structure in `references/client_summary.md`; read LIVE via the Google Drive connector — multi-tab, use the xlsx-export-in-subagent path (`references/live_fetch.md` §0/§4). If a question seems to need a source not listed here, ask.

## Data sensitivity — read first

- The MDB's `Sent` and `Rejections` tabs contain **consumer names, phones, addresses**. Never quote lead-level rows into chat or files; aggregate only.
- The MDB process guide (`Tools/Process Guide/Master Dashboard Update 2.0.xlsx`) **embeds portal credentials** — never copy them anywhere, per org policy (no consumer lead data, credentials, passwords, or keys in any output).
- The cost-analysis sheet's financial totals are restricted — report them only in chat when the user has supplied the doc, never into persisted artifacts unless the user says so.

## How to answer

- **"What's today's / this month's <metric>?"** → fetch the current MDB (steps in `references/live_fetch.md`); interpret with `references/master_dashboard.md`. If the workbook can't be read programmatically (it's often too large for Graph text extraction), say so and ask the user to export the relevant tab — don't substitute stale numbers.
- **"How many dialable leads right now / today's inventory?"** → Dialable Lead Counts hourly emails (`references/live_fetch.md` §12) — the only intraday source.
- **"Daily caps / why did client X get N leads today?"** → the **meridius** skill (SPROC math + verification); live values in `techss_dl.client_market_caps`.
- **"Who owns / who runs / what's the cadence of <process>?"** → fetch the live `Tasks` and `alex brandon sean` tabs (CSV endpoints in `references/live_fetch.md`); interpret with `references/ops_processes.md`. Ownership shifts; the live sheet wins over the roster snapshot.
- **"Is <person> trained on <task>? What's the training plan?"** → live `Roles/Responsibilities` and `alex brandon sean` tabs (trainer, date, complete flag, guide name).
- **"What does <term/code/KPI> mean?"** → `references/vocab_map.md` — includes the mapping into fivestratadb/callcenterdb tables so business language joins to data.
- **"Where does <number> come from / how is it built?"** → `references/master_dashboard.md` (input tabs → calc tabs) plus `references/vocab_map.md` for upstream systems.
- **"How's client X doing / sentiment / at-risk clients / winbacks / CSM load?"** → `references/client_summary.md` for the Status enum and tab map; fetch current values live via the Drive connector (`references/live_fetch.md` §0/§4).
- **"Call-center cost / hours / SPH?"** → labor side: Hours tab of the MDB (CallCenter, VT, Date, Hours); telecom side: BareTel Daily Usage emails (`references/live_fetch.md` §5); the restricted cost-analysis sheet needs a user-provided export; dialer-side detail belongs to **callcenterdb**.
- **Cross-DB or cross-source questions** ("tie MDB transfers back to the dialer/prod DB", "reconcile hours/cost/revenue between sources", "which number is right?") → `references/source_crosswalk.md` + `references/date_hygiene.md` first, then `references/vocab_map.md` and the **fivestratadb** / **callcenterdb** skills as needed.

## Date hygiene — non-negotiable for cross-source work

Nearly every source reports YESTERDAY's activity with TODAY's timestamp, and each dates it differently. Before aggregating or comparing across sources, read `references/date_hygiene.md` and bin everything to **traffic date**. When reporting a number, state its date window and lag.

## Reference files

- `references/live_fetch.md` — exact retrieval steps per source (SharePoint search/read, Google CSV endpoints, fallbacks, gotchas). Read before any live fetch.
- `references/master_dashboard.md` — MDB file naming/versioning/folders, every tab, columns, code values, KPI definitions, update workflow.
- `references/ops_processes.md` — team roster, category ownership (Media/Ops/Data/Audit/Legal), process catalog with cadences and purpose notes, training matrix semantics, process-guide names.
- `references/ai_transition.md` — the KomBea ProtoCall AI Level 4 adoption plan (52-week L2→L4 conversion of the KB dialer floor, Teddy-BPO phase-out): the plan-of-record explaining why KB agent hours, Kombea/India labor lines, and EIS hours should trend DOWN through 2026. Planning snapshot (May 2026), not a live-numbers source.
- `references/sharepoint_portal.md` — the FiveStrataCV SharePoint portal map: which branch holds which artifact, lifecycle/archival patterns, naming conventions, sensitive-file flags. Read when locating any file/dashboard/guide on the portal.
- `references/source_crosswalk.md` — which source is authoritative per metric, entity keys (servers, verticals, clients/DBAs), known-unreconcilable pairs, freeform-data inventory, cross-skill sync rules. Read for ANY question touching two or more sources, or client-level joins.
- `references/date_hygiene.md` — per-source date semantics, traffic-date binning rules, tz/DST, dedupe, MTD-window rules. Read before ANY cross-source aggregation or reconciliation.
- `references/cost_analysis.md` — restricted cost sheet structure: provider x month cost-per-hour blocks, CV MoM P&L, how it rolls up the Hours/BT-Wholesale/invoice sources.
- `references/client_summary.md` — FS BL Client Summary structure: 14 tabs, sentiment Status enum, per-client-month blocks, CSM/winback/rejection tabs, snapshot-era quirks.
- `references/vocab_map.md` — business vocabulary ↔ fivestratadb/callcenterdb mapping (VT codes, KB/TD, FS* servers, Meridius, OLeadID, calldispoEXT, KPIs, tool glossary: Darwin, Maximus, Decimus, Bullseye, ROC…).

## Maintenance

When the MDB template version changes (e.g. 37.2 → 38), or team ownership shifts, or source #4 arrives: re-profile the source, update the matching reference file, and note the date. Keep this skill free of metric values, lead rows, credentials, and financial totals — structure and vocabulary only.
