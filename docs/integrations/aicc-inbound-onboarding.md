# AICC Inbound Endpoints — Onboarding Sheet for Joseph

**Status: LIVE, tested, and security-hardened as of 2026-08-14** (31-check live battery +
12,000-ZIP bulk sync in 1.5s + adversarial review pass).
This is the call-center side of the integration guide's §3 (inbound APIs), pre-built so
onboarding the AI call center is configuration, not a project. Sean sends this sheet plus the
API key out-of-band.

## Endpoints

Base URL: `https://wcftuethlcgeasopayed.supabase.co/functions/v1/fivestrata-inbound`

| Guide § | Route | Body |
|---|---|---|
| 3.1 ZCWL bulk sync | `POST …/zcwl` | `{ "zips": ["90210", "90211", …] }` |
| 3.2 Fresh lead ingestion | `POST …/leads` | Guide §3.2 example payload, verbatim — all fields accepted as named there (incl. `FSCode1`/`FSCode2`, `vendor_lead_code`, `oleadid`, `max_attempts`) |
| 3.3 Undo/delete lead | `POST …/leads/remove` | `{ "OLeadID": "…" }` (`oleadid` also accepted) |
| 3.4 DNC | `POST …/dnc` | `{ "phone_number": "…" }` |
| 3.5 unDNC | `POST …/undnc` | `{ "phone_number": "…" }` |

We deliberately adopted the guide's own example schemas — **zero field-mapping work needed
on the FiveStrata side.**

## Auth

Every request carries the shared key in a header: `x-api-key: <key Sean provides>`.
Content type `application/json`. That's the whole auth story.

## Behavior guarantees (contract §3/§5 compliance)

- 2xx returned **only after** successful processing (no fast-ACK ambiguity; flip to async
  later if agreed).
- ZCWL: bulk-safe (12k ZIPs verified ~1.5s), atomic full replace — a failed sync leaves the
  previous allowlist intact, never a half-applied one. Duplicates/blank entries tolerated.
- Leads: identifiers preserved; `oleadid` is **required** (without it a lead could never be
  targeted by undo/delete); idempotent — re-delivering a live `oleadid` returns the existing
  lead (`"duplicate": true`) instead of creating a copy, so retries after a timeout are safe
  (race-proof via a uniqueness guarantee, not just a check). Per-lead `max_attempts` honored,
  never hard-coded; a malformed value is rejected (422), never silently defaulted.
- Undo/delete: idempotent by OLeadID; repeat deletes and unknown OLeadIDs both return 2xx
  ("confirmed absent"); never creates or alters other leads. A lead re-sent after a confirmed
  delete is accepted as a new lead.
- DNC/unDNC: takes effect immediately (suppression flag checked at dial time, not batch);
  matching is formatting-proof (`+1 (555) 123-4567` matches `5551234567`); a lead arriving
  for an already-suppressed number ingests pre-flagged.
- Non-2xx responses are meaningful: `401` bad key, `422` malformed payload (safe to fix and
  resend), `5xx` retry.
- Every request is audit-logged on our side.

Source-IP allowlisting to the guide §2 IPs is built and off during testing; we flip it on at
go-live (config change, no deploy).

## The ask-list — status after Joseph's 2026-08-21 response

1. **Point traffic at the URLs above** — ✅ mechanism confirmed: **fresh leads deliver
   through LeadConduit** (Joseph 8/21). Remaining: the actual LC recipient wiring to our
   `/leads` route.
2. **Pre-auth key** (Transfer Client API `key=`, guide §4.1) — ✅ **RECEIVED 8/21** for all
   four verticals (BR/HW/SL/WI), stored outside all repos.
3. **Basic Auth credentials** for the disposition endpoint (guide §4.2) — ✅ **RECEIVED
   8/21**: username `AI`, per-vertical password (same value as the vertical's pre-auth key).
4. **Valid `calldispo_fives` values** — ➤ partial (Joseph 8/21): core set is **Qualified /
   Not Qualified / DNC**; beyond those, anything describing call outcome, legal/compliance
   status, or scoring-relevant detail is generally valid. **Ashley owes the definitive list.**
5. No-answers — ✅ answered (Joseph 8/21): **not necessary to send back** if we report on
   them ourselves. Our per-dial fact stream keeps them; we post contacts/outcomes only.

## Test it yourself (optional)

```bash
curl -s -X POST "https://wcftuethlcgeasopayed.supabase.co/functions/v1/fivestrata-inbound/leads" \
  -H "x-api-key: <key>" -H "content-type: application/json" \
  -d '{"phone_number":"5551234567","oleadid":"JOSEPH-TEST-1","first_name":"Test","max_attempts":3}'
```

Expect `{"id":"…","oleadid":"JOSEPH-TEST-1","dnc":false}`; send it twice and the second
returns the same id with `"duplicate":true`. Follow with `/leads/remove` on the same OLeadID
to clean up (`{"removed":1}`).
