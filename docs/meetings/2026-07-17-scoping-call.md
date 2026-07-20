# Scoping Call — AI Call Center Platform (v2)

2026-07-17, 59m. Attendees: Pier Madsen (led first half, left ~26m), Sean Stott, Kinsey Jackson, Ashley Smith (out ~18m–54m, fire call), Brandon Titensor, Alex Lin, Joseph Yordan.

Sean's scope outline guided the call. Sections 0 (feature ask), 4 (data & integrations), and the media/BD prompt got real coverage; sections 1–3, 5, 6 (call flow, scope boundary, ops, economics, milestones) were **not reached** — that's the agenda for the follow-up early next week.

---

## 1. Vision reset (Pier, from Payam)

- V1 ("just build something, see if it works") is done: it kind of works, but replacement is dead. The call centers are extremely cost-effective; the experiment proved it's "crazy hard to compete on price."
- New end state: **an AI call center platform the CV team owns and operates at will** — run any calls through it, train AI agents, test prompts head-to-head, and use it as fallback capacity when dialing goes down (hurricane scenario: produce *something* even at worse margin).
- Kinsey: pressure to replace/lower cost is off — months of meetings taught Payam/Sam how tricky carrier + dialer + agents really is. This is "a tool, not the thing that replaces everything else."
- Framing for features (Pier): everything must either make the AI convert better, or emit the information that lets the team make the *human* call centers better (lead routing, which leads convert where, dial cadence). Revenue linkage is the test.

Three use-case framings that emerged:
- **Ashley — controlled experiment bench**: mimic the current process exactly, get it to a profitability point, then change one thing at a time ("what happens if we don't say this for an hour?") and read the effect. Accepts it may never fully match human performance on long calls.
- **Kinsey — new product lane**: e.g. hot transfers — buy fresher leads, 45-second script, different price point, test if quality matches warm transfers.
- **Pier — vertical spin-up accelerator**: new verticals/lead types are painful today (scripts, branding, setup); the platform should make iteration fast before anything hits the real call centers.

## 2. Prompting mechanism (Brandon → Pier)

- Today's V1 AI: end goal + general guidelines, freeform within them. Alternative: prescribed script variants (soundboard-like) stored as data — AI picks between stored responses A/B/C, variants quickly editable.
- Agreed as a **required feature**: support both modes and test between them. Pier's prior: soundboard scripts probably don't transfer cleanly to voice AI, but we currently have no way to test that — the platform creates one.
- Sean: the AI layer is the fun part; the real lift is the backend — Telnyx hookup and wiring everything to our services.

## 3. KPIs and analytics (Kinsey, Ashley, Brandon)

- Master metric: **sales per hour**. Feeds: dials per hour, contact rate (contacts/dial), lead consumption (per day/hour/queue), completes (when a lead finishes).
- Ashley: the daily dashboard already holds every metric they actually use — share it with Pier/Sean as the baseline spec. New need on top: **real vs fake contacts** — IVAs/spam have broken contact-rate reliability ("my whole career it was reliable"), which distorts DID replacement decisions.
- Brandon: daily vs weekly dashboards exist as two pulls only because the daily pull lacks leads-delivered-per-call-center-per-day. Fix: make everything daily, and store data **as granular as possible** — aggregate ourselves, always able to drill back down. Today partner reports arrive pre-aggregated (FS-code level) — can't split by geo within an FS code. And it lives in Excel: "even MySQL would be an upgrade."

## 4. Data architecture consensus (Sean, Brandon, Joseph)

- Target: **a row per dial** — call date, number dialed, disposition, duration, agent, script, call center. Brandon sizes it at ~62M rows/month across call centers; per-center 6–10M.
- Sean: precedent exists — AutoWeb logs every ad impression un-aggregated and queries it performantly in Snowflake. This volume is manageable in the right store.
- Brandon: with the call-level fact stream, **no other data is needed** — everything derives from it. Sean: today's analytics pain is exactly the lack of direct line-level access; "us not controlling the data now is why we have problems getting the analytics."
- Joseph: wants their-end→our-end sync so nobody has to request reports; today we lack visibility into what's on the partners' end. Caution: keep it **asynchronous** — don't put sync data calls in the call path (latency). Retention idea: keep recent data hot, dump/aggregate as it ages (Sean concurred).

## 5. ViciDial as foundation (Sean, Ashley)

- Sean raised it: completely open source/free (it's what BareTel runs), take it off the shelf, add "our own herbs and spices."
- Ashley: **~75% of the call centers she's worked with run ViciDial**. Cheap, endlessly customizable — "not each Vici is created equal; the smarter you are, the more you can make Vici do." No hesitation voiced by anyone.
- Sean: abundant public case studies/docs make it easy to ingest into AI-assisted development.

## 6. Integrations & lead flow (Sean leading, Joseph answering)

- Day-one plugs: **LeadConduit** (lead delivery) and **Command Center**. Joseph: nothing else needed.
- Fresh leads flow through LeadConduit today; adding our platform = pointing LeadConduit at our API endpoint, configured like BareTel/TopDial but feeding our machine (Kinsey confirmed the pattern, Joseph confirmed feasibility).
- LeadConduit retains only **3 months**; the full ~5-year lead history lives in our own DB — revive sourcing comes from our server, not LeadConduit.
- Current routing mechanics:
  - **Revive**: TopDial = manual FTP upload (was Joy's task); KB = a feature Joseph built that bulk-uploads 100K rows straight into their VICIdial (bypasses the 20K web-upload limit).
  - **Fresh**: Command Center percentage split per vertical (Joseph built, Alex operates; Ashley calls changes based on call-center inventory/performance). Currently 100% HW→KomBea, 100% bathroom→CanadaDirect, 100% windows→TopDial.
  - Mutual exclusion is upstream: a lead is assigned to exactly one call center at the split; percentage "chances," not round-robin, because DNC validation ordering in LeadOps constrains where the split can happen.
- Sean: fine as-is — we're just added as another upstream split, starting small, volume gated by performance.

## 7. Pilot scope

- Existing vertical, **not** home warranty (HW's low stakes/high supply appealed, but the comparison against current performance would be weak). Revisit once the engine exists.
- **Revive first** (voice AI has been strongest there), fresh later — but build the fresh/revive switch in from day one (Kinsey: eventually both; Sean: control the switch).

## 8. Media/BD wishes (Kinsey, Alex)

- Today: zero control post-handoff — "here's the batch, they dial it, we cross our fingers."
- Wants: **sub-source and geo-level performance routing** (sub-source strong on windows/weak on bathrooms → route accordingly; Florida-strong sub-source → concentrate there). Sunrun example: client only accepts leads from approved URLs — impossible to honor today, feasible if we own the routing and data.
- Alex: given supply constraints (we take what we can get), sub-source routing is the best available lever.
- Sean: this is exactly the class of question that's hard to ask BareTel but trivial to query when we own the data.

## 9. Client selection, transfer priorities, round-robin (Kinsey, Brandon, Joseph, Ashley)

- Command Center **transfer priorities** control per-client volume shares; the platform must plug into or emulate that same system (agreed).
- Problem: uneven distribution in overlapped zips — e.g. Chicagoland 400 leads vs a neighbor client's 3 in near-identical zips; also cross-category (to feed LEI in bathrooms, Alex deliberately loads windows revive batches). Kinsey wants this **automated**, not manually tweaked.
- Mechanics today (Brandon/Joseph): before dialing, the call center pre-authenticates — our endpoint returns the client for that lead. Round-robin therefore distributes *calls*, not *sales* — a plausible cause of the skew.
- Sean floated **bidding** (highest RPL wins) as an alternative allocation.
- **Joseph's design (direction agreed)**: keep pre-auth client as a *default/fallback*; re-request the client once the lead qualifies; if the API is slow/down, fall back to the pre-auth default. Brandon's variant (auth at a script milestone) folded into this.
- Ashley (returning, key correction): call centers control ping timing themselves — KB/CD/TD ping mid-call for branding, then again near the end for the transfer; only the AI v1 pings everything up front (Pier's build — acceptable at tiny volume, but front-loaded pings historically burdened the system, and late pinging is why NI7s show up without other dispositions). Platform rule: **ping when needed, not at call start**.

## 10. Branding (Kinsey, Ashley, Joseph)

- Kinsey: branding is **not a client requirement** — it's something we offer. Costs: locks the sale candidate at call start (worsens round-robin fairness), and tech setup waits on voice-actor recordings (Bryan — chronically late, a month on the latest batch). Proposal: drop branding or go generic ("one of our trusted partners"), which also lets new clients go live immediately.
- Ashley: an old branded-vs-unbranded test showed branding **lifted quality and sales** (perceived legitimacy). 
- Sean: with AI TTS, branding is nearly free (the voice just says the client name) — so the voice-actor bottleneck disappears either way; and note branding vs round-robin skew are partly separable issues.
- Joseph: removing branding changes the workflow (pre-auth becomes post-qualification client selection — dovetails with his fallback design) and requires script changes per call center.
- Status: open, test-worthy; AI platform makes the test cheap.

## 11. Closers

- Sean asked whether human closers are in scope for a "true AI call center." Brandon: only KomBea's AI product uses a dedicated closer; human agents everywhere else effectively close their own sales. Question left open on the call.
- **Post-call resolution (Sean, 7/17)**: no human screener/closer layer, working assumption unless expressly redirected — AICC warm-transfers directly to the client. Also: soundboard-first voice strategy (canned clips in the AI voice, TTS for the long tail, swappable voice packs) since TTS is expensive vs soundboard. Both captured in README and architecture docs.

## 12. Wrap

- Sean: will summarize decided vs open and circulate; follow-up session targeted Mon/Tue; will sync Pier (including Ashley's ping-timing correction — "he will now").
- Ashley: will review async and send additions.

---

## Scope-doc coverage map

| Outline section | Status |
|---|---|
| 0. Core ask — features by seat | Partially covered (analytics deeply, ops wishes partially) |
| 1. Call flow (transfers, closer, soundboard vs TTS, fresh/revive) | Only fresh-vs-revive decided; rest **next session** |
| 2. Scope boundary (in/out of v1, pilot, "paused") | Pilot vertical direction only; rest **next session** |
| 3. Who runs it / controls / day-one reporting | Not reached |
| 4. Data & integrations | Covered: LeadConduit, Command Center, granular data, retention. DID/recordings/DNC **next session** |
| 5. Economics | Not reached |
| 6. Milestones & 2–3 week plan | Not reached |
