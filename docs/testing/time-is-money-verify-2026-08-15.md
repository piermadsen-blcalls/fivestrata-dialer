# Regression fixes + verification batteries — 2026-08-15

Follow-up to `time-is-money-2026-08-14.md`: both flagged regressions autopsied, fixed,
and verified the same night. Root-cause narrative is in that doc's "Autopsy verdicts"
section; this doc records the fix waves and the measurements.

## Fix wave 1 — the confirm-window race (Maria's 20/30 dip)

- 15s unclear-timer arms on `playback.ended` of the answer clip
  (`resp_price`/`resp_no_commit`/`resp_specialist`/`confirm_interest`), not at play start —
  `resp_price` runs ~12s and left ~3s to answer. Play-start arms demoted to 45s
  lost-webhook backstops.
- Price/commitment/process interceptor requires `speech_final` — no more `playback_stop`
  stomps mid-turn; non-endpointed asks fall through to the pre-Butch buffer/judge path.
- `speech_final=false` finals in `confirm_listen` buffer into `pending` instead of
  vanishing.
- `isPriceAsk` requires ask-shape (fake-transfer hygiene: a rambler's "everything's so
  expensive these days" no longer burns the confirm slot).
- `chooseClip` 70B prompt excludes rhetorical/storytelling questions from engagement.
- Confirm yes-forms gain the "go ahead / sounds good / that works / set it up" family.
- Timeout judges the freshest buffered turn (`judgeConfirm`, extracted) before bailing
  unclear.

**Battery (55 calls): Maria 24/24** `resp_interested` (clean sample; see contamination
note), **talker fake transfers 9/20 → 1/15**, but **Butch dipped 8/10 → 5/10.**

## Fix wave 2 — the landed-gate (Butch's dip, same steamroll, different door)

Trace evidence (`scripts/call-trace.ts`, butch n=1/4/5): Butch reacts DURING
`resp_specialist` with endpointed finals; the live confirm read judged those **pre-ask
reactions** ("You're not going to tell me what this is about, are you?"), queued
`cv_resp_unclear`+goodbye behind the still-playing clip, and Butch never got to answer
the ask he hadn't heard yet.

- New `confirmAskLanded` state flag: **nothing is judged until the answer/confirm clip
  finishes playing** — everything said during the clip buffers.
- At clip end: a decisively-buffered answer (judges yes/no) responds immediately; an
  unclear buffer keeps listening with the full 15s window.
- `judgeConfirm` also reads anchored yes/no against the LAST buffered segment
  (accumulation buries sentence-initial "Yeah, alright" mid-string).

**Re-verify battery (20 calls): Butch 10/10, Maria 10/10.**

## Post-fix scoreboard

| persona | before (8/14 tim battery) | after |
|---|---|---|
| Maria (must-transfer) | 20/30 | **34/34** (24/24 + 10/10) |
| Butch (must-transfer) | 8/10 | **10/10** (after wave 2; wave 1 alone: 5/10) |
| talker (fake transfers) | 9/20 interested | **1/15** |

## Fix wave 3 — the sword actually swings (stateless streak)

The wave-1 battery revealed the retuned kill path had **never fired**: 70 low ticks on
talker, streak never passed 2, the 70B judge invoked ZERO times. Cause: `lowStreak` lived
in per-isolate MEM and edge isolate churn reset it between webhooks — the v1 comment
("an isolate miss resets it — biases against killing") was true and fatal. Fix: the
streak now derives from the call's own `aicc.viability` trail in `call_events` (the log
IS the state); a logged judge event resets it (any judge in the trail was a CONTINUE).
Concurrent-tick races undercount → still biased against killing.

**Sword battery (20 calls): 8/15 wasters killed** (talker 5/8, confused_elder 3/7) at
avg kill age 33–36s — ~21s saved per killed call vs the kept-waster baseline, plus
carrier minutes. **0 false positives: Butch (the flat-20 trap) 0/5 killed, 4/5
transferred.** First live `exit_disengage` fires ever. Residual fake transfers 2/15
(one talker, one elder) — consistent with the ~7% floor, watch not chase.
Log: `scratch/persona-sword-8-15.jsonl`.

## Battery-hygiene finding (process, not agent)

The first battery's Maria n=1–6 were **discarded as contaminated**: a leftover
persona-batch process from the parallel 8/14 session was still dialing (mixed verticals
visible in `call_events` 08:04–08:11Z) and the single `persona_next` selector slot races
across concurrent dialers. **Before any battery: check for running persona-batch
processes** (`Get-CimInstance Win32_Process -Filter "Name='node.exe'"`). The leftover
also raced the live-log rotation — 6 lines lost from `persona-batch.jsonl`.

## Ack-improvement loop (standing policy)

70B audit run on the 55-call battery. Two miss classes, neither structural:
(1) audit-pairing artifact — Maria's greeting line paired with the question-ack that
correctly answered her NEXT utterance; (2) the known round-4 residue — neutral acks on
mid-ramble pauses Deepgram endpoints as `speech_final=true` (talker only, cosmetic).
No clip or heuristic changes this round.

## Logs

- `scratch/persona-verify-8-15.jsonl` (wave-1 battery, 49 logged/55 dialed)
- `scratch/persona-verify-8-15-r2.jsonl` (wave-2 re-verify, 20 calls)
- `scratch/battery-8-15-verify.out`, `battery-8-15-butch-r2.out` (runner output)
