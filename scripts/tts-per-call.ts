// Per-call rendering census for today's Windows batteries: for each battery
// call (Claire's outbound leg), count canned clips fired (playback.started)
// and LIVE TTS renders (call.speak.*) — on Claire's leg these should be ZERO
// by construction (the demo agent is fully canned; speak is only used by the
// persona rig's inbound leg). The persona leg is matched by its incoming
// call.initiated falling inside the battery call's window.
// Run: node --import tsx scripts/tts-per-call.ts <log1.jsonl> [log2.jsonl ...]
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const sb = { apikey: key, Authorization: `Bearer ${key}` };

interface Row { event_type: string; call_control_id: string; occurred_at: string; payload: any }

async function page(filter: string, select: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let off = 0; ; off += 1000) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/call_events?select=${select}&${filter}&order=id.asc&limit=1000&offset=${off}`,
      { headers: sb },
    );
    const rows: Row[] = await res.json();
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

// Battery calls, in chronological order across all provided logs.
const calls: Array<{ n: number; persona: string; ccid: string; started: string; ended: string; battery: string }> = [];
for (const path of process.argv.slice(2)) {
  const battery = path.replace(/^.*persona-|\.jsonl$/g, '');
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    const c = JSON.parse(line);
    if (c.ccid) calls.push({ n: 0, persona: c.persona, ccid: c.ccid, started: c.started, ended: c.ended, battery });
  }
}
calls.sort((a, b) => a.started.localeCompare(b.started));
calls.forEach((c, i) => (c.n = i + 1));
const dayStart = calls[0].started.slice(0, 10);

console.error(`Fetching events for ${calls.length} calls (${dayStart})...`);
const playbacks = await page(`event_type=eq.call.playback.started&occurred_at=gte.${dayStart}`, 'event_type,call_control_id,occurred_at');
const speaks = await page(`event_type=in.(call.speak.started,call.speak.ended)&occurred_at=gte.${dayStart}`, 'event_type,call_control_id,occurred_at');
const incoming = await page(`event_type=eq.call.initiated&occurred_at=gte.${dayStart}&payload->>direction=eq.incoming`, 'event_type,call_control_id,occurred_at');

const count = (rows: Row[], type?: string) => {
  const m = new Map<string, number>();
  for (const r of rows) if (!type || r.event_type === type) m.set(r.call_control_id, (m.get(r.call_control_id) ?? 0) + 1);
  return m;
};
const playbackBy = count(playbacks);
const speakStartBy = count(speaks, 'call.speak.started');

const results = calls.map((c) => {
  // Persona leg = the incoming call initiated inside this call's window.
  const t0 = new Date(c.started).getTime() - 2000;
  const t1 = new Date(c.ended).getTime() + 2000;
  const leg = incoming.find((e) => {
    const t = new Date(e.occurred_at).getTime();
    return t >= t0 && t <= t1;
  });
  return {
    n: c.n,
    battery: c.battery,
    persona: c.persona,
    clipsCanned: playbackBy.get(c.ccid) ?? 0,
    ttsClaireLeg: speakStartBy.get(c.ccid) ?? 0,
    ttsPersonaLeg: leg ? speakStartBy.get(leg.call_control_id) ?? 0 : null,
  };
});

const zeroClaire = results.every((r) => r.ttsClaireLeg === 0);
console.error(`Claire-leg live TTS across all ${results.length} calls: ${zeroClaire ? 'ZERO everywhere (confirmed canned-only)' : 'NONZERO FOUND'}`);
console.error(`speak events total (persona rig): ${speaks.filter((s) => s.event_type === 'call.speak.started').length}`);
writeFileSync('C:/Claude/scratch/tts-per-call-8-17.json', JSON.stringify(results));
console.error('Wrote C:/Claude/scratch/tts-per-call-8-17.json');
