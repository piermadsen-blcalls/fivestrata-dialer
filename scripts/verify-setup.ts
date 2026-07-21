/**
 * Setup verification: confirms the Supabase schema objects exist and are
 * reachable with the configured key. Read-only. Run: npx tsx scripts/verify-setup.ts
 */
import { supabase } from '../src/clients/supabase.js';

const tables = [
  'leads',
  'clients',
  'transfer_priorities',
  'scripts',
  'voice_packs',
  'voice_clips',
  'dids',
  'calls',
  'call_turns',
  'call_events',
];
const views = ['v_daily_results', 'v_rdaily', 'v_rlist'];

let failures = 0;
for (const name of [...tables, ...views]) {
  // NOTE: head:true requests return no error for nonexistent tables (learned
  // the hard way) — a real GET with limit 0 surfaces the missing-table error.
  const { error } = await supabase.from(name).select('*').limit(0);
  if (error) {
    failures++;
    console.log(`MISSING  ${name}  (${error.message})`);
  } else {
    console.log(`ok       ${name}`);
  }
}

console.log(failures === 0 ? '\nALL OBJECTS PRESENT' : `\n${failures} OBJECT(S) MISSING`);
process.exit(failures === 0 ? 0 : 1);
