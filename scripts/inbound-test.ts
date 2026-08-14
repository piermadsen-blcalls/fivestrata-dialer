// Live test battery for the fivestrata-inbound Edge Function — exercises all
// five inbound routes end to end against the deployed endpoint, then verifies
// the database side effects through the service-role client. Uses DEMO-safe
// data only (555 numbers, TEST-INBOUND oleadids) and a dedicated 'test' ZCWL
// list so the live 'default' allowlist is never touched. Cleans up after
// itself (inbound_events audit rows are kept — that's the point of an audit).
//
// Requires: migration 0004 applied, function deployed, key seeded
// (scripts/inbound-key-seed.ts). Reads the key from
// C:\Claude\aicc-inbound-env.sh; never prints it.
//
// Run: npm run inbound:test
import { readFileSync } from 'node:fs';
import { supabase } from '../src/clients/supabase.js';

const BASE = 'https://wcftuethlcgeasopayed.supabase.co/functions/v1/fivestrata-inbound';
const KEY_FILE = 'C:/Claude/aicc-inbound-env.sh';
const key =
  readFileSync(KEY_FILE, 'utf8').match(/^export AICC_INBOUND_API_KEY=(.+)$/m)?.[1]?.trim() ?? '';
if (!key) {
  console.error(`AICC_INBOUND_API_KEY not found in ${KEY_FILE} — run inbound-key-seed.ts first`);
  process.exit(1);
}

const OID1 = 'TEST-INBOUND-001';
const OID2 = 'TEST-INBOUND-002';
const PHONE1 = '5551230001';
const PHONE2 = '(555) 123-0002';
const PHONE2_DIGITS = '5551230002';
const ZLIST = 'test'; // never 'default' — that's the live allowlist

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ''}`);
  }
}

async function post(path: string, body: unknown, opts: { key?: string | null; raw?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const k = opts.key === undefined ? key : opts.key;
  if (k) headers['x-api-key'] = k;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: opts.raw ?? JSON.stringify(body),
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json };
}

async function testZipCount(): Promise<number | null> {
  const { count } = await supabase
    .from('zcwl_zips')
    .select('*', { count: 'exact', head: true })
    .eq('list_name', ZLIST);
  return count;
}

async function cleanup(): Promise<void> {
  await supabase.from('leads').delete().like('oleadid', 'TEST-INBOUND-%');
  await supabase.from('dnc_numbers').delete().in('phone_digits', [PHONE1, PHONE2_DIGITS]);
  await supabase.from('zcwl_zips').delete().eq('list_name', ZLIST);
}

await cleanup();

console.log('auth + method:');
{
  const res = await fetch(`${BASE}/leads`, { method: 'GET', headers: { 'x-api-key': key } });
  check('GET -> 405', res.status === 405, `got ${res.status}`);
}
check(
  'no key -> 401',
  (await post('/leads', { phone_number: PHONE1, oleadid: OID1 }, { key: null })).status === 401,
);
check(
  'wrong key -> 401',
  (await post('/leads', { phone_number: PHONE1, oleadid: OID1 }, { key: 'not-the-key' })).status ===
    401,
);
check('invalid json -> 400', (await post('/leads', null, { raw: '{nope' })).status === 400);
check('unknown route -> 404', (await post('/nope', {})).status === 404);

console.log('zcwl:');
{
  const r1 = await post('/zcwl', {
    list: ZLIST,
    zips: ['99901', '99902', '99903', ' 99904 ', '99904', '', 'x'],
  });
  check('sync -> 200', r1.status === 200, JSON.stringify(r1.json));
  check(
    'dedup/trim/garbage-drop -> received 7, synced 4',
    r1.json?.received === 7 && r1.json?.synced === 4,
    JSON.stringify(r1.json),
  );
  check('rows present', (await testZipCount()) === 4, `count=${await testZipCount()}`);
  const r2 = await post('/zcwl', { list: ZLIST, zips: ['99910', '99911'] });
  const c2 = await testZipCount();
  check(
    're-sync replaces (test list = 2)',
    r2.json?.synced === 2 && c2 === 2,
    `synced=${r2.json?.synced} count=${c2}`,
  );
  check('empty zips -> 422', (await post('/zcwl', { list: ZLIST, zips: [] })).status === 422);
}

console.log('leads:');
let leadId = '';
{
  const r = await post('/leads', {
    phone_code: '1',
    first_name: 'Demo',
    last_name: 'Tester',
    phone_number: PHONE1,
    address1: '123 Test St',
    address3: 'Unit 5',
    city: 'Testville',
    state: 'UT',
    postal_code: '99901',
    country_code: 'US',
    email: 'demo@example.com',
    FSCode1: '|VT:TEST|PD:X|CH:Y|SC:Z|CP:0|',
    FSCode2: '|SS:TEST|SA:0|',
    vendor_lead_code: OID1,
    oleadid: OID1,
    max_attempts: 5,
  });
  leadId = r.json?.id ?? '';
  check('ingest -> 200 + id', r.status === 200 && Boolean(leadId), JSON.stringify(r.json));
  const { data: row } = await supabase
    .from('leads')
    .select(
      'oleadid, vendor_lead_code, fscode1, fscode2, max_attempts, lead_type, source, status, dnc, phone_code, address3, country_code',
    )
    .eq('id', leadId)
    .single();
  check(
    'fields mapped + identifiers preserved',
    row?.oleadid === OID1 &&
      row?.vendor_lead_code === OID1 &&
      row?.fscode1 === '|VT:TEST|PD:X|CH:Y|SC:Z|CP:0|' &&
      row?.fscode2 === '|SS:TEST|SA:0|' &&
      row?.max_attempts === 5 &&
      row?.lead_type === 'fresh' &&
      row?.source === 'fivestrata_push' &&
      row?.status === 'received' &&
      row?.dnc === false &&
      row?.phone_code === '1' &&
      row?.address3 === 'Unit 5' &&
      row?.country_code === 'US',
    JSON.stringify(row),
  );
  check(
    'missing phone -> 422',
    (await post('/leads', { oleadid: 'TEST-INBOUND-NOPHONE' })).status === 422,
  );
  check(
    'missing oleadid -> 422 (removability contract)',
    (await post('/leads', { phone_number: PHONE1 })).status === 422,
  );
  check(
    'bad max_attempts -> 422 (never silently defaulted)',
    (await post('/leads', { phone_number: PHONE1, oleadid: 'TEST-INBOUND-BADMAX', max_attempts: '5x' }))
      .status === 422,
  );
  const dup = await post('/leads', { phone_number: PHONE1, oleadid: OID1 });
  check(
    'duplicate oleadid -> idempotent same id',
    dup.status === 200 && dup.json?.duplicate === true && dup.json?.id === leadId,
    JSON.stringify(dup.json),
  );
}

console.log('dnc / undnc:');
{
  const r = await post('/dnc', { phone_number: PHONE1 });
  check(
    'dnc -> 200, 1 lead flipped',
    r.status === 200 && r.json?.leads_updated === 1,
    JSON.stringify(r.json),
  );
  const { data: row } = await supabase.from('leads').select('dnc').eq('id', leadId).single();
  check('leads.dnc = true', row?.dnc === true);
  const { data: reg } = await supabase
    .from('dnc_numbers')
    .select('phone_digits')
    .eq('phone_digits', PHONE1)
    .maybeSingle();
  check('registry row present', Boolean(reg));
  // A lead arriving (with +1 formatting) for a suppressed number ingests
  // pre-flagged — enforced by the leads_dnc_guard trigger, not the function.
  const r2 = await post('/leads', { phone_number: `+1 ${PHONE1}`, oleadid: OID2 });
  check(
    'post-DNC ingest flagged dnc=true (trigger, +1 form)',
    r2.status === 200 && r2.json?.dnc === true,
    JSON.stringify(r2.json),
  );
  check(
    'formatted-number dnc -> 200',
    (await post('/dnc', { phone_number: PHONE2 })).status === 200,
  );
  const { data: reg2 } = await supabase
    .from('dnc_numbers')
    .select('phone_digits')
    .eq('phone_digits', PHONE2_DIGITS)
    .maybeSingle();
  check('formatted number stored canonically', reg2?.phone_digits === PHONE2_DIGITS);
  const un = await post('/undnc', { phone_number: PHONE1 });
  check('undnc -> 200', un.status === 200, JSON.stringify(un.json));
  const { data: row2 } = await supabase.from('leads').select('dnc').eq('id', leadId).single();
  const { data: reg3 } = await supabase
    .from('dnc_numbers')
    .select('phone_digits')
    .eq('phone_digits', PHONE1)
    .maybeSingle();
  check('flag cleared + registry row gone', row2?.dnc === false && !reg3);
  check('bad phone -> 422', (await post('/dnc', { phone_number: 'abc' })).status === 422);
}

console.log('leads/remove:');
{
  const r = await post('/leads/remove', { OLeadID: OID1 });
  check('remove -> 200, removed 1', r.status === 200 && r.json?.removed === 1, JSON.stringify(r.json));
  const { data: row } = await supabase
    .from('leads')
    .select('status, removed_at')
    .eq('id', leadId)
    .single();
  check('status=removed + removed_at set', row?.status === 'removed' && Boolean(row?.removed_at));
  const again = await post('/leads/remove', { oleadid: OID1 });
  check('repeat remove idempotent -> 200, removed 0', again.status === 200 && again.json?.removed === 0);
  check(
    'unknown oleadid -> 200 (confirmed absent)',
    (await post('/leads/remove', { OLeadID: 'TEST-INBOUND-GHOST' })).status === 200,
  );
  // Re-send after confirmed remove = legitimately new lead.
  const resend = await post('/leads', { phone_number: PHONE1, oleadid: OID1 });
  check(
    're-send after remove -> new lead',
    resend.status === 200 && resend.json?.duplicate === undefined && resend.json?.id !== leadId,
    JSON.stringify(resend.json),
  );
}

console.log('audit:');
{
  // Scoped to THIS run's lead events — immune to concurrent traffic.
  const { count } = await supabase
    .from('inbound_events')
    .select('*', { count: 'exact', head: true })
    .eq('endpoint', 'leads')
    .eq('summary->>oleadid', OID1)
    .gte('received_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
  check('inbound_events rows landed (this run, OID1)', (count ?? 0) >= 3, `count=${count}`);
}

await cleanup();

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail === 0 ? 0 : 1;
