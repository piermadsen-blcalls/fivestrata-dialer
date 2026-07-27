/**
 * PoC showcase simulator — runs synthetic leads through the REAL platform
 * pipeline (intake -> leads -> calls -> call_turns -> call_events -> transfer),
 * with the telephony/agent layer SIMULATED (no Telnyx keys yet). Every fake
 * record is marked sub_source=DEMO and uses 555 numbers — zero real PII.
 *
 * Watch it live at http://127.0.0.1:3000/dashboard while it runs.
 *
 * Run:  npx tsx scripts/demo-simulate.ts [numLeads=40]
 */
import { supabase } from '../src/clients/supabase.js';

const NUM_LEADS = Number(process.argv[2] ?? 40);
const API = 'http://127.0.0.1:3000';

const STATES = ['UT', 'TX', 'FL', 'OH', 'IL', 'MO', 'CO', 'MN'];
const SUBS = ['STC', 'CTD', 'PX', 'WIH', 'MAD'];
const CLIP_INTENTS = ['greeting', 'purpose', 'qualify_owner', 'qualify_timeline', 'objection_price', 'objection_spouse', 'brand_client', 'transfer_setup'];
const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- seed dimension data (idempotent-ish: skip if a DEMO client exists) ---
async function seed() {
  const { data: existing } = await supabase.from('clients').select('id').eq('name', 'Demo Windows Co').limit(1);
  if (existing?.length) return existing[0]!.id as string;

  const { data: client } = await supabase
    .from('clients')
    .insert({ name: 'Demo Windows Co', vertical: 'windows', branding_name: 'Demo Windows', active: true })
    .select('id')
    .single();

  const { data: script } = await supabase
    .from('scripts')
    .insert({ name: 'demo-windows-revive', vertical: 'windows', kind: 'hybrid', content: 'DEMO script', active: true })
    .select('id')
    .single();

  const { data: pack } = await supabase
    .from('voice_packs')
    .insert({ name: 'demo-pack-jessica', script_id: script!.id, tts_voice: 'demo-voice', active: true })
    .select('id')
    .single();

  await supabase.from('voice_clips').insert(
    CLIP_INTENTS.map((intent) => ({
      voice_pack_id: pack!.id,
      intent,
      transcript: `[DEMO clip: ${intent}]`,
      duration_sec: 3 + Math.random() * 6,
    })),
  );

  await supabase.from('dids').insert(
    Array.from({ length: 5 }, (_, i) => ({
      phone_number: `+1555010${100 + i}`,
      dial_count: Math.floor(Math.random() * 900),
      status: 'active',
    })),
  );

  return client!.id as string;
}

// --- simulate one call lifecycle against a queued lead ---
async function simulateCall(lead: { id: string }, clientId: string, packId: string | null) {
  const started = new Date(Date.now() - Math.floor(Math.random() * 3600_000));
  // outcome mix tuned to look like a plausible revive session
  const roll = Math.random();
  const outcome =
    roll < 0.55 ? 'no_answer' : roll < 0.72 ? 'ivr' : roll < 0.97 ? 'human' : 'human_qualified';
  const isHuman = outcome === 'human' || outcome === 'human_qualified';
  const qualified = outcome === 'human_qualified';
  const durationSec = outcome === 'no_answer' ? 25 : outcome === 'ivr' ? 40 : 90 + Math.floor(Math.random() * 300);

  const { data: call } = await supabase
    .from('calls')
    .insert({
      lead_id: lead.id,
      direction: 'outbound',
      started_at: started.toISOString(),
      answered_at: outcome === 'no_answer' ? null : new Date(started.getTime() + 18_000).toISOString(),
      ended_at: new Date(started.getTime() + durationSec * 1000).toISOString(),
      duration_sec: durationSec,
      disposition: qualified ? 'QUALIFIED' : outcome === 'human' ? 'NOT_INTERESTED' : outcome === 'ivr' ? 'IVA' : 'NO_ANSWER',
      contact_quality: outcome === 'no_answer' ? 'unknown' : outcome === 'ivr' ? 'ivr' : 'human',
      transferred_client_id: qualified ? clientId : null,
      canned_seconds: isHuman ? Math.round(durationSec * 0.8) : 0,
      tts_seconds: isHuman ? Math.round(durationSec * 0.08) : 0,
    })
    .select('id')
    .single();

  await supabase.from('call_events').insert([
    { call_id: call!.id, event_type: 'call.initiated', occurred_at: started.toISOString(), payload: { demo: true } },
    ...(outcome !== 'no_answer'
      ? [{ call_id: call!.id, event_type: 'call.answered', occurred_at: new Date(started.getTime() + 18_000).toISOString(), payload: { demo: true } }]
      : []),
    ...(qualified
      ? [
          { call_id: call!.id, event_type: 'transfer.attempted', occurred_at: new Date(started.getTime() + durationSec * 900).toISOString(), payload: { demo: true } },
          { call_id: call!.id, event_type: 'transfer.bridged', occurred_at: new Date(started.getTime() + durationSec * 950).toISOString(), payload: { demo: true } },
        ]
      : []),
    { call_id: call!.id, event_type: 'call.hangup', occurred_at: new Date(started.getTime() + durationSec * 1000).toISOString(), payload: { demo: true } },
  ]);

  if (isHuman) {
    let clipIds: { id: string }[] = [];
    if (packId) {
      const { data } = await supabase.from('voice_clips').select('id').eq('voice_pack_id', packId);
      clipIds = data ?? [];
    }
    const turns = 3 + Math.floor(Math.random() * 5);
    await supabase.from('call_turns').insert(
      Array.from({ length: turns }, (_, i) => {
        const canned = Math.random() < 0.8 && clipIds.length > 0;
        return {
          call_id: call!.id,
          turn_index: i,
          context: { demo: true, heard: `[synthetic utterance ${i}]` },
          source: canned ? 'canned' : 'tts',
          clip_id: canned ? rand(clipIds).id : null,
          tts_text: canned ? null : '[DEMO synthesized long-tail response]',
          audio_sec: 3 + Math.random() * 8,
          outcome: i === turns - 1 ? (qualified ? 'agreed_to_transfer' : 'declined') : 'continued',
          occurred_at: new Date(started.getTime() + (i + 1) * 15_000).toISOString(),
        };
      }),
    );
  }

  await supabase.from('leads').update({ status: qualified ? 'completed' : 'queued' }).eq('id', lead.id);
  return outcome;
}

// --- main ---
console.log(`Seeding demo dimensions…`);
const clientId = await seed();
const { data: pack } = await supabase.from('voice_packs').select('id').eq('name', 'demo-pack-jessica').single();

await supabase.from('transfer_priorities').upsert(
  { client_id: clientId, vertical: 'windows', postal_code: '84604', weight: 10 },
  { onConflict: 'client_id,vertical,postal_code' },
);

console.log(`Pushing ${NUM_LEADS} synthetic leads through the live intake API…`);
const leads: { id: string }[] = [];
for (let i = 0; i < NUM_LEADS; i++) {
  const res = await fetch(`${API}/leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      oleadid: `DEMO-${Date.now()}-${i}`,
      phone_number: `555${String(2000000 + Math.floor(Math.random() * 999999)).padStart(7, '0')}`,
      first_name: 'Demo',
      last_name: `Lead${i}`,
      state: rand(STATES),
      postal_code: '84604',
      vertical: 'windows',
      lead_type: 'revive',
      source: 'demo-simulator',
      sub_source: rand(SUBS),
    }),
  });
  const body = (await res.json()) as { accepted: boolean; lead_id?: string };
  if (body.accepted && body.lead_id) leads.push({ id: body.lead_id });
}
console.log(`  ${leads.length}/${NUM_LEADS} accepted and queued.`);

console.log(`Simulating dial session (watch ${API}/dashboard)…`);
const tally: Record<string, number> = {};
for (const lead of leads) {
  const outcome = await simulateCall(lead, clientId, pack?.id ?? null);
  tally[outcome] = (tally[outcome] ?? 0) + 1;
  process.stdout.write('.');
  await sleep(400); // paced so the dashboard visibly fills during a live demo
}
console.log(`\nDone: ${JSON.stringify(tally)}`);
console.log(`Dashboard: ${API}/dashboard`);
