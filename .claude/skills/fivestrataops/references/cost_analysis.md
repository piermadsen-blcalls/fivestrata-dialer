# Call Center Cost Analysis (restricted Google Sheet) — structure & semantics

Profiled from a user-provided snapshot (2026-07-11); live Google Sheet is restricted — live fetch pending Google connector, see live_fetch.md §3. Sheet ID `1nFIm6zW3QQLMfkEyxCIWyrcDksUn7OWhDg8ZgLsVAj8`. NO financial values are recorded here by policy: structure and semantics only — read the live sheet (or ask its owner) for any number.

## Role in the business

This is the finance-side reconciliation of call-center spend: monthly **cost per hour by provider** (Kombea/KB labor + BareTel telecom, TopDial/TD, EIS, India, Canada Direct/CD) and the **CV month-over-month P&L ratios** (Revenue, Media, DM, CC, GM). It is where the MDB Hours pipeline meets actual invoices/bills. MDB costs are rate-based estimates; this sheet holds the invoice-based actuals, which is why it is restricted.

## Tabs

### CC Analysis 2026 — used range B1:U34 (sheet allocs A1:U999)
Months run across columns: C=Jan … N=Dec 2026 (Jan–Jun populated at snapshot). Four stacked blocks, labels in col B:

1. **Kombea Cost Per Hour** (rows 2–9): rows `Kombea` (labor invoices), `BareTel` (telecom/BT Wholesale usage), `India` (new line, appears from Mar 2026), `Total` (=SUM of the above), `Kombea Hours`, `Cost per Hour` (= Total ÷ Kombea Hours). So the KB cost/hour is **blended labor + telecom (+ India)**. Row 1 is an unlabeled helper row = BareTel ÷ Kombea Hours (telecom cost per KB hour).
2. **Top Dial Cost Per Hour** (rows 10–16): `Top Dial` (invoice total), `Top Dial Hours`, `Cost per Hour`; then `Canada Direct`, `Canada Direct Hours`, `Cost per Hour` (CD appears from May 2026).
3. **TOTAL CALL CENTER COSTS 2026** (rows 17–22): `TOTAL CC Costs` (= KB Total + TD, + CD from May), `TOTAL CC Hours`, `Cost per Hour`, `CC/Rev` (= total CC cost ÷ Revenue row 27; hard-keyed Jan–Apr, formula May–Jun).
4. **CV - MoM Metrics** (rows 25–34): `Revenue`, `Media`, `DM` (=Rev−Media), `DM%`, `CC`, `CC/Rev`, `GM` (=Rev−Media−CC), `GM%`. Revenue/Media/CC are hard-keyed monthly figures (align with MDB Financials/Generals).

Side annotation block (cols S and U, rows 3–7) pairing discussion topics with subjects: Call Center Performance ↔ "India, Canada Direct"; Dialer Efficiency ↔ "NA dialing"; Carrier Performance ↔ "Baretel"; Lead Shortage ↔ "Date Check Logic"; Coverage Shortage ↔ "BD". Reads as a meeting/agenda notes list, not data.

### CC Analysis 2025 — used range B1:AI39 (sheet allocs A1:AJ1010)
Three regions:

- **Left block** (rows 2–14, cols C–H headed Jan–Jun, year unlabeled — see open questions): `Kombea`, `BareTel`, `Top Dial` cost rows kept separate, `TOTAL`, `Q Total` (merged quarterly sums), `Kombea Hours`, `Top Dial Hours`, `Total Hours`, `Cost per Hour`, `Total Q Hours`, `QoQ Costs/Hour`.
- **Right block** (rows 2–20, cols K–AH): 24 monthly columns Jan 2024 → Dec 2025. Same pattern as the 2026 tab: Kombea + BareTel → `Total` → `Kombea Hours` → `Cost per Hour`; `Top Dial` → `Top Dial Hours` → `Cost per Hour`; **`EIS at TD Cost Per Hour`** (`EIS Cost at TD`, `EIS Hours at TD`, `Cost per Hour`) appearing mid-2025 — EIS reads as a seat/agent program hosted at TopDial; then **TOTAL COST** (`TOTAL CC Costs` incl. EIS where present, `TOTAL CC Hours`, `Cost per Hour`). Col AI repeats the row labels as a right-edge legend. Row 1 / row 22 hold the same unlabeled telecom-per-hour helper formulas.
- **Lower block** (rows 23–39): CV MoM metrics — `Revenue`, `Media`, `DM`, `CC`, `GM` monthly with merged quarterly subtotal rows underneath each, then ratio rows `DM`, `GM`, `CC/REV`, `CC/DM`, `MD/REV`, `MD/CC`. Column layout is irregular: C–N labeled Jan–Dec (earlier year), O–T headed with dates `2025-01-25`…`2025-06-25`, and V–Y a second July–Oct set with its own label column (U). Treat month attribution here with caution; verify against the live sheet.

Evidence of manual entry throughout: many cost cells are literal arithmetic typed into formulas (e.g. sums of two or more hand-keyed invoice amounts, or an invoice total minus the EIS line) rather than cell references — values are transcribed from invoices/bills, not linked to any feed.

### Sheet5 — used range B1:C16
Scratch list of consumer-facing offer/landing-page URLs under headers `ALL` and `SEND`; some cells hold several URLs. Domains seen: myhomepros, qualifiedsolarsurvey, newbathpros, windowreplacepros, newroofingpro, gutterguardpros, my-contractors, newflooringpros, newfencepro, deckandporchpros, newsidingpros, totalfoundationcare, findmywindowpro, freehomeinsurance-quotes, rewardspark, theunemploymentguide, elephantmarketplace. Unrelated to the cost math — looks like a domain list pasted for some other task (possibly carrier/branding review). Not a data tab.

## Row granularity

Provider × calendar month (cost blocks) and metric × month (MoM blocks). No daily rows, no vertical split (BR/WI/HW/SL), no fresh-vs-revive split, no per-server detail — those granularities live in the MDB Hours tab and the KB/TD dashboards. This sheet is the monthly invoice-level roll-up.

## How it ties to the other sources

- **Hours rows** = monthly sums of the MDB Hours tab pipeline (KB: BareTel/Kombea per-server daily emails FSBR/FSBRV/FSHW/FSWR/FSWF via the R extracting-hours script; TD: daily non-pause-hours emails). See master_dashboard.md, Hours tab.
- **Kombea row** = Kombea labor invoices; **BareTel row** = BT Wholesale usage charges (per-minute + FUSF) from the billing email series. Folding BareTel into the KB block means KB "Cost per Hour" here is labor+telecom blended — not directly comparable to a labor-only rate.
- **Top Dial row** = TopDial invoices (invoiced daily via Jaintel; summed monthly here).
- **Revenue / Media** in the MoM blocks correspond to MDB Financials/Generals monthly figures; `CC` equals this sheet's TOTAL CC Costs.
- Provider timeline captured by the columns: EIS-at-TD appears mid-2025; India (inside the KB block) from Mar 2026; Canada Direct from May 2026 — matching the CD feed onboarding.

## Verification path

To verify the monthly hours rows: callcenterdb skill → query_cookbook, `vicidial_agent_log` UNION `_archive` per replica, summed to calendar month. Telecom side: sum the §5 BT Wholesale emails. See `source_crosswalk.md` for the blended-rate caveat and authority table.

## Open questions / flags

- The 2025 tab's left Jan–Jun block has no year label (2025 H1 summary vs 2024 leftover?).
- Is 2026's "India" line the continuation of 2025's "EIS at TD" (program moved/renamed), or a distinct provider? The S/U annotation "India, Canada Direct" suggests both were active discussion topics.
- Lower 2025 MoM block has overlapping/duplicated month columns (two Jul–Oct sets) — reconcile on the live sheet before quoting any month.
- Sheet5's purpose and owner unknown.
- Snapshot staleness: only through Jun 2026; the live sheet will have later months and possibly corrections to the hand-keyed cells.
