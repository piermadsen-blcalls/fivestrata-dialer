# Open Questions

Boiled down from the 7/17 scoping call and post-call decisions, refreshed after the 7/22 follow-up. Two buckets: business/ops and technical (mostly access + specs Sean/Pier need to start unblocking now).
Last updated: 2026-07-22.

> **7/22 session update:** the "session-2 agenda" items below were substantially covered. Cadence/dialing-pattern controls (Q8), IVA/contact-rate breakage (Q9), DID economics + recordings retention are now direction, not blank. Remaining hard-open: pilot vertical (Q1), "paused" definition (Q2), in/out of v1 (Q3), formal success thresholds (Q5), cost baselines (Q6), crediting rules (Q7), DNC inheritance (Q10).

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
| T1 | **Pier's V1 AI build** — repo, prompts, Telnyx config, infra | It already dials and talks; it's the seed of option B and the fastest way to learn what Telnyx integration actually looks like. Also needs the ping-everything fix regardless. *LARGELY UNBLOCKED 2026-07-20: V1's Supabase (Retell-based, queue-orchestrated) deep-dived read-only — full write-up in `architecture/v1-build.md` (arch, June economics: ~$157/sale vs ~$25–35 at KB, dialing killed 7/8). Still needed from Pier: repo/prompts, Retell account+pricing, Telnyx config, agent naming context.* | Pier |
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
- **DID management**: pool sizing for pilot volume, cap counters, rotation/retirement automation via Telnyx number APIs. **Open (7/22):** does the *carrier* (not Telnyx) impose a minimum hold — Ashley's "90-day" concern? Telnyx itself is a monthly subscription (swap anytime, pay the month). Design for individual benchmark-driven retirement, not block rotation.
- **Recordings**: storage target (S3?), stereo capture for QA/dead-air analysis. **Retention (7/22):** 5-year legal minimum; FiveStrata owns the backup (carrier-swap gap is the failure mode); hot 1–2-month window in a fast store, cold-archive the rest.
- **Results DB shape (7/22):** confirmed a *separate* store (not techss_ results tables), keyed by OLeadID, on Snowflake, capturing every call; a DID dials/contact-rate view sits over the fact table; media partner tagged per call. Two-way write-back to techss_ still required for MDB/dashboards (see T6).
- **Contact-rate replacement**: IVAs make contact rate unreliable; evaluate connection rate as the primary signal and define the IVA/spam taxonomy (business Q9) so classification is well-specified.

### FS-code questions (added 2026-07-20; context in reporting/kb-wi-dashboard-spec.md)

*Updated 2026-07-20 from the fivestratadb profiled lookups (offline) — several answered without a live query.*

| # | Question | Status | Likely owner |
|---|---|---|---|
| F1 | `PD:` and `CH:` tag meanings | **Structure resolved (live query 2026-07-20), names still open.** PD is a channel GROUPING: PD:1 → {HS, IB, TM, RO}, PD:2 → {OS, SOC, SER, DIS, PUB, AFL, MIX, SP, SEM}, PD:5 → {CL}. Full CH list (15): AFL, CL, DIS, HS, IB, MIX, OS, PUB, RO, SEM, SER, SOC, SP, TM (+blank). Reads as PD:1 = phone-ish origins, PD:2 = web-media origins, PD:5 = client-provided. What PD and HS literally stand for → Brandon/Alex | Brandon / Alex |
| F2 | Tag contract / other tags | **Largely answered:** FSCode1 is consistently `\|VT\|PD\|CH\|SC\|CP\|` in that order (rare truncation: missing CP). Additional tags live in FSCode2/3, not FSCode1: `SS` (numeric sub-source id), `SA` (sub-affiliate id), `C0`/`CC` (call center: KB/TD/CD/YD), `BT` (batch tag). Confirm the writer enforces order | Joseph |
| F3 | Who mints it, where; generator spec/dictionary | Open — but `techss_all_leads.unique_FSCode1` / `unique_FSCodes` views already decompose codes into key/value pairs (a live dictionary to read) | Joseph |
| F4 | FSCode1 vs 2 vs 3 roles | **Answered structurally:** FSCode1 = acquisition identity (media taxonomy). FSCode2 = source detail + call-center assignment (`\|SS:…\|SA:…\|C0:KB\|`). FSCode3 = distribution batch provenance (`\|BT:RU_RV_BR_CC39_03292026\|CC:TD\|` — revive batch name + call center). Confirm semantics with Joseph | Joseph / Cromwel |
| F5 | SC canonical dictionary | **Partial:** `unique_FSCode1`/`unique_FSCodes` are maintained TABLES (not views): FSCode1 has a per-key dictionary (VT 9, PD 4, CH 15, SC 122, CP 270); `unique_FSCodes` stores co-occurrence PAIRS (SC→CP, PD→CH, VT→call-center) — useful, but NOT a code→partner-name map. Partner names still = Command Center affiliates lookup — readable table/API? | Alex / Joseph |
| F6 | Immutability | **Strong inference:** routing/batch assignment is stamped into FSCode2 (C0) and FSCode3 (BT/CC), leaving FSCode1 as immutable acquisition identity. Confirm nothing rewrites FSCode1 | Joseph |
| F7 | `client_blocked_fscodes` enforcement point | **Structure + purpose answered.** The table serves exactly ONE client — **Sunrun (clientId 9)**, 317 SC×CP rules dating to 2017. Context (Sean, 2026-07-20): when Sunrun had to turn us off for a while, the easy path was to keep receiving their setup and **soft-disable via FS-code rules** so it could be flipped back on — i.e. the mechanism was actively enforced, not dormant. The `approved` flag is the on/off per SC×CP. Also found: `techss_dl.client_approved_urls` (505 URL rules, Momentum Solar #425 + SunPro #475) — the "URL approval" feature Kinsey called hard-to-build has tables. Remaining: WHERE in the flow enforcement happens (LeadOps? distribution query?) so the platform mirrors it, and whether client_approved_urls is likewise enforced | Joseph |
| F8 | LeadConduit payload fields for FS codes | Open | Joseph |
| F9 | Cardinality | **Answered (live 2026-07-20):** dictionary sizes VT 9, PD 4, CH 15, SC 122, CP 270; current revive inventory (`RVInvtyRevive`) spans only 106 distinct FSCode1 across 2,120 rows. Trivial dimensions | — |

**Bonus find (2026-07-20 live queries): `techss_dl.clients` is the client-dimension blueprint** for the platform's client model — it already carries `branding` (the spoken brand name), `silentTransfer`, `transferCode/transferPhone/transferDays/transferStartHour/transferEndHour` (transfer windows), `clientThrottle`, `acceptRate`, `auditRate`, and `LeadConduitCode`. Our `clients`/`transfer_priorities` schema should align with these semantics (feeds T4/T5 and the two-phase selection design).
