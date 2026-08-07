// Enable CNAM listing (outbound caller name) on all owned DIDs — first lever
// of DID reputation management (open-questions 8/7 finding: fresh DIDs start
// spam-labeled). CNAM display is carrier-dependent but costs nothing to list.
// Run: npx tsx scripts/did-cnam.ts [name<=15chars, default FIVESTRATA]
import 'dotenv/config';

const API = 'https://api.telnyx.com/v2';
const apiKey = process.env.TELNYX_API_KEY ?? '';
if (!apiKey) {
  console.error('TELNYX_API_KEY is blank in .env.');
  process.exit(1);
}
const cnamName = (process.argv[2] ?? 'FIVESTRATA').toUpperCase().slice(0, 15);
const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

const owned = await (await fetch(`${API}/phone_numbers`, { headers })).json();
for (const n of owned.data ?? []) {
  const res = await fetch(`${API}/phone_numbers/${n.id}/voice`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      cnam_listing: { cnam_listing_enabled: true, cnam_listing_details: cnamName },
    }),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body?.errors?.[0];
    console.error(`${n.phone_number}  FAILED ${res.status} ${e?.code ?? ''} ${e?.title ?? ''} ${e?.detail ?? ''}`);
  } else {
    const c = body.data?.cnam_listing ?? {};
    console.log(`${n.phone_number}  CNAM listing: enabled=${c.cnam_listing_enabled} details=${c.cnam_listing_details}`);
  }
}
