// Soak-test analysis (Sean 8/11: "make sure we're listening to make
// improvements"): mines call_events for every batch call — outcome per
// persona, ack usage, unclear-endings with the utterances that caused them
// (= the rebuttal-clip backlog), unanswered caller questions, durations.
// Run: npx tsx scripts/persona-analyze.ts [jsonl=C:/Claude/scratch/persona-batch.jsonl]
import 'dotenv/config';
import { readFileSync } from 'node:fs';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const sb = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
const LOG = process.argv[2] ?? 'C:/Claude/scratch/persona-batch.jsonl';

const RESPONSES = ['resp_compliance', 'resp_interested', 'resp_interested_win', 'resp_not_interested', 'cv_resp_unclear', 'cv_resp_positive', 'cv_resp_negative', 'exit_disengage', 'exit_callback'];
// Vertical clip renders collapse to their canonical name for the matrix.
const canon = (m: string) => m.replace(/_win$/, '');
const ACK_CATS: Record<string, string> = {
  ack_pos_1: 'positive', ack_pos_2: 'positive',
  ack_soft_1: 'soft', ack_soft_2: 'soft',
  ack_question_1: 'question', ack_question_2: 'question', ack_question_3: 'question',
  ack_sorry_1: 'sorry', ack_sorry_2: 'sorry',
  ack_pleasantry_1: 'pleasantry', ack_pleasantry_2: 'pleasantry',
  cv_ack_1: 'neutral', cv_ack_2: 'neutral', cv_ack_3: 'neutral', cv_ack_4: 'neutral', cv_ack_5: 'neutral',
};

const calls = readFileSync(LOG, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((c) => c.ccid);
console.log(`Analyzing ${calls.length} calls ...`);

const outcomeMatrix: Record<string, Record<string, number>> = {};
const ackUsage: Record<string, number> = {};
const unclearUtterances: Array<{ persona: string; question: string; said: string }> = [];
const callerQuestions: Record<string, number> = {};
const durations: number[] = [];
let bargeIns = 0;
const rebuttal = { fired: 0, flipped: 0, heldNo: 0, unclear: 0 };
const rebuttalCalls: Array<{ persona: string; outcome: string }> = [];

for (const c of calls) {
  const rows: any[] = await fetch(
    `${supabaseUrl}/rest/v1/call_events?select=event_type,occurred_at,payload&call_control_id=eq.${encodeURIComponent(c.ccid)}&order=id.asc`,
    { headers: sb },
  ).then((r) => r.json());

  const clips = rows.filter((e) => e.event_type === 'call.playback.started').map((e) => e.payload?.media_name);
  const finals = rows
    .filter((e) => e.event_type === 'call.transcription' && e.payload?.transcription_data?.is_final !== false)
    .map((e) => (e.payload?.transcription_data?.transcript ?? '').trim())
    .filter((t) => t.length > 1);

  const outcome = canon(clips.find((m: string) => RESPONSES.includes(m)) ?? (clips.includes('goodbye_biz') || clips.includes('cv_goodbye') ? 'goodbye_only' : 'none'));
  outcomeMatrix[c.persona] ??= {};
  outcomeMatrix[c.persona][outcome] = (outcomeMatrix[c.persona][outcome] ?? 0) + 1;

  // One-shot rebuttal telemetry (windows bench 8/17): fired count + what the
  // caller did with it (the persuasion conversion read).
  if (clips.includes('rebuttal_win')) {
    rebuttal.fired++;
    if (outcome === 'resp_interested') rebuttal.flipped++;
    else if (outcome === 'resp_not_interested' || outcome === 'none') rebuttal.heldNo++; // 'none' = caller hung up on the rebuttal — that's a no
    else rebuttal.unclear++;
    rebuttalCalls.push({ persona: c.persona, outcome });
  }

  for (const m of clips) if (ACK_CATS[m]) ackUsage[ACK_CATS[m]] = (ackUsage[ACK_CATS[m]] ?? 0) + 1;

  if (outcome === 'cv_resp_unclear') {
    const respIdx = rows.findIndex((e) => e.payload?.media_name === 'cv_resp_unclear');
    const before = rows.slice(0, respIdx).filter((e) => e.event_type === 'call.transcription' && e.payload?.transcription_data?.is_final !== false);
    const said = (before.at(-1)?.payload?.transcription_data?.transcript ?? '').trim();
    unclearUtterances.push({ persona: c.persona, question: c.question, said });
  }

  for (const t of finals) {
    if (/\?\s*$/.test(t) && t.length > 8) {
      const key = t.toLowerCase().replace(/[^a-z ?]/g, '').slice(0, 60);
      callerQuestions[key] = (callerQuestions[key] ?? 0) + 1;
    }
  }

  // barge-in signature: playback_stop only fires on mid-clip declines
  if (rows.some((e) => e.event_type === 'call.playback.ended' && e.payload?.status === 'cancelled')) bargeIns++;

  const t0 = rows.find((e) => e.event_type === 'call.initiated');
  const t1 = rows.find((e) => e.event_type === 'call.hangup');
  if (t0 && t1) durations.push((new Date(t1.occurred_at).getTime() - new Date(t0.occurred_at).getTime()) / 1000);
}

console.log('\n=== OUTCOME MATRIX (persona x final response) ===');
for (const [p, m] of Object.entries(outcomeMatrix)) {
  console.log(`${p.padEnd(16)} ${Object.entries(m).map(([k, v]) => `${k}:${v}`).join('  ')}`);
}
console.log('\n=== ACK CATEGORY USAGE ===');
console.log(Object.entries(ackUsage).map(([k, v]) => `${k}:${v}`).join('  '));
console.log(`\n=== BARGE-INS (cancelled playback): ${bargeIns} ===`);
if (rebuttal.fired) {
  console.log(`\n=== ONE-SHOT REBUTTAL (rebuttal_win) ===`);
  console.log(`fired ${rebuttal.fired}x — flipped to interested: ${rebuttal.flipped}, held no: ${rebuttal.heldNo}, unclear: ${rebuttal.unclear}`);
  const byPersona: Record<string, string[]> = {};
  for (const r of rebuttalCalls) (byPersona[r.persona] ??= []).push(r.outcome);
  for (const [p, outs] of Object.entries(byPersona)) console.log(`  ${p}: ${outs.join(', ')}`);
}
console.log(`\n=== DURATIONS: avg ${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(0)}s  min ${Math.min(...durations).toFixed(0)}s  max ${Math.max(...durations).toFixed(0)}s ===`);
console.log('\n=== TOP CALLER QUESTIONS (the rebuttal backlog) ===');
for (const [q, n] of Object.entries(callerQuestions).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`${String(n).padStart(3)}x  ${q}`);
}
console.log('\n=== UNCLEAR ENDINGS — what the caller had just said ===');
for (const u of unclearUtterances.slice(0, 20)) {
  console.log(`[${u.persona}/${u.question}] "${u.said}"`);
}
console.log(`(${unclearUtterances.length} unclear endings total)`);
