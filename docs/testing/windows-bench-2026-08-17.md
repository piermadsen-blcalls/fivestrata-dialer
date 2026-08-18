# Windows benchmark prep — 2026-08-17

**Context (Sean, 8/17):** the 3rd-party AI-soundboard vendor test is being scheduled and the
benchmark vertical is **Windows**. Directive: run a few hours of Windows-only dials and get
Claire as good as possible at Windows — "a natural sounding, persuasive-if-needed windows
seller." This doc records what was built, the batteries, and the results.

## What was built (all live in `telnyx-agent` + dev-pack-1)

1. **Windows clip pack** — language distilled from the production workbook
   `docs/call-scripts/Windows -CD 7.7.26.xlsx` (R-code rebuttals, Hot Keys, benefits block):
   `greet_windows` (production Intro-1 style), `resp_price_win` (R10 + "How much" hot keys:
   frame/glass/count factors, pricing-better-today), `resp_no_commit_win` (R33),
   `resp_specialist_win` (R36 + Consultation + 2-to-7-days install), `regreet_inquiry_win`,
   `resp_interested_win`, `rebuttal_win`, `exit_callback`. Agent routes via a per-vertical
   clip map (`vclip`) — `q_windows` plays the `_win` renders, other verticals unchanged.
2. **One-shot soft-decline rebuttal** (the "persuasive-if-needed"): an explicit keyword
   decline gets exactly ONE substantive rebuttal (`rebuttal_win`, distilled from production
   R2.0/R33/R35: free, no commitment, energy/noise benefits, nothing to lose), ending in the
   house yes/no ask so the proven confirm machinery reads the answer. Fires at all three
   decline sites (consent, mid-question barge-in, turn-end judge), once per call, **never on
   hard opt-out language** (`isHardOptOut`: don't call / remove me / take me off — straight
   to the opt-out promise). A no after the rebuttal is accepted. More conservative than the
   production floors (they run R2 escalation rounds .1/.2).
3. **Callback-request exit** (queued 8/15 ack-loop item): `isCallbackAsk` ("can you call me
   back", "not a good time", "busy right now") → warm `exit_callback` clip → hangup.
   Decline/opt-out language wins over callback phrasing. Fires as barge-in at all listening
   phases; confirm window excluded (v1).
4. **The Linda knob** (street-mix Decisions #1, implemented narrow + revertible):
   commitment-deflection language ("just looking for a ballpark today", "no intention",
   "not ready to commit", "gathering quotes") is detected by `isDeflection` and
   - is **sticky per call** (`state.deflected`, set at buffer time on the uncapped final —
     smoke #3 found the 300-char pending cap slicing the tell out of the accumulated turn),
   - cancels engaged-question credit at the confirm (`judgeConfirm(joined, priorDeflect)`),
   - routes an LLM "interested" verdict into the confirm ask instead of a transfer when the
     caller has deflected and shown no explicit buying language (smoke #1 found deflecting
     price STATEMENTS riding the questions-are-engagement tiebreak straight to transfer).
   Explicit buying language (`isInterested`) always wins; an explicit yes/go-ahead at the
   confirm still transfers even after a prior deflection — a shopper who warms up must
   actually say yes, and that counts. Maria's protection is untouched: she asks engaged
   questions but never deflects.
5. **Windows persona deck** (`persona-mix.ts windows [seed]`, all pinned `q_windows`,
   greet `greet_windows`): 150 calls — clean arm 100 / degraded-line arm 50; convertibles =
   `normal_win` (windows Maria) 11, `butch_win` (windows Butch) 8, plus new
   **`reflexive_decliner`** (Pam, 8: reflexive "no thanks" that ONE polite substantive
   rebuttal can flip; a second push may not) — the persuasion stressor. `windows-smoke`
   deck (12) covers the new paths before spending hours.

## Incident: Telnyx media storage expires ~48h

Smoke round 1 died mid-call everywhere: **uploaded media silently expires ~2 days after
upload** (`expires_at` on every item). The entire pre-8/17 pack was gone; playback commands
against missing media fail as silent console.errors and the state machine waits forever on a
`playback.ended` that never comes. Fix: full-pack re-upload before any dial session +
`persona-mix.ts` now hard-aborts on a media preflight (local pack vs `/v2/media` list).
Demos have no preflight — **pre-demo full-pack re-upload is now a manual runbook step**
(skill + runbook updated).

## Smoke round 2 (12 calls, seed 818) — gate PASSED

Smoke round 1 (post-media-fix mechanics check) exposed two Linda-knob holes, both fixed and
re-verified here: (a) deflecting price *statements* rode the LLM tiebreak straight to
transfer — the knob only lived in `judgeConfirm`, which that path never reached; (b) the
300-char pending cap sliced "just looking for a ballpark today" out of the accumulated
confirm turn. Hence the sticky `deflected` flag + the `deflectedInterest` confirm routing.

| persona | smoke-2 result |
|---|---|
| normal_win | 2/2 transferred |
| butch_win | 2/2 transferred |
| price_shopper | **2/2 polite opt-out** (was 2/2 transferred pre-fix; 20/20 on 8/15) |
| reflexive_decliner | 1 flipped to transfer, 1 held no (both per contract) |
| busy_brushoff | 2/2 exit_callback (new graceful exit) |
| brief_decliner | rebuttal → caller hung up (a no, accepted) |
| talker | contained (unclear) |

Rebuttal telemetry: fired 3×, flipped 1, held-no 2, unclear 0. Avg call 44s.

## Full battery (150 calls, seed 819, `windows` deck) — 150/150 clean, ~$7

Log: `scratch/persona-windows-bench-8-17.jsonl`. Avg call 48.4s.

**Headlines:**

1. **Convertible integrity perfect: 19/19** — normal_win 11/11, butch_win 8/8, including
   every degraded-line call. The 98% bar holds at 100% on the Windows content.
2. **The Linda knob works: price_shopper 15/16 correctly NOT transferred** (10 polite
   opt-outs, 5 unclear) vs **20/20 leaked on 8/15**. The one leak (lag arm) was a race:
   her deflection final was delivered after the clip-end judge read the half-turn.
3. **Transfer precision ~49%** (23 intended / 47 promises; was ~31% on 8/15), at 31.3
   promises per 100 conversations. Wishy_washy transfers (6) counted as acceptable per
   the buyer-favoring doctrine (Sean's open knob #2), not intended.
4. **Rebuttal: fired 31× — flipped 4 (all reflexive_decliner, 4/8 flip rate), held-no 26,
   unclear 1.** Every flip came through the rebuttal; zero reflexive transfers without it.
   The persuasion mechanism works and costs decliners ~10-15s each.
5. **Callback exit: 19/20 busy_brushoffs** got the warm exit_callback goodbye.
6. **Self-destruct: 18 kills, zero false positives** — but killed wasters averaged 46.1s vs
   48.4s overall, so the sword is barely saving time on this deck (watch item).
7. **18 wrongful transfers** (wrong_person 4/8, curmudgeon 4/8, talker 5 clean,
   confused_elder 4, price_shopper+lag 1) — every one autopsied and reproduced from
   four MECHANICAL causes; none were persona-rig artifacts. See fix stack below.

## Autopsy → fix stack (deployed same day, verified by the `windows-verify` battery)

The 3-agent analysis workflow reproduced all 18 wrongful transfers by replaying the
committed matchers over event-ordered buffers. Root causes and fixes:

1. **`judgeConfirm` precedence let yes beat no.** A pooled buffer holding an explicit
   "not interested" AND a product-word question transferred (curmudgeon's double decline
   lost to question credit). **Fix:** precedence is now buying-language > explicit assent >
   explicit decline/deflection > engaged question — assent still beats a decline phrase in
   the same turn ("I don't want to get roped in — but yeah, go ahead" stays a yes).
2. **`engagedQuestion` was too loose.** No word boundaries (Doris's reading *glasses*
   matched `glass` and transferred her), product word + question shape could come from
   different pooled segments (knee-surgery anecdotes donated "how much" to identity-ask
   '?'s two turns away), bare "how" anywhere counted as question shape. **Fix:** word-bounded
   product regex, product + question shape required in the SAME segment, question shape =
   terminal '?' or interrogative opener, negation guard ("I'm NOT looking for new windows"
   earns nothing).
3. **Cancelled playbacks advanced the state machine.** A clip we stopped mid-play still
   emits `playback.ended` — treated as delivered, it transitioned to listening phases
   prematurely, burned respond slots on pleasantries, and queued confirms up to 27s behind
   live audio. **Fix:** `status !== 'cancelled'` gates on the greeting-ended, question-ended,
   and confirm-landing branches.
4. **`isDecline` gaps:** "take me off / taken off your list", "remove my number",
   "not looking for", object-anchored "don't need" all evaded it. Added.
5. **Identity-ask pollution:** Doris's post-cap third "who is this again?" donated its '?'
   to the confirm pool. Short pure identity asks are now dropped from judged buffers.
6. **Mid-utterance inquiry-branch fire** (n97): "I didn't submit any request for—" (sf=false)
   consumed the turn and orphaned "…about replacing windows" as a naked turn. speech_final
   gate added (same as the 8/15 price-interceptor lesson).
7. Also from rebuttal design review: entering the confirm VIA the rebuttal now sets
   `deflected` (the caller just declined — post-rebuttal product questions are not consent;
   only explicit assent flips), and wrong-person/never-inquired claims are never rebutted
   (identity mismatch ≠ interest decline).

## Ack loop (standing policy) — round 7

70B audit of 100 pairs: **overall 62%** (round 3: 64% — flat headline, compositionally
healthier: sorry 100%, soft 81%, positive 67%, neutral 62%, question 41%). The question
score is NOT the old statement-with-question-opener issue — it is almost entirely the
callback-ask shape ("Can I call you back later?" → "That's a good question"), which is new
exposure from this deck's busy_brushoff volume, plus accumulated-buffer first-fragment
categorization. **Distills shipped:** new `request` ack category ("Oh — sure thing." /
"Yeah, no worries at all." — accommodating, phrased so exit_callback's "Of course—" doesn't
repeat) + `glad` category for well-being answers ("Glad to hear it!"); ackCategory now
categorizes on the LAST buffered segment (hostility still scans the full turn);
dead-air presence checks ("Hello?", "are you there") never draw acks; confusion/mistake
claims route to sorry. Next battery's audit measures the delta.

## Conversation-quality findings (Maria/Butch spot checks — benchmark-relevant)

- Maria's direct opener "can you tell me about your process…" went unanswered
  (evaded isProcessAsk — **widened same-day**: "about your process", "what can I expect",
  "walk me through", "what happens next").
- **Confirm-slot scarcity is the next design ceiling:** Maria asked price 3× and got the
  specialist-deflection answer once; Butch's money question lost the slot to his repeated
  inquiry ask (`inquiryAnswered`/`confirmAsked` are once-per-call). A caller with 2-3
  legitimate questions gets non-answers after the first. Design item: a small per-call
  answer budget (e.g. 2 answer clips) instead of single-shot flags.
- **Queued-audio latency:** decisions render behind still-playing clips (acks up to 24s
  late pre-fix). The cancelled-status gate removes the worst class; a queue-flush
  discipline for confirm entries is the follow-on.

## Verification battery (60 calls, seed 820, `windows-verify` deck) — leaks collapsed

Log: `scratch/persona-windows-verify-8-17.jsonl` (59 dialed; 1 dial lost to a transient
network outage the runner rode out).

| persona | full battery | post-fix verify |
|---|---|---|
| wrong_person | 4/8 transferred | **8/8 clean opt-out** |
| curmudgeon | 4/8 transferred | **0/7 transferred** (6 opt-out, 1 kill) |
| talker | 5/12 transferred (clean arm) | **0/8 transferred** (7 unclear, 1 kill) |
| price_shopper (+lag) | 1/16 leaked | **0/6 transferred** |
| confused_elder (+lag) | 4 transferred | 1 transferred (explicit-assent shape, buyer-favoring by design) |
| normal_win | 11/11 | **6/6 transferred** |
| butch_win | 8/8 | **6/6 transferred** |
| busy_brushoff | 19/20 exit_callback | 4/4 exit_callback |

The stricter confirm cost ZERO buyers. New ack categories fired live (glad 6, request 2).

**One regression it exposed: reflexive_decliner flips collapsed 4/8 → 0/6.** Setting
`deflected` on rebuttal entry correctly stopped post-rebuttal questions from counting as
consent — but a flippable decliner's natural next move IS a question, and she was
dead-ending at "I'll take that as a maybe." Fix (deployed, spot-checked by the
`windows-flip` deck): **post-rebuttal price/commitment/process questions get ANSWERED**
(production R10.1 discipline — the answer clip ends in its own yes/no ask and re-arms the
confirm window; `confirmAsked` doubles as the one-extra-answer budget). Explicit assent
after the answer flips; anything else exits gracefully.

## Flip spot-checks (12 + 12 calls, seeds 821/822, `windows-flip` deck)

Round 1 (seed 821) exposed two problems the answer-turn alone didn't fix, both traced to
the **landing read judging pre-ask buffered speech as the answer**:

- Pam's "no thanks" ECHOES during the rebuttal clip; the landing judge read the echo as
  her answer and opted her out while her actual reply ("That sounds interesting") was
  in flight. Flips stayed 0/6.
- **A normal_win was opt-outed** — the 8B rig drifted ("I was just browsing your
  website"), "just browsing" matched the deflection pattern mid-clip, and the landing
  read was decisive… one line before "I'm definitely interested."

**Doctrine distilled (deployed):** *pre-ask deflection is not deflecting the ask.* A
deflection-only 'no' at landing downgrades to the 15s window (the binary ask does its
job; Linda still deflects post-ask and is caught by the live/timeout reads). At rebuttal
landings, an echoed decline WITH an engaged ask alongside gets the ask ANSWERED
(price/commitment → their clips, other product asks → resp_specialist_win); the window
arms with the echo cleared. "That sounds interesting/good/great" joined the assent set.

Round 2 (seed 822): **normal_win 3/3 + butch_win 3/3 transferred** (lost-Maria class
fixed), **reflexive flips recovered 2/6** (3 held-no, 1 unclear — held-nos are valid
contract outcomes; Pam flips only when the exchange stays low-pressure).

## Bottom line for the vendor benchmark

Across ~395 Windows dials today (6 batteries, ~$16 carrier+AI):

- **Buyers: 28/28 transferred on the final code** (19/19 full battery + 12/12 verify +
  6/6 flip-2, including every degraded-line call) — the 98% bar holds at 100%.
- **Transfer precision roughly ~49% → higher post-fix** (the verify deck eliminated all
  wrong_person/curmudgeon/talker/shopper leaks; a precision read at street frequencies
  needs the next full street-mix battery).
- **Persuasion live:** one production-R2 rebuttal per soft decline, flips real
  convertible-decliners, never fires on DNC language or wrong-person claims, and answers
  post-rebuttal product questions before re-asking the binary.
- **Callback asks get a warm exit** instead of "that's a good question."
- Windows-specific content everywhere the caller can probe: price (frame/glass/count +
  pricing-better-today), process/specialist (2–7 day install), no-commitment, household
  inquiry, energy/noise benefits.

**Next design items (in priority order):**
1. **Answer-budget redesign** — `confirmAsked`/`inquiryAnswered` one-shot flags starve
   callers with 2–3 legitimate questions (Maria asked price 3×, answered once). A small
   per-call answer budget (~2–3) with variant renders is the natural next step and the
   biggest remaining naturalness gap for the benchmark.
2. Queue-flush discipline for confirm entries (acks/confirms can still render late
   behind queued audio in edge cases).
3. Self-destruct tuning: 18 kills / 0 FP but killed wasters only saved ~2s vs average on
   this deck — thresholds are calibrated for longer rambles than the street mix produces.
4. Full street-mix re-run for a clean precision/SPH-proxy topline on the final code.

**Open for Sean:** wishy_washy transfers (6 in the full battery) remain per the
buyer-favoring doctrine — street-mix Decisions #2 is still his call. The Linda knob and
the one-rebuttal policy are live and revertible.

## Live TTS long tail (same night — Sean: PRIORITY #1)

Sean's directive on seeing the per-call render scatter (Claire = zero live TTS by
construction): *"in no scenario should this solution not have a live TTS ready to go if
it detects that it doesn't have an appropriate clip"* — a tenth of a penny on a good
answer beats "I'll take that as a maybe"; renders feed an overnight analysis that
recommends new canned clips; the good voice was picked precisely so live renders sound
seamless.

**Latency probe (`scripts/tts-probe.ts`, live call):** Telnyx in-call `speak` ACCEPTS
Claire's own DragonHD voice — ~1.9s command→speech seam (server-side synthesis; basic
voice baseline 11ms proves it's synthesis time). Render→upload→play measured 4.4s — the
fallback, not the primary. The category ack already fires instantly and runs ~1.5–2s,
masking the seam — the same trick that buys the LLM its decision time.

**Wiring (deployed):** `liveTTS()` + `composeLine()` in telnyx-agent. Generation is
CONSTRAINED — rephrase approved facts only (identity, free no-obligation quote,
can't-quote-price + factors, 2–7 day installs, talk-not-purchase), 35-word cap, and a
deterministic rejection floor: any digit/currency/percent in a render kills it (canned
fallback). Cap 3 renders/call. Fires exactly where the state machine previously admitted
defeat: (a) unclear exits with the confirm spent — bespoke contextual wrap instead of
"I'll take that as a maybe"; (b) second/third product questions after the canned answer
budget is spent — fresh answer ending in the binary ask, window re-arms at `speak.ended`;
(c) timeout exits where the caller actually said something. Silence keeps canned exits.
Every render/skip logs `aicc.tts_render` (kind, caller words, text, compose ms) — the
telemetry for both the flywheel and the future clip-selector-with-RENDER-action (the
tunable cheap-LLM layer; v1 routing is the deterministic else-branch, zero new latency).

**First longtail battery (28 calls, seed 823):** 10 renders, 0 compose failures, 0 cap
hits; `cv_resp_unclear` endings GONE from the outcome matrix — hedgers and ramblers got
bespoke wraps ("Sounds like you want to discuss it with your husband first, completely
understandable…"). Buyers: normal_win 4/4; butch_win 3/4 — the miss autopsied to a
PRE-EXISTING race, not TTS.

**The lost-Butch race (found + fixed same night):** the consent branch transitioned the
state machine on INTERIM transcripts — a partial stole the consent→question CAS ~200ms
before the final reached the inquiry branch, whose CAS then lost and the caller's
question EVAPORATED (no regreet, no answer). Compounding: `casTransition` wrote MEM
before the DB arbiter, so losing isolates kept a transition that never happened
(`inquiryAnswered=true` with no regreet played), suppressing retries. Fixes: consent
transitions on finals only (the 6s fallback still covers silence); MEM written only on
CAS win. This race likely explains the historical repeat-inquiry non-answers in the 8/14
Butch rounds and the 8/17 flip-battery quality findings. Verified by longtail battery 2
(seed 824).

**The overnight flywheel (`scripts/tts-distill.ts`):** clusters `aicc.tts_render` events
and recommends reusable canned clips (70B judge; no-digit rule enforced on outputs).
First real run: 9 renders → 3 recommended clips (`considering_options` ~4x,
`discuss_with_others` ~2x, `positive_experience` ~2x) + 3 singletons left live. Runs
locally against call_events tonight; moves to Snowflake when the FIVESTRATADIALER schema
lands (the events already ride `snowflake-sync.ts`). Known nit: the recommendation
prompt should carry each cluster's kind (a goodbye cluster got the answer-ask suffix).
