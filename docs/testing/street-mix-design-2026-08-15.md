# Street-mix battery design — 2026-08-15

Sean's brief: ~4-hour run, variety of caller types, **a more realistic traffic taste**
without losing deep analysis; plus a degraded-call *spectrum* (latency, confused
turn-taking) that is a channel condition, not a persona. Concern: the bench's
prototypical answerers at equal frequency overfit Claire to a world that doesn't exist —
real conversion is ~1%, "2% would be godlike, 3% would be fraud."

## The denominator point (why the deck isn't 1% Marias)

The 1% lives on a **per-dial** denominator — and most dials are no-answers, voicemail,
IVAs, and disconnects that this bench doesn't simulate (the conversation engine never
sees them). The bench's unit is an **answered conversation**. At a 10–20% real-contact
rate, 1% per dial ≈ 5–10% per conversation. The clean street arm runs **8% convertible**
— street-plausible on the right denominator, not fraud.

## Stratified two-arm deck (200 calls, seeded shuffle, `scripts/persona-mix.ts`)

**Clean street arm (135):** brief_decliner 25 · busy_brushoff 20 · wrong_person 10 ·
curmudgeon 12 · talker 18 · confused_elder 12 · wishy_washy 12 · price_shopper 12 ·
hobby_litigator 3 · **Maria 6 · Butch 5** (8% convertible).

**Degraded-line arm, `+lag` (65):** brief_decliner 10 · busy_brushoff 8 · talker 10 ·
confused_elder 10 · wishy_washy 7 · price_shopper 8 · **Maria 7 · Butch 5**. Buyers
deliberately oversampled (18%): *a convertible on a bad line is the money question* —
does latency cost us Marias? This arm is diagnostic, not a realism sample; keep it out
of topline rates.

**How this resolves realism-vs-analysis:** topline metrics (transfers per 100
conversations, transfer precision, kill economics) read from the clean arm at street
frequencies; per-persona regression tracking keeps statistical teeth through fixed
quotas; rare-event analysis (buyer loss on bad lines) gets its n through deliberate
oversampling in a quarantined arm. Analyze strata separately; never average across arms.

## New street personas (in telnyx-agent)

- **brief_decliner (Tom)** — polite fast clean no. Tests: decline path speed, no
  false engagement. The most common real answer type.
- **busy_brushoff (Renee)** — "can't talk right now, call me back." Tests: graceful
  exit, no steamrolling a rushed caller.
- **wrong_person (Gary)** — "you've got the wrong number," asks off-list. Tests:
  inquiry-source handling, DNC-adjacent wrap-up.
- **price_shopper (Linda)** — engaged product questions, zero transfer intent, deflects
  commitment. **The precision stressor**: engagement-anchored rules want to transfer
  her; ground truth says no. Also un-killable by design (engagement veto) — she's the
  tax the asymmetry mandate accepts.

## Degraded-line spectrum (`+lag` modifier, not a persona)

Persona key `name+lag` runs the same person through a bad-line simulator in the persona
leg: +2.5–6.5s response latency on every turn, and 35% of turns delivered as two
fragments with a real gap (separate Deepgram finals — the fragment-buffering stressor
real cell calls produce).

**Claire-side telemetry (new):** `viabilityTick` now logs `chanGapMs` — median
clip-end → caller-final gap — on every tick, *including vetoed (engaged) callers*, as
`aicc.viability` events. This is the flag a future adaptive mode keys on (extend
confirm/fallback windows, slow the pace, re-confirm more on flagged calls). This
battery measures the damage a bad line does to current fixed windows; adaptation is
deliberately NOT in this run so we get a clean baseline.

## What to read from the results

1. **Clean-arm topline:** transfers/100 conversations; precision = intended transfers ÷
   all transfers (fake-transfer complement); time per conversation; kill rate + seconds
   saved on wasters.
2. **Convertible integrity:** Maria/Butch conversion, clean vs `+lag` — the delta is
   the cost of latency under fixed windows.
3. **price_shopper column:** how often engagement rules transfer a no-intent shopper —
   the honest ceiling on precision under the current buyer-favoring asymmetry.
4. **chanGapMs distributions:** clean vs `+lag` arms — validates the detector before
   any adaptive logic gets built on it.
