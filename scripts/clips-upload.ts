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

// Optional name filter (argv[3+]): upload only these clip names — patch
// uploads must not touch the rest of the pack.
const ONLY = process.argv.slice(3);
const files = readdirSync(packDir)
  .filter((f) => /\.(wav|mp3)$/i.test(f))
  .filter((f) => !ONLY.length || ONLY.includes(basename(f).replace(/\.(wav|mp3)$/i, '')));
if (files.length === 0) {
  console.error(`No .wav/.mp3 files in ${packDir}${ONLY.length ? ` matching [${ONLY.join(', ')}]` : ''}`);
  process.exit(1);
}

// Media list is paginated — page through all of it or the existence check
// misses items and replaces fail with 422 'already been taken'.
const existing: Set<string> = new Set();
for (let page = 1; page < 20; page++) {
  const res = await fetch(`${API}/media?page[size]=250&page[number]=${page}`, { headers: auth });
  const body: any = await res.json().catch(() => ({}));
  const items = body.data ?? [];
  for (const m of items) existing.add(m.media_name);
  if (items.length < 250) break;
}

for (const f of files) {
  const mediaName = basename(f).replace(/\.(wav|mp3)$/i, '');
  if (existing.has(mediaName)) {
    const del = await fetch(`${API}/media/${encodeURIComponent(mediaName)}`, { method: 'DELETE', headers: auth });
    if (!del.ok && del.status !== 404) {
      console.error(`${mediaName}  DELETE failed ${del.status} — skipping`);
      continue;
    }
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
