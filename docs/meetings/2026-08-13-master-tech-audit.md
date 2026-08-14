# 2026-08-13 — Master Tech Audit (FiveStrata full-stack walkthrough)

**Duration:** 2h13m transcribed (billed as ~2.5h). **Led by:** Brodie Brown (VP), working right-to-left through the whole FiveStrata stack on a shared Excalidraw board.
**Attendees:** Brodie Brown, Joseph Yordan, Sean Stott, Alex Lin, Brandon Titensor, Cromwel Castaneda, Taylor Andrew (partial — new, first exposure to the stack).
**Artifacts:** raw transcript `docs/transcripts/2026-08-13-master-tech-audit.txt` (scraped from Teams recap; stitched, some duplicate echo lines); whiteboard export `docs/architecture/2026-08-13-master-tech-audit-whiteboard.excalidraw`.
**Purpose (Brodie):** map the entire business/tech stack end-to-end so the team — and the AI ("ultimate goal... bug AI and have it explain") — has shared architecture context.

Provenance legend: ✅ stated as fact by the owner · ➤ stated belief / "my understanding" · ❓ explicitly unresolved in the meeting.

## The whiteboard in one flow

```
Media Partners ──FR──> LC: Record Intake ⇄ Record Intake API ⇄ Lead Destination Rules ──> Call Centers
Inventory (revive) ──RV──> Batch Upload ─────────────────────────────────────────────────┘
Darwin ──approved zips──> Media Partners; ──aff. zip list upload──> Record Intake API

Call Centers box: KB (BareTel API / ViciDial), TD (JainTel?, ViciDial), CD (own platform), AI CC
  • every call: zip lookup → Transfer Client API (returns transferCode/wtclient + brandId)
  • on dispo:  post → LC: Lead Intake (routes by dispo, DNC adds, misbranding alert, batch lookup;
               logs to NO table; end-of-day batch → Master Dashboard)
LC: Lead Intake ──> LC: Client Lead Post (per client) ──> Canoe ──> Client   [new clients]
                                        └──direct LC post──> Client          [legacy clients]
                                        └──email post (successful transfers)─> Client [all + email-only]
LC: Client Lead Post ──> all_leads.sentData
Client ──> Quality Data; ──> Return Portal ──> returns in db (Brandon reviews)
CSMs: Client Pricing & Budgets (Command Center) ──> Meridius (automated) ──daily caps──> Transfer Client API
```

## 1. Lead delivery to clients (Joseph owns lead post; David McKay owns Canoe)

- ✅ Three delivery channels: (a) **Canoe** (Ring Partner's product, managed by David McKay) holds client CRM API integrations for **newer clients** — FS posts its own schema to Canoe with an integration ID, Canoe translates and posts to the client CRM; (b) **legacy clients**: posting instructions live directly in their per-client LeadConduit "lead post" flow; (c) **email-only clients** (e.g. Essler) get emailed successful transfers. ✅ All clients additionally get an emailed copy of lead data for every successful transfer.
- ✅ A per-client **lead post flow** is created automatically when a client is created in Command Center. It posts to the client, tags the lead as sent in **`all_leads` sentData**, filters test leads. Owner: Joseph.
- ➤ Canoe is becoming a Buyerlink-wide shared delivery service (marketplace side uses it too). Joseph: fine as a proxy client-side, **not** appropriate for record/lead intake (single point of failure — Canoe outage previously blocked client delivery). Replacing record intake with Canoe judged impractical (Record Intake API ~1,300 lines of custom logic).
- ✅ TrustedForm does not currently gate delivery; clients can filter at their CRM (accept/reject on agreed criteria). FS declines per-URL TrustedForm restrictions (Sunrun ask).
- ✅ **Rejections** (client CRM refuses a post): contractually not accepted; CSMs manually email clients to bill them; **Brandon manually re-adds rejected leads to the Master Dashboard** (not to sentData). Brandon's rejection report is a manual LeadConduit pull — ❓ likely only catches legacy direct-post clients, possibly blind to Canoe-integrated rejections (Joseph to ask David).
- ✅ **Returns** (distinct from rejections): Return Portal in Command Center → Brandon manually accepts/rejects on a separate review site → on save, a trigger inserts a row into sentData flagged not-inserted (Cromwel) → surfaces in Master Dashboard. Site had an outage during the AWS config switch; Joseph fixed.

## 2. Lead Intake (call-center dispo endpoint — Joseph)

- ✅ One **master LC endpoint ("Lead Intake")** all call centers post to on every call dispo (qualified, not-qualified, DNC — "any call disposition"). It: routes by dispo to the client-specific lead post; adds DNC numbers to internal DNC; does a batch lookup; raises a **misbranding alert** when the brandId the call center posts differs from what Transfer Client API assigned. Does **not** append lead data.
- ✅ **Logs to no table.** Its only persistence path is an end-of-day LC "batches"-scheduled report into the Master Dashboard. (Brodie: if no-contacts flow through here, that's call-level data we could be storing.)
- ❓ Whether call centers post **No Contact** dispos to Lead Intake — Joseph to check; Brodie assumes not.

## 3. Call-center vendor topology (messier than our docs)

- ➤ "KB / Kombea / TD / CD" is shorthand that hides the real structure. **Kombea is a technology layer**, not the call center: ➤ the actual call centers using Kombea tech are **RAV and EIS** (two separate companies, each with multiple sites). ✅ **BareTel** manages the domain, API, and the ViciDial platform for that stack ("sending leads to Kombea" = posting to a BareTel-managed API).
- ✅ FS receives **separate invoices** from Kombea, BareTel, EIS, and RAV; plus Top Dial and JainTel separately; plus one all-in-one from Canada Direct. ✅ "KB has retreated" from managing the bundle — Ashley now manages each relationship directly (same stack underneath). ➤ Some day-to-day complexity is managed by **Amir** (partner side).
- ❓ **Top Dial vs JainTel** confusion is real even for Joseph: TD sometimes uses JainTel's domain; JainTel uses Top Dial's soundboard; one TD site uses ProtoCall or BareTel. Ashley to disambiguate.
- ✅ **Canada Direct is NOT ViciDial** — own undisclosed platform, still an all-in-one packaged service (no carrier/dialer visibility).
- ✅ Soundboard tech differs: TD uses different soundboard tech than Kombea's; "Teddy vs ProtoCall" distinction is Kombea-side (ProtoCall = Kombea tech; ProtoCall AI = its AI product). ✅ **Top Dial is building its own AI** as well — direct competition for the AI CC.
- ✅ Brodie explicitly places the **AI CC as a peer at the call-center level** of this diagram, and voiced the strategic case: "a lot of margin being eaten away [by the invoice stack]... if we could just own it, since we're being forced to anyways"; plus revive elasticity ("scale up and down at will... never send agents home").

## 4. Transfer Client API (client selection — the "every call" path)

- ✅ Call centers call the **Transfer Client API** *before or on* contact — Kombea/TD call it **before contact, i.e. on every dial** (enormous request volume). Returns the warm-transfer client (**transferCode / wtclient**) and **brandId** (which brand to speak).
- ✅ Selection inputs: client caps (from Meridius), client hours/pauses, and **client_active_zips** (zip lookup drives availability).
- ✅ Allocation logic: round-robin to get every active client **at least one lead per day** first (tiebreaker ~alphabetical), then cap/percentage based. A WT assignment counts **0.1** in the round-robin tally; an actual sent lead counts 1 — so assignments don't lock allocation.
- ✅ Recent update: response to call centers now carries **less information**, while internal logs record the full selection rationale (which clients were considered and why the winner won).
- ✅ CSM inputs come from **Client Pricing & Budgets** in Command Center (monthly budget, max/day, front-load vs spread); **Meridius** (automated SPROCs; Brodie built the original, Sean/Cromwel automated) translates those into the daily caps the API consumes.

## 5. Fresh leads (Record Intake → Lead Destination Rules)

- ✅ Media partners post to the **Record Intake LC flow** (the endpoint FS gives partners); the flow's only job is calling the **Record Intake API** (~1,300 lines; Joseph refactoring into a class + separate files), which does: dupe check (❓ window unconfirmed — "last day or so"; Joseph auditing; `techss_all_leads.leadProcessingStg` is the dupe-check table per the 8/12 tech sync), internal DNC check, TrustedForm URL validation, phone sanitization, and **FS code generation/normalization** (fixing missing pipes, malformed values).
- ✅ **FSCode1 anatomy**: `VT:BR|PD:1|CH:AD|SC:TC|CP:HOAD2|` — vertical, (aged) data/product flags, channel, source, campaign. The CP value is the **pricing tier** (HOAD1/2/3...). FS codes are static per partner campaign (Joy issued them at setup; partners don't know their meaning — pure pricing/tiering mechanism).
- ✅ **VT:ALL** leads get a vertical assigned by zip lookup against the affiliate zip list (`affiliate_live_zips` / "affiliate active zips" view), `ORDER BY vertical DESC, effective_date DESC` — ❓ nobody knows why vertical DESC (joke answer: "gives Windows first").
- ✅ **VTO ("vertical original")** preserves the partner-sent vertical when FS overrides VT to dial on a different vertical; lives as a field on affiliate leads (not in FSCode2 — FSCode2 carries SS/SA sub-source attributes). Fresh sent-data vertical always matches FSCode1 *because* the value is overwritten; revive frequently doesn't match.
- ✅ Joy (via Alex's async Q&A): "we do not assign FSCode1; the vertical is assigned to what I upload in the database based on Darwin" — i.e. **Darwin's LeadConduit A/B zip-list files carry a vertical column**, and record intake's zip lookup against that upload assigns the dial vertical. Verified live on the call that the Darwin output file contains a vertical column. ➤ So "Darwin decides fresh dial vertical" may already be mostly true — exact code path to be confirmed once Brodie gets LC access.
- ✅ **Lead Destination Rules** then allocates by FSCode1's vertical: rules assign call center + CampaignID + ListID with a Split% (examples on the call: bathroom 100% Canada Direct; HW 100% "Kombea" campaign `FS Fresh` list `1000`; Kombea/CD share BR 50/50 at times). Alex operates per Ashley's direction.
- ➤ Brodie's direction: **decouple** partner FS codes from dial vertical — partners keep sending static codes; FS decides dial vertical internally (zip lists as the lever). Not a decision yet; investigation assigned.

## 6. Revive (batch building → upload)

- ✅ Cadence: **batch building ("reviving") Mondays** (Alex); **uploading** in chunks through the week on Ashley's request, sized by her call-center **hours targets**. Thursday: **Revive Optimal Calculator** (inputs: inventory, current active zip list, reserve, Meridius) outputs optimal revive count per client minus current reserve; Friday: numbers entered in the **Revive Batch Tool** (Command Center). Windows verticals currently prioritized top of the revive order.
- ✅ Why drip-feed instead of Monday bulk: fresh volume is variable, call-center outages force purges/reassignments, and an overfull hopper is unrecoverable — but the flip side is Fridays often run dry and agents get sent home. (Brodie: another argument for the AI CC's elasticity.)
- ❓ **ROC overestimation**: requested revive counts far exceed actuals (Essler: ask ~550K get ~330K; small bathroom batches near-zero: limit 30,000 → got 19; 10,000 → 298; 35,000 → 1). Suspected zip overlap / cross-client contention. **Assigned: Alex + Brandon.**
- ❓ **Reserve anomalies**: CD bathroom uncallable collapsed ~95K → ~11K while Windows uncallable balloons (eating callable). Possibly lingering Darwin coverage gaps (leads in zips with no buyer) or Chicagoland zip changes (7/24). **Assigned: Alex + Brandon.**
- ✅ Reserve = fresh leads sitting at the call center, split callable=1 / callable=0 (dialable per current zip list); weekly reserve view by vertical/CC pulled directly from Reserve.

## 7. Misc facts & context

- ✅ Revenue scale stated: **$15–20M/month**.
- ✅ Tool-name lore: gladiator names (Maximus, Decimus, Meridius) from a departed team member ("his ghost haunts us still"); Darwin predates them (natural-selection etymology — only the fittest zips survive).
- ✅ PX partner duplicate-rejection issue: Joy suggests partners scrub against "the suppression file" — ❓ nobody on the call knows what it is; Brodie/Brandon/Sean to track it down in the repos (Brandon has full repo access; access for Brodie and Sean requested/fulfilled).
- ✅ Sean/Brandon now have **full LeadOps repo access**; Brodie has an open IT ticket for LeadConduit login.
- Taylor Andrew joined as a fresh set of eyes (new; role TBD — plans to use AI to digest the architecture); left early for another meeting.

## Open questions raised (also mirrored on the whiteboard)

1. Where do we find **Canoe-integrated rejections**? Does Brandon's manual LC pull miss them? (Joseph → David McKay)
2. Does Lead Intake receive **No Contact** dispos? (If yes: call-level data we're currently dropping.)
3. Does Lead Intake log anything anywhere? (Answered on call: no table; EOD batch to MDB only.)
4. Why does the **Revive Optimal Calculator** overestimate available RU (zip overlap?)? — Alex + Brandon
5. Why did CD bathroom uncallable reserve crash while Windows uncallable balloons? — Alex + Brandon
6. What exactly is the **suppression file/list** partners can scrub against? — Brodie/Brandon (repo dig)
7. Exact **dupe-check window** in Record Intake API — Joseph auditing (`leadProcessingStg`)
8. Why `ORDER BY vertical DESC` in the VT:ALL tiebreaker view?
9. Where precisely does the **VT override (VTO)** happen in code, and is Darwin's vertical column the driver? (Blocked on Brodie's LC access; then audit record intake + affiliate zip tables with an example lead.)
10. Top Dial / JainTel / ProtoCall / BareTel site-level entanglement — Ashley to map.
