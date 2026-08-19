// Campaign delivery L1 (compile/enroll) + L2 (daily plan) — campaign-delivery.md §3–§4.
// Runs against the shared Supabase project via the Management API database/query
// endpoint (db-apply.ts pattern; token from C:\Claude\supabase-cli-env.sh — never printed).
//
// Dry-run by default everywhere: prints exactly what it would write (this doubles as the
// console wizard's pre-activation review pane). --commit writes.
//
// Subcommands:
//   create  --program <slug> --name "<name>" --starts YYYY-MM-DD --ends YYYY-MM-DD
//           [--budget-usd N] [--dial-budget N] [--pool '<json>'] [--priority N]
//           [--max-dials N] [--rest-hours N] [--commit]
//           Narrowing invariant enforced: max-dials <= program's, rest-hours >= program's.
//   compile <campaign-name-or-uuid> [--activate] [--commit]
//           Enroll pool_rules matches into campaign_leads (one-active-per-lead index wins
//           conflicts), create next-attempt dial_jobs, compile NPA/ZIP3 geography, print
//           the allowance math. Re-runnable on a live campaign (recurring drops).
//   plan    [<campaign-name-or-uuid> | --all] [--date YYYY-MM-DD] [--commit]
//           Refresh actuals, compute planned dials for the date (default: tomorrow) with
//           the five-term min + binding constraint, upsert campaign_days, print DID
//           purchase suggestions and completion recommendation.
//
// Run: node --import tsx scripts/campaign-plan.ts <subcommand> ...
import { readFileSync } from 'node:fs';

const PROJECT_REF = 'wcftuethlcgeasopayed';
const ENV_SCRIPT = 'C:/Claude/supabase-cli-env.sh';
const COMMIT = process.argv.includes('--commit');

const argv = process.argv.slice(2).filter((a) => a !== '--commit');
const sub = argv.shift() ?? '';
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const has = (name: string) => argv.includes(`--${name}`);

const token = readFileSync(ENV_SCRIPT, 'utf8')
  .match(/^export SUPABASE_ACCESS_TOKEN=(.+)$/m)?.[1]
  ?.trim().replace(/\r$/, '').replace(/^["']|["']$/g, '') ?? '';
if (!token) {
  console.error(`SUPABASE_ACCESS_TOKEN not found in ${ENV_SCRIPT}`);
  process.exit(1);
}

async function q<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`database/query HTTP ${res.status}: ${body.slice(0, 500)}`);
  return JSON.parse(body);
}

const esc = (s: string) => `'${s.replace(/'/g, "''")}'`;
const lit = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === '' ? 'null' : typeof v === 'number' ? String(v) : esc(String(v));

async function config(key: string, fallback: number): Promise<number> {
  const r = await q<{ value: string }>(`select value from dialer_config where key = ${esc(key)}`);
  return r.length ? Number(r[0].value) : fallback;
}

type Campaign = {
  id: string; program_id: string; name: string; status: string;
  starts_at: string; ends_at: string; budget_usd: number | null; dial_budget: number | null;
  est_cost_per_dial: number | null; pool_rules: Record<string, unknown>; priority: number;
  max_dials_per_lead: number | null; min_rest_hours: number | null;
  // joined from programs:
  program_slug: string; tenant_id: string; prog_max_dials: number; prog_rest_hours: number;
  prog_daily_budget: number | null;
};

async function getCampaign(ref: string): Promise<Campaign> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(ref);
  const rows = await q<Campaign>(`
    select c.*, p.slug as program_slug, p.tenant_id,
           p.max_dials_per_lead as prog_max_dials, p.min_rest_hours as prog_rest_hours,
           p.daily_dial_budget as prog_daily_budget
    from campaigns c join programs p on p.id = c.program_id
    where ${isUuid ? `c.id = ${esc(ref)}` : `c.name = ${esc(ref)}`}`);
  if (rows.length !== 1) throw new Error(`campaign ${ref}: ${rows.length} matches`);
  return rows[0];
}

// Pool WHERE clause from pool_rules (campaign-delivery.md §3) + unconditional gates:
// program scope, soft delete, lead DNC flag, dnc_numbers suppression.
function poolWhere(c: Campaign): string {
  const r = c.pool_rules ?? {};
  const conds = [
    `l.program_id = ${esc(c.program_id)}`,
    `l.removed_at is null`,
    `coalesce(l.dnc, false) = false`,
    `not exists (select 1 from dnc_numbers d where d.phone_digits = phone_digits(l.phone_number))`,
  ];
  const arr = (k: string): string[] | undefined =>
    Array.isArray(r[k]) && (r[k] as unknown[]).length ? (r[k] as string[]) : undefined;
  const batches = arr('batch_ids');
  if (batches) conds.push(`l.batch_id in (${batches.map(esc).join(',')})`);
  const sources = arr('source_ids');
  if (sources) conds.push(`l.source_id in (${sources.map(esc).join(',')})`);
  if (typeof r.cost_min === 'number') conds.push(`l.acquisition_cost >= ${r.cost_min}`);
  if (typeof r.cost_max === 'number') conds.push(`l.acquisition_cost <= ${r.cost_max}`);
  if (typeof r.lead_type === 'string') conds.push(`l.lead_type = ${esc(r.lead_type)}`);
  const states = arr('states');
  if (states) conds.push(`l.state in (${states.map(esc).join(',')})`);
  const zips = arr('zips');
  if (zips) {
    const zip3 = zips.filter((z) => z.length === 3), zip5 = zips.filter((z) => z.length === 5);
    const zc: string[] = [];
    if (zip3.length) zc.push(`left(l.postal_code, 3) in (${zip3.map(esc).join(',')})`);
    if (zip5.length) zc.push(`l.postal_code in (${zip5.map(esc).join(',')})`);
    if (zc.length) conds.push(`(${zc.join(' or ')})`);
  }
  return conds.join('\n    and ');
}

// One-strike dead-number exclusion (campaign-delivery.md §3, ✅ Sean 8/19): any phone
// with a carrier-confirmed nonexistence hangup is excluded after ONE occurrence — no N.
// Cause set = D2's NUMBER_BAD bucket; served by migration 0011's partial index.
const deadNumber = (phoneExpr: string) => `exists (
    select 1 from call_events e
    where e.event_type = 'call.hangup'
      and e.payload->>'hangup_cause' in ('unallocated_number','not_found','invalid_number_format')
      and phone_digits(e.payload->>'to') = phone_digits(${phoneExpr}))`;

// Allowance = min(budget_usd/cpd, dial_budget, pool remaining attempts) — §3.
async function allowance(c: Campaign) {
  const cpd = c.est_cost_per_dial ?? (await config('campaign_est_cost_per_dial', 0.04));
  const [{ remaining }] = await q<{ remaining: number }>(`
    select coalesce(sum(greatest(0,
             least(coalesce(l.max_attempts, 9999), ${c.max_dials_per_lead ?? c.prog_max_dials})
             - cl.attempts_done)), 0)::int as remaining
    from campaign_leads cl join leads l on l.id = cl.lead_id
    where cl.campaign_id = ${esc(c.id)} and cl.status = 'active'`);
  const budgetDials = c.budget_usd != null ? Math.floor(Number(c.budget_usd) / cpd) : null;
  const dialBudget = c.dial_budget != null ? Number(c.dial_budget) : null;
  const terms: Array<[string, number]> = [];
  if (budgetDials != null) terms.push(['budget', budgetDials]);
  if (dialBudget != null) terms.push(['budget', dialBudget]);
  terms.push(['pool', remaining]);
  const [label, value] = terms.reduce((a, b) => (b[1] < a[1] ? b : a));
  return { cpd, budgetDials, dialBudget, poolRemaining: remaining, allowance: value, allowanceLabel: label };
}

// Tenant-eligible DID daily capacity (D9 pool = NPA-preferred with fallback, so the true
// bound is the whole eligible pool). Warming DIDs count at the warm-up rate. Demo 555
// numbers excluded everywhere (house rule).
async function didCapacity(tenantId: string, warmupRate: number) {
  const [row] = await q<{ capacity: number; dids: number }>(`
    select coalesce(sum(case when status = 'warming' or warmup_until > now()
                             then least(daily_budget, ${warmupRate}) else daily_budget end), 0)::int as capacity,
           count(*)::int as dids
    from dids
    where status in ('warming','active')
      and dial_count < max_dials
      and phone_number not like '+1555%'
      and (tenant_id is null or tenant_id = ${esc(tenantId)})`);
  return row;
}

// ------------------------------------------------------------------- create
async function create() {
  const programSlug = flag('program'); const name = flag('name');
  const starts = flag('starts'); const ends = flag('ends');
  if (!programSlug || !name || !starts || !ends) {
    throw new Error('create requires --program --name --starts --ends');
  }
  const budgetUsd = flag('budget-usd') ? Number(flag('budget-usd')) : null;
  const dialBudget = flag('dial-budget') ? Number(flag('dial-budget')) : null;
  if (budgetUsd == null && dialBudget == null) throw new Error('need --budget-usd and/or --dial-budget');
  const pool = flag('pool') ? JSON.parse(flag('pool')!) : {};
  const maxDials = flag('max-dials') ? Number(flag('max-dials')) : null;
  const restHours = flag('rest-hours') ? Number(flag('rest-hours')) : null;

  const [p] = await q<{ id: string; max_dials_per_lead: number; min_rest_hours: number }>(
    `select id, max_dials_per_lead, min_rest_hours from programs where slug = ${esc(programSlug)}`);
  if (!p) throw new Error(`program ${programSlug} not found`);
  // Narrowing invariant (§1): campaign may only tighten the program.
  if (maxDials != null && maxDials > p.max_dials_per_lead) {
    throw new Error(`--max-dials ${maxDials} would WIDEN program cap ${p.max_dials_per_lead} — refused`);
  }
  if (restHours != null && restHours < p.min_rest_hours) {
    throw new Error(`--rest-hours ${restHours} would WIDEN program floor ${p.min_rest_hours} — refused`);
  }

  console.log(`create campaign ${JSON.stringify({ programSlug, name, starts, ends, budgetUsd, dialBudget, pool, maxDials, restHours })}`);
  if (!COMMIT) { console.log('dry run — add --commit to insert (status: draft)'); return; }
  const [row] = await q<{ id: string }>(`
    insert into campaigns (program_id, name, starts_at, ends_at, budget_usd, dial_budget,
                           pool_rules, priority, max_dials_per_lead, min_rest_hours, created_by)
    values (${esc(p.id)}, ${esc(name)}, ${esc(starts)}, ${lit(ends)}::date + interval '1 day' - interval '1 second',
            ${lit(budgetUsd)}, ${lit(dialBudget)}, ${esc(JSON.stringify(pool))}::jsonb,
            ${flag('priority') ?? 100}, ${lit(maxDials)}, ${lit(restHours)}, 'campaign-plan.ts')
    returning id`);
  console.log(`created draft campaign ${row.id}`);
}

// ------------------------------------------------------------------ compile
async function compile() {
  const ref = argv.find((a) => !a.startsWith('--'));
  if (!ref) throw new Error('compile requires a campaign name or uuid');
  const c = await getCampaign(ref);
  const where = poolWhere(c);

  // dead_number counts only otherwise-enrollable leads so the arithmetic stays exact;
  // it prints even at 0 — hygiene exclusions are never silent (§3 no-silent-shrinkage).
  const [counts] = await q<{ pool: number; enrolled_here: number; locked_elsewhere: number; dead_number: number }>(`
    select count(*)::int as pool,
           count(*) filter (where exists (select 1 from campaign_leads x
             where x.lead_id = l.id and x.campaign_id = ${esc(c.id)}))::int as enrolled_here,
           count(*) filter (where exists (select 1 from campaign_leads x
             where x.lead_id = l.id and x.status = 'active' and x.campaign_id <> ${esc(c.id)}))::int as locked_elsewhere,
           count(*) filter (where ${deadNumber('l.phone_number')}
             and not exists (select 1 from campaign_leads x
               where x.lead_id = l.id and (x.campaign_id = ${esc(c.id)}
                     or (x.status = 'active' and x.campaign_id <> ${esc(c.id)}))))::int as dead_number
    from leads l
    where ${where}`);
  const newLeads = counts.pool - counts.enrolled_here - counts.locked_elsewhere - counts.dead_number;
  console.log(`[${c.name}] pool match: ${counts.pool} · already enrolled: ${counts.enrolled_here} · ` +
    `locked to another active campaign: ${counts.locked_elsewhere} · ` +
    `excluded dead-number (one-strike): ${counts.dead_number} · would enroll: ${newLeads}`);

  const npas = await q<{ npa: string; n: number }>(`
    select left(right(phone_digits(l.phone_number), 10), 3) as npa, count(*)::int as n
    from leads l where ${where} group by 1 order by 2 desc limit 12`);
  console.log(`geography (pool NPAs): ${npas.map((r) => `${r.npa}:${r.n}`).join(' ') || '(none)'}`);

  if (!COMMIT) {
    const a = await allowance(c);
    console.log(`allowance preview (enrolled-so-far basis): ${JSON.stringify(a)}`);
    console.log('dry run — add --commit to enroll' + (has('activate') ? ' + activate' : ''));
    return;
  }

  const enrolled = await q<{ lead_id: string }>(`
    insert into campaign_leads (campaign_id, lead_id)
    select ${esc(c.id)}, l.id from leads l
    where ${where}
      and not ${deadNumber('l.phone_number')}
    on conflict do nothing
    returning lead_id`);
  // The dead-number gate also applies here: a lead enrolled BEFORE its number proved
  // dead must not get fresh jobs on a recompile of a live campaign.
  const jobs = await q<{ id: number }>(`
    insert into dial_jobs (campaign_id, lead_id, attempt_no, not_before, priority)
    select cl.campaign_id, cl.lead_id, cl.attempts_done + 1,
           greatest(now(), ${esc(c.starts_at)}::timestamptz), ${c.priority}
    from campaign_leads cl join leads l on l.id = cl.lead_id
    where cl.campaign_id = ${esc(c.id)} and cl.status = 'active'
      and not ${deadNumber('l.phone_number')}
      and not exists (select 1 from dial_jobs dj
                      where dj.campaign_id = cl.campaign_id and dj.lead_id = cl.lead_id
                        and dj.state in ('due','claimed','dialing'))
    on conflict do nothing
    returning id`);
  await q(`
    update campaigns set geography = jsonb_build_object(
      'npas', coalesce((select jsonb_object_agg(npa, n) from (
                 select left(right(phone_digits(l.phone_number), 10), 3) as npa, count(*)::int as n
                 from campaign_leads cl join leads l on l.id = cl.lead_id
                 where cl.campaign_id = ${esc(c.id)} and cl.status = 'active' group by 1) t), '{}'::jsonb),
      'zip3s', coalesce((select jsonb_object_agg(z, n) from (
                 select left(l.postal_code, 3) as z, count(*)::int as n
                 from campaign_leads cl join leads l on l.id = cl.lead_id
                 where cl.campaign_id = ${esc(c.id)} and cl.status = 'active'
                   and l.postal_code is not null group by 1) t), '{}'::jsonb)
    ), updated_at = now()
    where id = ${esc(c.id)}`);
  console.log(`enrolled ${enrolled.length} new leads · ${jobs.length} dial_jobs created · geography compiled`);
  const a = await allowance(c);
  console.log(`allowance: ${a.allowance} dials (${a.allowanceLabel}-bound) — ` +
    `budget ${a.budgetDials ?? '—'} @ $${a.cpd}/dial · dial_budget ${a.dialBudget ?? '—'} · pool ${a.poolRemaining}`);
  if (has('activate')) {
    await q(`update campaigns set status = 'active', updated_at = now()
             where id = ${esc(c.id)} and status in ('draft','scheduled')`);
    console.log('status -> active');
  }
}

// --------------------------------------------------------------------- plan
async function planOne(c: Campaign, date: string) {
  const warmupRate = await config('did_warmup_daily_budget', 5);
  // Refresh actuals on every existing plan row (cheap; keeps campaign_days honest).
  await q(`
    update campaign_days cd
    set actual_dials = (select count(*) from calls k
                        where k.campaign_uuid = cd.campaign_id and k.started_at::date = cd.plan_date)
    where cd.campaign_id = ${esc(c.id)}`);

  const a = await allowance(c);
  const [{ so_far }] = await q<{ so_far: number }>(
    `select count(*)::int as so_far from calls where campaign_uuid = ${esc(c.id)}`);
  const remainingAllowance = Math.max(0, a.allowance - so_far);
  const [{ days_left }] = await q<{ days_left: number }>(
    `select greatest(0, (${esc(c.ends_at)}::date - ${esc(date)}::date) + 1)::int as days_left`);

  // Completion detection first — a finished campaign gets no plan row.
  let done: string | null = null;
  if (days_left === 0) done = 'ended_at';
  else if (remainingAllowance === 0) done = a.allowanceLabel === 'pool' ? 'pool_exhausted' : 'budget_exhausted';
  else if (a.poolRemaining === 0) done = 'pool_exhausted';
  if (done) {
    console.log(`[${c.name}] COMPLETE (${done}) — allowance ${a.allowance}, dialed ${so_far}, days left ${days_left}`);
    if (COMMIT && c.status === 'active') {
      await q(`update campaigns set status = 'completed', completed_reason = ${esc(done)},
               updated_at = now() where id = ${esc(c.id)}`);
      console.log('status -> completed');
    }
    return;
  }

  const spread = Math.ceil(remainingAllowance / days_left);
  // Program daily budget is shared across the program's campaigns: subtract siblings'
  // already-planned dials for this date.
  let programDaily: number | null = null;
  if (c.prog_daily_budget != null) {
    const [{ sibling }] = await q<{ sibling: number }>(`
      select coalesce(sum(cd.planned_dials), 0)::int as sibling
      from campaign_days cd join campaigns x on x.id = cd.campaign_id
      where cd.plan_date = ${esc(date)} and x.program_id = ${esc(c.program_id)}
        and cd.campaign_id <> ${esc(c.id)} and x.status = 'active'`);
    programDaily = Math.max(0, Number(c.prog_daily_budget) - sibling);
  }
  const did = await didCapacity(c.tenant_id, warmupRate);
  // Concurrency term: only present once pacing config exists (concurrency-queueing.md).
  const maxConc = await config('max_concurrency', 0);
  const avgSlot = await config('avg_slot_seconds', 45);
  const concurrency = maxConc > 0 ? Math.floor((maxConc * 10 * 3600) / avgSlot) : null;

  const terms: Array<[string, number]> = [[a.allowanceLabel, spread]];
  if (programDaily != null) terms.push(['program_daily', programDaily]);
  terms.push(['did_capacity', did.capacity]);
  if (concurrency != null) terms.push(['concurrency', concurrency]);
  // buyer_caps: no signal until the pacer runs pre-auth — omitted, not zero.
  const [binding, planned] = terms.reduce((x, y) => (y[1] < x[1] ? y : x));

  const inputs = {
    cpd: a.cpd, budget_dials: a.budgetDials, dial_budget: a.dialBudget,
    pool_remaining: a.poolRemaining, dials_so_far: so_far,
    remaining_allowance: remainingAllowance, days_left, spread,
    program_daily: programDaily, did_capacity: did.capacity, eligible_dids: did.dids,
    concurrency,
  };
  console.log(`[${c.name}] ${date}: planned ${planned} dials/day — binding: ${binding}`);
  console.log(`  inputs: ${JSON.stringify(inputs)}`);

  // Coverage gaps -> purchase suggestion (fair share of the plan per NPA vs capacity).
  const cov = await q<{ npa: string; active_leads: number; eligible_dids: number; daily_did_capacity: number }>(
    `select * from campaign_did_coverage where campaign_id = ${esc(c.id)}`);
  const totalLeads = cov.reduce((s, r) => s + Number(r.active_leads), 0);
  const gaps = cov
    .map((r) => {
      const fair = Math.ceil(planned * (Number(r.active_leads) / Math.max(1, totalLeads)));
      const buy = Math.ceil(Math.max(0, fair - Number(r.daily_did_capacity)) / 20);
      return { npa: r.npa, fair, capacity: Number(r.daily_did_capacity), buy };
    })
    .filter((g) => g.buy > 0);
  if (gaps.length) {
    console.log(`  DID coverage gaps (fair-share vs capacity): ` +
      gaps.map((g) => `${g.npa} needs ~${g.buy} (has ${g.capacity}/day, wants ${g.fair})`).join(' · '));
    console.log(`  suggest: node --import tsx scripts/did-pool-purchase.ts --npas ${gaps.map((g) => g.npa).join(',')} ` +
      `--count ${gaps.reduce((s, g) => s + g.buy, 0)}  (guarded; Sean approves --buy)`);
  }

  if (!COMMIT) { console.log('  dry run — add --commit to upsert campaign_days'); return; }
  await q(`
    insert into campaign_days (campaign_id, plan_date, planned_dials, binding_constraint, inputs)
    values (${esc(c.id)}, ${esc(date)}, ${planned}, ${esc(binding)}, ${esc(JSON.stringify(inputs))}::jsonb)
    on conflict (campaign_id, plan_date) do update
      set planned_dials = excluded.planned_dials,
          binding_constraint = excluded.binding_constraint,
          inputs = excluded.inputs,
          computed_at = now()`);
  console.log('  campaign_days upserted');
}

async function plan() {
  const date = flag('date') ??
    (await q<{ d: string }>(`select (current_date + 1)::text as d`))[0].d;
  const ref = argv.find((x) => !x.startsWith('--') && x !== flag('date'));
  if (has('all') || !ref) {
    const rows = await q<{ id: string }>(`select id from campaigns where status = 'active' order by created_at`);
    if (!rows.length) { console.log('no active campaigns'); return; }
    for (const r of rows) await planOne(await getCampaign(r.id), date);
  } else {
    await planOne(await getCampaign(ref), date);
  }
}

const cmds: Record<string, () => Promise<void>> = { create, compile, plan };
if (!cmds[sub]) {
  console.error('usage: campaign-plan.ts create|compile|plan ... (see header)');
  process.exit(1);
}
await cmds[sub]();
