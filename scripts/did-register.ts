// D6: registration batch — per-tenant CNAM (D8b: yes, Sean 8/17) + FCR handoff file.
// - CNAM: tenants.cnam (FIVESTRATA / AUTOWEB), 15-char cap, via Telnyx voice settings;
//   sets dids.registered_cnam + dids.cnam. Idempotent — skips already-registered.
// - FCR (Free Caller Registry) has no API: writes a paste-ready batch file for Sean's
//   web-form session at C:\Claude\scratch\fcr-batch-<date>.txt; after the session,
//   re-run with --mark-fcr to record completion.
//
// Run: node --import tsx scripts/did-register.ts [--mark-fcr]
import 'dotenv/config';
import { writeFileSync } from 'node:fs';

const API = 'https://api.telnyx.com/v2';
const apiKey = process.env.TELNYX_API_KEY ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!apiKey || !supabaseUrl || !supabaseKey) { console.error('Need TELNYX_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY in .env'); process.exit(1); }

const tHeaders = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
const sbGet = async (q: string) => fetch(`${supabaseUrl}/rest/v1/${q}`, { headers: sb }).then(r => r.json());
const patch = async (id: string, body: any) =>
  fetch(`${supabaseUrl}/rest/v1/dids?id=eq.${id}`, { method: 'PATCH', headers: { ...sb, Prefer: 'return=minimal' }, body: JSON.stringify(body) });

if (process.argv.includes('--mark-fcr')) {
  const pending: any[] = (await sbGet(`dids?select=id,phone_number&registered_fcr=eq.false&status=not.in.(retired,quarantined)`))
    .filter((d: any) => !d.phone_number.startsWith('+1555'));
  for (const d of pending) await patch(d.id, { registered_fcr: true });
  console.log(`Marked ${pending.length} DID(s) registered_fcr=true (Sean confirmed the FCR session).`);
  process.exit(0);
}

// Tenant CNAM map (default from dialer_config if a DID has no tenant)
const tenants: any[] = await sbGet(`tenants?select=id,slug,cnam`);
const cnamByTenant = new Map(tenants.map(t => [t.id, (t.cnam ?? '').toUpperCase().slice(0, 15)]));
const defRow = await sbGet(`dialer_config?select=value&key=eq.cnam_default`);
const defaultCnam = (defRow?.[0]?.value ?? 'FIVESTRATA').toUpperCase().slice(0, 15);

// Scope: live, un-CNAMed DIDs (555* = demo rows per working agreements — never registered)
const isDemo = (p: string) => p.startsWith('+1555');
const dids: any[] = (await sbGet(`dids?select=id,phone_number,tenant_id,registered_cnam,registered_fcr&status=in.(screening,warming,active)&registered_cnam=eq.false`))
  .filter((d: any) => !isDemo(d.phone_number));
console.log(`${dids.length} DID(s) pending CNAM registration.`);

// Telnyx number-id lookup by phone number
for (const d of dids) {
  const name = cnamByTenant.get(d.tenant_id) || defaultCnam;
  const found = await fetch(`${API}/phone_numbers?filter[phone_number]=${encodeURIComponent(d.phone_number)}`, { headers: tHeaders }).then(r => r.json());
  const num = found?.data?.[0];
  if (!num) { console.error(`  ***${d.phone_number.slice(-4)}  not found on Telnyx account — skipped`); continue; }
  const res = await fetch(`${API}/phone_numbers/${num.id}/voice`, {
    method: 'PATCH', headers: tHeaders,
    body: JSON.stringify({ cnam_listing: { cnam_listing_enabled: true, cnam_listing_details: name } }),
  });
  if (res.ok) {
    await patch(d.id, { registered_cnam: true, cnam: name });
    console.log(`  ***${d.phone_number.slice(-4)}  CNAM=${name}  OK`);
  } else {
    const e = (await res.json().catch(() => ({})))?.errors?.[0];
    console.error(`  ***${d.phone_number.slice(-4)}  CNAM FAILED ${res.status} ${e?.title ?? ''} ${e?.detail ?? ''}`);
  }
}

// FCR batch file (numbers pending FCR, incl. ones CNAMed just now)
const fcrPending: any[] = (await sbGet(`dids?select=phone_number&registered_fcr=eq.false&status=in.(screening,warming,active)`))
  .filter((d: any) => !isDemo(d.phone_number));
if (fcrPending.length) {
  const stamp = new Date().toISOString().slice(0, 10);
  const path = `C:/Claude/scratch/fcr-batch-${stamp}.txt`;
  writeFileSync(path, [
    'Free Caller Registry batch — paste into https://www.freecallerregistry.com/fcr/',
    'Covers First Orion (T-Mobile), TNS (Verizon), Hiya (AT&T). One session, all three.',
    'After submitting, run: node --import tsx scripts/did-register.ts --mark-fcr',
    '',
    ...fcrPending.map((d: any) => d.phone_number),
  ].join('\n'));
  console.log(`\nFCR batch file (${fcrPending.length} numbers): ${path}`);
} else {
  console.log('\nNo DIDs pending FCR.');
}
