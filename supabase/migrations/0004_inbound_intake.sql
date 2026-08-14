-- 0004: inbound intake — schema for the five FiveStrata→AICC inbound APIs
-- defined in Joseph's integration guide (docs/integrations/callcenter-
-- integration-guide.md §3): ZCWL bulk sync, fresh lead ingestion (per-lead
-- max_attempts), undo/delete by OLeadID, DNC/unDNC immediate suppression.
-- Served by the fivestrata-inbound Edge Function.
--
-- Shared-with-V1 project: additive only. NOTE the V1 object `zip_allowlist`
-- already exists — our ZCWL table is deliberately named `zcwl_zips`.
--
-- Hardened per adversarial review 2026-08-14: RPC execute revoked from
-- anon/authenticated (PostgREST /rpc would otherwise expose dnc_set to the
-- public anon key — un-DNC hole), RLS on leads, advisory lock serializing
-- ZCWL syncs, DNC-at-ingest trigger (closes the check-then-insert race and
-- the fail-open lookup), search_path pinned on all functions.
--
-- Apply: node scripts/db-apply.ts supabase/migrations/0004_inbound_intake.sql
-- (idempotent — safe to re-run).

-- ---------------------------------------------------------------------------
-- leads: integration-contract fields (guide §3.2) + soft delete (§3.3)
-- ---------------------------------------------------------------------------
alter table leads
  add column if not exists phone_code       text,
  add column if not exists address3         text,
  add column if not exists country_code     text,
  add column if not exists fscode1          text,
  add column if not exists fscode2          text,
  add column if not exists vendor_lead_code text,
  add column if not exists max_attempts     integer check (max_attempts is null or max_attempts > 0),  -- per-lead cap pushed by FiveStrata; pacer must enforce, never hard-code
  add column if not exists removed_at       timestamptz;  -- soft delete: non-null = un-dialable/un-routable/un-transferable

alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check
  check (status in ('received', 'queued', 'vici_error', 'dnc', 'completed', 'removed'));

-- Service-role-only access (RLS on, no policies): leads carries consumer PII
-- and 0001 shipped without RLS. The platform service and edge functions use
-- the service role, which bypasses RLS; anon/authenticated see nothing.
alter table leads enable row level security;

create index if not exists leads_removed_idx on leads (removed_at) where removed_at is not null;

-- Race-safe idempotency: at most one LIVE lead per oleadid (removed copies
-- may repeat — a re-send after a confirmed remove is legitimately a new lead).
-- Verified before apply that no existing live duplicates block this.
create unique index if not exists leads_oleadid_live_uniq
  on leads (oleadid) where removed_at is null and oleadid is not null;

-- Canonical phone form for matching: digits only, NANP country prefix
-- stripped (a lead arriving as "+1 5551230001" must match a DNC push for
-- "5551230001" — live-test finding 8/14). The Edge Function mirrors the same
-- rule in TS; keep the two in lockstep.
-- WARNING: leads_phone_digits_idx is built on this function. Any semantic
-- change via CREATE OR REPLACE does NOT rebuild the index — you must REINDEX
-- INDEX leads_phone_digits_idx afterwards or DNC matching silently breaks.
create or replace function phone_digits(p text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when length(d) = 11 and left(d, 1) = '1' then substr(d, 2)
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) s
$$;

-- DNC pushes match leads by canonical digits; expression index keeps the
-- dnc_set() flip from scanning the table.
create index if not exists leads_phone_digits_idx
  on leads (phone_digits(phone_number));

-- ---------------------------------------------------------------------------
-- zcwl_zips: the dialing ZIP allowlist (guide §3.1). Replaced wholesale per
-- sync via zcwl_sync() so a partial failure can never leave a half-applied
-- list visible. list_name keys per-program allowlists AND lets the test
-- battery run against 'test' without touching the live 'default' list.
-- ---------------------------------------------------------------------------
create table if not exists zcwl_zips (
  list_name text not null default 'default',
  zip       text not null,
  synced_at timestamptz not null default now(),
  primary key (list_name, zip)
);

alter table zcwl_zips enable row level security;  -- service-role only, like dialer_config

create or replace function zcwl_sync(p_zips text[], p_list text default 'default')
returns integer
language plpgsql
set search_path = public
as $$
declare
  n integer;
begin
  -- Serialize per-list: without this, two overlapping syncs under READ
  -- COMMITTED can commit a merged (union) list — each misses the other's
  -- inserts (adversarial-review finding 4).
  perform pg_advisory_xact_lock(hashtext('zcwl_' || p_list));
  delete from zcwl_zips where list_name = p_list;
  insert into zcwl_zips (list_name, zip)
    select distinct p_list, trim(z)
    from unnest(p_zips) as z
    -- Sanity filter, not a format contract: 3–10 alphanumerics (covers US
    -- ZIP and Canadian postal — CD is Canadian). Garbage/blank entries drop
    -- silently; the returned count tells the caller what was kept.
    where trim(coalesce(z, '')) ~ '^[0-9A-Za-z][0-9A-Za-z -]{1,8}[0-9A-Za-z]$';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- dnc_numbers: push-suppressed numbers (guide §3.4–3.5), canonical-digits key.
-- dnc_set() applies suppression atomically: registry row + flip leads.dnc on
-- every matching lead. The dial queue must check leads.dnc at pop time —
-- immediate effect, not batch — and dnc_numbers is the backstop for the
-- narrow window where a lead insert and a DNC push commit concurrently.
-- NOTE: dnc_set only flips the dnc boolean; it does not touch status. If any
-- future path sets status='dnc', unDNC restoration must be extended to match
-- (contract §3.5), or eligibility won't actually restore.
-- ---------------------------------------------------------------------------
create table if not exists dnc_numbers (
  phone_digits text primary key,
  source       text not null default 'fivestrata_push',
  created_at   timestamptz not null default now()
);

alter table dnc_numbers enable row level security;

create or replace function dnc_set(p_phone text, p_dnc boolean)
returns integer
language plpgsql
set search_path = public
as $$
declare
  digits text;
  n integer;
begin
  digits := phone_digits(p_phone);
  if length(digits) < 7 then
    raise exception 'invalid phone number';  -- surfaces as P0001; function maps to 422
  end if;
  if p_dnc then
    insert into dnc_numbers (phone_digits) values (digits)
    on conflict (phone_digits) do nothing;
    update leads set dnc = true, updated_at = now()
      where phone_digits(phone_number) = digits and dnc = false;
  else
    delete from dnc_numbers where phone_digits = digits;
    update leads set dnc = false, updated_at = now()
      where phone_digits(phone_number) = digits and dnc = true;
  end if;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- DNC-at-ingest, in the database where it can't fail open: a lead inserted
-- for an already-suppressed number lands pre-flagged, atomically with the
-- insert (closes the Edge Function's check-then-insert race).
create or replace function leads_dnc_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not new.dnc then
    new.dnc := exists (
      select 1 from dnc_numbers where dnc_numbers.phone_digits = phone_digits(new.phone_number)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists leads_dnc_guard on leads;
create trigger leads_dnc_guard
  before insert on leads
  for each row execute function leads_dnc_guard();

-- ---------------------------------------------------------------------------
-- Lock the RPC surface down: PostgREST exposes public functions at
-- /rest/v1/rpc/* with EXECUTE granted to PUBLIC by default — the anon key
-- must not be able to call dnc_set (un-DNC hole) or zcwl_sync. The service
-- role keeps access via its default grants.
-- ---------------------------------------------------------------------------
revoke execute on function phone_digits(text) from public, anon, authenticated;
revoke execute on function zcwl_sync(text[], text) from public, anon, authenticated;
revoke execute on function dnc_set(text, boolean) from public, anon, authenticated;
revoke execute on function leads_dnc_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- inbound_events: append-only audit of authenticated inbound API traffic
-- (store everything, derive later). summary is intentionally small — for
-- ZCWL it holds counts, not the 10k+ ZIP payload. Unauthenticated noise
-- (401s from internet scanners) is NOT persisted — function logs only.
-- ---------------------------------------------------------------------------
create table if not exists inbound_events (
  id          bigint generated always as identity primary key,
  endpoint    text not null,          -- zcwl | leads | leads_remove | dnc | undnc | unknown
  status      integer not null,       -- HTTP status we returned
  summary     jsonb not null default '{}',
  source_ip   text,
  received_at timestamptz not null default now()
);

alter table inbound_events enable row level security;

create index if not exists inbound_events_endpoint_idx on inbound_events (endpoint, received_at);

-- ---------------------------------------------------------------------------
-- Config keys used by the fivestrata-inbound function (dialer_config):
--   inbound_api_key    — shared key FiveStrata presents in x-api-key.
--                        Exception to 0003's non-secret rule, accepted because
--                        Management-API secret-setting 403s on Sean's org role:
--                        a key WE mint, single-purpose, rotatable (one UPDATE;
--                        warm isolates re-read within 60s or on first mismatch).
--                        Seeded by scripts/inbound-key-seed.ts; value lives in
--                        C:\Claude\aicc-inbound-env.sh (outside all repos).
--   inbound_ip_enforce — 'true' to require the 9 FiveStrata source IPs
--                        (guide §2); leave unset/false during testing. The
--                        function FAILS CLOSED (503) if this read errors.
--                        x-forwarded-for is gateway-controlled on Supabase
--                        (verified 8/14: spoofed client XFF is overwritten).
-- ---------------------------------------------------------------------------
