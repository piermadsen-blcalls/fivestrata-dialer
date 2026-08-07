// Deploy the telnyx-webhook Edge Function + its secret via the Supabase
// Management API — no supabase CLI, no Docker. Reads credentials from
// C:\Claude\supabase-cli-env.sh (export-format, outside the repo); prints
// statuses only, never values.
// Run: npx tsx scripts/deploy-webhook.ts
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_REF = 'wcftuethlcgeasopayed';
const SLUG = 'telnyx-webhook';
const ENV_SCRIPT = 'C:/Claude/supabase-cli-env.sh';
const API = 'https://api.supabase.com/v1';

const envText = readFileSync(ENV_SCRIPT, 'utf8');
const grab = (name: string): string => {
  const m = envText.match(new RegExp(`^export ${name}=(.+)$`, 'm'));
  const v = m?.[1]?.trim().replace(/^["']|["']$/g, '') ?? '';
  if (!v) {
    console.error(`${name} not found in ${ENV_SCRIPT}`);
    process.exit(1);
  }
  return v;
};
const accessToken = grab('SUPABASE_ACCESS_TOKEN');
const telnyxPublicKey = grab('TELNYX_PUBLIC_KEY');

const fnSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'functions', SLUG, 'index.ts'),
  'utf8',
);

async function mgmt(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers ?? {}) },
  });
}

// --- Function: multipart deploy (create-or-update) ---------------------------
const form = new FormData();
form.append(
  'metadata',
  JSON.stringify({ name: SLUG, entrypoint_path: 'index.ts', verify_jwt: false }),
);
form.append('file', new Blob([fnSource], { type: 'application/typescript' }), 'index.ts');
const res = await mgmt(`/projects/${PROJECT_REF}/functions/deploy?slug=${SLUG}`, {
  method: 'POST',
  body: form,
});
console.log(`Function ${SLUG}  DEPLOY -> HTTP ${res.status}`);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
const fn: any = await res.json();
console.log(`  status=${fn.status}  verify_jwt=${fn.verify_jwt}`);

// --- Secret ------------------------------------------------------------------
const sec = await mgmt(`/projects/${PROJECT_REF}/secrets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([{ name: 'TELNYX_PUBLIC_KEY', value: telnyxPublicKey }]),
});
console.log(`Secret TELNYX_PUBLIC_KEY  SET -> HTTP ${sec.status}${sec.ok ? '' : ' ' + (await sec.text())}`);
if (sec.status === 403) {
  console.log(
    '  (org role blocks secret-setting — fine: the function falls back to dialer_config; seed it per migration 0003)',
  );
} else if (!sec.ok) {
  process.exit(1);
}

console.log(`\nEndpoint: https://${PROJECT_REF}.supabase.co/functions/v1/${SLUG}`);
console.log('Verify: unsigned POST should return 400.');
