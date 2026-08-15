-- 0005_tenant_program_backbone.sql
-- Tenant / program / playbook model from docs/architecture/tenant-program-onboarding.md
-- (designed 2026-07-23, applied for the control-panel build — Sean 2026-08-14).
-- ADDITIVE ONLY: shared Supabase project with V1 — no drops, no renames of existing objects.
-- RLS: enabled on the NEW tables only (membership-scoped). Legacy tables (leads, calls, …)
-- keep their current access model until key usage is audited; console reads them
-- server-side only. The proposed clients→transfer_clients rename is DEFERRED (not additive).

-- ---------------------------------------------------------------- tenants & programs

create table if not exists tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,        -- 'fivestrata', 'autoweb'
  name        text not null,
  status      text not null default 'active' check (status in ('active','suspended')),
  created_at  timestamptz not null default now()
);

create table if not exists programs (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants (id),
  slug             text not null unique,   -- 'fs-bathroom-revive', 'aw-tradein'
  name             text not null,
  vertical         text,                   -- descriptive label, no longer a routing key
  product_profile  jsonb not null default '{}',
  playbook_version integer not null default 1,
  status           text not null default 'draft'
                   check (status in ('draft','testing','live','paused','retired')),
  calling_hours    jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists programs_tenant_idx on programs (tenant_id, status);

create table if not exists program_field_defs (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs (id),
  field_name  text not null,
  field_type  text not null check (field_type in ('text','number','boolean','date','enum')),
  required    boolean not null default false,
  is_pii      boolean not null default false,
  enum_values text[],
  unique (program_id, field_name)
);

-- ------------------------------------------------- canonical taxonomies + mappings

create table if not exists canonical_dispositions (
  code        text primary key,
  description text not null,
  counts_as_contact boolean not null default false,
  counts_as_success boolean not null default false
);

create table if not exists program_dispositions (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references programs (id),
  program_code   text not null,
  label          text,
  canonical_code text not null references canonical_dispositions (code),
  is_final       boolean not null default true,
  required_by_client boolean not null default false,
  unique (program_id, program_code)
);

create table if not exists canonical_tags (
  code        text primary key,
  description text not null
);

create table if not exists program_tags (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references programs (id),
  program_code   text not null,
  canonical_code text references canonical_tags (code),  -- null = program-local tag
  required_by_client boolean not null default false,
  unique (program_id, program_code)
);

-- Declared connections: config holds a secret *reference* (env var / vault key),
-- never the secret itself (org policy).
create table if not exists program_connections (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs (id),
  kind        text not null check (kind in
              ('lead_intake','transfer','results_delivery','recording_delivery','dnc_feed')),
  transport   text not null check (transport in
              ('leadconduit','http_webhook','sftp','s3','sip','pstn','db_writeback','batch_file')),
  config      jsonb not null default '{}',
  secret_ref  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ console users & RLS

-- Maps Supabase Auth users to tenants. role: admin > operator > viewer.
create table if not exists console_memberships (
  user_id    uuid not null,                -- auth.users.id
  tenant_id  uuid not null references tenants (id),
  role       text not null default 'viewer' check (role in ('admin','operator','viewer')),
  created_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

alter table tenants              enable row level security;
alter table programs             enable row level security;
alter table program_field_defs   enable row level security;
alter table program_dispositions enable row level security;
alter table program_tags         enable row level security;
alter table program_connections  enable row level security;
alter table console_memberships  enable row level security;
alter table canonical_dispositions enable row level security;
alter table canonical_tags       enable row level security;

-- Members see their own memberships; tenant rows they belong to; program rows of those
-- tenants. Canonical taxonomies are readable by any authenticated user. All writes go
-- through the service role (RPCs / Edge Functions) — no insert/update policies for users.
create policy cm_self_read on console_memberships
  for select using (user_id = auth.uid());

create policy tenants_member_read on tenants
  for select using (exists (
    select 1 from console_memberships m
    where m.tenant_id = tenants.id and m.user_id = auth.uid()));

create policy programs_member_read on programs
  for select using (exists (
    select 1 from console_memberships m
    where m.tenant_id = programs.tenant_id and m.user_id = auth.uid()));

create policy pfd_member_read on program_field_defs
  for select using (exists (
    select 1 from programs p join console_memberships m on m.tenant_id = p.tenant_id
    where p.id = program_field_defs.program_id and m.user_id = auth.uid()));

create policy pd_member_read on program_dispositions
  for select using (exists (
    select 1 from programs p join console_memberships m on m.tenant_id = p.tenant_id
    where p.id = program_dispositions.program_id and m.user_id = auth.uid()));

create policy pt_member_read on program_tags
  for select using (exists (
    select 1 from programs p join console_memberships m on m.tenant_id = p.tenant_id
    where p.id = program_tags.program_id and m.user_id = auth.uid()));

create policy pc_member_read on program_connections
  for select using (exists (
    select 1 from programs p join console_memberships m on m.tenant_id = p.tenant_id
    where p.id = program_connections.program_id and m.user_id = auth.uid()));

create policy cd_auth_read on canonical_dispositions
  for select using (auth.role() = 'authenticated');
create policy ct_auth_read on canonical_tags
  for select using (auth.role() = 'authenticated');

-- ------------------------------------- program_id plumbing on existing tables (nullable)

alter table leads                add column if not exists program_id uuid references programs (id);
alter table calls                add column if not exists program_id uuid references programs (id);
alter table transfer_priorities  add column if not exists program_id uuid references programs (id);
alter table dids                 add column if not exists program_id uuid references programs (id);
alter table scripts              add column if not exists program_id uuid references programs (id);
alter table voice_packs          add column if not exists program_id uuid references programs (id);
alter table clients              add column if not exists program_id uuid references programs (id);

create index if not exists leads_program_idx on leads (program_id);
create index if not exists calls_program_idx on calls (program_id);

-- ------------------------------------------------------------------------- seeds

insert into tenants (slug, name) values
  ('fivestrata', 'FiveStrata CV'),
  ('autoweb',    'AutoWeb')
on conflict (slug) do nothing;

update tenants set status = 'active' where slug = 'fivestrata';

insert into programs (tenant_id, slug, name, vertical, status)
select t.id, p.slug, p.name, p.vertical, p.status
from tenants t
join (values
  ('fivestrata', 'fs-bathroom-revive', 'Bathroom Remodel — Revive', 'bathroom',      'testing'),
  ('fivestrata', 'fs-windows-fresh',   'Windows — Fresh',           'windows',       'testing'),
  ('fivestrata', 'fs-hw',              'Home Warranty',             'home_warranty', 'draft'),
  ('autoweb',    'aw-tbd',             'AutoWeb — program TBD',     null,            'draft')
) as p(tenant_slug, slug, name, vertical, status) on p.tenant_slug = t.slug
on conflict (slug) do nothing;

-- Canonical disposition dictionary (curated; program-local extensions roll up to OTHER).
insert into canonical_dispositions (code, description, counts_as_contact, counts_as_success) values
  ('SALE_TRANSFER',         'Interested, warm-transferred and accepted by buyer', true,  true),
  ('QUALIFIED_NO_TRANSFER', 'Qualified interest but transfer not completed',      true,  false),
  ('NOT_INTERESTED',        'Contact reached, declined',                          true,  false),
  ('CALLBACK',              'Contact requested a later call',                     true,  false),
  ('DNC_REQUEST',           'Contact asked not to be called again',               true,  false),
  ('NO_ANSWER',             'No pickup',                                          false, false),
  ('VOICEMAIL',             'Voicemail reached (no message or message left)',     false, false),
  ('IVA_SPAM_BLOCK',        'Screening robot / spam interception',                false, false),
  ('BAD_NUMBER',            'Disconnected, wrong person, or invalid number',      false, false),
  ('OTHER',                 'Program-local disposition without a canonical home', false, false)
on conflict (code) do nothing;

-- Backfill existing rows onto FiveStrata programs by their legacy vertical key.
update leads l set program_id = p.id
from programs p
where l.program_id is null and p.vertical = l.vertical
  and p.slug like 'fs-%';

update calls c set program_id = l.program_id
from leads l
where c.program_id is null and c.lead_id = l.id and l.program_id is not null;

update transfer_priorities tp set program_id = p.id
from programs p
where tp.program_id is null and p.vertical = tp.vertical and p.slug like 'fs-%';
