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

## What we still need from FiveStrata (the short list)

1. **Point traffic at the URLs above** (or tell us the delivery mechanism if fresh leads
   come via LeadConduit recipient delivery rather than direct push — we accept either).
2. **Pre-auth key** for our pilot vertical (Transfer Client API `key=` value, guide §4.1).
3. **Basic Auth credentials** for the disposition endpoint (guide §4.2) for the same vertical.
4. The current **valid `calldispo_fives` values** (guide says Ashley owns these).
5. Confirm whether "every completed call" includes no-answers (the mapping table suggests
   yes — we'll post them unless told otherwise).

## Test it yourself (optional)

```bash
curl -s -X POST "https://wcftuethlcgeasopayed.supabase.co/functions/v1/fivestrata-inbound/leads" \
  -H "x-api-key: <key>" -H "content-type: application/json" \
  -d '{"phone_number":"5551234567","oleadid":"JOSEPH-TEST-1","first_name":"Test","max_attempts":3}'
```

Expect `{"id":"…","oleadid":"JOSEPH-TEST-1","dnc":false}`; send it twice and the second
returns the same id with `"duplicate":true`. Follow with `/leads/remove` on the same OLeadID
to clean up (`{"removed":1}`).
