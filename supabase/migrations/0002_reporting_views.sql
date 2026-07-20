-- Reporting views emulating Ashley's daily dashboard (see docs/reporting/kb-wi-dashboard-spec.md).
-- Principle: facts stay granular in calls/call_events/leads; these views ARE the dashboard.
--
-- Disposition codes below are PLACEHOLDERS ('QUALIFIED', 'SALE', ...) until the KB disposition
-- dictionary lands (open-questions T6); adjust the filter predicates, not the view shapes.

-- ---------------------------------------------------------------------------
-- v_daily_results — mirrors the DailyResults fact grain:
-- call date × vertical × fresh/revive × sub-source × state
-- ---------------------------------------------------------------------------
create or replace view v_daily_results as
select
  date(c.started_at)                                                as call_date,
  l.vertical,
  l.lead_type,
  l.sub_source,
  l.state,
  count(*)                                                          as dials,
  sum(coalesce(c.duration_sec, 0)) / 3600.0                         as talk_hours,
  count(*) filter (where c.contact_quality = 'human')               as contacts,
  count(*) filter (where c.disposition = 'QUALIFIED')               as qualified,
  count(*) filter (where c.disposition = 'SALE')                    as sales,
  count(*) filter (where c.disposition = 'ABANDON')                 as abandons,
  -- transfer funnel: tAtt -> tSucc -> tAgree (event types per spec §Transfer funnel)
  count(*) filter (where exists (select 1 from call_events e
    where e.call_id = c.id and e.event_type = 'transfer.attempted')) as t_att,
  count(*) filter (where exists (select 1 from call_events e
    where e.call_id = c.id and e.event_type = 'transfer.bridged'))   as t_succ,
  count(*) filter (where c.transferred_client_id is not null)       as t_agree,
  -- AI-cost telemetry (no KB equivalent — richer than the source dashboard)
  sum(coalesce(c.canned_seconds, 0)) / 3600.0                       as canned_hours,
  sum(coalesce(c.tts_seconds, 0)) / 3600.0                          as tts_hours
from calls c
left join leads l on l.id = c.lead_id
where c.started_at is not null
group by 1, 2, 3, 4, 5;

-- ---------------------------------------------------------------------------
-- v_rdaily — mirrors the rDaily report tab (KPI ratios per day; roll up in BI)
-- "Hours" here = talk hours; the paid-hours analogue for an AI floor is an
-- open definition (spec open item 4).
-- ---------------------------------------------------------------------------
create or replace view v_rdaily as
select
  call_date,
  vertical,
  lead_type,
  sum(talk_hours)                                        as hours,
  sum(qualified)                                         as qs,
  sum(qualified) / nullif(sum(talk_hours), 0)            as sph,
  sum(qualified) / nullif(sum(dials), 0)::numeric        as spd,
  sum(qualified) / nullif(sum(contacts), 0)::numeric     as s_c_pct,
  sum(t_agree)                                           as transfers,
  sum(t_agree) / nullif(sum(talk_hours), 0)              as tph,
  sum(dials)                                             as dials,
  sum(dials) / nullif(sum(talk_hours), 0)                as dph,
  sum(contacts)                                          as contacts,
  sum(contacts) / nullif(sum(dials), 0)::numeric         as c_d_pct,
  sum(contacts) / nullif(sum(talk_hours), 0)             as contact_hr,
  sum(t_succ) / nullif(sum(t_att), 0)::numeric           as t_att_pct,
  sum(t_agree) / nullif(sum(t_succ), 0)::numeric         as t_agree_pct
from v_daily_results
group by 1, 2, 3;

-- ---------------------------------------------------------------------------
-- v_rlist — mirrors the rList cohort tab: consumption by lead received date.
-- "completes" = leads finished dialing; "still" = leads not yet complete;
-- "under_4" = still-active leads with fewer than 4 dial attempts (inventory).
-- ---------------------------------------------------------------------------
create or replace view v_rlist as
with lead_activity as (
  select
    l.id,
    date(l.created_at)  as received_date,
    l.vertical,
    l.lead_type,
    l.sub_source,
    l.state,
    l.status,
    count(c.id)                                                     as attempts,
    count(c.id) filter (where c.contact_quality = 'human')          as contacts,
    count(c.id) filter (where c.disposition = 'QUALIFIED')          as qualified,
    count(c.id) filter (where c.transferred_client_id is not null)  as transfers
  from leads l
  left join calls c on c.lead_id = l.id
  group by 1, 2, 3, 4, 5, 6, 7
)
select
  received_date,
  vertical,
  lead_type,
  sub_source,
  count(*)                                                     as received,
  sum(attempts)                                                as dials,
  sum(attempts) / nullif(count(*), 0)::numeric                 as dpr,
  count(*) filter (where status <> 'completed')                as still,
  count(*) filter (where status <> 'completed' and attempts < 4) as under_4,
  sum(qualified)                                               as qs,
  sum(qualified) / nullif(count(*), 0)::numeric                as q_pct,
  sum(transfers)                                               as transfers,
  sum(transfers) / nullif(count(*), 0)::numeric                as t_pct,
  sum(contacts)                                                as contacts,
  count(*) filter (where contacts > 0) / nullif(count(*), 0)::numeric as contact_pct,
  count(*) filter (where status = 'completed')                 as completes
from lead_activity
group by 1, 2, 3, 4;
