-- 0008: DID lifecycle (docs/architecture/did-lifecycle.md, hitlist D5)
-- Additive only — shared-with-V1 project, never touch V1 objects.
-- States: screening -> warming -> active -> resting -> quarantined -> retired
-- Rest policy: quarantined DIDs rest to their renewal boundary, recover-or-release (Sean 8/17).

alter table dids
  add column if not exists npa_nxx            text generated always as (substring(phone_number from 3 for 6)) stored,
  add column if not exists daily_budget       integer not null default 20,
  add column if not exists warmup_until       timestamptz,
  add column if not exists acquisition_batch  text,
  add column if not exists screened_at        timestamptz,
  add column if not exists registered_cnam    boolean not null default false,
  add column if not exists registered_fcr     boolean not null default false,
  add column if not exists sms_capable        boolean not null default false,
  add column if not exists cnam               text,
  add column if not exists reputation_flags   jsonb not null default '{}'::jsonb,
  add column if not exists reputation_checked_at timestamptz,
  add column if not exists tenant_id          uuid references tenants (id);

-- Widen the status lifecycle (old check: active/cooling/retired; 'cooling' -> 'resting')
update dids set status = 'resting' where status = 'cooling';
alter table dids drop constraint if exists dids_status_check;
alter table dids add constraint dids_status_check
  check (status in ('screening','warming','active','resting','quarantined','retired'));

create index if not exists dids_npa_nxx_idx on dids (npa_nxx);
create index if not exists dids_tenant_idx  on dids (tenant_id, status);

-- Per-tenant CNAM (D8b, Sean 8/17: definitely yes). 15-char CNAM limit.
alter table tenants add column if not exists cnam text;
update tenants set cnam = 'FIVESTRATA' where slug = 'fivestrata' and cnam is null;
update tenants set cnam = 'AUTOWEB'    where slug = 'autoweb'    and cnam is null;

-- Per-DID health view (D5): internal signals from our own fact stream.
-- Decline bucket per D2 mapping: call_rejected + unspecified burn the DID;
-- bad-number causes count against the LIST (lead quality), not the DID.
create or replace view did_health as
with hangups as (
  select payload->>'from'         as from_number,
         payload->>'hangup_cause' as cause,
         occurred_at
  from call_events
  where event_type = 'call.hangup'
)
select d.id, d.phone_number, d.status, d.tenant_id, d.npa_nxx,
       d.dial_count, d.max_dials, d.daily_budget, d.warmup_until,
       d.acquisition_batch, d.screened_at, d.registered_cnam, d.registered_fcr,
       d.reputation_flags, d.reputation_checked_at,
       count(h.*)                                                                      as hangups_total,
       count(h.*) filter (where h.occurred_at > now() - interval '7 days')             as dials_7d,
       count(h.*) filter (where h.occurred_at >= date_trunc('day', now()))             as dials_today,
       count(h.*) filter (where h.cause in ('call_rejected','unspecified'))            as declines_total,
       count(h.*) filter (where h.cause in ('call_rejected','unspecified')
                            and h.occurred_at > now() - interval '7 days')             as declines_7d,
       count(h.*) filter (where h.cause in ('not_found','unallocated_number','invalid_number_format')) as bad_numbers_total,
       case when count(h.*) > 0
            then round(100.0 * count(h.*) filter (where h.cause in ('call_rejected','unspecified')) / count(h.*), 1)
            else 0 end                                                                 as decline_pct
from dids d
left join hangups h on h.from_number = d.phone_number
group by d.id;

select 'migration 0008 applied' as status;
