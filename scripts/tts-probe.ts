// Live-TTS path probe (Sean 8/17: the long tail is priority #1 — "in no
// scenario should this solution not have a live TTS ready to go").
// Measures, on one real call:
//   A. in-call `speak` with Claire's Azure DragonHD voice — accepted? seam?
//   B. in-call `speak` with basic voice — baseline seam
//   C. render (/text-to-speech/speech) -> media upload -> playback_start seam
// The call rides lineup mode with a long first clip we immediately stop, so
// the agent leaves the call parked and this script owns it.
// Run: node --import tsx scripts/tts-probe.ts
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const AZURE_VOICE = 'Azure.en-US-Ava:DragonHDLatestNeural';
const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const tx = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

async function events(ccid: string): Promise<any[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/call_events?select=event_type,occurred_at,payload&call_control_id=eq.${encodeURIComponent(ccid)}&order=id.asc`,
    { headers: sb },
  );
  return res.json();
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function cmd(ccid: string, path: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(`${TELNYX}/calls/${ccid}/actions/${path}`, { method: 'POST', headers: tx, body: JSON.stringify(body) });
  return { ok: res.ok, status: res.status, body: (await res.text()).slice(0, 300) };
}

// Park the persona slot on something quiet.
await fetch(`${supabaseUrl}/rest/v1/dialer_config?key=eq.persona_next`, { method: 'DELETE', headers: sb });
await fetch(`${supabaseUrl}/rest/v1/dialer_config`, { method: 'POST', headers: { ...sb, Prefer: 'return=minimal' }, body: JSON.stringify({ key: 'persona_next', value: 'brief_decliner' }) });

console.log('Dialing own DID in lineup-park mode...');
const dial = await fetch(`${TELNYX}/calls`, {
  method: 'POST',
  headers: tx,
  body: JSON.stringify({
    connection_id: connectionId,
    to: from,
    from,
    timeout_secs: 30,
    client_state: Buffer.from(JSON.stringify({ phase: 'dialing', playlist: ['q_homewarranty', 'cv_goodbye'] })).toString('base64'),
  }),
});
const dialBody: any = await dial.json();
if (!dial.ok) {
  console.error('dial failed', dial.status, JSON.stringify(dialBody).slice(0, 200));
  process.exit(1);
}
const ccid = dialBody.data.call_control_id;
console.log('ccid', ccid.slice(0, 30) + '...');

// Wait for answer, then take the call away from the agent.
for (let i = 0; i < 20; i++) {
  await wait(1000);
  if ((await events(ccid)).some((e) => e.event_type === 'call.answered')) break;
}
await wait(1500);
console.log('stopping lineup playback (parking the call)...');
await cmd(ccid, 'playback_stop', { stop: 'all' });
await wait(1000);

// --- A: speak with the Azure DragonHD voice --------------------------------
const lineA = 'This is Claire again — just checking one quick thing on my end. Thanks for bearing with me!';
let tA = Date.now();
const a = await cmd(ccid, 'speak', { payload: lineA, voice: AZURE_VOICE, language: 'en-US' });
console.log(`A speak[DragonHD] -> HTTP ${a.status}${a.ok ? '' : ' ' + a.body}`);
let aAccepted = a.ok;
if (!a.ok) {
  // Voice-string variants worth one retry each.
  for (const v of ['Azure.en-US-AvaNeural', 'AWS.Polly.Joanna-Neural', 'Polly.Joanna-Neural']) {
    const r = await cmd(ccid, 'speak', { payload: lineA, voice: v, language: 'en-US' });
    console.log(`A' speak[${v}] -> HTTP ${r.status}${r.ok ? '' : ' ' + r.body}`);
    if (r.ok) { aAccepted = true; tA = Date.now(); break; }
  }
}
if (aAccepted) await wait(9000);

// --- B: speak with basic voice (baseline) -----------------------------------
const tB = Date.now();
const b = await cmd(ccid, 'speak', { payload: 'And this is the basic voice as a baseline for the seam measurement.', voice: 'female', language: 'en-US' });
console.log(`B speak[female] -> HTTP ${b.status}${b.ok ? '' : ' ' + b.body}`);
if (b.ok) await wait(7000);

// --- C: render -> upload -> play --------------------------------------------
const lineC = 'And this line was rendered live, uploaded, and played back as media — the slow path.';
const tC0 = Date.now();
const ttsRes = await fetch(`${TELNYX}/text-to-speech/speech`, {
  method: 'POST',
  headers: tx,
  body: JSON.stringify({ voice: AZURE_VOICE, text: lineC }),
});
const mp3 = Buffer.from(await ttsRes.arrayBuffer());
const tC1 = Date.now();
console.log(`C render -> HTTP ${ttsRes.status}, ${(mp3.length / 1024).toFixed(0)} KB in ${tC1 - tC0}ms`);
const mediaName = `tts_probe_${Date.now()}`;
const fd = new FormData();
fd.append('media_name', mediaName);
fd.append('ttl_secs', '3600');
fd.append('media', new Blob([mp3], { type: 'audio/mpeg' }), 'probe.mp3');
const up = await fetch(`${TELNYX}/media`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: fd });
const tC2 = Date.now();
console.log(`C upload -> HTTP ${up.status} in ${tC2 - tC1}ms`);
const tC3 = Date.now();
const play = await cmd(ccid, 'playback_start', { media_name: mediaName });
console.log(`C playback_start -> HTTP ${play.status} in ${Date.now() - tC3}ms (total render->command ${Date.now() - tC0}ms)`);
await wait(8000);

await cmd(ccid, 'hangup', {});
await wait(3000);

// --- Read the seams from the event stream -----------------------------------
const evs = await events(ccid);
const speakEvents = evs.filter((e) => e.event_type.startsWith('call.speak'));
const playEvents = evs.filter((e) => e.event_type.startsWith('call.playback') && e.payload?.media_name === mediaName);
console.log('\n--- event timeline (speak + probe playback) ---');
for (const e of [...speakEvents, ...playEvents]) console.log(e.occurred_at.slice(11, 23), e.event_type, e.payload?.media_name ?? '', (e.payload?.payload ?? '').slice?.(0, 40) ?? '');
const starts = speakEvents.filter((e) => e.event_type === 'call.speak.started').map((e) => new Date(e.occurred_at).getTime());
if (aAccepted && starts[0]) console.log(`\nA seam (speak cmd -> speak.started): ${starts[0] - tA}ms`);
if (b.ok && starts[1]) console.log(`B seam (speak cmd -> speak.started): ${starts[1] - tB}ms`);
const pStart = playEvents.find((e) => e.event_type === 'call.playback.started');
if (pStart) console.log(`C seam (render start -> playback.started): ${new Date(pStart.occurred_at).getTime() - tC0}ms`);
console.log('\nRecording note: none taken — battery calls will demo audio quality.');
