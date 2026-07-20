# AI Call Center Platform — Scoping Outline (REDLINED)

The 7/17 scope doc with inline answers reflecting everything decided or directionally settled as of 2026-07-17 (meeting + post-call decisions). Legend: **✅ DECIDED** · **➤ DIRECTION** (agreed in principle, needs spec) · **❓ OPEN** (see `open-questions.md`).

---

## General notes — where this starts

We're building a platform that manages the call center. Plan of record: buy the hard pieces (Telnyx for voice, Supabase for backend), build the orchestration and front-end ourselves; dialing paused during the build; target 2–3 weeks.

> **✅ Amended vision (Pier, from Payam):** this is a platform the CV team owns and operates — augments the human call centers, does not replace them (V1 proved we can't beat their cost). Uses: controlled test bench (Ashley), new-product lane like hot transfers (Kinsey), faster vertical spin-up (Pier), disaster fallback capacity. Every feature must tie to revenue — produce it, or teach optimizations that transfer to KB/TD/CD.
> **➤ ViciDial** is the candidate foundational dialer layer — no objections; Ashley: ~75% of call centers she's worked with run it. Final call gated on a Telnyx capability review (see architecture doc, options A/B/C).

## The core ask: what features are needed?

- **Ops** — *➤ answered in part:* everything in Ashley's daily dashboard is the baseline (nothing in it goes unused). New must-have: **real vs fake contact** classification — IVAs/spam have broken contact-rate reliability and distort DID decisions. ❓ Floor-control specifics (hours, pacing, voices) not yet walked through.
- **Analytics** — *✅ answered:* one granular fact stream, a row per dial (date, number, disposition, duration, agent/session, script version, call center, client, geo, sub-source). ~62M rows/month is fine (AutoWeb impression-logging precedent in Snowflake). Everything daily — kill the daily/weekly split by making leads-delivered-per-center-per-day a first-class fact. Granular first; aggregate derived; never store only aggregates.
- **Integrations** — *✅ answered (Joseph):* **LeadConduit** (lead delivery in) and **Command Center** (transfer priorities/controls). Nothing else on day one.
- **Media/BD** — *✅ answered (Kinsey/Alex):* sub-source × geo × vertical performance routing; ability to honor client source constraints (Sunrun URL-approval case). Owning the data makes these queryable; routing is the best lever given supply constraints.

## 1. Call flow — the conversation itself

- **Transfers** — *➤ partially:* AICC → client **warm transfer, machine-driven end to end**. ❓ Mechanics: bridging, crediting/recording the transfer, no-answer/unavailable-client path.
- **Do we have a closer?** — *✅ NO.* Working assumption unless expressly redirected: no human screener or closer layer anywhere in the call path. The AI screens, qualifies, brands, and warm-transfers directly to the client. (Context: only KomBea's AI product uses a dedicated closer; human agents elsewhere self-close.)
- **Soundboard vs TTS** — *✅ HYBRID, soundboard-first.* TTS is expensive vs playing files. Pre-generate canned responses **in the AI voice** (seamless mid-call), synthesize only the long tail. Voice pack (clips + TTS voice + script version) is a swappable unit — also kills the voice-actor dependency for branding. Instrument canned-vs-TTS seconds per call. Note: today a human operator listens live and fires hotkeys tied to clips — the AI replaces that operator, so every clip selection is a logged decision; per-turn logging (context → clip → outcome) gives an optimization loop over abundant data, and the learnings transfer to the human soundboard floors. ❓ Where the split point must sit to beat KB/TD/CD cost per transfer.
- **Fresh vs revive** — *✅ Revive first* (voice AI strongest there), on an existing vertical — **not HW** (comparison would be weak). Build the fresh/revive switch from day one; fresh later.

## 2. Scope boundary — what "manages the call center" means

- **IN v1 / OUT of v1** — ❓ not reached. (Note: no-human-layer decision removes agent staffing/scheduling from scope entirely — v1 "who runs it" is ops controls + monitoring only.)
- **Pilot vertical / campaign** — *➤ direction:* one existing vertical, not HW. ❓ Which one specifically.
- **"Dialing is paused" — paused where?** — ❓ not reached. What keeps running at KB/TD/CD during the build.

## 3. Who runs it — day-to-day operation

- **Users and what they touch** — ❓ not reached (session 2).
- **Scale controls (hours, lead flow, voices, scripts, pacing)** — *➤ principle:* platform must emulate/plug into Command Center controls (transfer priorities confirmed); voice packs swappable; ❓ full control inventory.
- **Day-one reporting** — *➤ answered in substance:* SPH plus its feeds (dials/hr, contact rate, lead consumption, completes), everything in the daily dashboard, plus real-vs-fake contact. Derivable from the granular fact stream by design.

## 4. Data & integrations

- **Lead flow in** — *✅ same mechanics as current call centers:* LeadConduit points at our API endpoint as a new recipient; upstream percentage split assigns our slice (mutual exclusion preserved — one call center per lead); start small, volume gated by performance. Revive inventory comes from **our own DB** (LeadConduit retains ~3 months; we hold ~5 years) — internal pipeline modeled on Joseph's KB bulk-upload feature.
- **Results back** — *➤ yes in principle:* dispositions into existing techss_ tables so MDB and dashboards keep working; OLeadID remains the cross-system key. ❓ Exact write-back contract (tables, cadence, owner).
- **DID strategy** — *➤ flagged as differentiator:* platform can enforce ~1,500-dial retirement caps natively — no current call center does. ❓ Pool sizing, rotation rules, sourcing via Telnyx.
- **Recordings** — ❓ not reached (storage, design-for-analysis: dead-air/QA up front; stereo).
- **DNC / compliance** — ❓ not reached. Upstream LeadOps validation continues (split happens after DNC validation today); platform-side inheritance TBD.
- *✅ Added design rules from the call:* **async always** — no synchronous external calls in the call path (Joseph). **Ping on need, not at call start** (Ashley — front-loaded pings burdened the system; V1's ping-everything behavior must not scale). **Client selection: two-phase** — pre-auth returns a default client before dialing; re-request at qualification for a current-state answer; instant fallback to the default if the API is slow. Fixes call-level vs sale-level round-robin fairness.

## 5. Economics — where the platform can win

- **Cost lines** — *➤ partially:* carrier + DIDs dominate; levers = native DID caps, smarter pacing, routing, and now the canned/TTS hybrid. ❓ Quantify each.
- **TTS vs soundboard numbers** — *➤ direction set (soundboard-first), math still owed:* real per-minute Telnyx/TTS pricing into the model; find the required canned-coverage split point.
- **Target cost/hour or cost/transfer vs KB/TD/CD** — ❓ not reached; needs current cost baselines.

## 6. Milestones, sequence & the 2–3 week plan

- **Success criteria / thresholds** — ❓ not reached.
- **Smallest slice in 2–3 weeks** — ❓ not reached.
- **Checkpoints / demo cadence** — ❓ not reached; follow-up session targeted early week of 7/20.
- **Execution risks** — unchanged: voice AI on fresh calls, transfer quality, team bandwidth (Darwin, Meridius, analysis backlog continue). TTS economics risk now mitigated by hybrid strategy.

## Parking lot

- Branding: not a client requirement; old test showed it lifted quality/sales; with AI-voice clips it's nearly free. Keep-cheap vs drop vs generic — testable on the platform.
- Bid/RPL-based client allocation (highest RPL wins) as alternative to round-robin.
- Audit whether fresh-routing round-robin is actually behaving (Chicagoland 400 vs 3).
- Hot-transfer product (fresher leads, 45s script, new pricing).
- Sub-source/geo routing as a media-buying feedback loop.
