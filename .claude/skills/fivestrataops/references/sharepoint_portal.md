# FiveStrataCV SharePoint portal — structure & artifact lifecycle

Condensed from the full site map (profiled 2026-07-13; full version: `FiveStrataCV_site_structure.md`, kept outside this skill). Site: `autowebinc.sharepoint.com/sites/FiveStrataCV`, one document library **Shared Documents** (~575 GB, driveId `b!3xCFUCSoNke640ifwAtqKwv6GE8B2PdNhusVkzf02xui0UhkeLUDS5wkVbJ4ekiP`). Organization is purely folder-based; SharePoint lists/pages are NOT visible via the Graph connector.

## Top-level branches → what lives where

| branch | contents / use for metrics questions |
|---|---|
| `Master Dashboard/` (~12 GB) | the MDB pipeline (see master_dashboard.md §naming); `MDB description/` holds the data dictionary + R scripts + sample input CSVs |
| `Dashboards/` (~356 GB) | the dashboard fleet by source: `KB Dashboards/` (BR/HW/WI/Rep/DID/AI + Baretel Cost Dashboard.xlsx), `TD Dashboards/` (~214 GB; + Jaintel Cost Dashboard <Month>.xlsx), `CD Dashboards/`, `CV Dashboard/`, `Inventory/`, `Reserve/` (BR/HW/WI + Data), `Media Partner/`. Line dashboards follow `<name> - <ver> - <M.D.YYYY>.xlsb`. `Daily DB Data/` is the ingestion layer (per-dialer inputs, Manual_Import/Remove correction drop-zones, Output/) |
| `Tools/` (~110 GB) | one folder per internal tool (Darwin incl. `Darwin Automated Extracts/Darwin Output YYYY-MM-DD/`+manifest, Mini D, Meridius, Maximus, Decimus, ROC, Zip Branding, Hours Projection...) each pairing workbook + `* Results/` + `Archive/`; **`Process Guide/`** = canonical how-to library (~60 artifacts, xlsx step guides + mp4 walkthroughs, versions in filename); `Alex.xlsx`/`Brandon.xlsx` per-person task sheets |
| `RU Batches/` (~40 GB) | revive-batch staging: `Batches/<BR|HW|WI>/RU_RV_<LINE>_CC_MMDDYYYY.csv` staged 1–2 days AHEAD → `Done/` when consumed → `Backup/` mirror. PII-dense |
| `Accounting/` | FINAL COGS/NS Final Revenue per year, call-center invoices, CTD rev-share |
| `Media Partners/` | `Current Partners/<CODE>/` (ASL AWB BYR CTD MAD MAL OHP OPG PX RFA SGA STC UE WIH); offboarded → `Not active partners/`; Pulse Reports, STC Payout, UE Report |
| `Clients/` | Client Zip Analysis (bulk), zip change/analysis request workbooks as intake queues |
| `Analysis/` | large raw exports (CALL/DID_EXPORT_DATA, Buyerlink CIDR) — PII-dense |
| `CallCenter/`, `Compliance/`, `FS-Core/` | QA/templates; static 2021-22 legal/TCPA/retention policies; meeting agendas + scratch |
| empty | `FS Tickets, Urgent Issues/`, `Product and Growth/` (ticketing lives in root `IT Ticket tracker.xlsx`?) |

## Artifact lifecycle patterns (for process mapping & file location)

1. **Three-ring rotation** (MDB, CV, KB line dashboards, legacy Meridius): current versioned file at branch root → `<Month>/` dailies → `Archive/<Month>/` → `Archive/Month Finals/(<YYYY>/)`.
2. **Done-folder rotation** (RU Batches): pending → `Done/` → `Backup/` mirror. Batches staged ahead of run date.
3. **Dated-run folders** (Darwin extracts): `Darwin Output YYYY-MM-DD/` + `manifest.csv`; only recent runs retained.
4. **Version-in-filename, not SharePoint versioning:** `<name> - <ver> - <M.D.YYYY>` + intraday ` - 1`/` -1`/` - 2` suffixes with INCONSISTENT spacing — match loosely when automating.
5. **Append-only local `Archive/` everywhere**, no retention enforcement observed (despite a written retention policy in Compliance).

## Meridius — implementation note (2026-07)

**Meridius is now a MySQL stored procedure** (authored by Sean, ~June 2026). The `Tools/Meridius/` xlsb workbook line (`Meridius - 4.3 - 6.18.2026.xlsb`, 68 GB archive) is the LEGACY implementation — its snapshot cadence stopped ~6/18 because the sproc superseded it, not because the process lapsed. Sproc artifacts: `Tools/Meridius/Meridius Stored Procedure/`. The Meridius sent-leads dataset itself lives in `techss_dwh` (fivestratadb). Open: exact sproc name/schema + whether the ops-sheet "Meridius Tool" daily task description has been updated to reflect the sproc workflow.

## Sensitive-content flags (do not open casually)

`Tools/Process Guide/Master Dashboard Update 2.0.xlsx` (embeds credentials; `Links.xlsx` suspect too) · `combined_REVIVED_callerid.csv` (consumer dial records: phone numbers + caller-ID metadata; ~7 GB, ~June 2026 DID/CIDR analysis working set. FOOTPRINT as of 2026-07-13: library root + Analysis/Datasets/DID_EXPORT_DATA/ + its New/ subfolder + 100+ _partNNN chunks in two Buyerlink_CIDR_Dataset folders + a copy in a personal OneDrive via Teams chat share — 215 indexed artifacts, row contents visible in SharePoint search snippets. Re-derivable from replicas; remediation = delete all copies, purge index, DLP rule. Escalated 2026-07-13) · all RU Batches CSVs, Analysis/Datasets exports, Reserve Dashboard data, Darwin LeadConduit files (consumer lead/call data).

## Open questions

Site lists/pages invisible to the connector (manual pass needed if they matter) · archive retention ownership · empty branches' purpose · duplicate Buyerlink_CIDR zip at root vs Analysis/Datasets.
