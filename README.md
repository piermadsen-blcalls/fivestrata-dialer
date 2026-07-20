# AICC — AI Call Center Platform (ccai)

Living context doc. Keep this current — this repo's markdown IS the project memory.
Last updated: 2026-07-20 (docs merged from the OneDrive AICC workspace; scaffold added).

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
| Dialer foundation | **ViciDial** (open source) — candidate foundational layer | proposed, no objections; gated on Telnyx capability review — see `docs/architecture/platform-foundations.md` (options A/B/C) |
| App backend | **Supabase** (Postgres) — preferred, not hard requirement | preferred |
| Analytics at scale | **Snowflake** (enterprise access) + AWS available; slave off standard MySQL if we mirror the VICI pattern | direction |
| Lead delivery in | **LeadConduit** — platform becomes another recipient endpoint, same as KB/TD/CD | decided in principle |
| Ops controls | Must emulate/plug into **Command Center** (transfer priorities, routing splits, brand rules) | decided in principle |
| Voice strategy | **Soundboard-first hybrid** — swappable voice packs (canned clips in the AI voice + TTS long tail), canned-vs-TTS telemetry | decided, revisitable |
| Runtime (this repo) | Node.js 20+ / TypeScript / Fastify | scaffolded |

Timeline pressure: 2–3 week target for a v1 slice. Dialing paused during the build (scope of "paused" not yet pinned down).

## Quasi-decided (from 7/17 call + post-call)

1. Augment, don't replace. Platform handed to CV team as a self-serve tool.
2. **Own the data, store it call-level granular.** Every dial: date, number, disposition, duration, agent, script, call center. ~62M rows/month is fine (AutoWeb impression logging in Snowflake is the precedent). All reporting derives from this one fact stream. Two grains: per-dial and per-turn. Tiered retention: hot indexed window, then aggregate/archive.
3. ViciDial as the off-the-shelf dialer base — Ashley: ~75% of call centers she's worked with run it; cheap, malleable, well-documented. (Direction, gated on Telnyx review.)
4. Lead flow in via LeadConduit, split upstream by percentage like today; we become a new small-percentage source, gated by performance. LeadConduit only retains 3 months; our DB holds ~5 years — revive inventory comes from our own DB (mirror Joseph's KB bulk-upload feature).
5. Pilot on **revive** first, an existing vertical (not HW — weak comparison), but build the fresh/revive switch from day one.
6. Client-selection timing: keep pre-call auth as a *default/fallback* client, re-request the client at qualification time (Joseph's design). Don't front-load pings — ping when needed, as the human call centers do. **Async always** — no synchronous external calls in the call path.
7. Branding is a candidate to drop or genericize ("trusted partner") — not a client requirement, distorts round-robin fairness, voice-actor bottleneck. But Ashley's old test showed branding lifted quality/sales — with AI TTS branding is nearly free, so likely keep it cheap. Test-worthy.
8. Prompting mechanism is a first-class feature: support both hard-coded script variants (stored, versioned, AI selects A/B/C) and generalized guidelines, and make them testable against each other.
9. **Voice strategy: soundboard-first, TTS as fallback.** Pre-generate canned audio *in the AI voice*; play canned clips for common paths, synthesize the long tail. Voice pack (canned library + TTS voice + script version) swaps as a unit. **The AI is the soundboard operator** — every clip selection is a logged per-turn decision (context → clip → outcome), giving the optimization loop; learnings transfer to the human soundboard floors.
10. **No human screener/closer layer** (working assumption unless expressly redirected). AICC → client warm transfer, end-to-end AI.
11. `OLeadID` is the cross-system key; dispositions write back to `techss_` tables so MDB and dashboards keep working.
12. Native DID retirement caps (~1,500 dials/DID) — a differentiator no current call center offers.

## This repo (scaffold)

```
CLAUDE.md                    Claude Code bootstrap — read first
src/
  index.ts / server.ts       Fastify entry + route registration
  config.ts                  env-driven configuration (.env — never committed)
  clients/
    vicidial/                typed wrappers: Non-Agent API + Agent API (the likely AI-agent seam)
    telnyx.ts                Telnyx SDK + webhook signature verification
    supabase.ts              Supabase service-role client
  routes/
    leads.ts                 POST /leads — LeadConduit recipient endpoint
    webhooks/telnyx.ts       POST /webhooks/telnyx — call-control events -> call_events
    health.ts                GET /health
  services/
    leadRouter.ts            intake -> persist -> VICI list; two-phase client selection stub
    callLog.ts               granular call/event persistence
supabase/migrations/         schema: leads (OLeadID), calls (per-dial), call_events,
                             call_turns (per-turn clip decisions), voice_packs/voice_clips,
                             dids (1,500-dial caps), clients, transfer_priorities, scripts
docs/
  scoping-outline-redlined.md   the scope doc with ✅/➤/❓ answers (shareable summary)
  open-questions.md             business/ops questions + technical access list T1–T11
  architecture/platform-foundations.md   ViciDial eval, options A/B/C, Telnyx, data tiers
  meetings/2026-07-17-scoping-call.md    distilled founding meeting
  transcripts/                  raw meeting transcripts
```

**Caveats:** the `src/clients/vicidial/` layer assumes option A/C — it swaps out if the Telnyx
capability review lands on option B. The Supabase schema currently hosts the hot call tables;
per the architecture doc, whether the dialer's hot write path stays in Supabase is an open
A-vs-B question.

### Getting started

1. Install Node.js 20+ (not yet installed on this box as of 2026-07-20), then `npm install`.
2. Copy `.env.example` to `.env`; fill Supabase, Telnyx, VICIdial credentials. **Never commit `.env`.**
   For `SUPABASE_SERVICE_ROLE_KEY` use the **secret** key (`sb_secret_...` / "service_role") —
   not the `sb_publishable_` key, which is client-safe only and can't do server-side operations.
3. Apply `supabase/migrations/0001_init.sql` to the Supabase project.
4. `npm run dev`.

## Open questions

See [docs/open-questions.md](docs/open-questions.md) — business/ops (15) + the technical access list (T1–T11). Top unblockers: T1 Pier's V1 build, T2 Telnyx keys + capability review (gates the A/B/C fork), T3 LeadConduit access, T4 pre-auth endpoint spec.

## Action items

- **Sean**: summarize decided vs open, send to team; schedule follow-up session early week of 7/20; brief Pier (incl. Ashley's ping-timing correction).
- **Ashley**: share the daily dashboard; review summary and add input async.
- **Team**: next session covers the scope-doc sections not reached (call flow mechanics, scope boundary, ops controls, DID/recordings/DNC, economics, milestones).

## People

Pier Madsen (co-lead, reports direction from Payam), Sean Stott (co-lead, data/architecture), Kinsey Jackson (VP product — process, revenue/cost, ops), Ashley Smith (call-center vendor/dialer/carrier relationships; ops expert), Brandon Titensor (analyst — standalone analysis, dashboard automation), Alex Lin (analyst — vendor/BD ops, routing operations), Joseph Yordan (sysdev — LeadOps, LeadConduit plumbing, call-center integrations), Cromwel (DBA).

## Related internal context (Claude skills — available in this repo's `.claude/skills/`)

`fivestratadb` (prod techss_ MySQL), `callcenterdb` (KB/TD VICIdial replicas — 7 servers, profiled catalogs, query cookbook), `fivestrataops` (MDB, dashboards, owners, cadences). The platform must keep feeding what these describe — dispositions back into techss_ tables so MDB and dashboards keep working.

## External references

- Scope outline (Sean's Google Doc): https://docs.google.com/document/d/1bEwwRbtAZkXfzOzcug0SBfVGESy4-LQ-518nHdfLokk
- Redlined outline (Google Drive): doc id `1r5FL-ySMmLCcUo_YFSPN9POWtXY2q29O4XJDWgbzHWg` (mirrored at `docs/scoping-outline-redlined.md`)
- Original workspace: `C:\Users\SeanS\OneDrive - Autoweb\Documents\Claude\Projects\AICC` (superseded by this repo)
