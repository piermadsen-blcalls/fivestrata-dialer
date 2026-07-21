/**
 * End-to-end smoke test against a locally running server (src/index.ts):
 * /health, then a clearly-fake test lead through POST /leads, then reads the
 * row back via Supabase. VICIdial is a placeholder host, so the expected
 * lead status is 'vici_error' (persisted, queued for later re-queue).
 */
import { supabase } from '../src/clients/supabase.js';

const base = 'http://localhost:3000';

const health = await fetch(`${base}/health`);
console.log('GET /health ->', health.status, JSON.stringify(await health.json()));

const res = await fetch(`${base}/leads`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    phone_number: '5555550100',
    first_name: 'Test',
    last_name: 'Lead',
    state: 'UT',
    postal_code: '84604',
    vertical: 'windows',
    lead_type: 'revive',
    source: 'e2e-test',
    sub_source: 'TEST',
    oleadid: 'TEST-0001',
  }),
});
const body = (await res.json()) as { lead_id?: string };
console.log('POST /leads ->', res.status, JSON.stringify(body));

if (body.lead_id) {
  const { data, error } = await supabase
    .from('leads')
    .select('id, oleadid, phone_number, vertical, lead_type, sub_source, status, created_at')
    .eq('id', body.lead_id)
    .single();
  console.log('row in supabase ->', error ? error.message : JSON.stringify(data));
}
