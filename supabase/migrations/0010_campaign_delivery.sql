-- 0010_campaign_delivery.sql
-- DRAFT (Sean 2026-08-17) — schema for docs/architecture/campaign-delivery.md.
-- *** NOT APPLIED — apply via db-apply.ts only on Sean's authorization. ***
-- ADDITIVE ONLY — shared Supabase project with V1: no drops, no renames.
-- V1 owns `dial_queue`; our queue table is `dial_jobs`, deliberately distinct.

-- ---------------------------------------------------------------- campaigns
-- A campaign = a bounded execution of a program: pool + budget + timeframe,
-- plus narrowing-only overrides (hours intersect, max_dials <=, rest >=;
-- validated in the write RPC, never trusted to the UI).

create table if not exists campaigns (
  id                 uuid primary key default gen_random_uuid(),
  program_id         uuid not null references programs (id),
  name               text not null,
  status             text not null default 'draft' check (status in
                     ('draft','scheduled','active','paused','completed','cancelled')),
  starts_at          timestamptz not null,
  ends_at            timestamptz not null,
  budget_usd         numeric(10,2),
  dial_budget        integer,
  est_cost_per_dial  numeric(8,4),        -- seeded from config; planner replaces with
                                          -- the campaign's measured trailing cost/dial
  pool_rules         jsonb not null default '{}',
  -- {"batch_ids":[uuid...], "source_ids":[uuid...], "cost_min":n|null,
  --  "cost_max":n|null, "lead_type":"fresh"|"revive"|null, "states":[..], "zips":[..]}
  geography          jsonb not null default '{}',
  -- compiled at activation from enrolled leads: {"npas":{"949":123,...},"zips":{...}}
  priority           integer not null default 100,   -- lower wins at claim time
  max_dials_per_lead integer,             -- override; must be <= program's
  min_rest_hours     integer,             -- override; must be >= program's
  calling_hours      jsonb,               -- override; must be within program's
  completed_reason   text,                -- budget_exhausted|pool_exhausted|ended_at|manual
  created_by         text,                -- console user email
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (ends_at > starts_at),
  check (budget_usd is not null or dial_budget is not null)
);

create index if not exists campaigns_program_idx on campaigns (program_id, status);

-- ----------------------------------------------------------- campaign_leads
-- Enrollment ledger: which leads a campaign owns and their cadence state.

create table if not exists campaign_leads (
  campaign_id     uuid not null references campaigns (id),
  lead_id         uuid not null references leads (id),
  status          text not null default 'active' check (status in
                  ('active','exhausted','completed','opted_out','removed')),
  attempts_done   integer not null default 0,
  last_attempt_at timestamptz,
  enrolled_at     timestamptz not null default now(),
  primary key (campaign_id, lead_id)
);

-- One ACTIVE campaign per lead — the one-call-center-per-lead rule, internalized.
create unique index if not exists campaign_leads_one_active_idx
  on campaign_leads (lead_id) where status = 'active';

create index if not exists campaign_leads_campaign_idx on campaign_leads (campaign_id, status);

-- ------------------------------------------------------------ campaign_days
-- Nightly pacing plan: one row per campaign per calling day, with the audit of
-- WHY the number is what it is (the binding-constraint KPI).

create table if not exists campaign_days (
  campaign_id        uuid not null references campaigns (id),
  plan_date          date not null,
  planned_dials      integer not null,
  binding_constraint text not null check (binding_constraint in
                     ('budget','pool','program_daily','did_capacity','concurrency','buyer_caps')),
  inputs             jsonb not null default '{}',  -- all five min() terms, for the dashboard
  actual_dials       integer not null default 0,
  actual_spend_usd   numeric(10,2),
  computed_at        timestamptz not null default now(),
  primary key (campaign_id, plan_date)
);

-- ---------------------------------------------------------------- dial_jobs
-- The queue: exactly one open row per (campaign, lead) — the NEXT attempt.
-- Rescheduling is event-driven off dispositions (campaign-delivery.md §5).

create table if not exists dial_jobs (
  id           bigint generated always as identity primary key,
  campaign_id  uuid not null references campaigns (id),
  lead_id      uuid not null references leads (id),
  attempt_no   integer not null,
  not_before   timestamptz not null,
  daypart_pref text check (daypart_pref in ('morning','afternoon','evening')),
  priority     integer not null default 100,  -- denormalized campaign priority for the claim sort
  state        text not null default 'due' check (state in
               ('due','claimed','dialing','done','expired','cancelled')),
  claimed_at   timestamptz,
  claimed_by   text,                          -- pacer worker id
  call_id      uuid references calls (id),
  created_at   timestamptz not null default now(),
  unique (campaign_id, lead_id, attempt_no)
);

-- The pacer's claim scan (FOR UPDATE SKIP LOCKED over due rows, priority order).
create index if not exists dial_jobs_due_idx
  on dial_jobs (priority, not_before) where state = 'due';

-- ------------------------------------------------------------- zip_timezones
-- Lead-timezone source: ZIP-based (✅ Sean 8/17), keyed on ZIP3 prefix (~1K rows;
-- phone NPA is the runtime fallback for leads with no ZIP). Seeded at apply time
-- by a companion script from a public ZIP3->IANA dataset, not hand-typed here.

create table if not exists zip_timezones (
  zip3 text primary key check (zip3 ~ '^[0-9]{3}$'),
  tz   text not null              -- IANA, e.g. 'America/Los_Angeles'
);

-- ------------------------------------------------------- calls back-references
-- calls.campaign_id (text) is vestigial ViciDial vocabulary; the real FK is new.

alter table calls add column if not exists campaign_uuid uuid references campaigns (id);
alter table calls add column if not exists dial_job_id   bigint references dial_jobs (id);

create index if not exists calls_campaign_uuid_idx on calls (campaign_uuid);

-- ------------------------------------------------------ campaign_did_coverage
-- Per campaign x NPA: demand (active enrolled leads) vs supply (eligible DIDs and
-- their daily capacity). Feeds the L2 plan clamp and did-pool-purchase suggestions.
-- Warming DIDs count at the warm-up rate, not their full budget.

create or replace view campaign_did_coverage as
with lead_npas as (
  select cl.campaign_id,
         left(right(phone_digits(l.phone_number), 10), 3) as npa,
         count(*) as active_leads
  from campaign_leads cl
  join leads l on l.id = cl.lead_id
  where cl.status = 'active'
  group by 1, 2
),
did_cap as (
  select left(npa_nxx, 3) as npa,
         count(*) as eligible_dids,
         sum(case when status = 'warming' or warmup_until > now()
                  then least(daily_budget,
                             coalesce((select value::int from dialer_config
                                       where key = 'did_warmup_daily_budget'), 5))
                  else daily_budget end) as daily_capacity
  from dids
  where status in ('warming','active')
  group by 1
)
select ln.campaign_id,
       ln.npa,
       ln.active_leads,
       coalesce(dc.eligible_dids, 0)  as eligible_dids,
       coalesce(dc.daily_capacity, 0) as daily_did_capacity
from lead_npas ln
left join did_cap dc using (npa);

-- ----------------------------------------------------------- campaign_spend
-- v1 spend = dials x est cost/dial (campaign's own, else config default). The
-- planner upgrades est_cost_per_dial from measured actuals; a duration/TTS-rate
-- cost model replaces this view when real Telnyx billing rates are wired in.

create or replace view campaign_spend as
select c.id as campaign_id,
       count(k.id) as dials,
       round(count(k.id) * coalesce(c.est_cost_per_dial,
             (select value::numeric from dialer_config
              where key = 'campaign_est_cost_per_dial'), 0.04), 2) as est_spend_usd
from campaigns c
left join calls k on k.campaign_uuid = c.id
group by c.id;

-- ---------------------------------------------------------------------- RLS
-- House pattern (0007): member-read via the program->tenant membership join;
-- all writes through service-role RPCs.

alter table campaigns      enable row level security;
alter table campaign_leads enable row level security;
alter table campaign_days  enable row level security;
alter table dial_jobs      enable row level security;

create policy camp_member_read on campaigns
  for select using (exists (
    select 1 from programs p join console_memberships m on m.tenant_id = p.tenant_id
    where p.id = campaigns.program_id and m.user_id = auth.uid()));

create policy cl_member_read on campaign_leads
  for select using (exists (
    select 1 from campaigns c
    join programs p on p.id = c.program_id
    join console_memberships m on m.tenant_id = p.tenant_id
    where c.id = campaign_leads.campaign_id and m.user_id = auth.uid()));

create policy cd_member_read on campaign_days
  for select using (exists (
    select 1 from campaigns c
    join programs p on p.id = c.program_id
    join console_memberships m on m.tenant_id = p.tenant_id
    where c.id = campaign_days.campaign_id and m.user_id = auth.uid()));

create policy dj_member_read on dial_jobs
  for select using (exists (
    select 1 from campaigns c
    join programs p on p.id = c.program_id
    join console_memberships m on m.tenant_id = p.tenant_id
    where c.id = dial_jobs.campaign_id and m.user_id = auth.uid()));

-- -------------------------------------------------------------- config seeds

insert into dialer_config (key, value) values
  ('campaign_est_cost_per_dial', '0.04'),  -- placeholder; replace with measured
  ('campaign_open_boost',        '2.0'),   -- TD-replica intraday shape; re-derive on our stream
  ('did_warmup_daily_budget',    '5')      -- warm-up ramp week-1 rate (did-lifecycle.md §2.5)
on conflict (key) do nothing;

select 'migration 0010 applied' as status;
