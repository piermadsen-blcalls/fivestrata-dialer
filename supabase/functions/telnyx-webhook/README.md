# telnyx-webhook — deploy runbook

Public HTTPS ingestion point for Telnyx Call Control events → `call_events` table.
Why it exists: the platform service on the dev box isn't internet-reachable; this
function receives webhooks until the service gets a public home (step 3 / AWS), at
which point `TELNYX_WEBHOOK_URL` is repointed via `scripts/telnyx-setup.ts` and this
function goes quiet. No other changes needed to switch.

## One-time deploy (Sean — needs dashboard access Claude doesn't have)

1. **Create a CLI access token**: supabase.com dashboard → Account → Access Tokens →
   generate. Keep it out of the repo (env var or a local env script).
2. **Deploy the function** (from the repo root; `npx supabase` needs no install/admin):

   ```bash
   SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy telnyx-webhook --project-ref wcftuethlcgeasopayed
   ```

   `verify_jwt=false` comes from `supabase/config.toml` (required — Telnyx sends no JWT).
3. **Set the function's secret** (the same base64 value as `TELNYX_PUBLIC_KEY` in `.env`):

   ```bash
   SUPABASE_ACCESS_TOKEN=<token> npx supabase secrets set TELNYX_PUBLIC_KEY=<value> --project-ref wcftuethlcgeasopayed
   ```

4. **Point Telnyx at it** — add to `.env`:

   ```
   TELNYX_WEBHOOK_URL=https://wcftuethlcgeasopayed.supabase.co/functions/v1/telnyx-webhook
   ```

   then re-run `npx tsx scripts/telnyx-setup.ts` (idempotent; PATCHes the Call Control app).

## Verify

- `npx supabase functions logs telnyx-webhook --project-ref wcftuethlcgeasopayed` (or dashboard → Edge Functions → logs)
- Place any call on the connection; rows should appear in `call_events` within ~1s
  (`select event_type, occurred_at from call_events order by id desc limit 10`).
- A bare `curl -X POST <url>` should return 400 (missing signature headers) — that's the
  signature gate working.

## Design notes

- Field mapping is identical to `src/services/callLog.ts` `recordCallEvent` — the local
  Fastify route and this function write interchangeable rows.
- Insert errors do NOT fail the webhook (Telnyx retries on non-2xx; events must not back
  up). They land in function logs instead.
- 300s replay window on the `telnyx-timestamp` header.
- Latency caveat (from the roadmap step-2 discussion): events landing in Postgres instead
  of hitting the command loop in-process adds a polling hop for the local dev loop. Fine
  for proving the pipeline; the honest ~200ms clip-seam measurement waits for the step-3
  co-located deploy.
