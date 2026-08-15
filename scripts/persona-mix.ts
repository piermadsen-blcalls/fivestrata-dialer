// Street-mix battery (Sean 8/15): a frequency-realistic deck instead of the
// prototypical equal-weights soak. Most real conversations are fast declines,
// brush-offs, and wrong numbers; convertibles are rare. Deck is stratified —
// realistic mix for the honest topline (transfers/100 conversations,
// precision), convertibles oversampled just enough that per-persona
// diagnostics keep statistical teeth. '+lag' keys run the same persona
// through the degraded-line simulator (slow, fragmented turns).
// Run: node --import tsx scripts/persona-mix.ts [seed=815]
// Spot-check one call: node --import tsx scripts/persona-mix.ts 0 <personaKey> [question]
import 'dotenv/config';
import { appendFileSync } from 'node:fs';

const TELNYX = 'https://api.telnyx.com/v2';
const BALANCE_FLOOR_USD = 2.0;
const CALL_TIMEOUT_MS = 240_000;
const GAP_MS = 5_000;
const LOG = 'C:/Claude/scratch/persona-batch.jsonl';
const VERTICALS = ['q_windows', 'q_bathroom', 'q_flooring', 'q_homewarranty', 'q_solar'];

// deck spec: [personaKey, count, pinnedVertical?]
const DECK_SPEC: Array<[string, number, string?]> = [
  // clean street arm (135)
  ['brief_decliner', 25], ['busy_brushoff', 20], ['wrong_person', 10],
  ['curmudgeon', 12], ['talker', 18], ['confused_elder', 12],
  ['wishy_washy', 12], ['price_shopper', 12], ['hobby_litigator', 3],
  ['normal', 6, 'q_bathroom'], ['butch', 5, 'q_bathroom'],
  // degraded-line arm (65) — buyers oversampled: a convertible on a bad line
  // is the money question
  ['brief_decliner+lag', 10], ['busy_brushoff+lag', 8], ['talker+lag', 10],
  ['confused_elder+lag', 10], ['wishy_washy+lag', 7], ['price_shopper+lag', 8],
  ['normal+lag', 7, 'q_bathroom'], ['butch+lag', 5, 'q_bathroom'],
];

const seed = Number(process.argv[2] ?? 815);
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(seed);

const deck: Array<{ persona: string; question: string }> = [];
if (process.argv[3]) {
  deck.push({ persona: process.argv[3], question: process.argv[4] ?? 'q_bathroom' });
} else {
  let vi = 0;
  for (const [persona, count, pinned] of DECK_SPEC) {
    for (let i = 0; i < count; i++) deck.push({ persona, question: pinned ?? VERTICALS[vi++ % VERTICALS.length] });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

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

console.log(`Street-mix battery: ${deck.length} calls, seed ${seed}, floor $${BALANCE_FLOOR_USD}`);
let n = 0;
for (const { persona, question } of deck) {
  if (n % 5 === 0) {
    const bal = await balance();
    console.log(`[balance] $${Number.isFinite(bal) ? bal.toFixed(2) : '?'} before call ${n + 1}`);
    if (Number.isFinite(bal) && bal < BALANCE_FLOOR_USD) {
      console.log('Balance floor hit — stopping cleanly.');
      break;
    }
  }
  n++;
  await setPersona(persona);
  const started = new Date().toISOString();
  const call = await dial(question);
  if (!call) {
    appendFileSync(LOG, JSON.stringify({ n, persona, question, started, error: 'dial_failed' }) + '\n');
    await new Promise((r) => setTimeout(r, GAP_MS));
    continue;
  }
  const end = await waitForEnd(call.ccid);
  const line = {
    n,
    persona,
    question,
    ccid: call.ccid,
    session: call.session,
    started,
    ended: new Date().toISOString(),
    clean: end.ended,
    events: end.events,
    lastClip: end.lastClip,
  };
  appendFileSync(LOG, JSON.stringify(line) + '\n');
  console.log(`#${n}/${deck.length} ${persona} ${question} -> ${end.ended ? 'ok' : 'TIMEOUT'} (${end.events} events, last clip ${end.lastClip})`);
  await new Promise((r) => setTimeout(r, GAP_MS));
}
console.log(`Done: ${n} calls. Log: ${LOG}`);
