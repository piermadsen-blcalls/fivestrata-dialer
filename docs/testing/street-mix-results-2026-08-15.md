# Street-mix battery results — 2026-08-15 (200 calls, seed 815)

Design + rationale: `street-mix-design-2026-08-15.md`. Log:
`scratch/persona-streetmix-8-15.jsonl`. All 200 calls completed clean; ~$8 total.

## Headlines

1. **Convertible integrity is perfect, including on bad lines: 23/23.** Maria 13/13
   (6 clean + 7 lagged), Butch 10/10 (5 + 5). Zero killed, zero timed out. The
   landed-gate confirm windows absorb 2.5–6.5s response latency without losing buyers —
   latency does NOT cost us Marias under current fixed windows.
2. **The self-destruct works at street frequencies: 26/50 classified wasters killed**
   (talker/confused_elder), avg 48s killed vs 66s kept (~19s saved each), plus kills on
   lagged brush-offs and wrong-numbers. **Zero false-positive kills.**
3. **Transfer precision at street frequencies is the real finding: ~31%.** The clean
   arm produced 35 transfer promises in 135 conversations (25.9/100); only 11 went to
   true convertibles. The two leak classes:
   - **price_shopper 20/20 transferred (12 clean, 8 lagged).** Linda defeats the
     product-anchored confirm because her behavior IS product-anchored questions — the
     "questions-in-confirm = engagement" rule that guarantees Maria is exactly her
     exploit. Her tell is *deflecting the commitment ask* ("just looking for a
     ballpark"), which Maria never does.
   - **wishy_washy 12/19 transferred.** The buyer-favoring tiebreak converts hedgers.
4. **Fast declines exit clean and cheap:** brief_decliner 35/35 `resp_not_interested`
   at ~29s avg; wrong_person 8/10 clean opt-outs; hobby_litigator 3/3 compliance path.

## Per-persona outcomes (clean arm / lagged arm)

| persona | intended outcome | result |
|---|---|---|
| Maria (normal) | transfer | 6/6 · 7/7 |
| Butch | transfer | 5/5 · 5/5 |
| price_shopper | NO transfer | **12/12 · 8/8 transferred** |
| wishy_washy | no transfer | 8/12 · 4/7 transferred |
| talker | kill/unclear | 1/18 · 3/10 transferred; 26/50 killed (w/ elder) |
| confused_elder | kill/unclear | 1/12 · 0/10 transferred |
| brief_decliner | clean no | 25/25 · 10/10 clean no |
| busy_brushoff | graceful exit | mostly no/unclear; 2/20 · 1/5 transferred |
| wrong_person | opt-out | 8/10 clean, 2 killed |
| curmudgeon | opt-out | 10/12 clean |
| hobby_litigator | compliance | 3/3 |

## Channel detector v1: insufficient (expected — that's why we baselined)

`chanGapMs` (median clip-end → caller-**final** gap): clean median 3.25s vs lag 3.45s;
p90 5.7s vs 6.9s; flagged >4s = 29% clean vs 44% lag. Deepgram final latency (3–5s)
dominates the metric and washes out the injected 2.5–6.5s. **Next iteration: anchor on
first interim (speech onset), not finals.** Second caveat: bench "clean" latency is
rig-inflated (debounce + LLM + TTS), so threshold tuning here would overfit —
calibrate the flag on real-caller recordings before adaptive logic ships.

## Ack loop (standing policy) — distilled items

- **NEW: callback requests are not "good questions."** "Can I call you back later?"
  drew `ack_question` ("That's a good question") repeatedly on busy_brushoff — tone-deaf.
  Queue: a callback-ask matcher routing to a sorry/soft ack or, better, a dedicated
  graceful exit ("Of course — sorry to catch you at a bad time") + clean disposition.
  This is also the biggest UX gap for the busiest real-traffic class.
- Known residue persists: neutral acks on mid-ramble pauses (talker), greeting
  pleasantries occasionally drawing question-acks (audit-pairing artifact in part).

## Decisions this data tees up (Sean)

1. **The Linda knob:** should a caller who deflected the commitment ask earlier in the
   call be required to give an explicit yes at the confirm (no engagedQuestion credit)?
   Fixes the 20/20 shopper leak without touching Maria (she never deflects). Risk:
   a real buyer who once said "just a ballpark" then warms up needs to actually say yes.
2. **Wishy policy:** is a hedger transfer a lead or a goodwill cost? Current asymmetry
   says transfer; 12/19 did.
3. **Whether ~31% precision at 26 transfers/100 conversations is acceptable** for the
   pilot's client-goodwill budget, given human floors also transfer lukewarm callers.
