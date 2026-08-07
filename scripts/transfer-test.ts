// Warm-transfer leg test (W2 / PRD P0 #8): the platform's bridge pattern.
//   dial LEAD (leg A) -> announce clip -> dial CLIENT (leg B) [tAtt] ->
//   whisper clip to client -> bridge A<->B [tSucc] -> both parties talk.
//   Client no-answer -> fail clip to lead -> hangup (the fallback path).
// Instruments tAtt (leg B dial) and tSucc (bridge) per PRD §4 item 8; both
// legs' events land in call_events via the same webhook (one connection).
// Prereq: xfer_* clips uploaded (scripts/clips-upload.ts voice-packs/dev-pack-1).
// Run: npx tsx scripts/transfer-test.ts +1LEADNUMBER +1CLIENTNUMBER
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const POLL_MS = 250;
const MAX_CALL_SECONDS = 150;
const CLIENT_TIMEOUT_SECS = 25;

const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const leadNumber = process.argv[2] ?? '';
const clientNumber = process.argv[3] ?? '';

if (!apiKey || !connectionId || !from || !supabaseUrl || !supabaseKey) {
  console.error('Need TELNYX_* + SUPABASE_* env (see voice-loop-test.ts).');
  process.exit(1);
}
if (!/^\+1\d{10}$/.test(leadNumber) || !/^\+1\d{10}$/.test(clientNumber)) {
  console.error('Usage: npx tsx scripts/transfer-test.ts +1LEADNUMBER +1CLIENTNUMBER');
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

// --- Leg A: the lead ------------------------------------------------------------
console.log(`Dialing LEAD ${leadNumber} from ${from} ...`);
const legA = (
  await telnyx('/calls', { connection_id: connectionId, to: leadNumber, from, timeout_secs: 30 })
).data;
const ccidA: string = legA.call_control_id;
console.log(`leg A: ${ccidA}\n`);

let ccidB: string | null = null;
let lastA = 0;
let lastB = 0;
let announced = false;
let whispered = false;
let bridged = false;
let failed = false;
let done = false;
let tAtt: number | null = null;
let tSucc: number | null = null;
const deadline = Date.now() + MAX_CALL_SECONDS * 1000;

while (!done && Date.now() < deadline) {
  const [evA, evB] = await Promise.all([
    fetchEvents(ccidA, lastA),
    ccidB ? fetchEvents(ccidB, lastB) : Promise.resolve([]),
  ]);

  for (const ev of evA) {
    lastA = ev.id;
    const p = ev.payload ?? {};
    console.log(`  A ${ev.occurred_at}  ${ev.event_type}${p.media_name ? `  [${p.media_name}]` : ''}`);
    if (ev.event_type === 'call.answered' && !announced) {
      announced = true;
      await play(ccidA, 'xfer_announce');
      console.log('  >> announce clip to lead');
    } else if (ev.event_type === 'call.playback.ended' && p.media_name === 'xfer_announce' && !ccidB) {
      // tAtt: create the client leg the moment the announce finishes
      tAtt = Date.now();
      const legB = (
        await telnyx('/calls', {
          connection_id: connectionId,
          to: clientNumber,
          from,
          timeout_secs: CLIENT_TIMEOUT_SECS,
        })
      ).data;
      ccidB = legB.call_control_id;
      console.log(`  >> tAtt — dialing CLIENT leg B: ${ccidB}`);
    } else if (ev.event_type === 'call.hangup') {
      done = true;
    }
  }

  for (const ev of evB) {
    lastB = ev.id;
    const p = ev.payload ?? {};
    console.log(`  B ${ev.occurred_at}  ${ev.event_type}${p.media_name ? `  [${p.media_name}]` : ''}`);
    if (ev.event_type === 'call.answered' && !whispered) {
      whispered = true;
      await play(ccidB!, 'xfer_whisper');
      console.log('  >> whisper clip to client');
    } else if (ev.event_type === 'call.playback.ended' && p.media_name === 'xfer_whisper' && !bridged) {
      bridged = true;
      await telnyx(`/calls/${ccidA}/actions/bridge`, { call_control_id: ccidB });
      tSucc = Date.now();
      console.log(`  >> tSucc — BRIDGED (tAtt->tSucc: ${tAtt ? tSucc - tAtt : '?'}ms)`);
    } else if (ev.event_type === 'call.hangup' && !bridged && !failed) {
      // Client never made it — the no-answer fallback path
      failed = true;
      await play(ccidA, 'xfer_fail');
      console.log('  >> client leg died pre-bridge — fail clip to lead');
    } else if (ev.event_type === 'call.hangup' && bridged) {
      await telnyx(`/calls/${ccidA}/actions/hangup`).catch(() => {});
    }
  }

  if (failed) {
    // Give the fail clip time to play, then wrap up leg A
    await new Promise((r) => setTimeout(r, 8000));
    await telnyx(`/calls/${ccidA}/actions/hangup`).catch(() => {});
    failed = false; // hangup event on A will end the loop
  }
  if (!done) await new Promise((r) => setTimeout(r, POLL_MS));
}
if (!done) {
  console.log('Deadline hit — hanging up both legs.');
  await telnyx(`/calls/${ccidA}/actions/hangup`).catch(() => {});
  if (ccidB) await telnyx(`/calls/${ccidB}/actions/hangup`).catch(() => {});
}

console.log('\n=== Transfer summary ===');
console.log(`tAtt (client dial):   ${tAtt ? new Date(tAtt).toISOString() : 'never'}`);
console.log(`tSucc (bridged):      ${tSucc ? new Date(tSucc).toISOString() : 'never'}`);
if (tAtt && tSucc) console.log(`tAtt -> tSucc:        ${tSucc - tAtt}ms`);
console.log('Crediting note (7/29): FS is paid on the ATTEMPT even if the client no-answers.');
