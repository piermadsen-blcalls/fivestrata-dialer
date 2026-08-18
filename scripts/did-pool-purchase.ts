// D3: pool purchase — N scattered singles across area codes, guarded.
// (did-lifecycle.md §1: burn is block-level -> never contiguous blocks; <=1 per
//  NPA-NXX per batch AND never a prefix we already hold.)
//
// Guardrails (extends the did-purchase.ts 8/7 approval pattern):
// - DRY-RUN by default; nothing is bought without --buy
// - per-number hard cap $2.00 upfront+monthly; order abort if any pick exceeds it
// - weekly volume cap from dialer_config 'did_weekly_buy_cap' (default 25):
//   (bought in trailing 7 days) + (this order) must fit under it
// - every purchased number lands in `dids` as status='screening' with batch + tenant
//
// Run: node --import tsx scripts/did-pool-purchase.ts --areacodes 949,714 --count 10 --batch <name> [--tenant fivestrata|autoweb] [--buy]
import 'dotenv/config';

const API = 'https://api.telnyx.com/v2';
const MAX_PER_NUMBER_USD = 2.0;

const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!apiKey || !connectionId || !supabaseUrl || !supabaseKey) {
  console.error('Need TELNYX_API_KEY, TELNYX_CONNECTION_ID, SUPABASE_URL, SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

function argVal(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const areacodes = (argVal('--areacodes') ?? '').split(',').map(s => s.trim()).filter(Boolean);
const count = Number(argVal('--count') ?? 0);
const batch = argVal('--batch') ?? '';
const tenantSlug = argVal('--tenant') ?? 'fivestrata';
const buy = process.argv.includes('--buy');
if (!areacodes.length || !count || !batch) {
  console.error('Usage: --areacodes 949,714 --count N --batch <name> [--tenant slug] [--buy]');
  process.exit(1);
}

const tHeaders = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
const sbGet = async (q: string) => fetch(`${supabaseUrl}/rest/v1/${q}`, { headers: sb }).then(r => r.json());

// --- Guardrail: weekly cap ------------------------------------------------------
const capRow = await sbGet(`dialer_config?select=value&key=eq.did_weekly_buy_cap`);
const weeklyCap = Number(capRow?.[0]?.value ?? 25);
const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
const recent = await sbGet(`dids?select=id&acquired_at=gt.${weekAgo}`);
const recentCount = Array.isArray(recent) ? recent.length : 0;
if (recentCount + count > weeklyCap) {
  console.error(`Weekly cap: ${recentCount} bought in trailing 7d + ${count} requested > cap ${weeklyCap} (dialer_config did_weekly_buy_cap). Aborting.`);
  process.exit(1);
}

// --- Scatter: prefixes we already hold are off-limits ---------------------------
const held = await sbGet(`dids?select=npa_nxx&status=not.eq.retired`);
const heldPrefixes = new Set((held ?? []).map((d: any) => d.npa_nxx).filter(Boolean));

// --- Search each area code, pick <=1 per NPA-NXX --------------------------------
type Pick = { number: string; npaNxx: string; upfront: number; monthly: number; region: string };
const picks: Pick[] = [];
const usedPrefixes = new Set<string>(heldPrefixes);
outer: for (let round = 0; picks.length < count && round < 10; round++) {
  for (const npa of areacodes) {
    if (picks.length >= count) break outer;
    const res = await fetch(
      `${API}/available_phone_numbers?filter[country_code]=US&filter[phone_number_type]=local` +
      `&filter[features][]=voice&filter[national_destination_code]=${npa}&filter[limit]=50`,
      { headers: tHeaders }).then(r => r.json());
    const candidates = (res.data ?? [])
      .map((n: any) => ({
        number: n.phone_number,
        npaNxx: n.phone_number.slice(2, 8),
        upfront: parseFloat(n.cost_information?.upfront_cost ?? 'NaN'),
        monthly: parseFloat(n.cost_information?.monthly_cost ?? 'NaN'),
        region: n.region_information?.find((r: any) => r.region_type === 'state')?.region_name ?? '?',
      }))
      .filter((n: Pick) => Number.isFinite(n.upfront) && Number.isFinite(n.monthly))
      .filter((n: Pick) => n.upfront + n.monthly <= MAX_PER_NUMBER_USD)
      .filter((n: Pick) => !usedPrefixes.has(n.npaNxx) && !picks.some(p => p.number === n.number))
      .sort((a: Pick, b: Pick) => a.upfront + a.monthly - (b.upfront + b.monthly));
    const pick = candidates[0];
    if (pick) { picks.push(pick); usedPrefixes.add(pick.npaNxx); }
  }
}

if (picks.length < count) console.error(`WARNING: only ${picks.length}/${count} candidates satisfy scatter+price constraints in ${areacodes.join(',')}.`);
const totalUpfront = picks.reduce((s, p) => s + p.upfront, 0);
const totalMonthly = picks.reduce((s, p) => s + p.monthly, 0);
console.log(`\nBatch "${batch}" tenant=${tenantSlug} — ${picks.length} scattered singles:`);
for (const p of picks) console.log(`  ${p.number}  prefix=${p.npaNxx}  ${p.region}  $${p.upfront.toFixed(2)} up + $${p.monthly.toFixed(2)}/mo`);
console.log(`Total: $${totalUpfront.toFixed(2)} upfront + $${totalMonthly.toFixed(2)}/mo`);

if (!buy) { console.log('\nDRY RUN — re-run with --buy to purchase.'); process.exit(0); }

// --- Purchase + record -----------------------------------------------------------
const tenant = (await sbGet(`tenants?select=id&slug=eq.${tenantSlug}`))?.[0];
if (!tenant) { console.error(`Unknown tenant slug ${tenantSlug}`); process.exit(1); }

const order = await fetch(`${API}/number_orders`, {
  method: 'POST', headers: tHeaders,
  body: JSON.stringify({ phone_numbers: picks.map(p => ({ phone_number: p.number })), connection_id: connectionId }),
}).then(r => r.json());
if (order.errors) { console.error('Order failed:', JSON.stringify(order.errors).slice(0, 300)); process.exit(1); }
console.log(`\nOrder ${order.data?.id} status=${order.data?.status}`);

const rows = picks.map(p => ({
  phone_number: p.number, status: 'screening', acquisition_batch: batch, tenant_id: tenant.id,
}));
const ins = await fetch(`${supabaseUrl}/rest/v1/dids`, {
  method: 'POST', headers: { ...sb, Prefer: 'return=minimal' }, body: JSON.stringify(rows),
});
console.log(`dids rows inserted: ${ins.status === 201 ? picks.length : `FAILED ${ins.status} ${await ins.text()}`}`);
console.log('\nNext: node --import tsx scripts/did-screen.ts   (screening / deferred passthrough)');
console.log('Then: node --import tsx scripts/did-register.ts   (CNAM + FCR batch file)');
