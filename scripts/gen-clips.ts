// Voice-pack clip generation via Telnyx hosted TTS (W6 pipeline v0) — no
// separate TTS vendor key needed (discovered 8/7: /v2/text-to-speech/speech
// works with our API key; 4,450 voices incl. Polly Neural). Generates the
// conversational demo pack as MP3s; scripts/clips-upload.ts pushes them to
// Telnyx media storage.
// Run: npx tsx scripts/gen-clips.ts
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://api.telnyx.com/v2';
const VOICE = 'AWS.Polly.Joanna-Neural';
const OUT_DIR = 'C:/Claude/fivestrata-dialer/voice-packs/dev-pack-1';

const apiKey = process.env.TELNYX_API_KEY ?? '';
if (!apiKey) {
  console.error('TELNYX_API_KEY is blank in .env.');
  process.exit(1);
}

// The conversational demo pack. ack_* clips are the latency mask: fired the
// instant the caller stops talking, they buy the LLM its decision time — the
// same trick human soundboard operators use ("uh huh", "got it").
const CLIPS: Record<string, string> = {
  cv_greet:
    "Hi Sean! This is Sky calling from Five Strata, on a recorded line. I'm the platform's AI agent, and this is my first two way conversation. Mind if I ask you one quick question?",
  demo_greet:
    "Hi! This is Sky, the AI agent on the Five Strata call center platform, on a recorded line. Everything you hear from me is either a pre recorded clip in my voice, or a decision I'm making live on this call. Mind if I ask you one quick question?",
  cv_q1:
    'On a scale of one to ten, how natural does this call feel so far?',
  // Acks are real words, ~1-2s: ultra-short clips ("Mm hm") arrive garbled
  // over telephony (Sean, 8/7 call 6), and longer acks mask more latency.
  // Taxonomy (Sean, 8/7 call 7): these are CONNECTORS — they flow into
  // immediate speech. Wait-promising phrases ("one second") are STALL clips,
  // a separate category the engine fires only when the decision is genuinely
  // slow; a stall followed instantly by speech is incongruous.
  cv_ack_1: 'Okay, got it.',
  cv_ack_2: 'Alright, perfect.',
  cv_ack_3: 'Okay, thanks.',
  cv_resp_positive:
    "That's great to hear. Logging that straight into the fact stream.",
  cv_resp_negative:
    "Fair enough — I'll tell the engineers. They take latency personally.",
  cv_resp_unclear:
    "I'll take that as a maybe. The transcription engine and I are still getting acquainted.",
  cv_goodbye:
    'That was everything. Every turn of this call was transcribed, decided by a language model, and logged per turn. Talk soon!',
  // Warm-transfer leg (W2 / P0 #8)
  xfer_announce:
    "Great news — I'm connecting you to a specialist right now. One moment please.",
  xfer_whisper:
    'Incoming Five Strata AI transfer test. Connecting you to the caller now.',
  xfer_fail:
    "It looks like our specialist isn't available right now. We'll follow up shortly. Goodbye!",
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, text] of Object.entries(CLIPS)) {
  const res = await fetch(`${API}/text-to-speech/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice: VOICE, text }),
  });
  if (!res.ok) {
    console.error(`${name}  FAILED ${res.status} ${JSON.stringify(await res.json().catch(() => ({}))).slice(0, 200)}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT_DIR, `${name}.mp3`), buf);
  console.log(`${name}.mp3  (${(buf.length / 1024).toFixed(0)} KB)  "${text.slice(0, 50)}${text.length > 50 ? '…' : ''}"`);
}
console.log(`\nPack written to ${OUT_DIR} (voice: ${VOICE})`);
console.log('Next: npx tsx scripts/clips-upload.ts voice-packs/dev-pack-1');
