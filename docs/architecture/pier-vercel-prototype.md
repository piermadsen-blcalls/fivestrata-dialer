# Pier's Vercel Prototype — "AI Dialer — Prototype" (reference only)

Documented 2026-08-03 by introspecting the deployed JS bundle (the app is a static
Vite/React SPA — no backend, no API calls, no credentials embedded). Shared by Pier in the
Sean↔Pier 1:1 Teams chat on **2026-07-28**: https://ai-dialer-prototype-e7ia.vercel.app/

> **Status (Sean, 2026-08-03): old artifact, frame of reference at best.** It does NOT
> trump anything planned for the new concept — `docs/PRD.md` remains the governing
> artifact. Value here is (a) vocabulary insight into how Pier pictures the system, useful
> for the PRD-merge conversation, and (b) the credential/T2 status it settled (below).

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

## Credential status this settles (2026-08-03)

- V1 Supabase holds **no keys** (re-verified: `system_flags` = the two kill switches only).
- The prototype bundle holds **no keys** (static mockup).
- The Telnyx account was being stood up ~7/30 (Pier's Teams note: pay-as-you-go until
  $10k/mo commit; card needed). Live demo calls ran from **Pier's environment**, not this
  machine — local `.env` predates the account (Jul 21). **Remaining T2 ask is now just:
  Sean gets org access / API key from Pier's Telnyx portal into `.env`** (never in the repo).
