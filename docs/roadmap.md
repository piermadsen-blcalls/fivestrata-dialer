# AICC Roadmap — Functions → Milestones

**Status:** Draft v1 (Sean, 2026-08-05), requested by Pier. Derived 1:1 from `PRD.md` Draft v1 —
this document adds *sequencing and gates*, not scope. Scope questions were settled in the PRD;
see §5 ("What this roadmap does not reopen").

**How to read it:** the PRD's stance is **one build, exposure ramps** — we are not phasing
functionality, we are ordering *proof points*. A milestone is a demonstrable gate: a thing we can
show working, with a pass/fail criterion, that unlocks the next level of exposure. Every P0
function from PRD §4 appears in exactly one milestone (the matrix in §2 is the checksum).

---

## 1. The milestones

```mermaid
flowchart LR
  M0["M0 · BRAIN ONLINE ✅<br/>done 2026-08-03<br/>schema + views + simulated E2E"]
  M1["M1 · FIRST REAL CALL<br/>voice engine PoC (W1)<br/>gate: clip latency ≤ ~200ms"]
  M2["M2 · CALL MACHINE COMPLETE<br/>dark launch (ramp stage 1)<br/>gate: lead→dial→convo→transfer→dispo<br/>on internal numbers, both grains logged"]
  M3["M3 · RESULTS LOOP CLOSED<br/>Snowflake + techss_ write-back (W4)<br/>gate: Ashley signs the views (W7)"]
  M4["M4 · QUIET VOLUME PILOT<br/>revive · one vertical · small %<br/>gate: $/transfer + connection rate<br/>vs KB/TD/CD baselines"]
  M5["M5 · SECOND PROGRAM<br/>onboards as config (playbook)<br/>gate: days, zero code, zero DDL"]

  M0 --> M1 --> M2 --> M3 --> M4 --> M5
  CARD["🔑 corporate credit card<br/>(procurement in progress 8/5)"] -.gates.-> M1
  JOS["Joseph: T3/T4/T11 contracts"] -.gates.-> M2
  SNOW["Shelly Teh: Snowflake landing<br/>Sam/Tatevik: cost approval (W5)"] -.gates.-> M3
  KIN["Kinsey: crediting sign-off"] -.gates.-> M2
```

Target dates (planning targets, not commitments — M1 floats on the card, everything downstream
floats with it):

| Milestone | Target | External dependency on the critical path |
|---|---|---|
| M0 Brain online | ✅ **done 2026-08-03** | — |
| M1 First real call | ~1 week after card lands (est. w/o 8/10) | **Credit card** (test-DID purchase) · public webhook endpoint (IT tunnel/deploy) |
| M2 Call machine complete (dark) | ~1 week after M1 (est. w/o 8/17) | Joseph: LeadConduit payload (T3/F8), pre-auth contract (T4), DNC surface (T11) · Kinsey: crediting rule |
| M3 Results loop closed | ~1 week after M2 (est. w/o 8/24) | Shelly Teh: Snowflake landing (T8) · Cromwel/Joseph: write-back contract (T6) · Sam/Tatevik: cost approval (W5) |
| M4 Quiet volume pilot | w/o 8/31 | Ashley: pilot-vertical script final · upstream split % change (Alex/Ashley) |
| M5 Second program | September, opportunistic | A second demand owner (AutoWeb trade-in is the standing candidate) |

---

## 2. Function → milestone matrix (the checksum)

Every PRD §4 P0 function, mapped once. "Built at" = when it demonstrably works; scaffold code may
exist earlier (much already does).

| P0 # | Function (PRD §4) | Built at | Gate it must pass | Workstream |
|---|---|---|---|---|
| 12 | Reporting in Ashley's grain (rDaily/rList views) | **M0 ✅** (views built, migration 0002) → sign-off at M3 | Ashley confirms views match her workbook | W7 |
| — | Operational schema, both fact grains (per-dial + per-turn) | **M0 ✅** (migration 0001, 13 objects verified) | simulated E2E fills dashboard live | — |
| 7 | AI agent, soundboard-first (clip selection · per-turn logging · canned-vs-TTS telemetry · engine selector) | **M1** | clip playback latency ≤ human-soundboard seam (~200ms); cost/connected-min model vs KB baseline | W1 |
| — | Voice pack v0 (clips + variants for pilot script) | **M1** (pipeline hardens through M2) | first pack generated and playable | W6 |
| 5 | Intake API (LeadConduit recipient + revive endpoint · DNC inheritance · FS-code parsing) | **M2** | real payloads validate end-to-end | W3 |
| 6 | Dial queue (cadence variables · LIFO/FIFO · TZ windows · concurrency-aware slot-ledger pacer) | **M2** | paces to configured caps with event-driven backpressure | — |
| 3 | DID management (pool buy/rotate/retire · per-DID benchmarks · caps · **pool fallback, never single CID**) | **M2** | pool purchased, benchmark counters live, nightly retire directive wired | — |
| 8 | Warm-transfer leg (**pre-auth at dial time, every dial** · re-check + fallback · bridge + whisper · tAtt/tSucc/tAgree) | **M2** | bridged test transfer logged; crediting rule signed off by Kinsey | W2 |
| 9 | IVA/connection classification (AMD + live IVA disposition) | **M2** | IVA-adjusted connection rate computes on dark-launch traffic | — |
| 10 | Ops controls (kill switches global/program/SC×CP · transfer priorities · throttles) | **M2** | kill switch demonstrably halts dialing mid-run | — |
| 2 | Recording storage (everything archived, FS-owned, 5-yr; hot analysis window) | **M2** (capture) → M3 (catalog in Snowflake) | recordings land in FS-owned storage from first real call | — |
| 4 | A/B harness (batch → agent/script/voice-pack/cadence variant assignment) | **M2** | two batches run two variants concurrently, attribution lands in fact stream | — |
| 1 | Results DB (Snowflake, every dial + turn, OLeadID-keyed · techss_ write-back · `analytics_directives` return path) | **M3** | nightly sync lands both grains; a write-back row survives round-trip to techss_ | W4 |
| 11 | Multi-tenant topology (tenant→program · playbook onboarding as config) | core at **M2** (program resolution in intake) → proof at **M5** | second program live in days, zero code, zero DDL | — |

Pilot economics (M4) is not a function — it's the exposure gate the whole stack exists to pass:
$/qualified-transfer vs KB ($25–35), IVA-adjusted connection rate, SPH-equivalent, canned-coverage %.

---

## 3. What each milestone proves (talking points)

- **M0 — the brain exists.** Supabase schema (13 objects), Ashley-grain reporting views, and a
  simulated lead→dial→turn→disposition pipeline filling a live dashboard. Already demonstrable
  today with `demo-simulate`. Telnyx keys validated (T2 closed 8/3).
- **M1 — the voice thesis holds.** One real outbound call where the AI fires canned clips with a
  seam a human can't hear. This is the single riskiest assumption in the PRD (it's what killed
  V1's economics), which is why it's the first real-world gate and sits directly behind the
  credit card.
- **M2 — the whole machine runs dark.** Every call-path function live against internal test
  numbers. Nothing outside the team sees it. This is PRD §7 ramp stage 1 — full functionality,
  zero exposure.
- **M3 — the data promise is kept.** Every dial and every turn in Snowflake, dispositions flowing
  back into techss_ so the MDB and every downstream dashboard keep working, and Ashley agreeing
  the views are her workbook. Revenue linkage becomes *measurable* here.
- **M4 — the business case gets its number.** Small % of revive volume, one vertical, paced to
  human-floor rates. Exit is evidence, not a date: $/transfer and connection rate against the
  KB/TD/CD baselines decide whether volume scales (ramp stage 3).
- **M5 — the platform claim is proven.** A second program (different tenant if possible) onboards
  via playbook manifest in days. This is the differentiator slide made real.

---

## 4. Open items, forced to a deadline

The design intent: nothing on this list is *debated* at a milestone — each has an owner, a due
milestone, and a ➤ proposed default that stands if no decision arrives by then. (Defaults are
directions, not decisions, until their due date passes — provenance rule intact.)

| Open item | Owner | Due by | ➤ Proposed default if unresolved |
|---|---|---|---|
| Telnyx negotiated pricing + warm-transfer fee scope | Pier | M3 (cost model) | list pricing in the cost model |
| LeadConduit payload spec (F8) + pre-auth request/response contract (T4) | Joseph | M2 | emulate today's call-center contract verbatim |
| DNC inheritance — pre-scrubbed only, or platform-side scrub? (T11) | Joseph | M2 | platform re-checks `dncDate` at intake (belt-and-suspenders) |
| techss_ write-back contract (T6) + disposition dictionary | Joseph/Cromwel/Brandon | M3 | mirror the TD_* ingestion pattern |
| Client no-answer path on warm transfer | Kinsey | M2 | AI offers callback, disposition logged as tSucc-fail; FS still credited for attempt (✅ 7/29) |
| Formal pilot success thresholds | Sean+Pier → Payam | M4 start | beat KB $/qualified-transfer ($25–35) at ≥ human-floor IVA-adjusted connection rate |
| Hot-window length (30–90d) | Sean | M3 | 90 days |
| CDC route to Snowflake | Sean/Shelly | M3 | nightly incremental watermark sync (per `snowflake-value.md`, 8/3 analysis) |
| Pilot DID pool size | Sean/Ashley | M2 | start ~50–100 DIDs, benchmark-retire from day one; pool fallback per 7/31 study |
| Recordings storage target | Sean/Shelly | M2 capture / M3 catalog | S3, cataloged in Snowflake (per `snowflake-value.md`) |

## 5. What this roadmap does not reopen

Settled, with provenance — raising these again requires new evidence, not preference:

no ViciDial instance (✅ PRD v1, 7/27; A/B/C fork closed 7/23 `ac4357e`) · Supabase brain +
Telnyx path + Snowflake results (✅ PRD v1) · soundboard-first hybrid voice, AI as the soundboard
operator (✅ PRD v1) · no human screener/closer (✅ PRD v1) · pre-auth at dial time, every dial
(✅ 7/29 Sean↔Pier↔Joseph) · crediting on transfer *attempt* (✅ 7/29) · per-program engine
selector (✅ 7/29) · concurrency-aware queue from day one (✅ 7/29) · one build / exposure ramp,
not build phases (✅ PRD §1/§7) · revive-first pilot, existing vertical, not HW (✅ 7/17) ·
multi-tenant playbook onboarding (✅ 7/23) · augment-not-replace (settled by V1).
