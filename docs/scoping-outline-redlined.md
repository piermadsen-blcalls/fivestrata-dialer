# AI Call Center Platform — Scoping Outline (REDLINED)

The scope doc with inline answers reflecting everything decided or directionally settled as of **2026-07-22** (7/17 meeting + post-call decisions + 7/22 follow-up, which walked the sections 7/17 didn't reach). Legend: **✅ DECIDED** · **➤ DIRECTION** (agreed in principle, needs spec) · **❓ OPEN** (see `open-questions.md`).

---

## General notes — where this starts

We're building a platform that manages the call center. Plan of record: buy the hard pieces (Telnyx for voice, Supabase for backend), build the orchestration and front-end ourselves; dialing paused during the build; target 2–3 weeks.

> **✅ Amended vision (Pier, from Payam):** this is a platform the CV team owns and operates — augments the human call centers, does not replace them (V1 proved we can't beat their cost). Uses: controlled test bench (Ashley), new-product lane like hot transfers (Kinsey), faster vertical spin-up (Pier), disaster fallback capacity. Every feature must tie to revenue — produce it, or teach optimizations that transfer to KB/TD/CD.
> **➤ ViciDial** is the candidate foundational dialer layer — no objections; Ashley: ~75% of call centers she's worked with run it. Final call gated on a Telnyx capability review (see architecture doc, options A/B/C).

## The core ask: what features are needed?

- **Ops** — *➤ answered in part:* everything in Ashley's daily dashboard is the baseline (nothing in it goes unused). New must-have: **real vs fake contact** classification — IVAs (iPhone call-screening etc.) get logged as contacts, so contact rate looks high but is garbage; sales-per-contact is distorted the same way. Contact rate is no longer trustworthy as *the* KPI — likely lean on **connection rate**; disposition IVAs live on the call if possible (AI detection imperfect but better than nothing). Cadence controls walked through (see §3); voice/hours still partial.
- **Platform must-haves (crystallized 7/22, Pier)** — *✅:* (1) **results database** (write back every call we can), (2) **call-recording storage** (as much as we can), (3) **DID management**, (4) **A/B testing of AI agents and scripts** (tell which performs better).
- **Analytics** — *✅ answered:* one granular fact stream, a row per dial (date, number, disposition, duration, agent/session, script version, call center, client, geo, sub-source). ~62M rows/month is fine (AutoWeb impression-logging precedent in Snowflake). Everything daily — kill the daily/weekly split by making leads-delivered-per-center-per-day a first-class fact. Granular first; aggregate derived; never store only aggregates.
- **Integrations** — *✅ answered (Joseph):* **LeadConduit** (lead delivery in) and **Command Center** (transfer priorities/controls). Nothing else on day one.
- **Media/BD** — *✅ answered (Kinsey/Alex):* sub-source × geo × vertical performance routing; ability to honor client source constraints (Sunrun URL-approval case). Owning the data makes these queryable; routing is the best lever given supply constraints.

## 1. Call flow — the conversation itself

- **Transfers** — *➤ partially:* AICC → client **warm transfer, machine-driven end to end**. ❓ Mechanics: bridging, crediting/recording the transfer, no-answer/unavailable-client path.
- **A/B testing agents & scripts** — *✅ must-have:* the platform must run AI agents/scripts head-to-head and tell which converts better (Pier). Dovetails with the prompting-mechanism feature (stored variants vs freeform guidelines).
- **Do we have a closer?** — *✅ NO.* Working assumption unless expressly redirected: no human screener or closer layer anywhere in the call path. The AI screens, qualifies, brands, and warm-transfers directly to the client. (Context: only KomBea's AI product uses a dedicated closer; human agents elsewhere self-close.)
- **Soundboard vs TTS** — *✅ HYBRID, soundboard-first.* TTS is expensive vs playing files. Pre-generate canned responses **in the AI voice** (seamless mid-call), synthesize only the long tail. Voice pack (clips + TTS voice + script version) is a swappable unit — also kills the voice-actor dependency for branding. Instrument canned-vs-TTS seconds per call. Note: today a human operator listens live and fires hotkeys tied to clips — the AI replaces that operator, so every clip selection is a logged decision; per-turn logging (context → clip → outcome) gives an optimization loop over abundant data, and the learnings transfer to the human soundboard floors. ❓ Where the split point must sit to beat KB/TD/CD cost per transfer.
- **Fresh vs revive** — *✅ Revive first* (voice AI strongest there), on an existing vertical — **not HW** (comparison would be weak). Build the fresh/revive switch from day one; fresh later.

## 2. Scope boundary — what "manages the call center" means

- **IN v1 / OUT of v1** — ❓ not reached. (Note: no-human-layer decision removes agent staffing/scheduling from scope entirely — v1 "who runs it" is ops controls + monitoring only.)
- **Pilot vertical / campaign** — *➤ direction:* one existing vertical, not HW. ❓ Which one specifically.
- **"Dialing is paused" — paused where?** — ❓ not reached. What keeps running at KB/TD/CD during the build.

## 3. Who runs it — day-to-day operation

- **Users and what they touch** — ❓ not reached (session 2).
- **Scale controls (hours, lead flow, voices, scripts, pacing)** — *➤ principle:* platform must emulate/plug into Command Center controls (transfer priorities confirmed); voice packs swappable; ❓ full seat-by-seat control inventory.
- **Dialing patterns / cadence** — *➤ covered 7/22:* today's rules are basic and back-end-dictated (≤2 dials/day, ≥2h apart, max-attempts cap, zip whitelist, TZ-aware calling windows; **LIFO** for fresh, **FIFO** for revive). Direction: encode cadence as **standalone testable variables** (hour-gap, time-of-day, wait-time) and run batches on different patterns head-to-head; mine the unanalyzed history for the right pattern (Ashley — e.g. call-once, or daypart-rotation). ❓ Which patterns to ship first.
- **Pacing note** — *✅ clarified:* VICIdial's pacing exists to keep a human screener fed; **we don't need it** (AI answers every call). But rapid dialing looks like spam → carriers block → DIDs corrupt, so **match the call centers' current pace rather than max out.** Telnyx **concurrency caps** are buyable (a pricing lever).
- **Day-one reporting** — *➤ answered in substance:* SPH plus its feeds (dials/hr, contact rate, lead consumption, sales/contact, completes), everything in the daily dashboard, plus real-vs-fake contact. Each KPI drives a **root-cause path** (e.g. dials/hr high → contact% low → carrier/DID *or* bad-leads check) — support the investigation, incl. **filter by media partner in real time**. Derivable from the granular fact stream by design.

## 4. Data & integrations

- **Lead flow in** — *✅ same mechanics as current call centers:* LeadConduit points at our API endpoint as a new recipient; upstream percentage split assigns our slice (mutual exclusion preserved — one call center per lead); start small, volume gated by performance. Revive inventory comes from **our own DB** (LeadConduit retains ~3 months; we hold ~5 years) — internal pipeline modeled on Joseph's KB bulk-upload feature.
- **Results DB** — *✅ hard requirement (7/22):* record **every call** (today only DNC + qualified write back; the rest is trapped in call-center DBs, harvested every 60–90d). It's a **new, separate store — NOT written into FiveStrata's current results tables** — keyed by **OLeadID** so it joins back, on **Snowflake** for performance; ETL lands the row + pushes the recording to storage. Data still flows **both ways** — dispositions the MDB/dashboards need are also written back to techss_. Include a **DID dials/contact-rate view** over the fact table, and **tag media partner** on every call (read from the campaign at intake). ❓ Exact techss_ write-back contract (tables, cadence, owner).
- **DID strategy** — *➤ top "make current call centers better" win:* Telnyx DIDs ≈ **$1** (bulk **~60–70¢**), **monthly-subscription** billing (buy = commit to 30 days; swap anytime but you paid that month's dollar). Telnyx **number API** lets us auto-retire and re-buy by area code. Platform retires DIDs **individually by contact-rate benchmark** instead of whole-block rotation, and enforces ~1,500-dial retirement caps natively — no current call center does either. ❓ Whether the **carrier** imposes a minimum hold (Ashley's "90-day" concern; JaneTel said no extra charge, quoted ~$2,500 discount rate); pool sizing; rotation rules.
- **Recordings** — *➤ covered 7/22:* **archive everything** (today only queue calls, working toward all completed). **Legal retention = 5 years.** Failure mode: call center swaps carrier → old recordings vanish → compliance gap; so **FiveStrata should own the backup** (raised earlier w/ Joseph & Cromwel). Design: keep a **hot 1–2-month window** in a fast store for active/AI analysis, archive the rest cheaply. ❓ Storage target (S3?), stereo/dead-air capture for QA.
- **DNC / compliance** — ❓ not reached. Upstream LeadOps validation continues (split happens after DNC validation today); platform-side inheritance TBD.
- *✅ Added design rules from the call:* **async always** — no synchronous external calls in the call path (Joseph). **Ping on need, not at call start** (Ashley — front-loaded pings burdened the system; V1's ping-everything behavior must not scale). **Client selection: two-phase** — pre-auth returns a default client before dialing; re-request at qualification for a current-state answer; instant fallback to the default if the API is slow. Fixes call-level vs sale-level round-robin fairness.

## 5. Economics — where the platform can win

- **Cost lines** — *➤ partially:* carrier + DIDs dominate; levers = native DID caps, smarter pacing, routing, and the canned/TTS hybrid. Known numbers (7/22): DIDs **$1 / ~60–70¢ bulk**, monthly subscription; **concurrency caps** are a Telnyx pricing lever; JaneTel quoted **~$2,500** (half its TopDial rate, scales with campaigns). ❓ Quantify the rest.
- **TTS vs soundboard numbers** — *➤ direction set (soundboard-first), math still owed:* real per-minute Telnyx/TTS pricing into the model; find the required canned-coverage split point.
- **Target cost/hour or cost/transfer vs KB/TD/CD** — ❓ not reached; needs current cost baselines.

## 6. Milestones, sequence & the 2–3 week plan

- **Success criteria / thresholds** — *➤ informal (7/22):* within ~3 weeks, a **usable platform the CV team can dial on** — enough to test a new vertical through AI and see if it's functional. Not the end state. ❓ Formal metric thresholds.
- **Smallest slice in 2–3 weeks** — *➤:* intake endpoint → DB → dial on one revive vertical → results DB + recordings; reaffirmed 7/22.
- **Checkpoints / demo cadence** — *➤:* Pier + Sean keep pinging the team through the build; "bother us" once it's live to push it to bottom-line contribution.
- **Execution risks** — unchanged: voice AI on fresh calls, transfer quality, team bandwidth (Darwin, Meridius, analysis backlog continue). TTS economics risk now mitigated by hybrid strategy.

## Parking lot

- **Client positioning (Kinsey, 7/22):** don't lead with "AI" — loaded term, clients (e.g. American Home Shield) already wary of even testing; prove the product quietly at low volume first, then have the conversation. Aspiration: transition soundboard floors → AI over ~1 year, performance-gated. Prioritize big clients' sensitivities over mom-and-pop.
- **Platform beyond CV (Pier/Andre, 7/22):** Payam wants the platform reused beyond the call center — e.g. AI agents to follow up on **AutoWeb marketing SMS**. Same "spin up an agent for a purpose" shape.
- **Full revive-source automation (deferred, 7/22):** auto-feeding the call center from a DB query would require re-doing the revive process across all call centers so revive lives only in the DB — big endeavor, not critical just to kill manual batch uploads. The intake endpoint + DB is the near-term answer.
- Branding: not a client requirement; old test showed it lifted quality/sales; with AI-voice clips it's nearly free. Keep-cheap vs drop vs generic — testable on the platform.
- Bid/RPL-based client allocation (highest RPL wins) as alternative to round-robin.
- Audit whether fresh-routing round-robin is actually behaving (Chicagoland 400 vs 3).
- Hot-transfer product (fresher leads, 45s script, new pricing).
- Sub-source/geo routing as a media-buying feedback loop.
