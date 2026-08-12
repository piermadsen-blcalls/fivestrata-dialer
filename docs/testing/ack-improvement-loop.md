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

| Round | Neutral-ack naturalness | Notes |
|---|---|---|
| 1 (150 calls) | 46% | monoculture: 194 neutral, 0 positive, 1 sorry |
| 2 (120 calls) | *audit pending inference re-enable* | distribution spread to 6 categories; formal re-score queued |

**Known next distillations (queued for the round-3 audit to confirm/deny):**
- Hedge-vs-question distinction in the interest prompt (wishy-washy over-credited as engaged).
- "Who is this again?" (both rounds' #1 utterance) wants an identity *re-greet* clip, not an ack (P1).
- Ack repetition within a call: no-repeat guard is per-category; consider per-call global.
