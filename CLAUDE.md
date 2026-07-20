# CLAUDE.md — AICC (AI Call Center Platform)

Project context for Claude Code. Read this first, then the files in "Repo map" below. Everything here was current as of 2026-07-20 (docs merged from the OneDrive AICC workspace; TypeScript scaffold in place).

## Standing instructions

- **Keep the markdown current.** README.md, docs/meetings/, docs/architecture/, docs/open-questions.md are the living context — update them whenever decisions land, questions resolve, or specs harden. This repo's markdown IS the project memory; sessions depend on it.
- Decisions carry provenance (who/when). Distinguish ✅ decided / ➤ direction / ❓ open — never silently promote a direction to a decision.
- Never commit or write consumer lead data, PII, credentials, passwords, or API keys anywhere in this repo (org policy). Credentials live in env vars only (`.env`, gitignored).
- Sean's colleagues (calibrate outputs accordingly): **Pier Madsen** co-lead, built the V1 AI experiment, reports direction from Payam (president). **Kinsey Jackson** VP of product — hands-on at process/revenue/ops level, years of call-center experience. **Ashley Smith** manages call-center vendor/dialer/carrier relationships — field ops expert; give her strong directional guidance, not dense analytics. **Brandon Titensor** analyst (junior, broad, technical) — offload standalone analysis. **Alex Lin** analyst — vendor/BD relationships, recurring ops. **Joseph Yordan** sysdev — LeadOps/LeadConduit plumbing, call-center integrations. **Cromwel** DBA. Sean: data/product/R&D background, graduate-level math, new to call centers.

## Repo map

| File | What it holds |
|---|---|
| `README.md` | Living project doc: vision, stack, quasi-decided list (12 items), repo layout, open questions, action items, people |
| `docs/meetings/2026-07-17-scoping-call.md` | Distilled founding meeting (59m transcript → 12 topic sections + scope-coverage map) |
| `docs/scoping-outline-redlined.md` | Sean's scope outline with inline ✅/➤/❓ answers — the shareable decided-vs-open summary (Word/Google Doc versions live in Drive, doc id `1r5FL-ySMmLCcUo_YFSPN9POWtXY2q29O4XJDWgbzHWg`) |
| `docs/open-questions.md` | Business/ops questions (15) + technical access list (T1–T11) + design/spec questions |
| `docs/architecture/platform-foundations.md` | ViciDial evaluation, build options A/B/C, Telnyx, voice strategy, LeadConduit, data-layer tiers, no-human-layer implications |
| `docs/transcripts/` | Raw meeting transcripts |
| `src/` | TypeScript/Fastify scaffold: VICIdial API wrappers (option A/C — provisional until the Telnyx review), Telnyx client + webhooks, Supabase client, LeadConduit intake, lead router with two-phase client-selection stub |
| `supabase/migrations/` | Schema: leads (OLeadID), calls (per-dial grain), call_turns (per-turn clip decisions), call_events, voice_packs/voice_clips, dids (1,500-dial caps), clients, transfer_priorities, scripts |

## Project in one paragraph

FiveStrata (lead-revival/distribution business; AutoWeb enterprise) is building an AI call center **platform** — directive from president Payam via Pier. V1 proved AI can't beat the human call centers on cost, so replacement is dead; V2 is a self-contained call center the CV team operates at will: test bench (change one variable, measure), new-product lane (hot transfers), faster vertical spin-up, disaster fallback. Every feature must tie to revenue — produce it, or teach optimizations that transfer to the human call centers. Pilot: revive leads, one existing vertical (not home warranty), fresh/revive switch built in from day one. Target was 2–3 weeks for a v1 slice.

## Business ecosystem

Full internal skills are available in this repo's `.claude/skills/` — **fivestratadb** (prod techss_ MySQL structure), **callcenterdb** (KB/TD VICIdial replica catalogs, query cookbook, cross-DB joins), **fivestrataops** (MDB, dashboards, owners, cadences). Consult them for anything DB- or ops-shaped. Compressed essentials:

- **FiveStrata prod DB**: MySQL 8.4, schemas prefixed `techss_`. Center of gravity `techss_all_leads` (~1.9B rows: leads, validation, DNC `dncDate`, LeadConduit/TrustedForm data). `techss_dl` = distribution/routing brain (clients, ZIP coverage, bids, transfer priorities, `client_market_caps`). `techss_dwh` = warehouse (Meridius daily lead-cap SPROC, fully automated). `techss_reporting` = dashboards + `CC_BehindMaster` + TD_* mirror tables (dormant as of 2026-07). `techss_log.call_center_import_logs` = audit of call-center imports. **`OLeadID` is the cross-system lead key** (maps to `vicidial_list.vendor_lead_code` on dialer side). Disposition decode: `techss_dl.callcenter_dispos`, `techss_reporting.CC_dispos`.
- **Call centers**: BareTel/Kombea "KB" (5 VICIdial replica servers: fsbr, fsbrv, fshw, fswn, fswr — EST), TopDial "TD" (2 replicas: bathroom, windows — MST), CanadaDirect "CD" (no replica). Replicas refresh ~daily (T-1 analytics only). All VICIdial/MariaDB, ~293 common tables. KB uses Kombea soundboard software + a closer on its AI product.
- **Current lead routing**: fresh leads flow through **LeadConduit** with a Command Center percentage split per vertical (100% HW→KB, 100% bathroom→CD, 100% windows→TD as of 7/17; Alex operates, Ashley calls changes). Revive: TD gets manual FTP upload; KB gets Joseph's bulk-upload feature (100K rows direct to their VICIdial). One call center per lead, split upstream after DNC validation (LeadOps constraint). LeadConduit retains ~3 months; our DB holds ~5 years.
- **Ops metrics**: SPH (sales/hour) is the master KPI; feeds = dials/hr, contact rate, lead consumption, completes. Ashley's daily dashboard = de facto reporting spec. Master Dashboard (MDB) on SharePoint = revenue/pace source. Contact rate is degraded by IVAs/spam — real-vs-fake contact classification is a required new capability. Team's other standing loads: Darwin (biweekly zip targeting, Sean/Alex), Meridius (automated daily caps), analysis backlog.

## Key decisions (details in README.md)

Augment-not-replace · own the data, row-per-dial granular fact stream (~62M rows/mo, tiers: hot 30–90d → CDC → Snowflake → archive) · ViciDial candidate foundation (option A/B/C fork open, gated on Telnyx capability review) · LeadConduit recipient endpoint for lead-in · revive-first pilot, existing vertical, not HW · two-phase client selection (pre-auth default + re-request at qualification + fallback) · async always, ping-on-need (never sync calls in the call path) · branding cheap-to-keep via AI-voice clips (drop/generic/keep is testable) · **soundboard-first hybrid voice** (canned clips pre-generated in the AI voice, TTS long tail, swappable voice packs, canned-vs-TTS telemetry) · **no human screener/closer** — AI warm-transfers direct to client · **the AI is the soundboard operator** (today humans fire hotkeys tied to clips; AI replaces them, every clip choice logged per-turn: context → clip → outcome → optimization loop; learnings transfer to human floors). Fact stream has two grains: per-dial and per-turn.

## Stack

Telnyx VoIP/voice-AI (decided) · ViciDial candidate dialer core (Asterisk/MariaDB/PHP/Perl; APIs: NON-AGENT_API.txt + AGENT_API.txt at vicidial.org/docs — Agent API is the likely AI-agent seam; wrapped in `src/clients/vicidial/`) · Supabase preferred app backend (not hard req) · AWS + Snowflake available for analytics (AutoWeb impression-logging precedent) · LeadConduit (ActiveProspect; REST/JSON; flows/sources/recipients; Firehose worth evaluating) · Command Center emulation for transfer priorities · Node.js 20+/TypeScript/Fastify for the platform service (Node not yet installed on Sean's box as of 2026-07-20).

## Immediate unblockers (full table in docs/open-questions.md)

T1 Pier's V1 build (repo/prompts/Telnyx config — top priority, seeds option B) · T2 Telnyx keys + capability review (gates the A/B/C fork) · T3 LeadConduit API access (Joseph) · T4 pre-auth endpoint spec (Joseph) · T5 Command Center transfer-priority surface · T6 techss_ disposition write-back contract · T7 Supabase · T8 AWS/Snowflake · T9 Ashley's daily dashboard · T10 ViciDial sandbox on EC2 · T11 DNC/validation surface.

## Next session agenda (scope-doc sections not reached 7/17)

Call-flow mechanics (warm-transfer leg: bridging, crediting, no-answer path) · scope boundary (IN/OUT of v1, what "dialing paused" means) · day-to-day operation & control inventory · DID strategy, recordings, DNC inheritance · economics (cost baselines vs KB/TD/CD, canned-coverage split point) · milestones/success thresholds for the 2–3 week slice.
