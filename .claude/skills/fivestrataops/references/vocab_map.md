# Business vocabulary ↔ database mapping

Bridges the ops/business language of the live docs to the **fivestratadb** (`techss_*` prod MySQL) and **callcenterdb** (KB/TD VICIdial replicas) skills. Open those skills for table-level detail.

## Verticals & product

| business term | meaning | DB mapping |
|---|---|---|
| VT / VTO | vertical (type) | `techss_dl.client_vertical` (vt_desc lookups in fivestratadb safe_lookups) |
| BR / WI / HW / SL / HS | bathroom remodel / windows / home warranty / solar / home security | same lookup; callcenterdb maps business lines to replica servers |
| Fresh (F/FR suffix: HWF, WIFR, BRF) | newly purchased leads | vs **Revive** — re-marketed leads (`techss_RV`, `techss_RIB`, revivedLeadsBatches) |
| CV | the lead-revival product line (FiveStrataCV site, CV dashboards) | spans techss_ schemas; "CV" prefixes most ops dashboards |
| MDB | Master Dashboard workbook | see master_dashboard.md |

## Call centers & dialer

| business term | meaning | DB mapping |
|---|---|---|
| KB | Kombea — the dialer SOFTWARE; BareTel is the CARRIER underneath | callcenterdb: 5 replicas fsbr, fsbrv, fshw, fswn, fswr (manual pulls; NOT connected to prod) |
| CD / CanadaDirect | third call-center partner (BuyerLink Daily Report, Reserve Report) | not yet in callcenterdb; flag for onboarding via its metadata_sop |
| Jaintel | TopDial's billing intermediary (daily TD invoices) | invoices in FiveStrataTech mailbox |
| SPH / DPH / S/C% / Contact-Complete per Hr | KB agent-report metrics (sales, dials, sales-per-contact per hour) | derive from vicidial_log/vicidial_agent_log on replicas |
| Drop rate | abandoned-call % (daily + 30-day avg in KB agent reports; compliance metric) | vicidial_log status decode |
| NA / NA Test Batch | no-answer leads; TD NAs re-sent to KB weekly | Weekly NAs zips (TD); dispo decode tables |
| TD | TopDial call center | callcenterdb: 2 replicas (bathroom, windows); prod TD_* mirrors in `techss_reporting` were EMPTY as of 2026-07-08 — verify before use |
| FSWR/FSWF/FSBR/FSBRV/FSHW | dialer hours-report prefixes (per server/line) | match to callcenterdb server registry; FSWF unconfirmed (see open questions) |
| Hours tab (CallCenter, VT, Date, Hours) | dialed hours per center/vertical | dialer side: `vicidial_agent_log` non-pause time (wait+talk+dispo) on the replicas — AND its `_archive` twin: older days roll into vicidial_agent_log_archive, so week-spanning verification must UNION both (the "Monday problem") |
| SPH | sales per hour by vertical | sales from MDB vs Hours tab |
| NA Test Batch | leads dispositioned NA at TD, re-sent to KB | dispositions decode via `techss_dl.callcenter_dispos` / `techss_reporting.CC_dispos` |
| calldispoEXT | extended call disposition on Sent tab; drives transfer attempts/successes/declines | same dispo decode tables; "Unknown" = missing |
| DID report (Baretel) | DID phone-number performance report | dialer DID tables on KB replicas (callcenterdb) |
| BT Wholesale / Baretel Daily Usage | daily carrier-cost report per KB server (cost, minutes, ACD, attempts, FUSF, balance) | emails in FiveStrataTech mailbox (live_fetch.md §5); servers = callcenterdb KB replicas; ACD/attempts tie to `vicidial_log` |
| FUSF | Federal Universal Service Fund surcharge on the BareTel bill | line item in the daily usage emails |

## Leads & pipeline

| business term | meaning | DB mapping |
|---|---|---|
| OLeadID | cross-system lead key (appears on Rejections tab) | ties to `vicidial_list.vendor_lead_code` on dialers; import logs key on it (`techss_log.call_center_import_logs`) |
| Meridius | the daily lead-cap engine: `sp_meridius_newcaps` in `techss_dwh`, fired by `ev_meridius_caps` at 06:00 MST, writes `techss_dwh.meridius` → DBA push → `techss_dl.client_market_caps` (what call centers route against). Fully automated, no human in the loop, owned by Sean; the xlsb workbook is RETIRED | **dedicated `meridius` skill** — math, edits A–M, troubleshooting, verification. The ops sheet's "Meridius Tool" daily task predates automation — treat its 3h/day estimate as historical |
| Sent / billable | leads delivered to clients and billable | Meridius/`techss_dwh`; distribution logic in `techss_dl` |
| Returns | client-returned leads | `techss_wv` return scripts; MDB Returns tab |
| Rejections | media-side rejects from LeadConduit | `techss_all_leads.leadConduitData`; MDB Rejections tab |
| LeadConduit | lead-validation SaaS in the intake path | leadConduit* tables in `techss_all_leads` |
| DNC | do-not-call adds & FTC lists (Legal + Alex) | `techss_all_leads.dncDate` (~256M rows) |
| Intake MTD | emailed report of leads purchased | feeds MDB Records tab |
| Active Zip list / client zip changes | client ZIP coverage maintenance (Command Center) | `techss_dl` ZIP distribution & bidding tables |
| Branding / Zip Branding | assigning brand identity per ZIP for outbound | `techss_dl` branding-related tables; Zip Branding Tool |
| Command Center | the FiveStrata ops web hub: command-center.fivestrata.com (new, AWS ECS), legacy techsolarsolutions.com/Dashboard; brand rules, budgets, zips, onboarding, Daily Summary Report, downloadable reports | live_fetch.md §13; backed by api.fivestrata.com over `techss_*` (fivestratadb) |

## Internal tools (media/ops optimization)

| tool | what it does |
|---|---|
| Darwin / Mini Darwin | fresh-lead ZIP targeting/pricing pipeline (Tiers, GenericZips); throttled using Reserve Dashboard data — **dedicated `darwin` skill** (biweekly, MySQL darwin_poc rebuild) |
| Bullseye | ZIP targeting component within the Darwin workflow |
| Maximus | max-attempts dialing policy tool (quarterly) |
| Decimus | (paused) dialing/lead-decay tool |
| Revive Optimal Calculator (ROC) | picks which leads/areas to revive or pause, from Reserve Dashboard + Meridius data |
| Reserve Dashboard | fresh/RV supply view: throttles Darwin, client ZIP analysis, ROC input |
| CTD Report | weekly COGS + lead detail for accepted/rejected (CTD = Connecting the D…, also an SC seller code) |
| CV Dashboard | 12-month trended CV media-partner conversion; feeds MP Dashboard & Pulse Reports |
| Pulse Reports | media-partner performance snapshots for optimization |
| Mix Model | channel/mix analysis (Kinsey-trained) |

## KPI shorthand

RPL = revenue per lead · CPL = cost per lead · DM% = direct margin percent · COGS = call-center + media cost of goods · MTD Revenue/Media Spend & Pace = month-to-date actuals and run-rate · mCost = media cost per Records row · SentLeads/Accepted = distribution counts on Records tab.

## Open questions

- FSWF appears as a live Windows KB server token in report subjects (FSWN only in BT Wholesale usage series) — reconcile with callcenterdb server registry (fswn vs fswf) and update both skills.
- "Appointment Data" & "Appt Agent/Dialing Metrics" (Tavish, daily) — source system not yet profiled; likely relates to `techss_phone_system`/appointment flows. Confirm before mapping.
