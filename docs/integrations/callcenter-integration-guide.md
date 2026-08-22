# FiveStrata ↔ Call Center Technical Integration Guide (CV Integration)

**Provenance:** Authored by Joseph Yordan (LeadOps/sysdev), published on Confluence
([external share link](https://replydev.atlassian.net/wiki/external/YjE1MWUwN2E0NmQ0NDA0NWE4MzA1ODE3NzIzYzg5YTY)).
Ingested verbatim-in-substance 2026-08-14 (Sean/Claude). This is the **formal API contract for
connecting any call center platform to FiveStrata** — the AICC platform integrates as a peer
call center under exactly this contract (per the 2026-08-13 Master Tech Audit positioning).
Section 8 below (AICC implications) is our annotation, not part of Joseph's guide.

The guide is platform-agnostic by design: *"No specific dialing platform is required."*
Every example payload is explicitly negotiable at onboarding ("Call Center May Define") —
do not hard-code the examples.

---

## 1. Integration overview

The call center must implement:

**Inbound APIs (FiveStrata → Call Center)** — endpoints *we* host and FiveStrata calls:
1. Zip Code Whitelist (ZCWL) bulk sync
2. Fresh lead ingestion
3. Undo/delete lead requests
4. DNC updates
5. unDNC updates

**Outbound APIs (Call Center → FiveStrata)** — endpoints FiveStrata hosts and *we* call:
1. Pre-call / pre-transfer authorization
2. Post-call disposition submission

## 2. Network & security

Inbound traffic (FiveStrata → us) originates from these IPs; whitelist on firewalls, load
balancers, and API gateways:

```
107.22.173.49   167.99.160.5    45.33.115.246
3.225.52.7      54.234.167.189  3.225.20.135
54.160.26.104   54.161.58.164   107.20.45.90
```

## 3. Inbound APIs (FiveStrata → Call Center)

Schema flexibility applies to all five: FiveStrata adapts to a mutually agreed payload format
during onboarding (field names, nesting, batching, compression are all negotiable).

### 3.1 Zip Code Whitelist (ZCWL) — bulk sync

- Example: `POST /api/zcwl/sync`, body `{ "zips": ["string", ...] }`
- Payloads may contain **10,000+ ZIPs**; only ZIPs are guaranteed in the payload
- Required behavior: accept large payloads, store efficiently, **use as dialing allowlist**,
  return 2xx only after successful processing
- **Legacy note:** F1/F2/F3/F4/F5 filtering was supported by older whitelist integrations —
  **do not** use that filtering from the ZCWL endpoint; any F-code segmentation happens
  outside the bulk sync

### 3.2 Fresh lead ingestion

- Example: `POST /api/leads`

Example payload fields:

| Field | Type | Description |
|---|---|---|
| `phone_code` | string | International dialing prefix |
| `first_name` / `last_name` | string | Lead name |
| `phone_number` | string | Primary contact number |
| `address1` / `address3` | string | Street address / additional line |
| `city` / `state` / `postal_code` / `country_code` | string | Geo |
| `email` | string | Email |
| `FSCode1` / `FSCode2` | string | Classification fields |
| `vendor_lead_code` | string | External vendor identifier |
| `oleadid` | string | Original lead ID |
| `max_attempts` | integer | **Max call attempts for this lead — passed per lead by FiveStrata; must not be hard-coded by the receiving platform** |

Required behavior: accept full payload, map fields, **preserve identifiers**
(`vendor_lead_code`, `oleadid`), insert into appropriate routing configuration, return 2xx
only after successful ingestion.

### 3.3 Undo/delete lead

- Example: `POST /api/leads/remove`, body `{ "OLeadID": "string" }`
- Purpose: FiveStrata sends this when it **cannot confirm** the original lead submission
  succeeded (timeout, server error, indeterminate result on `POST /api/leads`) — ensures the
  lead is not retained, routed, or dialed unintentionally
- Required behavior: locate by OLeadID; remove or mark deleted (cannot be dialed, routed, or
  transferred); **idempotent** on repeat; 2xx only after removed or confirmed absent; clear
  non-2xx if it cannot be processed (FiveStrata retries and reconciles)
- Must not create a new lead or alter unrelated leads; FiveStrata retries until acknowledged
  or escalated

### 3.4 DNC / 3.5 unDNC

- Examples: `POST /api/dnc` and `POST /api/undnc`, body `{ "phone_number": "string" }`
- Required behavior: **suppress dialing immediately** (DNC) / **restore eligibility
  immediately** (unDNC); 2xx after successful update

## 4. Outbound APIs (Call Center → FiveStrata)

### 4.1 Pre-call / pre-transfer authorization (Transfer Client API)

The call center must request authorization **before dialing or transferring** a call.

- Endpoint: `POST https://techsolarsolutions.com/API/transfer-client.php`
- Content type: `application/x-www-form-urlencoded`
- **Auth: NOT HTTP Basic** — a vertical-specific `key` sent in the request payload.
  Keys are per-vertical; never reuse a key across verticals.

Request fields:

| Field | Type | Description |
|---|---|---|
| `key` | string | Vertical-specific authentication key |
| `zips` | string | Lead ZIP/postal code |
| `OLeadID` | string | Original lead identifier |
| `phone` | string | Lead phone number |

Response (relevant fields only — response may contain additional fields; **do not rely on
undocumented fields**):

| Field | Type | Description |
|---|---|---|
| `ClientID` | string | Unique client identifier |
| `clientName` | string | Client name |
| `transferCode` | string | Code required for transfer routing |
| `transferPhone` | string | Destination phone number for transfer |
| `vertical` | string | Approved vertical |
| `State` / `Area` / `Zip` | string | Approved state / geographic area / ZIP |
| `brandId` | string | Brand identifier |
| `result` | string | Authorization result |

Usage rules:
- `result` indicates an eligible client → proceed using `transferPhone` + `transferCode`
- No eligible client → **do not transfer or dial**
- Timeout or API error → **fail closed** (do not transfer)

### 4.2 Post-call disposition (Lead Intake)

**Must be sent after every completed call** — exactly one request per call.

- Endpoint: `https://api.fivestrata.com/api/call-center/lead-disposition`
- Method: **POST recommended** (JSON body). GET allowed only if agreed at onboarding, and
  never for PII (query params land in browser/proxy/server logs)
- **Auth: HTTP Basic** — username/password provided by FiveStrata, **per-vertical**; never
  reuse across verticals

Common payload (all verticals; vertical-specific fields are additive per the integration
contract):

```json
{
  "first_name": "string", "last_name": "string", "phone_1": "string",
  "email": "string", "address_1": "string", "city": "string",
  "state": "string", "postal_code": "string",
  "credit_score": "Average | Good | Excellent | Fair | Poor | blank",
  "brand_id_fives": "string",
  "calldispo_fives": "string",
  "calldispo_ext_fives": "string | null",
  "consent_fives": "Yes | No | blank | null",
  "fscode1": "string", "fscode2": "string", "fscode3_fives": "string | null",
  "homeowner_fives": "Yes | No | blank",
  "oleadid": "string",
  "repid_fives": "string",
  "timestamp_callcenter_dispositioned_fives": "YYYY-MM-DD HH:MM:SS",
  "wtclient_fives": "string | null"
}
```

**Required fields (3):** `calldispo_fives` · `oleadid` ·
`timestamp_callcenter_dispositioned_fives` (format `YYYY-MM-DD HH:MM:SS`).

Full field dictionary (defaults in parentheses where the guide gives one):

| HTTP parameter | Vertical | Req | Notes |
|---|---|---|---|
| `first_name`, `last_name`, `phone_1`, `email`, `address_1`, `city`, `state`, `postal_code` | ALL | No | Contact info |
| `lead_type_fives` (empty) | ALL | No | Lead type identifier |
| `brand_id_fives` (empty) | ALL | No | Brand identifier — echo the `brandId` used on the call |
| `new_contruction_fives` (false) | ALL | No | New-construction flag *(sic — parameter name is misspelled in the contract)* |
| `under_5k_sqft_fives`, `replaced_appliances_fives`, `see_benefits_fives`, `walkin_tub_fives` | **HW/BR only** | No | Home property details |
| `calldispo_fives` | ALL | **Yes** | Final disposition code — **current valid values owned by Ashley Smith, External Call Center Director (ashley.smith@buyerlink.com)** |
| `calldispo_ext_fives` (empty) | ALL | No | Extended disposition text |
| `wtclient_fives` (null) | ALL | No | **= `transferCode` from the pre-auth response** |
| `timestamp_affilliate_fives` (current ts) | ALL | No | When the affiliate generated the lead |
| `oleadid` | ALL | **Yes** | Original lead ID |
| `fscode1` (empty) | ALL | No | Campaign classification: `\|VT:VALUE\|PD:VALUE\|CH:VALUE\|SC:VALUE\|CP:VALUE\|` |
| `fscode2` (empty) | ALL | No | Sub-source tracking: `\|SS:SUB_ID\|SA:SUB_ID_2\|` |
| `fscode3_fives` (null) | ALL | No | Optional tracking field |
| `credit_score` (blank) | ALL | No | Average/Good/Excellent/Fair/Poor/blank |
| `homeowner_fives` (blank) | ALL | No | Yes/No/blank |
| `ip_address` (empty) | ALL | No | IP of lead source |
| `timestamp_callcenter_dispositioned_fives` | ALL | **Yes** | `YYYY-MM-DD HH:MM:SS` |
| `consent_fives` (null) | ALL | No | Yes/No/blank/null |
| `repid_fives` (empty) | ALL | No | **"Call center agent ID or AI agent ID"** — the contract explicitly anticipates AI agents |
| `attempted_transfer_fives` (blank) | ALL | No | Yes/No/blank — was a transfer attempted |

Disposition mapping rules:
- `calldispo_fives` is primary and takes priority; `calldispo_ext_fives` is optional
  supporting detail only — **never put the main call result only in the extension**
- Qualified leads accepted **only** when `calldispo_fives = Qualified`
  (e.g. `Qualified` + ext `transferred`)
- DNC accepted primary values: `DNC`, `Do not call`, `Do Not Call`; optional ext `Do Not Call`
- No extension → send ext as null/blank per agreed format

| Scenario | `calldispo_fives` | `calldispo_ext_fives` |
|---|---|---|
| No answer | `No Answer` | null |
| Qualified lead | `Qualified` | null |
| Qualified + transfer detail | `Qualified` | `transferred` |
| DNC request | `DNC` / `Do not call` / `Do Not Call` | `Do Not Call` |

Required behavior: one request per completed call · include all required fields · treat 2xx
as success · retry only on network failure or non-2xx.

## 5. Reliability & performance requirements

| Area | Requirement |
|---|---|
| ZCWL ingestion | Supports bulk (10k+ ZIPs) |
| ZIP lookup | Low latency |
| Lead ingestion | Idempotent where possible |
| Pre-call authorization | **Mandatory** |
| Dialer blocking | The dialer must not block or unnecessarily delay API requests/responses |
| Disposition submission | **Exactly once per call** |

## 6. Change control

Notify FiveStrata before modifying: ZCWL endpoint/format, authentication methods, payload
structures, routing logic, lead-ingestion behavior. **Undocumented changes may result in
paused traffic.**

## 7. Technical summary (Joseph's checklist)

Accept bulk ZIP allowlists · ingest full lead payloads · support undo/delete for uncertain
submissions · enforce DNC/unDNC · request authorization before dialing · support **Fast ACK**
(when enabled by the integration contract: acknowledge immediately, process asynchronously) ·
avoid hard-coding sample identifiers · operate independently of any specific dialing platform.

---

## 8. AICC implications (our annotation — not part of Joseph's guide)

This contract closes most of T4 and the outbound half of T6, and specs the inbound surface
that T3 gates (see `docs/open-questions.md` for the item-by-item status).

**We must HOST five inbound endpoints** (FiveStrata calls us): ZCWL sync, lead ingestion,
lead remove, DNC, unDNC — whitelisted to the 9 IPs in §2. ✅ **BUILT + LIVE 2026-08-14**
(same day as ingestion): Edge Function `supabase/functions/fivestrata-inbound` serving all
five routes on the guide's own example schemas, migration 0004 (max_attempts, soft delete,
`zcwl_zips` — V1 owns the name `zip_allowlist` — `dnc_numbers`, `inbound_events` audit,
`zcwl_sync`/`dnc_set`/`phone_digits` functions), x-api-key auth + optional §2 IP
enforcement, 28-check live battery green incl. 12k-ZIP bulk sync (~1.5s). Joseph handoff
sheet: `aicc-inbound-onboarding.md`. ✅ Delivery mechanism CONFIRMED 8/21 (Joseph): **fresh
leads deliver through LeadConduit** — the LC recipient gets wired to our live `/leads`
endpoint at onboarding. Per-vertical credentials for both outbound APIs (pre-auth `key` +
dispo Basic Auth, BR/HW/SL/WI under username `AI`) received same day; stored outside all
repos (`C:\Claude\fivestrata-cc-env.sh`).

**Schema gaps this exposes** (migration TODOs):
- `max_attempts` per lead — an inbound per-lead cadence directive; the `leads` table needs
  to carry and the pacer needs to enforce it
- Lead soft-delete state (undo/delete API): removed leads must be un-dialable, un-routable,
  un-transferable, and the operation idempotent by OLeadID
- ZIP allowlist table (ZCWL target) — relates to `techss_dl.client_active_zips` semantics
  and Darwin's active-zips upload, but this is *our own* dialing allowlist
- DNC/unDNC must take effect **immediately** — a flag the dial queue checks at pop time,
  not a batch job

**Pre-auth (Transfer Client API) consequences:**
- Contract now fully specified: form-encoded POST with per-vertical `key` +
  `zips`/`OLeadID`/`phone` → `ClientID`/`clientName`/`transferCode`/`transferPhone`/
  `vertical`/`State`/`Area`/`Zip`/`brandId`/`result`. Matches the 8/13 audit mechanics
  (round-robin ≥1 lead/client/day, WT weight 0.1, Meridius caps + hours + active zips).
- **Fail-closed rule meets dial-time-every-dial (✅ 7/29):** an outage of
  transfer-client.php halts our dialing entirely. ❓ Design question: is a short-TTL cached
  pre-auth an acceptable degraded mode, or is halt-on-outage the intended behavior? (KB/TD
  live with the same rule today.)
- `brandId` from pre-auth must be persisted per call and echoed as `brand_id_fives` in the
  disposition — the audit's misbranding alert fires on mismatch.
- `wtclient_fives` = the pre-auth `transferCode`. Store both on the call row.

**Disposition (Lead Intake) consequences:**
- The 8/13 open question "should no-contacts post?" — **✅ CLOSED 8/21 (Joseph): no-answers
  are NOT necessary to send back** since the AI dialer reports on them itself. We post
  contact outcomes only; no-contacts live in our per-dial fact stream. (The guide's mapping
  table still documents `No Answer` as a valid primary value should we ever need it.)
- `repid_fives` explicitly admits an **AI agent ID** — Claire posts under her own rep ID.
- The disposition dictionary (valid `calldispo_fives` values) is owned by **Ashley** — this
  remains the open T6/T9 item; the transport contract itself is now closed.
- Per-vertical Basic-Auth credentials + per-vertical pre-auth keys → tenant/program config
  (`tenant-program-onboarding.md`), not env vars: one credential set per vertical we dial.
- Exactly-once semantics + retry-on-failure → we need an outbox with delivery state on the
  per-dial fact row (dispo_posted_at, attempts, last_status).
- Vertical-specific extra fields (HW/BR home-property set) map to playbook qualification
  slots — the AI's question slots must capture what the vertical's dispo contract reports.

**Housekeeping:** the guide confirms Lead Intake is reachable at `api.fivestrata.com` (the
audit found it logs to no techss_ table — EOD batch → MDB only). Our per-dial/per-turn fact
stream remains strictly richer than what we report upstream.

**Outbound half ✅ BUILT 2026-08-21 (mock-tested, live-gated):**
`src/clients/fivestrataOutbound.ts` (§4.1 pre-auth: fail-closed on error/timeout/redirect/
falsy-sentinel/deny-ish-result; §4.2 dispo post: per-vertical Basic Auth) +
`src/services/preAuth.ts` (every ping → `preauth_log` incl. raw response for `result`-
vocabulary calibration, keys redacted) + `src/services/dispoOutbox.ts` (exactly-once:
idempotent enqueue by dedupe-key AND call_id, SKIP-LOCKED claim with batch-sized lease,
fenced finalization, capped backoff, `failed` escalation) — migration 0012 applied;
43-check mock battery green (`npm run outbound:test`); adversarial review pass applied.
**Go-live gate (do NOT fire at production until):** ❶ Joseph confirms actual endpoint URLs
(8/18: some documented URLs wrong; new authed Lead Intake coming) → set
`FS_TRANSFER_CLIENT_URL`/`FS_LEAD_INTAKE_URL`; ❷ agreed safe pre-auth test ping (the API
assigns clients round-robin — a casual test pollutes routing state); ❸ ❓ timestamp
timezone for `timestamp_callcenter_dispositioned_fives` (we default UTC); ❹ ❓ `result`
value vocabulary (we currently authorize on transferCode+transferPhone presence minus a
deny-list, and log raw for calibration); ❺ ❓ omit-vs-explicit-null for optional dispo
fields (we omit by default, can send nulls).
