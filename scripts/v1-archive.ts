/**
 * V1 asset archive (NON-PII only): structure spec + config tables + the
 * aggregate daily summary, exported to C:\Claude\v1-archive.
 *
 * PII-bearing tables (dial_queue, call_log, retell_*) are deliberately NOT
 * exported here — those are covered by the full project backup Sean downloads
 * from the Supabase dashboard (which also captures function DDL and enums).
 *
 * Run:  source /c/Claude/v1-supabase-env.sh && tsx scripts/v1-archive.ts
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';

const url = process.env.V1_SUPABASE_URL;
const key = process.env.V1_SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('source /c/Claude/v1-supabase-env.sh first');

const headers = { apikey: key, authorization: `Bearer ${key}` };
const outDir = 'C:\\Claude\\v1-archive';
mkdirSync(outDir, { recursive: true });

const spec = await (await fetch(`${url}/rest/v1/`, { headers })).json();
writeFileSync(`${outDir}\\openapi-structure.json`, JSON.stringify(spec, null, 1));
console.log('wrote openapi-structure.json');

// config + aggregate objects only — no lead rows, no transcripts
const tables = ['agent_routing', 'system_flags', 'zip_allowlist', 'v_daily_call_summary'];

const PAGE = 1000;
for (const table of tables) {
  const rows: unknown[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=${PAGE}&offset=${offset}`, { headers });
    if (!res.ok) {
      console.log(`  ${table}: ERROR ${res.status}`);
      break;
    }
    const batch = (await res.json()) as unknown[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  const file = `${outDir}\\${table}.jsonl`;
  writeFileSync(file, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
  console.log(`  ${table}: ${rows.length} rows, ${(statSync(file).size / 1024).toFixed(0)} KB`);
}
console.log('\nNON-PII ARCHIVE COMPLETE ->', outDir);
