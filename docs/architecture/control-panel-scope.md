# Control Panel (W8) — Build Scope

**Status:** ✅ Decided (Sean, 2026-08-14): build the initial layer now, on **Vercel**, with
Pier's prototype (`ai-dialer-prototype-e7ia.vercel.app`, shared 7/28 — see
`pier-vercel-prototype.md`; 🆕 8/19 Pier re-endorsed it in team chat, specifically the
**campaign builder** for Phase-2's campaign-wizard screens, and granted repo access —
builder-UI elements to lift are itemized in that doc) as the design reference.
**✅ Promoted to UI model (Sean → Pier, 8/19):** after reviewing visuals + full source,
Sean told Pier "I'm going to model the aicc app after it." Console UI north star =
**best of the prototype + Ashley's dashboard view (`reporting/kb-wi-dashboard-spec.md`)
+ the remaining operational surfaces** (e.g. script/must-hit uploads and the other
wizards in `tenant-lead-sourcing.md`). **UI and flow only — Sean 8/19: "there are going
to be some hard content differences"; "our job is to use it as a reference as we actually
lay out OUR app."** The content divergences are enumerated in `pier-vercel-prototype.md`;
the resulting screen layout is §"Screen layout" below. Supersedes the PRD's "hosted on Netlify"
wording (functionally equivalent choice; Vercel is Next.js-native and matches Pier's
demonstrated deploy path). Driver for pulling this forward from Step 3: **AutoWeb is already
asking to use the platform** — their use case is most instructive if the tenant-aware initial
layer exists first.

**What this is:** the PRD §6/§7-component-4 "control panel" — the web app teams log into.
Internal-facing only (tenants = business units: CV first, AutoWeb next). Not customer-facing,
no billing, no public signup.

---

## Stack (all ➤ default choices, cheap to revisit before Phase 0 ends)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router, TypeScript)** | PRD-specified; Vercel-native |
| Hosting | **Vercel** (Pro plan — Hobby tier prohibits commercial use; ~$20/seat/mo, Sam/Tatevik approval line) | Pier's demonstrated deploy path; zero-config Next.js |
| Repo | `console/` directory inside **this repo** (Vercel "root directory" setting) | one repo = project memory stays whole |
| Data reads | `supabase-js` with **user JWT + RLS** (anon key in browser; service key only in server-side route handlers, never shipped to client) | tenant isolation enforced in the database, not the UI |
| Data writes | Postgres RPCs / existing Edge Functions only — the console never raw-updates tables | invariants live server-side |
| Auth | **Supabase Auth**; ➤ Azure AD / Entra SSO (org is M365) with email magic-link fallback | no new passwords; company identity |

## The tenant/program backbone (Phase 0's real work)

Migrations 0001–0004 have **no tenant model** — everything keys on a bare `vertical` text
column. The 7/23 design in `tenant-program-onboarding.md` (tenants / programs / playbooks,
canonical disposition dictionary + per-program mappings) was ➤ proposed and never applied.
The console build is the forcing function to land it:

- **Migration 0005** — ✅ **APPLIED 2026-08-14** (Sean-authorized, via `db-apply.ts`; verified:
  2 tenants, 4 programs, dispo dictionary seeded, 40 demo leads+calls backfilled onto
  `fs-windows-fresh`). Contents (additive only — shared V1 project rules apply): `tenants`, `programs`,
  `program_field_defs`, `program_dispositions`, membership table (`console_users` ↔ tenant,
  role), `tenant_id`/`program_id` columns on our tables (nullable, backfilled for CV),
  RLS policies keyed on membership.
- Seed: tenant `fivestrata` (programs `fs-bathroom-revive`, `fs-windows-fresh`, `fs-hw`),
  tenant `autoweb` (status `draft`, empty — the sandbox their pilot lands in).
- This is what makes the AutoWeb conversation concrete: their program has a foreign lead
  payload (vehicle data), no ZIP transfer priorities, and its own dispositions — the three
  things the playbook model claims to absorb with zero code. Their onboarding is the test.

## Phases

### Phase 0 — Foundations (~1–2 days)
Scaffold `console/` (Next.js + TS + Tailwind); Vercel project wired to this GitHub repo
(auto-deploy on push, preview URLs per branch); Supabase Auth configured; migration 0005
applied via `db-apply.ts` + seeds; tenant switcher skeleton.
**Gate:** Sean and Pier can log in at a real URL and see the CV tenant's (empty) shell;
AutoWeb tenant visible but empty.

### Phase 1 — Working console: plumb everything that has live plumbing (~1 week)
**✅ Revised (Sean, 2026-08-14): no look-only tier.** Supersedes the PRD/roadmap
"look-only screens first" sequencing. Every screen ships with its write path wired to a
backend capability that exists today; reads are just the live state those writes act on.
Writes only through RPCs/Edge Functions, every mutation audit-logged (`inbound_events`
pattern), all scoped by tenant/program via RLS. Ship order = what's plumbable now:
1. **Ops overview** — tiles + per-turn feed + daily results + funnel (ports the PoC page's
   queries: `v_rdaily`, `v_daily_results`, `call_turns`, `dids`); retires
   `src/routes/dashboard.ts`
2. **Controls / kill switches** — edits non-secret `dialer_config` keys the agent already
   reads live (pause dialing, persona/test toggles, inbound IP enforcement) — real effect on
   the running system from day one
3. **DNC console** — lookup/add/remove fronting the live `fivestrata-inbound` `dnc`/`undnc`
   endpoints (server-side, same key auth)
4. **Lead intake** — CSV mapping wizard (program-scoped: header auto-map onto canonical
   core + `program_field_defs`, validation report, batch commit + batch undo — full design
   in `tenant-lead-sourcing.md` §1), fronting `fivestrata-inbound /leads` semantics
5. **Clip/script manager** — list, play back, upload → Telnyx media storage (the
   `clips-upload.ts` path, server-side), version tags; the ack-improvement loop's clip edits
   move here from laptop scripts
6. **Buyers & priorities editor** — `transfer_priorities` CRUD
7. **DID pool** — burn bars + status (reads), guarded purchase/retire via the Telnyx API
   (`did-purchase.ts` guards: caps, no-op rules), CNAM status
8. **Call history** — searchable, outcome + cost + recording link, per-turn drill-down.
   Phone numbers **masked to last-4 by default** (unmask = explicit role, logged)
**Gate:** a real operating action (pause, DNC add, lead load, clip swap) happens from the
console with no laptop scripts; PoC dashboard route deleted.

### Phase 2 — Engine-coupled controls (lands WITH the queue-engine work)
Screens whose backend doesn't exist yet — the console builds the config surface first and
the engine is written to read it (config-first, so nothing here is throwaway):
1. Campaign builder (label → program campaign; cadence config per
   `tenant-lead-sourcing.md` §5: `max_dials_per_lead`, `min_rest_hours`, daily dial
   budget, calling hours) — **now fully specified as the L0 wizard in
   `campaign-delivery.md`** (pool → budget/timeframe → computed-cascade review pane →
   activate; migration 0010 APPLIED 8/18)
2. Pacing/caps + per-campaign stop switches (beyond the global `dialer_config` switches) —
   backed by `campaign_days` + `campaigns.status` per `campaign-delivery.md` §4/§7
3. Split-test config (A/B assignment on clip/script versions)
4. Buyer-pool CSV wizard + per-program transfer strategy (internal pool for non-Command-
   Center tenants — `tenant-lead-sourcing.md` §2)
5. Script builder: ingest script → tagged `script_lines`, **must-hit lines compliance-
   locked** and enforced as state-machine gates, clips generated per voice pack
   (`tenant-lead-sourcing.md` §3)
6. Sourcing panel: source picker + price band + combine toggle per program
   (`tenant-lead-sourcing.md` §4; consent-scope gate mandatory)
**Gate:** the dial queue engine reads its entire runtime config from tables the console
writes; a full operating day requires no laptop scripts. Schema for all of the above =
migration 0007 draft (see `tenant-lead-sourcing.md`).

### Phase 3 — Tenant onboarding + learning loop (timed to the AutoWeb engagement)
Onboarding wizard that writes playbook rows (field defs, dispo mappings, calling hours,
delivery target) — "onboarding touches zero TypeScript and zero DDL" gets proven here;
AutoWeb pilot program end-to-end in `testing` status; overnight-suggestions surface;
recordings search; per-tenant cost attribution; Snowflake-backed long-range reports (after
first sync lands).

## Screen layout — Pier's prototype as reference (Sean 8/19: "model the aicc app after it")

Layout/flow lifted from the prototype; content from the decided architecture ("hard
content differences" — Sean 8/19). Builds nothing new: every cell references a phase item
above or a decided doc.

| Console screen | Prototype ancestor (what we lift) | Our content (source of truth) |
|---|---|---|
| **Overview** | Overview page: KPI tile row, campaign cards w/ progress, live-now panel, **dial-queue-next-24h widget**, DID mini-health, quick actions | Phase-1 §1 ops queries; tiles = dials vs plan, contact rate (real-vs-fake), transfers, spend/dial; campaign cards carry the **L2 binding-constraint chip** ("why isn't it faster" at the top level); queue widget = `dial_jobs` due buckets |
| **Campaigns** (+ builder) | List → expandable detail; **6-step builder**: preset chips, touch rows, SVG cadence timeline w/ shaded legal window, projected-outcomes panel, amber pre-flight card, review-then-activate | L0 wizard (`campaign-delivery.md`): Basics → Pool (+consent-scope gate) → Budget/timeframe → Cadence overrides (narrowing-only) → Review = the computed cascade (enrollment count, geography, L2 dials/day plan + binding constraints, DID coverage-gap suggestions) → Activate. Detail = `campaign_days` ledger, not a progress bar |
| **Leads** | Table + status tabs + bulk-action bar; lead detail w/ activity timeline | OLeadID-keyed, phones masked last-4, canonical dispos, next-attempt from `dial_jobs`; detail timeline = `calls` + per-turn `call_turns` drill (recording/transcript links); upload = Phase-1 §4 CSV wizard |
| **Live** | Live-calls page: state counts (ringing/AMD/in-conversation/on-transfer) + active-call list | `call_events` stream; per-turn clip feed; "Listen" button = Phase-3 candidate (Telnyx media streaming) |
| **Programs** (replaces "Agents") | Card-grid layout only | The biggest content rewrite: playbooks — script/must-hit lines (Phase-2 §5), voice packs + clip manager (Phase-1 §5), dispo mappings, field defs, cadence defaults, sourcing panel (Phase-2 §6) |
| **DIDs** | 4-tab layout: state cards, lifecycle diagram, per-number table, **thresholds-as-settings** | `did-lifecycle.md` states (screening/warming/active/resting/quarantined/retired), burn bars vs 1,500, screen-before-first-dial results, guarded buy/retire, D17 inbound activity |
| **Reports** | Saved-report card grid w/ schedule + owner | Ashley's KPI dictionary (`kb-wi-dashboard-spec.md`) + 0002 views; Snowflake long-range = Phase 3 |
| **Controls · DNC · Buyers** | (no ancestor — new screens, same visual language) | Phase-1 §2/§3/§6 |
| **How it works** | **System-flow animated walkthrough** — Pier's most distinctive UI idea | Retarget the animation to OUR cascade (L0 wizard → L1 enroll → L2 plan → L3 jobs → L4 DID claim → engine → outcomes). Phase 3; doubles as demo/onboarding collateral |

### Divergence triage (Sean 8/19: rationalize, incorporate, or debate — every difference dispositioned)

| Prototype element | Disposition | Why |
|---|---|---|
| Telnyx-hosted AI Assistants (STT+LLM+TTS in-network) | ⤵ **Skip — rationalized** | Soundboard-first is decided and non-negotiable (Sean 8/19); V1 economics killed pure-generative; Pier himself moved to soundboard 7/30. Prototype predates both |
| DID cooling(7d) → 50-call re-test → return-to-active | ⤵ **Skip — rationalized** | CIDR verdict (8/14): remediation/rest restores nothing; retire-don't-rest decided. Prototype predates the study |
| 70 dials/day cap (50 on high-volume pool) | ⤵ **Skip — rationalized** | Our ~20–25 budget comes from the TD decay-curve knee — evidence over instinct |
| Generic form-webhook intake + fresh-first framing | ⤵ **Skip — rationalized** | LeadConduit/batch-file + authed `fivestrata-inbound` decided; revive-first pilot w/ fresh switch built in |
| **Short-call rate (<10s) as a DID health input** | ⬆ **Incorporate — candidate 3rd signal** | Free from our per-dial fact stream; complements decline-rate + cohort answer-rate. Add to `did-lifecycle.md` §3 as a tracked-not-triggering column first |
| **Inbound "who is this" callback rate as health input** | ⬆ **Incorporate** | D17 answering inbound gives us this stream for free; prototype's 0.20 weight is the right instinct |
| Auto-purchase alerts + manual-approval threshold on mass release | ⬆ **Incorporate** | Matches our guarded auto-replacement; add alert channel (Teams, not Slack — org is M365) + >N/day release approval gate |
| Builder cost projection ($ range + $/conversation) + est. completion | ⬆ **Incorporate** | L2 plan already computes dials/day and days-to-complete; multiply by the cost model (`concurrency-queueing.md` sizing + per-dial cost note) in the review pane |
| Campaign templates / duplicate | ⬆ **Incorporate (cheap)** | Program defaults already are the template; "duplicate campaign" is natural for bounded runs |
| **Person table** (cross-lead identity: attach-or-create by phone) | ❓ **Debate** | We key on OLeadID per-lead. Same phone can hold two leads → two active campaigns: one-active-campaign-per-**lead** doesn't dedupe per-**phone**. Cadence carve-out coordination + DNC argue for a phone-level view. Assumptions discussion w/ Pier |
| Lead scoring (enrichment score; score-routed agent variants) | ❓ **Debate — parked to Snowflake lane** | No score concept in v1; `snowflake-value.md` outputs / `analytics_directives` is the natural home. Decide whether the leads table reserves the column now |
| Carrier/line-type lookup at ingest | ❓ **Debate** | Telnyx Number Lookup per lead ≈ cheap; feeds TCPA posture + IVA/contact-rate classification (a required capability). Cost-per-lead vs value at 2M dials/day scale |
| Per-touch "if no answer →" branching | ❓ **Debate** | Our cadence config (max dials, rest hours) is uniform per program; prototype has per-attempt branching. Is dispo-dependent branching a v1.1 config need or L3-engine logic that shouldn't be user-facing? |
| Toll-free fallback pool | ❓ **Debate (leaning skip)** | Our fallback is a local reserve pool (TD default-CID lesson); toll-free outbound has its own reputation regime. Only revisit if reserve-pool coverage gaps persist |

## Non-goals (v1)
Customer/public access · billing/metering · free-form generative script authoring (clip
taxonomy only) · mobile app · replacing MDB reporting (we feed it, not replace it).

## Unblockers / open questions
| # | Item | Owner | Status |
|---|---|---|---|
| C1 | ~~Vercel account~~ ✅ 8/17: team `five-strata-dialer` created by Sean (trial; Pier = developer, Brodie = billing); **DEPLOYED** via CLI as project `dialer-console` → https://dialer-console-five-strata-dialer.vercel.app. Personal card until ~9/14 — reminder set 9/8 to move billing (Sam/Tatevik) | Sean | ✅ deployed |
| C2 | ~~Vercel reachability~~ — vercel.com blocked for Claude's tooling (like Supabase); Sean drives dashboard + `vercel.cmd` CLI deploys. GitHub auto-deploy integration deferred (repo under Pier's account — his one-click approval when wanted) | Sean | ✅ workflow set |
| C3 | Auth: Entra/Azure SSO app registration (needs IT?) vs magic-link start | Sean | ❓ (start magic-link, swap later) |
| C4 | PII display policy: last-4 masking default + role-gated unmask — confirm with Brodie | Sean → Brodie | ➤ proposed |
| C5 | AutoWeb: who is the demand owner, what product/program (trade-in acquisition per 7/23 doc?), target date | Sean | ❓ |
| C6 | Pier sync: Vercel-over-Netlify + Sean building W8's initial layer (PRD assigns W8 to Pier; prototype = his design reference, so this should be a welcome pull-forward — confirm) | Sean → Pier | ❓ |
| C7 | ~~Auth redirect allowlist~~ ✅ CLOSED 8/17: Pier allowlisted the Vercel URL + localhost:3000 — **prod-URL magic-link sign-in verified working**. (History: Sean's dashboard role and Mgmt-API token both lack Auth-config write, 403 8/15; dev rode the site_url fallback meanwhile.) GitHub auto-deploy ✅ CONNECTED 8/17 (Pier, after Member-role bump; verified via API: repo linked, production branch `main` — push-to-deploy live) | Sean → Pier | ✅ |

## Provenance
Pier's PRD draft 8/6 (control panel = component 4, feature list §6) · Pier's Vercel prototype
7/28 (design reference) · tenant/program topology Sean 7/23 · pull-forward + Vercel decision
Sean 8/14 (AutoWeb demand).
