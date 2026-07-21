# V1 Build (Retell-based) — Architecture & Post-Mortem (T1)

Documented 2026-07-20 by read-only introspection of the V1 Supabase project (Sean-provided
credentials; structure + aggregates only, no lead rows). Complements — does not replace — T1's
remaining ask: Pier's repo, prompts, and Retell/Telnyx account config.

**Provenance (Sean, 2026-07-20):** V1 "did not come even close to the live call centers. The
voice AI is too expensive, which we are solving for differently" (→ the soundboard-first
hybrid voice strategy in [platform-foundations.md](platform-foundations.md) §2).

## What V1 is

A queue-orchestrated outbound AI dialer with **Supabase Postgres as the dialer brain** and
**Retell AI as the voice-agent layer** (not Telnyx-native voice AI; Telnyx presumably remains
the carrier underneath — confirm in Pier's config). Architecturally it is **option B in
embryo**: no ViciDial anywhere, campaign semantics hand-built in Postgres.

### Core mechanics (from schema + RPCs)

- **`dial_queue`** (84,075 leads loaded) — one row per lead: full contact fields, `oleadid` +
  `vendor_lead_code`, `fscode1/2/3`, `list_type` (fresh/revived enum), vertical,
  `attempts`/`max_attempts`, `attempts_today` (+date), `earliest_next_dial_at` (retry ladder),
  `final_disposition`, `dnc_requested`, per-call cost columns, `call_attempts` jsonb history,
  `calldispo_ext_fives` (the techss_ write-back disposition format).
- **Lease pattern for dial dispatch:** `lease_next_dial` / `release_lease` / `complete_dial`
  RPCs with `lease_token`/`leased_at`/`leased_until` — worker claims a lead, dials, completes;
  `sweep_stuck_in_flight` recovers crashed calls; `expire_aged_leads` retires stale inventory;
  `count_dials_today` for pacing caps.
- **`agent_routing`** — Retell agent per vertical × list_type with **weight, active flag,
  per-state routing (`state_codes`) and a dedicated outbound DID per state** (OH/IL/MO/TX seen
  + catch-all). Interesting: agents are named "HVAC Outbound - <ST>" while vertical=BR —
  naming suggests repurposed agent templates.
- **`zip_allowlist`** (9,215 zips) + `replace_zip_allowlist` RPC — geo gating.
- **`system_flags`** — operational kill switches: `dialing_paused` = **true, reason "manual
  kill", set 2026-07-08** (V1 is currently stopped), and `pause_on_first_transfer` (armed) — an
  auto-stop after the first successful transfer, i.e. a safety for early testing.
- **Call results:** `call_log` (2,003 calls) keyed by `retell_call_id`, plus raw
  `retell_call_import` / `retell_export_history` (transcripts, user sentiment, disconnection
  reason, latency, recording URLs — Retell's export shape).
- **`v_daily_call_summary`** — daily rollup at call_date × list × fscode1 × state with dials /
  contacts / sales / dnc / abandon / almost_sale / lost_sale / **tAtt / tSucc / tAgree** and
  per-cost-line totals — i.e. Ashley's DailyResults grain, already emulated, plus costs.
- **FS codes are first-class:** `parse_fscode` RPC; views expose parsed `sc/cp/vt/ch`.

## What V1 actually did (June 2026, BR revive)

| Metric | Value |
|---|---|
| Dials | 1,974 |
| Contacts | 29 (~1.5% contact rate) |
| Sales | 5 |
| Talk time | 1.2 hours |
| DNC | 0 · Transfers (tAtt/tSucc/tAgree) | **all 0** |
| Total cost | **$783.19** |
| Cost mix | voice engine $434.97 (56%) · TTS $118.64 (15%) · telephony $118.64 (15%) · LLM $94.90 (12%) · BVC $16.04 (2%) |
| Unit economics | **$0.40/dial · $27/contact · ~$157/sale** |

Dialing was manually killed 2026-07-08. Queue status (1,000-row sample; PostgREST caps
responses at 1k): pending 477, exhausted 309, completed 178, expired 36 — most of the 84K
loaded leads were never worked.

**Cost benchmark:** KB's blended AI screener+closer runs ≈ $5.86–5.96/hr and human sites
≈ $6.23–7.43/hr (see [../reporting/kb-wi-dashboard-spec.md](../reporting/kb-wi-dashboard-spec.md));
at KB's ~0.2–0.3 SPH that's roughly **$25–35/sale**. V1's ~$157/sale is ~5× worse — matching
Sean's assessment. Note the structure of the failure: 83% of spend (voice engine + TTS + LLM)
is the AI stack itself, and it's billed against *dial time*, not just talk time (1.2 talk-hours
cannot explain $435 of voice-engine cost at per-minute rates — the meter runs on unanswered
call handling too). This is precisely the cost line the soundboard-first hybrid attacks:
canned clips cost ~nothing to play; TTS/LLM only on the long tail.

- ❓ `cost_bvc` meaning unconfirmed (branded voice clips?). ❓ Whether "sales" here maps to
  qualified or sold. ❓ Transfer counters all zero — V1 apparently never warm-transferred
  (consistent with `pause_on_first_transfer` armed and waiting).

## What V2 inherits vs. changes

**Keep (proven in V1):** the queue + lease dispatch pattern and its RPC vocabulary; per-call
cost telemetry as first-class columns; FS-code parsing at intake; `oleadid`/`vendor_lead_code`
keys; `calldispo_ext_fives` write-back format; system-flag kill switches (incl.
pause-on-first-transfer as a testing safety); per-state DID + agent routing; the daily summary
view in Ashley's grain.

**Change:** voice economics (soundboard-first hybrid voice packs instead of pure generative —
THE lesson of V1); transfer leg actually built and instrumented (tAtt/tSucc/tAgree were never
exercised); two-phase client selection; per-turn decision logging (absent in V1); contact-rate
improvement (1.5% is far below human-floor rates — DID reputation/rotation and pacing are
untouched levers in V1); scale-out beyond the pause-on-first-transfer test posture; Retell
vs. Telnyx-native decision (Retell's per-minute voice-engine pricing is 56% of V1's cost).

## Relation to the A/B/C fork

V1 demonstrates option B's orchestration layer is buildable and already speaks FiveStrata
(the "boring 80%" was hand-built at small scale: queue, retries, pacing counters, DNC flag,
allowlists). What it does NOT validate: predictive-pacing-free economics at volume, transfer
mechanics, or carrier-level cost — see [telnyx-capability-review.md](telnyx-capability-review.md).
Remaining T1 asks to Pier: the repo/prompts (agent design), Retell account + pricing actually
paid, Telnyx config underneath, and why HVAC-named agents dial BR.
