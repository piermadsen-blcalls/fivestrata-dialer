# Persona soak test — 150 calls, 2026-08-11

30 calls × 5 synthetic personas (curmudgeon, wishy-washy, talker, confused elder, normal
detail-seeker), verticals rotated, agent-vs-agent over real telephony (`scripts/persona-batch.ts`;
analysis: `scripts/persona-analyze.ts`; raw log `C:\Claude\scratch\persona-batch.jsonl`; full
traces in `call_events`).

## Headline numbers

- **150/150 calls completed cleanly** — zero timeouts, zero stuck calls, zero dial failures.
  The CAS state machine held at volume.
- **Avg 53s/call (37–84s); ~2.7¢/call all-in** (both legs + dual transcription + TTS + LLM).
- Decline machinery at volume: curmudgeon reached the polite opt-out **25/30**; 2 genuine
  barge-ins (mid-clip decline → playback cancelled) fired correctly.

## Outcome matrix (persona → final response)

| Persona | Right ending | Got it | Notes |
|---|---|---|---|
| curmudgeon | opt-out | **25/30** | 3 unclear, 2 none — best-behaved path |
| wishy_washy | unclear | **22/30** | 8 scored "interested" — LLM over-credits hedgers |
| talker | unclear (today) | 24/30 | needs a *steer/re-ask* capability, not a better guess |
| confused_elder | (no right answer yet) | 24 unclear, 5 none | needs *repeat/identity* clips — see backlog #1 |
| normal | interested | **13/30** ⚠️ | 15 landed unclear — detail questions read as ambiguity |

## The rebuttal backlog (what callers actually said, ranked)

1. **"Who is this (again)? / how did you get my number?" — ~67 occurrences.** The #1 gap by
   a mile. The production workbooks script these verbatim (R21 caller-ID, R22 your-name,
   R24 how-got-number, R27 who's-calling) — record these clips first, plus the Intro-Repeat
   discipline (every script has Long/Short repeat forms for exactly this).
2. **"What do you want / what are you selling?" (~21×)** → R1 why-calling clip.
3. **Price range (~14×) and financing (several)** → R10 how-much clip — needs business
   content sign-off, not just recording.
4. **"How are you today?" pleasantries (6×)** → R38/R39 clips.
5. Amusing artifact worth keeping: personas repeatedly heard "Claire" as **"clear"**
   ("who is *clear* and how did you get my number?") — name choice interacts with telephony
   STT; test agent names for transcribability.

## Prioritized improvements

| # | Change | Evidence | Effort |
|---|---|---|---|
| P1 | Identity/repeat handling: detect who-is-this/repeat asks → replay identity clip (R22/R27) and re-ask | 67 occurrences; confused_elder essentially unservable without it | clips + one branch |
| P2 | Interest-prompt fix: detail questions (price/timeline/financing) = **engaged**, not unclear | normal persona at 13/30 vs target ~28/30 | prompt-only |
| P3 | Steer/re-ask clip after an unclear turn ("Totally understand — but just quickly…", the R37 deferment pattern) instead of giving up to goodbye | talker 24/30 unclear, wishy_washy 22/30 | clips + one branch |
| P4 | Broaden hostility patterns ("telemarketer", "scam", "selling") → sorry-ack + earlier opt-out offer | sorry-ack fired once in 30 hostile calls | pattern list |
| P5 | R10 price/financing content | 14+ asks | business input (Ashley/Kinsey-successor) |

Ack alignment audit: neutral 194 / question 52 / soft 28 / sorry 1 / positive 0. The question
category is earning its keep; positive never fired because personas rarely answer with a bare
"yes" (real callers will); sorry under-fires per P4.

## Round 2 — 120 calls (20/persona incl. hobby_litigator), 8/11 evening

Post-improvement rerun (commit `7cf15f2`: no-ack-on-fragments, pleasantry category, hostility
priority, P2 interest prompt, P4 hostility lexicon, a-priori compliance guard). Stopped at 120
of the planned 240: the wallet went genuinely negative (–$1.25) — Telnyx then **disabled AI
inference on the account**, which also blocks the ack re-audit until top-up.

**Outcome deltas (right-ending rate):**

| Persona | Round 1 | Round 2 | Δ |
|---|---|---|---|
| curmudgeon → opt-out | 83% | **95%** (20/21) | +12 |
| normal → interested | 43% | **65%** (13/20) | **+22 — the P2 prompt fix** |
| talker → unclear | 80% | 90% | +10 |
| **hobby_litigator → compliance** | — | **95% (19/20)** | a-priori guard holds |
| wishy_washy | 73% unclear | 43% unclear, 48% interested | P2 side-effect: hedgers now over-credited as engaged — needs a hedge-vs-question distinction in the prompt |

**Ack diversity** (runtime heuristics, no LLM needed): round 1 was a 194-neutral monoculture
with 0 positive / 1 sorry; round 2 spread to neutral 77 · question 30 · soft 14 · positive 9 ·
pleasantry 9 · sorry 8. Formal naturalness re-score pending inference re-enable.

**Backlog check:** "who is this again?" still #1 (32×) — P1 identity/repeat clips remain the
top unimplemented item. New entrant: Gerald's consent probes now appear in the question log —
correctly answered by the compliance path, not clips.

**Caveats:** last few calls may have run with degraded LLM (inference died as the balance went
negative; `chooseClip` falls back to unclear). Balance guard now debounces hold-dips but the
floor needs raising (holds outran the $2 floor between checks) — real spend ≈ 4¢/call all-in.

## Method note

This is the platform's optimization loop demonstrated end-to-end: synthetic adversarial
callers → per-turn fact stream → ranked, evidence-based clip backlog — for ~$4 total. The
same analysis runs unchanged on real-caller traffic at pilot.
