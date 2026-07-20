-- ccai initial schema
-- Principle from scoping (2026-07-17): store everything at the most granular
-- level — every dial, every event — and derive all reporting from it.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Leads: everything delivered to ccai (LeadConduit fresh + revive uploads)
-- ---------------------------------------------------------------------------
create table leads (
  id            uuid primary key default gen_random_uuid(),
  oleadid       text,                              -- FiveStrata cross-system key (techss_ write-back)
  phone_number  text not null,
  first_name    text,
  last_name     text,
  address1      text,
  city          text,
  state         text,
  postal_code   text,
  email         text,
  vertical      text,                              -- bathroom | windows | home_warranty | ...
  lead_type     text not null default 'revive'
                check (lead_type in ('fresh', 'revive')),
  source        text,
  sub_source    text,                              -- FS code; required for sub-source slicing
  status        text not null default 'received',  -- received | queued | vici_error | dnc | completed
  dnc           boolean not null default false,
  vicidial_lead_id text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index leads_oleadid_idx    on leads (oleadid);
create index leads_phone_idx      on leads (phone_number);
create index leads_vertical_idx   on leads (vertical, lead_type);
create index leads_sub_source_idx on leads (sub_source);
create index leads_created_idx    on leads (created_at);

-- ---------------------------------------------------------------------------
-- Clients + transfer priorities (interim mirror of Command Center controls)
-- ---------------------------------------------------------------------------
create table clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  vertical      text not null,
  branding_name text,           -- spoken client name; null = generic "trusted partner"
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table transfer_priorities (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients (id),
  vertical    text not null,
  postal_code text not null,
  weight      integer not null default 1,   -- higher wins; supports RPL-style bidding later
  daily_cap   integer,
  created_at  timestamptz not null default now(),
  unique (client_id, vertical, postal_code)
);

create index transfer_priorities_lookup_idx on transfer_priorities (vertical, postal_code);

-- ---------------------------------------------------------------------------
-- Scripts / prompts: first-class variant storage for A/B testing
-- (hard-coded response options vs. generalized-guideline prompts)
-- ---------------------------------------------------------------------------
create table scripts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  vertical   text not null,
  kind       text not null check (kind in ('generative', 'soundboard', 'hybrid')),
  content    text not null,     -- prompt text or script body
  version    integer not null default 1,
  active     boolean not null default false,
  created_at timestamptz not null default now(),
  unique (name, version)
);

-- ---------------------------------------------------------------------------
-- Voice packs: swappable unit of clips + TTS voice + script version
-- (soundboard-first hybrid — canned clips in the AI voice, TTS for long tail)
-- ---------------------------------------------------------------------------
create table voice_packs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  script_id  uuid references scripts (id),
  tts_voice  text not null,     -- TTS voice identifier used for long-tail synthesis
  version    integer not null default 1,
  active     boolean not null default false,
  created_at timestamptz not null default now(),
  unique (name, version)
);

create table voice_clips (
  id            uuid primary key default gen_random_uuid(),
  voice_pack_id uuid not null references voice_packs (id),
  intent        text not null,  -- what the clip is for (greeting, objection_price, brand_client, ...)
  transcript    text not null,
  audio_url     text,
  duration_sec  numeric,
  created_at    timestamptz not null default now()
);

create index voice_clips_pack_idx on voice_clips (voice_pack_id, intent);

-- ---------------------------------------------------------------------------
-- DID pool: platform enforces ~1,500-dial retirement natively —
-- a differentiator no current call center offers
-- ---------------------------------------------------------------------------
create table dids (
  id               uuid primary key default gen_random_uuid(),
  phone_number     text not null unique,
  telnyx_number_id text,
  dial_count       integer not null default 0,
  max_dials        integer not null default 1500,
  status           text not null default 'active'
                   check (status in ('active', 'cooling', 'retired')),
  acquired_at      timestamptz not null default now(),
  retired_at       timestamptz
);

create index dids_status_idx on dids (status, dial_count);

-- ---------------------------------------------------------------------------
-- Calls: one row per dial — the rollup all KPIs derive from
-- (SPH, dials/hour, contact rate, completes, real-vs-fake contact)
-- ---------------------------------------------------------------------------
create table calls (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid references leads (id),
  script_id             uuid references scripts (id),
  voice_pack_id         uuid references voice_packs (id),
  did_id                uuid references dids (id),
  telnyx_call_control_id text,
  telnyx_call_session_id text,
  vicidial_uniqueid     text,
  campaign_id           text,
  agent_id              text,                -- VICIdial agent user or AI agent identifier
  direction             text not null default 'outbound'
                        check (direction in ('outbound', 'inbound', 'transfer')),
  started_at            timestamptz,
  answered_at           timestamptz,
  ended_at              timestamptz,
  duration_sec          integer,
  disposition           text,
  contact_quality       text check (contact_quality in ('human', 'ivr', 'voicemail', 'spam', 'unknown')),
  transferred_client_id uuid references clients (id),
  recording_url         text,
  canned_seconds        numeric,  -- clip playback time (cheap)
  tts_seconds           numeric,  -- synthesized time (expensive) — the split-point metric
  created_at            timestamptz not null default now()
);

create index calls_lead_idx     on calls (lead_id);
create index calls_started_idx  on calls (started_at);
create index calls_disp_idx     on calls (disposition, started_at);
create index calls_tccid_idx    on calls (telnyx_call_control_id);

-- ---------------------------------------------------------------------------
-- Call turns: per-turn decision log — context -> clip (or TTS) -> outcome.
-- The AI replaces the human soundboard operator, so every clip selection is a
-- logged decision; this is the optimization loop, and learnings transfer to
-- the human soundboard floors.
-- ---------------------------------------------------------------------------
create table call_turns (
  id          bigint generated always as identity primary key,
  call_id     uuid not null references calls (id),
  turn_index  integer not null,
  context     jsonb not null default '{}',  -- what the AI heard/knew going into the turn
  source      text not null check (source in ('canned', 'tts')),
  clip_id     uuid references voice_clips (id),  -- set when source = 'canned'
  tts_text    text,                              -- set when source = 'tts'
  audio_sec   numeric,
  outcome     text,                              -- how the prospect responded / turn result
  occurred_at timestamptz not null default now(),
  unique (call_id, turn_index)
);

create index call_turns_clip_idx on call_turns (clip_id);

-- ---------------------------------------------------------------------------
-- Call events: raw, append-only telephony event log (Telnyx webhooks et al.)
-- Highest-volume table; aggregate/archive as it ages if needed.
-- ---------------------------------------------------------------------------
create table call_events (
  id              bigint generated always as identity primary key,
  call_id         uuid references calls (id),
  call_control_id text,
  call_session_id text,
  event_type      text not null,
  occurred_at     timestamptz not null,
  payload         jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index call_events_call_idx     on call_events (call_id);
create index call_events_ccid_idx     on call_events (call_control_id);
create index call_events_occurred_idx on call_events (occurred_at);
create index call_events_type_idx     on call_events (event_type, occurred_at);
