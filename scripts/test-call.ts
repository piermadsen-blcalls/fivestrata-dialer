// First-real-call wiring test (roadmap step 2): dial a number from
// TELNYX_FROM_NUMBER via the fivestrata-dialer connection, let it ring/answer
// (no command loop yet — the callee hears silence), hang up after ~25s.
// Events arrive via the deployed webhook function -> call_events; verify there.
// Run: npx tsx scripts/test-call.ts +1XXXXXXXXXX
import 'dotenv/config';

const API = 'https://api.telnyx.com/v2';
const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const to = process.argv[2] ?? '';

if (!apiKey || !connectionId || !from) {
  console.error('Need TELNYX_API_KEY, TELNYX_CONNECTION_ID, TELNYX_FROM_NUMBER in env.');
  process.exit(1);
}
if (!/^\+1\d{10}$/.test(to)) {
  console.error('Usage: npx tsx scripts/test-call.ts +1XXXXXXXXXX (E.164 destination)');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

async function telnyx(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body?.errors?.[0];
    throw new Error(
      `${init?.method ?? 'GET'} ${path} -> HTTP ${res.status} ${e?.code ?? ''} ${e?.title ?? ''}${e?.detail ? ` — ${e.detail}` : ''}`,
    );
  }
  return body;
}

console.log(`Dialing ${to} from ${from} ...`);
const call = (
  await telnyx('/calls', {
    method: 'POST',
    body: JSON.stringify({ connection_id: connectionId, to, from, timeout_secs: 30 }),
  })
).data;
console.log(`call_control_id: ${call.call_control_id}`);
console.log(`call_session_id: ${call.call_session_id}`);

console.log('Ringing — hanging up in 25s ...');
await new Promise((r) => setTimeout(r, 25_000));

try {
  await telnyx(`/calls/${call.call_control_id}/actions/hangup`, { method: 'POST', body: '{}' });
  console.log('Hangup sent.');
} catch (err: any) {
  console.log(`Hangup skipped (${err.message.includes('422') ? 'call already ended' : err.message})`);
}

console.log('\nCheck call_events for call.initiated / answered / hangup rows.');
