// Observer for the CO-LOCATED conversational loop (telnyx-agent edge
// function). This script only DIALS and WATCHES — the conversation runs
// entirely in the cloud; the laptop is out of the loop. Prints the live event
// stream from call_events and a seam report at the end. Records the call
// (record-from-answer) and prints the MP3 URL — every demo run produces a
// shareable artifact (and it's P0 #2's first light).
// Prereq: telnyx-agent deployed + Call Control app webhook pointed at it +
// telnyx_api_key available to the function (secret or dialer_config).
// Run: npx tsx scripts/edge-convo-call.ts +1XXXXXXXXXX [greet=cv_greet] [question=cv_q1] [goodbye=cv_goodbye]
//   meta demo:    ... +1X demo_greet
//   vertical demo: ... +1X demo_greet q_windows goodbye_biz   (also q_flooring/q_bathroom/q_solar)
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const POLL_MS = 500; // display only — latency no longer depends on this
const MAX_CALL_SECONDS = 150;
const ACKS = ['cv_ack_1', 'cv_ack_2', 'cv_ack_3'];

const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const to = process.argv[2] ?? '';

if (!apiKey || !connectionId || !from || !supabaseUrl || !supabaseKey) {
  console.error('Need TELNYX_* + SUPABASE_* env.');
  process.exit(1);
}
if (!/^\+1\d{10}$/.test(to)) {
  console.error('Usage: npx tsx scripts/edge-convo-call.ts +1XXXXXXXXXX');
  process.exit(1);
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

const greet = process.argv[3] ?? 'cv_greet';
const question = process.argv[4] ?? 'cv_q1';
const goodbye = process.argv[5] ?? 'cv_goodbye';
console.log(`Dialing ${to} from ${from} — edge conversation (greet: ${greet}, question: ${question}, goodbye: ${goodbye}, recording on) ...`);
const dialRes = await fetch(`${TELNYX}/calls`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connection_id: connectionId,
    to,
    from,
    timeout_secs: 30,
    answering_machine_detection: 'detect',
    record: 'record-from-answer',
    record_channels: 'single',
    record_format: 'mp3',
    client_state: Buffer.from(JSON.stringify({ phase: 'dialing', greet, question, goodbye })).toString('base64'),
  }),
});
const dialBody: any = await dialRes.json().catch(() => ({}));
if (!dialRes.ok) {
  console.error(`dial failed: ${dialRes.status} ${JSON.stringify(dialBody).slice(0, 300)}`);
  process.exit(1);
}
const ccid: string = dialBody.data.call_control_id;
console.log(`call_control_id: ${ccid}\n`);

let lastId = 0;
let done = false;
const deadline = Date.now() + MAX_CALL_SECONDS * 1000;
while (!done && Date.now() < deadline) {
  for (const ev of await fetchEvents(ccid, lastId)) {
    lastId = ev.id;
    const p = ev.payload ?? {};
    const tag =
      p.media_name ? `  [${p.media_name}]`
      : p.result ? `  [${p.result}]`
      : p.transcription_data?.transcript !== undefined
        ? `  "${p.transcription_data.transcript}"${p.transcription_data.is_final === false ? ' (partial)' : ''}`
        : '';
    console.log(`  ${ev.occurred_at}  ${ev.event_type}${tag}`);
    if (ev.event_type === 'call.hangup') done = true;
  }
  if (!done) await new Promise((r) => setTimeout(r, POLL_MS));
}

// --- Seam report ---------------------------------------------------------------
await new Promise((r) => setTimeout(r, 3000));
const all = await fetchEvents(ccid, 0);
console.log('\n=== Timeline (occurred_at deltas) ===');
let prev: number | null = null;
let callerAt: number | null = null;
for (const ev of all) {
  const t = new Date(ev.occurred_at).getTime();
  const p = ev.payload ?? {};
  const tr = (p.transcription_data?.transcript ?? '').trim();
  const tag =
    p.media_name ? `  [${p.media_name}]`
    : p.result ? `  [${p.result}]`
    : p.transcription_data?.transcript !== undefined
      ? `  "${p.transcription_data.transcript}"${p.transcription_data.is_final === false ? ' (partial)' : ''}`
      : '';
  console.log(`${ev.occurred_at}  ${ev.event_type}${tag}${prev === null ? '' : `  (+${t - prev}ms)`}`);
  if (ev.event_type === 'call.transcription' && tr.length > 0 && callerAt === null) callerAt = t;
  if (ev.event_type === 'call.playback.started' && ACKS.includes(p.media_name) && callerAt) {
    console.log(`    ^^ TURN SEAM (first transcript event -> ack audio): ${t - callerAt}ms  [co-located]`);
    callerAt = null;
  }
  prev = t;
}

const rec = all.find((ev) => ev.event_type === 'call.recording.saved');
if (rec) {
  const urls = rec.payload?.recording_urls ?? rec.payload?.public_recording_urls ?? {};
  console.log(`\nRecording (time-limited URL): ${urls.mp3 ?? JSON.stringify(urls)}`);
} else {
  console.log('\n(no recording.saved event yet — it can trail the hangup by a few seconds)');
}
