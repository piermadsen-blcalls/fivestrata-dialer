# Time-is-money battery — 100 calls, 2026-08-14

**Premise (Sean):** more time on a doomed call = less time dialing the next lead + carrier
spend. Build a self-destruct that ends obvious non-converts early. **Asymmetry mandate:
killing a convertible call is the cardinal sin; a long rambler is merely a tax.**

**Mechanism (deployed, `d890add`):** async P(convert) scoring per caller turn (8B, off the
hot path) → engagement veto (any buying signal ever = never kill) → 2 consecutive scores ≤20
→ 70B "floor-manager" KILL/CONTINUE → CAS kill + graceful `exit_disengage` clip. All ticks
logged as `aicc.viability` events. Audit: `scripts/time-audit.ts`; raw log
`persona-timeismoney.jsonl`.

**Composition:** normal(Maria)×30 + butch×10 = the must-never-kill set; talker×20 +
confused_elder×15 = time-wasters; wishy×15 + curmudgeon×10 = context.

## Results

- **False positives: 0/40.** The design earned it: **Butch scored a flat 20 on every tick**
  — a naive threshold kill would have executed the persuadable purse-holder. Vetoes +
  cautious judge saved every convertible.
- **Kills: 0/100.** The 70B judge, framed "when in any doubt, CONTINUE," found doubt every
  time. All shield, no sword — 35 confirmed time-wasters ran their full ~69s.
- **The score curves separate cleanly** (avg by tick):

  | persona | curve | floor |
  |---|---|---|
  | curmudgeon | 5→5→5→5 | 5 |
  | confused_elder | 7→6→7→5→5→5 | 5 |
  | talker | 7→10→9→10→9→7→7→13 | 7 |
  | **butch (convertible)** | 20→20→20 | **20** |
  | wishy_washy | 17→16→19→31→29→38 | 16 |
  | normal/Maria | 26→23→34→38→62→75 | 23 |

  **No convertible ever scored below 16; no waster ever sustained above 13.** The margin
  hands us the tune: ➤ kill on *sustained ≤12* (3 ticks), keep the 70B judge but reframed
  neutrally ("pragmatic floor manager") as backstop. Sean's collapse-fast prediction:
  confirmed for the signal (wasters identifiable by tick 1, ~30s); the bottleneck was the
  judge's framing, not detection.

## Regressions surfaced (AUTOPSIED + FIXED 8/15 — see verdicts below)

1. **Fake transfers to time-wasters:** talker 9/20, doris 6/15, wishy 5/15, even curmudgeon
   2/10 got `resp_interested`. The engagement lexicon (question marks, price-adjacent words
   in rambles) + confirm-as-soft-close over-credit non-buyers. Costs client goodwill —
   arguably worth more than the seconds the self-destruct saves.
2. **Maria dipped to 20/30 (67%)** in this battery vs 99/100 in proof-3 (same vertical,
   ~1 day apart). Beyond sample noise. Suspects: the 8/14 parallel-session agent changes
   (ack pools/no-repeat picker/tenant backbone) interacting, or list ordering effects.
   Autopsy the 10 unclear calls before any further tuning.

## Autopsy verdicts (8/15)

**Maria's dip was NOT noise and NOT the ack/tenant changes — it was the Butch price-ask
interceptor (`149b6fe`/`9f5e36c`, landed 2h after proof-3) plus a mis-armed timer.** All 10
failures share one signature (`resp_price` present in 10/10; the caller's last transcript a
truncated fragment: "What's the", "I'd", "Sched"):

1. Maria's price question — her *buying signal*, which proof-3 routed to the judge and
   `resp_interested` — now triggers `resp_price`, which **barges in mid-turn**
   (`playback_stop` while her interims were still flowing), truncating her and wiping the
   accumulated `pending` engagement buffer.
2. The 15s unclear-fallback was armed at clip **start**, but `resp_price` runs ~12s
   ("Totally fair question… it depends on scope… specialist puts together an exact quote…
   no obligation… want me to set that up? A quick yes or no is perfect."). The caller had
   ~3s after the ask landed. The persona-leg trace proves the cruelty: **the rig began its
   answer the moment the ask finished (45.6s) and the fallback fired at 45.9s** — the race
   was unwinnable. The 20 passes were the race occasionally being won.
3. Compounding: `speech_final=false` finals in `confirm_listen` were **dropped entirely**
   (not buffered) — "Not at all. Go ahead." vanished; only fragments were held.

**Fix (deployed 8/15):** confirm windows now measure from the ASK, not the clip — the 15s
timer arms on `playback.ended` of `resp_price`/`resp_no_commit`/`resp_specialist`/
`confirm_interest` (play-start arms demoted to 45s lost-webhook backstops); the interceptor
requires `speech_final` (non-endpointed asks fall through to the pre-Butch buffer/judge
path); confirm-window non-endpointed finals buffer into `pending`; "go ahead / sounds good /
that works" join the confirm yes-forms.

**Fake transfers, two cuts on top of the `2877992` product-anchored confirm read (which was
deployed post-battery):** `isPriceAsk` now requires ask-shape (a rambler's "everything's so
expensive these days" no longer burns the confirm slot); the 70B `chooseClip` prompt
explicitly excludes rhetorical/storytelling questions from engagement (Bill's "can you
believe it?" class). The engaged-question tiebreak itself is untouched — it's Maria-critical.

**Verification battery (8/15, post-fix): see `time-is-money-verify-2026-08-15.md`.**

## Time economics (potential, once the sword swings)

35/100 calls were confirmed wasters averaging 69s. A tick-1 kill at ~35s saves ~34s per
waster ≈ 20 minutes of agent line-time per 100 dials, plus the carrier minutes — at human
floors' scale (2M dials/day design point) the same detector, tuned on this data, is a
material line item.
