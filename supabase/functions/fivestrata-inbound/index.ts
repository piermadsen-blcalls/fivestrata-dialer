// fivestrata-inbound — Supabase Edge Function hosting the five inbound APIs
// from Joseph's integration guide (docs/integrations/callcenter-integration-
// guide.md §3). FiveStrata calls US on these routes:
//
//   POST /fivestrata-inbound/zcwl          { "zips": ["90210", ...] }        ZIP allowlist bulk sync (full replace, atomic, serialized)
//   POST /fivestrata-inbound/leads         { lead payload, guide §3.2 }      fresh lead ingestion (idempotent by oleadid)
//   POST /fivestrata-inbound/leads/remove  { "OLeadID": "..." }              undo/delete (idempotent soft delete)
//   POST /fivestrata-inbound/dnc           { "phone_number": "..." }         immediate suppression
//   POST /fivestrata-inbound/undnc         { "phone_number": "..." }         immediate restoration
//
// Contract behaviors implemented per the guide: 2xx only after successful
// processing; delete idempotent + never creates leads; DNC/unDNC immediate
// (registry + leads.dnc flip in one transaction via dnc_set(); ingest-time
// suppression enforced by the leads_dnc_guard trigger so it can't fail open
// or race); identifiers (oleadid, vendor_lead_code) preserved — oleadid is
// REQUIRED so every lead stays removable per §3.3; per-lead max_attempts
// validated and stored, never hard-coded. Schema is call-center-defined per
// the guide — this file IS our defined schema; FiveStrata adapts at onboarding.
//
// Auth (ours to define): x-api-key header checked against INBOUND_API_KEY
// function secret, falling back to dialer_config key 'inbound_api_key'
// (Management-API secret-setting 403s on Sean's org role — same pattern as
// telnyx-webhook). SHA-256 constant-time compare; key cache TTLs 60s and
// re-reads on mismatch so rotation is effectively immediate. Fail closed if
// unconfigured. Optional source-IP allowlist (guide §2) enforced when
// dialer_config 'inbound_ip_enforce' = 'true' — that read failing means 503
// (fail closed), and x-forwarded-for is gateway-controlled on Supabase
// (verified 8/14: a spoofed client XFF header is overwritten by the platform).
//
// Authenticated requests are audit-logged to inbound_events; unauthenticated
// noise (internet-scanner 401s) goes to function logs only.
// Deploy: npm run inbound:deploy   Test: npm run inbound:test
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Guide §2: FiveStrata inbound source IPs.
const FIVESTRATA_IPS = new Set([
  '107.22.173.49',
  '167.99.160.5',
  '45.33.115.246',
  '3.225.52.7',
  '54.234.167.189',
  '3.225.20.135',
  '54.160.26.104',
  '54.161.58.164',
  '107.20.45.90',
]);

const KEY_TTL_MS = 60_000;
const MAX_ZIPS_PER_SYNC = 200_000;

// Returns { value } on success, { error } on read failure — callers decide
// whether a failed read fails open or closed.
async function configValue(key: string): Promise<{ value?: string; error?: string }> {
  const { data, error } = await supabase
    .from('dialer_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) {
    console.error(`dialer_config read failed (${key}):`, error.message);
    return { error: error.message };
  }
  return { value: data?.value ?? '' };
}

let cachedKey = '';
let cachedKeyAt = 0;
async function inboundKey(forceRefresh = false): Promise<string> {
  const fresh = cachedKey !== '' && Date.now() - cachedKeyAt < KEY_TTL_MS;
  if (fresh && !forceRefresh) return cachedKey;
  const envKey = Deno.env.get('INBOUND_API_KEY') ?? '';
  const key = envKey || (await configValue('inbound_api_key')).value || '';
  if (key) {
    cachedKey = key;
    cachedKeyAt = Date.now();
  }
  return key;
}

// Constant-time-ish comparison: compare SHA-256 digests byte-by-byte so the
// comparison cost is independent of where the strings first differ.
async function keyMatches(presented: string, expected: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(presented)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ]);
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// 500s return a generic body — DB error detail (constraint names, SQL) stays
// in function logs, not in responses to a remote party.
function dbError(context: string, message: string): { status: number; body: unknown } {
  console.error(`${context}:`, message);
  return { status: 500, body: { error: 'database error' } };
}

async function logEvent(
  endpoint: string,
  status: number,
  summary: unknown,
  sourceIp: string,
): Promise<void> {
  // Awaited (not fire-and-forget): the edge isolate can be torn down right
  // after the response is returned, silently dropping unawaited writes —
  // the same failure mode as the telnyx-agent stale-state bug. Audit failure
  // still never fails the request.
  const { error } = await supabase
    .from('inbound_events')
    .insert({ endpoint, status, summary: summary ?? {}, source_ip: sourceIp || null });
  if (error) console.error('inbound_events insert failed:', error.message);
}

const str = (v: unknown): string | null => {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? null : s;
};

async function handleZcwl(body: any): Promise<{ status: number; body: unknown }> {
  const zips = body?.zips;
  if (!Array.isArray(zips) || zips.length === 0) {
    return { status: 422, body: { error: 'zips must be a non-empty array' } };
  }
  if (zips.length > MAX_ZIPS_PER_SYNC) {
    return { status: 422, body: { error: `zips exceeds ${MAX_ZIPS_PER_SYNC} entries` } };
  }
  // Optional list name: lets the test battery target 'test' without touching
  // the live 'default' allowlist. FiveStrata never needs to send it.
  const list = str(body?.list) ?? 'default';
  const { data, error } = await supabase.rpc('zcwl_sync', {
    p_zips: zips.map((z: unknown) => (z == null ? '' : String(z))),
    p_list: list,
  });
  if (error) return dbError('zcwl_sync failed', error.message);
  // synced < received means blank/garbage entries were dropped by the sanity
  // filter — reported so FiveStrata can see the delta.
  return { status: 200, body: { received: zips.length, synced: data } };
}

async function handleLead(body: any): Promise<{ status: number; body: unknown }> {
  const phone = str(body?.phone_number);
  if (!phone) return { status: 422, body: { error: 'phone_number required' } };
  const oleadid = str(body?.oleadid);
  // Required: without it the lead can never be targeted by §3.3 undo/delete —
  // exactly the retry-after-timeout scenario that API exists for.
  if (!oleadid) return { status: 422, body: { error: 'oleadid required' } };

  // A malformed cadence directive is rejected, not silently nulled: the guide
  // says max_attempts must never be defaulted by the receiving platform.
  const rawMax = str(body?.max_attempts);
  let maxAttempts: number | null = null;
  if (rawMax !== null) {
    const n = Number(rawMax);
    if (!Number.isInteger(n) || n <= 0) {
      return { status: 422, body: { error: 'max_attempts must be a positive integer' } };
    }
    maxAttempts = n;
  }

  // Idempotency: re-delivery of a live lead with the same oleadid returns the
  // existing row instead of creating a duplicate (guide §5 "idempotent where
  // possible"). A lead re-sent AFTER a confirmed remove is a new lead.
  const { data: existing, error: exErr } = await supabase
    .from('leads')
    .select('id')
    .eq('oleadid', oleadid)
    .is('removed_at', null)
    .limit(1);
  if (exErr) return dbError('lead pre-check failed', exErr.message);
  if (existing && existing.length > 0) {
    return { status: 200, body: { id: existing[0].id, oleadid, duplicate: true } };
  }

  // DNC-at-ingest happens in the DB (leads_dnc_guard trigger) — atomic with
  // the insert, cannot fail open, cannot race a concurrent DNC push.
  const { data: inserted, error: insErr } = await supabase
    .from('leads')
    .insert({
      oleadid,
      phone_number: phone,
      phone_code: str(body?.phone_code),
      first_name: str(body?.first_name),
      last_name: str(body?.last_name),
      address1: str(body?.address1),
      address3: str(body?.address3),
      city: str(body?.city),
      state: str(body?.state),
      postal_code: str(body?.postal_code),
      country_code: str(body?.country_code),
      email: str(body?.email),
      fscode1: str(body?.FSCode1 ?? body?.fscode1),
      fscode2: str(body?.FSCode2 ?? body?.fscode2),
      vendor_lead_code: str(body?.vendor_lead_code),
      max_attempts: maxAttempts,
      vertical: str(body?.vertical),
      lead_type: body?.lead_type === 'revive' ? 'revive' : 'fresh',
      source: 'fivestrata_push',
      status: 'received',
    })
    .select('id, dnc')
    .single();
  if (insErr) {
    // Unique-violation on the live-oleadid partial index = a concurrent
    // duplicate delivery raced past the pre-check. Resolve idempotently.
    // (Edge: if the winner is removed between our failure and this re-select,
    // we return 500 and FiveStrata's retry creates a new lead post-remove —
    // semantically equivalent to a re-send after remove; accepted.)
    if (insErr.code === '23505') {
      const { data: raced } = await supabase
        .from('leads')
        .select('id')
        .eq('oleadid', oleadid)
        .is('removed_at', null)
        .limit(1);
      if (raced && raced.length > 0) {
        return { status: 200, body: { id: raced[0].id, oleadid, duplicate: true } };
      }
    }
    return dbError('lead insert failed', insErr.message);
  }
  return { status: 200, body: { id: inserted.id, oleadid, dnc: inserted.dnc } };
}

async function handleRemove(body: any): Promise<{ status: number; body: unknown }> {
  const oleadid = str(body?.OLeadID ?? body?.oleadid ?? body?.OLeadId);
  if (!oleadid) return { status: 422, body: { error: 'OLeadID required' } };
  const { data, error } = await supabase
    .from('leads')
    .update({
      status: 'removed',
      removed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('oleadid', oleadid)
    .is('removed_at', null)
    .select('id');
  if (error) return dbError('lead remove failed', error.message);
  // Idempotent: zero rows means already removed or never existed — both are
  // "confirmed absent" per the guide, so still 2xx.
  return { status: 200, body: { oleadid, removed: data?.length ?? 0 } };
}

async function handleDnc(body: any, dnc: boolean): Promise<{ status: number; body: unknown }> {
  const phone = str(body?.phone_number);
  if (!phone) return { status: 422, body: { error: 'phone_number required' } };
  const { data, error } = await supabase.rpc('dnc_set', { p_phone: phone, p_dnc: dnc });
  if (error) {
    // P0001 = plpgsql RAISE EXCEPTION — dnc_set's only raise is input
    // validation, so map it to 422 rather than string-matching the message.
    if (error.code === 'P0001') return { status: 422, body: { error: 'invalid phone number' } };
    return dbError('dnc_set failed', error.message);
  }
  return { status: 200, body: { leads_updated: data } };
}

Deno.serve(async (req) => {
  // Robust to gateway path variants: strip an optional /functions/v1 prefix
  // and the function slug, leaving just our route.
  const path =
    new URL(req.url).pathname
      .replace(/^\/functions\/v1/, '')
      .replace(/^\/fivestrata-inbound/, '') || '/';
  // Leftmost x-forwarded-for entry — on Supabase's gateway this is the true
  // client IP (client-supplied XFF is overwritten; verified empirically 8/14).
  const sourceIp = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const endpoint =
    path === '/zcwl' || path === '/zcwl/sync'
      ? 'zcwl'
      : path === '/leads'
        ? 'leads'
        : path === '/leads/remove'
          ? 'leads_remove'
          : path === '/dnc'
            ? 'dnc'
            : path === '/undnc'
              ? 'undnc'
              : 'unknown';

  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  // --- Auth gate. Unauthenticated outcomes are console-logged, not persisted
  // (internet scanners must not be able to grow inbound_events unboundedly).
  const key = await inboundKey();
  if (!key) {
    console.warn(`503 key-not-configured ${endpoint} from ${sourceIp}`);
    return json(503, { error: 'inbound key not configured' });
  }
  const presented = req.headers.get('x-api-key') ?? '';
  let authed = await keyMatches(presented, key);
  if (!authed) {
    // Mismatch may mean the key was just rotated — re-read once, then decide.
    const refreshed = await inboundKey(true);
    authed = refreshed !== '' && (await keyMatches(presented, refreshed));
  }
  if (!authed) {
    console.warn(`401 ${endpoint} from ${sourceIp}`);
    return json(401, { error: 'unauthorized' });
  }

  // --- Optional IP allowlist (defense-in-depth against key leakage). A
  // failed config read fails CLOSED — this layer must not silently vanish.
  const enforce = await configValue('inbound_ip_enforce');
  if (enforce.error !== undefined) {
    await logEvent(endpoint, 503, { error: 'config unavailable' }, sourceIp);
    return json(503, { error: 'temporarily unavailable' });
  }
  if (enforce.value === 'true' && !FIVESTRATA_IPS.has(sourceIp)) {
    await logEvent(endpoint, 403, {}, sourceIp);
    return json(403, { error: 'source not allowed' });
  }

  if (endpoint === 'unknown') {
    await logEvent(endpoint, 404, { path }, sourceIp);
    return json(404, { error: 'unknown endpoint' });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    await logEvent(endpoint, 400, { error: 'invalid json' }, sourceIp);
    return json(400, { error: 'invalid json' });
  }

  let result: { status: number; body: unknown };
  try {
    result =
      endpoint === 'zcwl'
        ? await handleZcwl(body)
        : endpoint === 'leads'
          ? await handleLead(body)
          : endpoint === 'leads_remove'
            ? await handleRemove(body)
            : await handleDnc(body, endpoint === 'dnc');
  } catch (err) {
    console.error(`${endpoint} handler threw:`, err);
    result = { status: 500, body: { error: 'internal error' } };
  }

  // Audit summary: never the full payload (ZCWL is 10k+ ZIPs; leads carry PII
  // that belongs in the leads table, not duplicated into logs).
  const summary =
    endpoint === 'zcwl'
      ? {
          zips: Array.isArray(body?.zips) ? body.zips.length : 0,
          ...(result.status === 200 ? (result.body as object) : {}),
        }
      : endpoint === 'leads'
        ? {
            oleadid: str(body?.oleadid),
            ...(result.status === 200
              ? { id: (result.body as any).id, duplicate: (result.body as any).duplicate ?? false }
              : { error_status: result.status }),
          }
        : (result.body as object);
  await logEvent(endpoint, result.status, summary, sourceIp);

  return json(result.status, result.body);
});
