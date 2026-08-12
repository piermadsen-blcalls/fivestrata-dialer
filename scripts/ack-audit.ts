// Ack-fidelity audit (Sean 8/11): offline, a BIG slow LLM (Llama-3.3-70B)
// grades every (caller utterance -> ack clip) pair from the soak test — the
// runtime path can't afford this thinking, but we can, and the verdicts
// become better zero-latency heuristics. The optimization loop, applied to
// its own reflexes.
// Run: npx tsx scripts/ack-audit.ts [jsonl=C:/Claude/scratch/persona-batch.jsonl]
import 'dotenv/config';
import { readFileSync } from 'node:fs';

const TELNYX = 'https://api.telnyx.com/v2';
const JUDGE_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const apiKey = process.env.TELNYX_API_KEY ?? '';
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
const LOG = process.argv[2] ?? 'C:/Claude/scratch/persona-batch.jsonl';

const ACK_TEXT: Record<string, { cat: string; text: string }> = {
  ack_pos_1: { cat: 'positive', text: 'Great, thanks!' },
  ack_pos_2: { cat: 'positive', text: 'Perfect, thank you.' },
  ack_soft_1: { cat: 'soft', text: 'Okay, fair enough.' },
  ack_soft_2: { cat: 'soft', text: 'Alright, I hear you.' },
  ack_question_1: { cat: 'question', text: "That's a good question." },
  ack_question_2: { cat: 'question', text: 'Sure, happy to explain.' },
  ack_sorry_1: { cat: 'sorry', text: 'I understand — sorry about that.' },
  ack_sorry_2: { cat: 'sorry', text: 'I hear you, apologies.' },
  ack_pleasantry_1: { cat: 'pleasantry', text: 'Doing great, thanks for asking!' },
  ack_pleasantry_2: { cat: 'pleasantry', text: "Likewise — it's great talking with you!" },
  cv_ack_1: { cat: 'neutral', text: 'Okay, got it.' },
  cv_ack_2: { cat: 'neutral', text: 'Alright, thanks.' },
  cv_ack_3: { cat: 'neutral', text: 'Okay, noted.' },
};
const IDEALS = ['positive', 'soft', 'question', 'sorry', 'neutral', 'pleasantry', 'none_appropriate'];

const calls = readFileSync(LOG, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((c) => c.ccid);
const pairs: Array<{ persona: string; said: string; ack: string; cat: string; ackText: string }> = [];

for (const c of calls) {
  const rows: any[] = await fetch(
    `${supabaseUrl}/rest/v1/call_events?select=event_type,payload&call_control_id=eq.${encodeURIComponent(c.ccid)}&order=id.asc`,
    { headers: sb },
  ).then((r) => r.json());
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i].payload?.media_name;
    if (rows[i].event_type === 'call.playback.started' && ACK_TEXT[m]) {
      const before = rows
        .slice(0, i)
        .filter((e) => e.event_type === 'call.transcription' && e.payload?.transcription_data?.is_final !== false)
        .map((e) => (e.payload?.transcription_data?.transcript ?? '').trim())
        .filter((t) => t.length > 1);
      const said = before.at(-1) ?? '';
      if (said) pairs.push({ persona: c.persona, said, ack: m, cat: ACK_TEXT[m].cat, ackText: ACK_TEXT[m].text });
    }
  }
}
console.log(`Collected ${pairs.length} (utterance -> ack) pairs. Judging with ${JUDGE_MODEL} ...`);

const results: Array<{ ok: boolean; ideal: string }> = [];
for (let i = 0; i < pairs.length; i += 20) {
  const batch = pairs.slice(i, i + 20);
  const listing = batch
    .map((p, j) => `${j}. Caller said: "${p.said}" -> Agent instantly replied: "${p.ackText}"`)
    .join('\n');
  const res = await fetch(`${TELNYX}/ai/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `You judge phone-agent acknowledgments. For each numbered exchange, decide if the agent's instant acknowledgment sounds NATURAL for what the caller just said (a human receptionist would plausibly say it). Reply ONLY a JSON array like [{"i":0,"ok":true,"ideal":"neutral"}]. "ideal" = best category from: ${IDEALS.join(', ')}. Categories: positive (caller agreed/enthusiastic), soft (caller hedged/mildly declined), question (caller asked a substantive question), sorry (caller is annoyed/hostile/complaining), neutral (plain info), pleasantry (caller made small talk like "how are you?"), none_appropriate (agent should NOT ack here at all).`,
        },
        { role: 'user', content: listing },
      ],
    }),
  });
  const body: any = await res.json().catch(() => ({}));
  const text: string = body?.choices?.[0]?.message?.content ?? '[]';
  try {
    const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
    for (const r of arr) if (typeof r.i === 'number' && batch[r.i]) results[i + r.i] = { ok: !!r.ok, ideal: String(r.ideal ?? '?') };
  } catch {
    console.error(`batch ${i} parse failed: ${text.slice(0, 120)}`);
  }
  process.stdout.write(`${Math.min(i + 20, pairs.length)}/${pairs.length} `);
}

console.log('\n\n=== NATURALNESS BY CHOSEN CATEGORY ===');
const byCat: Record<string, { n: number; ok: number }> = {};
const confusion: Record<string, number> = {};
const misses: Array<{ said: string; ackText: string; cat: string; ideal: string; persona: string }> = [];
pairs.forEach((p, idx) => {
  const r = results[idx];
  if (!r) return;
  byCat[p.cat] ??= { n: 0, ok: 0 };
  byCat[p.cat].n++;
  if (r.ok) byCat[p.cat].ok++;
  else {
    confusion[`${p.cat} -> ${r.ideal}`] = (confusion[`${p.cat} -> ${r.ideal}`] ?? 0) + 1;
    if (misses.length < 30) misses.push({ said: p.said, ackText: p.ackText, cat: p.cat, ideal: r.ideal, persona: p.persona });
  }
});
for (const [cat, s] of Object.entries(byCat)) console.log(`${cat.padEnd(10)} ${s.ok}/${s.n} natural (${((100 * s.ok) / s.n).toFixed(0)}%)`);
console.log('\n=== MISFIRE PATTERNS (chosen -> judge ideal) ===');
for (const [k, v] of Object.entries(confusion).sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(3)}x  ${k}`);
console.log('\n=== SAMPLE MISSES ===');
for (const m of misses.slice(0, 20)) console.log(`[${m.persona}] said "${m.said.slice(0, 80)}" -> ack "${m.ackText}" (${m.cat}); ideal: ${m.ideal}`);
