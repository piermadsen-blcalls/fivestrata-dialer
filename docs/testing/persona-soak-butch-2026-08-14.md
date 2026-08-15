# Butch battery series — 2026-08-14

**Persona:** `butch` (added this day) — male, 56, holds the household purse strings, sharp-eyed,
no-BS. His wife submitted the bathroom inquiry (magazine-fueled; she always wants to upgrade
something). He privately knows the bathroom is outdated, so he **can** be persuaded — but if the
caller dodges, oversells, or pressures, he's done. **Goal under test (Sean):** hook him and get
him interested in finding out more — the ask is agreeing to a *transfer to a remodel specialist*,
not a purchase.

**Method:** 10 calls → distill/deploy → 10 calls → distill/deploy → 30-call dataset. All calls
`q_bathroom`, greet `demo_greet`, per the standing ack-improvement loop. Logs:
`C:/Claude/scratch/persona-batch-butch-r{1,2,3-final30}.jsonl`.

## Scorecard

| Round | Calls | Interested | Unclear | Opt-out | Other | Avg dur | Notes |
|---|---|---|---|---|---|---|---|
| 1 (baseline) | 10 | 9 | 0 | 0 | 1 none (turn-budget rig artifact) | 56s | inquiry-source ask 10/10 unanswered; price asks ~7/10 unanswered — wins came from the engaged-question classifier tiebreak, not persuasion |
| 2 (r1 fixes) | 10 | 9 | 0 | 1 compliance | — | 46s | `regreet_inquiry` fired 10/10 but replayed up to 3× consecutively on restatements; compliance guard tripped on "this point is being recorded" (acknowledgment, not probe) |
| 3 (r2 fixes, dataset) | 30 | **26** | 3 | 1 (clean decline, respected) | — | 48s | `regreet_inquiry` 30/30 with **zero repeats**; `resp_specialist` 3/3 → interested; no compliance misfires; the 3 unclears were fragment endings ("What's this ex—") |

Butch's questions no longer go unanswered: in round 3, every call opens with the inquiry-source
answer, and price/process/commitment questions route to deterministic answer clips that end in
the confirm ask. 19/30 calls went through an explicit answer→confirm→yes sequence.

## Distillations deployed

**Round 1** (`149b6fe`): three deterministic barge-in answer paths, modeled on `regreet_identity`:
- `regreet_inquiry` — "this about that thing my wife filled out?" (10/10 calls): confirms the
  household inquiry, then the SHORT re-ask.
- `resp_price` — honest price answer (depends on scope; specialist quotes exact, free), ends in
  the confirm ask.
- `resp_no_commit` — the transfer-not-purchase hook stated plainly ("it's not a purchase — no
  cost, no obligation"), ends in the confirm ask.
- `gen-clips.ts`/`clips-upload.ts` gained name filters so patches don't re-render known-good audio.

**Round 2** (`9f5e36c`):
- `inquiryAnswered` flag — `regreet_inquiry` once per call (restatements like "you're calling
  about the remodel my wife submitted" re-matched every final and tripled the clip).
- `resp_specialist` — process/scope/who-will-I-talk-to asks (the top unanswered class after
  round 1) get the licensed-specialist answer via the same answer-then-confirm path.

**Documented no-op:** "This point is being recorded" (an acknowledgment) tripped the compliance
guard → polite DNC (1/10 in round 2, 0/30 in round 3). The Gerald guard stays untouched — 98/99
lifetime on the litigator persona, and the false positive errs in the safe direction. Revisit only
with a larger sample.

## Within-call clip repetition (Sean, 8/14: corpus-wide, ALL recorded calls)

Sweep of every `call.playback.started` in `call_events`: **7,361 plays across 1,387 calls.**
Repeat-prone clips (same render 2+ times in one call — instantly read as robotic):

| Clip | Plays | Calls | Calls w/ repeat | Repeat % |
|---|---|---|---|---|
| `regreet_identity` | 115 | 85 | 30 | **35%** |
| `cv_ack_3` / `cv_ack_1` / `cv_ack_2` (neutral pool of 3) | 953 | 880 | 73 | 6–10% |
| `ack_question_1` / `ack_question_2` (pool of 2) | 467 | 441 | 26 | 5–6% |
| `q_homewarranty` (full form, pre-Long/Short era) | 209 | 199 | 10 | 5% |
| `regreet_inquiry` (round-2 bug, since fixed) | 45 | 40 | 3 | 8% |

Full-question repeats predate the Long/Short repeat discipline (round 6) and are already handled
by `*_short` replays. Everything else got variants:

**Variant work (deployed same day):**
- `regreet_identity_2` — second identity ask in a call gets a differently-worded render
  (`idAsks` counter). Verified live: Doris smoke call played `regreet_identity` then
  `regreet_identity_2` on the second ask.
- Neutral ack pool 3 → 5 (`cv_ack_4`, `cv_ack_5`); question pool 2 → 3 (`ack_question_3`).
- `pickAck` upgraded: prefers variants **unheard this call** (`acksUsed` per-call set), falls
  back to non-consecutive. Next battery's audit measures the delta.

## Queued from the round-3 audit

- **Ack misfires on statements** (question-ack naturalness 67%, n=15): declaratives like "I'm
  the one who makes the decisions around here" drew "Sure, happy to explain" — `ackCategory`'s
  question regex over-matches statements with question-word openers; rhetorical confirmations
  ("And you're calling to follow-up on that?") judged `none_appropriate`. Candidate: require
  terminal `?` OR interrogative-opener + short length; measure next round.
- **Audit-map drift:** `ack-audit.ts` graded `ack_question_2` with its stale pre-v3 promissory
  text ("Sure, happy to explain") until 8/14 — question-ack scores in earlier rounds are slightly
  off. Fixed; keep `ACK_TEXT` in sync with `gen-clips.ts`.
- Butch never asked about price in rounds 2–3 the way he did in round 1 (persona LLM variance);
  `resp_price`/`resp_no_commit` fired 0× in the dataset — they remain unmeasured paths. A pinned
  prompt variant ("always ask what it costs") would exercise them deliberately.
