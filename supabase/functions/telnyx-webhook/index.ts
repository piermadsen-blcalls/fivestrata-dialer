// Telnyx webhook receiver — Supabase Edge Function.
//
// Role: public HTTPS ingestion point for Telnyx Call Control events (roadmap
// step 2; the platform service can't be reached from the internet on Sean's
// dev box). Verifies the Ed25519 signature, inserts the event into
// call_events (identical field mapping to src/services/callLog.ts
// recordCallEvent), returns 200 fast. The local dev loop consumes events from
// the table. When the platform service gets a public home (step 3 / AWS),
// re-run scripts/telnyx-setup.ts with TELNYX_WEBHOOK_URL pointed there and
// this function simply stops receiving traffic — nothing else changes.
//
// Secrets (set via CLI, never committed):
//   TELNYX_PUBLIC_KEY — base64 32-byte Ed25519 key from the Telnyx portal
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
//
// Deploy: see README.md next to this file. Must deploy with verify_jwt=false
// (Telnyx sends no Supabase JWT) — set in supabase/config.toml.
import { createClient } from 'npm:@supabase/supabase-js@2';

const REPLAY_TOLERANCE_SECONDS = 300;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

let verifyKey: CryptoKey | null = null;
async function getVerifyKey(): Promise<CryptoKey> {
  if (verifyKey) return verifyKey;
  // Prefer the function secret; fall back to dialer_config (migration 0003 —
  // used when Management-API secret-setting is blocked by org role). The
  // Telnyx public key is verification material, not a credential.
  let b64 = Deno.env.get('TELNYX_PUBLIC_KEY') ?? '';
  if (!b64) {
    const { data, error } = await supabase
      .from('dialer_config')
      .select('value')
      .eq('key', 'telnyx_public_key')
      .maybeSingle();
    if (error) console.error('dialer_config read failed:', error.message);
    b64 = data?.value ?? '';
  }
  verifyKey = await crypto.subtle.importKey('raw', b64ToBytes(b64), { name: 'Ed25519' }, false, [
    'verify',
  ]);
  return verifyKey;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get('telnyx-signature-ed25519');
  const timestamp = req.headers.get('telnyx-timestamp');
  if (!signature || !timestamp) {
    return new Response(JSON.stringify({ error: 'missing signature headers' }), { status: 400 });
  }

  // Replay window: reject stale timestamps outright.
  const skewSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(skewSeconds) || skewSeconds > REPLAY_TOLERANCE_SECONDS) {
    return new Response(JSON.stringify({ error: 'stale timestamp' }), { status: 400 });
  }

  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      'Ed25519',
      await getVerifyKey(),
      b64ToBytes(signature),
      new TextEncoder().encode(`${timestamp}|${rawBody}`),
    );
  } catch (err) {
    console.error('signature verification threw:', err);
  }
  if (!valid) {
    return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }

  const data = event?.data;
  if (data?.event_type) {
    const { error } = await supabase.from('call_events').insert({
      event_type: data.event_type,
      call_control_id: data.payload?.call_control_id,
      call_session_id: data.payload?.call_session_id,
      occurred_at: data.occurred_at ?? new Date().toISOString(),
      payload: data.payload ?? {},
    });
    // Don't fail the webhook on insert errors — Telnyx retries on non-2xx and
    // events must not back up. Surface via function logs instead.
    if (error) console.error('call_events insert failed:', error.message);
  }

  return new Response(null, { status: 200 });
});
