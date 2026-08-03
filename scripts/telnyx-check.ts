// Verify Telnyx credentials in .env without ever printing them.
// - TELNYX_API_KEY: calls the balance endpoint (auth check + shows account balance)
// - TELNYX_PUBLIC_KEY: checks it decodes to a 32-byte Ed25519 key
// Run: npx tsx scripts/telnyx-check.ts
import 'dotenv/config';

const apiKey = process.env.TELNYX_API_KEY ?? '';
const publicKey = process.env.TELNYX_PUBLIC_KEY ?? '';

let failed = false;

if (!apiKey) {
  console.log('TELNYX_API_KEY      FAIL  (blank in .env)');
  failed = true;
} else {
  const res = await fetch('https://api.telnyx.com/v2/balance', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.ok) {
    const { data } = (await res.json()) as {
      data: { balance: string; currency: string; credit_limit: string };
    };
    console.log(
      `TELNYX_API_KEY      OK    balance ${data.balance} ${data.currency}` +
        (Number(data.credit_limit) ? `, credit limit ${data.credit_limit}` : ''),
    );
  } else {
    console.log(`TELNYX_API_KEY      FAIL  (HTTP ${res.status} from balance endpoint)`);
    failed = true;
  }
}

if (!publicKey) {
  console.log('TELNYX_PUBLIC_KEY   FAIL  (blank in .env)');
  failed = true;
} else {
  const bytes = Buffer.from(publicKey, 'base64');
  if (bytes.length === 32) {
    console.log('TELNYX_PUBLIC_KEY   OK    decodes to 32-byte Ed25519 key');
  } else {
    console.log(
      `TELNYX_PUBLIC_KEY   FAIL  (decodes to ${bytes.length} bytes, expected 32 — copied the right value?)`,
    );
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
