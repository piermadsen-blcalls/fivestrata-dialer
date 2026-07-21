# Platform Foundations — ViciDial, Telnyx, LeadConduit, Data Layer

Architecture working notes. Nothing here is final; this hardens as requirements/specs/business-logic layers land.
Last updated: 2026-07-17.

## 1. ViciDial as the foundational layer

**What it is.** Open-source (AGPL) predictive-dialer/contact-center suite: Asterisk PBX for telephony, MySQL/MariaDB for state and logs, PHP web UI, Perl backend daemons (hopper loading, dial pacing, log processing). Battle-tested at exactly our problem shape — it's what BareTel/KB runs (all 5 replicas) and TopDial runs (both replicas), and Ashley estimates ~75% of call centers she's worked with use it.

**Why it's attractive here**
- We already know the schema cold: the `callcenterdb` skill has profiled catalogs for all 7 partner replicas (293 common tables), a query cookbook, and cross-DB join maps back to `techss_`. Building on VICI means our internal platform speaks the same dialect as our vendors — comparisons and shared tooling come free.
- It solves the boring-but-hard 80%: campaigns, lists, hopper, dial pacing/ratios, dispositions, callbacks, DNC scrubbing, recording management, agent/queue mechanics, TCPA compliance features, DID/caller-ID rotation.
- Massive public documentation corpus — easy to ingest for AI-assisted development.

**Key docs (vicidial.org/docs)**
- `NON-AGENT_API.txt` (164K, updated 2026-05) — HTTP API for everything outside the agent screen: add/update leads, control campaigns/lists/hopper, pull stats/reports, place calls. This is the main integration surface.
- `AGENT_API.txt` (50K) — controls a live agent session over HTTP (dial, pause, dispo, transfer, park). **This is the likely seam for an AI agent**: a bot that holds an agent session and drives it via this API while audio flows over SIP.
- Also relevant: `SCRATCH_INSTALL.txt`, `BASE_INSTALL.txt`, `LOAD_BALANCING.txt` (multi-server clusters), `OUTBOUND_OPTIMIZATIONS.txt`, `LOG_TABLES.txt` + `LOG_ARCHIVING_AND_COLD_STORAGE.txt` (their own answer to log-table bloat), `PERFORMANCE_TESTING.txt`, `CELLPHONE_USA_TCPA_FCC_COMPLIANCE.txt`, `ALTERNATE_NUMBER_DIALING.txt`, `CALL_COUNT_LIMITS.txt` (native dial caps — relevant to DID retirement strategy), `TILTX_SHAKEN_API.txt` (STIR/SHAKEN).
- APIs are HTTP GET/POST returning plain text/pipe-delimited data; auth is user/pass in URL params. Old-school but scriptable. AGI hooks exist for in-call-flow logic.

**What ViciDial does NOT give us**
- No AI voice — agents are humans (or soundboard via third-party add-ons). The AI agent layer is ours to build.
- No modern eventing: state lives in MySQL tables written at high frequency (`vicidial_log`, `vicidial_agent_log`, `vicidial_closer_log`, `vicidial_dial_log`); no stream/webhook layer. Real-time reads mean querying hot tables or tailing binlogs.
- Dated web stack; REST/JSON is not native.

**Build options**

| Option | Shape | Pros | Cons |
|---|---|---|---|
| A. ViciDial core + Telnyx as carrier + AI agents as "agents" | Telnyx SIP trunk into Asterisk; AI agent service registers as SIP endpoints/agent sessions driven via Agent API | Maximum reuse; dial pacing/compliance/dispo machinery free; vendor-comparable data | Fighting an old stack; AI-agent-as-fake-human is a hack; two systems to run |
| B. Build orchestration directly on Telnyx Voice API/Call Control | Our own dialer service (Supabase/AWS) commands Telnyx programmatically; borrow VICI's data model concepts, skip its code | Modern, clean eventing (webhooks), AI-native, single stack | We rebuild pacing, hopper, dispo, compliance, DNC, DID rotation from scratch — the "boring 80%" |
| C. Hybrid: VICI schema + our orchestration | Adopt VICI-compatible table semantics (list/log/dispo) over a modern engine | Data comparability without legacy code | Still rebuilding dialer logic; risk of half-compat |

Open decision. Sean's instinct on the call: much of the sales-allocation/list-ordering logic "won't be too hard on the Vici side." Ashley's endorsement plus our replica expertise weigh toward A or C. Telnyx voice-AI product capabilities (native AI agents, media streaming) may decide it — investigate what Telnyx gives out of the box before committing.

> **Update 2026-07-20 — V1 discovered & documented:** V1 is already option-B-shaped — Supabase queue/lease orchestration + Retell voice agents, no ViciDial (see [v1-build.md](v1-build.md)). Its failure was economic (voice-AI cost ≈ $157/sale), not architectural — the exact cost line the soundboard-first hybrid targets.
>
> **Update 2026-07-20 — public-docs capability review done:** see [telnyx-capability-review.md](telnyx-capability-review.md).
> Headline: Telnyx replaces AMD, bridge/transfer/conference, pre-staged clip playback, bidirectional media streaming (L16), DID lifecycle (bulk order/release + reputation API), and optionally the whole STT→LLM→TTS loop (custom-LLM AI Assistants) — but has **zero campaign semantics** (no pacing, hopper, lists, dispositions, DNC, calling windows). Sharpest new fact for the fork: **with all-AI agents, predictive pacing loses most of its purpose** (no scarce human pool to keep busy), which weakens option A's biggest advantage. Remaining unknowns need account keys + a PoC: playback-start latency for pre-staged clips (critical for soundboard-first), concurrency defaults, warm-transfer fee scope. Still ➤ direction, not ✅ decided.

## 2. Telnyx (voice layer — decided)

Carrier + programmable voice. Relevant capabilities to spec: Call Control API (per-call webhooks/commands), SIP trunking (feeds option A), media streaming (feeds STT/LLM/TTS loop), native Voice-AI agent offering (feeds option B), number management (DID pools — native cap enforcement at ~1,500 dials/DID is a differentiator no current call center offers), STIR/SHAKEN attestation.

**Voice strategy (decided, revisitable): soundboard-first, TTS fallback.** TTS is expensive relative to playing audio files; the platform's cost edge comes from a hybrid:

- Pre-generate the canned response library **with the same AI voice** used for live TTS, so switching between clip playback and synthesis mid-call is seamless to the listener.
- The AI conversation engine selects a canned clip when one matches (the common 80–95% of turns: greetings, script beats, objection handles, branding lines) and synthesizes only novel/long-tail turns.
- **Voice pack is a swappable unit**: canned library + TTS voice ID + script version travel together. Regenerating a pack in a new voice is a batch TTS job — cheap, done once, no voice-actor dependency (this also subsumes the branding-recording problem; Bryan is obsolete).
- Instrument the split: log canned-vs-TTS seconds per call so the economics are measurable and the cost model (scope doc §5) is fed by real numbers. The open question is where the split point must sit to beat KB/TD/CD cost per transfer.

**The AI is the soundboard operator.** How soundboard call centers actually work today: a human listens to the live call and fires hotkeys tied to soundboard clips. AICC replaces that human with the AI — same clip library concept, but the "hotkey press" becomes a logged model decision. That reframes the conversation engine as a **selection policy over a clip library** (with TTS as the escape hatch), and it defines the turn-level event schema: for every turn, log the customer utterance/context, the clip (or TTS) chosen, latency, and what happened next. Consequences:

- **Optimization loop for free**: with thousands of calls, clip-selection → outcome data supports which-clip-when analysis (which objection handle converts, where calls die, which sequences reach transfer) — classic policy evaluation over abundant data. Tweaks ship as library edits or policy/prompt changes, both versioned.
- **Directly comparable to the human call centers**: KB's soundboard agents are making the same decisions unlogged. Anything we learn about clip/sequence effectiveness is transferable coaching/script feedback for the human floors — the "platform teaches the call centers" revenue path made concrete.
- The granular fact stream therefore has **two grains**: per-dial (the row-per-dial fact) and per-turn (clip decisions within a call). Design both from day one.

Architecturally this means the media layer needs fast clip playback (pre-staged audio on the media path) interleaved with streaming TTS — a requirement to test against both option A (Asterisk plays files natively; this is exactly how soundboard call centers work today) and option B (Telnyx Call Control audio playback + streaming).

## 3. LeadConduit (lead delivery — decided in principle)

ActiveProspect's lead-routing hub; already carries our fresh-lead flow to KB/TD/CD, and Darwin's active-zips upload goes through it.

- **Model**: Flows with Sources and Recipients (Entities can be both). Inbound leads pass field mapping + acceptance criteria, then post to recipient integrations. Anything the UI does, the REST/JSON API does.
- **Our integration**: the platform exposes an API endpoint; Joseph points LeadConduit at it as a new recipient, configured exactly like BareTel/TopDial deliveries. Upstream percentage split assigns us our slice (mutual exclusion preserved — one call center per lead).
- **Retention**: LeadConduit keeps ~3 months only. Revive inventory comes from our own DB (~5 years of leads) — revive delivery to the platform is an internal pipeline (mirror Joseph's KB bulk-upload feature: direct insert into our dialer's list tables, no 20K-row UI limits since we own it).
- **API surface**: docs at activeprospect.redoc.ly — Flows, Leads, Events, Entities, Exports, **Firehose** (event stream — worth evaluating for real-time delivery telemetry), Caps and Limits.
- Results back: dispositions must flow into the existing `techss_` tables (import path akin to `techss_log.call_center_import_logs` / the TD_* mirror pattern) so MDB and downstream dashboards keep working. `OLeadID` remains the cross-system key (→ `vicidial_list.vendor_lead_code` on the dialer side).

## 4. Real-time, performant call-level data

The consensus requirement: one granular fact stream — a row per dial (ts, number, disposition, duration, agent/AI-session, script/prompt version, call center, client, geo, sub-source) — from which everything derives. ~62M rows/month at full scale; trivial by modern standards but fatal in Excel and painful in an untuned MySQL.

Proposed tiering (matches what was said on the call — Joseph's "temporary then dump," Sean's "aggregate as it gets old" + Snowflake precedent):

1. **Hot / operational (seconds-fresh)**: the dialer's own DB (VICI-style MySQL, or Supabase Postgres if we build option B). Narrow indexed tables, small hot window (30–90 days). Real-time decisions read here: pacing, client-selection pings, live SPH, IVA/spam contact classification.
   - If VICI-based: mirror the vendor pattern we already run — replicate off the primary (binlog → replica) so analytics never touch the dialing DB. Unlike the partner replicas (T-1 daily refresh), ours can be true streaming replication — seconds behind, which is the whole point of owning it.
2. **Stream / CDC**: MySQL binlog (Debezium/DMS) or Postgres logical replication (Supabase realtime/WAL) → event bus → Snowflake (Snowpipe) and/or S3. This is also where per-call events from Telnyx webhooks land natively if we go option B — arguably cleaner than scraping log tables.
3. **Analytical (minutes-fresh)**: Snowflake — the AutoWeb impression-data precedent. All slicing (sub-source × geo × script × cadence), dashboard feeds, Brandon/Alex's daily-everything requirement. Kill the daily/weekly split by making leads-delivered-per-center-per-day a first-class fact.
4. **Archive**: aged detail to S3/Snowflake cheap storage; aggregates stay queryable. (VICI's own `LOG_ARCHIVING_AND_COLD_STORAGE.txt` pattern if option A.)

Design rules from the call:
- **Async always** — no synchronous external calls in the call path (Joseph). Client-selection ping: pre-auth default + re-request at qualification with fallback.
- **Ping on need, not at call start** (Ashley) — front-loading pings burdened the system historically.
- Granular first, aggregate derived (Brandon). Never store only aggregates.
- We control the data = analytics stop being a negotiation with vendors (Sean).

Supabase's role: preferred home for the platform application layer (config, scripts/prompt versions, campaigns, users, transfer-priority mirror, UI). Whether it also holds the hot call-log tier depends on option A vs B — don't force the dialer's write path into it if VICI/MySQL is the engine.

## 4b. Call flow assumption: no human layer

Working assumption unless expressly redirected: **no human screener or closer anywhere in the AICC call path**. The AI runs the full conversation — screen, qualify, brand — and hands off **directly to the client as a warm transfer**. Implications:

- The transfer leg is the critical engineering moment: client selection (pre-auth default + re-request at qualification), bridging the consumer to the client line, recording/crediting the transfer, and handling no-answer/unavailable-client paths — all machine-driven, no agent to improvise.
- Simplifies staffing/scheduling scope to zero for v1 (no agent seats, no closer queue) — "who runs it" becomes purely ops controls and monitoring.
- Raises the bar on the AI's close-adjacent behavior: the last 30 seconds before transfer (confirming interest, setting expectations) must be script-tested since there's no human safety net.

## 5. Things the platform can do that no vendor does (differentiators to protect in design)

- Native DID dial-cap enforcement and rotation (retire at ~1,500 dials).
- Real vs fake contact classification (IVA/spam detection) as a first-class disposition dimension.
- Script/prompt versioning with A/B testing — hard-coded variants vs guideline prompting, measurable.
- Sub-source × geo × vertical routing (Sunrun-style URL-approval constraints become possible).
- Bid/RPL-aware client allocation, or at least sale-level (not call-level) fairness.
- Branding at zero marginal cost (batch-generate branded clips in the AI voice into the voice pack — no voice-actor dependency).
- Canned/TTS hybrid voice with per-call cost telemetry — soundboard economics with generative flexibility.

## 6. Open architecture questions

- Option A vs B vs C — gate on a Telnyx capability review (what does their voice-AI/Call Control stack replace?).
- Where does the AI conversation engine run (Telnyx-native vs our own STT→LLM→TTS loop), and what's the per-minute cost model?
- Supabase vs MySQL for the dialer hot store; Snowflake ingestion route (Snowpipe vs batch).
- Exact disposition write-back contract into `techss_` (which tables, what cadence, who owns — Joseph/Cromwel).
- DNC: inherit `techss_all_leads.dncDate` scrub upstream (LeadOps validates before split today) + platform-side scrub?
- Recording storage/format designed for analysis (stereo, per VICI `STEREO_CALL_RECORDINGS.txt`, helps dead-air/QA ML).

## Sources

- ViciDial docs index: https://vicidial.org/docs/ (esp. NON-AGENT_API.txt, AGENT_API.txt)
- LeadConduit API: https://activeprospect.redoc.ly/docs/leadconduit/api/overview/ and https://docs.activeprospect.com/leadconduit/reference.html
- Internal: callcenterdb skill (7 replica catalogs, query cookbook, cross-DB joins), fivestratadb (techss_ structure, OLeadID key), fivestrataops (MDB/dashboard definitions).
