// Upload a voice pack's clips to Telnyx media storage (pre-uploaded media is
// the fastest playback path: playback_start by media_name, no fetch at play
// time). Idempotent: re-uploads replace by deleting the existing media_name.
// Run: npx tsx scripts/clips-upload.ts [packDir=voice-packs/dev-pack-0]
import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const API = 'https://api.telnyx.com/v2';
const apiKey = process.env.TELNYX_API_KEY ?? '';
if (!apiKey) {
  console.error('TELNYX_API_KEY is blank in .env.');
  process.exit(1);
}
const packDir = resolve(process.argv[2] ?? 'C:/Claude/fivestrata-dialer/voice-packs/dev-pack-0');
const auth = { Authorization: `Bearer ${apiKey}` };

const files = readdirSync(packDir).filter((f) => /\.(wav|mp3)$/i.test(f));
if (files.length === 0) {
  console.error(`No .wav/.mp3 files in ${packDir}`);
  process.exit(1);
}

const existing: Set<string> = new Set(
  ((await (await fetch(`${API}/media`, { headers: auth })).json()).data ?? []).map(
    (m: any) => m.media_name,
  ),
);

for (const f of files) {
  const mediaName = basename(f).replace(/\.(wav|mp3)$/i, '');
  if (existing.has(mediaName)) {
    await fetch(`${API}/media/${encodeURIComponent(mediaName)}`, { method: 'DELETE', headers: auth });
  }
  const bytes = readFileSync(join(packDir, f));
  const form = new FormData();
  form.append('media_name', mediaName);
  form.append('media', new Blob([bytes], { type: f.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav' }), f);
  const res = await fetch(`${API}/media`, { method: 'POST', headers: auth, body: form });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body?.errors?.[0];
    console.error(`${mediaName}  FAILED ${res.status} ${e?.code ?? ''} ${e?.title ?? ''} ${e?.detail ?? ''}`);
    process.exit(1);
  }
  console.log(`${mediaName}  UPLOADED (${(bytes.length / 1024).toFixed(0)} KB)${existing.has(mediaName) ? ' [replaced]' : ''}`);
}
console.log('\nPlayback: POST /calls/{id}/actions/playback_start {"media_name":"<name>"}');
