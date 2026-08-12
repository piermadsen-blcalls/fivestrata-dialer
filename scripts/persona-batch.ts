// Persona soak test (Sean 8/11): N calls per persona, sequential (the
// persona-selector slot is single and the dev channel cap is 10), verticals
// rotated, results appended to a local JSONL for analysis. Balance-guarded:
// re-checks every 5 calls and stops cleanly below the floor.
// Run: npx tsx scripts/persona-batch.ts [callsPerPersona=30]
import 'dotenv/config';
import { appendFileSync } from 'node:fs';

const TELNYX = 'https://api.telnyx.com/v2';
const PERSONAS = ['curmudgeon', 'wishy_washy', 'talker', 'confused_elder', 'normal', 'hobby_litigator'];
const VERTICALS = ['q_windows', 'q_bathroom', 'q_flooring', 'q_homewarranty', 'q_solar'];
const BALANCE_FLOOR_USD = 2.0;
const CALL_TIMEOUT_MS = 240_000;
const GAP_MS = 5_000;
const LOG = 'C:/Claude/scratch/persona-batch.jsonl';

const perPersona = Number(process.argv[2] ?? 30);
const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!apiKey || !connectionId || !from || !supabaseUrl || !supabaseKey) {
  console.error('Missing env.');
  process.exit(1);
}
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
const tx = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

// A multi-hour runner must survive transient network resets (8/11: one
// ECONNRESET killed the batch 9 calls in). Retry with backoff, never throw.
async function safeFetch(url: string, init?: RequestInit, tries = 4): Promise<Response | null> {
  for (let a = 1; a <= tries; a++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      console.error(`[net] attempt ${a}/${tries} failed: ${String(e).slice(0, 100)}`);
      await new Promise((r) => setTimeout(r, 3000 * a));
    }
  }
  return null;
}

async function balance(): Promise<number> {
  try {
    const b: any = await (await safeFetch(`${TELNYX}/balance`, { headers: tx }))?.json();
    return parseFloat(b?.data?.balance ?? 'NaN');
  } catch {
    return NaN;
  }
}

async function setPersona(p: string): Promise<void> {
  await safeFetch(`${supabaseUrl}/rest/v1/dialer_config?key=eq.persona_next`, { method: 'DELETE', headers: sb });
  await safeFetch(`${supabaseUrl}/rest/v1/dialer_config`, {
    method: 'POST',
    headers: { ...sb, Prefer: 'return=minimal' },
    body: JSON.stringify({ key: 'persona_next', value: p }),
  });
}

async function dial(question: string): Promise<{ ccid: string; session: string } | null> {
  const res = await safeFetch(`${TELNYX}/calls`, {
    method: 'POST',
    headers: tx,
    body: JSON.stringify({
      connection_id: connectionId,
      to: from,
      from,
      timeout_secs: 30,
      client_state: Buffer.from(
        JSON.stringify({ phase: 'dialing', greet: 'demo_greet', question, goodbye: 'goodbye_biz' }),
      ).toString('base64'),
    }),
  });
  if (!res) return null;
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`dial failed: ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
    return null;
  }
  return { ccid: body.data.call_control_id, session: body.data.call_session_id };
}

async function waitForEnd(ccid: string): Promise<{ ended: boolean; events: number; lastClip: string }> {
  const enc = encodeURIComponent(ccid);
  const deadline = Date.now() + CALL_TIMEOUT_MS;
  let events = 0;
  let lastClip = '';
  while (Date.now() < deadline) {
    const res = await safeFetch(
      `${supabaseUrl}/rest/v1/call_events?select=event_type,payload&call_control_id=eq.${enc}&order=id.asc`,
      { headers: sb },
    );
    const rows: any[] = res ? await res.json().catch(() => []) : [];
    events = rows.length;
    for (const ev of rows) if (ev.payload?.media_name) lastClip = ev.payload.media_name;
    if (rows.some((ev) => ev.event_type === 'call.hangup')) return { ended: true, events, lastClip };
    await new Promise((r) => setTimeout(r, 2000));
  }
  await fetch(`${TELNYX}/calls/${ccid}/actions/hangup`, { method: 'POST', headers: tx, body: '{}' }).catch(() => {});
  return { ended: false, events, lastClip };
}

console.log(`Soak test: ${perPersona} calls x ${PERSONAS.length} personas, floor $${BALANCE_FLOOR_USD}`);
let n = 0;
let aborted = false;
outer: for (let round = 0; round < perPersona; round++) {
  for (const persona of PERSONAS) {
    if (n % 5 === 0) {
      let bal = await balance();
      console.log(`[balance] $${bal.toFixed(2)} before call ${n + 1}`);
      if (Number.isFinite(bal) && bal < BALANCE_FLOOR_USD) {
        // Telnyx places provisional holds during active usage and releases
        // them as charges settle (8/11: reading dipped to $1.91 then
        // recovered to $6.94 with no top-up). Debounce before believing it.
        console.log('[balance] below floor — waiting 90s for holds to settle ...');
        await new Promise((r) => setTimeout(r, 90_000));
        bal = await balance();
        console.log(`[balance] re-read: $${bal.toFixed(2)}`);
        if (Number.isFinite(bal) && bal < BALANCE_FLOOR_USD) {
          console.log(`Balance below floor after settle — stopping cleanly after ${n} calls.`);
          aborted = true;
          break outer;
        }
      }
    }
    n++;
    const question = VERTICALS[(n - 1) % VERTICALS.length];
    await setPersona(persona);
    const started = new Date().toISOString();
    const call = await dial(question);
    if (!call) {
      appendFileSync(LOG, JSON.stringify({ n, round: round + 1, persona, question, started, error: 'dial_failed' }) + '\n');
      await new Promise((r) => setTimeout(r, 15_000));
      continue;
    }
    const result = await waitForEnd(call.ccid);
    const rec = {
      n,
      round: round + 1,
      persona,
      question,
      ccid: call.ccid,
      session: call.session,
      started,
      ended: new Date().toISOString(),
      clean: result.ended,
      events: result.events,
      lastClip: result.lastClip,
    };
    appendFileSync(LOG, JSON.stringify(rec) + '\n');
    console.log(`#${n} ${persona} ${question} -> ${result.ended ? 'ok' : 'TIMEOUT'} (${result.events} events, last clip ${result.lastClip})`);
    await new Promise((r) => setTimeout(r, GAP_MS));
  }
}
console.log(`\nDone: ${n} calls${aborted ? ' (stopped at balance floor)' : ''}. Log: ${LOG}`);
