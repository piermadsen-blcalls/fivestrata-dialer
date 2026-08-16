-- 0007_sourcing_buyers_scripts.sql
-- Schema for docs/architecture/tenant-lead-sourcing.md (Sean 8/15):
-- lead batches + sources/price tiers, buyer-pool columns, script lines with
-- must-hit locking, per-program cadence + sourcing rules.
-- ADDITIVE ONLY — shared Supabase project with V1: no drops, no renames.

-- ------------------------------------------------------------------ sources

create table if not exists lead_sources (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants (id),   -- null = platform-owned (FiveStrata inventory)
  kind          text not null check (kind in
                ('tenant_upload','fs_aged','fs_live','purchased_dataset')),
  name          text not null unique,
  cost_per_lead numeric(8,4) not null default 0,
  vertical_origin text,
  fscode_pattern  text,                          -- crosswalk to FSCode1 for FS inventory
  consent_scope   text,                          -- programs outside this scope are DENIED
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------ batches

create table if not exists lead_batches (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references programs (id),
  source_id      uuid references lead_sources (id),
  file_name      text,
  uploaded_by    text not null,                  -- console user email
  mapping        jsonb not null default '{}',    -- column mapping used (saved profile)
  row_count      integer not null default 0,
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  reject_summary jsonb not null default '{}',    -- counts by reason, never lead values
  status         text not null default 'committed'
                 check (status in ('committed','undone')),
  created_at     timestamptz not null default now()
);

create index if not exists lead_batches_program_idx on lead_batches (program_id, created_at desc);

alter table leads add column if not exists batch_id         uuid references lead_batches (id);
alter table leads add column if not exists source_id        uuid references lead_sources (id);
alter table leads add column if not exists acquisition_cost numeric(8,4);
alter table leads add column if not exists payload          jsonb;  -- program-declared fields

create index if not exists leads_batch_idx  on leads (batch_id);
create index if not exists leads_source_idx on leads (source_id);

-- -------------------------------------------------------------- buyer pool

alter table clients add column if not exists program_id      uuid references programs (id); -- no-op if 0005 ran
alter table clients add column if not exists transfer_number text;    -- PSTN E.164 or SIP URI
alter table clients add column if not exists calling_hours   jsonb;   -- {tz, windows:[{dow,open,close}]}
alter table clients add column if not exists daily_cap       integer; -- client-level; per-zip caps stay in transfer_priorities
alter table clients add column if not exists priority        integer not null default 100;
alter table clients add column if not exists payout          numeric(8,2);

-- ------------------------------------------------------------ script lines

create table if not exists script_lines (
  id          uuid primary key default gen_random_uuid(),
  script_id   uuid not null references scripts (id),
  line_index  integer not null,
  tag         text not null default 'info' check (tag in
              ('greeting','info','question','ack','objection','close',
               'transfer_announce','must_hit')),
  text        text not null,
  must_hit    boolean not null default false,   -- compliance-locked: not A/B-testable,
  ab_testable boolean not null default true,    -- excluded from the clip-improvement loop
  created_at  timestamptz not null default now(),
  unique (script_id, line_index)
);

alter table voice_clips add column if not exists script_line_id uuid references script_lines (id);

-- must_hit implies not ab_testable (belt and suspenders for the 7/23 rule)
create or replace function script_lines_lock_must_hit() returns trigger
language plpgsql as $$
begin
  if new.must_hit then new.ab_testable := false; new.tag := 'must_hit'; end if;
  return new;
end $$;

drop trigger if exists script_lines_must_hit_lock on script_lines;
create trigger script_lines_must_hit_lock
  before insert or update on script_lines
  for each row execute function script_lines_lock_must_hit();

-- ------------------------------------------- program cadence + sourcing rules

alter table programs add column if not exists max_dials_per_lead integer not null default 5;
alter table programs add column if not exists min_rest_hours     integer not null default 24;
alter table programs add column if not exists daily_dial_budget  integer;
alter table programs add column if not exists source_rules       jsonb not null default '{}';
-- source_rules: {"source_ids": [uuid...], "cost_min": null|number,
--                "cost_max": null|number, "combine": true|false}

-- ---------------------------------------------------------------------- RLS

alter table lead_sources enable row level security;
alter table lead_batches enable row level security;
alter table script_lines enable row level security;

-- Marketplace rows (tenant_id null) are visible to any member; tenant rows to that tenant.
create policy ls_member_read on lead_sources
  for select using (
    tenant_id is null and exists (select 1 from console_memberships m where m.user_id = auth.uid())
    or exists (select 1 from console_memberships m
               where m.tenant_id = lead_sources.tenant_id and m.user_id = auth.uid()));

create policy lb_member_read on lead_batches
  for select using (exists (
    select 1 from programs p join console_memberships m on m.tenant_id = p.tenant_id
    where p.id = lead_batches.program_id and m.user_id = auth.uid()));

create policy sl_auth_read on script_lines
  for select using (auth.role() = 'authenticated');

-- --------------------------------------------------------------------- seeds

insert into lead_sources (tenant_id, kind, name, cost_per_lead, vertical_origin, consent_scope)
select t.id, 'tenant_upload', 'autoweb-uploads', 0, null, 'autoweb'
from tenants t where t.slug = 'autoweb'
on conflict (name) do nothing;

insert into lead_sources (tenant_id, kind, name, cost_per_lead, vertical_origin, fscode_pattern, consent_scope)
values
  (null, 'fs_aged', 'fs-revive-inventory', 0, null, null, 'fivestrata'),
  (null, 'fs_live', 'fs-fresh-feed',       0, null, null, 'fivestrata')
on conflict (name) do nothing;
