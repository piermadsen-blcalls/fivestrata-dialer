# Open Questions

Boiled down from the 7/17 scoping call and post-call decisions. Two buckets: business/ops (mostly session-2 agenda for Kinsey/Ashley/team) and technical (mostly access + specs Sean/Pier need to start unblocking now).
Last updated: 2026-07-17.

## Business / ops questions

**Scope & pilot**
1. Which vertical is the pilot, specifically (bathroom vs windows — HW ruled out)? One campaign or several?
2. What does "dialing is paused" mean exactly — paused where, and what keeps running at KB/TD/CD during the build?
3. What is explicitly IN v1 vs deferred (QA/scoring, scheduling, compliance tooling)?
4. What starting volume slice do we take from the upstream split, and what performance gates scale it up?

**Success & economics**
5. What must be true at end of pilot to call v1 a success — which metrics, what thresholds?
6. Target cost/transfer (or cost/hour) vs current KB/TD/CD baselines — and what are those baselines? (Pull from the cost-analysis sheet / MDB.)
7. What counts as a billable/credited transfer with clients — the crediting rules the platform must record against.

**Operations**
8. Who operates it day-to-day, and what's the full control inventory (hours, lead flow, pacing, voice packs, scripts)? Which controls does Ashley need to be self-serve vs analyst-mediated?
9. Business definition of a "real" contact — the IVA/spam taxonomy that real-vs-fake classification must implement.
10. Compliance inheritance: which DNC/TCPA/state safeguards and client-specific constraints (e.g. Sunrun approved-URL rule) are hard requirements on day one?

**Test agenda (parking lot, needs prioritization)**
11. Branding: keep-cheap (AI-voice clips) vs generic vs drop — design the A/B test.
12. Bid/RPL-based client allocation vs round-robin — business appetite for revenue-weighted fairness.
13. Audit current fresh-routing round-robin behavior (Chicagoland 400-vs-3 skew) — assign (Brandon?).
14. Hot-transfer product (fresh leads, 45s script, new price) — when does it enter the roadmap?
15. Cadence: session-2 scheduling (early week of 7/20), demo checkpoints, and bandwidth guardrails vs Darwin/Meridius/analysis backlog.

## Technical questions

### Surfaces / APIs to get access to immediately

| # | Surface | Why now | Likely owner |
|---|---|---|---|
| T1 | **Pier's V1 AI build** — repo, prompts, Telnyx config, infra | It already dials and talks; it's the seed of option B and the fastest way to learn what Telnyx integration actually looks like. Also needs the ping-everything fix regardless. | Pier |
| T2 | **Telnyx account + API keys** (Call Control, SIP trunking, media streaming, voice-AI product, number ordering, pricing) | Gates the A/B/C architecture decision AND the soundboard/TTS cost model. *Public-docs half DONE 2026-07-20 — see `architecture/telnyx-capability-review.md`. Keys still needed for: playback-latency PoC, concurrency defaults, negotiated pricing, warm-transfer fee scope.* | Pier / IT |
| T3 | **LeadConduit account API access** (flows, entities, recipient config; Firehose eval) | We become a recipient endpoint — need the submission-doc/field-mapping spec and the lead payload contract (incl. OLeadID, sub-source fields). | Joseph |
| T4 | **Pre-auth / client-selection endpoint spec** — request/response contract of the endpoint call centers hit today | Two-phase client selection is designed around it; we must call the same surface (or its successor). | Joseph |
| T5 | **Command Center** — transfer priorities: where they live (API? techss_dl tables?), read/write surface | Platform must emulate/plug into it. | Joseph / Cromwel |
| T6 | **techss_ write-back contract** — target tables for dispositions/results (callcenter_dispos conventions, import-log pattern), push mechanics | Keeps MDB and every downstream dashboard alive; mirrors the TD_* ingestion pattern we already half-own. | Joseph / Cromwel |
| T7 | **Supabase org/project** access | Preferred app-layer home; need to size what it can host (hot store vs app data only). | Pier / Sean |
| T8 | **AWS + Snowflake** — account, warehouse, Snowpipe/S3 landing rights | Analytical tier for the 62M-rows/month fact stream; AutoWeb precedent lives here. | IT / enterprise data |
| T9 | **Ashley's daily dashboard** — the file + its data pulls | It IS the day-one reporting spec; also feeds Brandon/Alex's automation work. *File received 2026-07-20 (KB WI 3.1) — structure extracted to `reporting/kb-wi-dashboard-spec.md`, emulation views in `supabase/migrations/0002_reporting_views.sql`. Remaining: disposition dictionary (→T6), FS-code PD/CH/CP tag meanings, where the data pulls come from.* | Ashley |
| T10 | **ViciDial source + a sandbox box** (AWS EC2; SCRATCH_INSTALL) | Cheapest way to de-risk option A — stand one up, wire a Telnyx trunk, drive the Agent API. | Sean / Cromwel |
| T11 | **DNC/validation surface** — how LeadOps validates today (techss_all_leads dncDate et al.), and whether the platform gets pre-scrubbed leads only | Determines whether platform-side scrub is needed at all. | Joseph |

### Design/spec questions (answerable once access lands)

- **Architecture fork (A/B/C)**: does Telnyx's voice-AI/Call Control stack replace enough of the dialer core (pacing, retry logic, DID rotation) to skip ViciDial? Decide after T1+T2 review and T10 sandbox.
- **AI conversation engine**: Telnyx-native vs own STT→LLM→TTS loop; latency budget per turn; how canned-clip playback interleaves with streaming TTS on the chosen media path.
- **Voice pack pipeline**: batch TTS generation, clip storage/versioning, per-call canned-vs-TTS telemetry schema.
- **Warm-transfer leg**: bridging mechanics, client no-answer handling, transfer recording/crediting event schema (feeds business Q7).
- **Hot store choice**: VICI MySQL + streaming replica vs Supabase Postgres + logical replication; CDC route to Snowflake (Debezium/DMS vs Snowpipe from S3).
- **Fact-stream schema**: the row-per-dial event model (ts, number, dispo, duration, session, script/prompt version, call center, client, geo, sub-source) + retention tiers (hot 30–90d → warehouse → archive).
- **DID management**: pool sizing for pilot volume, cap counters, rotation/retirement automation via Telnyx number APIs.
- **Recordings**: storage target (S3?), stereo capture for QA/dead-air analysis, retention policy.
