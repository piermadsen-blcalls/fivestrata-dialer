// Adds the console's local-dev redirect URLs to the Supabase Auth allowlist
// (uri_allow_list) via the Management API. ADDITIVE: reads the current list and
// appends only what's missing — never removes or rewrites existing entries
// (shared project with V1). Sean-authorized 2026-08-14.
//
// Token: SUPABASE_ACCESS_TOKEN parsed from C:\Claude\supabase-cli-env.sh
// (export format, outside the repo — value never printed), same pattern as
// deploy-webhook.ts.
//
// Run: node scripts/console-auth-allowlist.ts

import { readFileSync } from 'node:fs';

const ENV_SCRIPT = 'C:/Claude/supabase-cli-env.sh';
const PROJECT_REF = 'wcftuethlcgeasopayed';
const WANTED = ['http://127.0.0.1:3100/**', 'http://localhost:3100/**'];

const envText = readFileSync(ENV_SCRIPT, 'utf8');
const grab = (name: string): string => {
  const m = envText.match(new RegExp(`export\\s+${name}=["']?([^"'\\r\\n]+)`));
  if (!m) throw new Error(`${name} not found in ${ENV_SCRIPT}`);
  return m[1].trim();
};
const accessToken = grab('SUPABASE_ACCESS_TOKEN');

async function main() {
  const base = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  const getRes = await fetch(base, { headers });
  if (!getRes.ok) throw new Error(`GET config/auth -> ${getRes.status}`);
  const cfg = (await getRes.json()) as { uri_allow_list?: string | null; site_url?: string };

  const current = (cfg.uri_allow_list ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  console.log('site_url:', cfg.site_url);
  console.log('existing allowlist entries:', current.length);

  const missing = WANTED.filter((u) => !current.includes(u));
  if (missing.length === 0) {
    console.log('OK — console URLs already allowlisted');
    return;
  }

  const patchRes = await fetch(base, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ uri_allow_list: [...current, ...missing].join(',') }),
  });
  if (!patchRes.ok) throw new Error(`PATCH config/auth -> ${patchRes.status}`);
  console.log(`OK — appended: ${missing.join(', ')}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
