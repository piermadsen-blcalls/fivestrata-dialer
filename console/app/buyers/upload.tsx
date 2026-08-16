'use client';

import { useState } from 'react';
import { parseCsv } from '@/lib/csv';
import { importBuyers, type BuyerRow, type BuyerReport } from './actions';

type Program = { id: string; slug: string; tenant_slug?: string };

const COLS = ['name', 'transfer_number', 'branding_name', 'daily_cap', 'priority', 'payout', 'tz', 'open', 'close'];

export function BuyerUpload({ programs }: { programs: Program[] }) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? '');
  const [report, setReport] = useState<BuyerReport | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onFile(f: File) {
    setBusy(true);
    setError('');
    setReport(null);
    try {
      const parsed = parseCsv(await f.text());
      if (parsed.length < 2) throw new Error('No data rows.');
      const headers = parsed[0].map((h) => h.trim().toLowerCase().replaceAll(' ', '_'));
      const unknown = headers.filter((h) => !COLS.includes(h));
      if (!headers.includes('name') || !headers.includes('transfer_number'))
        throw new Error('CSV must have name and transfer_number columns.');
      if (unknown.length) throw new Error(`Unknown columns: ${unknown.join(', ')} (allowed: ${COLS.join(', ')})`);
      const rows: BuyerRow[] = parsed.slice(1).map((r) => {
        const o: Record<string, string> = {};
        headers.forEach((h, i) => (o[h] = (r[i] ?? '').trim()));
        return o as unknown as BuyerRow;
      });
      setReport(await importBuyers(programId, rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <div className="mb-3 flex items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          Program
          <select value={programId} onChange={(e) => setProgramId(e.target.value)}
            className="rounded border px-2 py-1" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.tenant_slug} / {p.slug}</option>
            ))}
          </select>
        </label>
        <input type="file" accept=".csv,text/csv" disabled={busy}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
      {busy ? <p className="text-sm" style={{ color: 'var(--muted)' }}>Importing…</p> : null}
      {error ? <p className="text-sm" style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {report ? (
        <p className="text-sm">
          accepted <span style={{ color: 'var(--good)' }}>{report.accepted}</span>
          {Object.entries(report.rejected).map(([k, v]) => (
            <span key={k}> · {k.replaceAll('_', ' ')} <span style={{ color: 'var(--warn)' }}>{v}</span></span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
