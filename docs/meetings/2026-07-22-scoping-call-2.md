# Scoping Call 2 — AI Call Center Platform (v2)

2026-07-22, 39m. Attendees: Sean Stott, Pier Madsen, Kinsey Jackson, Ashley Smith, Brandon Titensor, Alex Lin. (Joseph not on this one.)

Follow-up to 7/17. This session walked the scope-doc sections that were **not reached** last time — call-flow/ops mechanics, DID strategy, recordings, KPIs, economics, milestones — and crystallized the platform **must-have list**. Raw transcript: `docs/transcripts/2026-07-22-platform-scope.txt`.

---

## 0. Headline outcomes

Pier's crystallized **must-haves** for the platform (his words, ~24:00):
1. **Results database** — write back as much per-call data as we can.
2. **Call-recording storage** — store as many recordings as we can.
3. **DID management** — buy/rotate/retire DIDs on our own terms.
4. (added throughout) **A/B testing of AI agents and scripts** — tell which agent/script performs better.

Timeline reaffirmed (Pier, ~37:00): a **usable, dial-able platform within ~3 weeks** — not the end state, but enough to test a new vertical through AI and see if it's functional.

## 1. Client positioning — don't lead with "AI" (Kinsey)

- "AI" is a **loaded term** with clients right now; some fear it sets them up for a different kind of lawsuit. American Home Shield is already wary just about *testing* (asking about voice, QC, scripts).
- Strategy: **prove the product quietly at low volume first**, then have the client conversations. If AI beats soundboard, push more volume there; if AI becomes a *different* product (e.g. hot transfer), that's a new sell.
- Aspiration: transition the soundboard floors to AI over ~1 year, performance-gated.
- Big clients ($100K/50K/30K) carry the revenue and the wariness; mom-and-pop shops (~$2K) won't care but don't move the needle. Calibrate rollout accordingly.

## 2. Revive lead intake — endpoint + DB (Pier, Alex, Brandon)

- Easiest existing flow is **KomBea**: Alex uploads the file in Command Center, picks the vertical (bathroom/windows have a cluster sub-tab), tags Ashley for the confirmation email. Revive today = leads extracted from the back end into Excel files, then hand-uploaded in batches — one person has to control the doling-out or we send dupes.
- **Direction:** the platform exposes an **intake endpoint** where revived leads land in a database; from there the dialing schedule/patterns take over.
- Full automation of the revive *source* (making revive live only in the DB so a query auto-feeds the call center) is a **big back-end re-do across all call centers** — deferred. Alex: nice-to-have, not critical just to avoid manual batch upload. Needs a "which leads already went out" feedback loop regardless.

## 3. Dialing patterns & cadence (Pier, Ashley, Sean)

- Today's rules are **very basic**, dictated by the FiveStrata back end and handed to the call center: call ≤2×/day, ≥2 hours apart, a max-attempts cap, a zip-code whitelist, time-zone-aware calling windows. Then it's dead.
- **LIFO vs FIFO**: fresh = LIFO (call newest ASAP); revive = FIFO (finish a revive set before starting the next).
- Ashley wants **data-driven cadence**, not the generic rules — e.g. maybe only call once; or her prior center's rule (never re-call in the same daypart until you've tried the other dayparts). Years of unanalyzed data should tell us the right pattern; if not, the platform lets us **test it**.
- Sean: encode cadence as **standalone testable variables** (hour-gap, time-of-day, wait-time) so batches can run on different patterns head-to-head. Pier: want to assign batch A to pattern 1, batch B to pattern 2, and compare.

## 4. Results DB — every call, separate store (all)

- **Confirmed hard requirement:** record **every single call** (today only DNC + qualified leads write back to FiveStrata; everything else is trapped in the call-center DBs, harvested only every 60–90 days).
- The results DB is a **new, separate database — not written into FiveStrata's current results tables.** It carries a **key (OLeadID)** so it joins back, and data still flows **both ways** to the techss_ back end (dispositions the MDB/dashboards need), but the granular fact stream is its own store.
- Performance: put it on **Snowflake** (the current MySQL is too slow to optimize on); ETL workflows push the call recording to storage and land the row in the DB, keyed to the call.
- Brandon: want a **DID table/view** showing dials + contact rate, updated per call — Sean: can be a **view over the fact table**. Tag **media partner** on every call so we can filter DID/contact performance by media partner (it's on the campaign at lead intake, so we just read it).

## 5. DID management (Pier, Ashley, Sean)

- Telnyx DIDs ≈ **$1 each**, bulk **~60–70¢**. Telnyx has a **number API** — we build programming to retire a number and buy a fresh one in a given area code automatically.
- Telnyx billing = **monthly subscription**: buying commits you to a 30-day price; keep past day 31 and you pay the next month. You *can* swap a number out the next day, but you already paid that month's dollar; buying the replacement is another dollar.
- Ashley's open concern: whether the **carrier** imposes a minimum hold (she's heard "90 days" via JaneTel/other carriers). Brandon: we asked JaneTel and they said no extra charge. JaneTel quoted **~$2,500** (a discount — half of what they charge on TopDial) but that scales with campaigns.
- **Why this is a top win:** DID optimization is exactly a "make the current call centers better" lever. We know the contact-rate benchmarks and when we want swaps; today we can't get carriers to rotate on our terms. The platform lets us **retire DIDs individually** by benchmark instead of rotating whole blocks (some of which are still good). Native ~1,500-dial retirement caps remain the differentiator.

## 6. Contact rate is now a liar — IVAs (Ashley, Pier, Brandon)

- **The problem:** iPhone call-screening / IVAs (Ashley: "you iPhone users are my problem") answer as a robot, screen via text-to-voicemail, and get logged as a **contact** — so contact rate looks high but is garbage. Sometimes the same IVA one-liner hits 10 agents in 10 minutes and hangs up; each agent only sees one, so nobody notices it's not a person.
- Contact rate *was* Ashley's #1 metric and her lever against carriers; it's no longer trustworthy. **Sales-per-contact** is getting distorted the same way.
- **AI IVA detection** is imperfect but "better than nothing." Pier: we may need to stop treating contact rate as *the* moniker of performance and find another view. Sean: **connection rate** may be the more reliable signal.
- Disposition IVAs **immediately on the call** if we can (so data comes through live); otherwise scan recordings later.
- Brandon argued an IVA contact still reflects a customer decision (likely a no anyway); Ashley: not real — keyboard-screening denies a genuine pitch; a lead we could've pitched live gets lost to the screen.
- Twist (Kinsey/Pier/Ashley): **carriers block you if too few calls connect** (looks like spam) → DIDs get corrupted. So IVAs perversely *help* keep the connect ratio up, and spreading dials across dayparts is good hygiene anyway.

## 7. Recordings & storage (Ashley, Sean)

- Storage has always been a pain. Ashley wants **every recording archived** (today: all queue calls downloaded, working toward all completed calls — stalled when Shane left).
- **Legal:** calls must be retained (**5 years**). Failure mode today: a call center swaps carriers, the old carrier's recordings vanish (nobody's paying to keep them) → compliance gap. Ashley raised months ago with Joseph & Cromwel that **FiveStrata should own the backup** regardless.
- Sean: keep a **short hot window (1–2 months)** in a fast store for active analysis (old calls aren't useful for today's decisions), archive the rest cheaply. AI can scan recordings within a reasonable window and adapt what we're doing.

## 8. Dials/hour & pacing — VICIdial assumption doesn't apply (Sean, Kinsey, Pier)

- VICIdial pacing logic exists to keep a **human screener** available for answered calls — you can't over-dial or the screener can't keep up. **We don't need that pacing** (AI answers every call), so we're not bound by it.
- **But** rapid-fire dialing looks like **spam to carriers** → they block us → contact rate falls and DIDs get corrupted (Kinsey/Ashley). So dial speed still needs fine-tuning.
- **Decision:** don't max out even though we could — **match the pace the call centers currently run.** Telnyx **concurrency caps** are buyable; how many concurrent calls we run is a pricing question.

## 9. KPI walk-through (Kinsey, Ashley, Brandon)

- Health metrics: **contact rate, dials/lead, dials/hour, lead consumption, SPH, sales/contact.** They interlock — e.g. contact rate up → dials/hour up → burn leads faster → throttle dialing to protect lead consumption.
- Sean flagged **dials/hour** as less directly relevant to us (no screener to pace for), but Brandon: still useful as a contact-quality signal.
- Each KPI triggers a **root-cause path**: dials/hour high usually means contact% low → Ashley pings the **carrier** (DIDs) *and* checks whether she bought **bad leads** (Joy). The platform should support that investigation — including **filter by media partner in real time** (Brandon/Alex) to see which partners dial well.
- Sales-per-contact points at **agent/script** issues.

## 10. Extended vision beyond CV (Pier, Sean)

- Andre reached out (saw Sean's heavy AI/Fable usage building this); **Payam wants the platform usable for more than CV.**
- Concrete example: **AutoWeb marketing SMS follow-up** — spin up AI agents to follow up on outbound SMS. Same "spin up an AI agent for a purpose" shape as the call center.

## 11. Wrap

- Sean: will fold this back into the doc, simplify with decisions + open questions, circulate later today.
- Pier: he and Sean will keep pinging the team with questions through the build; once it's live, "bother the heck out of us" to get it contributing to the bottom line.

---

## Scope-doc coverage map (cumulative, after session 2)

| Outline section | Status after 7/22 |
|---|---|
| 0. Core ask — features by seat | Must-have list crystallized (results DB, recordings, DID mgmt, A/B testing) |
| 1. Call flow (transfers, closer, soundboard vs TTS, fresh/revive) | Voice/closer/fresh-revive decided prior; **warm-transfer mechanics still open** |
| 2. Scope boundary (in/out, pilot, "paused") | Pilot vertical still unnamed; in/out still not formally drawn |
| 3. Who runs it / controls / reporting | **Cadence/dialing-pattern controls covered**; full seat-by-seat control inventory still open |
| 4. Data & integrations | **Results DB, recordings, DID strategy, intake endpoint covered**; DNC inheritance + write-back contract still open |
| 5. Economics | **Partial numbers** (DID $1 / 60–70¢, JaneTel ~$2,500, concurrency = pricing lever); cost baselines vs KB/TD/CD still owed |
| 6. Milestones & 3-week plan | 3-week usable-testbed goal reaffirmed; formal success thresholds still open |
