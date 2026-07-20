# Master Dashboard (MDB) — structure & semantics

Profiled 2026-07-08 from template version **37.2** and the update process guide. The live workbook wins where this file disagrees.

## Role in the business

The MDB is the daily "product pulse" for the CV (lead-revival) product: revenue, media spend, pace, unit economics, and call-center performance, month-to-date. Maintained daily (Brandon, ~3 hrs/day; Kinsey manages; Alex covers adjacent dashboards). Sibling dashboards fed from/alongside it: KB/TD Call Center Dashboards (per VT, daily + weekly result tabs), CV Call Center Agent/Rep Dashboards, Inventory Dashboard, Reserve Dashboard, CV Dashboard (12-month trended MP conversion), Media Partner Dashboard, Darwin (zip targeting), Maximus (max attempts), DID dashboard, Zip Branding Tool.

## Tabs

**Data-input tabs** (cleared/reset at month start, appended daily):

1. **Records** — MTD leads purchased from sellers ("Intake MTD" emailed report), pasted into cols A–O. Formula col S maps SC (col I) against a media-partner Lookup Table in cols W–X (maintained from the Command Center affiliates page). Headers: `Records | VT | VTO | Date | WeekNum | State | Zip | PD | CH | SC | CP | C0 | FSMarket | Accepted | SentLeads | mCost | Partner SC | Partner BR`.
2. **Sent** — MTD sent/billable leads ("Master Dashboard Sent - Billable" report), appended to cols A–Q. Col AF = Returned. Cols AA–AN come from the Command Center Active Zip list (refreshed Mondays); AP–AR = RPL/client config. Key field: **calldispoEXT** — drives transfer attempts / successes / declines per client ("Unknown" placeholder when missing). CONTAINS CONSUMER PII.
3. **Returns** — MTD client-returned leads ("... Billable Returns" report); fully replaced daily.
4. **Rejections** — LeadConduit export, cleaned manually or via R scripts. Field order: Phone 1, OLeadID, Postal Code, State, First Name, Last Name, Address 1, City, CallDispo, callDispo_ext, Client, Outcome, Reason, Submission Timestamp. Cleaning drops blank OLeadID/Postal/Client, client 609, and "Invalid Zip Code" reasons. CONTAINS CONSUMER PII.
5. **Hours** — call-center hours dialed, appended daily. Columns: CallCenter (TD/KB), VT code, Date, Hours. Pipeline: BareTel/Kombea email the per-server daily reports (subject prefixes FSBR/FSBRV/FSHW/FSWR/FSWF) and TopDial staff email daily non-pause hours; the daily updater runs an R "extracting hours" script (MDB checklist steps ~29–36) that produces the `CC, Vertical, Date, Hours` rows pasted into this tab. Financials then computes call-center cost as **hours × a labor-rate lookup** (rate on the order of ~$7/hr; check the live lookup, don't hard-code). Cross-checks: Richard (TD) sends a daily hours summary email; the BT Wholesale usage emails carry the telecom side. Note the Hours tab does NOT come from the prod DB — the TD_* mirrors are dormant and KB has no automated connection; email + R script IS the live pipeline.

**Calculation/output tabs:** **Calculate**; **Financials** (12-month rolling, monthly totals rows); **Generals** (one column per month: MTD Revenue, Revenue Pace, MTD Media Spend, Media Spend Pace, RPL, DM%, CPL, COGS sections); **Media**; **Accounting** (pivots fed by Records); **cReport** (pivots fed by Sent).

## KPI definitions (names as used in the workbook)

- **MTD Revenue / Revenue Pace** — month-to-date revenue and its run-rate projection.
- **MTD Media Spend / Media Spend Pace** — same for media (lead-purchase) spend.
- **RPL** — revenue per lead. **CPL** — cost per lead. **DM%** — direct-margin percent. **COGS** — cost of goods sold section (call-center + media costs).
- **SPH** — sales per hour, by vertical, from the Hours tab vs sales.
- **Transfer Attempts / Successes / Declines** — per client, derived from `calldispoEXT` on the Sent tab.
- **Non-Pause Hours** — dialer hours metric used in hours reporting.

## Code values (as seen in 37.2; small lookups, not exhaustive)

- **VT / VTO (vertical):** ALL, SL (solar); BR (bathroom remodel), WI (windows), HW (home warranty); HS (home security) appears in row data.
- **Hours-tab VT codes:** HW, HWF (HW Fresh), WI, WIFR (WI Fresh), BR, BRF/BRFR (BR Fresh) — the F/FR suffix splits Fresh from Revive.
- **CallCenter codes:** TD (TopDial), KB (Kombea/BareTel).
- **SC (source/seller codes):** AWB, CTD, …
- **CP codes:** AUAD, HOAD10, … **C0 codes:** CD, KB, …
- **Partner names:** "Autoweb AQC Acquire", "Connecting the D…" (CTD), …
- **ViciDial campaigns seen in dialer reports:** Window, HomeWrty, HWFresh, BathRemo.

## Versioning & update workflow

- Template version (36.0 → 37.2) tracks structural changes; the date suffix is the daily update. Month-end: a "<MonthName> Final" snapshot is archived, input tabs are cleared for the new month.
- Daily flow: paste Intake MTD → Records; append Sent-Billable → Sent; replace Returns; clean + paste LeadConduit rejections; append CC hours; refresh pivots (Accounting, cReport); Generals/Financials update from Calculate.
- Update SOP: `Tools/Process Guide/Master Dashboard Update 2.0.xlsx` (embeds portal credentials — never copy) + "Master Dashboard Guide - Daily Update.mp4" + step-by-step `MDB_Master_Dashboard_Checklist.xlsx`. Guide name in the responsibilities sheet: "Master Dashboard Update 2.0". DID guides live alongside: `Baretel DID Report Guide.xlsx` (~10MB) and `DID report guide.mp4` (~1.7GB video).
- Daily headline: Brandon posts an "MDB updated" summary in Teams each morning (revenue pace vs goal) — the fastest sourced answer to "how are we pacing" when the workbook can't be read. Caveat from ops: MDB costs are rate-based estimates; finalized COGS can diverge materially, so treat MDB margin as directional.

## Open questions / flags

- `FSWF` is a live Windows KB server token in report subjects (FSWN appears only in the BT Wholesale billing series) — reconcile with callcenterdb's registry (fswn vs fswf).
- The Generals tab may be labeled "General" (singular) in some template versions — match loosely.
- "MDB" in the responsibilities sheet = this Master Dashboard. "Appointment Data" is a separate daily data task.
