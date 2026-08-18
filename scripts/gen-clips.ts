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
  // Variant expansion (corpus sweep 8/14, 1,387 calls: neutral acks repeated
  // within-call in ~10% of their calls, question acks ~6% — an identical
  // render replayed in one call reads robotic; Sean: variants, not replays).
  cv_ack_4: 'Sure — understood.',
  cv_ack_5: 'Right, okay then.',
  ack_pos_1: 'Great, thanks!',
  ack_pos_2: 'Perfect, thank you.',
  ack_soft_1: 'Okay, fair enough.',
  ack_soft_2: 'Alright, I hear you.',
  // Non-promissory (round-3 audit: "happy to explain" before a clip that
  // doesn't explain is incongruous — the "one second" lesson again)
  ack_question_1: "That's a good question.",
  ack_question_2: 'Ah — good question.',
  ack_question_3: "That's a fair question.",
  ack_sorry_1: 'I understand — sorry about that.',
  ack_sorry_2: 'I hear you, apologies.',
  ack_pleasantry_1: 'Doing great, thanks for asking!',
  ack_pleasantry_2: "Likewise — it's great talking with you!",
  // 8/17 audit distills: callback/permission requests get an ACCOMMODATING
  // ack (not "good question" — 8 misfires), phrased so the exit_callback
  // clip's "Of course —" opener doesn't repeat; well-being answers get warmth.
  ack_request_1: 'Oh — sure thing.',
  ack_request_2: 'Yeah, no worries at all.',
  ack_glad_1: 'Glad to hear it!',
  ack_glad_2: "That's great — happy to hear it.",
  // Short-repeat question forms (production Long/Short repeat discipline —
  // Doris's "what's the question?" logged 8x in round 6)
  cv_q1_short: 'Just quickly — one to ten, how natural does this call feel?',
  q_windows_short: 'Just checking — are you still interested in a free quote on replacement windows? It only takes a minute, okay?',
  q_flooring_short: 'Just checking — are you still interested in your flooring project? We have fifty percent off install right now. Okay?',
  q_bathroom_short: 'Just checking — are you still interested in a free quote on your bathroom remodel? It only takes a minute, okay?',
  q_solar_short: 'Just checking — still interested in seeing if you qualify for solar? Takes about thirty seconds, okay?',
  q_homewarranty_short: 'Just checking — would you like to see if your home qualifies for the home warranty program? Just a couple of quick questions, okay?',
  // Identity re-greet (P1 — "who is this again?" topped FOUR straight audit
  // rounds, ~130 occurrences; production scripts solve this with the
  // Intro-Repeat discipline). Played, then the question replays.
  regreet_identity:
    "Of course — my name is Claire, and I'm calling from Five Strata on a recorded line. Happy to repeat that any time. So —",
  // Second-ask variant (corpus sweep 8/14: regreet_identity was the worst
  // within-call repeater at 35% — Doris asks twice, and the identical render
  // is a tell).
  regreet_identity_2:
    "Sure — once more, it's Claire, with Five Strata, on a recorded line. No trouble at all. So —",
  // Butch round-1 distillations (8/14): the household-inquiry ask fired in
  // 10/10 calls, price in most — answered questions, not acks. resp_price /
  // resp_no_commit end in the confirm ask so the confirm turn reads the yes/no;
  // both land the transfer-not-purchase hook.
  regreet_inquiry:
    "Yes, exactly — someone in your household recently asked for information about this, and I'm just following up on that request. So —",
  resp_price:
    "Totally fair question. The honest answer is, it depends on the size and scope of the project, so I can't quote it myself — the specialist puts together an exact quote for you, for free. There's no cost for that, and no obligation. Want me to set that up? A quick yes or no is perfect.",
  resp_no_commit:
    "Nothing at all — saying yes here just means I connect you with a specialist for a free quote. It's not a purchase. There's no cost, and no obligation. Want me to set that up? A quick yes or no is perfect.",
  // Butch round-2 distillation (8/14): with inquiry + price answered, the top
  // unanswered class became process / scope / who-will-I-talk-to.
  resp_specialist:
    "Sure — you'd be talking with a licensed remodeling specialist for your area. They go over what you have in mind, walk you through the options and scope, and put together an exact quote for you, for free. No cost, no obligation. Want me to set that up? A quick yes or no is perfect.",
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
  // Recovery turn (Sean 8/14: Maria at 98%+): when the judge is unsure about
  // an engaged caller, CONFIRM instead of guessing — mirrors the production
  // TCPA unclear-yes confirm discipline (Bathrooms workbook).
  confirm_interest:
    "Just to make sure I've got it right — would you like me to get that set up for you? A quick yes or no is perfect.",
  resp_not_interested:
    "No problem at all — I'll make a note of that, and we won't call you about this again. Thanks for your time!",
  goodbye_biz: 'Thanks so much for your time. Have a great day!',
  // Time-is-money graceful early exit (self-destruct path — brand-safe, warm)
  exit_disengage:
    "You know what — it sounds like now might not be the best time, so I'll let you go. Thanks so much for chatting with me, and have a wonderful day!",
  // --- Windows benchmark pack (8/17, Sean: 3rd-party soundboard bench is on
  // Windows — make Claire a natural, persuasive-if-needed windows seller).
  // Language distilled from the production workbook "Windows -CD 7.7.26.xlsx"
  // (R2.0/R10/R33/R35, Hot Keys "How much"/"Consultation", benefits block).
  // q_windows routes to these via the agent's vertical clip map.
  greet_windows:
    "Hi! This is Claire, calling on behalf of Five Strata on a recorded line. How are you doing today?",
  regreet_inquiry_win:
    "Yes, exactly — someone in your household recently asked for information about replacement windows, and I'm just following up on that request. So —",
  resp_price_win:
    "Totally fair question. The honest answer is, it depends on the frame material, the glass type, and how many windows you're doing — so I can't quote it myself. What I can say is window pricing is a lot better today than it used to be, and the specialist puts together an exact quote for you, completely free, with no obligation. Want me to set that up? A quick yes or no is perfect.",
  resp_no_commit_win:
    "Nothing at all — saying yes here just means I connect you with a window specialist for a free quote. It's not a purchase, there's no cost, and no commitment; once you have the details, you can make an informed decision. Want me to set that up? A quick yes or no is perfect.",
  resp_specialist_win:
    "Sure — you'd be talking with a licensed window specialist for your area. They go over what you have in mind, walk you through frame and glass options, and put together an exact quote for you, for free. And installs are surprisingly fast — usually two to seven days once the details are set. No cost, no obligation. Want me to set that up? A quick yes or no is perfect.",
  resp_interested_win:
    "Great news — I can get that free window quote set up for you right away. Let me connect you with a specialist. One moment please.",
  // One-shot soft-decline rebuttal (production R2.0 + R33 + R35: free, no
  // commitment, nothing to lose, energy/noise benefits). Ends in the house
  // yes/no ask so the confirm machinery reads the answer. Fires ONCE per
  // call, never on DNC/hard opt-out language.
  rebuttal_win:
    "Totally understand — and no pressure at all. Just keep in mind, the quote is completely free and there's no commitment, and folks are usually surprised how much new windows cut their energy bills and outside noise. You've really got nothing to lose. Worth a quick look? A quick yes or no is perfect.",
  // Callback-request graceful exit (8/15 ack-loop queued item: "can I call
  // you back?" is not a "good question" — it deserves a warm goodbye).
  exit_callback:
    "Of course — sorry to catch you at a busy time! I'll let you go, and we'll try you again another day. Thanks so much, and have a great one!",
  // Warm-transfer leg (W2 / P0 #8)
  xfer_announce:
    "Great news — I'm connecting you to a specialist right now. One moment please.",
  xfer_whisper:
    'Incoming Five Strata AI transfer test. Connecting you to the caller now.',
  xfer_fail:
    "It looks like our specialist isn't available right now. We'll follow up shortly. Goodbye!",
};

// Optional name filter: `gen-clips.ts regreet_inquiry resp_price` regenerates
// only those clips — mid-experiment patches must not re-render known-good audio.
const ONLY = process.argv.slice(2);
mkdirSync(OUT_DIR, { recursive: true });
for (const [name, text] of Object.entries(CLIPS)) {
  if (ONLY.length && !ONLY.includes(name)) continue;
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
