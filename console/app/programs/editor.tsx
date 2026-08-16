'use client';

import { useState, useTransition } from 'react';
import { saveProgramSettings, type ProgramSettings } from './actions';

type SourceOpt = {
  id: string;
  name: string;
  kind: string;
  cost_per_lead: number;
  consent_scope: string | null;
};

type ProgramView = ProgramSettings & {
  id: string;
  slug: string;
  name: string;
  tenant_slug: string;
  pool_count: number;
};

const STATUS_COLORS: Record<string, string> = {
  live: 'var(--good)', testing: 'var(--accent)', paused: 'var(--warn)',
  draft: 'var(--muted)', retired: 'var(--bad)',
};

export function ProgramEditor({ program, sources }: { program: ProgramView; sources: SourceOpt[] }) {
  const [s, setS] = useState<ProgramSettings>({
    status: program.status,
    max_dials_per_lead: program.max_dials_per_lead,
    min_rest_hours: program.min_rest_hours,
    daily_dial_budget: program.daily_dial_budget,
    source_rules: program.source_rules,
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const inScope = (src: SourceOpt) => !src.consent_scope || src.consent_scope === program.tenant_slug;

  function toggleSource(id: string) {
    const ids = s.source_rules.source_ids.includes(id)
      ? s.source_rules.source_ids.filter((x) => x !== id)
      : [...s.source_rules.source_ids, id];
    setS({ ...s, source_rules: { ...s.source_rules, source_ids: ids } });
  }

  function save() {
    startTransition(async () => {
      const res = await saveProgramSettings(program.id, s);
      setMessage({ ok: res.ok, text: res.message });
    });
  }

  const field = 'w-20 rounded border px-2 py-1 text-sm';
  const fieldStyle = { background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' } as const;

  return (
    <section className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="font-medium">{program.name}</span>
          <span className="ml-2 font-mono text-xs" style={{ color: 'var(--muted)' }}>
            {program.tenant_slug} / {program.slug}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          pool: {program.pool_count.toLocaleString()} leads
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span style={{ color: 'var(--muted)' }}>status</span>
          <select value={s.status} onChange={(e) => setS({ ...s, status: e.target.value })}
            className="rounded border px-2 py-1" style={{ ...fieldStyle, color: STATUS_COLORS[s.status] }}>
            {['draft', 'testing', 'live', 'paused', 'retired'].map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span style={{ color: 'var(--muted)' }}>max dials / lead</span>
          <input type="number" min={1} max={50} value={s.max_dials_per_lead}
            onChange={(e) => setS({ ...s, max_dials_per_lead: Number(e.target.value) })}
            className={field} style={fieldStyle} />
        </label>
        <label className="flex flex-col gap-1">
          <span style={{ color: 'var(--muted)' }}>min rest (hours)</span>
          <input type="number" min={0} max={2160} value={s.min_rest_hours}
            onChange={(e) => setS({ ...s, min_rest_hours: Number(e.target.value) })}
            className={field} style={fieldStyle} />
        </label>
        <label className="flex flex-col gap-1">
          <span style={{ color: 'var(--muted)' }}>daily dial budget</span>
          <input type="number" min={0} placeholder="∞" value={s.daily_dial_budget ?? ''}
            onChange={(e) => setS({ ...s, daily_dial_budget: e.target.value === '' ? null : Number(e.target.value) })}
            className={field} style={fieldStyle} />
        </label>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Lead sourcing
        </p>
        <div className="flex flex-wrap gap-2">
          {sources.map((src) => {
            const selected = s.source_rules.source_ids.includes(src.id);
            const allowed = inScope(src);
            return (
              <button key={src.id} disabled={!allowed} onClick={() => toggleSource(src.id)}
                title={allowed ? '' : `consent scope '${src.consent_scope}' — needs compliance sign-off`}
                className="rounded-full border px-3 py-1 text-xs disabled:opacity-40"
                style={{
                  borderColor: selected ? 'var(--accent)' : 'var(--line)',
                  background: selected ? 'var(--accent)' : 'transparent',
                  color: selected ? '#fff' : 'var(--text)',
                }}>
                {allowed ? '' : '🔒 '}{src.name} · ${src.cost_per_lead.toFixed(2)}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span style={{ color: 'var(--muted)' }}>cost/lead min $</span>
            <input type="number" step="0.01" min={0} placeholder="—" value={s.source_rules.cost_min ?? ''}
              onChange={(e) => setS({ ...s, source_rules: { ...s.source_rules, cost_min: e.target.value === '' ? null : Number(e.target.value) } })}
              className={field} style={fieldStyle} />
          </label>
          <label className="flex flex-col gap-1">
            <span style={{ color: 'var(--muted)' }}>cost/lead max $</span>
            <input type="number" step="0.01" min={0} placeholder="—" value={s.source_rules.cost_max ?? ''}
              onChange={(e) => setS({ ...s, source_rules: { ...s.source_rules, cost_max: e.target.value === '' ? null : Number(e.target.value) } })}
              className={field} style={fieldStyle} />
          </label>
          <label className="flex items-center gap-2 pb-1">
            <input type="checkbox" checked={s.source_rules.combine}
              onChange={(e) => setS({ ...s, source_rules: { ...s.source_rules, combine: e.target.checked } })} />
            <span style={{ color: 'var(--muted)' }}>combine own uploads + selected sources</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending}
          className="rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        {message ? (
          <span className="text-xs" style={{ color: message.ok ? 'var(--good)' : 'var(--bad)' }}>
            {message.text}
          </span>
        ) : null}
      </div>
    </section>
  );
}
