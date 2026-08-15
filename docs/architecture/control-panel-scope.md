# Control Panel (W8) — Build Scope

**Status:** ✅ Decided (Sean, 2026-08-14): build the initial layer now, on **Vercel**, with
Pier's prototype (`ai-dialer-prototype-e7ia.vercel.app`, shared 7/28 — see
`pier-vercel-prototype.md`) as the design reference. Supersedes the PRD's "hosted on Netlify"
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

- **Migration 0005** (additive only — shared V1 project rules apply): `tenants`, `programs`,
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

### Phase 1 — Look-only console (~2–3 days) → retires the PoC `dashboard.ts`
Read-only screens, all scoped by tenant/program via RLS:
1. **Overview / live board** — tiles (dials, contacts, qualified, transfers, canned-vs-TTS %),
   recent per-turn feed (ports the PoC page's queries: `v_rdaily`, `v_daily_results`,
   `call_turns`, `dids`)
2. **Daily results** — the Ashley-dashboard emulation (`v_rdaily`), filterable
3. **Transfer funnel** — interested → announced → accepted, per day/program
4. **Call history** — searchable, outcome + cost + recording link, per-turn drill-down.
   Phone numbers **masked to last-4 by default** (unmask = explicit role, logged)
5. **DID pool** — burn bars, status, retirement history
6. **Config viewer** — non-secret `dialer_config` keys, read-only
**Gate:** shareable URL replaces "Sean runs `npm run dev`"; Pier/Brodie/Ashley can open it
cold. PoC dashboard route deleted.

### Phase 2 — Screens that change things (~1–2 weeks, incremental ship per screen)
Writes only through RPCs/Edge Functions; every mutation audit-logged (`inbound_events`
pattern). Priority order per Ashley's likely needs:
1. Stop switches + pacing/caps (per program)
2. Campaign builder (label → program campaign, cadence, hours, max_attempts)
3. Clip/script manager — list, play back, upload → Telnyx media storage (server-side),
   version tags; the ack-improvement loop's clip edits move here from scripts
4. Buyers & priorities editor (`transfer_priorities`)
5. DNC lookup/add (fronts the live `fivestrata-inbound` dnc endpoints)
6. Manual lead file upload (fronts `fivestrata-inbound /leads`)
7. Split-test config (A/B assignment on clip/script versions)
**Gate:** a full operating day requires no laptop scripts.

### Phase 3 — Tenant onboarding + learning loop (timed to the AutoWeb engagement)
Onboarding wizard that writes playbook rows (field defs, dispo mappings, calling hours,
delivery target) — "onboarding touches zero TypeScript and zero DDL" gets proven here;
AutoWeb pilot program end-to-end in `testing` status; overnight-suggestions surface;
recordings search; per-tenant cost attribution; Snowflake-backed long-range reports (after
first sync lands).

## Non-goals (v1)
Customer/public access · billing/metering · free-form generative script authoring (clip
taxonomy only) · mobile app · replacing MDB reporting (we feed it, not replace it).

## Unblockers / open questions
| # | Item | Owner | Status |
|---|---|---|---|
| C1 | Vercel account: new org account vs formalizing Pier's; Pro plan approval (~$20/seat/mo) | Sean → Pier, Sam/Tatevik | ❓ |
| C2 | Is vercel.com reachable from Sean's tooling (org browser policy)? CLI-token deploys are the fallback; Git-integration auto-deploy needs no local access at all | Sean | ❓ test |
| C3 | Auth: Entra/Azure SSO app registration (needs IT?) vs magic-link start | Sean | ❓ (start magic-link, swap later) |
| C4 | PII display policy: last-4 masking default + role-gated unmask — confirm with Brodie | Sean → Brodie | ➤ proposed |
| C5 | AutoWeb: who is the demand owner, what product/program (trade-in acquisition per 7/23 doc?), target date | Sean | ❓ |
| C6 | Pier sync: Vercel-over-Netlify + Sean building W8's initial layer (PRD assigns W8 to Pier; prototype = his design reference, so this should be a welcome pull-forward — confirm) | Sean → Pier | ❓ |

## Provenance
Pier's PRD draft 8/6 (control panel = component 4, feature list §6) · Pier's Vercel prototype
7/28 (design reference) · tenant/program topology Sean 7/23 · pull-forward + Vercel decision
Sean 8/14 (AutoWeb demand).
