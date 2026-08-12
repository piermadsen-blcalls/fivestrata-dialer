# The ack-improvement loop (standing policy — Sean, 2026-08-11)

**Why this exists:** the acks are what make Claire feel real or fake (Sean). They are chosen by
zero-latency local heuristics at runtime — so the only way they get better is offline: big-model
judgment applied to every batch, distilled back into faster reflexes.

**The loop, run after EVERY test battery (and later, on real-caller samples):**

1. **Battery** — `scripts/persona-batch.ts N` (personas × N, verticals rotated). Every
   utterance→ack pair lands in `call_events`.
2. **Audit** — `scripts/ack-audit.ts`: Llama-3.3-70B judges every pair for naturalness
   ("would a human receptionist plausibly say this here?"), producing a naturalness score per
   category, a misfire confusion matrix, and worst examples.
3. **Distill** — every misfire pattern becomes one of: a new/changed heuristic rule
   (`ackCategory` / `shouldAck` in `telnyx-agent`), a new ack category + clips
   (`gen-clips.ts`), or a no-op with documented rationale. The judge thinks slowly so the
   runtime doesn't have to.
4. **Measure** — the next battery's audit scores the changes. Deltas go in
   `persona-soak-*.md`. A change that doesn't move the score gets reverted.

**Scorecard so far:**

| Round | Neutral-ack naturalness | Overall | Notes |
|---|---|---|---|
| 1 (150 calls) | 46% | 53% | monoculture: 194 neutral, 0 positive, 1 sorry |
| 3 (123 calls, v2 heuristics) | **71%** | **64%** | sorry 100%, positive 100%, soft 73%; question 41% and pleasantry 27% flagged |
| 4 (pending) | — | — | measures v3: non-promissory question acks, pleasantry length gate, stricter fragment bar, hedge≠engaged prompt |

*(Round 2's 120 calls were audited together with round 3's data batch; the negative-balance
inference outage delayed its standalone score.)*

**v3 distillations (deployed 8/12, commit pending measure):**
- Question acks made non-promissory ("Sure, happy to explain" promised an explanation the
  next clip doesn't deliver — the "one second" incongruity class again).
- Pleasantry acks gated to short (≤8-word) social utterances — they fired on pleasantry
  fragments inside longer turns.
- Fragment bar raised (<3 words never acks; <6 without terminal punctuation).
- Interest prompt: hedging/deferring explicitly ≠ engagement (wishy-washy was 14/21
  over-credited).

**Still queued:**
- "Who is this again?" (three rounds' #1 utterance, 33× latest) wants an identity *re-greet*
  clip, not an ack (P1).
- Ack repetition within a call: no-repeat guard is per-category; consider per-call global.
