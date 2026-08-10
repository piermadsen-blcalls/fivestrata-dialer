# Demo brief — 2026-08-11 (Pier, Brodie, + possibly Payam)

**What they'll experience:** Claire (the platform's AI agent, voice: Azure Ava) calls a phone,
identifies herself as an AI on a recorded line, asks permission, runs a real two-turn
conversation — transcribing the callee live, acknowledging instantly, choosing her response
with an LLM — and hangs up. The entire conversation executes serverless next to the carrier;
every event lands in the platform database as it happens; the call is recorded.

**Two flavors, one command each:**

| Flavor | What it shows | Command |
|---|---|---|
| Meta ("rate this call") | The technology — clips, listening, live LLM decision | `npx tsx scripts/edge-convo-call.ts +1XXXXXXXXXX demo_greet` |
| Vertical revive (windows / flooring / bathroom / solar / home warranty) | The business — production script language, interested → transfer announce, not-interested → polite opt-out | `... demo_greet q_windows goodbye_biz` (or `q_flooring` / `q_bathroom` / `q_solar` / `q_homewarranty`) |

Vertical pitch lines are taken from the **production call-center script workbooks**
(`docs/call-scripts/`, Pitch-Full blocks) — windows, flooring, bathrooms verbatim-adapted.
Solar and home warranty are placeholders composed in the same template pattern: no workbook
exists for either (HW's script lives inside Kombea's soundboard — checked Teams, SharePoint,
Drive, and the fshw replica 8/10; Ashley is the source for both).

**Pre-flight (non-negotiable, learned live):** the callee saves **+1 447 842 9621** to
contacts before the call. The test DID carries a spam label (expected for a fresh number —
see the DID-reputation findings in open-questions), and carrier screening otherwise diverts
to voicemail or answers with a robo-screener.

---

## How the data is handled (dispositions, turns, tagging, AI/A-B signals)

The platform records every call at **three grains**, all in the operational schema
(migration 0001, applied and live):

| Grain | Table | Contents | Status |
|---|---|---|---|
| Raw events | `call_events` | Every telephony webhook, signature-verified: initiated/answered/hangup, playback per clip, live transcription (partials + finals), AMD verdicts, DTMF keypresses, recording-saved | ✅ live — every demo call is fully traced today |
| Per dial | `calls` | Lead, script, voice pack, DID, campaign, timestamps, duration, **disposition**, **contact_quality**, transferred client, recording URL, **canned_seconds vs tts_seconds** | ✅ schema live; rollup wiring from events is the step-3 engine work |
| Per turn | `call_turns` | For each conversational turn: **context** (what the AI knew) → **clip choice** (canned vs TTS, which clip) → **outcome** (how the prospect responded) | ✅ schema live; formal writes land with the step-3 engine (today the same signals are visible in `call_events`) |

**Dispositions.** `calls.disposition` uses ViciDial vocabulary so results compare one-to-one
with the human floors, and each program's codes map onto one **canonical disposition
taxonomy** (`architecture/tenant-program-onboarding.md`) — cross-vertical and cross-tenant
KPIs compute from the canonical layer while each business unit keeps its own codes.
Write-back to `techss_` is keyed on **OLeadID** (≡ `vendor_lead_code`), so the MDB and every
existing dashboard keep working (step 4).

**Real-vs-fake contact.** `calls.contact_quality` (human / ivr / voicemail / spam) is the
IVA-adjusted connection-rate feed — the KPI the human floors can't currently trust. Inputs
already demonstrated live: AMD verdicts on every dial, and full transcripts of voicemail
greetings and screening robots (the platform transcribed a callee's voicemail verbatim on
8/7). AMD accuracy is being tuned (premium tier under evaluation).

**Tagging.** Intake parses FS-codes to first-class columns; media-partner tagging rides on
every call for partner-grain reporting (Ashley's dashboard views, migration 0002); sentiment
tags map per-program onto the canonical sentiment taxonomy the same way dispositions do.

**A/B signals.** The unit of experimentation is config, not code — demonstrated this week
live: the agent's voice, greeting, question, and goodbye are all swappable per call
(voice packs: Joanna → Ava was a one-line change; verticals are a parameter on the dial).
Batch-level assignment (batch A → variant 1, batch B → variant 2) attributes every dial and
every turn to its variant in the fact stream; `canned_seconds` vs `tts_seconds` per call is
the cost-split telemetry that decides where clips end and TTS begins.

**AI signals captured per call, today:** live transcription (Deepgram, partial + final, with
confidence); the LLM's clip decision with model and decision latency; AMD verdict; DTMF
keypresses; per-clip playback timing (seam telemetry — every latency number in this
project's docs was computed from these timestamps); full-call recording. All of it lands in
`call_events` as the call happens and flows to the long-term store nightly at step 4.

The through-line for the room: **the demo call and a production call write the same record.**
Optimization on this platform is measurement, not anecdote — the demo audience's own call is
already in the database, per event, per turn, by the time they hang up.
