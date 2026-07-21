/**
 * V1 (Retell-based) system deep dive — READ-ONLY aggregates, no lead PII.
 * Run:  source /c/Claude/v1-supabase-env.sh && tsx scripts/v1-deepdive.ts
 */
const url = process.env.V1_SUPABASE_URL;
const key = process.env.V1_SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('source /c/Claude/v1-supabase-env.sh first');

const headers = { apikey: key, authorization: `Bearer ${key}` };

async function count(table: string): Promise<string> {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
    method: 'HEAD',
    headers: { ...headers, prefer: 'count=exact' },
  });
  return res.headers.get('content-range')?.split('/')[1] ?? '?';
}

console.log('== row counts');
for (const t of ['dial_queue', 'call_log', 'retell_call_import', 'retell_export_history', 'agent_routing', 'zip_allowlist']) {
  console.log(`  ${t}: ${await count(t)}`);
}

console.log('\n== agent_routing (config)');
const agents = await (await fetch(
  `${url}/rest/v1/agent_routing?select=list_type,vertical,agent_name,weight,active,from_number,state_codes&order=vertical`,
  { headers },
)).json();
console.log(JSON.stringify(agents, null, 1));

console.log('\n== system_flags (config)');
const flags = await (await fetch(`${url}/rest/v1/system_flags?select=key,value,updated_at`, { headers })).json();
console.log(JSON.stringify(flags, null, 1));

console.log('\n== monthly rollup from v_daily_call_summary');
interface DayRow {
  call_date: string; vertical: string; dials: number; contacts: number; sales: number;
  dnc: number; t_att: number; t_succ: number; t_agree: number; talk_time_secs: number;
  cost_voice_engine: number; cost_tts: number; cost_llm: number; cost_telephony: number; cost_bvc: number;
}
const rows: DayRow[] = [];
for (let page = 0; page < 10; page++) {
  const batch = (await (await fetch(
    `${url}/rest/v1/v_daily_call_summary?select=call_date,vertical,dials,contacts,sales,dnc,t_att,t_succ,t_agree,talk_time_secs,cost_voice_engine,cost_tts,cost_llm,cost_telephony,cost_bvc&order=call_date.asc&limit=10000&offset=${page * 10000}`,
    { headers },
  )).json()) as DayRow[];
  rows.push(...batch);
  if (batch.length < 10000) break;
}
console.log(`  (${rows.length} summary rows)`);

const monthly = new Map<string, { dials: number; contacts: number; sales: number; dnc: number; tAtt: number; tSucc: number; tAgree: number; talkHrs: number; voice: number; tts: number; llm: number; tel: number; bvc: number }>();
for (const r of rows) {
  const m = `${r.call_date.slice(0, 7)} ${r.vertical}`;
  const agg = monthly.get(m) ?? { dials: 0, contacts: 0, sales: 0, dnc: 0, tAtt: 0, tSucc: 0, tAgree: 0, talkHrs: 0, voice: 0, tts: 0, llm: 0, tel: 0, bvc: 0 };
  agg.dials += r.dials ?? 0; agg.contacts += r.contacts ?? 0; agg.sales += r.sales ?? 0; agg.dnc += r.dnc ?? 0;
  agg.tAtt += r.t_att ?? 0; agg.tSucc += r.t_succ ?? 0; agg.tAgree += r.t_agree ?? 0;
  agg.talkHrs += (r.talk_time_secs ?? 0) / 3600;
  agg.voice += Number(r.cost_voice_engine ?? 0); agg.tts += Number(r.cost_tts ?? 0);
  agg.llm += Number(r.cost_llm ?? 0); agg.tel += Number(r.cost_telephony ?? 0); agg.bvc += Number(r.cost_bvc ?? 0);
  monthly.set(m, agg);
}
for (const [m, a] of [...monthly.entries()].sort()) {
  const cost = a.voice + a.tts + a.llm + a.tel + a.bvc;
  console.log(
    `  ${m}: dials=${a.dials} contacts=${a.contacts} sales=${a.sales} dnc=${a.dnc} ` +
    `tAtt=${a.tAtt} tSucc=${a.tSucc} tAgree=${a.tAgree} talkHrs=${a.talkHrs.toFixed(1)} ` +
    `cost=$${cost.toFixed(2)} (voice=$${a.voice.toFixed(2)} tts=$${a.tts.toFixed(2)} llm=$${a.llm.toFixed(2)} tel=$${a.tel.toFixed(2)} bvc=$${a.bvc.toFixed(2)})`,
  );
}

console.log('\n== dial_queue status mix (status column only)');
const statuses = (await (await fetch(`${url}/rest/v1/dial_queue?select=status&limit=50000`, { headers })).json()) as { status: string }[];
const mix = new Map<string, number>();
for (const s of statuses) mix.set(s.status, (mix.get(s.status) ?? 0) + 1);
console.log(' ', JSON.stringify(Object.fromEntries([...mix.entries()].sort((a, b) => b[1] - a[1]))), statuses.length === 50000 ? '(truncated at 50k)' : '');
