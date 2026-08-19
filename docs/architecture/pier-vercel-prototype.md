# Pier's Vercel Prototype — "AI Dialer — Prototype" (reference only)

Documented 2026-08-03 by introspecting the deployed JS bundle (the app is a static
Vite/React SPA — no backend, no API calls, no credentials embedded). Shared by Pier in the
Sean↔Pier 1:1 Teams chat on **2026-07-28**: https://ai-dialer-prototype-e7ia.vercel.app/

**🆕 2026-08-19:** Pier re-shared it in team Teams chat ("really click through it — the
campaign builder i think showcases a solid UI for dialing patterns") and added Sean as
collaborator on the source repo, `github.com/piermadsen-blcalls/ai-dialer-prototype`.
Full source read (one 1,611-line `App.jsx`, all data hardcoded) confirms the 8/3 bundle
dissection and adds hard provenance: **every commit is 2026-05-12** (13:24–14:54, UI dated
"Monday, May 11") — the prototype predates the 7/17 founding call by two months and the V1
post-mortem economics entirely. It is almost certainly pitch-stage material from the
original directive, which reframes its divergences as pre-project thinking, not competing
current design (and Pier had already self-updated on the biggest one — soundboard — by
7/30, below). §"Campaign builder" added below per his 8/19 pointer.

> **Status (Sean, 2026-08-03): old artifact, frame of reference at best.** It does NOT
> trump anything planned for the new concept — `docs/PRD.md` remains the governing
> artifact. Value here is (a) vocabulary insight into how Pier pictures the system, useful
> for the PRD-merge conversation, and (b) the credential/T2 status it settled (below).
>
> **✅ Partially superseded (Sean, 2026-08-19): promoted to the console's UI model.**
> After the 8/19 review (Sean visual pass + full source read), Sean told Pier: "I'm going
> to model the aicc app after it" — best of this prototype + Ashley's dashboard view +
> the remaining operational surfaces (script uploads etc.). The promotion is **UI/UX
> only**; the architecture divergences below (Telnyx-hosted AI vs soundboard-first, DID
> cooling loop vs retire-don't-remediate) remain superseded by the PRD and
> `did-lifecycle.md`. See `control-panel-scope.md` for the console framing.

## What it is (and isn't)

It is **not** a live dialer and holds no secrets — it's an interactive architecture
walkthrough with a hardcoded demo narrative (555 numbers, fictional "Michael Chen" bath
remodel lead): a snapshot of Pier's mental model around the 7/29 "prd diffs" sync and his
7/30 demo-flow Teams message, not a spec.

Three-panel system model: **Lead source** (form provider / list supplier / API partner) →
**Orchestration (this app)** ("Lead/campaign/cadence/DID logic") → **Telnyx (dialer + AI)**
("All telephony + AI agents"). Also present: a DID **Rotation lifecycle** tab
("orchestration decides when a number is 'burned'; Telnyx's API handles the purchase and
release"), "8 agents · all hosted on Telnyx AI Assistants", named agents seen:
`bath_remodel_warm`, `home_warranty_warm`.

## The 10-step flow it depicts (verbatim-adjacent from the bundle; not binding)

| # | System | Step | Detail |
|---|---|---|---|
| 0 | lead-source | Lead submitted | Form provider POSTs to our webhook |
| 1 | orchestration | Ingestion + dedup | Normalize to E.164, check **person table**, attach-or-create person |
| 2 | orchestration | Enrichment + routing | Carrier lookup, timezone from area code, **lead score**; source filter → campaign assignment |
| 3 | orchestration | Cadence scheduled | Touch 1 immediate, but **TCPA quiet hours** push to 9:00am PT next day |
| 4 | orchestration | Dial decision | Cadence engine fires; **DID selector picks a healthy same-area-code number**; job sent to dialer |
| 5 | telnyx | Call originated | Call Control API, **AMD enabled, bridge target = AI assistant** (`bath_remodel_warm`) |
| 6 | telnyx | Answered + AMD | AMD on first 1.5s; verdict HUMAN; **no AI cost until AI engaged** |
| 7 | telnyx | Bridged to AI | Bridge in-network to Telnyx-hosted AI Assistant; ~90s conversation |
| 8 | telnyx | Transfer triggered | AI invokes **`transfer_call` tool**; warm transfer to sales line |
| 9 | orchestration | Outcomes captured | `call.completed` webhook (duration, recording URL, transcript, transfer outcome) → **attempts / conversations / transfers** tables; lead status → transferred |

## How it compares to PRD Draft v1 (context for the merge conversation, not diffs to "settle")

- **Where it already agrees with the PRD:** no ViciDial; orchestration app owns
  queue/cadence/DID logic; Telnyx owns telephony; AMD-before-AI cost gating (same instinct
  as soundboard cost control); webhook event capture into per-call tables; DID burn/rotate
  via Telnyx number APIs; warm transfer as an AI tool call (matches
  `soundboard-llm-interface.md` tool-calling frame).
- **Where it's older thinking the PRD supersedes:** (1) conversation layer shown as
  **Telnyx-hosted AI Assistants** (pure generative voice) — the PRD's soundboard-first
  hybrid stands, and Pier's own 7/30 Teams message already moved toward it ("soundboard
  plays, ai assistant picks voice responses from soundboard"); (2) fresh-lead form intake +
  person dedup + lead scoring framing vs the PRD's revive-first LeadConduit intake;
  (3) generic table vocabulary (person/attempts/conversations/transfers) vs our migration
  schema (leads/calls/call_turns/call_events); (4) no OLeadID/FS-code anywhere —
  the FiveStrata plumbing that is the PRD's whole point is absent from its frame.
- **Ops signal worth keeping:** Pier has a working Vercel deploy path — a candidate target
  for the orchestration app's public webhook endpoint (the "tunnel/deploy" unblocker).

## Campaign builder (Pier's 8/19 pointer — UI reference for console Phase-2 screens)

Pier: "the campaign builder i think showcases a solid UI for dialing patterns." From the
source, the 6-step wizard (Basics → Leads → Cadence → Agent → DIDs → Review) maps almost
1:1 onto `campaign-delivery.md`'s L0 wizard + pre-activation review. Elements worth lifting
directly into the Phase-2 screens:

- **Cadence step (the "dialing patterns" UI):** preset chips (Aggressive fresh / Standard
  fresh 5-touch·7d / Revival 3-touch·4d) → editable numbered touch rows, each with
  When / Time / **If-no-answer next-action** dropdowns → a live **SVG timeline preview**
  (touches plotted on a day axis with the legal calling window shaded beneath) → a
  **projected-outcomes panel** (dials / conversations / transfers / est. spend / days to
  complete, "based on past 7d") → an amber **"things to check" card** (e.g. "142 leads are
  on your DNC list — skipped automatically", "Touch 4 on a Friday rolls to Monday"). The
  preview + pre-flight-warnings pattern is exactly the L2 binding-constraint ledger's
  "why isn't it faster" ethos applied *before* activation.
- **Leads step:** auto-route-by-source-filter vs static-list toggle, with a live
  "N leads match this filter now, ~X/day going forward" count.
- **Review step:** config summary + projections side by side, compliance checklist,
  single Activate button — matches the decided pre-activation review.
- Overview page also has a **"Dial queue · next 24h"** widget (Ready now / within 4h /
  tomorrow / held-outside-window) — a good console rendering of L3 job state.

**One 5/12-era divergence to NOT lift:** the DIDs "Rotation lifecycle" tab models a
remediation loop — health score (0.50×answer-rate-ratio + 0.30×(1−short-call rate) +
0.20×(1−inbound-callback rate)), Active → 7-day Cooling → 50-test-call re-evaluation →
back-to-Active-or-retire, 70 dials/day cap. `did-lifecycle.md` (post-CIDR, 8/17) decided
the opposite: retire-don't-rest, no remediation, ~20/day budget, 1,500 lifetime. The
prototype's *input signals* (short-call rate as spam proxy, inbound "who is this"
callbacks) do echo our two-eye monitoring, and its callback-rate term is a point for the
D17 inbound path — but the cool-down/re-test loop itself is superseded. Screen layout
(state cards + per-number table + thresholds-as-settings) remains a fine visual for D12.

## Credential status this settles (2026-08-03)

- V1 Supabase holds **no keys** (re-verified: `system_flags` = the two kill switches only).
- The prototype bundle holds **no keys** (static mockup).
- The Telnyx account was being stood up ~7/30 (Pier's Teams note: pay-as-you-go until
  $10k/mo commit; card needed). Live demo calls ran from **Pier's environment**, not this
  machine — local `.env` predates the account (Jul 21). **Remaining T2 ask is now just:
  Sean gets org access / API key from Pier's Telnyx portal into `.env`** (never in the repo).
