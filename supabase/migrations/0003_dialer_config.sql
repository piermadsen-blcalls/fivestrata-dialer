-- 0003: dialer_config — tiny key/value config store for platform pieces that
-- can't read .env (edge functions, when Management-API secret-setting is
-- blocked by org role). Only NON-secret config belongs here (e.g. the Telnyx
-- *public* signing key, which is verification material); credentials stay in
-- .env / function secrets.
--
-- RLS enabled with NO policies on purpose: anon/authenticated see nothing;
-- the service role (edge functions, platform service) bypasses RLS.
--
-- Apply: Sean, dashboard SQL editor (shared-with-V1 project — additive only).
-- After applying, seed the webhook key (paste the TELNYX_PUBLIC_KEY value from .env):
--   insert into dialer_config (key, value) values ('telnyx_public_key', '<value>')
--   on conflict (key) do update set value = excluded.value, updated_at = now();

create table dialer_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table dialer_config enable row level security;

comment on table dialer_config is
  'AICC platform non-secret config KV. Service-role access only (RLS on, no policies).';
