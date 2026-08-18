-- 0009: per-DID CUSUM fast-burn detector (did-lifecycle.md §3 Trigger statistics, tier 1)
-- Sean 8/17: "deserves to be built sooner than later."
-- DB-side BY DESIGN: a trigger on call_events hangup inserts — zero changes to
-- telnyx-agent/telnyx-webhook (parallel TTS work owns the agent right now), and the
-- statistic runs no matter which code path produced the dial.
-- Additive only — shared-with-V1 project; call_events/dids are OUR tables (0001).

alter table dids
  add column if not exists cusum_score    numeric not null default 0,
  add column if not exists cusum_fired_at timestamptz;

-- Tunable parameters (defaults from the doc: p0=1.5% healthy, p1=10% burned, h=3).
-- up = ln(p1/p0) = ln(.10/.015) ~= 1.897 ; down = ln((1-p1)/(1-p0)) = ln(.90/.985) ~= -0.0903
insert into dialer_config (key, value) values
  ('did_cusum_up',   '1.897'),
  ('did_cusum_down', '0.0903'),
  ('did_cusum_h',    '3')
on conflict (key) do nothing;

create or replace function did_cusum_update() returns trigger
language plpgsql as $$
declare
  v_from    text;
  v_cause   text;
  v_up      numeric;
  v_down    numeric;
  v_h       numeric;
  v_inc     numeric;
begin
  v_from  := new.payload->>'from';
  if v_from is null then return new; end if;
  v_cause := coalesce(new.payload->>'hangup_cause', '');

  select coalesce((select value::numeric from dialer_config where key = 'did_cusum_up'),   1.897) into v_up;
  select coalesce((select value::numeric from dialer_config where key = 'did_cusum_down'), 0.0903) into v_down;
  select coalesce((select value::numeric from dialer_config where key = 'did_cusum_h'),    3) into v_h;

  -- D2 decline bucket burns the DID; everything else decays the score toward 0.
  -- (bad-number causes count against the LIST, not the DID -> they decay too)
  v_inc := case when v_cause in ('call_rejected','unspecified') then v_up else -v_down end;

  update dids
     set cusum_score    = greatest(0, cusum_score + v_inc),
         status         = case when greatest(0, cusum_score + v_inc) >= v_h
                                and status in ('warming','active')
                               then 'quarantined' else status end,
         cusum_fired_at = case when greatest(0, cusum_score + v_inc) >= v_h
                                and status in ('warming','active')
                                and cusum_fired_at is null
                               then now() else cusum_fired_at end
   where phone_number = v_from
     and status not in ('retired');

  return new;
end $$;

drop trigger if exists call_events_did_cusum on call_events;
create trigger call_events_did_cusum
  after insert on call_events
  for each row
  when (new.event_type = 'call.hangup')
  execute function did_cusum_update();

-- Expose the accumulator in the health view (same body as 0008 + cusum columns)
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
            else 0 end                                                                 as decline_pct,
       d.cusum_score,
       d.cusum_fired_at
from dids d
left join hangups h on h.from_number = d.phone_number
group by d.id;

select 'migration 0009 applied' as status;
