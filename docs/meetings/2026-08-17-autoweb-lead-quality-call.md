# AutoWeb Lead-Quality Call — Ammie's Staged Spec (Phase 1 Greenlit)

2026-08-17, ~11m. Attendees: Ammie Lin, Jina Yoon (AutoWeb), Sean Stott.

Ammie walked the flowchart she'd emailed earlier (AutoWeb-side conversations ran through
Pier, mostly with Jina; Ammie joined the last few sessions). Raw transcript:
`2026-08-17-autoweb-lead-quality.txt`, kept locally outside the repo (`C:\Claude\transcripts`;
the Teams export repeats the same call ~5×, content dedupes cleanly).

---

## 0. Headline outcomes

- **✅ Phase 1 greenlit (Ammie, ~10:54): "let's get phase one going first"** — post-submission
  lead-quality validation dialing. Sean's stated build estimate: **"this week"** (~7:03).
- AutoWeb's entry program is therefore **lead-quality validation**. (The roadmap's
  "trade-in acquisition" default was Sean's own placeholder — deliberately something
  fundamentally different, to keep the platform from being built for only one use case;
  never an AutoWeb-sourced candidate. Roadmap §6 open item updated.)
- Ammie's overall shape is **four stages**: (1) post-submission quality validation,
  (2) real-time validation injected into lead submission, (3) live warm handoff to dealer,
  (4) SMS follow-up validation (floated on the call).
- Ball is in **Ammie's court** for the phase-1 inputs: sample lead spreadsheet (field
  requirements validation), a general script, and a high-level flow/product requirement.
  Sean helps flesh out details.
- Pier's "UI layer first before AutoWeb loops in" gate: Sean reported the basic UI is
  already built (console prototype) and he'll fold AutoWeb's requirements into it —
  Ammie's "is that a month?" answered **"definitely not a month"** (~6:17). Note: Pier has
  not re-blessed AutoWeb starting now; Sean self-assessed the gate as satisfied
  ("Pier's the brakes, I'm the gas pedal", ~7:21).

## 1. The business problem (Ammie)

AutoWeb retail: dealers **scrub leads claiming poor quality** or **cancel claiming bad
ROI** — "bad" because leads don't close, even when AutoWeb's data shows the consumer
bought a car somewhere else (Sean, ~0:59, unchallenged). Stage 1 exists to arm AutoWeb
with proof: validate whether scrubbed leads are actually bad; if not, **decline/reject the
scrub request** or use the evidence to retain the dealer.

## 2. Stage 1 — post-submission validation (the greenlit phase)

- **Not injected into the lead-submission process** — an after-the-fact process on
  submitted leads.
- Mechanics (Jina, ~9:53): an input drop — e.g. end-of-day, every lead with **name +
  phone** — we dial out and ask a short structured script ("yes, yes, no"): did you buy a
  car? were you contacted by a dealer/someone? Ammie writes the general script; expand later.
- Output: record the response and **send it somewhere** (destination unspecified — open).
- Jina's framing: same dialing we already do on aged data for CV — only the questions
  differ. Sean confirmed questions/call-flow changes are easy.
- Intake form: start with a **spreadsheet list drop**; Sean prefers it become a
  **pipeline** (drop location or a pull endpoint), trivially switchable once ongoing
  (~7:43–7:58).

## 3. Stage 2 — real-time validation at lead submission

- When a lead arrives (own properties or affiliate; they have **email + phone**), validate
  it **before sending to the dealer** — with **no significant delay**: retail leads get
  deemed duplicates by being *seconds* later than another source (~2:20). A hard latency
  constraint, unlike anything in the FiveStrata flow.

## 4. Stage 3 — live handoff (warm transfer to dealer)

- Contact the consumer; if they're **ready to talk right now**, hand off live to a dealer.
- AutoWeb-side setup is the long pole — the dealer has to be ready to accept
  ("that part is DMA's phase three" — Ammie ~2:39; *DMA reference unclear, verify*).
- Sean mapped it to existing machinery: **client-hours** concept + **pre-auth availability
  check close to call time** (~3:07–3:29); the multi-touchpoint transfer build "would take
  a little more thought" but nothing incompatible (~10:37).

## 5. Stage 4 (floated) — SMS validation

- Ammie wants SMS for "did the dealer talk to you?" — cheaper/sooner than calls for some
  validation. Today that's **Allison's** territory; Jina: the carrier-approval work is what
  they're already doing **with Iterable** (~5:07).
- Sean: hasn't done SMS on the platform; Telnyx numbers are SMS-capable selectively, and
  carrier flow/opt-out approval (10DLC-style registration) is required. **Sean will look
  into Telnyx SMS regardless** (~4:30).

## 6. Fit/gap vs the current build (Sean's post-call read, 8/17)

Sean's on-call claim — "we pretty much have most of those functions already built" — holds:

| Stage | Have today | Gap |
|---|---|---|
| 1 (greenlit) | autoweb tenant seeded (migration 0005); console CSV intake wizard (map→validate→batch→undo); Scripts builder + per-line clip gen; telnyx-agent state machine; per-turn logging (call_turns/call_events); Calls history w/ drill-down | **Survey call-mode** (agent today is interest→transfer/opt-out; here structured *answers* are the product, no transfer); **results delivery** back to AutoWeb (export/report/endpoint — unspecified); **DID pool** (single test DID is spam-tagged); consent/DNC posture for retail consumers (confirm); media ~48h expiry preflight applies |
| 2 | Inbound lead-ingestion endpoint pattern (fivestrata-inbound); async ping-on-need architecture | Real-time latency SLA (seconds) is new; likely phone-liveness/IVA classification, not conversation — scope undefined |
| 3 | Buyer-pool (internal_pool strategy) built exactly for non-Command-Center tenants; pre-auth-at-dial + client hours; transfer script ready (`transfer-test.ts`) | Warm-transfer bridge **never live-run**; dealer availability config + AutoWeb-side dealer readiness (their long pole) |
| 4 | Telnyx SMS exists under same account | Entirely new capability: 10DLC/carrier flow approval, opt-out handling, org overlap with Allison/Iterable — ownership unresolved |

## 7. Action items

| Who | What |
|---|---|
| Ammie | Sample lead spreadsheet (validates field requirements) + general script + high-level flow/PRD |
| Sean | Build phase 1 once inputs land (estimate: days); fold AutoWeb requirements into console; investigate Telnyx SMS feasibility |
| Open | Results destination/format for phase-1 responses · list cadence (EOD daily?) · which leads get dialed (scrubbed-only vs sample) · consent/DNC obligations on retail consumers · SMS ownership (Allison/Iterable vs AICC) · what "DMA" refers to in stage 3 · Pier sign-off that the UI gate is satisfied |
