import 'server-only';

/**
 * Telnyx hosted TTS + media storage (ports scripts/gen-clips.ts and
 * scripts/clips-upload.ts mechanics). Voice + endpoints proven live 8/7-8/10.
 */
const API = 'https://api.telnyx.com/v2';

export const DEFAULT_VOICE = 'Azure.en-US-Ava:DragonHDLatestNeural'; // Claire (Sean pick, 8/10)

function apiKey(): string {
  const k = process.env.TELNYX_API_KEY;
  if (!k) throw new Error('TELNYX_API_KEY not configured (console env)');
  return k;
}

const auth = () => ({ Authorization: `Bearer ${apiKey()}` });

/** Synthesize text -> MP3 bytes via Telnyx hosted TTS. */
export async function synthesize(text: string, voice = DEFAULT_VOICE): Promise<Uint8Array> {
  const res = await fetch(`${API}/text-to-speech/speech`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error(`TTS failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Upload MP3 to Telnyx media storage under media_name; replaces if it exists. */
export async function uploadMedia(mediaName: string, bytes: Uint8Array): Promise<void> {
  // Idempotent replace: delete-if-exists (404 is fine), then POST.
  const del = await fetch(`${API}/media/${encodeURIComponent(mediaName)}`, {
    method: 'DELETE',
    headers: auth(),
  });
  if (!del.ok && del.status !== 404)
    throw new Error(`media delete failed ${del.status} for ${mediaName}`);

  const form = new FormData();
  form.append('media_name', mediaName);
  form.append('media', new Blob([BufferSource(bytes)], { type: 'audio/mpeg' }), `${mediaName}.mp3`);
  const res = await fetch(`${API}/media`, { method: 'POST', headers: auth(), body: form });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`media upload failed ${res.status} for ${mediaName}: ${body.slice(0, 200)}`);
  }
}

function BufferSource(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

/** Stream a stored media file (for console playback). Returns null if missing. */
export async function downloadMedia(mediaName: string): Promise<ReadableStream | null> {
  const res = await fetch(`${API}/media/${encodeURIComponent(mediaName)}/download`, {
    headers: auth(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`media download failed ${res.status} for ${mediaName}`);
  return res.body;
}
