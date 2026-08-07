---
name: fivestratadialer
description: Working knowledge for the AICC / fivestrata-dialer AI call center platform build — repo layout, architecture decisions (no ViciDial; Supabase brain + Telnyx + Snowflake; soundboard-first LLM tool-calling voice), the shared-with-V1 Supabase constraint, demo runbook, credential/unblocker status, and Sean's-machine environment quirks (Node paths, blocked domains, file-conversion workarounds). Use for ANY work on the AICC platform, the fivestrata-dialer repo, the PRD, the demo/PoC, Telnyx/voice-engine work, or when a session needs to know how this project's tooling, credentials, or workflows behave on this box. Sibling to fivestratadb/callcenterdb/fivestrataops (business data) — this skill covers the BUILD.
---

# fivestratadialer — AICC Platform Build Skill

## Orientation (read the repo docs for depth — they are the project memory)

**Canonical repo: `C:\Claude\fivestrata-dialer` → github.com/piermadsen-blcalls/fivestrata-dialer (`main`).**
Read its `CLAUDE.md` first, then `docs/PRD.md` — the **governing artifact** (Pier: "PRD is gonna
be king"). `C:\Claude\ccai` → sostott/ccai is Sean's sandbox; parallel sessions sometimes land
doc edits there — when they do, **diff-and-merge ccai → canonical** (both sides accumulate
unique edits; never blind-copy). Open new sessions in the canonical folder.

Key architecture (✅ per PRD Draft v1, 2026-07-27): **no ViciDial instance** — ViciDial kept as
vocabulary only (dispositions, list/campaign semantics, `vendor_lead_code` ≡ OLeadID);
**Supabase** = operational brain (queue/routing/controls, hot 30–90d); **Telnyx** = call path;
**Snowflake** = results DB (every dial + turn, 5 yr); **soundboard-first hybrid voice** where
the LLM is a constrained tool-calling clip selector (`docs/architecture/soundboard-llm-interface.md`);
no human screener/closer; multi-tenant program/playbook onboarding
(`docs/architecture/tenant-program-onboarding.md`). The `src/clients/vicidial/` wrappers and
`VICIDIAL_*` env vars are vestigial.

## The shared Supabase constraint (critical)

The Supabase project (`wcftuethlcgeasopayed`) is **shared with Pier's V1 build** (Retell-based,
killed 2026-07-08; Pier can't create more projects). **Never modify/drop V1 objects**:
dial_queue, call_log, retell_*, agent_routing, zip_allowlist, system_flags, v_call_detail,
v_daily_call_summary. Our schema coexists (no name collisions). V1 docs:
`docs/architecture/v1-build.md`; non-PII V1 archive: `C:\Claude\v1-archive`.

- Check migration state: `npx tsx scripts/verify-setup.ts` (13 objects). **Migrations 0001+0002
  APPLIED 2026-08-03** (Sean, dashboard SQL editor; all 13 objects verified via real GETs).
  Any future migration remains a Sean-manual dashboard step (Claude's browser tooling is
  policy-blocked from supabase.com).
- Supabase HEAD requests return success for nonexistent tables — verify with real GETs.
- PostgREST caps responses at 1,000 rows/page regardless of `limit`.

## Credentials & env (locations, not values — never echo values)

- App env: `C:\Claude\fivestrata-dialer\.env` (copy of `env.template` — template holds
  non-secret values; Sean pastes secrets). Claude cannot read/write `.env*` (deny rule) and
  must never handle secret values; `cp env.template .env` is the pattern.
- V1 Supabase creds: `source /c/Claude/v1-supabase-env.sh` (V1_SUPABASE_URL/_SECRET_KEY).
- FiveStrata prod MySQL: `source /c/Claude/fsdb-env.sh`, client at
  `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`, pass via `MYSQL_PWD`.
  **`seans_ro` is NOT read-only** — self-enforce SELECT/SHOW/DESCRIBE on `techss_*`; writes
  only in own `*_poc` schemas; **never execute someone else's stored procedure**.
- **Telnyx keys LIVE as of 2026-08-03** (T2 closed): API key + public key in `.env`, validated
  via `scripts/telnyx-check.ts` (prints OK/FAIL only, never values; billing-read failure was
  **no credit card on the account**, not a user-permission issue — **card landed 2026-08-07**).
  **Call path provisioned 2026-08-07**: outbound voice profile `fivestrata-dialer-dev`
  (dev cap 10) + Call Control app `fivestrata-dialer` = connection `3021367032303060958`
  (`scripts/telnyx-setup.ts`, idempotent); test DID **+1 447 842 9621** purchased
  ($1 + $1/mo, `scripts/did-purchase.ts` — guarded: one number, $2 cap, no-op if account
  owns any) and active on the connection. Sean pastes `TELNYX_CONNECTION_ID` +
  `TELNYX_FROM_NUMBER` into `.env`. Webhook receiver: **Supabase Edge Function DEPLOYED
  2026-08-07** (`supabase/functions/telnyx-webhook/` — Ed25519 verify → insert
  `call_events`; verified live: unsigned POST→400, GET→405; Call Control app repointed at
  `https://wcftuethlcgeasopayed.supabase.co/functions/v1/telnyx-webhook` same day).
  Deploys via `scripts/deploy-webhook.ts` (Management API multipart — the supabase CLI
  path failed on Sean's box; token read from `/c/Claude/supabase-cli-env.sh`, export
  format, LF endings required — `tr -d '\r'` if recreated). Management-API secret-setting
  403s on Sean's org role → function falls back to `dialer_config` table (migration 0003
  applied + `telnyx_public_key` seeded 8/7, verified via REST GET). **FIRST REAL CALL
  2026-08-07 ~18:04 UTC**: `scripts/test-call.ts` dialed Sean's cell from the platform DID;
  full trace `call.initiated → call.answered → call.hangup` landed in `call_events` through
  the signature-verified webhook — step-2 wiring proven end to end. **Voice loop v0 same
  day** (`scripts/voice-loop-test.ts`): platform spoke 2 TTS lines on a live call via
  poll-driven command loop; **seam baseline 1300ms** (webhook→Postgres→250ms poll→command
  RTT ~410ms from Sean's box→TTS spin-up). Remaining for the step-2 gate: clip playback
  (hosted audio — Supabase Storage candidate) + pre-queue/co-location to hit ~200ms seam;
  LLM key for real W1 (Telnyx-hosted model avoids it for demos). NOT needed: LeadConduit,
  Snowflake, Retell. Pier's 7/30 demo ran from a different account/org.

## Demo / PoC runbook (simulated tier — no external creds)

1. Migrations applied (see above) → 2. `npm run dev` (server binds 127.0.0.1:3000 — loopback
avoids the Windows Firewall prompt Sean can't approve) → 3. open `http://127.0.0.1:3000/dashboard`
→ 4. `npx tsx scripts/demo-simulate.ts 40` (synthetic DEMO-marked leads through the real
pipeline, paced ~2 min; dashboard fills live). Real-call tier lands when Telnyx keys arrive.

## Sean's-machine environment quirks (hard-won)

- **Node 24** at `C:\Program Files\nodejs` — shells predating install need
  `PATH="/c/Program Files/nodejs:$PATH"` prefixed per command.
- **No admin rights**: UAC prompts fail (winget MSI installs died twice; Node came via IT).
  **Python IS available** (Sean confirmed 2026-07-31 — earlier "Store stubs only" note was
  stale/wrong for Sean's own shell; pymysql pattern from the callcenterdb profiler works).
  No pandoc/poppler/LibreOffice/gh. **File-conversion fallbacks are
  Node-based** in `C:\Claude\scratch\xlsb-analysis` (npm: `xlsx` reads .xlsb — use
  `dense:true`, sheet-as-array, `sheetRows` cap + bigger heap for large books; `pdf-parse` v2:
  `new PDFParse({data}).getText()`). docx: extract via `/c/Windows/System32/tar.exe -xOf` +
  PowerShell regex script file (bash-inline PS mangles `$`/backticks).
- **Org browser policy blocks Claude's tooling** (not Sean's own browsing) on: Google Docs,
  Supabase, Telnyx portal, nodejs.org, Atlassian/Confluence. Workarounds: Google Drive MCP
  connector reads Docs the browser can't; otherwise Sean exports to Downloads (Confluence:
  ••• → Export → PDF) and Claude reads locally.
- Permission layer denies: raw `curl` file downloads, some compound bash commands (split
  them), `.env*` reads. Bulk PII exports and probing unexpected datasets get blocked — scope
  to structure/aggregates and ask Sean for the PII-bearing parts.
- Teams history is searchable via the M365 connector (`chat_message_search` with
  afterDateTime) — useful for finding what colleagues actually said/shared.
- Long-running installs: endpoint security (CrowdStrike) can kill/slow processes; retry.

## People & communication

Pier (co-lead, controls project; **recommendation-first + diagrams** — he bounced off
analysis-style prose; his own PRD draft was announced 7/24 but never appeared in the shared
repo). Kinsey (VP product; client-wariness strategy — don't lead with "AI"). Ashley (ops/DID
expert; her KB dashboard = reporting spec, dissected in `docs/reporting/kb-wi-dashboard-spec.md`).
Joseph (owns LeadConduit/pre-auth/DNC/write-back contracts — T3/T4/T6/T11, F-questions).
Brandon/Alex (analysts). Cromwel (DBA). Shelly Teh (Snowflake). Sam/Tatevik (cost approvals).
Payam (president — revenue linkage is the test). Andre (aware, extended-vision angle).

## Working agreements

Keep the repo markdown current (it IS project memory) · decisions carry provenance, ✅/➤/❓,
never silently promote · no PII/credentials in any repo (demo data = 555 numbers +
sub_source DEMO) · commit style: descriptive + `Co-authored-by: Buyerlink Claude
<claude@anthropic.com>` · push canonical after meaningful chunks · FS-code knowledge lives in
`docs/reporting/kb-wi-dashboard-spec.md` + open-questions F1–F9 (FSCode1/2/3 = acquisition
identity / SS-SA-C0 source detail / BT-CC batch provenance; dictionaries in
`techss_all_leads.unique_FSCode1/unique_FSCodes`).
