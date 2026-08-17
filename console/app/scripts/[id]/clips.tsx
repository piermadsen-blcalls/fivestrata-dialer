'use client';

import { useState } from 'react';
import { generateClip } from '../clip-actions';

type Line = {
  id: string;
  line_index: number;
  tag: string;
  text: string;
  must_hit: boolean;
  media: string | null;
};

export function ClipPanel({ scriptId, lines: initial }: { scriptId: string; lines: Line[] }) {
  const [lines, setLines] = useState(initial);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');

  async function generateOne(lineId: string) {
    const res = await generateClip(scriptId, lineId);
    if (res.ok && res.mediaName) {
      setLines((ls) => ls.map((l) => (l.id === lineId ? { ...l, media: res.mediaName! } : l)));
    }
    return res;
  }

  async function generateAll() {
    setRunning(true);
    let done = 0;
    for (const l of lines) {
      setStatus(`Generating ${done + 1}/${lines.length}…`);
      const res = await generateOne(l.id);
      if (!res.ok) {
        setStatus(`Stopped at line ${l.line_index}: ${res.message}`);
        setRunning(false);
        return;
      }
      done++;
    }
    setStatus(`Done — ${done} clips generated.`);
    setRunning(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={generateAll} disabled={running}
          className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {running ? 'Generating…' : lines.some((l) => l.media) ? 'Regenerate all clips' : 'Generate all clips'}
        </button>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>{status}</span>
      </div>

      <div className="space-y-2">
        {lines.map((l) => (
          <div key={l.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="w-8 text-right font-mono text-xs" style={{ color: 'var(--muted)' }}>
              {l.line_index}
            </span>
            <span className="w-28 shrink-0 text-xs" style={{ color: l.must_hit ? 'var(--warn)' : 'var(--muted)' }}>
              {l.must_hit ? '⚑ must-hit' : l.tag}
            </span>
            <span className="flex-1">{l.text}</span>
            {l.media ? (
              <audio controls preload="none" src={`/clips/${l.media}`} className="h-8 w-56" />
            ) : (
              <button onClick={() => generateOne(l.id)} disabled={running}
                className="text-xs underline disabled:opacity-40" style={{ color: 'var(--accent)' }}>
                generate
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
