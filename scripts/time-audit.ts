// Time-is-money audit (Sean 8/14): grades the self-destruct mechanism.
// Ground truth is the persona: normal/butch = convertible (killing one = FALSE
// POSITIVE, the cardinal sin); talker/confused_elder = time-wasters (early
// exit = TRUE NEGATIVE, measure seconds saved); wishy_washy/curmudgeon =
// context. Also draws the score curves from aicc.viability events.
// Run: npx tsx scripts/time-audit.ts [jsonl=C:/Claude/scratch/persona-timeismoney.jsonl]
import 'dotenv/config';
import { readFileSync } from 'node:fs';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
const LOG = process.argv[2] ?? 'C:/Claude/scratch/persona-timeismoney.jsonl';
const CONVERTIBLE = new Set(['normal', 'butch']);

const calls = readFileSync(LOG, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((c: any) => c.ccid);
console.log(`Auditing ${calls.length} calls ...`);

interface Row {
  persona: string;
  killed: boolean;
  killAgeSec: number | null;
  durationSec: number;
  outcome: string;
  scores: number[];
  judges: string[];
}
const rows: Row[] = [];

for (const c of calls) {
  const evs: any[] = await fetch(
    `${supabaseUrl}/rest/v1/call_events?select=event_type,occurred_at,payload&call_control_id=eq.${encodeURIComponent(c.ccid)}&order=id.asc`,
    { headers: sb },
  ).then((r) => r.json());
  const t0 = evs.find((e) => e.event_type === 'call.initiated')?.occurred_at;
  const t1 = evs.find((e) => e.event_type === 'call.hangup')?.occurred_at;
  const clips = evs.filter((e) => e.event_type === 'call.playback.started').map((e) => e.payload?.media_name);
  const kill = evs.find((e) => e.event_type === 'aicc.viability' && e.payload?.action === 'self_destruct');
  const outcome =
    clips.find((m: string) => ['resp_compliance', 'resp_interested', 'resp_not_interested', 'cv_resp_unclear', 'exit_disengage'].includes(m)) ?? 'none';
  rows.push({
    persona: c.persona,
    killed: clips.includes('exit_disengage'),
    killAgeSec: kill?.payload?.ageSec ?? null,
    durationSec: t0 && t1 ? Math.round((new Date(t1).getTime() - new Date(t0).getTime()) / 1000) : 0,
    outcome,
    scores: evs.filter((e) => e.event_type === 'aicc.viability' && typeof e.payload?.score === 'number').map((e) => e.payload.score),
    judges: evs.filter((e) => e.event_type === 'aicc.viability' && e.payload?.judge).map((e) => String(e.payload.judge)),
  });
}

console.log('\n=== PER PERSONA ===');
const personas = [...new Set(rows.map((r) => r.persona))];
for (const p of personas) {
  const rs = rows.filter((r) => r.persona === p);
  const killed = rs.filter((r) => r.killed);
  const kept = rs.filter((r) => !r.killed);
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
  console.log(
    `${p.padEnd(16)} n=${rs.length}  killed=${killed.length}${CONVERTIBLE.has(p) && killed.length ? '  *** FALSE POSITIVES ***' : ''}  ` +
      `avgDur kept=${avg(kept.map((r) => r.durationSec))}s killed=${avg(killed.map((r) => r.durationSec))}s  avgKillAge=${avg(killed.map((r) => r.killAgeSec ?? 0))}s`,
  );
  const oc: Record<string, number> = {};
  for (const r of rs) oc[r.outcome] = (oc[r.outcome] ?? 0) + 1;
  console.log(`  outcomes: ${Object.entries(oc).map(([k, v]) => `${k}:${v}`).join('  ')}`);
}

console.log('\n=== FALSE POSITIVE DETAIL (convertible personas killed) ===');
for (const r of rows.filter((x) => CONVERTIBLE.has(x.persona) && x.killed)) {
  console.log(`${r.persona} killed at ${r.killAgeSec}s — scores seen: [${r.scores.join(',')}] judges: [${r.judges.join(',')}]`);
}

console.log('\n=== TIME ECONOMICS ===');
const wasters = rows.filter((r) => ['talker', 'confused_elder'].includes(r.persona));
const wKilled = wasters.filter((r) => r.killed);
const wKept = wasters.filter((r) => !r.killed);
const avgN = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
console.log(`time-wasters killed: ${wKilled.length}/${wasters.length}`);
console.log(`avg duration — killed: ${avgN(wKilled.map((r) => r.durationSec)).toFixed(0)}s vs kept: ${avgN(wKept.map((r) => r.durationSec)).toFixed(0)}s`);
console.log(`seconds saved per killed call vs kept baseline: ${(avgN(wKept.map((r) => r.durationSec)) - avgN(wKilled.map((r) => r.durationSec))).toFixed(0)}s`);
console.log('\n=== SCORE CURVES (avg score by tick index, per persona) ===');
for (const p of personas) {
  const rs = rows.filter((r) => r.persona === p && r.scores.length);
  const maxTicks = Math.max(0, ...rs.map((r) => r.scores.length));
  const curve: string[] = [];
  for (let i = 0; i < maxTicks; i++) {
    const vals = rs.map((r) => r.scores[i]).filter((v) => v !== undefined);
    if (vals.length) curve.push(String(Math.round(vals.reduce((x, y) => x + y, 0) / vals.length)));
  }
  console.log(`${p.padEnd(16)} ${curve.join(' -> ')}`);
}
