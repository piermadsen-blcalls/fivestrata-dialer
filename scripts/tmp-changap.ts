// chanGapMs distributions: clean vs +lag arms
import 'dotenv/config';
import { readFileSync } from 'node:fs';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
const calls = readFileSync('C:/Claude/scratch/persona-streetmix-8-15.jsonl', 'utf8').trim().split('\n').map(l => JSON.parse(l)).filter(c => c.ccid);
const arms: Record<string, number[]> = { clean: [], lag: [] };
let flagged = { clean: 0, lag: 0 }, withTicks = { clean: 0, lag: 0 };
for (const c of calls) {
  const rows: any[] = await fetch(`${supabaseUrl}/rest/v1/call_events?select=payload&call_control_id=eq.${encodeURIComponent(c.ccid)}&event_type=eq.aicc.viability&order=id.asc`, { headers: sb }).then(r => r.json());
  const gaps = rows.map(e => e.payload?.chanGapMs).filter((g: any) => typeof g === 'number');
  if (!gaps.length) continue;
  const arm = c.persona.includes('+lag') ? 'lag' : 'clean';
  const med = gaps.sort((a: number, b: number) => a - b)[Math.floor(gaps.length / 2)];
  arms[arm].push(med);
  withTicks[arm]++;
  if (med > 4000) flagged[arm]++;
}
for (const [arm, vals] of Object.entries(arms)) {
  vals.sort((a, b) => a - b);
  const q = (p: number) => vals.length ? Math.round(vals[Math.floor(p * (vals.length - 1))]) : 0;
  console.log(`${arm.padEnd(6)} n=${String(vals.length).padStart(3)}  p25=${q(0.25)}ms  median=${q(0.5)}ms  p75=${q(0.75)}ms  p90=${q(0.9)}ms  | flagged>4s: ${flagged[arm as 'clean'|'lag']}/${withTicks[arm as 'clean'|'lag']}`);
}
