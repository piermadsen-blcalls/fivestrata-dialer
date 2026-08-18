// D1 recon: read-only probe of the Telnyx Number Reputation surface on THIS account.
// GET-only by design — enabling the product requires ToS acceptance + a signed LOA
// (Sean's click, never automated). Never prints key material.
// Run: node --import tsx scripts/did-reputation-probe.ts
import 'dotenv/config';

const API = 'https://api.telnyx.com/v2';
const apiKey = process.env.TELNYX_API_KEY ?? '';
if (!apiKey) {
  console.error('TELNYX_API_KEY is blank in .env');
  process.exit(1);
}
const headers = { Authorization: `Bearer ${apiKey}` };

async function probe(path: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${API}${path}`, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

// 1. Does the account have an enterprise (prereq for reputation)?
const ent = await probe('/enterprises');
console.log(`GET /enterprises -> ${ent.status}`);
const enterprises = ent.body?.data ?? [];
if (enterprises.length === 0) {
  console.log('  No enterprise on the account — Number Reputation is NOT enabled yet.');
  console.log('  Enablement path (Sean, one-time): agree ToS -> create enterprise ->');
  console.log('  upload signed LOA -> POST /enterprises/{id}/reputation (Hiya vetting, ~minutes).');
} else {
  for (const e of enterprises) {
    console.log(`  enterprise ${e.id}  name=${e.name ?? '?'}  status=${e.status ?? '?'}`);
    const rep = await probe(`/enterprises/${e.id}/reputation`);
    console.log(`  GET .../reputation -> ${rep.status} ${JSON.stringify(rep.body?.data ?? rep.body?.errors?.[0]?.title ?? {}).slice(0, 200)}`);
    const nums = await probe(`/enterprises/${e.id}/reputation/numbers`);
    console.log(`  GET .../reputation/numbers -> ${nums.status}`);
    for (const n of nums.body?.data ?? []) {
      const r = n.reputation_data ?? {};
      console.log(`    ${n.phone_number}  spam_risk=${r.spam_risk ?? '?'}  category=${r.spam_category ?? '-'}  scores m/c/e/s=${r.maturity_score ?? '-'}/${r.connection_score ?? '-'}/${r.engagement_score ?? '-'}/${r.sentiment_score ?? '-'}`);
    }
  }
}

// 2. Number Lookup (separate product, works on ANY number incl. pre-purchase candidates):
//    carrier + line-type only — no spam labels, but useful as a cheap pre-buy sanity layer.
const owned = await probe('/phone_numbers?page[size]=1');
const testDid = owned.body?.data?.[0]?.phone_number;
if (testDid) {
  const lu = await probe(`/number_lookup/${encodeURIComponent(testDid)}?type=carrier`);
  console.log(`\nGET /number_lookup/${testDid.slice(0, 5)}*** (carrier) -> ${lu.status}`);
  const d = lu.body?.data ?? {};
  console.log(`  carrier=${d.carrier?.name ?? '?'}  line_type=${d.carrier?.type ?? '?'}`);
}
