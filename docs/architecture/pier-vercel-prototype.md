# Pier's Vercel Prototype — "AI Dialer — Prototype" (T1/T2 intel)

Documented 2026-08-03 by introspecting the deployed JS bundle (the app is a static
Vite/React SPA — no backend, no API calls, no credentials embedded). Shared by Pier in the
Sean↔Pier 1:1 Teams chat on **2026-07-28**: https://ai-dialer-prototype-e7ia.vercel.app/

## What it is (and isn't)

It is **not** a live dialer and holds no secrets — it's an interactive architecture
walkthrough with a hardcoded demo narrative (555 numbers, fictional "Michael Chen" bath
remodel lead). Treat it as **Pier's requirements spec for the end-to-end dialer, encoded as
a clickable demo**. It complements — and should be reconciled with — `docs/PRD.md` (the
7/29 "prd diffs" sync and Pier's 7/30 demo-flow message are the same conversation).

Three-panel system model: **Lead source** (form provider / list supplier / API partner) →
**Orchestration (this app)** ("Lead/campaign/cadence/DID logic") → **Telnyx (dialer + AI)**
("All telephony + AI agents"). Also present: a DID **Rotation lifecycle** tab
("orchestration decides when a number is 'burned'; Telnyx's API handles the purchase and
release"), "8 agents · all hosted on Telnyx AI Assistants", named agents seen:
`bath_remodel_warm`, `home_warranty_warm`.

## The 10-step end-to-end flow (verbatim-adjacent from the bundle)

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

## Reconciliation notes vs PRD Draft v1 (diffs to settle in the merge)

- **Converges:** no ViciDial; orchestration app owns queue/cadence/DID logic; Telnyx owns
  telephony; AMD-before-AI cost gating (same instinct as soundboard cost control); webhook
  event capture into per-call tables; DID burn/rotate via Telnyx number APIs; warm transfer
  as an AI tool call (matches `soundboard-llm-interface.md` tool-calling frame).
- **Diverges / to reconcile:** (1) conversation layer is **Telnyx-hosted AI Assistants**
  (generative voice) vs PRD's soundboard-first hybrid — Pier's 7/30 Teams message already
  bridges this ("soundboard plays, ai assistant picks voice responses from soundboard
  (and/or a telnyx voice ai picks up)"); (2) **fresh-lead form intake + person dedup +
  lead scoring + cadence engine** are in Pier's flow but thin/absent in PRD P0 (revive-first,
  LeadConduit intake); (3) his table vocabulary (person/attempts/conversations/transfers) vs
  our migration vocabulary (leads/calls/call_turns/call_events); (4) no OLeadID/FS-code
  anywhere in the prototype narrative — FiveStrata plumbing is out of its frame.
- **Ops signal:** Pier deployed this on **Vercel** — a candidate deploy target for the
  orchestration app's public webhook endpoint (the "tunnel/deploy" unblocker).

## Credential status this settles (2026-08-03)

- V1 Supabase holds **no keys** (re-verified: `system_flags` = the two kill switches only).
- The prototype bundle holds **no keys** (static mockup).
- The Telnyx account was being stood up ~7/30 (Pier's Teams note: pay-as-you-go until
  $10k/mo commit; card needed). Live demo calls ran from **Pier's environment**, not this
  machine — local `.env` predates the account (Jul 21). **Remaining T2 ask is now just:
  Sean gets org access / API key from Pier's Telnyx portal into `.env`** (never in the repo).
