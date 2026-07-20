# Cross-DB joins — tying VICI dialer data back to FiveStrata (techss_)

For holistic analysis you often need to connect a call on a replica to a lead in the prod FiveStrata DB. There is no enforced FK across systems — all joins are **by convention**. Use the fivestratadb skill for the techss_ side.

## Join keys, in order of reliability

1. **`vicidial_list.vendor_lead_code`** — VICIdial's standard field for the *source system's* lead id. FiveStrata's lead key on the other side is **OLeadID** (Teams-confirmed: OLead IDs are what gets requested from BareTel's end; prod tables like `techss_reporting.TD_BR_vicidial_log` are keyed by `oleadid`). ❓ Spot-check that vendor_lead_code carries OLeadID on each center.
2. **`vicidial_list.source_id`** — secondary source tag; sometimes carries batch or list provenance from the sending system.
3. **Phone number** — `vicidial_list.phone_number` / `vicidial_log.phone_number` vs phone columns in techss_ tables. Works but many-to-many (same consumer, multiple leads; shared numbers). Normalize to 10 digits, strip country code. Treat as fuzzy.
4. **`list_id` conventions** — CAUTION on KB: the current BareTel setup uses a **single-giant-list structure** (Teams, 2026-06), so list_id likely does NOT map to batches there; use campaign (`FSFRESH` vs `FSREVIVE`) + entry_date instead. TD list conventions unverified. BareTel's in-progress rebuild may change this per vertical.
5. **Timestamps + campaign** — last resort for reconciliation: match call windows against techss_ transfer/dialer logs.

## Typical cross-DB questions and the path

- **"Did our revived bathroom leads get called, and what happened?"** → techss_ side: which leads were sent (e.g. Meridius sent-leads in `techss_dwh`, distribution in `techss_dl`). VICI side: `vicidial_list` (loaded?) → `vicidial_log` (called? status?) on `fsbrv` + `td-bathroom`. Join on vendor_lead_code, fall back to phone.
- **"Reconcile TD's ingested data against the TD replicas"** → prod mirrors `techss_reporting.TD_BR_vicidial_log` / `TD_BR_vicidial_agent_log` / `TD_BR_dial_logs` (and other-vertical sets) vs the replicas, by call_date/campaign. Decode dispositions via `techss_dl.callcenter_dispos` / `techss_reporting.CC_dispos`. Mind timezone: TD replicas run MST; check what prod stores.
- **"Transfer outcomes"** → VICI `vicidial_xfer_log` / closer log vs techss_ transfer tables (`techss_all_leads` transfer data, `techss_wv` transfer scripts/providers).

## Prod-side audit table for manual pulls

`techss_log.call_center_import_logs` (id, call_center, OLeadID, phone_number, vertical, outcome, reason, csv_file_id/csv_row_id, created_at) records per-lead outcomes of CSV imports from call centers — the authoritative check on whether a manual pull actually landed, keyed by exactly the join fields above (OLeadID + phone_number + vertical + call_center).

## Rules of thumb

- Always state the join convention used and its failure modes; never present a phone-number join as exact.
- Do the heavy filtering on each side's own server; move only aggregates or key lists across systems. These replicas are third-party-hosted — don't ship techss_ PII into ad-hoc queries against them.
- Fresh vs revive: on KB the server itself tells you (fsbr vs fsbrv); on TD you must segment by list/campaign inside the DB.

## Verification status

Everything in this file is convention-level guidance pending verification against profiled catalogs and a few spot checks. Update this file with confirmed mappings (which call center populates vendor_lead_code, exact list-naming scheme per center) as they are established — confirmed facts here compound in value.
