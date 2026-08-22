// Outbound-half test battery: pre-auth client + disposition outbox against a
// LOCAL mock of FiveStrata's two endpoints (loopback only — NO traffic ever
// leaves this machine; the pre-auth endpoint must not be test-fired at
// production because it assigns clients round-robin). Credentials are FAKE
// via env injection — the real key file is never read.
//
// Uses the real Supabase outbox tables (TEST-OB rows, cleaned up after).
// Run: npm run outbound:test
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

// --- Fake credentials BEFORE importing the clients (env beats the key file).
process.env.FS_CC_USERNAME = 'AI-TEST';
process.env.FS_CC_KEY_BR = 'test-key-br';
process.env.FS_CC_KEY_HW = 'test-key-hw';
process.env.FS_CC_KEY_SL = 'test-key-sl';
process.env.FS_CC_KEY_WI = 'test-key-wi';
process.env.FS_CC_ENV_FILE = 'C:/nonexistent-on-purpose.sh';

const { preAuthorize, buildDispositionPayload, formatDispoTimestamp } = await import(
  '../src/clients/fivestrataOutbound.js'
);
const { preAuthorizeAndLog } = await import('../src/services/preAuth.js');
const { enqueueDisposition, drainOutbox, backoffSeconds } = await import(
  '../src/services/dispoOutbox.js'
);
const { supabase } = await import('../src/clients/supabase.js');

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

// --- Mock FiveStrata --------------------------------------------------------
interface Seen {
  preauth: Array<Record<string, string>>;
  dispo: Array<{ auth: string | null; body: any }>;
}
const seen: Seen = { preauth: [], dispo: [] };
const dispoFailuresRemaining = new Map<string, number>(); // oleadid -> 500s to serve first

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });
}

const mock = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const body = await readBody(req);
  const url = req.url ?? '';

  if (url.startsWith('/API/transfer-client.php')) {
    const params = Object.fromEntries(new URLSearchParams(body));
    seen.preauth.push(params);
    const oid = params.OLeadID ?? '';
    if (oid.startsWith('SLOW-')) {
      // Exceeds the client timeout; the client aborts first.
      await new Promise((r) => setTimeout(r, 3000));
      res.writeHead(200).end('{}');
      return;
    }
    if (oid.startsWith('ERR-')) {
      res.writeHead(500).end('internal error');
      return;
    }
    if (oid.startsWith('BADJSON-')) {
      res.writeHead(200, { 'content-type': 'application/json' }).end('<html>not json');
      return;
    }
    if (oid.startsWith('NOCLIENT-')) {
      res
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ result: 'no eligible client', ClientID: '', transferCode: '' }));
      return;
    }
    if (oid.startsWith('FALSY-')) {
      // PHP-style falsy sentinels — must NOT authorize.
      res
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ result: 'success', transferCode: false, transferPhone: 0, brandId: null }));
      return;
    }
    if (oid.startsWith('DENY-')) {
      // Explicit denial alongside stale/echoed transfer fields — must NOT authorize.
      res.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          result: 'error - cap exceeded',
          transferCode: 'TC-STALE',
          transferPhone: '8005550199',
        }),
      );
      return;
    }
    if (oid.startsWith('REDIR-')) {
      res.writeHead(302, { location: '/API/transfer-client.php?again=1' }).end();
      return;
    }
    if (oid.includes('ECHO-')) {
      // Debug-page-style parameter echo: the key comes back in the body.
      res.writeHead(500).end(`fatal: bad request key=${params.key} OLeadID=${oid}`);
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        ClientID: 'C-77',
        clientName: 'Acme Remodels',
        transferCode: 'TC-123',
        transferPhone: '8005550100',
        vertical: 'BR',
        State: 'UT',
        Area: 'SLC',
        Zip: params.zips,
        brandId: 'BRAND-9',
        result: 'success',
        undocumented_extra: 'ignore-me',
      }),
    );
    return;
  }

  if (url.startsWith('/api/call-center/lead-disposition')) {
    let parsed: any = null;
    try {
      parsed = JSON.parse(body);
    } catch {
      /* keep null */
    }
    seen.dispo.push({ auth: req.headers.authorization ?? null, body: parsed });
    const oid = parsed?.oleadid ?? '';
    if (oid.startsWith('TEST-OB-REDIR')) {
      // A redirected dispo must NOT count as delivered.
      res.writeHead(302, { location: '/somewhere-else' }).end();
      return;
    }
    const remaining = dispoFailuresRemaining.get(oid) ?? 0;
    if (remaining > 0) {
      dispoFailuresRemaining.set(oid, remaining - 1);
      res.writeHead(500).end('{"error":"transient"}');
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end('{"ok":true}');
    return;
  }

  res.writeHead(404).end();
});

await new Promise<void>((resolve) => mock.listen(0, '127.0.0.1', resolve));
const port = (mock.address() as { port: number }).port;
const PREAUTH_URL = `http://127.0.0.1:${port}/API/transfer-client.php`;
const DISPO_URL = `http://127.0.0.1:${port}/api/call-center/lead-disposition`;
const DEAD_URL = 'http://127.0.0.1:9/nowhere'; // discard port — connection refused

async function cleanup(): Promise<void> {
  await supabase.from('dispo_outbox').delete().like('dedupe_key', 'TEST-OB-%');
  await supabase.from('preauth_log').delete().like('oleadid', 'TEST-PA-%');
}

// SAFETY GATE: drainOutbox claims ANY due row — if real (non-test) pending
// dispositions exist, this battery would deliver them to the loopback mock
// and mark them delivered, silently losing them. Refuse to run.
{
  const { data: realRows } = await supabase
    .from('dispo_outbox')
    .select('id, dedupe_key, state')
    .in('state', ['pending', 'delivering'])
    .not('dedupe_key', 'like', 'TEST-OB-%')
    .limit(5);
  if (realRows && realRows.length > 0) {
    console.error(
      `ABORT: ${realRows.length}+ real pending/delivering dispo_outbox row(s) exist — running the battery would swallow them:`,
      realRows.map((r) => r.dedupe_key).join(', '),
    );
    process.exit(1);
  }
}
await cleanup();

try {
console.log('payload builder:');
{
  const base = { oleadid: 'X', calldispoFives: 'Qualified', dispositionedAt: new Date() };
  const p = buildDispositionPayload({
    ...base,
    calldispoExtFives: 'transferred',
    brandIdFives: 'BRAND-9',
    wtclientFives: 'TC-123',
    extra: { walkin_tub_fives: 'No' },
  });
  check(
    'required + optional fields present, absent ones omitted',
    p.oleadid === 'X' &&
      p.calldispo_fives === 'Qualified' &&
      p.calldispo_ext_fives === 'transferred' &&
      p.brand_id_fives === 'BRAND-9' &&
      p.wtclient_fives === 'TC-123' &&
      p.walkin_tub_fives === 'No' &&
      !('first_name' in p) &&
      !('credit_score' in p),
    JSON.stringify(p),
  );
  check(
    'timestamp format YYYY-MM-DD HH:MM:SS',
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(String(p.timestamp_callcenter_dispositioned_fives)),
    String(p.timestamp_callcenter_dispositioned_fives),
  );
  check(
    'known UTC instant formats correctly',
    formatDispoTimestamp(new Date(Date.UTC(2026, 7, 21, 5, 4, 3)), 'UTC') === '2026-08-21 05:04:03',
    formatDispoTimestamp(new Date(Date.UTC(2026, 7, 21, 5, 4, 3)), 'UTC'),
  );
  check(
    'ET timezone + day rollover (05:04 UTC = 01:04 EDT same date; 03:30 UTC = 23:30 EDT prior date)',
    formatDispoTimestamp(new Date(Date.UTC(2026, 7, 21, 5, 4, 3)), 'America/New_York') ===
      '2026-08-21 01:04:03' &&
      formatDispoTimestamp(new Date(Date.UTC(2026, 7, 21, 3, 30, 0)), 'America/New_York') ===
        '2026-08-20 23:30:00',
  );
  check(
    'explicit null ext passes through as JSON null (guide "send ext as null")',
    buildDispositionPayload({ ...base, calldispoExtFives: null }).calldispo_ext_fives === null,
  );
  let threw = false;
  try {
    buildDispositionPayload({ oleadid: '', calldispoFives: 'Qualified', dispositionedAt: new Date() });
  } catch {
    threw = true;
  }
  check('missing oleadid throws', threw);
  threw = false;
  try {
    buildDispositionPayload({ oleadid: 'X', calldispoFives: ' ', dispositionedAt: new Date() });
  } catch {
    threw = true;
  }
  check('blank calldispo_fives throws', threw);
}

console.log('pre-auth (§4.1, all against local mock):');
{
  const ok = await preAuthorize(
    { oleadid: 'OK-1', zip: '84101', phone: '5551230001', vertical: 'bathroom' },
    { url: PREAUTH_URL },
  );
  check('authorized on transferCode+transferPhone', ok.outcome === 'authorized', JSON.stringify(ok));
  check(
    'response fields parsed (brandId, transferPhone, result verbatim)',
    ok.client?.brandId === 'BRAND-9' &&
      ok.client?.transferPhone === '8005550100' &&
      ok.client?.result === 'success',
  );
  const sent = seen.preauth.at(-1)!;
  check(
    'form-encoded request per guide: key/zips/OLeadID/phone, vertical-mapped key',
    sent.key === 'test-key-br' && sent.zips === '84101' && sent.OLeadID === 'OK-1' && sent.phone === '5551230001',
    JSON.stringify(sent),
  );
  const wi = await preAuthorize(
    { oleadid: 'OK-2', zip: '84102', phone: '5551230002', vertical: 'windows' },
    { url: PREAUTH_URL },
  );
  check('windows maps to WI key', seen.preauth.at(-1)!.key === 'test-key-wi' && wi.outcome === 'authorized');

  const nc = await preAuthorize(
    { oleadid: 'NOCLIENT-1', zip: '84103', phone: '5551230003', vertical: 'home_warranty' },
    { url: PREAUTH_URL },
  );
  check('no eligible client -> no_client (do not dial)', nc.outcome === 'no_client', JSON.stringify(nc));

  const err = await preAuthorize(
    { oleadid: 'ERR-1', zip: '84104', phone: '5551230004', vertical: 'solar' },
    { url: PREAUTH_URL },
  );
  check('HTTP 500 -> error (fail closed)', err.outcome === 'error' && err.httpStatus === 500);

  const bad = await preAuthorize(
    { oleadid: 'BADJSON-1', zip: '84105', phone: '5551230005', vertical: 'BR' },
    { url: PREAUTH_URL },
  );
  check('non-JSON 200 -> error (fail closed)', bad.outcome === 'error');

  const slow = await preAuthorize(
    { oleadid: 'SLOW-1', zip: '84106', phone: '5551230006', vertical: 'BR' },
    { url: PREAUTH_URL, timeoutMs: 500 },
  );
  check('timeout -> timeout (fail closed)', slow.outcome === 'timeout', JSON.stringify(slow));

  const dead = await preAuthorize(
    { oleadid: 'DEAD-1', zip: '84107', phone: '5551230007', vertical: 'BR' },
    { url: DEAD_URL, timeoutMs: 2000 },
  );
  check('connection refused -> error (fail closed)', dead.outcome === 'error');

  const falsy = await preAuthorize(
    { oleadid: 'FALSY-1', zip: '84108', phone: '5551230008', vertical: 'BR' },
    { url: PREAUTH_URL },
  );
  check(
    'PHP falsy sentinels (false/0) -> no_client, fields nulled',
    falsy.outcome === 'no_client' && falsy.client?.transferCode === null && falsy.client?.transferPhone === null,
    JSON.stringify(falsy.client),
  );

  const deny = await preAuthorize(
    { oleadid: 'DENY-1', zip: '84109', phone: '5551230009', vertical: 'BR' },
    { url: PREAUTH_URL },
  );
  check(
    'deny-ish result despite transfer fields -> no_client + calibration flag',
    deny.outcome === 'no_client' && Boolean(deny.error?.includes('calibration')),
    JSON.stringify({ outcome: deny.outcome, error: deny.error }),
  );

  const redir = await preAuthorize(
    { oleadid: 'REDIR-1', zip: '84110', phone: '5551230010', vertical: 'BR' },
    { url: PREAUTH_URL },
  );
  check('3xx redirect -> error (fail closed, body never re-sent)', redir.outcome === 'error', JSON.stringify(redir.error));

  let threw = false;
  try {
    await preAuthorize(
      { oleadid: 'X', zip: '1', phone: '2', vertical: 'boats' },
      { url: PREAUTH_URL },
    );
  } catch {
    threw = true;
  }
  check('unknown vertical throws', threw);
}

console.log('pre-auth logging (preauth_log):');
{
  const r = await preAuthorizeAndLog(
    { oleadid: 'TEST-PA-1', zip: '84101', phone: '+1 (555) 123-0001', vertical: 'bathroom' },
    { leadId: null, callId: null },
    { url: PREAUTH_URL },
  );
  check('logged call authorized', r.outcome === 'authorized');
  const { data: row } = await supabase
    .from('preauth_log')
    .select('outcome, vertical, zip, phone_digits, brand_id, transfer_code, transfer_phone, result, http_status, raw')
    .eq('oleadid', 'TEST-PA-1')
    .single();
  check(
    'log row: outcome/brandId/transferCode/canonical digits/raw persisted',
    row?.outcome === 'authorized' &&
      row?.brand_id === 'BRAND-9' &&
      row?.transfer_code === 'TC-123' &&
      row?.phone_digits === '5551230001' &&
      row?.result === 'success' &&
      row?.http_status === 200 &&
      Boolean(row?.raw),
    JSON.stringify(row),
  );
  await preAuthorizeAndLog(
    { oleadid: 'TEST-PA-2', zip: '84104', phone: '5551230004', vertical: 'solar' },
    {},
    { url: DEAD_URL, timeoutMs: 2000 },
  );
  const { data: row2 } = await supabase
    .from('preauth_log')
    .select('outcome, error')
    .eq('oleadid', 'TEST-PA-2')
    .single();
  check(
    'error outcome logged too (dead endpoint -> error)',
    row2?.outcome === 'error' && Boolean(row2?.error),
    JSON.stringify(row2),
  );

  // Key echoed back in an error page must be redacted before persistence.
  await preAuthorizeAndLog(
    { oleadid: 'TEST-PA-ECHO-3', zip: '84104', phone: '5551230004', vertical: 'windows' },
    {},
    { url: PREAUTH_URL },
  );
  const { data: echoRow } = await supabase
    .from('preauth_log')
    .select('outcome, raw, error')
    .eq('oleadid', 'TEST-PA-ECHO-3')
    .single();
  check(
    'echoed key redacted from persisted raw',
    echoRow?.outcome === 'error' &&
      !JSON.stringify(echoRow).includes('test-key-wi') &&
      JSON.stringify(echoRow?.raw ?? '').includes('[KEY]'),
    JSON.stringify(echoRow),
  );

  // Config-class failure (unknown vertical) still logs + fails closed.
  const cfg = await preAuthorizeAndLog(
    { oleadid: 'TEST-PA-BADVERT-4', zip: '1', phone: '5551230000', vertical: 'boats' },
    {},
    { url: PREAUTH_URL },
  );
  const { data: cfgRow } = await supabase
    .from('preauth_log')
    .select('outcome, error')
    .eq('oleadid', 'TEST-PA-BADVERT-4')
    .single();
  check(
    'config throw -> error result + logged (no unlogged pings)',
    cfg.outcome === 'error' && cfgRow?.outcome === 'error' && Boolean(cfgRow?.error),
    JSON.stringify(cfgRow),
  );
}

console.log('dispo outbox (§4.2):');
{
  const base = {
    vertical: 'bathroom',
    calldispoFives: 'Qualified',
    calldispoExtFives: 'transferred',
    dispositionedAt: new Date(),
    brandIdFives: 'BRAND-9',
    wtclientFives: 'TC-123',
    repidFives: 'claire-v1',
  };
  const e1 = await enqueueDisposition({ ...base, dedupeKey: 'TEST-OB-1', oleadid: 'TEST-OB-1' });
  check('enqueue -> new row', e1.enqueued && e1.id !== null);
  const e2 = await enqueueDisposition({ ...base, dedupeKey: 'TEST-OB-1', oleadid: 'TEST-OB-1' });
  check('re-enqueue same dedupe_key -> idempotent no-op', !e2.enqueued);

  const d1 = await drainOutbox({ url: DISPO_URL, limit: 10 });
  check('drain delivers', d1.delivered === 1, JSON.stringify(d1));
  const posted = seen.dispo.filter((d) => d.body?.oleadid === 'TEST-OB-1');
  check('exactly one POST for the row', posted.length === 1, `posts=${posted.length}`);
  check(
    'Basic auth = username:vertical-key',
    posted[0]?.auth === `Basic ${Buffer.from('AI-TEST:test-key-br').toString('base64')}`,
  );
  check(
    'payload carries required trio + brand/wtclient echo',
    posted[0]?.body?.calldispo_fives === 'Qualified' &&
      posted[0]?.body?.oleadid === 'TEST-OB-1' &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
        posted[0]?.body?.timestamp_callcenter_dispositioned_fives ?? '',
      ) &&
      posted[0]?.body?.brand_id_fives === 'BRAND-9' &&
      posted[0]?.body?.wtclient_fives === 'TC-123' &&
      posted[0]?.body?.repid_fives === 'claire-v1',
    JSON.stringify(posted[0]?.body),
  );
  const d2 = await drainOutbox({ url: DISPO_URL, limit: 10 });
  check('second drain -> nothing to claim (no double-send)', d2.claimed === 0);
  const { data: row } = await supabase
    .from('dispo_outbox')
    .select('state, attempts, last_status, delivered_at')
    .eq('dedupe_key', 'TEST-OB-1')
    .single();
  check(
    'row delivered, attempts=1, status 200',
    row?.state === 'delivered' && row?.attempts === 1 && row?.last_status === 200 && Boolean(row?.delivered_at),
    JSON.stringify(row),
  );

  // Retry path: server 500s once, then succeeds.
  dispoFailuresRemaining.set('TEST-OB-RETRY', 1);
  await enqueueDisposition({ ...base, dedupeKey: 'TEST-OB-RETRY', oleadid: 'TEST-OB-RETRY' });
  const d3 = await drainOutbox({ url: DISPO_URL, limit: 10 });
  check('500 -> retried (not delivered, not failed)', d3.retried === 1 && d3.delivered === 0, JSON.stringify(d3));
  const { data: rrow } = await supabase
    .from('dispo_outbox')
    .select('state, attempts, last_status, next_attempt_at')
    .eq('dedupe_key', 'TEST-OB-RETRY')
    .single();
  check(
    'retry row pending w/ backoff in the future, status 500 recorded',
    rrow?.state === 'pending' &&
      rrow?.attempts === 1 &&
      rrow?.last_status === 500 &&
      new Date(rrow?.next_attempt_at).getTime() > Date.now() + 30_000,
    JSON.stringify(rrow),
  );
  // Pull the retry forward and drain again — now it succeeds.
  await supabase
    .from('dispo_outbox')
    .update({ next_attempt_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('dedupe_key', 'TEST-OB-RETRY');
  const d4 = await drainOutbox({ url: DISPO_URL, limit: 10 });
  const retryPosts = seen.dispo.filter((d) => d.body?.oleadid === 'TEST-OB-RETRY');
  check(
    'retry delivers on next drain (2 posts total: contract-sanctioned retry)',
    d4.delivered === 1 && retryPosts.length === 2,
    `delivered=${d4.delivered} posts=${retryPosts.length}`,
  );

  // Network refusal is retryable, never terminal.
  await enqueueDisposition({ ...base, dedupeKey: 'TEST-OB-NET', oleadid: 'TEST-OB-NET' });
  const d5 = await drainOutbox({ url: DEAD_URL, timeoutMs: 2000, limit: 10 });
  const { data: nrow } = await supabase
    .from('dispo_outbox')
    .select('state, last_status, last_error')
    .eq('dedupe_key', 'TEST-OB-NET')
    .single();
  check(
    'connection refused -> pending retry with error recorded',
    d5.retried === 1 && nrow?.state === 'pending' && nrow?.last_status === null && Boolean(nrow?.last_error),
    JSON.stringify(nrow),
  );

  // Exhaustion: attempts at the cap flips to failed (escalation, not silent drop).
  await supabase
    .from('dispo_outbox')
    .update({ attempts: 24, next_attempt_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('dedupe_key', 'TEST-OB-NET');
  const d6 = await drainOutbox({ url: DEAD_URL, timeoutMs: 2000, limit: 10 });
  const { data: frow } = await supabase
    .from('dispo_outbox')
    .select('state, attempts')
    .eq('dedupe_key', 'TEST-OB-NET')
    .single();
  check(
    'max_attempts crossed -> failed',
    d6.failed === 1 && frow?.state === 'failed' && frow?.attempts === 25,
    JSON.stringify(frow),
  );

  // Lease: a claimed row is invisible to a second claimer until the lease expires.
  await enqueueDisposition({ ...base, dedupeKey: 'TEST-OB-LEASE', oleadid: 'TEST-OB-LEASE' });
  const { data: claimed } = await supabase.rpc('dispo_claim', { p_limit: 10, p_lease_seconds: 120 });
  const ours = (claimed ?? []).filter((r: any) => r.dedupe_key === 'TEST-OB-LEASE');
  const { data: second } = await supabase.rpc('dispo_claim', { p_limit: 10, p_lease_seconds: 120 });
  const stolen = (second ?? []).filter((r: any) => r.dedupe_key === 'TEST-OB-LEASE');
  check('claim leases the row; second claim gets nothing', ours.length === 1 && stolen.length === 0);
  // Expired lease is reclaimable (crashed-worker recovery).
  await supabase
    .from('dispo_outbox')
    .update({ next_attempt_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('dedupe_key', 'TEST-OB-LEASE');
  const { data: third } = await supabase.rpc('dispo_claim', { p_limit: 10, p_lease_seconds: 120 });
  const reclaimed = (third ?? []).filter((r: any) => r.dedupe_key === 'TEST-OB-LEASE');
  check('expired lease reclaimable, attempts incremented', reclaimed.length === 1 && reclaimed[0].attempts === 2);

  check('backoff schedule sane (60s, 4m, 16m, ..., 6h cap)',
    backoffSeconds(1) === 60 && backoffSeconds(2) === 240 && backoffSeconds(3) === 960 && backoffSeconds(10) === 21600);

  // A 302 from the dispo endpoint must be a retry, never a delivery.
  await enqueueDisposition({ ...base, dedupeKey: 'TEST-OB-REDIR', oleadid: 'TEST-OB-REDIR' });
  const d7 = await drainOutbox({ url: DISPO_URL, limit: 10 });
  const { data: redirRow } = await supabase
    .from('dispo_outbox')
    .select('state, last_status, last_error')
    .eq('dedupe_key', 'TEST-OB-REDIR')
    .single();
  check(
    'dispo 302 -> pending retry, not delivered',
    d7.delivered === 0 && d7.retried === 1 && redirRow?.state === 'pending' && Boolean(redirRow?.last_error),
    JSON.stringify({ d7, redirRow }),
  );

  // Duplicate call_id under a DIFFERENT dedupe key: idempotent no-op, no
  // throw. A call row must exist for the FK; create a throwaway.
  const { data: callRow } = await supabase.from('calls').insert({ agent_id: 'TEST-OB-CALL' }).select('id').single();
  if (callRow) {
    const c1 = await enqueueDisposition({ ...base, dedupeKey: 'TEST-OB-CALL-A', oleadid: 'TEST-OB-CALL', callId: callRow.id });
    const c2 = await enqueueDisposition({ ...base, dedupeKey: 'TEST-OB-CALL-B', oleadid: 'TEST-OB-CALL', callId: callRow.id });
    check('same call_id, different dedupe key -> absorbed as no-op', c1.enqueued && !c2.enqueued, JSON.stringify({ c1, c2 }));
    await supabase.from('dispo_outbox').delete().like('dedupe_key', 'TEST-OB-CALL-%');
    await supabase.from('calls').delete().eq('id', callRow.id);
  } else {
    check('same call_id, different dedupe key -> absorbed as no-op', false, 'could not create throwaway call row');
  }
}
} finally {
  await cleanup();
  mock.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail === 0 ? 0 : 1;
