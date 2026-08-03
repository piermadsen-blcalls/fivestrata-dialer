// Verify Telnyx credentials in .env without ever printing them.
// - TELNYX_API_KEY: calls the balance endpoint (auth check + shows account balance)
// - TELNYX_PUBLIC_KEY: checks it decodes to a 32-byte Ed25519 key
// Run: npx tsx scripts/telnyx-check.ts
import 'dotenv/config';

const apiKey = process.env.TELNYX_API_KEY ?? '';
const publicKey = process.env.TELNYX_PUBLIC_KEY ?? '';

let failed = false;

// Telnyx error bodies carry code/title/detail — never the key; safe to print.
async function telnyxError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      errors?: Array<{ code?: string; title?: string; detail?: string }>;
    };
    const e = body.errors?.[0];
    return e ? `${e.code ?? ''} ${e.title ?? ''}${e.detail ? ` — ${e.detail}` : ''}`.trim() : '';
  } catch {
    return '';
  }
}

if (!apiKey) {
  console.log('TELNYX_API_KEY      FAIL  (blank in .env)');
  failed = true;
} else {
  const auth = { Authorization: `Bearer ${apiKey}` };
  const bal = await fetch('https://api.telnyx.com/v2/balance', { headers: auth });
  if (bal.ok) {
    const { data } = (await bal.json()) as {
      data: { balance: string; currency: string; credit_limit: string };
    };
    console.log(
      `TELNYX_API_KEY      OK    balance ${data.balance} ${data.currency}` +
        (Number(data.credit_limit) ? `, credit limit ${data.credit_limit}` : ''),
    );
  } else {
    // 403 on balance can just mean no billing-read permission — try an
    // endpoint every valid key can hit before declaring the key dead.
    const balErr = await telnyxError(bal);
    const nums = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=1', {
      headers: auth,
    });
    if (nums.ok) {
      const { meta } = (await nums.json()) as { meta: { total_results: number } };
      console.log(
        `TELNYX_API_KEY      OK    (key valid; no billing-read permission — balance hidden). ` +
          `Account owns ${meta.total_results} phone number(s).`,
      );
    } else {
      const numErr = await telnyxError(nums);
      console.log(
        `TELNYX_API_KEY      FAIL  balance: HTTP ${bal.status} ${balErr} | phone_numbers: HTTP ${nums.status} ${numErr}`,
      );
      failed = true;
    }
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
