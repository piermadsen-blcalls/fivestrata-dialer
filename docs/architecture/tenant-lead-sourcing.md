# Tenant Lead Sourcing, Intake & Coordination

Design spec answering Sean's 2026-08-15 questions: CSV dial-pool + buyer-pool intake for
tenants that don't arrive the FiveStrata way (AutoWeb first), script/must-hit ingestion and
enforcement, source-picker / price-tier pool composition, per-program cadence config, and
how the AI CC carves out leads and coordinates caps/hours with buyers alongside KB/TD/CD.
Status: ➤ design (Sean 8/15) unless marked ✅. Builds on `tenant-program-onboarding.md`
(model), `control-panel-scope.md` (screens), migration 0005 (applied), the integration guide,
and `lead-file-format.md` (batch normalization rules).

---

## 1. CSV dial-pool intake — yes, and it's the same door

Console upload wizard (Phase 1 screen #4, upgraded from "file upload" to "mapping wizard"):

1. **Pick program** → the target pool is always program-scoped (0005 `program_id`).
2. **Upload CSV** → header auto-mapping against a canonical core
   (`phone` required · `first/last_name` · `postal_code` · `state` · `external_lead_id` ·
   `source` · `acquisition_cost` · `originated_at` · `consent_ref`) plus the program's own
   `program_field_defs` — AutoWeb's vehicle columns (year/make/model/mileage…) land in
   `leads.payload` jsonb, validated per field defs, zero DDL.
3. **Validation report before commit** — bad/duplicate phones (NANP canonicalization,
   `phone_digits` parity with the SQL normalizer), DNC screen against `dnc_numbers`,
   in-pool dupes, Excel-mangling fixes per `lead-file-format.md`.
4. **Commit as a batch** — new `lead_batches` row (file name, uploader, program, counts,
   source_id); every lead stamped `program_id` + `batch_id`. Undo = the existing
   soft-delete path (`leads/remove` semantics) keyed on batch.

Mapping profiles are saved per program (part of the playbook), so AutoWeb's second file is
one click. FiveStrata programs keep their existing doors (LeadConduit recipient, the
inbound `/leads` API, batch files) — the wizard is a fourth door onto the same table, not a
parallel pipeline.

## 2. CSV buyer-pool intake — yes, with a per-program transfer strategy

The `clients` table stays "transfer buyers" (0005 added `program_id`). Tenant buyers need
columns FiveStrata buyers get from Command Center, so migration 0007 (draft) adds:
`transfer_number` (PSTN/SIP), `calling_hours` jsonb, `daily_cap`, `priority`, `payout`
(what the buyer pays per accepted transfer), `active`.

Buyer CSV wizard mirrors the lead wizard: pick program → upload (name, transfer number,
hours, cap, priority, payout, optional ZIP coverage rows → `transfer_priorities`) →
validate (E.164, hours parseable, cap sane) → commit + audit.

**The key architectural move** (already anticipated in `tenant-program-onboarding.md` §logic
implications): `selectTransfer(program, lead)` dispatches on program config —

| Strategy | Who | Pre-auth authority |
|---|---|---|
| `external_fivestrata` | all `fs-*` programs | Joseph's **Transfer Client API** before every dial (✅ 7/29) — caps/hours/zips enforced centrally, same as KB/TD |
| `internal_pool` | AutoWeb + any tenant not in Command Center | our own check against the program's `clients` rows: active ∧ in-hours ∧ under `daily_cap`, ordered by `priority` (round-robin within ties) |

Same engine call site, two authorities. The internal check is deliberately shaped like
Joseph's API (approve → transferCode/brand equivalent) so reporting and the funnel stay
identical across tenants.

## 3. Scripts, must-hits — literal ingestion and enforcement

**Ingestion (console script builder, Phase 2 screen #3 grown into this):**
paste or upload the script doc → split into lines → tag each line:
`must_hit` (required disclosure / compliance line) · `question_slot` · `ack` · `objection` ·
`close` · `transfer_announce`. Rows land in a new `script_lines` table
(0007: `script_id`, `line_index`, `tag`, `text`, `must_hit boolean`, `ab_testable boolean`);
`scripts.program_id` (0005) makes the association. Must-hit lines are **compliance-locked:
not A/B-testable, not editable by the clip-improvement loop** (the 7/23 rule).

**Clip generation:** per voice pack, `gen-clips`-style TTS → Telnyx media storage →
`voice_clips` rows keyed to `script_line_id`. Variations allowed on non-must-hit lines only.

**Enforcement is deterministic, not prompted:** must-hits become state-machine gates in
`telnyx-agent` — the LLM clip-picker literally cannot reach the transfer state until every
`must_hit` line for the program has played (the same mechanism as the hobby_litigator
compliance guard, already live in persona mode). Every clip choice is logged per-turn
(`call_turns`), so **must-hit coverage is a computable KPI per call** — auditable proof no
human floor can produce.

## 4. Source picker & price tiers — pool composition as program config

New in 0007: `lead_sources` (`id`, `kind`: `tenant_upload` | `fs_aged` | `fs_live` |
`purchased_dataset`, `name`, `cost_per_lead`, `vertical_origin`, `fscode_pattern` for
FiveStrata inventory crosswalk, quality metadata) and `leads.source_id` +
`leads.acquisition_cost`. FS-code stays the source taxonomy for FiveStrata-originated
inventory (FSCode1 acquisition identity dictionaries in
`techss_all_leads.unique_FSCode1/unique_FSCodes`); `lead_sources` is the platform-neutral
wrapper over it.

Program sourcing rules (console "Sourcing" panel):
- **Source picker** — explicit multi-select of `lead_sources` rows the program may draw from
- **Price band** — `cost_per_lead <= X` (bulk aged) or `>= X` (premium only), expressed as
  a band, with live preview counts against the pool
- **Combine toggle** — own uploads + marketplace inventory in one pool, or own-only

The queue engine pulls only leads matching the program's rules — composition is config,
enforcement is a WHERE clause.

**Economics:** tenant consumption of FiveStrata inventory is metered per lead *dialed*
(`acquisition_cost` or a marked-up internal rate) — this is the invoice-stack-margin case
Brodie made on 8/13, applied internally. Rate card ❓ (below).

**Hard gate before any cross-tenant reuse:** consent (TrustedForm/Jornaya) is offer- and
vertical-specific — a bathroom-remodel opt-in is not consent for an AutoWeb trade-in
solicitation. Every `lead_sources` row carries a `consent_scope` and a source cannot be
picked by a program outside that scope without an explicit compliance sign-off flag.
Platform-wide DNC (`dnc_numbers` + `techss` dncDate parity) applies to **all** tenants
unconditionally.

## 5. Cadence config (Sean 8/15): max dials + rest, per program

0007 adds to `programs`: `max_dials_per_lead` (program default; the inbound contract's
per-lead `max_attempts` overrides it per lead), `min_rest_hours` (minimum spacing between
attempts on the same lead — "rest days" × 24), `daily_dial_budget` (program-level pacing
cap). `calling_hours` jsonb exists since 0005 (TCPA windows by lead timezone).

Enforcement lives in the queue engine's next-dial selection:
`attempts < min(lead.max_attempts, program.max_dials_per_lead)` ∧
`now - last_attempt >= min_rest_hours` ∧ in-window ∧ program under daily budget.
Console: these are fields on the Phase 2 campaign/program screen — config-first, the
tables land now, the engine reads them when it lands.

## 6. Carving out our intake + coordinating caps/hours with KB/TD/CD

Grounded in the fivestratadb/fivestrataops/meridius picture:

- **Fresh leads:** the split already lives in LeadConduit's Command Center percentage
  split per vertical (Alex operates, Ashley calls changes; 100% HW→KB, bathroom→CD,
  windows→TD as of 7/17). The AI CC is a **peer call center** (Brodie's 8/13 framing):
  our carve-out = a percentage split to our LeadConduit recipient / inbound `/leads`
  endpoint. **One call center per lead, split upstream after DNC validation** (LeadOps
  constraint) means no double-dialing is possible by construction — the coordination
  mechanism already exists; we just become a destination. Ask = Joseph's "traffic
  pointing" item (already #1 on his onboarding sheet).
- **Revive leads:** revive batches are cut centrally (Reserve DB / `revivedLeadsBatches`
  lineage in `techss_all_leads`; KB gets Joseph's bulk upload, TD gets manual FTP). Our
  lane = the same batch cut pointed at our `/leads` API (or the console wizard). The batch
  cut must mark AICC-assigned leads so KB/TD sends exclude them — the exact exclusivity
  rule the floors already follow, extended to a third destination. AICC's structural edge
  here is Brodie's revive-elasticity case: scale dials at will, zero idle-agent risk.
- **Buyer caps:** Meridius computes daily caps (06:00 MST, `sp_meridius_newcaps` →
  `techss_dl.client_market_caps`) and the **Transfer Client API enforces them centrally at
  dial time — KB/TD call it every dial, and so do we** (✅ 7/29, contract in the
  integration guide, fail-closed). Cap/hours coordination with the human floors is
  therefore **automatic and real-time**: one authority, no sync job, no drift. The brandId
  echo rule prevents misbranding across centers.
- **Our unique move — caps as backpressure:** when pre-auth denials spike (caps exhausted,
  buyer off-hours), the human floors keep dialing and burn contacts; our pacer treats
  denial rate as a throttle signal and pauses the affected campaign
  (`concurrency-queueing.md` cap-visibility KPIs). Same signal also picks the *carve-out
  windows*: evenings/weekends/after-shift hours where floors are thin but buyers still
  accept — dial where the humans aren't.
- **DNC:** platform-wide, tenant-independent — inbound DNC/unDNC push keeps us in
  lockstep with `techss` dncDate; the §8 pop-time DNC check TODO applies to every tenant.
- **AutoWeb specifically:** never touches Command Center or Meridius — internal buyer
  pool (§2), own sources (§4), own cadence (§5). If a tenant later wants FiveStrata
  distribution, that's a `program_connections` transport, not a rebuild.

## Schema delta (migration 0007 — DRAFT, not applied)

`lead_batches` · `lead_sources` + `leads.source_id`/`acquisition_cost`/`batch_id` ·
`script_lines` + `voice_clips.script_line_id` · `clients` buyer columns
(`transfer_number`, `calling_hours`, `daily_cap`, `priority`, `payout`, `active`) ·
`programs` cadence columns (`max_dials_per_lead`, `min_rest_hours`, `daily_dial_budget`) ·
`programs.source_rules` jsonb (picker + price band + combine flag) ·
`lead_sources.consent_scope`. Written when Phase 2 build starts; additive only.

## Open questions

- ❓ Internal rate card for tenant consumption of FiveStrata inventory (per-lead price =
  cost, cost+margin, or tiered?) — Sean → Brodie/Payam (it IS the invoice-stack argument)
- ❓ Consent scope sign-off: who approves a source for cross-vertical/tenant use
  (compliance gate from `tenant-program-onboarding.md` ❓1, now concrete)
- ❓ Revive batch-cut exclusivity: who marks AICC-assigned batches in the Reserve/revive
  process — Joseph + Ashley
- ❓ AutoWeb program definition (C5): demand owner, product (trade-in acquisition?),
  buyer pool shape (dealerships? one internal desk?), target date
- ❓ Fresh split %: starting number for the AICC lane once M-gates pass — Ashley/Brodie
