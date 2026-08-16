import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { visiblePrograms } from '@/lib/programs';
import { Nav } from '../nav';
import { IntakeWizard } from './wizard';
import { UndoButton } from './undo';

export const dynamic = 'force-dynamic';

export default async function IntakePage() {
  const user = await requireUser();
  const programs = await visiblePrograms(user);
  const db = supabaseAdmin();

  const tenantIds = user.memberships.map((m) => m.tenant_id);
  const [{ data: sources }, { data: batches }] = await Promise.all([
    tenantIds.length
      ? db
          .from('lead_sources')
          .select('id, name, kind, tenant_id')
          .eq('active', true)
          .or(`tenant_id.is.null,tenant_id.in.(${tenantIds.join(',')})`)
      : Promise.resolve({ data: [] as never[] }),
    programs.length
      ? db
          .from('lead_batches')
          .select('*')
          .in('program_id', programs.map((p) => p.id))
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const programName = (id: string) => programs.find((p) => p.id === id)?.slug ?? id.slice(0, 8);

  return (
    <>
      <Nav email={user.email} />
      <main className="mx-auto max-w-4xl p-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">Lead intake</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            CSV upload into a program&apos;s dial pool: map columns, validate, commit as an
            undoable batch. Rejects (bad phone, DNC, duplicate) never enter the pool.
          </p>
        </header>

        <IntakeWizard
          programs={programs.map((p) => ({ id: p.id, slug: p.slug, name: p.name, tenant_slug: p.tenant_slug }))}
          sources={(sources ?? []).map((s) => ({ id: s.id, name: s.name, kind: s.kind }))}
        />

        <h2 className="mb-2 mt-10 text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Recent batches
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--muted)' }}>
              <th className="p-2 text-left">When</th>
              <th className="p-2 text-left">Program</th>
              <th className="p-2 text-left">File</th>
              <th className="p-2 text-right">Rows</th>
              <th className="p-2 text-right">Accepted</th>
              <th className="p-2 text-right">Rejected</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {(batches ?? []).map((b) => (
              <tr key={b.id} className="border-t" style={{ borderColor: 'var(--line)' }}>
                <td className="p-2">{new Date(b.created_at).toLocaleString()}</td>
                <td className="p-2 font-mono text-xs">{programName(b.program_id)}</td>
                <td className="p-2">{b.file_name}</td>
                <td className="p-2 text-right">{b.row_count}</td>
                <td className="p-2 text-right" style={{ color: 'var(--good)' }}>{b.accepted_count}</td>
                <td className="p-2 text-right" style={{ color: b.rejected_count ? 'var(--warn)' : undefined }}>
                  {b.rejected_count}
                </td>
                <td className="p-2">{b.status}</td>
                <td className="p-2 text-right">
                  {b.status === 'committed' ? <UndoButton batchId={b.id} /> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
