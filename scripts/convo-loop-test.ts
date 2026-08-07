// Conversational loop PoC v2 — the soundboard-operator pattern, live (PRD P0
// #7/#9 first light). v2 lesson (Sean, 8/7 call 1): pre-queueing is for
// WITHIN-TURN clip sequences only — any clip that invites a response must end
// the turn and open the mic. v1 pre-queued the question behind a greeting
// that asked permission, and talked over the caller's answer.
//
// Flow (two real turns):
//   dial (AMD on) -> greet (asks consent) -> LISTEN -> ack + question ->
//   LISTEN -> ack (instant latency mask) + LLM-chosen response + goodbye.
// Transcription: engine B (Telnyx) — engine A returned empty transcripts.
// Measures per turn: caller-final-transcript -> ack audio (the turn seam),
// LLM decision ms, AMD verdict.
// Prereq: scripts/gen-clips.ts + scripts/clips-upload.ts voice-packs/dev-pack-1
// Run: npx tsx scripts/convo-loop-test.ts +1XXXXXXXXXX
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const POLL_MS = 100;
const MAX_CALL_SECONDS = 150;
const LLM_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
const ACKS = ['cv_ack_1', 'cv_ack_2', 'cv_ack_3'];
const RESPONSES = ['cv_resp_positive', 'cv_resp_negative', 'cv_resp_unclear'] as const;

const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const to = process.argv[2] ?? '';

if (!apiKey || !connectionId || !from || !supabaseUrl || !supabaseKey) {
  console.error('Need TELNYX_* + SUPABASE_* env (see voice-loop-test.ts).');
  process.exit(1);
}
if (!/^\+1\d{10}$/.test(to)) {
  console.error('Usage: npx tsx scripts/convo-loop-test.ts +1XXXXXXXXXX');
  process.exit(1);
}

async function telnyx(path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${TELNYX}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json?.errors?.[0];
    throw new Error(`POST ${path} -> ${res.status} ${e?.code ?? ''} ${e?.title ?? ''}${e?.detail ? ` — ${e.detail}` : ''}`);
  }
  return json;
}

async function fetchEvents(ccid: string, afterId: number): Promise<any[]> {
  const url =
    `${supabaseUrl}/rest/v1/call_events` +
    `?select=id,event_type,occurred_at,payload&call_control_id=eq.${encodeURIComponent(ccid)}` +
    `&id=gt.${afterId}&order=id.asc`;
  const res = await fetch(url, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) throw new Error(`call_events poll -> ${res.status}`);
  return res.json();
}

const play = (ccid: string, mediaName: string) =>
  telnyx(`/calls/${ccid}/actions/playback_start`, { media_name: mediaName });
const randomAck = () => ACKS[Math.floor(Math.random() * ACKS.length)];

async function chooseClip(transcript: string): Promise<{ clip: string; ms: number }> {
  const t0 = Date.now();
  try {
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

// --- Dial (AMD on — P0 #9) ------------------------------------------------------
console.log(`Dialing ${to} from ${from} (AMD on) ...`);
const call = (
  await telnyx('/calls', {
    connection_id: connectionId,
    to,
    from,
    timeout_secs: 30,
    answering_machine_detection: 'detect',
  })
).data;
const ccid: string = call.call_control_id;
console.log(`call_control_id: ${ccid}\n`);

// --- Event loop -------------------------------------------------------------------
type Phase = 'dialing' | 'greeting' | 'consent_listen' | 'question' | 'rating_listen' | 'wrapup';
let phase: Phase = 'dialing';
let lastId = 0;
let done = false;
let listenStartedAt = 0;
let ratingAckFired = false;
const deadline = Date.now() + MAX_CALL_SECONDS * 1000;

while (!done && Date.now() < deadline) {
  const events = await fetchEvents(ccid, lastId);
  for (const ev of events) {
    lastId = ev.id;
    const p = ev.payload ?? {};
    const tag =
      p.media_name ? `  [${p.media_name}]`
      : p.result ? `  [${p.result}]`
      : p.transcription_data?.transcript !== undefined
        ? `  "${p.transcription_data.transcript}"${p.transcription_data.is_final === false ? ' (partial)' : ''}`
        : '';
    console.log(`  ${ev.occurred_at}  ${ev.event_type}${tag}  {${phase}}`);

    const transcript: string = (p.transcription_data?.transcript ?? '').trim();
    const isFinal = p.transcription_data?.is_final !== false;

    if (ev.event_type === 'call.answered' && phase === 'dialing') {
      phase = 'greeting';
      // Start listening NOW (inbound track only — our clips don't pollute it):
      // starting after the greeting ends missed the caller's immediate consent
      // and added engine spin-up to the perceived gap (Sean, 8/7 call 5).
      // Engine B sends finals only, ~2-3s after end of speech — try Deepgram
      // (fast endpointing + interim results) and fall back to B.
      try {
        await telnyx(`/calls/${ccid}/actions/transcription_start`, {
          language: 'en',
          transcription_engine: 'Deepgram',
          transcription_tracks: 'inbound',
        });
        console.log('  >> transcription engine: Deepgram');
      } catch {
        await telnyx(`/calls/${ccid}/actions/transcription_start`, {
          language: 'en',
          transcription_engine: 'B',
          transcription_tracks: 'inbound',
        });
        console.log('  >> transcription engine: B (Deepgram unavailable)');
      }
      await play(ccid, 'cv_greet'); // asks consent — turn ENDS here, nothing pre-queued
      console.log('  >> greeting sent, transcription already running');
    } else if (ev.event_type === 'call.machine.detection.ended') {
      console.log(`  >> AMD verdict: ${p.result}`);
    } else if (ev.event_type === 'call.playback.ended' && p.media_name === 'cv_greet') {
      phase = 'consent_listen';
      listenStartedAt = Date.now();
      console.log('  >> listening for consent');
    } else if (ev.event_type === 'call.transcription' && phase === 'consent_listen' && transcript.length > 0) {
      // ANY speech (even a partial) counts as consent — don't wait for finals.
      phase = 'question';
      await play(ccid, randomAck());
      await play(ccid, 'cv_q1'); // within-turn sequence: ack -> question is fine to queue
      console.log('  >> consent heard — ack + question queued');
    } else if (ev.event_type === 'call.playback.ended' && p.media_name === 'cv_q1') {
      phase = 'rating_listen';
      listenStartedAt = Date.now();
      ratingAckFired = false;
      console.log('  >> listening for rating');
    } else if (ev.event_type === 'call.transcription' && phase === 'rating_listen' && transcript.length > 0) {
      // Ack on the FIRST sign of speech (partial) — mask starts immediately;
      // the LLM decision waits for the final transcript.
      if (!ratingAckFired) {
        ratingAckFired = true;
        const tAck = Date.now();
        await play(ccid, randomAck());
        console.log(`  >> ack sent on first speech (${Date.now() - tAck}ms command RTT)`);
      }
      if (isFinal && transcript.length > 1) {
        phase = 'wrapup';
        await telnyx(`/calls/${ccid}/actions/transcription_stop`).catch(() => {});
        const { clip, ms } = await chooseClip(transcript);
        await play(ccid, clip);
        await play(ccid, 'cv_goodbye');
        console.log(`  >> LLM chose ${clip} in ${ms}ms — response + goodbye queued behind ack`);
      }
    } else if (ev.event_type === 'call.playback.ended' && p.media_name === 'cv_goodbye') {
      await telnyx(`/calls/${ccid}/actions/hangup`).catch(() => {});
      console.log('  >> hangup sent');
    } else if (ev.event_type === 'call.hangup') {
      done = true;
    }
  }
  // Fallbacks so silence never strands the call
  if (phase === 'consent_listen' && Date.now() - listenStartedAt > 6_000) {
    phase = 'question';
    await play(ccid, 'cv_q1');
    console.log('  >> no consent heard in 10s — proceeding to question');
  } else if (phase === 'rating_listen' && Date.now() - listenStartedAt > 20_000) {
    phase = 'wrapup';
    await play(ccid, 'cv_resp_unclear');
    await play(ccid, 'cv_goodbye');
    console.log('  >> no rating heard in 20s — unclear + goodbye queued');
  }
  if (!done) await new Promise((r) => setTimeout(r, POLL_MS));
}
if (!done) {
  console.log('Deadline hit — sending hangup.');
  await telnyx(`/calls/${ccid}/actions/hangup`).catch(() => {});
}

// --- Timing report -------------------------------------------------------------------
await new Promise((r) => setTimeout(r, 3000));
const all = await fetchEvents(ccid, 0);
console.log('\n=== Timeline (occurred_at deltas) ===');
let prev: number | null = null;
let callerFinalAt: number | null = null;
for (const ev of all) {
  const t = new Date(ev.occurred_at).getTime();
  const p = ev.payload ?? {};
  const tag =
    p.media_name ? `  [${p.media_name}]`
    : p.result ? `  [${p.result}]`
    : p.transcription_data?.transcript !== undefined
      ? `  "${p.transcription_data.transcript}"${p.transcription_data.is_final === false ? ' (partial)' : ''}`
      : '';
  console.log(`${ev.occurred_at}  ${ev.event_type}${tag}${prev === null ? '' : `  (+${t - prev}ms)`}`);
  if (ev.event_type === 'call.transcription' && p.transcription_data?.is_final !== false && (p.transcription_data?.transcript ?? '').trim().length > 1)
    callerFinalAt = t;
  if (ev.event_type === 'call.playback.started' && ACKS.includes(p.media_name) && callerFinalAt) {
    console.log(`    ^^ TURN SEAM (caller final transcript -> ack audio): ${t - callerFinalAt}ms`);
    callerFinalAt = null;
  }
  prev = t;
}
