// Synthetic-customer test call (Sean 8/11): Claire dials OUR OWN DID; the
// inbound leg is answered by the edge agent in persona mode (roster = PERSONAS
// in supabase/functions/telnyx-agent). Two AIs, one phone call,
// zero humans — full transcripts of both sides land in call_events and the
// recording captures the whole conversation.
// Run: npx tsx scripts/persona-call.ts <persona> [question=q_bathroom] [greet=demo_greet]
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const POLL_MS = 500;
const MAX_CALL_SECONDS = 240;

const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const persona = process.argv[2] ?? '';
const question = process.argv[3] ?? 'q_bathroom';
const greet = process.argv[4] ?? 'demo_greet';

const VALID = ['curmudgeon', 'wishy_washy', 'talker', 'confused_elder', 'normal', 'hobby_litigator', 'butch'];
if (!VALID.includes(persona) || !apiKey || !connectionId || !from || !supabaseUrl || !supabaseKey) {
  console.error(`Usage: npx tsx scripts/persona-call.ts <${VALID.join('|')}> [question] [greet]`);
  process.exit(1);
}

const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

// Tell the agent which persona answers next (single-test-at-a-time is fine).
await fetch(`${supabaseUrl}/rest/v1/dialer_config?key=eq.persona_next`, {
  method: 'DELETE',
  headers: sb,
});
await fetch(`${supabaseUrl}/rest/v1/dialer_config`, {
  method: 'POST',
  headers: { ...sb, Prefer: 'return=minimal' },
  body: JSON.stringify({ key: 'persona_next', value: persona }),
});

console.log(`Persona: ${persona} — Claire dials her own number (${from}) ...`);
const dialRes = await fetch(`${TELNYX}/calls`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connection_id: connectionId,
    to: from,
    from,
    timeout_secs: 30,
    record: 'record-from-answer',
    record_channels: 'single',
    record_format: 'mp3',
    client_state: Buffer.from(JSON.stringify({ phase: 'dialing', greet, question, goodbye: 'goodbye_biz' })).toString('base64'),
  }),
});
const dialBody: any = await dialRes.json().catch(() => ({}));
if (!dialRes.ok) {
  console.error(`dial failed: ${dialRes.status} ${JSON.stringify(dialBody).slice(0, 300)}`);
  process.exit(1);
}
const ccid: string = dialBody.data.call_control_id;
const sessionId: string = dialBody.data.call_session_id;
console.log(`Claire leg: ${ccid}\n`);

async function fetchEvents(afterId: number): Promise<any[]> {
  // Watch the whole session window by time — both legs' events.
  const url =
    `${supabaseUrl}/rest/v1/call_events` +
    `?select=id,event_type,occurred_at,call_control_id,payload&id=gt.${afterId}&order=id.asc&limit=100`;
  const res = await fetch(url, { headers: sb });
  if (!res.ok) throw new Error(`poll -> ${res.status}`);
  return res.json();
}

let lastId = 0;
{
  // Start from the current tail so we only show this test's events.
  const tail = await fetch(
    `${supabaseUrl}/rest/v1/call_events?select=id&order=id.desc&limit=1`,
    { headers: sb },
  ).then((r) => r.json());
  lastId = (tail?.[0]?.id ?? 1) - 1;
}

let done = false;
let claireHungUp = false;
const deadline = Date.now() + MAX_CALL_SECONDS * 1000;
while (!done && Date.now() < deadline) {
  for (const ev of await fetchEvents(lastId)) {
    lastId = ev.id;
    const p = ev.payload ?? {};
    const who = ev.call_control_id === ccid ? 'CLAIRE' : 'CUSTOMER';
    const tag =
      p.media_name ? `[${p.media_name}]`
      : p.result ? `[AMD ${p.result}]`
      : p.transcription_data?.transcript !== undefined
        ? `"${p.transcription_data.transcript}"${p.transcription_data.is_final === false ? ' (partial)' : ''}`
        : '';
    if (tag || /answered|hangup|initiated/.test(ev.event_type)) {
      console.log(`  ${who.padEnd(8)} ${ev.event_type.replace('call.', '')}  ${tag}`);
    }
    if (ev.event_type === 'call.hangup' && ev.call_control_id === ccid) claireHungUp = true;
    if (claireHungUp && ev.event_type === 'call.hangup') done = true;
  }
  if (claireHungUp) done = true;
  if (!done) await new Promise((r) => setTimeout(r, POLL_MS));
}

await new Promise((r) => setTimeout(r, 3000));
const rec = (await fetchEvents(lastId)).find((ev) => ev.event_type === 'call.recording.saved');
if (rec) console.log(`\nRecording: ${(rec.payload?.recording_urls ?? {}).mp3 ?? ''}`);
console.log('\nDone. Full trace in call_events; session ' + sessionId);
