import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { visiblePrograms } from '@/lib/programs';
import { Nav } from '../nav';
import { ScriptBuilder } from './builder';

export const dynamic = 'force-dynamic';

export default async function ScriptsPage() {
  const user = await requireUser();
  const programs = await visiblePrograms(user);
  const db = supabaseAdmin();

  const { data: scripts } = programs.length
    ? await db
        .from('scripts')
        .select('id, name, version, active, program_id, created_at')
        .in('program_id', programs.map((p) => p.id))
        .order('created_at', { ascending: false })
        .limit(25)
    : { data: [] as never[] };

  const lineCounts = new Map<string, { total: number; mustHits: number }>();
  if (scripts?.length) {
    const { data: lines } = await db
      .from('script_lines')
      .select('script_id, must_hit')
      .in('script_id', scripts.map((s) => s.id));
    for (const l of lines ?? []) {
      const c = lineCounts.get(l.script_id) ?? { total: 0, mustHits: 0 };
      c.total++;
      if (l.must_hit) c.mustHits++;
      lineCounts.set(l.script_id, c);
    }
  }
  const programName = (id: string | null) => programs.find((p) => p.id === id)?.slug ?? '—';

  return (
    <>
      <Nav email={user.email} />
      <main className="mx-auto max-w-4xl p-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">Scripts</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Ingest a call script, tag its lines, lock the must-hits. Clip generation per
            voice pack hooks in next (W6 pipeline).
          </p>
        </header>

        <ScriptBuilder
          programs={programs.map((p) => ({ id: p.id, slug: p.slug, tenant_slug: p.tenant_slug }))}
        />

        <h2 className="mb-2 mt-10 text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Script library
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--muted)' }}>
              <th className="p-2 text-left">Program</th>
              <th className="p-2 text-left">Script</th>
              <th className="p-2 text-right">Version</th>
              <th className="p-2 text-right">Lines</th>
              <th className="p-2 text-right">Must-hits</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {(scripts ?? []).map((s) => {
              const c = lineCounts.get(s.id) ?? { total: 0, mustHits: 0 };
              return (
                <tr key={s.id} className="border-t" style={{ borderColor: 'var(--line)' }}>
                  <td className="p-2 font-mono text-xs">{programName(s.program_id)}</td>
                  <td className="p-2">
                    <Link href={`/scripts/${s.id}`} className="underline" style={{ color: 'var(--accent)' }}>
                      {s.name}
                    </Link>
                  </td>
                  <td className="p-2 text-right">v{s.version}</td>
                  <td className="p-2 text-right">{c.total}</td>
                  <td className="p-2 text-right" style={{ color: c.mustHits ? 'var(--warn)' : 'var(--muted)' }}>
                    {c.mustHits}
                  </td>
                  <td className="p-2">{s.active ? 'yes' : 'no'}</td>
                  <td className="p-2">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </>
  );
}
