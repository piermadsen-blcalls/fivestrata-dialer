# Ops team, processes, cadences & training

Source: "Ops/Data Job Responsibilities" Google Sheet, captured 2026-07-08. **Ownership and training status change — fetch the live tabs (see live_fetch.md) before answering a current who/when question.** This file explains the sheet's semantics and gives the roster/catalog as of capture.

## Roster (as of capture)

| person | role (as titled/observed) |
|---|---|
| Kinsey | manager (per Sean); trainer for Meridius, DNC, CV Dashboard, Client Onboarding, Mix Model |
| Brandon | analyst — owns the daily MDB update (~3h/day), Meridius Tool (daily 3h), Rejections/Returns (daily), Baretel DID report (weekly), dup/transfer audit, zip branding, client zip changes, Baretel liaison |
| Alex | analyst — Pulse Reports, CTD report (weekly), batch uploads to call centers, CV CC daily dashboard, Hours Projection, Revive Optimal Calculator, Revive Batches + consolidation, DNC adds, FTC DNC list, STC Payout, media-partner coordination |
| Sean | Maximus (quarterly), Darwin + Mini Darwin (monthly; incl. Tiers, GenericZips, Bullseye, Internal/Zip Lists), Decimus (paused), Excess Supply – BD Markets (monthly), vertical zip changes, audit/process optimization |
| Macey | Ops Process Manager; primary trainer for Brandon/Alex |
| Tavish | Ops Data Manager (MDB, Appointment Data, CC dashboards, rejection analysis) |
| Joy, Jared | Media section owners; Joy is the most frequent trainer |
| Sandra | Ops section owner |
| JD / Kait | Data section owners |
| Amanda | Legal section (DNC adds, FTC DNC lists, returns, complaint forms) |
| Others | Ashley (lead issues), Shelly (Command Center & AWS replica access), Brett (LeadConduit access), Payden (IT: Filezilla, Teams/Slack), David McKay (client onboarding, shared) |

## Sheet tabs & semantics

1. **First tab (task-training matrix):** four column-pairs — Media, Ops, Data, Audit (+ a Legal block) — each row a task with TRUE/FALSE. The flag marks training/coverage status for the tracked person, not task importance.
2. **`Tasks` tab — the cadence catalog:** `PROCESSES/DATA | Product | Schedule | Notes`. Product is CV/Both/blank. Schedule values: Daily, Weekly, Monthly, Twice a month, Quarterly, Start of month, First week of the month, As needed, Paused. Notes carry purpose descriptions (e.g. CTD Report = "Weekly COGS and lead details for all accepted and rejected"; Reserve Dashboard = throttles Darwin fresh buying, client ZIP analysis, RV supply for the Revive Optimal Calculator; CV Dashboard = 12-month trended CV media-partner conversion view feeding Pulse Reports).
3. **`Roles/Responsibilities` tab — training log:** per-person column groups (task | trainer | date | time | complete TRUE/FALSE), plus a category-ownership block (Media→Joy/Jared, Ops→Sandra, Data→JD/Kait, Legal→Amanda) and MISC/Projects blocks (e.g. "Automate CC dashboard", "Match TD/EIS hours to MDB", "Overhaul Revive Batch Tool Logic", "MAP Dashboard").
4. **`alex brandon sean` tab — per-person assignment detail:** task | Frequency | Time needed per week (hr) | trained by | date | Training complete | Training Guide (TRUE/FALSE or name) | Process Guide File. This is the richest tab for "who does what, how often, how long, and where's the guide".

## Process-guide names worth knowing (live sheet has the full list)

Meridius Video Guide 3.0 · Master Dashboard Update 2.0 · CTD Weekly Report Guide · DID report guide · Revive Process / Reviving Batches Guide · Revive Optimal Calculator (ROC) Guide · Darwin / Mini D · Maximus Guide · Excess Supply - BD Markets Guide · Vertical Zip Changes Guide · Client Zip Analysis Guide · Zip Update Guide · Reserve Dashboard Update · Inventory Dashboard Update · Hours Projection Guide · Media Partner Guide / Media Partner Reporting Nets Guide · PX Upload Guide · Restrictive Call Dates Guide · Active Client Audit Guide · Lead Volume Audit Guide · DNC update guide · STC Payout Guide · Media Margin Calculator Guide · duplicates MDB · returns part 1 · Branding tool / request branding guides · Creating and submitting tickets · Resurrecting Qualified Leads.

## Category catalog (first tab, as of capture)

- **Media:** Revive Optimal Calculator, Revive Batches, 60+ batch consolidation (Mondays, 3 VTs), Darwin (+Results), Mini Darwin (+Results), Bullseye, Internal Zip Lists, sending zips to partners, affiliate zip cleanup, VT zip changes, media-partner invoicing/batch files/net results, Hours Projection, media-partner relationship & data analysis, URL approval (with Legal), new MP setup (with tech), call-center performance analysis, Media Partner Dashboard update.
- **Ops:** uploading batches to call centers, Meridius Tool, client zip changes/analysis, zip branding (+requests/issues), tickets, assisting Ashley on lead issues, client onboarding, Pulse Reports, weekly inventory update, Supply Analysis Dashboard, Excess Supply – BD Markets, CV Media Rejection (LeadConduit), Maximus, Resurrecting Leads, Decimus.
- **Data:** Master Dashboard (+Returns/Rejections/Duplicate & Transfer-Dispo audits), CV Call Center Dashboards (Daily & Weekly Result tabs), Rep/Agent Dashboards, Reserve Dashboard, CTD Report, VT Data (feeds Darwin/Reserve/MP dashboards), Inventory Dashboard, Baretel DID Report, Month End Accounting, NA Test Batch (identify TD NAs → send to KB), CV Dashboard, Mix Model.
- **Audit:** FR/RV Lead Audits (volume), Inventory Data Audit, Active Zip List Audit, Client Transfer Days Audit, monthly restrictive call dates setup.
- **Legal (Amanda):** add #s to DNC, FTC DNC change/full lists, manage returns, complaint forms.

## Additional recurring workflows (Teams-discovered, 2026-07)

- **Weekly meetings:** `FS Weekly Team Meeting.docx` (Mondays, FS team channel, Kinsey) and `FS Weekly Tech Meeting.docx` (agendas on FiveStrataCV SharePoint).
- **Client pulse check:** Kinsey posts weekly campaign/client/cancel/paused counts to the FS team channel.
- **Hours projection:** Ashley maintains the hours-projection sheet (~1,600 hrs/day scale) with a recurring hours-projection call; distinct from the TD/KB hours FEEDS (live_fetch §5-§7) and from Alex's "Hours Projection" tool task.
- **Rejected/undelivered leads report:** Brandon's revenue-recapture workflow over CC/client/system-rejected + undelivered leads (~230 "undelivered" visible in Command Center per month).
- **Esler monthly client report:** WT Leads report reconciled vs MDB (Zachary Plitt/Macey, client channel).
- **Finance true-ups:** `Accounting/FINAL COGS - 2026.xlsx` and `NS Final Revenue 2026.xlsx` (NS = NetSuite) are the finance-actual workbooks used to true-up MDB estimates (see source_crosswalk authority table).
- **Meridius note:** the "Meridius Tool" daily task in the responsibilities sheet predates the June 2026 SPROC automation (see the `meridius` skill) — the process now runs hands-off; treat sheet cadence/hours for it as historical until the sheet is updated.
