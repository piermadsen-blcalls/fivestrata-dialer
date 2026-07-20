# FS BL Client Summary — client sentiment & account performance sheet

Profiled from a user-provided snapshot (2026-07-11); live Google Sheet pending Google connector — see live_fetch.md §4. Sheet ID `1ZSSHTBEOaNVpEd0gDeEWRNbQYmMQEV5DGd7IwLHH1uY`. The live sheet wins where this file disagrees.

## Role in the business

This is the **client-side (demand-side) pulse** — the counterpart to the MDB's product/supply view. It tracks every BuyerLink client account: monthly per-client delivery and transfer performance, a hand-set sentiment/status label per client per month, CSM assignment and capacity, budgets, price-increase outreach, rejected leads, canceled-client winback targets, and BD market expansion. Maintained by the CSM/BD org (CSMs seen: Aaron Coberly, Evan Lacivita, Gus Weber, Zach Plitt, Sheryle Coray, Sam Hagos, Callan Finch, and others). Roughly 200+ clients all-time, ~35–40 active per month, across verticals BR / WI / SL / HW / RF, products Call-Verified (CV) vs Appointments (Appt), and MKT (marketplace/MP) vs CV client types.

## Tabs (visible)

1. **Client Performance** (3,786×44) — the core tab. **34 stacked monthly snapshot blocks**, newest on top (Jul 2026 back to Dec 2022). Each block: a date row, then per-vertical sections (`Active BR Clients`, `Active WI Clients`, `Active SL Clients`, `Active HW Clients`, plus `SL/BR/WI/RF Appt Clients` in some months); one row per client. Columns: client name, Invoice Date, Product, Category, Sent, Returned, Return%, nSent, nRevenue, RevTrend, tAttempt%, tAgree%, tSuccess%, Transfer%, RPL, Monthly Budget, C-Absorption% / T-Absorption% (budget absorption by count vs target), **Status** (sentiment — see values below), a second **Status** (delivery state: LIVE, Soft Launch, Paused, Daily Leads, per-day caps as free text), CSM, BD. A **PRICE INCREASES** side block (cols ~W–Z+) per month: Outreach (True/False/NA), Outcome (Yes/No), New RPL, Effective Date; a small revenue-by-month summary sits further right.
   - **Sentiment Status values:** Great, Steady, Pulse Check, At Risk, Paused, Canceled, Soft Launch, Hit Budget, Taking All Volume Available.
   - **Product values:** Call-Verified, Appointments. **Category values:** Bathroom Remodeling, Windows, Solar, Home Warranty, Roofing.
2. **MoM Revenue** (1,175×64) — one row per client **all-time** (~213 clients), columns = billing months newest→oldest (May 2026 back to Oct 2022), then TOTAL SPEND, AOV, LIFECYCLE (months active), Vertical (BR, WI, HW, RF, SL, and BR/WI/SL APPTS), and a per-vertical side lookup (AOV, Lifespan, LTV). Month-header date hygiene is poor — several headers parsed with wrong years (e.g. "Dec 25" stored as 2026-12-25, "Nov 24" as 2025-11-24); trust column order, not header year.
3. **Winback Opportunities** (data ~160 rows×8) — canceled clients as winback targets, in sections `Canceled BR/WI/RF/SL/HW Clients` then `SL/BR/WI/RF Appt Clients`. Columns: client, Total Spend, Months Active, Last Active Month, CSM, Notes (free text: cancellation reason, balance owed, re-signup status). Cols G–H are a 2-row color legend: Green = "Kaden to work", White = "CSMs are currently working" (actual status is cell fill color, not a value).
4. **Monthly Rejections** (1,185×48, data in B–Q) — **row-level rejected leads, CONTAINS CONSUMER PII** (names, phones, addresses). Columns: dedupe flag (True/False), OLeadID, Client, Date (Sep 2025–Jul 2026), Phone_1, Zip, State, Market, First/Last Name, Address, City, CallDispo (Qualified, Transfer), CallDispo_ext (Transfer Declined; Transfer Failed (Customer Hung-up); Transfer Failed (Client Not Available); Special Client Request; NA), Reason (~48 free-text values: Duplicate lead, Not in Service Area, DNC Lead, server/integration errors, missing-field posts, client-specific filters), Total Rejected, Total Lost Revenue. Same lineage as the MDB Rejections tab (LeadConduit); fields match `calldispoEXT` semantics in fivestratadb.
5. **ACCOUNTS -Mar 2026** (1,225×140, data in A–W) — left block: **CSM assignment history matrix** — one row per MP client (~346), ~15 month columns (JULY…FEBRUARY spanning multiple years), cell = assigned CSM name or lifecycle state (Paused, Canceled, CV Killed). Right blocks: current rosters — MP Clients + CSM + Budget, and CV Clients + CSM + Budget (~339 rows).
6. **CSM Capacity** (data ~6 rows) — one row per CSM (5): MKT Clients, CV Clients, Dual, Total Active Clients, Available Hours, Committed Hours, Capacity (committed/available ratio; >1 = over capacity), Budgets, plus per-client-type care-hours assumptions (Client Care MKT/CV/Dual hrs) and side blocks comparing client counts across months (Nov vs Feb, Difference).
7. **BD - Markets** (19×38) — market expansion map: one column per state (AL…VA, 21 states), rows = metro/CBSA names under each; annotated "Little to no overlap w…" and an Updated date (6.22.2026).
8. **Taxonomy Mapping** (~15 rows) — maps FS client-segment labels (Active BR/WI/SL/HW Clients, SL/BR/WI Appt Clients…) to Product (Call-Verified, Appointments) and Category (Bathroom Remodeling, Windows, Solar, Home Warranty, Roofing) — the join key between this sheet's section labels and vertical codes.
9. **Current Appt Coverage** (82×3) — appointment-product ZIP coverage: Vertical (BR, SL, WI) → Client → Zip # (count of covered ZIPs).
10. **Ops Terminology** (~13 rows) — onboarding-pipeline stage glossary: OLD MP / OLD CV terminology mapped to a Final unified stage list (Zip Analysis Requested/Completed → Contract Requested/Sent/Signed → payment OK → Integration Docs/In Progress/Complete → KO call → Active), grouped Stage 1–5.

## Hidden tabs

- **SF Updater** (51 rows) — Salesforce account extract: Account Name, Account ID, Account Owner, Live Date, Last Modified, Last Activity, Billing State/Province. Owners are sales reps (Nick Usery, Brian Hafer, Connor Campbell…), distinct from CSMs.
- **Auto Refresh Execution Log** (~100 entries) — refresh log for SF Updater (a Salesforce report pull every ~4h). **All recent entries show Status = Fail** — the Salesforce sync is broken in this snapshot.
- **NS Contracts** (11 rows) — "not signed"(?) contract pipeline: Company Name, POC, Product (BR CV, WI CV, SL CV, BR/WI CV, Appt, BR Appt, SL Appt).
- **Sheet22** (scratch) — ad-hoc MDB-vs-CC comparisons and per-vertical FR/RV (Fresh/Revive) KB rate numbers; not a maintained data structure.

## How it connects

- Vertical codes (BR/WI/SL/HW/RF), FR/RV, CV vs Appt, RPL, calldispoEXT all match vocab_map.md / fivestratadb usage; RF (Roofing) appears here but not in the MDB's VT list.
- Client Performance's Sent/Returned/RPL columns are the client-side aggregation of the same billable-lead data behind the MDB Sent/Returns tabs; Monthly Rejections mirrors the MDB Rejections feed at lead level.
- "Client sentiment" questions → Client Performance **Status** column (first one) for the relevant month block; "who owns client X" → ACCOUNTS roster or Client Performance CSM column; "winback / canceled clients" → Winback Opportunities.

## Entity resolution

Client names here are hand-typed display names/DBAs, not keys — see `source_crosswalk.md` for the normalization rules (~9% of names vary across tabs even after normalizing) and for mapping to `techss_dl` numeric client ids (fivestratadb skill) via Command Center.

## Open questions / flags

- Second Status column mixes enum values with free-text caps/counts — parse defensively.
- Does "ACCOUNTS -Mar 2026" get renamed/re-snapshotted monthly on the live sheet? (Name suggests a frozen copy.)
- NS Contracts meaning of "NS" unconfirmed (Not Signed? NetSuite?).
- Salesforce auto-refresh failing since at least 2026-06-23 — SF Updater data may be stale; verify on the live sheet.
- MoM Revenue month-header years are unreliable (see tab 2 note) — a date_hygiene.md-class issue.

## SF Updater failure — investigated 2026-07-13

The Salesforce auto-refresh (third-party connector add-on, log signature matches Xappex G-Connector) pulls SF report `00OJQ000005uwrF2AQ` into the hidden SF Updater tab on a 4-hour schedule. Status: **dead in two phases** — (1) every run in the rolling log window (2026-06-06 → 06-23) failed silently (Status=Fail, blank User = credential/session issue), (2) the trigger stopped firing entirely on 06-23. SF Updater data is stale to **2026-04-22**. Nothing consumes it by formula — it's a manual lookup (SF account owner / live date / last activity) for ACCOUNTS, CSM columns, and winback work, so the staleness is invisible to users. Fix path: re-authenticate the SF login on the add-on schedule, confirm the report exists/is shared, re-enable, verify a Success log row. Until fixed, treat SF-owner/live-date/last-activity answers from this sheet as April-2026 vintage and say so.
