// Row counts for the sync-relevant Supabase tables — counts only, no data.
// Run: npx tsx scripts/supabase-counts.ts
import 'dotenv/config';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: 'env.template' });

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SECRET_KEY ?? '',
);

for (const table of ['leads', 'calls', 'call_turns', 'call_events']) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  console.log(`${table.padEnd(12)} ${error ? `FAIL ${error.message}` : `${count} rows`}`);
}
