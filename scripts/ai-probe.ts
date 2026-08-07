// Probe Telnyx's hosted AI surface with our existing API key (W1/W6 unblock
// check): LLM inference (chat completions), TTS voices (clip generation
// without a separate vendor key), and report what's usable. Prints statuses
// and model/voice names only.
// Run: npx tsx scripts/ai-probe.ts
import 'dotenv/config';

const API = 'https://api.telnyx.com/v2';
const apiKey = process.env.TELNYX_API_KEY ?? '';
if (!apiKey) {
  console.error('TELNYX_API_KEY is blank in .env.');
  process.exit(1);
}
const auth = { Authorization: `Bearer ${apiKey}` };

// --- LLM models ----------------------------------------------------------------
try {
  const res = await fetch(`${API}/ai/models`, { headers: auth });
  const body: any = await res.json().catch(() => ({}));
  const models = (body.data ?? []).map((m: any) => m.id ?? m.model ?? JSON.stringify(m).slice(0, 60));
  console.log(`GET /ai/models -> ${res.status}  (${models.length} models)`);
  for (const m of models.slice(0, 12)) console.log(`  ${m}`);
  if (models.length > 12) console.log(`  ... +${models.length - 12} more`);
} catch (e: any) {
  console.log(`GET /ai/models -> ERROR ${e.message}`);
}

// --- Chat completion smoke test --------------------------------------------------
try {
  const res = await fetch(`${API}/ai/chat/completions`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      messages: [
        { role: 'system', content: 'Reply with exactly one word.' },
        { role: 'user', content: 'Say the word: ready' },
      ],
      max_tokens: 5,
    }),
  });
  const body: any = await res.json().catch(() => ({}));
  const text = body?.choices?.[0]?.message?.content ?? JSON.stringify(body).slice(0, 200);
  console.log(`\nPOST /ai/chat/completions -> ${res.status}  reply: ${String(text).trim()}`);
} catch (e: any) {
  console.log(`POST /ai/chat/completions -> ERROR ${e.message}`);
}

// --- TTS voices ------------------------------------------------------------------
try {
  const res = await fetch(`${API}/text-to-speech/voices`, { headers: auth });
  const body: any = await res.json().catch(() => ({}));
  const voices = (body.voices ?? body.data ?? []).map((v: any) => v.id ?? v.name ?? v.voice ?? '?');
  console.log(`\nGET /text-to-speech/voices -> ${res.status}  (${voices.length} voices)`);
  for (const v of voices.slice(0, 15)) console.log(`  ${v}`);
  if (voices.length > 15) console.log(`  ... +${voices.length - 15} more`);
} catch (e: any) {
  console.log(`GET /text-to-speech/voices -> ERROR ${e.message}`);
}

// --- TTS generation smoke test ----------------------------------------------------
try {
  const res = await fetch(`${API}/text-to-speech/speech`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice: 'Telnyx.KokoroTTS.af_heart', text: 'Telnyx hosted speech test.' }),
  });
  const buf = res.ok ? await res.arrayBuffer() : null;
  console.log(
    `\nPOST /text-to-speech/speech -> ${res.status}${buf ? `  (${(buf.byteLength / 1024).toFixed(0)} KB audio, content-type ${res.headers.get('content-type')})` : ` ${JSON.stringify(await res.json().catch(() => ({}))).slice(0, 200)}`}`,
  );
} catch (e: any) {
  console.log(`POST /text-to-speech/speech -> ERROR ${e.message}`);
}
