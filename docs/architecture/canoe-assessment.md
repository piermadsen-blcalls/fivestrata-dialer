# Canoe (Buyerlink Lead/Call Exchange) — Fit Assessment for AICC

Reviewed 2026-07-30 from Confluence exports (RP Product Documentation space: Canoe Integration
Process, Naming Conventions, API Integrations Value Mapping) + an example advertiser posting doc
(Best Case Leads / LeadsPedia). Note: Confluence PDF exports truncated the deep pages — the
sections "The Exchange (Canoe)", "How Bidding Works", "Pay Per Call API", and "Incoming Call
Flow" were visible only as titles. Conclusions below are ➤ directional pending those pages.

## What Canoe is

Canoe ("The Exchange") is RingPartner/Reply's — Buyerlink-owned — **lead and call marketplace**:

- **Supply in:** publishers submit form leads and inbound calls, organized by *vertical* with a
  canonical snake_case field dictionary (first_name, phone_home, has_attorney, …) and value
  lists per field.
- **Demand out:** *advertisers* (buyers) integrate their APIs as **Advertiser Campaigns**.
  Canoe **pings** advertiser APIs in real time; the APIs **bid** on each lead/call; the winner
  gets the lead **posted** to their API. Campaigns can also carry hours/geo/budget settings
  when the advertiser's API can't self-manage them.
- **API-Integrations + Value Maps:** the adapter layer. Advertiser APIs vary arbitrarily
  (JSON/XML, hundreds of unique field names, bespoke value formats); Value Maps are
  string-templating config that translate Canoe's canonical fields into whatever each
  advertiser expects — integration as configuration, no code. (Field validation appears to use
  validatorjs-style declarative rules.)
- Plus the marketplace chrome: publisher/advertiser dashboards, stats/transactions, accounting,
  a Pay-Per-Call API and incoming-call routing.

The Best Case Leads doc is the mirror image — what an *advertiser's* ping/post spec looks like
(ping with partial fields → bid/accept + ping_id → post full lead), i.e. the LeadsPedia-style
industry standard Canoe speaks.

## Overlap map vs AICC

| Canoe concept | AICC concept | Read |
|---|---|---|
| Ping (partial data) → bid → post (full lead) | Two-phase client selection (pre-auth → re-request at qualification) | Same shape — validates our design; theirs generalizes it to *price* bidding |
| Advertiser Campaign (hours/geo/budget) | transfer_clients + transfer_priorities + calling windows | Equivalent semantics |
| API-Integrations + Value Maps | Playbook `program_connections` delivery adapters | **Canoe already built our adapter layer**, mature and config-driven |
| Vertical field dictionary + naming conventions | Canonical disposition/tag/field taxonomies | Same philosophy; theirs is field-level for leads |
| Pay-Per-Call API / incoming call flow | Warm-transfer delivery | ❓ Potentially: sell qualified AICC transfers into Canoe's buyer network |
| Bidding | Parking-lot "bid/RPL-based client allocation" | Canoe is an existing engine for exactly this |

## What Canoe is NOT (for us)

Not a dialer, not outbound orchestration, not voice AI, not a results/analytics store, not
recording/DID management. It sits entirely on the **demand/delivery side**. Nothing in our core
build is replaced by it.

## Verdict

➤ **Don't build on it; build an adapter to it.** Concretely:

1. **v1 (3-week slice): no Canoe.** FiveStrata's transfer buyers already have direct
   relationships and Command Center economics; inserting a marketplace adds nothing to the
   pilot.
2. **Design hook now (free):** `program_connections.transport` gains a `canoe` value alongside
   leadconduit/sip/http. One adapter, written once, and any program can deliver leads or calls
   into the exchange.
3. **Strategic option later (the real attraction):** AICC produces qualified leads/transfers;
   Canoe monetizes them across Buyerlink's whole advertiser network — highest-bidder-wins
   allocation (Kinsey's RPL idea) without us building a bidding engine or buyer-side adapters
   (their Value Maps already speak every advertiser API). Also the interop Sean flagged: other
   company products speak Canoe, so AICC output becomes company-legible.
4. **Borrow one idea immediately:** Value-Maps-style string templating for our delivery
   adapters, and validatorjs-style declarative rules for `program_field_defs` intake
   validation — both proven in-family patterns.

## To verify before any adapter work

Export/read: "The Exchange (Canoe)", "How Bidding Works", "Pay Per Call API", "Incoming Call
Flow". Open questions: does pay-per-call handle *warm transfer* semantics (agent-to-agent
handoff + buyer acceptance) or only inbound consumer calls? Exchange fees/economics vs direct
Command Center relationships? Is Canoe accepting new internal supply partners, and who owns it
today (David He is deactivated)?
