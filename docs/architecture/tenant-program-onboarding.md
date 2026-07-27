# Tenant / Program Onboarding Topology

Scoping spec for the multi-client input topology. Requirement made explicit by Sean, 2026-07-23 (✅ requirement; design details below are ➤ proposed until reviewed with Pier).

Last updated: 2026-07-23.

## The requirement, stated explicitly

The platform's foundational schema and logic layer target the current FiveStrata business environment and rules — but they must be built so that **other verticals, or entirely different business units, can onboard with minimal (ideally zero) refactoring**. Examples on the table:

- Another home-solutions vertical (bathroom → windows → roofing → …)
- A different AutoWeb business unit entirely — e.g. soliciting **trade-in vehicle acquisition** — with its own product data, script, dispositions, and delivery target

Each such demand owner hands us some or all of: **arbitrary product information, a basic call script, an outbound connection, and required dispositions + call-sentiment tagging**. Onboarding should be **virtually self-serve**: a standard playbook package plus declared ETL connections, not a code change.

## Terminology (important — avoids a collision)

The existing `clients` table means **transfer buyers** — the companies that purchase warm transfers (Command Center's clients). That meaning stays. The new entities are:

| Term | Meaning | Example |
|---|---|---|
| **Tenant** | A business unit that commissions calling | FiveStrata CV; AutoWeb vehicle acquisition |
| **Program** | One onboardable calling engagement within a tenant: a product + script family + disposition contract + delivery target. The unit of onboarding, config, and reporting. | `fs-bathroom-revive`, `fs-windows-fresh`, `aw-tradein-acquisition` |
| **Playbook** | The versioned onboarding package a program submits | see below |

A program is roughly "vertical × motion" today, but deliberately more general: a trade-in program has no ZIP-based transfer priorities and no LeadConduit source, and the model must not care.

➤ Recommended rename to prevent ongoing confusion: `clients` → `transfer_clients` (or `buyers`). Cheap now, expensive later.

## What generalizes vs. what stays universal

**Universal (platform-owned, identical for every program):** the call fact stream (calls per-dial, call_turns per-turn, call_events), DID pool management and retirement, voice-pack mechanics, recording capture/retention, A/B test harness, pacing/cadence controls, the canonical disposition & sentiment taxonomies.

**Per-program (declared in the playbook, never hardcoded):** lead payload shape, scripts/disclosures, disposition and sentiment *mappings* onto the canonical sets, transfer/delivery connections, ETL feeds in and out, compliance parameters (calling hours, DNC policy, state rules), branding rules.

The test of success: **onboarding a new program touches zero TypeScript and zero DDL** — only rows in the program tables plus a validated playbook manifest.

## Canonical taxonomies + per-program mapping

This is the heart of the meta-level mapping. The platform keeps one **canonical disposition dictionary** (SALE/TRANSFER, QUALIFIED_NO_TRANSFER, NOT_INTERESTED, CALLBACK, NO_ANSWER, VOICEMAIL, IVA/SPAM, DNC_REQUEST, BAD_NUMBER, …) and one **canonical sentiment/tag set**. Every KPI (SPH, contact rate, connection rate, IVA classification) computes off the canonical codes — so cross-program reporting is free.

Each program then declares a mapping:

- `program_dispositions`: program's own code + label → canonical code, with flags (`is_final`, `counts_as_contact`, `counts_as_success`, `required_by_client`). FiveStrata's map comes from `techss_dl.callcenter_dispos` conventions; a trade-in program brings its own codes.
- `program_tags`: sentiment/QA tags the program requires (e.g. "price objection", "already sold vehicle"), each mapped to a canonical tag or flagged program-local.

Delivery translates canonical → program codes on the way out; the fact stream stores both.

## Proposed schema delta (migration 0002 sketch)

```sql
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,        -- 'fivestrata', 'autoweb'
  name        text not null,
  status      text not null default 'active' check (status in ('active','suspended')),
  created_at  timestamptz not null default now()
);

create table programs (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants (id),
  slug             text not null unique,   -- 'fs-bathroom-revive', 'aw-tradein'
  name             text not null,
  vertical         text,                   -- descriptive label, no longer a routing key
  product_profile  jsonb not null default '{}',  -- arbitrary product info from the playbook
  playbook_version integer not null default 1,
  status           text not null default 'draft'
                   check (status in ('draft','testing','live','paused','retired')),
  calling_hours    jsonb,                  -- tz + windows; compliance defaults
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Per-program lead payload schema: drives intake validation with zero code.
create table program_field_defs (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs (id),
  field_name  text not null,
  field_type  text not null check (field_type in ('text','number','boolean','date','enum')),
  required    boolean not null default false,
  is_pii      boolean not null default false,
  enum_values text[],
  unique (program_id, field_name)
);

create table canonical_dispositions (
  code        text primary key,            -- 'SALE_TRANSFER', 'IVA', 'DNC_REQUEST', ...
  description text not null,
  counts_as_contact boolean not null default false,
  counts_as_success boolean not null default false
);

create table program_dispositions (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references programs (id),
  program_code   text not null,            -- the code the client requires back
  label          text,
  canonical_code text not null references canonical_dispositions (code),
  is_final       boolean not null default true,
  required_by_client boolean not null default false,
  unique (program_id, program_code)
);

create table canonical_tags (
  code        text primary key,            -- sentiment / QA tag vocabulary
  description text not null
);

create table program_tags (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references programs (id),
  program_code   text not null,
  canonical_code text references canonical_tags (code),  -- null = program-local tag
  required_by_client boolean not null default false,
  unique (program_id, program_code)
);

-- Declared connections: intake in, results/transfers out. Config holds a secret
-- *reference* (env var name / vault key), never the secret itself (org policy).
create table program_connections (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs (id),
  kind        text not null check (kind in
              ('lead_intake','transfer','results_delivery','recording_delivery','dnc_feed')),
  transport   text not null check (transport in
              ('leadconduit','http_webhook','sftp','s3','sip','pstn','db_writeback','batch_file')),
  config      jsonb not null default '{}',
  secret_ref  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
```

Plus `program_id` FKs (not-null after backfill) on: `leads` (+ `payload jsonb` for program-declared fields), `scripts`, `voice_packs`, `clients`/`transfer_clients`, `transfer_priorities`, `calls` (denormalized for reporting), and optionally `dids` (if pools are program-reserved for caller-ID/branding reasons — ❓). The free-text `vertical` columns stop being routing keys; `program_id` is the routing key everywhere.

## The standard playbook (onboarding package)

One versioned manifest (YAML/JSON, validated against a JSON Schema) per program. Sections, with required/recommended status:

| Section | Req? | Contents |
|---|---|---|
| Product profile | ✅ | Description, offer, pricing talk-track facts, objection-handling knowledge — free-form + structured fields; lands in `programs.product_profile` |
| Scripts & disclosures | ✅ | At least one call script; **required disclosures flagged as such** (compliance-locked, not A/B-testable); recommended: variants for the A/B harness |
| Dispositions | ✅ | The program's required codes + canonical mapping (or "accept platform defaults" for a fast start) |
| Sentiment/tagging | ➤ recommended | Required tags mapped to canonical; defaults otherwise |
| Lead field schema | ✅ if custom fields | Field defs for intake validation |
| Connections | ✅ ≥1 transfer or results delivery | Intake source, transfer destination (SIP/PSTN), results ETL out, recording delivery |
| Compliance | ✅ | Calling hours, DNC policy/feed, state exclusions, licensing constraints |
| Benchmarks | ➤ recommended | Expected contact/conversion rates, success thresholds — seeds reporting |

Intake path: `POST /programs` (or a CLI) ingests + validates the manifest, writes the program rows, and returns a program-scoped intake credential. Ongoing ETL connections run off `program_connections` declarations — adapters per `transport`, written once, reused by every program.

## Logic-layer implications (refactor of the current scaffold)

1. **Program resolution at intake.** Every lead arrives on a program-keyed surface (per-program endpoint token). `routeLead` stops taking a bare `vertical` string; it resolves a program, validates the payload against `program_field_defs`, and reads list/campaign mapping from program config.
2. **Client selection becomes a program strategy.** ZIP-weighted `transfer_priorities` + two-phase pre-auth is the *FiveStrata strategy*; a trade-in program might have a single fixed transfer destination. `selectClient(vertical, zip)` becomes `selectTransfer(program, lead)` dispatching on program config.
3. **Write-back becomes a delivery adapter.** The techss_ two-way disposition write-back (quasi-decided #11) is reframed as the first `results_delivery` adapter (`db_writeback` transport) — required for FiveStrata programs, absent for others. MDB/dashboards keep working; nothing about that changes.
4. **Disposition translation layer.** The AI/dialer emits canonical codes; delivery translates per program. The fact stream stores both, so cross-program KPIs stay comparable.

## FiveStrata as tenant zero

The current environment maps onto the model with no loss — this is how we validate the abstraction:

- Tenant `fivestrata`; programs `fs-bathroom-revive`, `fs-windows-fresh`, etc. (pilot program = whichever vertical Q1 lands on).
- LeadConduit recipient endpoint → a `lead_intake` connection (`leadconduit` transport); Joseph's bulk-upload-style revive path → `batch_file` transport.
- `techss_dl.callcenter_dispos` conventions seed `program_dispositions`; Command Center transfer priorities remain the FiveStrata transfer strategy.
- OLeadID stays a FiveStrata program-payload key (universal `external_lead_id` semantics; other tenants bring their own).

## Open questions raised by this spec

- ❓ Who approves a "self-serve" playbook before a program goes live — compliance/QA gate, and who owns it?
- ❓ Secret management for per-tenant connection credentials (env vars don't scale past tenant zero — vault/secrets manager choice rides on T7/T8).
- ❓ Data isolation & retention per tenant: RLS in Supabase? Different legal retention for auto vs home-services calls? TCPA/consent posture differs by industry.
- ❓ Cost attribution / internal billing per tenant-program (telecom, TTS, DID spend).
- ❓ Is the canonical disposition set fixed (curated by us) or extensible per tenant? Recommendation: curated + program-local extension codes that roll up to `OTHER`.
- ❓ DID pools: shared platform pool vs program-reserved ranges (caller-ID locality, branding, spam-reputation isolation between tenants).
