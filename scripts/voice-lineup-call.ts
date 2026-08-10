// Voice-audition call: dials a number and the co-located agent plays the
// lineup playlist ("Voice one" + sample, "Voice two" + sample, ...) straight
// through, then hangs up. Judge candidates through the REAL telephony codec.
// Prereq: gen-voice-lineup.ts + clips-upload.ts voice-packs/voice-lineup,
// telnyx-agent deployed with lineup mode.
// Run: npx tsx scripts/voice-lineup-call.ts +1XXXXXXXXXX
import 'dotenv/config';

const TELNYX = 'https://api.telnyx.com/v2';
const PLAYLIST = [
  'vl_label_1', 'vl_sample_1', // AWS.Polly.Joanna-Neural (incumbent)
  'vl_label_2', 'vl_sample_2', // Azure.en-US-Ava:DragonHDLatestNeural
  'vl_label_3', 'vl_sample_3', // Azure.en-US-Emma:DragonHDLatestNeural
  'vl_label_4', 'vl_sample_4', // Rime.ArcanaV3.celeste
  'vl_label_5', 'vl_sample_5', // Telnyx.NaturalHD.astra
  'vl_label_6', 'vl_sample_6', // Minimax.speech-2.8-turbo.English_Upbeat_Woman
  'vl_label_7', 'vl_sample_7', // Inworld.Max.Abby
];

const apiKey = process.env.TELNYX_API_KEY ?? '';
const connectionId = process.env.TELNYX_CONNECTION_ID ?? '';
const from = process.env.TELNYX_FROM_NUMBER ?? '';
const to = process.argv[2] ?? '';
if (!apiKey || !connectionId || !from || !/^\+1\d{10}$/.test(to)) {
  console.error('Usage: npx tsx scripts/voice-lineup-call.ts +1XXXXXXXXXX (needs TELNYX_* env)');
  process.exit(1);
}

console.log(`Dialing ${to} — ${PLAYLIST.length / 2} voice candidates ...`);
const res = await fetch(`${TELNYX}/calls`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connection_id: connectionId,
    to,
    from,
    timeout_secs: 30,
    client_state: Buffer.from(JSON.stringify({ phase: 'dialing', playlist: PLAYLIST })).toString('base64'),
  }),
});
const body: any = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`dial failed: ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  process.exit(1);
}
console.log(`call_control_id: ${body.data.call_control_id}`);
console.log('Answer, listen to all seven, and note your favorites — the agent hangs up at the end.');
