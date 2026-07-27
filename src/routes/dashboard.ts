import type { FastifyInstance } from 'fastify';
import { supabase } from '../clients/supabase.js';

/**
 * GET /dashboard — live ops view for the PoC showcase. Server-rendered,
 * dependency-free, auto-refreshing. Reads the same views (v_rdaily) that
 * emulate Ashley's daily dashboard, plus a live transfer funnel and the
 * per-turn feed that no human call center can produce.
 */
export async function dashboardRoutes(server: FastifyInstance) {
  server.get('/dashboard', async (_req, reply) => {
    const [rdaily, funnel, turns, dids] = await Promise.all([
      supabase.from('v_rdaily').select('*').order('call_date', { ascending: false }).limit(7),
      supabase.from('v_daily_results').select('*').order('call_date', { ascending: false }).limit(50),
      supabase
        .from('call_turns')
        .select('turn_index, source, outcome, audio_sec, occurred_at')
        .order('occurred_at', { ascending: false })
        .limit(12),
      supabase.from('dids').select('phone_number, dial_count, max_dials, status').order('dial_count', { ascending: false }).limit(5),
    ]);

    const totals = (funnel.data ?? []).reduce(
      (acc, r) => ({
        dials: acc.dials + (r.dials ?? 0),
        contacts: acc.contacts + (r.contacts ?? 0),
        qualified: acc.qualified + (r.qualified ?? 0),
        transfers: acc.transfers + (r.t_agree ?? 0),
        canned: acc.canned + Number(r.canned_hours ?? 0),
        tts: acc.tts + Number(r.tts_hours ?? 0),
      }),
      { dials: 0, contacts: 0, qualified: 0, transfers: 0, canned: 0, tts: 0 },
    );
    const cannedPct = totals.canned + totals.tts > 0 ? Math.round((100 * totals.canned) / (totals.canned + totals.tts)) : 0;

    const tile = (label: string, value: string | number, sub = '') =>
      `<div class="tile"><div class="v">${value}</div><div class="l">${label}</div><div class="s">${sub}</div></div>`;

    const rdailyRows = (rdaily.data ?? [])
      .map(
        (r) =>
          `<tr><td>${r.call_date}</td><td>${r.vertical ?? '—'}</td><td>${r.lead_type ?? '—'}</td><td>${r.dials}</td><td>${r.contacts}</td><td>${Number(r.c_d_pct ?? 0).toLocaleString(undefined, { style: 'percent', maximumFractionDigits: 1 })}</td><td>${r.qs}</td><td>${r.transfers}</td><td>${Number(r.hours ?? 0).toFixed(1)}</td></tr>`,
      )
      .join('');

    const turnRows = (turns.data ?? [])
      .map(
        (t) =>
          `<tr><td>${new Date(t.occurred_at).toLocaleTimeString()}</td><td>#${t.turn_index}</td><td><span class="${t.source}">${t.source}</span></td><td>${Number(t.audio_sec ?? 0).toFixed(1)}s</td><td>${t.outcome ?? ''}</td></tr>`,
      )
      .join('');

    const didRows = (dids.data ?? [])
      .map((d) => {
        const pct = Math.round((100 * d.dial_count) / (d.max_dials || 1500));
        return `<tr><td>${d.phone_number}</td><td>${d.dial_count}/${d.max_dials}</td><td><div class="bar"><div style="width:${Math.min(pct, 100)}%" class="${pct > 80 ? 'hot' : ''}"></div></div></td><td>${d.status}</td></tr>`;
      })
      .join('');

    reply.type('text/html');
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="3">
<title>AICC — Live Ops</title><style>
 body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f1420;color:#e6e9f0;margin:0;padding:24px}
 h1{font-size:18px;font-weight:600;margin:0 0 4px} .sub{color:#8a93a8;font-size:12px;margin-bottom:20px}
 .tiles{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}
 .tile{background:#1a2233;border:1px solid #273049;border-radius:10px;padding:14px 20px;min-width:130px}
 .tile .v{font-size:26px;font-weight:700} .tile .l{font-size:12px;color:#8a93a8;margin-top:2px} .tile .s{font-size:10px;color:#5c6478}
 h2{font-size:13px;color:#8a93a8;text-transform:uppercase;letter-spacing:.08em;margin:22px 0 8px}
 table{border-collapse:collapse;width:100%;font-size:13px}
 td,th{padding:6px 10px;border-bottom:1px solid #232c42;text-align:left}
 th{color:#8a93a8;font-weight:500;font-size:11px;text-transform:uppercase}
 .canned{color:#5dd39e}.tts{color:#f0b429}
 .bar{background:#232c42;border-radius:4px;height:8px;width:120px}.bar div{background:#5dd39e;height:8px;border-radius:4px}.bar .hot{background:#f0b429}
 .grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}
 .badge{background:#273049;border-radius:4px;padding:2px 8px;font-size:11px;color:#8a93a8}
</style></head><body>
 <h1>AICC — AI Call Center Platform <span class="badge">LIVE OPS</span></h1>
 <div class="sub">Auto-refreshing · reads the same fact stream that feeds Snowflake · per-dial AND per-turn grains</div>
 <div class="tiles">
  ${tile('Dials', totals.dials)}
  ${tile('Human contacts', totals.contacts, 'IVA-filtered (connection rate)')}
  ${tile('Qualified', totals.qualified)}
  ${tile('Warm transfers', totals.transfers, 'to client')}
  ${tile('Canned coverage', `${cannedPct}%`, 'clip vs TTS seconds — the cost lever')}
 </div>
 <div class="grid">
  <div>
   <h2>Daily results (Ashley-grain: v_rdaily)</h2>
   <table><tr><th>Date</th><th>VT</th><th>Type</th><th>Dials</th><th>Contacts</th><th>C/D%</th><th>Qs</th><th>Transfers</th><th>Hours</th></tr>${rdailyRows || '<tr><td colspan=9>no data yet — run the simulator</td></tr>'}</table>
   <h2>DID pool (retire-by-benchmark)</h2>
   <table><tr><th>Number</th><th>Dials</th><th>Cap usage</th><th>Status</th></tr>${didRows || '<tr><td colspan=4>—</td></tr>'}</table>
  </div>
  <div>
   <h2>Per-turn decision feed (the AI soundboard operator)</h2>
   <table><tr><th>Time</th><th>Turn</th><th>Source</th><th>Audio</th><th>Outcome</th></tr>${turnRows || '<tr><td colspan=5>—</td></tr>'}</table>
  </div>
 </div>
</body></html>`;
  });
}
