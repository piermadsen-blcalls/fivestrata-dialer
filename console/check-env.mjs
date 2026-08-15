// Validates console/.env.local shape. Prints OK/FAIL only — NEVER values.
// Run from console/: node check-env.mjs
import { readFileSync } from 'node:fs';

const EXPECTED_URL = 'https://wcftuethlcgeasopayed.supabase.co';

let text;
try {
  text = readFileSync(new URL('./.env.local', import.meta.url), 'utf8');
} catch {
  console.log('FAIL: console/.env.local not found');
  process.exit(1);
}

const vars = {};
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const checks = [
  ['SUPABASE_URL', (v) => v === EXPECTED_URL, `must be ${EXPECTED_URL}`],
  ['SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY',
    () => (vars.SUPABASE_SERVICE_ROLE_KEY ?? vars.SUPABASE_SECRET_KEY ?? '').startsWith('sb_secret_'),
    'must start with sb_secret_'],
  ['NEXT_PUBLIC_SUPABASE_URL', (v) => v === EXPECTED_URL, `must be ${EXPECTED_URL}`],
  ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', (v) => (v ?? '').startsWith('sb_publishable_'),
    'must start with sb_publishable_ (NOT sb_secret_ — never put the secret key in a NEXT_PUBLIC var)'],
];

let ok = true;
for (const [name, test, hint] of checks) {
  const v = vars[name];
  const pass = test(v);
  console.log(`${pass ? 'OK  ' : 'FAIL'} ${name}${pass ? '' : ` — ${hint}`}`);
  if (!pass) ok = false;
}
if (vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_secret_')) {
  console.log('DANGER: secret key found in a NEXT_PUBLIC var — remove it immediately');
  ok = false;
}
console.log(ok ? '\nAll good — restart the dev server.' : '\nFix the FAIL lines and rerun.');
