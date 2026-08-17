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

## Full battery (150 calls, seed 819, `windows` deck)

*(results below)*
