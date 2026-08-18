// D2: map Telnyx hangup causes in OUR live call_events to the "carrier decline"
// bucket (the SIP 603/403-equivalent the KB/TD floor studies measured), and
// produce a per-DID decline rate over everything we've ever dialed.
// Caveat: current data is persona-rig-heavy (Claire dialing her own DID), so the
// MACHINERY is the deliverable; thresholds calibrate once real outbound runs.
// Run: node --import tsx scripts/did-decline-audit.ts
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL / SUPABASE_SECRET_KEY blank in .env');
  process.exit(1);
}
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

// Telnyx hangup causes that mean "the carrier refused/failed the call before or
// instead of a human outcome" — the reputation burn signal. Everything else is a
// normal call outcome (answered, callee/caller hangup, no-answer timeout, busy).
const CARRIER_DECLINE = new Set([
  'call_rejected',      // SIP 603 decline / carrier analytics block
  'unspecified',        // carrier failure with no better cause (KB floors see these)
  'not_found',          // SIP 404 — bad/disconnected number, counts against list not DID
  'unallocated_number', // ditto — tracked separately below
]);
const NUMBER_BAD = new Set(['not_found', 'unallocated_number', 'invalid_number_format']);

type Row = { payload: any };
const pageSize = 1000;
let offset = 0;
const rows: Row[] = [];
for (;;) {
  const page: Row[] = await fetch(
    `${supabaseUrl}/rest/v1/call_events?select=payload&event_type=eq.call.hangup&order=id.asc&limit=${pageSize}&offset=${offset}`,
    { headers: sb }).then(r => r.json());
  if (!Array.isArray(page)) { console.error('Query error:', JSON.stringify(page).slice(0, 200)); process.exit(1); }
  rows.push(...page);
  if (page.length < pageSize) break;
  offset += pageSize;
}
console.log(`call.hangup events: ${rows.length}\n`);

// 1. The raw taxonomy actually present in our data
const tally = new Map<string, number>();
const perDid = new Map<string, { dials: number; declines: number; bad: number }>();
for (const r of rows) {
  const p = r.payload ?? {};
  const cause = p.hangup_cause ?? '?';
  const sip = p.sip_hangup_cause ?? '';
  const src = p.hangup_source ?? '?';
  const key = `${cause}${sip ? ` (SIP ${sip})` : ''} src=${src}`;
  tally.set(key, (tally.get(key) ?? 0) + 1);

  const from = typeof p.from === 'string' ? p.from : p.from?.phone_number ?? '?';
  const did = from.length >= 4 ? `***${from.slice(-4)}` : from; // mask, last-4 only
  const d = perDid.get(did) ?? { dials: 0, declines: 0, bad: 0 };
  d.dials++;
  if (CARRIER_DECLINE.has(cause)) d.declines++;
  if (NUMBER_BAD.has(cause)) d.bad++;
  perDid.set(did, d);
}

console.log('Hangup-cause taxonomy observed (cause + SIP code + source):');
for (const [k, v] of [...tally.entries()].sort((a, b) => b[1] - a[1])) {
  const flag = [...CARRIER_DECLINE].some(c => k.startsWith(c)) ? '  <-- DECLINE bucket' : '';
  console.log(`  ${String(v).padStart(6)}  ${k}${flag}`);
}

console.log('\nPer-DID decline rate (dials = hangups seen; DECLINE excl. bad-number):');
for (const [did, d] of [...perDid.entries()].sort((a, b) => b[1].dials - a[1].dials)) {
  const pureDeclines = d.declines - d.bad;
  const rate = d.dials ? ((pureDeclines / d.dials) * 100).toFixed(1) : '0.0';
  console.log(`  ${did}: ${d.dials} dials, ${pureDeclines} declines (${rate}%), ${d.bad} bad-number`);
}
console.log('\nMapping proposal: decline-rate threshold counts call_rejected + unspecified;');
console.log('not_found/unallocated_number/invalid_number_format count against the LIST (lead quality), not the DID.');
