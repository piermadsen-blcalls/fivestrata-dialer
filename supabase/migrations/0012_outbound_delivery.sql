-- 0012: outbound delivery — the Call Center → FiveStrata half of Joseph's
-- integration guide (docs/integrations/callcenter-integration-guide.md §4):
-- pre-call/pre-transfer authorization logging (§4.1) and the post-call
-- disposition outbox (§4.2, "exactly once per call").
--
-- Shared-with-V1 project: additive only; no V1 objects touched.
-- Apply: node scripts/db-apply.ts supabase/migrations/0012_outbound_delivery.sql
-- (idempotent — safe to re-run).

-- ---------------------------------------------------------------------------
-- preauth_log: one row per Transfer Client API ping (per-dial grain — this is
-- fact-stream data). `raw` keeps the full response verbatim because the
-- guide's `result` value vocabulary is undocumented; we calibrate the
-- authorized/no_client classifier against real responses during gated live
-- validation, then can tighten it.
-- ---------------------------------------------------------------------------
create table if not exists preauth_log (
  id             bigint generated always as identity primary key,
  lead_id        uuid references leads (id),
  call_id        uuid references calls (id),
  oleadid        text,
  vertical       text not null,     -- canonical: bathroom | windows | home_warranty | solar
  zip            text,
  phone_digits   text,              -- canonical digits (joins via phone_digits(); full number lives on leads)
  outcome        text not null check (outcome in ('authorized', 'no_client', 'error', 'timeout')),
  result         text,              -- verbatim `result` field from the response
  fs_client_id   text,              -- ClientID
  client_name    text,
  transfer_code  text,
  transfer_phone text,
  brand_id       text,              -- must be echoed as brand_id_fives in the dispo (misbranding alert on mismatch)
  http_status    integer,
  latency_ms     integer,
  error          text,
  raw            jsonb,
  created_at     timestamptz not null default now()
);

alter table preauth_log enable row level security;  -- service-role only

create index if not exists preauth_log_lead_idx    on preauth_log (lead_id);
create index if not exists preauth_log_call_idx    on preauth_log (call_id);
create index if not exists preauth_log_created_idx on preauth_log (created_at);
create index if not exists preauth_log_outcome_idx on preauth_log (outcome, created_at);

-- ---------------------------------------------------------------------------
-- dispo_outbox: at-least-once delivery ledger with idempotent enqueue —
-- together they give the contract's "exactly once per call": one row per
-- dedupe_key (= call id when a call exists), payload frozen at enqueue,
-- retried until 2xx (contract: retry only on network failure or non-2xx),
-- 'failed' after max_attempts as an escalation flag, never silently dropped.
-- ---------------------------------------------------------------------------
create table if not exists dispo_outbox (
  id              bigint generated always as identity primary key,
  dedupe_key      text not null unique,   -- idempotency key; use the call id when one exists
  call_id         uuid references calls (id),
  lead_id         uuid references leads (id),
  oleadid         text not null,
  vertical        text not null,
  payload         jsonb not null,         -- exact body POSTed to Lead Intake, frozen at enqueue
  state           text not null default 'pending'
                  check (state in ('pending', 'delivering', 'delivered', 'failed')),
  attempts        integer not null default 0,
  max_attempts    integer not null default 25,  -- ~4 days at the worker's capped backoff, then 'failed' + human attention
  last_status     integer,
  last_error      text,
  next_attempt_at timestamptz not null default now(),
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table dispo_outbox enable row level security;  -- service-role only

-- One live dispo per call, even if callers pass inconsistent dedupe keys.
create unique index if not exists dispo_outbox_call_uniq
  on dispo_outbox (call_id) where call_id is not null;

create index if not exists dispo_outbox_due_idx
  on dispo_outbox (next_attempt_at) where state in ('pending', 'delivering');

-- ---------------------------------------------------------------------------
-- dispo_claim(): atomic work claim for outbox workers. SKIP LOCKED makes
-- concurrent workers safe (no double-claim); the lease (next_attempt_at
-- pushed forward at claim time) makes crashed workers safe — a 'delivering'
-- row whose lease expired is reclaimable. attempts counts claims, so a
-- worker that dies mid-delivery still consumes an attempt.
-- The lease must exceed the worker's HTTP timeout or a slow-but-alive
-- delivery could be double-claimed.
-- ---------------------------------------------------------------------------
create or replace function dispo_claim(p_limit integer default 10, p_lease_seconds integer default 120)
returns setof dispo_outbox
language plpgsql
set search_path = public
as $$
begin
  -- Guard hostile/buggy inputs: NULL p_limit would mean LIMIT ALL (whole
  -- backlog on one lease); a tiny/NULL lease creates instantly-reclaimable
  -- in-flight rows. The TS worker sizes the lease to its batch; this floor
  -- is the last line of defense.
  p_limit := least(greatest(coalesce(p_limit, 10), 1), 500);
  p_lease_seconds := greatest(coalesce(p_lease_seconds, 120), 30);
  return query
  update dispo_outbox o
     set state = 'delivering',
         attempts = o.attempts + 1,
         next_attempt_at = now() + make_interval(secs => p_lease_seconds),
         updated_at = now()
   where o.id in (
     select d.id from dispo_outbox d
      where d.state in ('pending', 'delivering')
        and d.next_attempt_at <= now()
      order by d.next_attempt_at
      for update skip locked
      limit p_limit
   )
  returning o.*;
end;
$$;

revoke execute on function dispo_claim(integer, integer) from public, anon, authenticated;
