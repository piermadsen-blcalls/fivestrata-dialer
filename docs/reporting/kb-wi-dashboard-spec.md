# Ashley's Daily Dashboard — Reporting Spec (T9)

Source: `KB WI Dashboard - 3.1 - 7.20.2026.xlsb` (received from Ashley 2026-07-20; KB **windows**
vertical). This workbook is the de facto day-one reporting spec — "everything in the daily
dashboard is the baseline; nothing in it goes unused." If the platform emulates it, we have
Ashley's signoff. The raw file is NOT committed (live operational file, refreshed daily); this
doc captures its structure. Emulation views: `supabase/migrations/0002_reporting_views.sql`.

## Workbook anatomy

| Sheet | Role | Grain |
|---|---|---|
| `DailyResults` | Fact table (dial-day activity) | CallDate × ListID × FS Code × State (× Voice ID × Site) |
| `ListResults` | Fact table (lead cohorts) | Received-date × List/OBLG × FS Code × State |
| `rDaily` | Report — the daily ops view | Year → Month → Week → Day rollup of DailyResults |
| `rList` | Report — cohort/consumption view | Year → Month rollup of ListResults |
| `Snapshot` | Summary — both views side by side | Year → Month |
| `Lookup` | Dimensions: list→campaign type, site cost model | — |

Two grains, exactly matching our fact-stream design: **activity by call date** and **cohort by
received date**. The daily/weekly-split problem Brandon described is solved here the same way
we plan to — everything daily, aggregates derived.

## Fact columns

**DailyResults:** CallDate, ListID, FS Code, State, Voice ID, Site, TalkTime (sec), Dials,
Contact, Complete, Sale, Abandon, Almost Sale, Lost Sale, tAtt, tSucc, tAgree
+ derived: Year/Month/Week, sub-source (parsed from FS code), campaign type (Fresh/Revived via
list lookup), **Cost = (TalkTime/3600) × site hourly rate** (from Lookup).

**ListResults:** Received date, List/OBLG, FSCode, State, Markets, Attempts, Dials, Received,
Contact, Complete, Lapsed, Qualified, Abandon, AlmostSale, tAtt, tSucc, tAgree, Still, `<4`
+ derived: Remaining = Received − Complete; `<4` = remaining leads with fewer than 4 attempts
(i.e., consumable inventory), date parts, sub-source, campaign type.

### FS code taxonomy

Format: `|VT:WI|PD:1|CH:HS|SC:ALI|CP:WIAD|` — pipe-delimited key:value tags parsed by position:
`VT` vertical (WI=windows) · `PD` (?) · `CH` channel · `SC` **sub-source** (the slicing key
Kinsey/Alex want) · `CP` campaign. The dashboard parses `SC:` per-row with MID/FIND. Our
platform should store these as first-class columns on the lead (we already carry `sub_source`
and `vertical`; confirm PD/CH/CP meanings with Brandon/Alex and add if needed).

### Transfer funnel

Three stages, tracked per row: **tAtt** (transfer attempted) → **tSucc** (transfer connected)
→ **tAgree** (client agreed/accepted). Ratios tAtt%, tSucc%, tAgree% appear in every report
tab. Our schema logs transfers via `transferred_client_id` + `call_events`; the three-stage
funnel must be explicit events (attempt, bridge success, acceptance) — feeds the warm-transfer
crediting question (business Q7).

## Report metrics (the emulation target)

**rDaily** (per year/month/week/day): Hours · Qs (qualified) · **SPH** (Qs/Hours) · SPD
(Qs/Dials) · S/C% (Qs/Contacts) · Transfers · TPH · Dials · DPH · Contacts · C/D% · Contact/Hr
· Completes · Complete/Hr · tAtt% · tAgree%.

**rList** (per received cohort): Received · Dials · **DPR** (dials per received) · Still · `<4`
· Qs · Q% (Qs/Received) · Transfers · T% · Contacts · S/C% · Contact% · tAtt% · tSucc% ·
Transfer% · Completes.

**Snapshot:** both blocks side by side, monthly.

Semantics to note: "Hours" = paid agent hours at KB — for the AI platform the analogue is
talk-time hours (and machine-time cost), so SPH needs a defined AI equivalent (flag for the
economics session). "Complete" = lead finished dialing (consumed); "Lapsed" appears only in
cohort view; Sale vs Qualified are distinct columns (confirm the KB disposition mapping against
`techss_dl.callcenter_dispos` — Brandon has the decode).

## Cost model (Lookup tab) — directly relevant to our economics section

Per-site hourly cost stack: **Machine Hour Cost + Baretel Cost + Soundboard License = Total/hr**.

- Baretel cost/hr is derived monthly: prior-month BareTel invoice ÷ hours (April: $46,334.52 ÷
  17,259 h = **$2.68/hr**).
- Soundboard license: $199/license × 150 licenses (non-AI); $1.75/hr equivalent.
- Human sites (FS-B/FS-D machine $2.80, FS-E India $1.80, FS-C TopDial $3.00): **≈ $6.23–7.43/hr total**.
- **KB's AI product rows**: Screener (machine $0.24/hr!) and Closer ($1.80/hr) blended at a
  0.75/0.25 mix → **AI Screener+Closer ≈ $5.86–5.96/hr**. This is the incumbent AI cost
  baseline our platform must beat — and note KB's AI still pays the BareTel + license stack;
  a Telnyx-native platform wouldn't.

Owners/cadence noted in the sheet: Baretel cost monthly from COGS; license counts from Ashley
as needed.

## Mapping to the platform schema

| Dashboard field | Platform source | Status |
|---|---|---|
| CallDate, Dials, TalkTime | `calls` (started_at, count, duration_sec) | ✅ |
| Contact / real-vs-fake | `calls.contact_quality` | ✅ (classification logic TBD) |
| Sale / Qualified / Complete / Abandon / Almost / Lost | `calls.disposition` + `leads.status` | ❓ needs the disposition dictionary (T6) |
| tAtt / tSucc / tAgree | `call_events` transfer events | ➤ make explicit event types |
| ListID / Fresh-Revive | `leads.lead_type` + campaign | ✅ |
| FS code → SC sub-source, VT vertical | `leads.sub_source`, `leads.vertical` | ✅ (PD/CH/CP tags ❓) |
| State | `leads.state` | ✅ |
| Received / Still / `<4` attempts | `leads` + per-lead attempt counts | ➤ derived (view) |
| Hours (paid) | AI analogue = talk hours + machine cost | ❓ define with team |
| Cost/hr | Telnyx + LLM + infra telemetry (`canned_seconds`/`tts_seconds`) | ➤ platform-native, richer than KB's |

`0002_reporting_views.sql` implements `v_daily_results`, `v_rdaily`, and `v_rlist` over the
fact stream with the computable columns now and commented placeholders where the disposition
dictionary (T6) is needed.

## Open items from this file

1. Disposition mapping: KB's Sale/Qualified/Complete/Abandon/Almost/Lost → our disposition
   codes (Brandon/Joseph; `vicidial_status_codes.csv` + `techss_dl.callcenter_dispos`).
2. Transfer funnel events (tAtt/tSucc/tAgree) as first-class `call_events` types + crediting rules.
3. FS-code PD/CH/CP tag meanings.
4. Define AI-platform "Hours" and cost/hr so SPH and $/transfer are comparable to KB's sheet.
5. Confirm with Ashley that rDaily/rList/Snapshot columns are the complete signoff surface.
