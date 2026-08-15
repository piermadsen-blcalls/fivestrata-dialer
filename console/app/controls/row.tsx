'use client';

import { useState, useTransition } from 'react';
import type { KeySpec } from './keys';
import { saveConfigKey } from './actions';

export function ControlRow({
  configKey,
  spec,
  value,
  updatedAt,
  readOnly,
}: {
  configKey: string;
  spec: KeySpec;
  value: string;
  updatedAt: string | null;
  readOnly: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = draft !== value;

  function save(next?: string) {
    const v = next ?? draft;
    startTransition(async () => {
      const res = await saveConfigKey(configKey, v);
      setMessage({ ok: res.ok, text: res.message });
    });
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      <div className="mb-1 flex items-center justify-between">
        <div>
          <span className="font-medium">{spec.label}</span>
          <span className="ml-2 font-mono text-xs" style={{ color: 'var(--muted)' }}>
            {configKey}
          </span>
        </div>
        {updatedAt ? (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            updated {new Date(updatedAt).toLocaleString()}
          </span>
        ) : null}
      </div>
      <p className="mb-3 text-sm" style={{ color: 'var(--muted)' }}>
        {spec.description}
      </p>

      {spec.type === 'boolean' ? (
        <button
          disabled={readOnly || pending}
          onClick={() => {
            const next = value === 'true' ? 'false' : 'true';
            setDraft(next);
            save(next);
          }}
          className="rounded-full px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          style={{
            background: value === 'true' ? 'var(--good)' : 'var(--line)',
            color: value === 'true' ? '#04210f' : 'var(--text)',
          }}
        >
          {pending ? '…' : value === 'true' ? 'ON — click to disable' : 'OFF — click to enable'}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            value={draft}
            disabled={readOnly || pending}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-1.5 font-mono text-sm outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
          />
          <button
            disabled={readOnly || pending || !dirty}
            onClick={() => save()}
            className="rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {message ? (
        <p className="mt-2 text-xs" style={{ color: message.ok ? 'var(--good)' : 'var(--bad)' }}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
