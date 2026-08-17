'use client';

import { useState, useTransition, Fragment } from 'react';
import { getTurns, type TurnView } from './actions';

export type CallView = {
  id: string;
  started_at: string | null;
  duration_sec: number | null;
  disposition: string | null;
  contact_quality: string | null;
  direction: string;
  has_recording: boolean;
  canned_seconds: number | null;
  tts_seconds: number | null;
  program: string;
  who: string;
};

const QUALITY_COLOR: Record<string, string> = {
  human: 'var(--good)', voicemail: 'var(--muted)', ivr: 'var(--warn)',
  spam: 'var(--bad)', unknown: 'var(--muted)',
};

export function CallRow({ call }: { call: CallView }) {
  const [turns, setTurns] = useState<TurnView[] | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (open) return setOpen(false);
    setOpen(true);
    if (!turns) startTransition(async () => setTurns(await getTurns(call.id)));
  }

  return (
    <Fragment>
      <tr onClick={toggle} className="cursor-pointer border-t hover:opacity-80" style={{ borderColor: 'var(--line)' }}>
        <td className="p-2 whitespace-nowrap">{call.started_at ? new Date(call.started_at).toLocaleString() : '—'}</td>
        <td className="p-2 font-mono text-xs">{call.program}</td>
        <td className="p-2">{call.who}</td>
        <td className="p-2">
          <span style={{ color: QUALITY_COLOR[call.contact_quality ?? 'unknown'] }}>
            {call.contact_quality ?? '—'}
          </span>
        </td>
        <td className="p-2">{call.disposition ?? '—'}</td>
        <td className="p-2 text-right">{call.duration_sec != null ? `${call.duration_sec}s` : '—'}</td>
        <td className="p-2 text-right text-xs" style={{ color: 'var(--muted)' }}>
          {call.canned_seconds != null || call.tts_seconds != null
            ? `${call.canned_seconds ?? 0}/${call.tts_seconds ?? 0}s`
            : '—'}
        </td>
        <td className="p-2 text-xs">{call.has_recording ? '●' : ''}</td>
      </tr>
      {open ? (
        <tr className="border-t" style={{ borderColor: 'var(--line)' }}>
          <td colSpan={8} className="p-3" style={{ background: 'var(--panel)' }}>
            {pending || !turns ? (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>loading turns…</span>
            ) : turns.length === 0 ? (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>no per-turn log for this call</span>
            ) : (
              <div className="space-y-1">
                {turns.map((t) => (
                  <div key={t.turn_index} className="flex items-center gap-3 text-xs">
                    <span className="w-6 text-right font-mono" style={{ color: 'var(--muted)' }}>#{t.turn_index}</span>
                    <span className="w-14" style={{ color: t.source === 'canned' ? 'var(--good)' : 'var(--warn)' }}>
                      {t.source}
                    </span>
                    <span className="flex-1">{t.what}</span>
                    {t.outcome ? <span style={{ color: 'var(--muted)' }}>→ {t.outcome}</span> : null}
                    {t.audio_sec != null ? <span style={{ color: 'var(--muted)' }}>{t.audio_sec.toFixed(1)}s</span> : null}
                    {t.media ? <audio controls preload="none" src={`/clips/${t.media}`} className="h-6 w-40" /> : null}
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
