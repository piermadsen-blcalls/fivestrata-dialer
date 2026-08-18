// The long-tail flywheel (Sean 8/17): live-TTS renders are logged per turn
// (aicc.tts_render); this OVERNIGHT pass clusters them and recommends new
// canned clips — every render class that recurs becomes a pre-rendered clip
// the next day, so the TTS share (and its per-call cost + seam) shrinks while
// coverage grows. Runs locally against call_events today; the same logic
// moves to Snowflake once the FIVESTRATADIALER schema lands (the events
// already ride snowflake-sync.ts).
// Run: node --import tsx scripts/tts-distill.ts [sinceDays=1]
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const JUDGE_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const apiKey = process.env.TELNYX_API_KEY ?? '';
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
const sinceDays = Number(process.argv[2] ?? 1);
const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();

const renders: any[] = [];
for (let off = 0; ; off += 1000) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/call_events?select=occurred_at,payload&event_type=eq.aicc.tts_render&occurred_at=gte.${since}&order=id.asc&limit=1000&offset=${off}`,
    { headers: sb },
  );
  const rows: any[] = await res.json();
  renders.push(...rows);
  if (rows.length < 1000) break;
}
const ok = renders.filter((r) => r.payload?.ok && r.payload?.text);
const skipped = renders.filter((r) => r.payload?.skipped);
console.log(`Since ${since.slice(0, 10)}: ${renders.length} tts_render events — ${ok.length} rendered, ${skipped.length} skipped (${skipped.filter((s) => s.payload.skipped === 'cap').length} cap, ${skipped.filter((s) => s.payload.skipped === 'compose_failed').length} compose-fail).`);
if (!ok.length) {
  console.log('Nothing to distill.');
  process.exit(0);
}

const sample = ok.slice(-200).map((r, i) => `${i + 1}. [${r.payload.kind}] caller: "${(r.payload.callerSaid ?? '').slice(-120)}" -> claire: "${r.payload.text}"`).join('\n');
const res = await fetch(`${TELNYX}/ai/chat/completions`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: JUDGE_MODEL,
    max_tokens: 1200,
    messages: [
      {
        role: 'system',
        content:
          'You optimize a soundboard call agent. Below are live-TTS lines the agent had to compose because no pre-recorded clip fit, each with what the caller said. CLUSTER them by the reusable situation they answer (not exact wording). For each cluster with 2+ occurrences, output:\nCLIP <snake_case_name> (~<count>x): <one polished, reusable clip text in the same warm register, ending with "Want me to set that up? A quick yes or no is perfect." if the originals were answers, or a warm close if they were goodbyes>\nThen a final line: SINGLETONS: <count> (leave as live TTS).\nPolished texts must contain no digits, prices, or percentages. Reusable means it works verbatim for every caller in the cluster.',
      },
      { role: 'user', content: sample },
    ],
  }),
});
const body: any = await res.json().catch(() => ({}));
console.log('\n=== OVERNIGHT DISTILL — recommended canned clips ===\n');
console.log(body?.choices?.[0]?.message?.content ?? '(judge returned nothing)');
console.log('\nNext: review, add keepers to scripts/gen-clips.ts CLIPS, run gen-clips + clips-upload, and wire selection where the render fired.');
