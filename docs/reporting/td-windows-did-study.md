# TD-Windows DID Study — Empirical Rotation, Decay & Reputation Data

First hard data on how a human floor actually manages DIDs, mined from the td-windows
VICIdial replica (116.202.196.60) on 2026-07-31 via `scripts/did_caps_query.py` +
`did_deepdive_query.py`. Feeds: the 7/29 DID debate (Sean↔Pier), the DID manager design,
the Snowflake `retire_did` directive (`../architecture/snowflake-value.md` row 1), and
concurrency sizing (`../architecture/concurrency-queueing.md`). Raw CSVs:
`C:\Claude\scratch\did-caps\116.202.196.60\` (not committed — aggregates only, no PII).

Data window: archive holds 2026-01-08 → 2026-07-28 (31.5M dial rows); most analyses use the
last 21–90 days. TD replica is T-1, server-local time MST. **One box, one vertical (windows)
— KB may differ.**

## 1. The 1,500-cap question — answered, with a twist

Per-DID daily dials stay **far** below 1,500 across the pool… except **exactly one DID per
day** during heavy periods (late June–early July: max_per_did 5.5K–18K/day, while
`did_days_1500_plus = 1` every single day).

That one number is **201-350-2442 — the campaign default CID**: 173,267 dials in 90 days
(next-highest normal DID: ~4K). When a lead's area code has no match in
`vicidial_campaign_cid_areacodes`, VICIdial falls back to the campaign's single default
outbound CID — so all unmatched-areacode traffic funnels through one number, torching it.

**Design lesson for AICC:** the areacode-match *fallback must be a pool, not a single DID*
(round-robin over a reserve set, counted like any other DID). One config line for us; TD
lives with a permanently-burned number instead.

## 2. How TD rotates: a big standing pool, used shallow

- **11,394 distinct DIDs** in 90 days; steady ~10K in any active week.
- **86% of the pool spans >2 months** (standing inventory, not churn-and-burn). Replacement
  runs ~100–200 new DIDs/week (~1–2%/wk).
- Median DID: **449 dials per 90 days over 43 active days ≈ ~10 dials/day**. p95 ≈ 2,130
  total (~24/day). Typical *daily* max on a normal DID: 25–40.
- Block structure: 1,578 NPA-NXX prefixes — a few big purchased blocks (200–324 DIDs in one
  prefix) plus a long tail of single numbers for area-code coverage (median 1 DID/prefix).
- Cost implication: at Telnyx bulk (~$0.60–0.70/DID/mo), replicating this pool ≈
  **$6–8K/mo for one vertical**. Whether wide-and-shallow is *optimal* (vs a smaller pool
  worked harder with benchmark retirement) is now an answerable optimization — see §3.

## 3. The decay curve — first empirical points on the 7/29 "calculus equation"

Answer rate vs dials-per-DID-per-day (21 days, all campaigns pooled):

| dials/DID/day | DID-days | dials | answered % |
|---|---|---|---|
| 1–10 | 73,585 | 365,913 | **30.2%** |
| 11–25 | 30,502 | 501,726 | **21.4%** |
| 26–50 | 10,041 | 344,934 | **18.9%** |
| 51–100 | 2,679 | 178,080 | **15.1%** |
| 101–200 | 967 | 138,383 | **12.6%** |
| 200+ | 1 | 2,126 | 1.8% |

Monotonic decline, roughly halving from lightest to heaviest use. **Caveat — confounded by
campaign mix:** the WINDOW (revive-bulk) campaign answers ~5% while WIFRESH answers ~70%
(status-flag definitions differ too), and heavy-DID days skew WINDOW. The
campaign-stratified rerun (`did_followup_query.py` E2) isolates the within-campaign effect.
Directionally it supports shallow use; the *magnitude* needs the stratified cut.

## 4. Carrier-reputation signal: SIP 603 is real and measurable

`vicidial_dial_log.sip_hangup_cause` on this box logs **SIP response codes** (200 OK, 404,
503, 486 busy, 480, 487 cancel…), *not* Q.850 causes. The spam-block signal is **603
Decline** — carriers actively refusing the call — running ~4–5.5K/day (~1.5%) in early July.
This is literally what TD's custom `603lock` column in `vicidial_campaign_cid_areacodes`
manages by hand. For AICC: per-DID 603/403 share is a *free, in-band* reputation feed — a
second input to the `retire_did` directive alongside contact-rate decay, no external
number-reputation API required (Pier's 7/29 question).

## 5. Campaign mix & volume context (30 days)

- **WINDOW** (bulk/revive): 80–400K dials/day at ~5–6% answered.
- **WIFRESH** (fresh): 20–80K dials/day at ~65–76% answered-flag (fresh-lead advantage +
  looser status flagging — decode before trusting the absolute number).
- Volume collapsed after ~7/10 (WINDOW wound down: 400K/day → <10K/day by late July) —
  worth knowing this study's tail weeks reflect a quiet floor, not steady state.
- Weekly totals swing 34K ↔ 1.5M dials/wk while the DID pool stays ~10K — TD sizes the pool
  for peak, idles it otherwise.

## 6. What AICC takes from this

1. **No intraday retirement machinery needed** — nightly Snowflake `retire_did` directives
   suffice; pacer least-used-DID pick reproduces TD's shallow spreading natively.
2. **Fallback pool, never a single default CID** (§1).
3. **Decay curve is real** → the pool-size-vs-usage optimization is worth automating; we can
   beat TD's static ~10K pool by sitting at the curve's knee per area code.
4. **603/403 share per DID** joins contact-rate decay as the DID-health inputs.
5. Concurrency sizing note: hourly slot-time data from the thin live window was unreliable;
   use the archive rerun (F2) before hardening the pacer math.

## Follow-ups

- ❓ Run `did_followup_query.py` (E2 stratified decay, F2 archive hourly, H2 603-share worst
  DIDs) — same env vars.
- ❓ Repeat on td-bathroom (swap host) and KB boxes (needs `CCDB_BARETEL_*`) for
  cross-floor comparison.
- ❓ Decode TD's answered-status flags (`vicidial_campaign_statuses.human_answered`) before
  quoting absolute answer rates anywhere.
