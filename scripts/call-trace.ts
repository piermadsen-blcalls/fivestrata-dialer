// Call-timeline autopsy: full clip/transcript/viability timeline for the
// cv_resp_unclear (failed) calls of one persona in a battery log. Built for
// the 8/15 Maria-dip autopsy; keep — it's the fastest way to SEE a failure.
// Run: node --import tsx scripts/call-trace.ts [jsonl] [persona=normal] [maxCalls=4]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
const LOG = process.argv[2] ?? 'C:/Claude/scratch/persona-timeismoney.jsonl';
const PERSONA = process.argv[3] ?? 'normal';
const LIMIT = Number(process.argv[4] ?? 4);

const calls = readFileSync(LOG, 'utf8').trim().split('\n').map(l => JSON.parse(l))
  .filter(c => c.ccid && c.persona === PERSONA);

let shown = 0;
for (const c of calls) {
  const rows: any[] = await fetch(
    `${supabaseUrl}/rest/v1/call_events?select=event_type,occurred_at,payload&call_control_id=eq.${encodeURIComponent(c.ccid)}&order=id.asc`,
    { headers: sb }).then(r => r.json());
  const clips = rows.filter(e => e.event_type === 'call.playback.started').map(e => e.payload?.media_name);
  if (!clips.includes('cv_resp_unclear')) continue;
  if (++shown > LIMIT) { console.log('... (more failed calls omitted)'); break; }
  console.log(`\n########## call n=${c.n} session=${c.session?.slice(0,8)} ##########`);
  const t0 = new Date(rows[0]?.occurred_at ?? 0).getTime();
  for (const e of rows) {
    const ts = ((new Date(e.occurred_at).getTime() - t0) / 1000).toFixed(1).padStart(6);
    if (e.event_type === 'call.playback.started') console.log(`${ts}s  ▶ CLIP ${e.payload?.media_name}`);
    else if (e.event_type === 'call.playback.ended' && e.payload?.status === 'cancelled') console.log(`${ts}s  ■ CLIP CANCELLED`);
    else if (e.event_type === 'call.transcription') {
      const d = e.payload?.transcription_data ?? {};
      const fin = d.is_final !== false ? 'FINAL  ' : 'interim';
      const t = (d.transcript ?? '').trim();
      if (t) console.log(`${ts}s    ${fin} sf=${d.speech_final} "${t}"`);
    } else if (e.event_type === 'aicc.viability') {
      console.log(`${ts}s    · viability score=${e.payload?.score ?? e.payload?.p_convert ?? JSON.stringify(e.payload).slice(0,80)}`);
    } else if (e.event_type === 'call.hangup') console.log(`${ts}s  ✕ HANGUP`);
  }
}
console.log(`\n(${shown} failed ${PERSONA} calls shown of limit ${LIMIT})`);
