'use client';

import { useMemo, useState } from 'react';
import { parseCsv, suggestMapping, isValidNanp, CANONICAL_FIELDS } from '@/lib/csv';
import { startBatch, appendRows, type MappedRow } from './actions';

type Program = { id: string; slug: string; name: string; tenant_slug?: string };
type Source = { id: string; name: string; kind: string };

const CHUNK = 400;
const MAX_ROWS = 50000;

export function IntakeWizard({ programs, sources }: { programs: Program[]; sources: Source[] }) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? '');
  const [leadType, setLeadType] = useState<'fresh' | 'revive'>('revive');
  const [sourceId, setSourceId] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'pick' | 'map' | 'uploading' | 'done' | 'error'>('pick');
  const [progress, setProgress] = useState({ sent: 0, accepted: 0, rejected: {} as Record<string, number> });
  const [errorMsg, setErrorMsg] = useState('');

  const preview = useMemo(() => rows.slice(0, 5), [rows]);
  const phoneMapped = Object.values(mapping).includes('phone');
  const localBadPhones = useMemo(() => {
    if (!phoneMapped || rows.length === 0) return 0;
    const idx = headers.findIndex((h) => mapping[h] === 'phone');
    return rows.reduce((n, r) => n + (isValidNanp(r[idx] ?? '') ? 0 : 1), 0);
  }, [rows, headers, mapping, phoneMapped]);

  async function onFile(f: File) {
    const text = await f.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setErrorMsg('File has no data rows.');
      setPhase('error');
      return;
    }
    if (parsed.length - 1 > MAX_ROWS) {
      setErrorMsg(`File has ${parsed.length - 1} rows — cap is ${MAX_ROWS}. Split it.`);
      setPhase('error');
      return;
    }
    setFileName(f.name);
    setHeaders(parsed[0].map((h) => h.trim()));
    setRows(parsed.slice(1));
    setMapping(suggestMapping(parsed[0].map((h) => h.trim())));
    setPhase('map');
  }

  function toMapped(r: string[]): MappedRow {
    const out: MappedRow = { phone: '' };
    const payload: Record<string, string> = {};
    headers.forEach((h, i) => {
      const target = mapping[h];
      const v = (r[i] ?? '').trim();
      if (!v || target === 'ignore') return;
      if (target === 'payload') payload[h] = v;
      else (out as unknown as Record<string, string>)[target] = v;
    });
    if (Object.keys(payload).length) out.payload = payload;
    return out;
  }

  async function commit() {
    setPhase('uploading');
    try {
      const { batchId } = await startBatch(programId, fileName, leadType, sourceId || null, mapping);
      let sent = 0;
      let accepted = 0;
      const rejected: Record<string, number> = {};
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map(toMapped);
        const rep = await appendRows(batchId, chunk);
        sent += chunk.length;
        accepted += rep.accepted;
        for (const [k, v] of Object.entries(rep.rejected)) rejected[k] = (rejected[k] ?? 0) + v;
        setProgress({ sent, accepted, rejected: { ...rejected } });
      }
      setPhase('done');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }

  const box = { background: 'var(--panel)', borderColor: 'var(--line)' } as const;

  if (phase === 'pick' || phase === 'error')
    return (
      <div className="rounded-xl border p-5" style={box}>
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            Program
            <select value={programId} onChange={(e) => setProgramId(e.target.value)}
              className="rounded border px-2 py-1" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.tenant_slug} / {p.slug}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Type
            <select value={leadType} onChange={(e) => setLeadType(e.target.value as 'fresh' | 'revive')}
              className="rounded border px-2 py-1" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
              <option value="revive">revive</option>
              <option value="fresh">fresh</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Source
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}
              className="rounded border px-2 py-1" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
              <option value="">(none)</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.kind})</option>
              ))}
            </select>
          </label>
        </div>
        <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {phase === 'error' ? <p className="mt-3 text-sm" style={{ color: 'var(--bad)' }}>{errorMsg}</p> : null}
      </div>
    );

  if (phase === 'map')
    return (
      <div className="rounded-xl border p-5" style={box}>
        <p className="mb-3 text-sm" style={{ color: 'var(--muted)' }}>
          <span className="font-medium" style={{ color: 'var(--text)' }}>{fileName}</span> — {rows.length} rows.
          Map each column; unmapped columns are kept on the lead as extra data (payload).
        </p>
        <table className="mb-4 w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--muted)' }}>
              <th className="p-1 text-left">CSV column</th>
              <th className="p-1 text-left">Maps to</th>
              <th className="p-1 text-left">Sample values</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((h, i) => (
              <tr key={h + i} className="border-t" style={{ borderColor: 'var(--line)' }}>
                <td className="p-1 font-mono text-xs">{h}</td>
                <td className="p-1">
                  <select value={mapping[h]} onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                    className="rounded border px-2 py-1" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
                    {CANONICAL_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                    <option value="payload">keep as payload</option>
                    <option value="ignore">ignore</option>
                  </select>
                </td>
                <td className="p-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {preview.map((r) => r[i]).filter(Boolean).slice(0, 3).join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!phoneMapped ? (
          <p className="mb-3 text-sm" style={{ color: 'var(--bad)' }}>Map a Phone column to continue.</p>
        ) : localBadPhones > 0 ? (
          <p className="mb-3 text-sm" style={{ color: 'var(--warn)' }}>
            {localBadPhones} rows have invalid phone numbers — they will be rejected (everything else uploads).
          </p>
        ) : null}
        <div className="flex gap-3">
          <button onClick={commit} disabled={!phoneMapped}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            Upload {rows.length} rows
          </button>
          <button onClick={() => setPhase('pick')} className="text-sm underline" style={{ color: 'var(--muted)' }}>
            start over
          </button>
        </div>
      </div>
    );

  return (
    <div className="rounded-xl border p-5" style={box}>
      <p className="mb-2 text-sm font-medium">
        {phase === 'uploading' ? `Uploading… ${progress.sent}/${rows.length}` : 'Batch committed.'}
      </p>
      <p className="text-sm">
        accepted <span style={{ color: 'var(--good)' }}>{progress.accepted}</span>
        {Object.entries(progress.rejected).map(([k, v]) => (
          <span key={k}>
            {' '}· {k.replaceAll('_', ' ')} <span style={{ color: 'var(--warn)' }}>{v}</span>
          </span>
        ))}
      </p>
      {phase === 'done' ? (
        <button onClick={() => location.reload()} className="mt-3 text-sm underline" style={{ color: 'var(--accent)' }}>
          done — refresh batches
        </button>
      ) : null}
    </div>
  );
}
