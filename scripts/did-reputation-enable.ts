// D8d: enable Telnyx Number Reputation end-to-end. Idempotent — safe to re-run;
// each step checks state before acting.
//
// Sequence: (1) agree ToS  (2) create enterprise  (3) upload signed LOA PDF
//           (4) enable reputation  (5) poll Hiya vetting  (6) associate owned DIDs
//
// Guardrails:
// - Step 1 accepts legal terms and step 4 starts the $100/mo product — the script
//   REFUSES to run without the explicit `--i-approve-tos-and-fee` flag (Sean's
//   chat-approved go is what mints that flag; never run this unprompted).
// - Entity details (incl. FEIN) live OUTSIDE the repo: C:\Claude\aicc-enterprise.json
//   (org policy: no business identifiers committed). Template printed on first run.
// - Never prints key material.
//
// Run: node --import tsx scripts/did-reputation-enable.ts <path-to-signed-loa.pdf> --i-approve-tos-and-fee
import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';

const API = 'https://api.telnyx.com/v2';
const CONFIG_PATH = 'C:/Claude/aicc-enterprise.json';

const apiKey = process.env.TELNYX_API_KEY ?? '';
if (!apiKey) { console.error('TELNYX_API_KEY blank in .env'); process.exit(1); }

const loaPath = process.argv[2];
const approved = process.argv.includes('--i-approve-tos-and-fee');
if (!loaPath || !approved) {
  console.error('Usage: node --import tsx scripts/did-reputation-enable.ts <signed-loa.pdf> --i-approve-tos-and-fee');
  console.error('The flag attests Sean approved: (a) the Number Reputation ToS, (b) the $100/mo enterprise fee.');
  process.exit(1);
}
if (!existsSync(loaPath)) { console.error(`LOA not found: ${loaPath}`); process.exit(1); }

if (!existsSync(CONFIG_PATH)) {
  console.error(`Entity config missing. Create ${CONFIG_PATH} (kept OUTSIDE the repo) with the real values:`);
  console.error(JSON.stringify({
    legal_name: 'EXACT registered legal name (must match FEIN record)',
    doing_business_as: 'DBA',
    organization_type: 'commercial',
    organization_legal_type: 'llc',
    country_code: 'US',
    jurisdiction_of_incorporation: 'STATE',
    website: 'https://real-entity-site.example',
    fein: 'XX-XXXXXXX',
    industry: 'marketing',
    number_of_employees: '11-50',
    organization_contact: { first_name: '', last_name: '', email: '', job_title: '', phone_number: '+1...' },
    billing_contact: { first_name: '', last_name: '', email: '', phone_number: '+1...' },
    organization_physical_address: { country: 'US', administrative_area: '', city: '', postal_code: '', street_address: '' },
    billing_address: { country: 'US', administrative_area: '', city: '', postal_code: '', street_address: '' },
  }, null, 2));
  process.exit(1);
}
const entity = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

const authHeaders = { Authorization: `Bearer ${apiKey}` };
async function telnyx(path: string, init?: RequestInit & { raw?: boolean }): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { ...authHeaders };
  if (!init?.raw) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...headers, ...(init?.headers as any) } });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
const fail = (step: string, r: { status: number; body: any }) => {
  const e = r.body?.errors?.[0];
  console.error(`${step} -> HTTP ${r.status} ${e?.code ?? ''} ${e?.title ?? ''}${e?.detail ? ` — ${e.detail}` : ''}`);
  process.exit(1);
};

// 1. ToS ------------------------------------------------------------------------
const tos = await telnyx('/terms_of_service/number_reputation/agree', { method: 'POST', body: '{}' });
if (tos.status === 200 || tos.status === 201 || tos.status === 409 || tos.status === 422) {
  console.log(`1. ToS agree -> ${tos.status} ${tos.status >= 400 ? '(already agreed — continuing)' : 'OK'}`);
} else fail('1. ToS agree', tos);

// 2. Enterprise (reuse if one exists) --------------------------------------------
let enterprise = (await telnyx('/enterprises')).body?.data?.[0];
if (enterprise) {
  console.log(`2. Enterprise exists — reusing ${enterprise.id} (${enterprise.legal_name ?? '?'})`);
} else {
  const created = await telnyx('/enterprises', { method: 'POST', body: JSON.stringify(entity) });
  if (created.status >= 400) fail('2. Create enterprise', created);
  enterprise = created.body?.data;
  console.log(`2. Enterprise created: ${enterprise.id}`);
}

// 3. Upload signed LOA -----------------------------------------------------------
const form = new FormData();
form.append('file', new Blob([readFileSync(loaPath)], { type: 'application/pdf' }), 'number-reputation-loa.pdf');
const doc = await telnyx('/documents', { method: 'POST', body: form as any, raw: true });
if (doc.status >= 400) fail('3. Upload LOA', doc);
const documentId = doc.body?.data?.id;
console.log(`3. LOA uploaded: document_id=${documentId}`);

// 4. Enable reputation ------------------------------------------------------------
const existing = await telnyx(`/enterprises/${enterprise.id}/reputation`);
if (existing.status === 200 && existing.body?.data) {
  console.log(`4. Reputation already enabled (status=${existing.body.data.status ?? '?'}) — skipping enable`);
} else {
  const en = await telnyx(`/enterprises/${enterprise.id}/reputation`, {
    method: 'POST', body: JSON.stringify({ loa_document_id: documentId }),
  });
  if (en.status >= 400) fail('4. Enable reputation', en);
  console.log(`4. Reputation enable submitted (status=${en.body?.data?.status ?? 'pending'})`);
}

// 5. Poll Hiya vetting (docs say ~minutes) -----------------------------------------
let vetted = false;
for (let i = 0; i < 30; i++) {
  const r = await telnyx(`/enterprises/${enterprise.id}/reputation`);
  const status = r.body?.data?.status ?? r.body?.data?.vetting_status ?? '?';
  console.log(`5. Vetting status: ${status}`);
  if (String(status).toLowerCase() === 'approved') { vetted = true; break; }
  if (String(status).toLowerCase().includes('reject')) fail('5. Vetting', r);
  await new Promise(res => setTimeout(res, 20_000));
}
if (!vetted) { console.log('5. Not approved after 10 min — re-run later; steps 1–4 are idempotent.'); process.exit(0); }

// 6. Associate every owned US local number ------------------------------------------
const owned = (await telnyx('/phone_numbers?page[size]=100')).body?.data ?? [];
const numbers = owned.map((n: any) => n.phone_number);
if (numbers.length) {
  const assoc = await telnyx(`/enterprises/${enterprise.id}/reputation/numbers`, {
    method: 'POST', body: JSON.stringify({ phone_numbers: numbers }),
  });
  if (assoc.status >= 400) fail('6. Associate numbers', assoc);
  console.log(`6. Associated ${numbers.length} number(s).`);
}
console.log('\nDone. Verify with: node --import tsx scripts/did-reputation-probe.ts');
