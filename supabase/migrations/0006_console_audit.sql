-- 0006_console_audit.sql
-- Audit log for every console mutation (control-panel scope: "every mutation
-- audit-logged"). ADDITIVE ONLY — shared V1 project rules apply.
-- Writes: service role only (console server actions). Reads: tenant admins.

create table if not exists console_audit_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,                 -- auth.users.id
  user_email text not null,
  action     text not null,                 -- 'config.set', 'dnc.add', 'lead.upload', ...
  target     text not null,                 -- e.g. the dialer_config key, phone last-4, file name
  detail     jsonb not null default '{}',   -- old/new values for non-secret targets
  created_at timestamptz not null default now()
);

create index if not exists console_audit_time_idx on console_audit_log (created_at desc);

alter table console_audit_log enable row level security;

create policy audit_admin_read on console_audit_log
  for select using (exists (
    select 1 from console_memberships m
    where m.user_id = auth.uid() and m.role = 'admin'));
