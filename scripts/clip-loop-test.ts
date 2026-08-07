// Clip-loop seam test (roadmap step 2 gate): plays pre-recorded clips from
// Telnyx media storage on a live call and measures BOTH seam strategies:
//   - PRE-QUEUED: clip2's playback_start is sent while clip1 is still playing
//     (Telnyx queues it) -> seam should approach 0ms. This is the production
//     soundboard pattern: decide the next clip during the current one.
//   - REACTIVE: clip3 is fired only after clip2's ended event traverses the
//     full webhook -> Postgres -> poll -> command path -> seam ≈ dev-loop RTT
//     (~1300ms baseline from voice-loop-test). The comparison in one call is
//     the point.
// Prereq: scripts/clips-upload.ts (media names below must exist).
// Run: npx tsx scripts/clip-loop-test.ts +1XXXXXXXXXX
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const POLL_MS = 250;
const MAX_CALL_SECONDS = 90;
const CLIP1 = 'clip1_intro';
const CLIP2 = 'clip2_prequeued';
const CLIP3 = 'clip3_reactive';

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
  console.error('Usage: npx tsx scripts/clip-loop-test.ts +1XXXXXXXXXX');
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

// --- Dial ---------------------------------------------------------------------
console.log(`Dialing ${to} from ${from} ...`);
const call = (await telnyx('/calls', { connection_id: connectionId, to, from, timeout_secs: 30 })).data;
const ccid: string = call.call_control_id;
console.log(`call_control_id: ${ccid}\n`);

// --- Event loop ----------------------------------------------------------------
let lastId = 0;
let endedCount = 0;
let started = false;
let done = false;
const deadline = Date.now() + MAX_CALL_SECONDS * 1000;

while (!done && Date.now() < deadline) {
  const events = await fetchEvents(ccid, lastId);
  for (const ev of events) {
    lastId = ev.id;
    const media = ev.payload?.media_name ? `  [${ev.payload.media_name}]` : '';
    console.log(`  ${ev.occurred_at}  ${ev.event_type}${media}`);
    if (ev.event_type === 'call.answered' && !started) {
      started = true;
      const t = Date.now();
      await play(ccid, CLIP1);
      await play(ccid, CLIP2); // PRE-QUEUE while clip1 plays
      console.log(`  >> clip1 sent + clip2 pre-queued (${Date.now() - t}ms for both commands)`);
    } else if (ev.event_type === 'call.playback.ended') {
      endedCount++;
      if (endedCount === 2) {
        const t = Date.now();
        await play(ccid, CLIP3); // REACTIVE: full loop path
        console.log(`  >> clip3 sent reactively (${Date.now() - t}ms command RTT)`);
      } else if (endedCount === 3) {
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
await new Promise((r) => setTimeout(r, 3000));
const all = await fetchEvents(ccid, 0);
console.log('\n=== Timeline (occurred_at deltas) ===');
let prev: number | null = null;
let lastEnded: { media: string; t: number } | null = null;
for (const ev of all) {
  const t = new Date(ev.occurred_at).getTime();
  const media = ev.payload?.media_name ?? '';
  const delta = prev === null ? '' : `  (+${t - prev}ms)`;
  console.log(`${ev.occurred_at}  ${ev.event_type}${media ? `  [${media}]` : ''}${delta}`);
  if (ev.event_type === 'call.playback.ended') lastEnded = { media, t };
  if (ev.event_type === 'call.playback.started' && lastEnded) {
    const mode = media === CLIP2 ? 'PRE-QUEUED' : media === CLIP3 ? 'REACTIVE' : '?';
    console.log(`    ^^ SEAM ${mode} (${lastEnded.media} -> ${media}): ${t - lastEnded.t}ms`);
    lastEnded = null;
  }
  prev = t;
}
