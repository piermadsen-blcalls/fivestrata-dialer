// Apply a SQL file (or -e "inline sql") to the shared Supabase project via the
// Management API database/query endpoint — removes the Sean-manual dashboard
// paste for additive migrations, if the org role allows it (secret-setting
// 403s; this endpoint may not). Reads SUPABASE_ACCESS_TOKEN from
// C:\Claude\supabase-cli-env.sh (outside the repo); prints statuses and result
// rows only, never credentials.
//
// SHARED-WITH-V1 PROJECT: additive statements only; never touch V1 objects.
//
// Run: npx tsx scripts/db-apply.ts supabase/migrations/0004_inbound_intake.sql
//      npx tsx scripts/db-apply.ts -e "select 1 as probe"
import { readFileSync } from 'node:fs';

const PROJECT_REF = 'wcftuethlcgeasopayed';
const ENV_SCRIPT = 'C:/Claude/supabase-cli-env.sh';

const arg = process.argv[2];
if (!arg) {
  console.error('usage: db-apply.ts <file.sql> | -e "sql"');
  process.exit(1);
}
const sql = arg === '-e' ? (process.argv[3] ?? '') : readFileSync(arg, 'utf8');
if (!sql.trim()) {
  console.error('empty sql');
  process.exit(1);
}

const envText = readFileSync(ENV_SCRIPT, 'utf8');
const m = envText.match(/^export SUPABASE_ACCESS_TOKEN=(.+)$/m);
const token = m?.[1]?.trim().replace(/^["']|["']$/g, '') ?? '';
if (!token) {
  console.error(`SUPABASE_ACCESS_TOKEN not found in ${ENV_SCRIPT}`);
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
console.log(`database/query -> HTTP ${res.status}`);
const text = await res.text();
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2).slice(0, 4000));
} catch {
  console.log(text.slice(0, 4000));
}
// process.exit() right after fetch trips a libuv teardown assertion on
// Windows Node 24 — set exitCode and let the loop drain instead.
process.exitCode = res.ok ? 0 : 1;
