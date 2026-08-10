// Voice-lineup generator (W6 voice selection for the Monday demo): renders
// the SAME sample line in each candidate voice plus "Voice N" announcer
// labels, so the choice is made through the actual telephony codec on a
// lineup call — not laptop speakers. Candidates from the Telnyx catalog's
// premium conversational tiers (8/7 survey: Azure DragonHD, Rime ArcanaV3,
// Telnyx NaturalHD, MiniMax, Inworld; no ElevenLabs in catalog).
// Run: npx tsx scripts/gen-voice-lineup.ts   then clips-upload.ts on the dir.
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://api.telnyx.com/v2';
const OUT_DIR = 'C:/Claude/fivestrata-dialer/voice-packs/voice-lineup';
const LABEL_VOICE = 'AWS.Polly.Matthew-Neural'; // male announcer — stands apart from samples

const SAMPLE_TEXT =
  "Hi, this is Claire calling from Five Strata on a recorded line. Everything you're hearing is a pre recorded clip in my voice. On a scale of one to ten, how natural do I sound?";

const CANDIDATES: Array<{ n: number; label: string; voice: string }> = [
  { n: 1, label: 'Voice one.', voice: 'AWS.Polly.Joanna-Neural' }, // incumbent baseline
  { n: 2, label: 'Voice two.', voice: 'Azure.en-US-Ava:DragonHDLatestNeural' },
  { n: 3, label: 'Voice three.', voice: 'Azure.en-US-Emma:DragonHDLatestNeural' },
  { n: 4, label: 'Voice four.', voice: 'Rime.ArcanaV3.celeste' },
  { n: 5, label: 'Voice five.', voice: 'Telnyx.NaturalHD.astra' },
  { n: 6, label: 'Voice six.', voice: 'Minimax.speech-2.8-turbo.English_Upbeat_Woman' },
  { n: 7, label: 'Voice seven.', voice: 'Inworld.Max.Abby' },
];

const apiKey = process.env.TELNYX_API_KEY ?? '';
if (!apiKey) {
  console.error('TELNYX_API_KEY is blank in .env.');
  process.exit(1);
}

async function tts(voice: string, text: string): Promise<Buffer | null> {
  const res = await fetch(`${API}/text-to-speech/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice, text }),
  });
  if (!res.ok) {
    console.error(`  ${voice} -> ${res.status} ${JSON.stringify(await res.json().catch(() => ({}))).slice(0, 160)}`);
    return null;
  }
  return Buffer.from(await res.arrayBuffer());
}

mkdirSync(OUT_DIR, { recursive: true });
const playlist: string[] = [];
for (const c of CANDIDATES) {
  const label = await tts(LABEL_VOICE, c.label);
  const sample = await tts(c.voice, SAMPLE_TEXT);
  if (!label || !sample) {
    console.log(`SKIP voice ${c.n} (${c.voice}) — generation failed`);
    continue;
  }
  writeFileSync(join(OUT_DIR, `vl_label_${c.n}.mp3`), label);
  writeFileSync(join(OUT_DIR, `vl_sample_${c.n}.mp3`), sample);
  playlist.push(`vl_label_${c.n}`, `vl_sample_${c.n}`);
  console.log(`voice ${c.n}: ${c.voice}  (${(sample.length / 1024).toFixed(0)} KB)`);
}
console.log(`\nPlaylist: ${JSON.stringify(playlist)}`);
console.log(`Next: npx tsx scripts/clips-upload.ts ${OUT_DIR}`);
