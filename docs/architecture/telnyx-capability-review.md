# Telnyx Capability Review (T2 — public-docs half)

Researched 2026-07-20 from public Telnyx documentation, pricing pages, release notes, and help
center. Feeds the option A/B/C decision in [platform-foundations.md](platform-foundations.md).
Prices are published pay-as-you-go US rates — re-verify against telnyx.com/pricing (Telnyx also
publishes machine-readable pricing at telnyx.com/ai/pricing.json) before finalizing the cost
model. Account-level facts (concurrency defaults, negotiated rates) still require account access.

---

## 1. Call Control API (Programmable Voice)

**Outbound dialing.** `POST /v2/calls` (Dial command) originates a call from a connection to a
PSTN number or SIP URI; the response returns a `call_leg_id` / `call_control_id` used to
correlate all subsequent webhooks and commands. All commands accept a `command_id` for
idempotency and a `client_state` blob for carrying your own state machine through the webhook
flow. ([Dial API](https://developers.telnyx.com/api/call-control/dial-call))

**Webhook/event model.** Event-driven: `call.initiated`, `call.answered`, `call.bridged`,
`call.hangup`, `call.playback.started/ended`, plus AMD events (below). Every webhook must be
ACKed with 200 or Telnyx retries. This is a full "your server is the brain" model — a custom
dialer service (option B) drives everything by reacting to webhooks.
([Call Control overview](https://telnyx.com/resources/what-is-call-control))

**Bridging / warm transfer.** Three documented patterns, all sufficient for warm transfer:

- **Transfer command** — re-points a leg to a new destination; on failure a `call.hangup` for
  leg B arrives and the original call stays live for a retry to an alternate destination.
  Supports a `media_name` whisper file played to the transferee before bridging, and a 5–600s
  answer timeout. ([Transfer](https://developers.telnyx.com/api-reference/call-commands/transfer-call))
- **Dial + Bridge composition** — Dial a new leg (brief the client privately), then Bridge
  merges the caller; Dial also supports `link_to` to act as a bridge directly.
  ([Bridge](https://developers.telnyx.com/api/call-control/bridge-call),
  [handoff guide](https://telnyx.com/resources/ai-to-human-handoff-voice-ai))
- **Conference** — create a conference from an existing leg; hosts, join/leave sounds,
  mute/hold, auto-end; conferences expire after 4 hours.
  ([Create conference](https://developers.telnyx.com/api/call-control/create-conference))

**Audio playback of pre-staged files.** `playback_start` supports `media_name` referencing a
file pre-uploaded to the Media Storage API (`POST /v2/media`, WAV/MP3, 20 MB direct-upload max,
TTL configurable up to 20 years). Also supports `audio_url` with a `cache_audio` flag, base64
`playback_content`, looping, overlay mixing, and queueing of consecutive plays. **Playback-start
latency is NOT quantified in public docs** — pre-staging via Media Storage avoids remote fetch,
and Telnyx documents that commands route to the site managing the call "for the lowest possible
latency," but no millisecond figures are published. *(Critical unknown for the soundboard-first
strategy — measure in a PoC.)*
([Play audio](https://developers.telnyx.com/api/call-control/start-call-playback),
[Media Storage](https://developers.telnyx.com/api/media-storage/create-media-storage))

**Media streaming.** Bidirectional audio over WebSocket is fully supported: `streaming_start`
forks call media to your WS endpoint; `stream_bidirectional_mode: rtp` lets you inject audio
back. Codecs: PCMU, PCMA, G722, OPUS, AMR-WB, and **L16 linear PCM (added specifically to cut
transcoding latency for AI voice-agent integrations)**; one bidirectional RTP stream per call;
up to 16 kHz audio. This is the primitive for attaching our own STT→LLM→TTS loop (docs include
a Telnyx + OpenAI Realtime outbound tutorial).
([Media streaming](https://developers.telnyx.com/docs/voice/programmable-voice/media-streaming),
[bi-directional release note](https://telnyx.com/release-notes/bi-directional-streaming-support))

**Answering machine detection.** Set `answering_machine_detection` on Dial or Transfer. Modes:
standard (`detect`, `detect_words`, greeting-end detection), **Premium AMD** (ML-based;
classifies silence / machine greeting / human residence / human business), and
`premium_ios_call_screening_detection` (detects Apple Call Screening and re-runs AMD after the
screen). Webhooks: `call.machine.detection.ended`, `call.machine.greeting.ended`, beep
detection, and premium variants. Telnyx claims ~97% accuracy (marketing figure; no independent
benchmark). *(Directly relevant to real-vs-fake contact classification.)*
([AMD docs](https://developers.telnyx.com/docs/voice/programmable-voice/answering-machine-detection))

## 2. Voice AI / AI Assistant products

- **AI Assistants** — hosted voice agents (no-code builder + full API): Telnyx runs
  STT + LLM + TTS + orchestration on GPUs co-located with its telephony core, claiming
  sub-second round trips. ([Voice AI agents](https://telnyx.com/products/voice-ai-agents))
- **STT** — Telnyx in-house engine is Whisper Large-V3-Turbo on Telnyx streaming infra (100+
  languages, sub-250 ms claimed); Google, Deepgram Nova-3, and Azure engines also selectable.
  ([STT release note](https://telnyx.com/release-notes/new-speech-to-text-engine))
- **TTS** — Telnyx-native voices (Natural, NaturalHD, Qwen3TTS, Ultra) plus third-party
  engines: Amazon Polly standard/neural, Inworld, Resemble, Murf, Rime, MiniMax; ElevenLabs and
  Azure Neural HD via BYO API key. ([TTS pricing](https://telnyx.com/pricing/text-to-speech))
- **Voice cloning** — yes: **Voice Design Lab** creates voices from prompts or clones from
  audio (Qwen3TTS: 3–15 s reference; MiniMax: 10 s–5 min), usable in AI Assistants, Call
  Control `speak`, and the TTS API. *(Feeds voice-pack generation — clone once, batch-generate
  the canned library in the same voice used for live TTS.)*
  ([Voice Design Lab](https://developers.telnyx.com/docs/tts-stt/voice-design-lab))
- **Custom LLM** — yes: any OpenAI Chat Completions–compatible endpoint (Azure, Bedrock,
  Baseten, self-hosted); Telnyx keeps voice orchestration/STT/TTS and routes model calls to
  your endpoint. Built-in menu includes OpenAI, Anthropic, Google, Mistral, xAI, and
  Telnyx-hosted open-weight models (e.g. Qwen3-235B at $0.60/M input, $2.00/M output tokens),
  with fallback-model support. Documented latency cost of external LLM: +20–50 ms near a PoP,
  +100–300 ms otherwise.
  ([Custom LLM docs](https://developers.telnyx.com/docs/inference/ai-assistants/custom-llm))
- **Pricing** — Voice AI orchestration **from $0.05/min** including STT and Telnyx-native TTS
  (G2 lists $0.06/min — unreconciled; likely rate revision). Telnyx-hosted LLM adds
  ~$0.025/min average (token-billed). Add-ons: **$0.10 per warm transfer**, knowledge-base
  storage $0.006/GiB-mo, noise suppression $0.002–0.005/leg/min.
  ([Conversational AI pricing](https://telnyx.com/pricing/conversational-ai))
- **Multi-participant Voice AI calls** — built-in conferenced warm transfer via
  Invite/Skip-Turn tools; warm-transfer instructions with automatic context pass-through.
  ([Warm transfers release note](https://telnyx.com/release-notes/warm-transfers-voice-ai))

## 3. Elastic SIP trunking (option A feed)

- Standard SIP trunking into our own Asterisk/ViciDial box; Telnyx is a licensed
  facilities-based carrier on its own network. ([SIP trunks](https://telnyx.com/products/sip-trunks))
- **US outbound ~$0.005/min, inbound local ~$0.0032–0.0035/min** pay-as-you-go; volume/commit
  discounts available. ([Elastic SIP pricing](https://telnyx.com/pricing/elastic-sip))
- **Channels**: metered/elastic by default (no per-channel fee). Optional dedicated inbound
  channels tiered $12/mo (first 10) → $8/mo (250+).
- **Concurrency/CPS**: account-level concurrent-call limit starts at a verification-tiered
  default (not published) and is raised via support. CPS: **20 CPS default per source IP/SIP
  username**, SIP 503 on excess; exceptions granted; a 95th-percentile **peak-CPS surcharge**
  applies to sustained high CPS.
  ([Concurrent limits](https://developers.telnyx.com/docs/voice/sip-trunking/configuration/concurrent-limits),
  [CPS surcharge](https://support.telnyx.com/en/articles/7834487-calls-per-second-cps-surcharge))

## 4. Number management API

- **Programmatic ordering at scale**: `POST /v2/number_orders` (explicit), number-block orders,
  and bulk "inexplicit" orders — criteria + quantity up to **10,000 numbers per order** (US/CA),
  async with webhook notifications, auto-attach `connection_id`/billing group.
  ([Bulk ordering](https://developers.telnyx.com/docs/numbers/phone-numbers/bulk-ordering))
- **Releasing**: `DELETE /v2/phone_numbers/{id}`; MRC stops on delete; 15-day repurchase window.
  **Directly supports the retire-at-~1,500-dials rotation — order pool via bulk API, delete via
  API, all automatable.** ([Delete number](https://developers.telnyx.com/api/numbers/delete-phone-number))
- **Cost**: US local **$1.00/mo** (+$0.10/mo SMS); automatic discounts above 50 numbers/mo; one
  third-party source cites $0.25/mo above 5,000 numbers (unverified — confirm).
  ([Numbers pricing](https://telnyx.com/pricing/numbers))
- **STIR/SHAKEN**: calls originating on Telnyx are signed automatically; Telnyx-owned numbers
  dialed out through Telnyx get **A attestation** by default; BYO caller-ID gets B. Attestation
  appears in CDRs. *Caveat: heavy short-duration outbound traffic and complaints can downgrade
  attestation — interacts with rotation strategy.*
  ([STIR/SHAKEN](https://support.telnyx.com/en/articles/5402969-stir-shaken-with-telnyx))
- **Reputation tooling**: **Number Reputation API** — queries spam labels on our outbound DIDs
  from the analytics networks used by US carriers, scheduled re-checks, registration across the
  reputation feed; billable per query. Remediation via Free Caller Registry + per-carrier
  redress; no guaranteed label removal. *(No ViciDial equivalent — feeds DID health decisions.)*
  ([Number Reputation](https://developers.telnyx.com/docs/branded-calling/number-reputation))

## 5. Native campaign / dialer orchestration

**Telnyx does NOT offer a predictive dialer, pacing engine, hopper, list/lead management,
disposition model, or DNC engine.** Its own content positions predictive dialers as something
customers build on top, and its outbound-AI marketing pitches AI agents as the *replacement*
for agent-pacing problems (an AI agent answers every connect, so predictive pacing against a
finite agent pool becomes unnecessary). Closest native features:

- **AI Assistant Scheduled Events API** — schedule individual AI calls/SMS at a time;
  per-target, not a campaign engine (no pacing, retry ladders, quotas, abandonment management).
  ([Release note](https://telnyx.com/release-notes/ai-assistant-scheduled-events-api))
- Concurrency/CPS knobs — rate *limits*, not pacing logic.

Everything ViciDial does around pacing ratio, drop-rate (TCPA 3% abandonment) governance,
recycle/retry rules, timezone/calling-window enforcement, list priority, and dispositions would
be custom-built in option B. ([Outbound voice AI guide](https://telnyx.com/resources/outbound-voice-ai))

## 6. Cost model inputs (published US pay-as-you-go)

| Item | Rate | Source |
|---|---|---|
| Voice API (Call Control) usage | $0.002/min (each direction) + trunking | [Voice API pricing](https://telnyx.com/pricing/voice-api) |
| SIP outbound US termination | ~$0.005/min (effective Call Control outbound ≈ $0.007/min) | [Elastic SIP pricing](https://telnyx.com/pricing/elastic-sip) |
| SIP inbound US local | ~$0.0032–0.0035/min | same |
| AMD standard / premium | $0.002 / $0.0065 per call | [Voice API pricing](https://telnyx.com/pricing/voice-api) |
| Media streaming (WebSocket) | $0.0035/min | same |
| Call recording | $0.002/min | same |
| STT (Telnyx/Whisper engine) | $0.025/min (Google $0.05/min; standalone AssemblyAI $0.007/min) | [STT pricing](https://telnyx.com/pricing/speech-to-text) |
| TTS | Telnyx $0.000003/char; Polly neural $0.000024/char; Telnyx HD $0.000048/char | [TTS pricing](https://telnyx.com/pricing/text-to-speech) |
| Voice AI (full stack) | from $0.05/min incl. STT + native TTS; +~$0.025/min Telnyx-hosted LLM; $0.10/warm transfer | [Conversational AI pricing](https://telnyx.com/pricing/conversational-ai) |
| DID monthly | $1.00/mo US local (+$0.10 SMS); volume discounts >50/mo | [Numbers pricing](https://telnyx.com/pricing/numbers) |
| CPS | 20 CPS/source default; 95th-percentile peak-CPS surcharge | [CPS surcharge](https://support.telnyx.com/en/articles/7834487-calls-per-second-cps-surcharge) |

Illustrative per-connected-minute stack for a fully AI call (option B, self-orchestrated):
~$0.007 voice + $0.0035 streaming + $0.025 STT + TTS (per char) + LLM tokens ≈ **$0.04–0.06/min**
before recording — roughly at parity with the $0.05/min bundled Voice AI product; the bundle is
competitive if its constraints fit.

## Assessment

**What Telnyx replaces from the dialer core:**

- **AMD** — fully replaced, arguably better than ViciDial's Asterisk AMD (ML premium tier, iOS
  call-screening detection, beep/greeting-end webhooks). Per-call fee applies.
- **Call origination, bridge/transfer/conference, media playback/streaming** — fully replaced;
  all primitives for AI-agent calls and warm transfer exist.
- **DID lifecycle** — fully replaced and stronger than ViciDial (bulk order 10k/order, API
  delete, reputation monitoring API).
- **STT/TTS/LLM voice-agent runtime** — natively available (option B could even skip
  self-hosting the AI loop via AI Assistants + custom LLM).

**What Telnyx does NOT replace (must build for option B):** predictive/power pacing,
abandonment-rate governance (TCPA 3%), hopper/lead recycling, retry ladders, campaign/list
management, dispositions, DNC scrubbing, timezone calling windows, agent-availability coupling.

**Facts favoring each option:**

- **Favors A (ViciDial + Telnyx trunks):** the entire pacing/compliance/list layer exists in
  ViciDial for free; Telnyx SIP at $0.005/min is a clean drop-in; nothing Telnyx-side blocks it.
- **Favors B (pure Telnyx):** with all-AI agents, predictive pacing largely loses its purpose —
  there is no scarce human-agent pool to keep busy, so the hardest part of the rebuild becomes
  optional. L16 bidirectional streaming, premium AMD, custom-LLM AI Assistants, and bulk DID
  APIs make the AI-call path materially better than driving it through ViciDial's Agent API;
  DID rotation is API-native. Caveats: A-attestation depends on staying on Telnyx numbers +
  origination; per-call AMD/streaming meters add up (model total cost per call, not per minute).
- **Favors C:** Telnyx supplies every telephony/AI primitive but zero campaign semantics — a
  ViciDial-compatible data model (lists, hoppers, dispositions) over Call Control is exactly
  the gap option C fills.

**Could NOT verify from public docs (needs account access / PoC):** playback-start latency for
pre-staged media (**critical for soundboard-first**); default concurrent-call limit for new
accounts; exact DID volume-discount tiers; the $0.05 vs $0.06/min Voice AI discrepancy; AMD
accuracy (97% is marketing); whether the $0.10 warm-transfer fee applies to Call Control
bridges generally or only AI Assistant transfers.
