// Voice-loop PoC (roadmap step 2, the gate half): first time the platform
// SPEAKS on a real call. Dials the destination, watches call_events (poll —
// events arrive via the deployed webhook function), and runs a minimal
// command loop: call.answered -> speak line 1 -> call.speak.ended -> speak
// line 2 -> hangup. Prints a per-event timing report; the headline number is
// the gap between speak 1 ending and speak 2 starting — the full-loop "seam"
// through the webhook->Postgres->poll path (conservative vs the eventual
// co-located loop; poll interval is part of it).
// Uses Telnyx built-in TTS (`speak`) — clip playback from voice packs is the
// next iteration (needs hosted audio).
// Run: npx tsx scripts/voice-loop-test.ts +1XXXXXXXXXX
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const POLL_MS = 250;
const MAX_CALL_SECONDS = 90;

const LINES = [
  'Hello Sean. This is the Five Strata dialer, speaking on its first real call. Every word you hear, and every event on this call, is being logged to the platform database.',
  'The next milestone replaces this synthetic voice with pre recorded clips. Goodbye for now.',
];

const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const to = process.argv[2] ?? '';

if (!apiKey || !connectionId || !from || !supabaseUrl || !supabaseKey) {
  console.error('Need TELNYX_API_KEY/TELNYX_CONNECTION_ID/TELNYX_FROM_NUMBER + SUPABASE_URL/SUPABASE_SECRET_KEY in env.');
  process.exit(1);
}
if (!/^\+1\d{10}$/.test(to)) {
  console.error('Usage: npx tsx scripts/voice-loop-test.ts +1XXXXXXXXXX');
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
    `?select=id,event_type,occurred_at&call_control_id=eq.${encodeURIComponent(ccid)}` +
    `&id=gt.${afterId}&order=id.asc`;
  const res = await fetch(url, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) throw new Error(`call_events poll -> ${res.status}`);
  return res.json();
}

// --- Dial ---------------------------------------------------------------------
console.log(`Dialing ${to} from ${from} ...`);
const call = (await telnyx('/calls', { connection_id: connectionId, to, from, timeout_secs: 30 })).data;
const ccid: string = call.call_control_id;
console.log(`call_control_id: ${ccid}\n`);

// --- Event loop ----------------------------------------------------------------
let lastId = 0;
let nextLine = 0;
let done = false;
const localMarks: Record<string, number> = {};
const deadline = Date.now() + MAX_CALL_SECONDS * 1000;

while (!done && Date.now() < deadline) {
  const events = await fetchEvents(ccid, lastId);
  for (const ev of events) {
    lastId = ev.id;
    console.log(`  ${ev.occurred_at}  ${ev.event_type}`);
    if (ev.event_type === 'call.answered' && nextLine === 0) {
      localMarks['answered_seen'] = Date.now();
      await telnyx(`/calls/${ccid}/actions/speak`, {
        payload: LINES[nextLine++],
        voice: 'female',
        language: 'en-US',
      });
      localMarks['speak1_sent'] = Date.now();
      console.log(`  >> speak #1 sent (${localMarks['speak1_sent'] - localMarks['answered_seen']}ms after seeing answered)`);
    } else if (ev.event_type === 'call.speak.ended') {
      if (nextLine < LINES.length) {
        const t = Date.now();
        await telnyx(`/calls/${ccid}/actions/speak`, {
          payload: LINES[nextLine++],
          voice: 'female',
          language: 'en-US',
        });
        console.log(`  >> speak #${nextLine} sent (${Date.now() - t}ms command RTT)`);
      } else {
        await telnyx(`/calls/${ccid}/actions/hangup`).catch(() => {});
        console.log('  >> hangup sent');
      }
    } else if (ev.event_type === 'call.hangup') {
      done = true;
    }
  }
  if (!done) await new Promise((r) => setTimeout(r, POLL_MS));
}
if (!done) {
  console.log('Deadline hit — sending hangup.');
  await telnyx(`/calls/${ccid}/actions/hangup`).catch(() => {});
}

// --- Timing report --------------------------------------------------------------
await new Promise((r) => setTimeout(r, 3000)); // let trailing events land
const all = await fetchEvents(ccid, 0);
console.log('\n=== Timeline (occurred_at deltas) ===');
let prev: number | null = null;
let speakEndedAt: number | null = null;
for (const ev of all) {
  const t = new Date(ev.occurred_at).getTime();
  const delta = prev === null ? '' : `  (+${t - prev}ms)`;
  console.log(`${ev.occurred_at}  ${ev.event_type}${delta}`);
  if (ev.event_type === 'call.speak.ended' && speakEndedAt === null) speakEndedAt = t;
  if (ev.event_type === 'call.speak.started' && speakEndedAt !== null) {
    console.log(`    ^^ SEAM (speak1 end -> speak2 start): ${t - speakEndedAt}ms via webhook->db->poll loop`);
    speakEndedAt = null;
  }
  prev = t;
}
