-- 0011: one-strike dead-number exclusion support (campaign-delivery.md §3,
-- ✅ Sean 8/19 "ship it"). A phone whose dial ever ended in a carrier-confirmed
-- nonexistence cause is excluded at campaign compile after ONE occurrence — the
-- carrier already said the number doesn't exist, and TNS scores unassigned-number
-- dialing against the calling DID (did-lifecycle.md §3 upstream protection).
--
-- This partial expression index is the whole materialization: it contains only
-- the dead-cause hangup rows (a sliver of call_events), keyed by the canonical
-- digits of the dialed number, so the compile-time anti-join in
-- scripts/campaign-plan.ts is an index probe regardless of call_events size.
-- Cause set = D2's NUMBER_BAD bucket (scripts/did-decline-audit.ts) — these count
-- against the LIST, not the DID; keep the two in lockstep.
create index if not exists call_events_dead_number_idx
  on call_events (phone_digits(payload->>'to'))
  where event_type = 'call.hangup'
    and payload->>'hangup_cause' in ('unallocated_number', 'not_found', 'invalid_number_format');
