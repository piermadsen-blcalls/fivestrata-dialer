// Mint + seed the inbound API key for the fivestrata-inbound Edge Function.
// (Sean-approved 2026-08-14.) The key value lives in
// C:\Claude\aicc-inbound-env.sh (outside all repos, like the other *-env.sh
// credential files) and is NEVER printed.
//
// Seeding order: try the Management-API function secret INBOUND_API_KEY first;
// on 403 (Sean's org role), fall back to dialer_config key 'inbound_api_key'
// via the database/query endpoint (documented exception in migration 0004).
// Rotation = delete the env file, re-run this, re-run inbound-test.
//
// Run: npx tsx scripts/inbound-key-seed.ts   (or: node scripts/inbound-key-seed.ts)
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const PROJECT_REF = 'wcftuethlcgeasopayed';
const KEY_FILE = 'C:/Claude/aicc-inbound-env.sh';
const TOKEN_FILE = 'C:/Claude/supabase-cli-env.sh';
const API = 'https://api.supabase.com/v1';

if (!existsSync(KEY_FILE)) {
  const fresh = randomBytes(32).toString('hex');
  writeFileSync(KEY_FILE, `export AICC_INBOUND_API_KEY=${fresh}\n`, { encoding: 'utf8' });
  console.log(`Generated new key -> ${KEY_FILE}`);
} else {
  console.log(`Using existing key from ${KEY_FILE}`);
}
const key = readFileSync(KEY_FILE, 'utf8').match(/^export AICC_INBOUND_API_KEY=(.+)$/m)?.[1]?.trim() ?? '';
if (!/^[0-9a-f]{64}$/.test(key)) {
  console.error('key file malformed (expected 64 hex chars)');
  process.exitCode = 1;
} else {
  const token =
    readFileSync(TOKEN_FILE, 'utf8').match(/^export SUPABASE_ACCESS_TOKEN=(.+)$/m)?.[1]?.trim() ?? '';
  if (!token) {
    console.error(`SUPABASE_ACCESS_TOKEN not found in ${TOKEN_FILE}`);
    process.exitCode = 1;
  } else {
    const sec = await fetch(`${API}/projects/${PROJECT_REF}/secrets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ name: 'INBOUND_API_KEY', value: key }]),
    });
    console.log(`Secret INBOUND_API_KEY SET -> HTTP ${sec.status}`);
    if (sec.ok) {
      console.log('Function secret set; dialer_config fallback not needed.');
    } else {
      // Key is hex-only — safe to embed in a SQL literal.
      const sql = `insert into dialer_config (key, value) values ('inbound_api_key', '${key}')
                   on conflict (key) do update set value = excluded.value, updated_at = now()`;
      const res = await fetch(`${API}/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      });
      console.log(`dialer_config seed -> HTTP ${res.status}${res.ok ? '' : ' ' + (await res.text()).slice(0, 300)}`);
      process.exitCode = res.ok ? 0 : 1;
    }
  }
}
