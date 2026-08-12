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
const VOICE = 'Azure.en-US-Ava:DragonHDLatestNeural'; // Claire's voice (Sean pick, 8/10 — Joanna-Neural retired at a career-best 2/10)
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
    "Hi Sean! This is Claire calling from Five Strata, on a recorded line. I'm the platform's AI agent. Mind if I ask you one quick question?",
  demo_greet:
    "Hi! This is Claire, the AI agent on the Five Strata call center platform, on a recorded line. Everything you hear from me is either a pre recorded clip in my voice, or a decision I'm making live on this call. Mind if I ask you one quick question?",
  cv_q1:
    'On a scale of one to ten, how natural does this call feel so far?',
  // Acks are real words, ~1-2s: ultra-short clips ("Mm hm") arrive garbled
  // over telephony (Sean, 8/7 call 6), and longer acks mask more latency.
  // Taxonomy (Sean, 8/7 call 7): these are CONNECTORS — they flow into
  // immediate speech. Wait-promising phrases ("one second") are STALL clips,
  // a separate category the engine fires only when the decision is genuinely
  // slow; a stall followed instantly by speech is incongruous.
  // Category-aligned acks (Sean, 8/11: "align the acks with what's going on")
  // — chosen by a zero-latency local classifier on the caller's words,
  // mirroring the production Hot Keys sheet (Agree/I understand/Sorry/Uh huh
  // variants). Legacy cv_ack_* kept as the neutral set.
  cv_ack_1: 'Okay, got it.',
  cv_ack_2: 'Alright, thanks.',
  cv_ack_3: 'Okay, noted.',
  ack_pos_1: 'Great, thanks!',
  ack_pos_2: 'Perfect, thank you.',
  ack_soft_1: 'Okay, fair enough.',
  ack_soft_2: 'Alright, I hear you.',
  // Non-promissory (round-3 audit: "happy to explain" before a clip that
  // doesn't explain is incongruous — the "one second" lesson again)
  ack_question_1: "That's a good question.",
  ack_question_2: 'Ah — good question.',
  ack_sorry_1: 'I understand — sorry about that.',
  ack_sorry_2: 'I hear you, apologies.',
  ack_pleasantry_1: 'Doing great, thanks for asking!',
  ack_pleasantry_2: "Likewise — it's great talking with you!",
  // A-priori compliance response (legal/recording/consent probes — the hobby
  // litigator path): confirm DNC plainly, no selling past it, no legal claims.
  resp_compliance:
    "I completely understand. I'm marking your number as do not call right now, so you won't hear from us again, and I won't take any more of your time.",
  cv_resp_positive:
    "That's great to hear. Logging that straight into the fact stream.",
  cv_resp_negative:
    "Fair enough — I'll tell the engineers. They take latency personally.",
  cv_resp_unclear:
    "I'll take that as a maybe. The transcription engine and I are still getting acquainted.",
  cv_goodbye:
    'That was everything. Every turn of this call was transcribed, decided by a language model, and logged per turn. Talk soon!',
  // Vertical question slots — language from the PRODUCTION script workbooks
  // (docs/call-scripts/, Pitch-Full blocks; disfluencies are intentional per
  // the soundboard format). Swap in via client_state like the greeting — the
  // demo picks a vertical, the agent doesn't change. q_solar is a placeholder:
  // no solar workbook in the repo (Sean owes the script).
  q_windows:
    "Uhm, actually the reason we're calling today is to follow up on your request for more information about replacing your home windows. Whether you're looking to replace your windows for an affordable price, or you want to upgrade or become more energy efficient, now is the time to get a free quote. I just need to ask a few quick questions, and it will take just a minute of your time, okay?",
  q_flooring:
    "Uhm, actually the reason we're calling today is to follow up on your inquiry about your flooring project. Right now we're offering fifty percent off the install, some incredible same as cash financing options, along with senior and veteran discounts — and all of our customers also qualify for one free room when they purchase two. I just need to ask a few quick questions, and it will take just a minute of your time, okay?",
  q_bathroom:
    "Uhm, actually the reason we're calling today is to follow up on your request for more information about remodeling your bathroom. Whether you're looking to update your bathroom for an affordable price, or make modifications like installing a walk in tub or shower, now is the time to get a free quote. I just need to ask a few quick questions, and this will only take a moment of your time, okay?",
  q_solar:
    "Uhm, actually the reason we're calling today is to follow up on your interest in solar for your home. With the current incentives, it takes about thirty seconds to see if you still qualify. I just need to ask a few quick questions, okay?",
  // Production language from "HW - Final Script.xlsx" (Ashley, 8/10) — whose
  // internal sheet is named "Solar Script", confirming the house clone lineage.
  q_homewarranty:
    "Now actually, uhm, the reason that we're calling today is because your home may be eligible for a home warranty program that really allows you to protect all of your major systems and appliances. Now that can include things like your AC, your heating systems, ah, plumbing and kitchen units, as well as even laundry appliances. Now I just need to ask a couple of quick questions and this will only take just a moment of your time, okay?",
  // Interest-mode responses (vertical questions)
  resp_interested:
    "Great news — I can get that set up for you right away. Let me connect you with a specialist. One moment please.",
  resp_not_interested:
    "No problem at all — I'll make a note of that, and we won't call you about this again. Thanks for your time!",
  goodbye_biz: 'Thanks so much for your time. Have a great day!',
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
