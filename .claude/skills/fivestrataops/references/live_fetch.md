# Live retrieval steps per source

Read this before fetching anything. All fetches are read-only. Never persist consumer PII, credentials, or restricted financial totals from these sources.

## 0. Google Drive connector — primary path for all Google Sheets (verified 2026-07-13)

The org's Google Drive connector (tools: `search_files`, `get_file_metadata`, `read_file_content`, `download_file_content`) reaches all three Google Sheets, including the two restricted ones. Behavior learned by testing — follow this decision table:

| need | tool | behavior/caveats |
|---|---|---|
| freshness check ("is it current?") | `get_file_metadata` | returns `modifiedTime` — cheap, do this first |
| one specific tab, link-viewable sheet | gviz CSV endpoint (§2) | still the only method that selects a tab BY NAME |
| quick look, small/single-tab sheet | `read_file_content` | returns exactly ONE tab as a pipe-table — unlabeled, apparently the last-active tab, no truncation warning. ALWAYS verify which tab you got by matching headers against the reference file before answering. Merged cells render as `[merged]` |
| first tab as data | `download_file_content` with `exportMimeType: text/csv` | base64 CSV of the FIRST tab only |
| full multi-tab workbook | `download_file_content` with `exportMimeType: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | base64 xlsx → decode in the sandbox → parse with openpyxl → **delete the decoded file when done**. Large results spill to a persisted tool-result file rather than inline — expect to decode from that file. For big or PII-bearing sheets (FS BL Client Summary), do this inside a SUBAGENT so lead rows and client financials stay out of the main context. Hidden tabs ARE included in the export |

Sheet registry: Ops/Data Job Responsibilities `1xDauBAP117yRCSREwGLgA3-H3edlUYUnfKZCUpoWjZ0` · Call Center Cost Analysis `1nFIm6zW3QQLMfkEyxCIWyrcDksUn7OWhDg8ZgLsVAj8` · FS BL Client Summary `1ZSSHTBEOaNVpEd0gDeEWRNbQYmMQEV5DGd7IwLHH1uY`.

## 1. Master Dashboard (SharePoint, via Microsoft 365 connector)

**Finding today's file.** File naming: `Master Dashboard - <template version> - <M.D.YYYY>.xlsx` (version currently 37.2; same-day re-saves get ` - 1`, ` - 2` suffixes (space-dash-space); month-end finals are `Master Dashboard - <version> - <MonthName> Final.xlsx`).

Folder layout (site `FiveStrataCV`, library `Shared Documents/Master Dashboard/`):

| location | contents |
|---|---|
| `Master Dashboard/` (root) | today's live working file |
| `Master Dashboard/<Month>/` | current month's dailies |
| `Master Dashboard/Archive/<Month>/` | prior months' dailies |
| `Master Dashboard/Archive/Month Finals/` (+ `/<YYYY>/`) | month-final snapshots |

Steps:
1. `sharepoint_search` with query `"Master Dashboard <version> <M.D.YYYY>"` (today's date), fileType `xlsx`. If nothing, search `"Master Dashboard"` sorted by recency and take the newest non-archive hit; the root-folder file is the live one.
2. `read_resource` on the returned `file:///...` URI.

**Known gotcha:** recent dashboard files are usually **too large for Graph text extraction** (HTTP 406). The search-index snippet only exposes the first sheet's header. When read_resource fails or truncates, two honest fallbacks, in order:
1. **Teams**: Brandon posts a daily "MDB updated" headline in Teams with the top-line pace numbers (revenue vs goal, day-over-day) — `chat_message_search` for recent "MDB" posts. Kinsey's follow-ups often add context. These ARE the MDB's published output, so quoting them is sourced, not stale.
2. Ask the user to export the relevant tab. Never fall back to an older archive file for a "current" metric.

Related retrieval aids: the FiveStrataTech mailbox has an "MDB reports" folder archiving the emailed inputs (the "Master Dashboard Sent - Billable" and "Intake MTD" reports); the daily-update SOP is also captured step-by-step in `MDB_Master_Dashboard_Checklist.xlsx` (SharePoint Tools).

**Companion doc:** update SOP lives at `Shared Documents/Tools/Process Guide/Master Dashboard Update 2.0.xlsx` (WARNING: embeds portal credentials — never copy them) and video `Master Dashboard Guide - Daily Update.mp4`.

## 2. Ops/Data Job Responsibilities (Google Sheet — live CSV endpoints)

Spreadsheet ID: `1xDauBAP117yRCSREwGLgA3-H3edlUYUnfKZCUpoWjZ0` (link-viewable). Each fetch returns the sheet **as it is right now** — this is live, not a snapshot.

Endpoint pattern (use web_fetch):

```
https://docs.google.com/spreadsheets/d/1xDauBAP117yRCSREwGLgA3-H3edlUYUnfKZCUpoWjZ0/gviz/tq?tqx=out:csv&sheet=<TAB NAME URL-ENCODED>
```

Known tabs (verified 2026-07-08):
- default/first tab — task-training matrix (Media/Ops/Data/Audit/Legal columns, task + TRUE/FALSE flag)
- `Tasks` — process | product | schedule | notes (the cadence catalog)
- `Roles/Responsibilities` (encode as `Roles%2FResponsibilities`) — training log per person/section
- `alex brandon sean` (encode spaces as `%20`) — per-person assignments: task | frequency | hrs-week | trained by | date | training complete | training guide | process guide file

**Critical gotcha:** the gviz endpoint **silently returns the FIRST tab when the sheet name doesn't match**. Always sanity-check the returned header row against the expected tab structure above; if it looks like the training matrix when you asked for something else, the tab name is wrong (tabs may have been renamed — ask the user).

Browser access to docs.google.com is blocked by org policy for the Chrome extension. The Drive connector (§0) also reads this sheet, but the gviz endpoints remain preferred here because they select tabs by name.

## 3. Call Center Cost Analysis (Google Sheet — RESTRICTED)

Spreadsheet ID: `1nFIm6zW3QQLMfkEyxCIWyrcDksUn7OWhDg8ZgLsVAj8`. Not link-shared (financial totals) — **read it LIVE via the Drive connector (§0)**; verified working 2026-07-13, and the live CC Analysis 2026 tab matches `references/cost_analysis.md`. The main 2026 tab is what `read_file_content` and CSV export return; the 2025 tab needs the xlsx export path. Values are restricted financials: report in chat only, never persist into files or skills. Cadence is ~monthly hand-keying (constants typed into formulas — provenance unauditable); ALWAYS cite it "as of <modifiedTime>" via get_file_metadata, never as live daily data.

## 4. FS BL Client Summary — client sentiment / account performance (LIVE via Drive connector)

Spreadsheet ID: `1ZSSHTBEOaNVpEd0gDeEWRNbQYmMQEV5DGd7IwLHH1uY` (primary tab gid `340279026`). Account-based access only (anonymous CSV endpoints return empty) — **read it LIVE via the Drive connector (§0)**, verified 2026-07-13. It is large and multi-tab: `read_file_content` returns a single arbitrary tab (Winback Opportunities, at last check), so for Client Performance / MoM Revenue / Rejections use the xlsx export path in a subagent. **Structure IS documented** — profiled 2026-07-11 from a snapshot: see `references/client_summary.md` (14 tabs: per-client-per-month performance + sentiment Status enum, MoM Revenue, Winbacks, Monthly Rejections, CSM assignments/capacity, BD Markets, and hidden SF Updater/automation tabs). Known snapshot-era quirks to re-verify live: Salesforce auto-refresh failing since ~2026-06-23; MoM Revenue month headers carry corrupted years (trust column order); Winback status encoded in cell fill color; Monthly Rejections tab contains consumer PII — never echo rows.

## 5. BareTel Daily Usage emails (telecom charges — via Microsoft 365 connector)

The "Baretel Daily Usage" folder in the **FiveStrataTech group mailbox (`StrataTech@buyerlink.com`)** holds automated daily carrier-cost reports from `noreply@baretelecom.com`, one per KB dialer server, arriving ~08:15 UTC (~1:15am PT):

- Subject pattern: `BT Wholesale - daily usage report for <SERVER>`, SERVER ∈ FSBR, FSBRV, FSHW, FSWN, FSWR (exactly the 5 KB replicas in callcenterdb).
- Body fields (HTML paragraphs, one value each): Current account balance · last-24h Cost · Average call duration (ACD, seconds) · Total call attempts · Successful call attempts · Connection charges (per attempt / per successful call) · FUSF charge · Minutes.

Retrieval:
```
outlook_email_search:
  mailboxOwnerEmail: stratatech@buyerlink.com
  folderName: Baretel Daily Usage
  limit/offset or afterDateTime as needed
```
then `read_resource` each message URI (keep the `?owner=stratatech%40buyerlink.com` suffix) and parse the fields above from the HTML body.

Notes: this is the **telecom/carrier cost** of KB dialing (per-minute wholesale + FUSF), distinct from the **hourly labor cost** captured in the MDB Hours tab — a full KB cost picture needs both. The same group mailbox also has sibling folders worth knowing: KB Hours Reports, KB Daily Agent Reports, KB DID, KB Dialer Congestion, MDB reports, CD Daily Report, Dialable lead counts, Reserve DB, Revive Batches. Account balance and charge values are financial data: report them in chat, do not persist into files/skills.

## 6. KB (Kombea/BareTel) report emails — via Microsoft 365 connector

KB = Kombea, the dialing software running on BareTel (the carrier). All reports are machine-generated by `noreply@baretelecom.com` and filed into per-series folders in the FiveStrataTech mailbox (`stratatech@buyerlink.com`). Subject prefix: `<SERVER> - FS <SITE> - ...` with SERVER ∈ FSBR, FSBRV (BATHREMOD), FSHW (HOMEWARRANTY), FSWR, FSWF (WINDOWS). Note **FSWF** is a live Windows server token in these subjects; FSWN appears only in the BT Wholesale usage series.

| series (folder) | subject pattern | cadence (UTC) | payload |
|---|---|---|---|
| KB Daily Agent Reports | `<SERVER> - FS <SITE> - New Daily Report Format - YYYY-MM-DD` | daily ~08:30, prior day | HTML "Summary Results": rows OVERALL/FRESH/REVIVE x cols SPH, S/C%, DPH, Contact/Hr, Complete/Hr; Estimated Billable Hours; DROP RATES (daily + 30-day avg). CSV attachment = call-level detail (PII) |
| KB Daily Hot Leads | `... Daily HOT LEADS Report - YYYY-MM-DD` | daily ~11:30 | small CSV of agent-flagged hot leads (PII) |
| KB Daily Qualified Leads | `... Daily Qualified Leads - YYYY-MM-DD` | daily ~10:00 | CSV cols: OLeadID, PhoneNumer (typo literal), Created, Status, WTClient, PostURL (PII) |
| KB Dialer Congestion Reports | `... Dialer Congestion Report - YYYY-MM-DD ` (trailing space) | daily ~23:15 same-day | HTML: CONGESTION ALERT + `CARRIER CONGESTION RATE: <decimal>` (no PII) |
| KB DID | `... Direct Inward Dialing Report(DID) - YYYY-MM-DD` | weekly, Sundays | xlsx DID inventory/health (likely PII) |
| KB Hours Reports | `BT Wholesale - daily usage report for <SERVER>` | daily ~08:15 | see §5 (telecom charges; covers 6 tokens incl. FSWN) |

**Weekend cadence (verified 2026-07-13):** all KB per-day report series (agent, qualified, hot leads, reserve) SKIP weekends — Friday traffic arrives Saturday, nothing Sun/Mon, next edition Tuesday-morning-for-Monday. The BT Wholesale usage series (§5) runs 7 days/week. Congestion reports are same-day but occasionally miss a server. Don't diagnose a "gap" before checking the day of week.

**BareTel Sunday weeklies** (to reporting@fivestrata.com, per server): `<SERVER> - <LINE> - Weekly User Report - YYYY-MM-DD` and `Weekly List Report` / `Weekly List Report NEW` — the List Reports link to multi-part CSVs at `fs-reporting.baretechs.com/<server>-arc/` (VPN-gated, like §8). **Disambiguation:** BareTel's "Weekly User Report" (Sundays, per KB server) is a DIFFERENT artifact from CanadaDirect's "BuyerLink Weekly User Report" (Mondays, §9) — never conflate them.

**Connector gotchas (hard-won):** `folderName` lookup FAILS for these nested folders — search instead with `mailboxOwnerEmail: stratatech@buyerlink.com` + free-text `query` (subject fragment), paging by `nextCursor`. `mail:///folders/` IGNORES the owner param and silently lists your own mailbox — don't trust it for shared mailboxes. `read_resource` on `mail:///messages/...?owner=stratatech%40buyerlink.com` works. Attachment URIs return raw CSV **containing consumer lead PII — never echo rows**; use the HTML body aggregates for metrics.

**Strategic context for KB trends:** the "Internal Use: FiveStrata AI Transition" Google Sheet (`13DCdrxjCvs1Muuwx__eSOvKjjIzzmTOiu5YIZ0GWs7k`, Kinsey, May 2026) plans a 52-week conversion of this dialer floor to KomBea ProtoCall AI L4 — see `references/ai_transition.md`. Expect KB agent-report volumes/hours to decline by design, not by breakage. Ashley's copy (`18yjxQfX...`) is a stale scenario duplicate — do not re-profile.

## 7. TD (TopDial) report emails — via Microsoft 365 connector

TopDial reporting is **human-sent by TD staff** (contrast KB's automation), same mailbox:

| family | sender | subject pattern | cadence | payload |
|---|---|---|---|---|
| Daily Non-Pause Hours | richardg@topdialinc.com | `Daily Topdial Non-Pause Hours <Month DD, YYYY>` | weekdays, covers prior business day | HTML per-campaign hours `HH:MM:SS` or `NO DIAL`: Solar, Home Warranty (+voice/-EIS/Fresh), WINDOW RV/Fresh, WI-WI5S, Bath Remo (+VOICE/Fresh/EIS); inline PNGs named `WI-RV`, `WI-FR`, `BR-RV`, `BR-FR MM-DD.png` |
| Weekly Reports | vicd@topdialinc.com | `Weekly_Report_{BR|WI}-{FR|RV} TD MM-DD` (4/week) | Sunday evenings | zip attachment ~850KB |
| Weekly NAs | vicd@topdialinc.com | `Weekly NAs MM-DD` | Sunday evenings | zip of no-answer lead lists (PII) — feeds the "NA Test - Batch" ops process (TD NAs re-sent to KB) |
| Invoices | clarisse@jaintel.com (Jaintel, TD's billing intermediary) | `TopDial Invoice <Month D, YYYY>` | daily | PDF invoice |
| Ad-hoc ops | vicd@topdialinc.com | e.g. `Server Credentials` | ad hoc | NEVER copy credentials from these |

BR/WI x FR/RV tokens map to the two TD replicas (bathroom, windows) x fresh/revive — see callcenterdb. TD folder names could not be resolved via the connector; find these by free-text query (`topdial`, sender `topdialinc.com`, `jaintel.com`). Cadence reality (verified): weekdays only, and Thursday+Friday hours emails can BOTH arrive on Monday; the 4/week Sunday weeklies are not guaranteed (BR-FR skipped a week without notice) — check completeness before summing a week.

## 8. Reserve DB feeds (lightweight provenance source)

The "Reserve DB" folder (same mailbox) archives two automated daily feeds upstream of the weekly Reserve Dashboard refresh: (a) **"BuyerLink Reserve Report"** from `clientservices@canadadirect.ca`, daily ~11:26 UTC, ~8MB xlsx snapshot of reserve-lead inventory (six figures of rows; body states `Record Count: N`); (b) **`<SERVER> - <CAMPAIGN> - Daily Reserve Report - YYYY-MM-DD`** from `noreply@baretelecom.com`, daily ~10:30 UTC per KB server, containing links to FRESH/REVIVE xlsx results hosted at `https://fs-reporting.baretechs.com/<server>-arc/` — **VPN/allowlist-gated, not fetchable from Cowork**. Use this source ONLY for provenance/freshness ("did today's reserve feed arrive?", "what's the record count trend?") and locating a specific day's file; for actual reserve analysis, query the replicas/prod DB (callcenterdb/fivestratadb). Attachments are PII-dense lead dumps — counts and structure only. The "Reserve DB" folderName does NOT resolve via the connector — find by sender `clientservices@canadadirect.ca` + afterDateTime (combining sender/date filters with mailboxOwnerEmail works despite the tool description's caveat; free-text "RESERVE" gets swamped by Dialable Lead Counts emails). Sibling folders in the mailbox: CD Daily Report (**CanadaDirect** — a third call-center partner, `BuyerLink Daily Report`, daily xlsx), Dialable lead counts (CAMPAIGN/ACTIVE/RESERVE counts, ~22:15 UTC), DNC requests, Inventory Audit/DB, MDB reports, Revive Batches.

## 9. CD (CanadaDirect) Daily Report — via Microsoft 365 connector

CanadaDirect is a **third call-center partner** (distinct from KB/BareTel and TD/TopDial; not yet in the callcenterdb skill). Its daily results report lands in the FiveStrataTech mailbox folder "CD Daily Report":

- Sender: `clientservices@canadadirect.ca`; subject always `BuyerLink Daily Report`; ~11:15 UTC covering the prior WEEKDAY (Tue–Sat delivery; no weekend-traffic editions, unlike the Reserve Report from the same sender which runs daily).
- Body: short HTML including `Record Count: N` (e.g. ~700/day); attachment `DailyReport_YYYY-MM-DD.xlsx` with the day's record-level results — **column headers not yet profiled; treat as consumer-lead PII until proven otherwise** (structure-only if opened; never echo rows).
- Retrieval: folderName "CD Daily Report" resolves for this mailbox (unlike the KB folders); otherwise free-text query `BuyerLink Daily Report` with mailboxOwnerEmail `stratatech@buyerlink.com`.
- CanadaDirect also sends the daily "BuyerLink Reserve Report" (see §8) plus two **Monday weeklies** (~11:20/11:25 UTC, filename dated to the SUNDAY week-end):
  - **`BuyerLink Weekly Report`** — `WeeklyReport_YYYY-MM-DD.xlsx`, ~2MB, Record Count ~35k ≈ a record-level weekly roll-up of the Daily feed (covers the Sun/Mon gap the Tue–Sat Daily leaves). Since 2026-05-11.
  - **`BuyerLink Weekly User Report`** — `WeeklyUserReport_YYYY-MM-DD.xlsx`, ~250KB, Record Count ~4k — inferred user/agent-level weekly rows (contents unverified; xlsx binary unretrievable via connector, like all attachments). Since 2026-05-18; note it lands in the INBOX, not a rule-filed subfolder.
  - All CanadaDirect mail shares the body pattern `Filename: … / Record Count: N` — the counts are readable without touching the attachment. Full sender inventory: Reserve (daily), Daily (Tue–Sat), the two Monday weeklies; feed began 2026-05-06.
- **Columns DOCUMENTED (2026-07-13, via the SharePoint copies):** the daily files are archived (renamed) to `Dashboards/Daily DB Data/CD Daily DB Files/Archive/<YYYY>/<MM>/CD_BR_DailyReport_YYYY-MM-DD.xlsx` — and these ARE search-indexed. Header row: `DialingDate, SourceId, FsCode1, State, Seconds, Dials, Contact, Complete, Sale, Abandon, AlmostSale, LostSale, TAtt, TSucc, TAgree`. So the report is **aggregate dialing results per (SourceId, FsCode, State)** — not lead-level. `FsCode1` embeds the pipe-delimited code string (`|VT:..|PD:..|CH:..|SC:..|CP:..|`) — the same VT/PD/CH/SC/CP vocabulary as the MDB Records tab, so CD results join to media-source analysis directly. TAtt/TSucc/TAgree = transfer attempt/success/agree. The `CD_BR_` prefix suggests per-vertical files (only BR observed — CD may run bathroom only today). Prefer the SharePoint copies over the email attachments for programmatic reads; the Outlook binary limitation stands but no longer matters. **Verified identical (2026-07-13):** a user-provided email attachment (719 rows, 7/10) matched the SharePoint dataset exactly — same columns, same aggregate granularity, zero PII. The email and SharePoint file are ONE dataset on two channels (SharePoint copy lands ~1 min after the email via the Daily DB Data pipeline) — dedupe accordingly; the body's "Record Count" equals the data row count. DB import (into `techss_*`) is an open ops decision — ride-along candidate for the CanadaDirect/callcenterdb onboarding.
- Open question: onboard CanadaDirect into callcenterdb via its metadata SOP.

## 10. CV Dashboard — weekly media-partner conversion view (SharePoint)

The 12-month trended CV media-partner conversion dashboard (feeds the Media Partner Dashboard and Pulse Reports; weekly Data-team process, see ops_processes.md). Located at `Dashboards/CV Dashboard/` with the standard three-ring rotation (current file at branch root → `<Month>/` → `Archive/<Month>/`).

- **Naming (verified 2026-07-13):** `CV Dashboard - Database2.2 -  M.D.YYYY.xlsb` — note the version label is "Database2.2" and there is a **DOUBLE space** before the date; match loosely. Weekly cadence, Monday-dated (unbroken 6.1→7.13 at last check).
- **Retrieval:** `sharepoint_search` query "CV Dashboard Database2.2", take the newest hit whose webUrl is the branch ROOT (not July/ or Archive/) — that's the current week. `lastModifiedDateTime` = freshness.
- **Reading:** it's a large .xlsb — expect the same Graph text-extraction failure as the MDB. The search-index SNIPPET does expose fragments of the pivot content (per-partner record counts and conversion rates), which can confirm liveness but not answer metric questions. For actual numbers: ask the user to export the relevant pivot, or route to the underlying data (CV MP conversion derives from sent/transfer data — Meridius/`techss_dwh` via fivestratadb).
- **Date semantics:** file date = the Monday it was built; contents = trailing ~12 months of monthly conversion by media partner. See date_hygiene.md.

## 11. FiveStrata KPI mailer — automated export notices (api.fivestrata.com)

"FiveStrata KPI" (sender renders as stratatech@buyerlink.com / "IT FiveStrata"; swift-generated, backed by `api.fivestrata.com`) emails export-ready notices, mostly "CSV is now ready" + a Google Drive link (parent Drive folder `1ypoCpoaRo_XC2LGMwitfbpgSgmkK3IGd`). Families:

| family | subject pattern | cadence | payload |
|---|---|---|---|
| MDB billable exports | `Master Dashboard Sent - Billable` / `... Billable Returns` | daily ~10:05/~10:16 UTC | Drive CSV link (or "No Result to export") — these are the MDB Sent/Returns input feeds |
| Revive Batch notices | `Revive Batch RU_RV_<WI|BR>_CC<n>_MMDDYYYY created successfully!` | event-driven, Monday-morning clusters | batch stats (request limit, dup/DNC/valid counts, totals), SQL ref `techss_RV.<BATCH_ID>`, api download link. Pairs with the RU Batches SharePoint staging (portal map) |
| Call Center Branding Audit | `Call Center Branding Audit - <WI|HW|SL|BR>` | weekly, Sun ~02:20 UTC, 4 emails | Drive CSV link; note SL vertical present; SL often "No Result" |
| VTRVInventoryData | `VTRVInventoryData Inventory ..._{1|2}` | weekly Mon ~13:15 UTC, 2 zip parts (~2MB) | RV inventory extract (lead-level inside zip — PII) |
| TD/EIS dashboard exports | `{TD|EIS} {WI|BR} Dashboard Daily Results Export for <date>` | daily 06:00 UTC "No Data" alerts + Monday ~22:40 UTC weekly Drive links | **EIS confirmed as its own call-center code** alongside TD |
| DNC voicemail requests | `Customer Service call from (XXX) XXX-XXXX - Customer Service: {BR|HW} (KB)` | event-driven, sporadic | **PII: consumer phone + Twilio recording link + transcript** — the raw DNC/opt-out intake feeding the Legal "Add #s to DNC" process. Treat folder as sensitive |

**OUTAGE CAVEAT (observed 2026-07-13):** the KPI mailer went silent ~2026-06-22 — MDB exports, branding audits, revive-batch notices, and VTRVInventoryData all stopped that week; only the TD/EIS no-data alerts still fire. Unconfirmed whether this is a breakage or an intentional retirement during the automation migration (the Meridius SPROC era began ~mid-June — see the meridius skill). CONFIRM before treating these families as live; if retired, their replacements likely live inside Command Center / the DB directly.

## 12. Dialable Lead Counts — hourly dialer inventory (the most real-time source)

Folder "Dialable lead counts" (resolves by folderName), sender `noreply@baretelecom.com`, subject `<SERVER> - <LINE> -Dialable Lead Counts Report` (note missing space before "Dialable"), servers FSBR/FSBRV/FSHW/FSWF/FSWR. **Hourly**, generated at :15 ET (~hh:16 UTC arrival), each a POINT-IN-TIME snapshot ("DIALABLE LEAD COUNTS at YYYY-MM-DD HH:15 ET"). HTML tables: CAMPAIGN (FRESH/REVIVE) x ACTIVE # / RESERVE #, plus ZCWL Count (zip-code-whitelist size). No PII. This is the finest-grained feed in the skill — use for "how many dialable leads right now/at hour X", intraday inventory trends, and same-day supply monitoring. ~4,900 items retained.

## 13. Command Center & comms map

**FiveStrata Command Center** — the operational web hub (NOT directly fetchable by Claude; auth-gated web app):
- New CC: `command-center.fivestrata.com` (migrated to AWS ECS ~6/23–6/30 2026); a Dev flavor exists; legacy CC at `techsolarsolutions.com/Dashboard` (e.g. distribution-max-attempt page) still referenced.
- Backed by `api.fivestrata.com` (same backend as the §11 KPI mailer) over the prod `techss_*` DB (fivestratadb skill).
- Holds/serves: affiliates page (MDB partner lookup), Active Zip list (Monday refresh), brand rules, client budgets (`techss_dl.client_budgets` — what Meridius reads), partner/call-center onboarding forms, undelivered-leads view (~230/month), a **Daily Summary Report**, and a **Downloadable Reports page** (`/cc/pages/downloadable-reports`, hosts TD Daily Dashboard and other exports).
- When a question needs CC data: route to the underlying `techss_dl` tables (fivestratadb) or ask the user to pull from the CC UI.

**Active Teams channels for comms mining** (via chat_message_search): core FS ops group chat (Kinsey/Ashley/Brandon/Joy/Alex — COGS, hours, trackers), Tech/Command Center chat (Joseph/Cromwel — releases, MDB email issues), FS team channel (Monday `FS Weekly Team Meeting.docx` agendas + Kinsey's weekly client pulse check post: campaigns/clients/cancels/paused counts), call-center ops team channels (partner onboarding, transfer hours/zips, Esler client channel). Brandon's daily "MDB updated" post lives in the core ops chat (§1 fallback).
