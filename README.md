# AICC — AI Call Center Platform

Living context doc. Keep this current — this repo's markdown IS the project memory. **This repo, piermadsen-blcalls/fivestrata-dialer, is the one and only AICC repo.** Sean's cross-project FiveStrata material (DB/ops skills, DID and vendor analyses, raw meeting transcripts) lives in the separate fivestrata workspace (sostott/fivestrata, locally `C:\Claude\fivestrata`; repo cleanup 2026-08-14).
Last updated: 2026-07-28 (dialer-core decision recorded: **no ViciDial instance** — Supabase operational brain + Telnyx call path, per `docs/PRD.md` Draft v1, Sean 2026-07-27; VICIdial wrappers in `src/` now vestigial, see Caveats).

## What this is

FiveStrata is building an **AI call center platform** — a self-contained call center the CV team can operate at will. Direction comes from Payam via Pier Madsen. Sean Stott and Pier co-lead the build.

**The vision changed from V1.** V1 asked "can AI replace the call centers?" Answer: no — KB/TD/CD are extremely cost-effective and voice AI can't compete on price. V2 is a **tool that augments**, not replaces:

- A controlled playground: mimic the current process, get to profitability, then tweak one variable at a time and measure (Ashley's framing).
- A product innovation lane: e.g. hot transfers — fresher leads, 45-second script, different pricing (Kinsey's framing).
- Faster vertical spin-up: iterate scripts/flows internally before pushing to the real call centers (Pier's framing).
- Disaster fallback: if dialing goes down (e.g. Philippines hurricanes), run volume through the AI call center even at higher cost.
- Everything must tie back to revenue: either the platform produces revenue, or it teaches optimizations (routing, cadence, lead matching) that transfer to the real call centers.

No human screener or closer anywhere in the call path — the AI screens, qualifies, brands, and warm-transfers directly to the client.

## Tech stack (plan of record)

| Layer | Choice | Status |
|---|---|---|
| Voice/carrier | **Telnyx** VoIP + voice AI | decided |
| Dialer foundation | **No ViciDial instance** — Supabase is the operational brain (queue, routing, controls), Telnyx carries the calls. ViciDial kept as *vocabulary only* (dispositions, list/campaign semantics, `vendor_lead_code` ≡ OLeadID) for one-to-one comparability with the human floors; compat views if table-level comparison is ever wanted | ✅ decided — PRD Draft v1 (Sean, 2026-07-27; awaiting merge with Pier's draft); A/B/C hardened toward B in the 7/23 Sean-Pier alignment (`ac4357e`). History: `docs/architecture/platform-foundations.md` |
| App backend | **Supabase** (Postgres) — operational brain + hot call tables (30–90d window) | ✅ decided — PRD Draft v1 (was "preferred"; hardened with the dialer decision) |
| Analytics at scale | **Snowflake** results DB — every dial + every turn, 5-yr system of record; AWS available | ✅ decided — 7/22 must-have + PRD Draft v1 |
| Lead delivery in | **LeadConduit** — platform becomes another recipient endpoint, same as KB/TD/CD | decided in principle |
| Ops controls | Must emulate/plug into **Command Center** (transfer priorities, routing splits, brand rules) | decided in principle |
| Voice strategy | **Soundboard-first hybrid** — swappable voice packs (canned clips in the AI voice + TTS long tail), canned-vs-TTS telemetry | decided, revisitable |
| Runtime (this repo) | Node.js 20+ / TypeScript / Fastify | scaffolded |

Timeline pressure: 2–3 week target for a v1 slice. Dialing paused during the build (scope of "paused" not yet pinned down).

## Quasi-decided (from 7/17 call + post-call)

1. Augment, don't replace. Platform handed to CV team as a self-serve tool.
2. **Own the data, store it call-level granular.** Every dial: date, number, disposition, duration, agent, script, call center. ~62M rows/month is fine (AutoWeb impression logging in Snowflake is the precedent). All reporting derives from this one fact stream. Two grains: per-dial and per-turn. Tiered retention: hot indexed window, then aggregate/archive.
3. ~~ViciDial as the off-the-shelf dialer base~~ **Superseded — ✅ no ViciDial instance** (7/23 Sean-Pier alignment hardened A/B/C toward B — "we'd have to work around the whole human-agent build" (Pier), `ac4357e`; formalized in PRD Draft v1, Sean 2026-07-27, awaiting merge with Pier's draft). Ashley's original case (~75% of call centers run it; cheap, malleable, well-documented) survives as the reason we keep VICI *vocabulary* — dispositions, list/campaign semantics, `vendor_lead_code` ≡ OLeadID — for comparability with the human floors.
4. Lead flow in via LeadConduit, split upstream by percentage like today; we become a new small-percentage source, gated by performance. LeadConduit only retains 3 months; our DB holds ~5 years — revive inventory comes from our own DB (mirror Joseph's KB bulk-upload feature).
5. Pilot on **revive** first, an existing vertical (not HW — weak comparison), but build the fresh/revive switch from day one.
6. Client-selection timing: ✅ **REVISED 7/29 (Sean↔Pier sync, Joseph on the call): pre-call auth fires at dial time, every dial.** Joseph confirmed ~60M pings/mo is no technical or cost problem; his original defer-to-mid-call design only existed because branding removal was being discussed. Dial-time auth means the transfer number is always in hand (no mid-call API race on a live qualified caller) and **enables branding the whole call**. Keep the re-check at qualification + default-fallback as the safety net. **Async always** still holds — the auth ping precedes the dial; nothing synchronous lives in the call path. (Also learned 7/29: FiveStrata is paid for *attempting* the transfer, even if the client doesn't pick up.)
7. Branding is a candidate to drop or genericize ("trusted partner") — not a client requirement, distorts round-robin fairness, voice-actor bottleneck. But Ashley's old test showed branding lifted quality/sales — with AI TTS branding is nearly free, so likely keep it cheap. Test-worthy. **7/29 update:** dial-time pre-auth (item 6) makes whole-call branding *possible* again — some clients likely require it and new verticals may demand it; Sean's bet is it improves call response quality (A/B-testable). *How* branding is implemented (per-client branded clip sets? which surface carries the brand?) is now an open design question — see `docs/open-questions.md`.
8. Prompting mechanism is a first-class feature: support both hard-coded script variants (stored, versioned, AI selects A/B/C) and generalized guidelines, and make them testable against each other.
9. **Voice strategy: soundboard-first, TTS as fallback.** Pre-generate canned audio *in the AI voice*; play canned clips for common paths, synthesize the long tail. Voice pack (canned library + TTS voice + script version) swaps as a unit. **The AI is the soundboard operator** — every clip selection is a logged per-turn decision (context → clip → outcome), giving the optimization loop; learnings transfer to the human soundboard floors. **7/29:** ✅ platform ships a per-program **engine selector** — `soundboard` mode (CV/high-volume) vs. free `agent` mode (low-volume business units); same turn loop and logging, programs can graduate from agent → soundboard. See `docs/architecture/soundboard-llm-interface.md`.
10. **No human screener/closer layer** (working assumption unless expressly redirected). AICC → client warm transfer, end-to-end AI.
11. **Results DB is a new, separate store** (Snowflake, per-dial + per-turn) capturing *every* call — not FiveStrata's current results tables. `OLeadID` keys it back, and dispositions still **write back both ways** to `techss_` so MDB and dashboards keep working. (7/22.)
12. Native DID retirement caps (~1,500 dials/DID) + **individual benchmark-driven retirement** via the Telnyx number API — differentiators no current call center offers. Telnyx DIDs ~$1 (bulk 60–70¢), monthly subscription.
13. **Platform must-haves (Pier, 7/22):** results DB, call-recording storage (5-yr legal, FS owns the backup), DID management, and A/B testing of AI agents/scripts.
14. **Contact rate is compromised by IVAs** — logged as contacts but not real conversations; lean toward **connection rate** and live IVA disposition. Match the call centers' current dial pace (don't max out) to avoid carrier spam-blocks. (7/22.)
15. **Multi-tenant input topology** (Sean, 7/23 — requirement made explicit): the schema/logic layer targets FiveStrata rules first, but must onboard other verticals or other business units (e.g. AutoWeb trade-in acquisition) with minimal-to-zero refactoring. Meta-level **tenant → program** mapping; each program onboards via a **standard playbook** (product profile, scripts + disclosures, disposition/sentiment mapping onto platform-canonical taxonomies, declared connections/ETL) — virtually self-serve, config not code. See `docs/architecture/tenant-program-onboarding.md`.

## This repo (scaffold)

```
CLAUDE.md                    Claude Code bootstrap — read first
src/
  index.ts / server.ts       Fastify entry + route registration
  config.ts                  env-driven configuration (.env — never committed)
  clients/
    vicidial/                typed wrappers: Non-Agent API + Agent API — VESTIGIAL (see Caveats)
    telnyx.ts                Telnyx SDK + webhook signature verification
    supabase.ts              Supabase service-role client
  routes/
    leads.ts                 POST /leads — LeadConduit recipient endpoint
    webhooks/telnyx.ts       POST /webhooks/telnyx — call-control events -> call_events
    health.ts                GET /health
  services/
    leadRouter.ts            intake -> persist -> VICI list; two-phase client selection stub
    callLog.ts               granular call/event persistence
supabase/migrations/         0001: leads (OLeadID), calls (per-dial), call_events,
                             call_turns (per-turn clip decisions), voice_packs/voice_clips,
                             dids (1,500-dial caps), clients, transfer_priorities, scripts
                             0002: v_daily_results / v_rdaily / v_rlist reporting views
scripts/                     verify-setup, e2e-test, rest-introspect, v1-deepdive, v1-archive
docs/
  PRD.md                        THE GOVERNING ARTIFACT — Draft v1 (Sean 2026-07-27): the decision,
                                diagrams, P0 scope, workstreams W1–W7, exposure ramp
  scoping-outline-redlined.md   the scope doc with ✅/➤/❓ answers (shareable summary)
  open-questions.md             business/ops questions + access list T1–T11 (T10 closed) + FS-code F1–F9
  architecture/platform-foundations.md   ViciDial eval, options A/B/C (closed — decision box at top), Telnyx, data tiers
  architecture/telnyx-capability-review.md  T2 public-docs review (Call Control, AMD, DIDs, pricing)
  architecture/tenant-program-onboarding.md  multi-tenant topology: tenants/programs, playbook spec, canonical taxonomies
  architecture/multi-tenant-topology.md   one-page explainer + block diagram (the anti-confusion doc; Pier↔Sean vocabulary crosswalk)
  architecture/snowflake-value.md         what Snowflake outputs, the directives return-path into Supabase, recordings, benefits vs plain Supabase
  architecture/concurrency-queueing.md    Telnyx concurrency/CPS caps, slot-ledger pacer, backpressure queue, sizing math
  architecture/v1-build.md      V1 (Retell) architecture + post-mortem economics (T1)
  reporting/kb-wi-dashboard-spec.md      Ashley's dashboard dissected (T9) — the emulation target
  meetings/2026-07-17-scoping-call.md    distilled founding meeting
  meetings/2026-07-22-scoping-call-2.md  distilled follow-up (must-haves, DID/recordings/cadence, IVAs)
  call-scripts/                 call-center script workbooks per vertical
```

**Caveats:**

- **`src/clients/vicidial/` is vestigial.** It was scaffolded for options A/C; the dialer-core
  decision (no ViciDial instance — PRD Draft v1, Sean 2026-07-27) makes it dead code. Kept for
  reference (the Agent/Non-Agent API shapes are still useful when reasoning about the partner
  floors' replicas), not deleted — but nothing should build on it.
- **`src/config.ts` still hard-requires `VICIDIAL_BASE_URL` / `VICIDIAL_API_USER` /
  `VICIDIAL_API_PASS`** — the server won't boot without them even though they're now unused.
  Until the config is pruned, fill them with dummy values in `.env`. Same for `leadRouter.ts`'s
  "persist → VICI list" step: the list/campaign *semantics* stay (VICI vocabulary), the VICI
  API call goes.
- The Supabase schema hosts the hot call tables — no longer an open A-vs-B question: Supabase
  is the operational brain and hot store (platform-foundations §6b, PRD §5).

### Getting started

1. Node.js 24 LTS is installed on Sean's box (2026-07-20); after cloning, run `npm install`.
2. Copy `.env.example` to `.env`; fill Supabase and Telnyx credentials (VICIDIAL_* vars: dummy values — vestigial, see Caveats). **Never commit `.env`.**
   For `SUPABASE_SERVICE_ROLE_KEY` use the **secret** key (`sb_secret_...` / "service_role") —
   not the `sb_publishable_` key, which is client-safe only and can't do server-side operations.
3. Apply `supabase/migrations/0001_init.sql` to the Supabase project.
4. `npm run dev`.

## Open questions

See [docs/open-questions.md](docs/open-questions.md) — business/ops (15) + the technical access list (T1–T11, T10 closed) + FS-code F1–F9. Top unblockers: T2 Telnyx keys (playback-latency PoC, concurrency, pricing — PRD workstream W1), T3 LeadConduit access, T4 pre-auth endpoint spec. (T1 largely unblocked 7/20; the A/B/C fork T2 used to gate is now decided.)

## Action items

- **PRD is the next artifact (Pier, 7/23: "PRD is gonna be king — we can direct the rest of the build off it").** *(Done — **[docs/PRD.md](docs/PRD.md) Draft v1, Sean 2026-07-27**: opens with "the decision" box + system diagrams, remaining unknowns as workstreams W1–W7 with owners/gates. Awaiting merge with Pier's draft.)* Stakeholders pulled in: **Shelly Teh** (Snowflake), **Sam/Tatevik** (Telnyx/Supabase/Snowflake cost outline + approval).
- **Sean**: fold the 7/22 call into the doc, simplify (decisions + open questions), circulate later today *(done — this update)*. Keep pinging the team through the build.
- **Still open after 7/22**: name the pilot vertical; define "dialing paused"; draw v1 in/out; set formal success thresholds; pull KB/TD/CD cost baselines; pin the crediting rules and techss_ write-back contract; DNC inheritance.
- **Unblockers** (see open-questions T1–T11): T2 Telnyx keys (playback PoC, concurrency, pricing), T3/T4 LeadConduit + pre-auth spec (Joseph), T6 write-back contract, T8 Snowflake/AWS for the results DB.

## People

Pier Madsen (co-lead, reports direction from Payam), Sean Stott (co-lead, data/architecture), Kinsey Jackson (VP product — process, revenue/cost, ops), Ashley Smith (call-center vendor/dialer/carrier relationships; ops expert), Brandon Titensor (analyst — standalone analysis, dashboard automation), Alex Lin (analyst — vendor/BD ops, routing operations), Joseph Yordan (sysdev — LeadOps, LeadConduit plumbing, call-center integrations), Cromwel (DBA).

## Related internal context (Claude skills — available in this repo's `.claude/skills/`)

`fivestratadb` (prod techss_ MySQL), `callcenterdb` (KB/TD VICIdial replicas — 7 servers, profiled catalogs, query cookbook), `fivestrataops` (MDB, dashboards, owners, cadences). The platform must keep feeding what these describe — dispositions back into techss_ tables so MDB and dashboards keep working.

## External references

- Scope outline (Sean's Google Doc): https://docs.google.com/document/d/1bEwwRbtAZkXfzOzcug0SBfVGESy4-LQ-518nHdfLokk
- Redlined outline (Google Drive): doc id `1r5FL-ySMmLCcUo_YFSPN9POWtXY2q29O4XJDWgbzHWg` (mirrored at `docs/scoping-outline-redlined.md`)
- Original workspace: `C:\Users\SeanS\OneDrive - Autoweb\Documents\Claude\Projects\AICC` (superseded by this repo)
