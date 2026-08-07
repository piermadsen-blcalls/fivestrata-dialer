// Buy ONE test DID for the dialer (roadmap step 2 / first real call) and assign
// it to the fivestrata-dialer Call Control connection.
//
// Guardrails (scope of Sean's 2026-08-07 approval — change require re-approval):
// - exactly one number, local US, voice-capable
// - cheapest of the search results; hard abort if upfront + monthly > $2.00
// - prints number + exact costs; never prints key material
// Run: npx tsx scripts/did-purchase.ts
import 'dotenv/config';

const API = 'https://api.telnyx.com/v2';
const MAX_TOTAL_USD = 2.0;

const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
if (!apiKey) {
  console.error('TELNYX_API_KEY is blank in .env — run scripts/telnyx-check.ts first.');
  process.exit(1);
}
if (!connectionId) {
  console.error('TELNYX_CONNECTION_ID is blank in .env — run scripts/telnyx-setup.ts first.');
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

// --- If the account already owns a number, don't buy another one -------------
const owned = await telnyx('/phone_numbers?page[size]=5');
if ((owned.data ?? []).length > 0) {
  console.log('Account already owns number(s) — not buying another:');
  for (const n of owned.data) console.log(`  ${n.phone_number}  status=${n.status}  connection=${n.connection_id ?? 'none'}`);
  process.exit(0);
}

// --- Search: local US, voice-capable ------------------------------------------
const search = await telnyx(
  '/available_phone_numbers?filter[country_code]=US&filter[phone_number_type]=local&filter[features][]=voice&filter[limit]=25&filter[best_effort]=true',
);
const candidates = (search.data ?? [])
  .map((n: any) => ({
    number: n.phone_number,
    upfront: parseFloat(n.cost_information?.upfront_cost ?? 'NaN'),
    monthly: parseFloat(n.cost_information?.monthly_cost ?? 'NaN'),
    region: `${n.region_information?.find((r: any) => r.region_type === 'state')?.region_name ?? '?'}`,
  }))
  .filter((n: any) => Number.isFinite(n.upfront) && Number.isFinite(n.monthly))
  .sort((a: any, b: any) => a.upfront + a.monthly - (b.upfront + b.monthly));

if (candidates.length === 0) {
  console.error('Search returned no priced candidates — stopping.');
  process.exit(1);
}
const pick = candidates[0];
console.log(`Cheapest candidate: ${pick.number} (${pick.region})  upfront $${pick.upfront.toFixed(2)}  monthly $${pick.monthly.toFixed(2)}`);

if (pick.upfront + pick.monthly > MAX_TOTAL_USD) {
  console.error(`Exceeds the $${MAX_TOTAL_USD.toFixed(2)} approval cap — NOT purchasing.`);
  process.exit(1);
}

// --- Purchase ------------------------------------------------------------------
const order = await telnyx('/number_orders', {
  method: 'POST',
  body: JSON.stringify({
    phone_numbers: [{ phone_number: pick.number }],
    connection_id: connectionId,
  }),
});
const o = order.data;
console.log(`Number order ${o.id}  status=${o.status}`);
for (const pn of o.phone_numbers ?? []) console.log(`  ${pn.phone_number}  status=${pn.status}`);

console.log('\nAdd to .env:');
console.log(`  TELNYX_FROM_NUMBER=${pick.number}`);
console.log('\nNext: public webhook endpoint (IT), then a live test call.');
