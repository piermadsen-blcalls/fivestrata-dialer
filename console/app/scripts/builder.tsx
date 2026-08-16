'use client';

import { useState, useTransition } from 'react';
import { splitScript, saveScript, type LineDraft } from './actions';

type Program = { id: string; slug: string; tenant_slug?: string };

const TAGS = ['greeting', 'info', 'question', 'ack', 'objection', 'close', 'transfer_announce'];

export function ScriptBuilder({ programs }: { programs: Program[] }) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? '');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [lines, setLines] = useState<LineDraft[] | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const fieldStyle = { background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' } as const;

  function doSplit() {
    startTransition(async () => setLines(await splitScript(body)));
  }

  function update(i: number, patch: Partial<LineDraft>) {
    setLines((ls) => ls!.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  function doSave() {
    startTransition(async () => {
      const res = await saveScript(programId, name, body, lines!);
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok) {
        setLines(null);
        setBody('');
        setName('');
      }
    });
  }

  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        <select value={programId} onChange={(e) => setProgramId(e.target.value)}
          className="rounded border px-2 py-1" style={fieldStyle}>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.tenant_slug} / {p.slug}</option>
          ))}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="script name"
          className="rounded border px-2 py-1" style={fieldStyle} />
      </div>

      {lines === null ? (
        <>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
            placeholder="Paste the call script here — one line per spoken sentence works best."
            className="mb-3 w-full rounded border p-3 text-sm" style={fieldStyle} />
          <button onClick={doSplit} disabled={pending || body.trim().length < 10}
            className="rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            {pending ? '…' : 'Split into lines'}
          </button>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm" style={{ color: 'var(--muted)' }}>
            Tag each line. <span style={{ color: 'var(--warn)' }}>Must-hit</span> lines are
            compliance-locked: never A/B-tested, never touched by the clip-improvement loop, and
            the agent cannot transfer until they have played.
          </p>
          <div className="mb-3 max-h-96 space-y-1 overflow-y-auto">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <select value={l.must_hit ? 'must_hit' : l.tag} disabled={l.must_hit}
                  onChange={(e) => update(i, { tag: e.target.value })}
                  className="w-36 rounded border px-1 py-0.5 text-xs" style={fieldStyle}>
                  {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                  {l.must_hit ? <option value="must_hit">must_hit</option> : null}
                </select>
                <label className="flex items-center gap-1 text-xs" style={{ color: 'var(--warn)' }}>
                  <input type="checkbox" checked={l.must_hit}
                    onChange={(e) => update(i, { must_hit: e.target.checked })} />
                  must-hit
                </label>
                <span className="flex-1" style={{ color: l.must_hit ? 'var(--warn)' : 'var(--text)' }}>
                  {l.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={doSave} disabled={pending || !name.trim()}
              className="rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {pending ? 'Saving…' : `Save ${lines.length} lines`}
            </button>
            <button onClick={() => setLines(null)} className="text-sm underline" style={{ color: 'var(--muted)' }}>
              back to paste
            </button>
          </div>
        </>
      )}
      {message ? (
        <p className="mt-3 text-sm" style={{ color: message.ok ? 'var(--good)' : 'var(--bad)' }}>{message.text}</p>
      ) : null}
    </div>
  );
}
