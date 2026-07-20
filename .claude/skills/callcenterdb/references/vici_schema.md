# VICIdial schema — shared structure across all 7 replicas

**Profiled 2026-07:** all 7 servers expose schema **`asterisk`**; 293 tables are common to every server (`catalogs/canonical_vici.md`). Engines are MariaDB 10.1–10.11. Per-server `custom_NNNN` tables are per-list custom-field tables (extra lead fields live there), and large logs may have `*_archive` twins.

General VICIdial (open-source predictive dialer, `asterisk` MySQL database) knowledge. **Once `references/catalogs/` is populated by the profiler, the profiled catalogs are the source of truth** — this file is the map, not the territory. Column lists below are the commonly-relevant subset, not exhaustive.

## The big four tables

### `vicidial_list` — leads loaded into the dialer  ⚠ PII-DENSE
One row per lead. Key columns: `lead_id` (PK), `entry_date`, `modify_date`, `status` (current disposition), `user` (last agent), `vendor_lead_code` (source-system lead id — our best cross-DB key, see cross_db_joins.md), `source_id`, `list_id`, `phone_number`, `called_count`, `last_local_call_time`, `entry_list_id`.
⚠ Also contains first/last name, address, city, state, postal_code, email, alt_phone, date_of_birth, comments, security_phrase — never SELECT * or copy these out.

### `vicidial_log` — outbound call log
One row per outbound call attempt that reached a lead. Key columns: `uniqueid`, `lead_id`, `list_id`, `campaign_id`, `call_date`, `start_epoch`, `end_epoch`, `length_in_sec`, `status` (disposition of THIS call), `phone_number` ⚠, `user` (agent), `term_reason`, `alt_dial`, `called_count`, `user_group`.
Filter on `call_date` (indexed) for time ranges.

### `vicidial_closer_log` — inbound / closer-queue call log
Same spirit as vicidial_log but for inbound/transferred calls: `closecallid`, `lead_id`, `campaign_id` (in-group), `call_date`, `length_in_sec`, `status`, `user`, `queue_seconds`, `xfercount`.

### `vicidial_agent_log` — agent activity
One row per agent-call interaction: `user`, `event_time`, `lead_id`, `campaign_id`, `pause_sec`, `wait_sec`, `talk_sec`, `dispo_sec`, `status`, `sub_status`, `pause_type`, `user_group`. The basis for agent productivity stats.

## Configuration / dimension tables

- `vicidial_campaigns` — campaign definitions (`campaign_id`, `campaign_name`, `active`, dial settings).
- `vicidial_lists` — list definitions (`list_id`, `list_name`, `campaign_id`, `active`). List naming is where business meaning (batch, fresh/revive on TD) usually hides.
- `vicidial_statuses` — system-wide status/disposition definitions (`status`, `status_name`, flags like `sale`, `dnc`, `human_answered`, `answering_machine`).
- `vicidial_campaign_statuses` — per-campaign custom dispositions. **This is where each call center's real disposition vocabulary lives** — expect differences across the 7 servers; the profiler captures these as safe lookups.
- `vicidial_users`, `vicidial_user_groups` — agents and groups.
- `vicidial_inbound_groups` — in-groups for inbound routing.

## Other logs worth knowing

- `vicidial_dial_log` — EVERY dial attempt (including no-connect), lower level than vicidial_log.
- `call_log` — asterisk channel-level log (all channels, both legs).
- `vicidial_xfer_log` — transfers (`lead_id`, `campaign_id`, `xfer_date`, closer fields).
- `vicidial_carrier_log` — SIP hangup causes per call; useful for connectivity/quality issues.
- `recording_log` — recordings metadata (`recording_id`, `lead_id`, `filename`, `location` URL, `length_in_sec`, `user`, `start_time`). Location URLs point at call-center infrastructure.
- `vicidial_hopper` — the live dial queue (transient).
- `vicidial_callbacks` — scheduled callbacks.
- `vicidial_list_archive` / `vicidial_log_archive` — some installs archive old rows; check per server (profiler will show which servers have them and their sizes).

## Common status codes (system defaults — per-campaign customs vary)

`NEW` never called · `QUEUE`/`INCALL` in progress · `DROP` dropped no agent · `XFER` transferred · `CALLBK` callback · `NA` no answer · `A`/`AA`/`AM` answering machine · `B` busy · `DC` disconnected · `DNC` do not call · `N` no answer autodial · `PDROP` pre-routing drop · `PU` call picked up. Sales and qualification statuses (e.g. `SALE`, `NI`, `NQ`, `DNQ`) are usually campaign-defined — pull actuals from `vicidial_campaign_statuses` (or the profiled safe lookups).

## Time semantics

`call_date`/`event_time` are server-local time. PROFILED: KB servers = EST/EDT, TD servers = MST. A 2-hour skew if you align them naively.
