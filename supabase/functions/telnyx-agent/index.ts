// telnyx-agent — CO-LOCATED conversational loop (Phase A of the co-location
// plan, 8/7). The soundboard-operator state machine runs HERE, network-
// adjacent to Telnyx, instead of on a polling laptop: webhook in -> decide ->
// command out. Measured dev-loop seam was 465-790ms; this path targets
// ~150-300ms (webhook ~50-150ms + command ~50-150ms).
//
// Also replaces telnyx-webhook as the webhook target: it archives every event
// to call_events (async, out of the hot path) with the same field mapping.
//
// State: per-call state lives in warm-isolate memory (a Map — JS is single-
// threaded per isolate, so Deepgram partial/final pairs ~130-320ms apart
// can't double-fire transitions). Telnyx client_state (set on our commands,
// echoed on events) is the cold-start recovery copy. The production engine
// (Phase B, AWS) owns durable state; this is the demo-grade way station.
//
// Conversation (ported from scripts/convo-loop-test.ts v4, incl. all of
// Sean's 8/7 live-iteration rules):
//   answered -> transcription_start (Deepgram + interims, inbound) + greet
//   greet ended -> consent_listen (6s fallback)
//   any speech -> connector ack + question     [never pre-queue past a turn]
//   question ended -> rating_listen (20s fallback)
//   first speech -> instant ack (no immediate ack repeats)
//   final transcript -> LLM picks response (Telnyx-hosted Llama) -> goodbye
//   goodbye ended -> hangup
//
// Secrets: TELNYX_PUBLIC_KEY + TELNYX_API_KEY via env if set, else the
// dialer_config table (keys: telnyx_public_key, telnyx_api_key) — org role
// blocks Management-API secret-setting.
import { createClient } from 'npm:@supabase/supabase-js@2';

const TELNYX = 'https://api.telnyx.com/v2';
const REPLAY_TOLERANCE_SECONDS = 300;
const LLM_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
const ACKS = ['cv_ack_1', 'cv_ack_2', 'cv_ack_3'];
const RESPONSES = ['cv_resp_positive', 'cv_resp_negative', 'cv_resp_unclear'];
const CONSENT_FALLBACK_MS = 6_000;
const RATING_FALLBACK_MS = 20_000;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

interface CallState {
  phase: 'dialing' | 'greeting' | 'consent_listen' | 'question' | 'rating_listen' | 'wrapup' | 'done';
  ackFired?: boolean;
  lastAck?: string;
  greet?: string; // greeting media_name — set via the dial command's client_state (demo uses demo_greet)
}
const MEM = new Map<string, CallState>();

const waitUntil = (p: Promise<unknown>) => {
  // Supabase edge runtime background work; fall back to fire-and-forget.
  (globalThis as any).EdgeRuntime?.waitUntil?.(p) ?? p.catch((e: unknown) => console.error(e));
};

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// --- config (env -> dialer_config fallback), cached per isolate ---------------
const cfgCache = new Map<string, string>();
// `valid` guards against the wrong value landing in either source (8/7: the
// 44-char PUBLIC key was pasted as the API key in both the env secret and the
// table — Telnyx 401'd every command and the agent went silent). Trim + strip
// quotes: a trailing newline poisons the Authorization header (fetch throws).
async function cfg(
  envName: string,
  tableKey: string,
  valid: (v: string) => boolean = () => true,
): Promise<string> {
  const clean = (s: string) => s.trim().replace(/^["']|["']$/g, '');
  const fromEnv = clean(Deno.env.get(envName) ?? '');
  if (fromEnv && valid(fromEnv)) return fromEnv;
  const cached = cfgCache.get(tableKey);
  if (cached && valid(cached)) return cached;
  const { data, error } = await supabase
    .from('dialer_config')
    .select('value')
    .eq('key', tableKey)
    .maybeSingle();
  if (error) console.error(`dialer_config read failed (${tableKey}):`, error.message);
  const fromTable = clean(data?.value ?? '');
  if (fromTable && valid(fromTable)) {
    cfgCache.set(tableKey, fromTable);
    return fromTable;
  }
  // Nothing validates — return whatever exists so the error is visible upstream.
  return fromEnv || fromTable;
}

const isApiKey = (v: string) => v.startsWith('KEY');
const getApiKey = () => cfg('TELNYX_API_KEY', 'telnyx_api_key', isApiKey);

let verifyKey: CryptoKey | null = null;
async function getVerifyKey(): Promise<CryptoKey> {
  if (verifyKey) return verifyKey;
  const raw = b64ToBytes(await cfg('TELNYX_PUBLIC_KEY', 'telnyx_public_key'));
  verifyKey = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']);
  return verifyKey;
}

// --- Telnyx commands ------------------------------------------------------------
async function telnyxCmd(path: string, body: Record<string, unknown> = {}): Promise<boolean> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.error('No TELNYX_API_KEY (env or dialer_config) — cannot command');
    return false;
  }
  const res = await fetch(`${TELNYX}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`POST ${path} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
    return false;
  }
  return true;
}

const encodeState = (s: CallState) => btoa(JSON.stringify(s));
const decodeState = (cs: string | null | undefined): CallState | null => {
  if (!cs) return null;
  try {
    return JSON.parse(atob(cs)) as CallState;
  } catch {
    return null;
  }
};

const play = (ccid: string, media: string, state: CallState) =>
  telnyxCmd(`/calls/${ccid}/actions/playback_start`, {
    media_name: media,
    client_state: encodeState(state),
  });

function pickAck(state: CallState): string {
  const pool = ACKS.filter((a) => a !== state.lastAck);
  const ack = pool[Math.floor(Math.random() * pool.length)];
  state.lastAck = ack;
  return ack;
}

async function chooseClip(transcript: string): Promise<{ clip: string; ms: number }> {
  const t0 = Date.now();
  try {
    const apiKey = await getApiKey();
    const res = await fetch(`${TELNYX}/ai/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 30,
        messages: [
          {
            role: 'system',
            content:
              'You are a soundboard operator on a phone call. The caller was just asked: "On a scale of one to ten, how natural does this call feel so far?" Pick the response clip for what they said. Reply ONLY with JSON like {"clip":"cv_resp_positive"}. Clips: cv_resp_positive (rating 7+/enthusiastic), cv_resp_negative (rating 6 or below/critical), cv_resp_unclear (anything else/ambiguous).',
          },
          { role: 'user', content: `Caller said: "${transcript}"` },
        ],
      }),
    });
    const body: any = await res.json().catch(() => ({}));
    const text: string = body?.choices?.[0]?.message?.content ?? '';
    const match = RESPONSES.find((r) => text.includes(r));
    return { clip: match ?? 'cv_resp_unclear', ms: Date.now() - t0 };
  } catch {
    return { clip: 'cv_resp_unclear', ms: Date.now() - t0 };
  }
}

// --- Fallback timers (warm-isolate best effort — production owns this in Phase B)
function armFallback(ccid: string, expectPhase: CallState['phase'], ms: number, act: (s: CallState) => Promise<void>) {
  waitUntil(
    (async () => {
      await new Promise((r) => setTimeout(r, ms));
      const s = MEM.get(ccid);
      if (s && s.phase === expectPhase) await act(s);
    })(),
  );
}

// --- The state machine ------------------------------------------------------------
async function handle(data: any): Promise<void> {
  const p = data.payload ?? {};
  const ccid: string = p.call_control_id ?? '';
  if (!ccid) return;
  const et: string = data.event_type;

  if (et === 'call.hangup') {
    MEM.delete(ccid);
    return;
  }

  const state: CallState =
    MEM.get(ccid) ?? decodeState(p.client_state) ?? { phase: 'dialing' };
  MEM.set(ccid, state);

  const transcript: string = (p.transcription_data?.transcript ?? '').trim();
  const isFinal = p.transcription_data?.is_final !== false;

  if (et === 'call.answered' && state.phase === 'dialing') {
    state.phase = 'greeting';
    // Listen from the first instant (inbound only); Deepgram + interims,
    // graceful degradation to finals-only, then engine B.
    const base = { language: 'en', transcription_tracks: 'inbound', client_state: encodeState(state) };
    (await telnyxCmd(`/calls/${ccid}/actions/transcription_start`, { ...base, transcription_engine: 'Deepgram', interim_results: true })) ||
      (await telnyxCmd(`/calls/${ccid}/actions/transcription_start`, { ...base, transcription_engine: 'Deepgram' })) ||
      (await telnyxCmd(`/calls/${ccid}/actions/transcription_start`, { ...base, transcription_engine: 'B' }));
    await play(ccid, state.greet ?? 'cv_greet', state);
  } else if (et === 'call.playback.ended' && state.phase === 'greeting') {
    state.phase = 'consent_listen';
    armFallback(ccid, 'consent_listen', CONSENT_FALLBACK_MS, async (s) => {
      s.phase = 'question';
      await play(ccid, 'cv_q1', s);
    });
  } else if (et === 'call.transcription' && state.phase === 'consent_listen' && transcript.length > 0) {
    state.phase = 'question'; // set BEFORE awaiting — partial/final pairs must not double-fire
    await play(ccid, pickAck(state), state);
    await play(ccid, 'cv_q1', state); // within-turn sequence: safe to queue
  } else if (et === 'call.playback.ended' && p.media_name === 'cv_q1') {
    state.phase = 'rating_listen';
    state.ackFired = false;
    armFallback(ccid, 'rating_listen', RATING_FALLBACK_MS, async (s) => {
      s.phase = 'wrapup';
      await play(ccid, 'cv_resp_unclear', s);
      await play(ccid, 'cv_goodbye', s);
    });
  } else if (et === 'call.transcription' && state.phase === 'rating_listen' && transcript.length > 0) {
    if (!state.ackFired) {
      state.ackFired = true;
      await play(ccid, pickAck(state), state); // instant mask, before any thinking
    }
    if (isFinal && transcript.length > 1) {
      state.phase = 'wrapup';
      waitUntil(telnyxCmd(`/calls/${ccid}/actions/transcription_stop`, {}).then(() => {}));
      const { clip, ms } = await chooseClip(transcript);
      console.log(`LLM chose ${clip} in ${ms}ms for "${transcript}"`);
      await play(ccid, clip, state);
      await play(ccid, 'cv_goodbye', state);
    }
  } else if (et === 'call.playback.ended' && p.media_name === 'cv_goodbye') {
    state.phase = 'done';
    await telnyxCmd(`/calls/${ccid}/actions/hangup`, {});
  }
}

// --- HTTP entry ---------------------------------------------------------------------
Deno.serve(async (req) => {
  // Self-diagnostic (no secrets leaked — booleans, lengths, status codes only).
  if (req.method === 'GET' && new URL(req.url).searchParams.has('diag')) {
    const envKey = (Deno.env.get('TELNYX_API_KEY') ?? '').trim();
    const effective = await getApiKey();
    let telnyxPing = -1;
    let pingErr = '';
    try {
      const r = await fetch(`${TELNYX}/phone_numbers?page[size]=1`, {
        headers: { Authorization: `Bearer ${effective}` },
      });
      telnyxPing = r.status;
    } catch (e) {
      pingErr = String(e).slice(0, 120);
    }
    return new Response(
      JSON.stringify({
        envKeyPresent: !!envKey,
        envKeyLooksValid: isApiKey(envKey),
        effectiveKeyLen: effective.length,
        effectiveLooksValid: isApiKey(effective),
        telnyxPing,
        pingErr,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get('telnyx-signature-ed25519');
  const timestamp = req.headers.get('telnyx-timestamp');
  if (!signature || !timestamp) {
    return new Response(JSON.stringify({ error: 'missing signature headers' }), { status: 400 });
  }
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
  if (!valid) return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 400 });

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }
  const data = event?.data;
  if (!data?.event_type) return new Response(null, { status: 200 });

  // Archive out of the hot path (same mapping as src/services/callLog.ts).
  waitUntil(
    supabase
      .from('call_events')
      .insert({
        event_type: data.event_type,
        call_control_id: data.payload?.call_control_id,
        call_session_id: data.payload?.call_session_id,
        occurred_at: data.occurred_at ?? new Date().toISOString(),
        payload: data.payload ?? {},
      })
      .then(({ error }) => {
        if (error) console.error('call_events insert failed:', error.message);
      }),
  );

  // Act — THE hot path.
  try {
    await handle(data);
  } catch (err) {
    console.error('handler error:', err);
  }
  return new Response(null, { status: 200 });
});
