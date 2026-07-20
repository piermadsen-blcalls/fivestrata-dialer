# Source crosswalk — entities, overlaps, authority & reconciliation

The 9 sources deliberately overlap. This file says which source wins for which question, how entities join across sources, and where reconciliation is expected to fail. Read together with `date_hygiene.md` (traffic-date binning comes FIRST, always).

## Entity resolution — canonical keys live in prod, sheets carry display labels

- **Leads:** `OLeadID` is the universal key (Rejections exports, KB Qualified Leads CSVs, `techss_log.call_center_import_logs`, dialer `vicidial_list.vendor_lead_code`). Lead-level joins are solid.
- **Clients: the weakest axis.** Sheets carry hand-typed display names/DBAs; prod (`techss_dl`) uses numeric client ids (the MDB cleaning rule "drop client 609" shows ids circulate); KB CSVs carry `WTClient`. **No name↔id mapping is documented anywhere — resolve via Command Center when it matters.** Cross-TAB name joins inside FS BL Client Summary need normalization: lowercase; "&"→"and"; strip punctuation, legal suffixes (Inc/LLC), vertical tails ("- WI", "- BR"), and parenthetical legal names; ~9% of names still vary between tabs after that (casing, spacing, "WeatherTECHS"-style branding). Never assume two spellings are two clients, or one.
- **Servers:** email subject tokens FSBR/FSBRV/FSHW/FSWR map 1:1 to callcenterdb replicas fsbr/fsbrv/fshw/fswr. **Windows: CONFIRMED (live check 2026-07-13) that FSWF appears in ALL KB report subjects and FSWN ONLY in BT Wholesale billing.** Most likely one windows-fresh box with two labels, but callcenterdb's registry still lists fswn+fswr only — the fswf/fswn identity question stays open until confirmed with Brandon (BareTel liaison) and callcenterdb servers.md is updated. Say "windows fresh (FSWF/fswn naming unresolved)" in answers that depend on it.
- **Verticals — normalization table (one row per {VT, fresh|revive}):**

| VT | MDB Hours suffix | KB SITE token | TD token | campaign | notes |
|---|---|---|---|---|---|
| BR | BR (revive) / BRF, BRFR (fresh) | BATHREMOD | BR-RV / BR-FR | BathRemo (+BREIS at TD) | |
| WI | WI / WIFR | WINDOWS | WI-RV / WI-FR | Window, WI5S | server split unresolved (above) |
| HW | HW / HWF | HOMEWARRANTY | — | HomeWrty, HWFresh | KB replica side doesn't split HW fresh/revive |
| SL | SL | — | Solar lines in TD hours email | — | |
| HS | seen in MDB row data only | — | — | — | unmapped client-side |
| RF | **absent from MDB VT list** | — | RF sections in TD/client summary | — | live in Client Summary + `techss_dl` lookups; open question |

  Client Summary's own **Taxonomy Mapping tab** bridges its section names — use it when working inside that sheet. `techss_dl.client_vertical` is the canonical list (fivestratadb).
- **Call centers:** KB (Kombea software / BareTel carrier), TD (TopDial, invoiced via Jaintel), CD (CanadaDirect — reports only, no replicas, not in callcenterdb yet), plus cost-sheet-only labels "India" and "EIS at TD" (relationship unconfirmed — open question). MDB Hours `CallCenter` enum is documented as TD/KB only; **where CD hours land is unmapped** — though the CD daily report carries `Seconds` per source/state (SharePoint copy), so CD dialing time IS measurable. Records-tab `C0` values "CD, KB" probably encode the call center — unconfirmed.
- **Providers/aliases:** Kombea=KB · Top Dial=TopDial=TD · Canada Direct=CD · BareTel=BT=carrier · BT Wholesale=BareTel's billing platform. Cost sheet spells these its own way ("Top Dial", "Canada Direct"); match loosely.

## Authoritative source per metric

| metric | daily-ops answer | finance-actual answer | lead-level truth | independent verification |
|---|---|---|---|---|
| KB hours | MDB Hours tab | cost-analysis Kombea Hours (monthly) | — | replicas `vicidial_agent_log` UNION `_archive` (non-pause) |
| TD hours | Richard's daily email → MDB Hours | cost-analysis Top Dial Hours | — | TD replicas |
| Telecom cost | BT Wholesale emails (§5) | inside cost-analysis Kombea block (BLENDED) | — | minutes co-move with agent-report volumes |
| CC cost / COGS | MDB Financials (rate-based ESTIMATE) | **cost-analysis (invoice actuals)** + `Accounting/FINAL COGS - 2026.xlsx` (finance true-up); revenue actuals: `NS Final Revenue 2026.xlsx` (NetSuite) | — | BT emails + Jaintel invoices |
| Revenue | MDB Generals MTD/pace | cost-analysis CV-MoM row | Meridius (`techss_dwh`) | Client Summary MoM (per client) |
| Rejections | MDB Rejections tab (cleaned) | — | `techss_all_leads.leadConduitData` | Client Summary Monthly Rejections (cleaning rules may differ) |
| Sent/transfers | MDB Sent `calldispoEXT` | — | Meridius / `techss_dwh` | VICI closer/xfer logs |
| MP conversion % | CV Dashboard (weekly build) | — | Meridius/`techss_dwh` sent-transfer data | Pulse Reports quote it downstream |
| Client sentiment | FS BL Client Summary Status (ONLY source) | — | — | as-of-edit, not timestamped |
| Drop rate | KB agent reports (daily + 30-day) | — | — | `vicidial_log` status decode |
| Reserve counts | CD Reserve email Record Count (provenance) | — | replicas/prod | Reserve Dashboard |
| Dialable/active lead inventory (intraday) | Dialable Lead Counts hourly emails (§12) — ONLY intraday source | — | replicas (T-1) can't confirm same-day | ZCWL count sanity vs active zip list |
| Daily lead caps | `techss_dl.client_market_caps` (live) | — | `techss_dwh.meridius` (runDate history) | **meridius skill** — math/verification queries |

## Known-unreconcilable pairs — do not force

- **BT Wholesale minutes vs agent hours:** carrier talk-minutes ≠ agent non-pause hours. Sanity co-movement only.
- **KB "Cost per Hour" (cost sheet) vs any labor rate:** the Kombea block blends labor + telecom (+ India); not comparable to the MDB's ~$7/hr labor lookup.
- **KB-report SPH vs MDB SPH:** numerators differ (dialer-flagged sale vs billable sent lead); the relationship is undocumented — present both, labeled.
- **MDB COGS vs cost-analysis actuals:** rate-estimate vs invoice; ops itself says these diverge materially. Expected, not an error.
- **Rejection counts MDB vs Client Summary:** MDB cleaning drops blank OLeadID/Postal/Client, client 609, "Invalid Zip Code" reasons; Client Summary's cleaning is unverified.
- **TD/EIS hours vs MDB:** an ops project ("Match TD/EIS hours to MDB") exists precisely because these don't reconcile yet.

## Non-standard data inventory (parse defensively)

- **Freeform columns:** ops sheet Tasks.Notes (multi-line, Slack/Confluence refs); Client Summary Winback.Notes, Rejections.Reason (concatenated, up to ~1200 chars), price-increase Outreach/Outcome; cost sheet S/U-column agenda annotations; KB/TD email bodies vary by era ("New Daily Report Format" vs older "Daily Report").
- **Enum drift:** Client Summary sentiment Status has 9 documented values PLUS stray in-block header rows ('Status'), 'BD', cap-strings ('25/week'); the SECOND status column is free text (~32 distinct values incl. 'Cancelled' vs 'Canceled'). Filter repeated header rows when aggregating stacked month blocks.
- **Label drift:** month headers mix "Jun/June/Sept"; person names lowercase in some ops-sheet tabs; task names vary across tabs ("Zip Branding" vs "Zip Branding Tool", "DNC Phone #s" vs "Add #s to DNC", trailing-space "CTD Report "); typo'd sheet title "Responsibilties"; MoM Revenue corrupted header years (trust column order).
- **Scratch content:** cost sheet Sheet5 (URL/domain lists — unrelated to cost); Client Summary Sheet22. Ignore for metrics.
- **Same-fact-three-tabs:** the ops sheet's matrix, Roles/Responsibilities, and per-person tabs restate the task inventory with independently maintained flags — always NAME THE TAB a fact came from; the per-person tab is richest and usually most current.

## Cross-skill sync obligations

- Server/token changes (the FSWF episode) must update BOTH this skill and callcenterdb `references/servers.md`.
- CanadaDirect onboarding → callcenterdb `metadata_sop.md`; until then CD facts live only here.
- Verifying cost-analysis hours rows → callcenterdb query_cookbook (agent_log + archive). Client-entity resolution → fivestratadb `techss_dl`.
- Cap/routing questions → the **meridius** skill; zip-targeting/pricing → the **darwin** skill. Both are siblings of this skill with their own reference trees.
- Subject-pattern drift ("Daily Report" → "New Daily Report Format") should be corrected in callcenterdb `data_flow.md` too.
