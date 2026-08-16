import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { visiblePrograms } from '@/lib/programs';
import { Nav } from '../nav';
import { ProgramEditor } from './editor';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const user = await requireUser();
  const programs = await visiblePrograms(user);
  const db = supabaseAdmin();

  const tenantIds = user.memberships.map((m) => m.tenant_id);
  const tenantSlugByProgram = new Map(programs.map((p) => [p.id, p.tenant_slug ?? '']));

  const [{ data: sources }, poolCounts] = await Promise.all([
    tenantIds.length
      ? db
          .from('lead_sources')
          .select('id, name, kind, cost_per_lead, consent_scope, tenant_id')
          .eq('active', true)
          .or(`tenant_id.is.null,tenant_id.in.(${tenantIds.join(',')})`)
      : Promise.resolve({ data: [] as never[] }),
    Promise.all(
      programs.map(async (p) => {
        const { count } = await db
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('program_id', p.id)
          .is('removed_at', null);
        return [p.id, count ?? 0] as const;
      }),
    ),
  ]);
  const pool = new Map(poolCounts);

  return (
    <>
      <Nav email={user.email} />
      <main className="mx-auto max-w-4xl p-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">Programs</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Cadence (max dials, rest between attempts, daily budget), status, and lead
            sourcing rules per program. The queue engine reads these settings at dial time.
          </p>
        </header>

        <div className="space-y-5">
          {programs.map((p) => (
            <ProgramEditor
              key={p.id}
              program={{
                id: p.id,
                slug: p.slug,
                name: p.name,
                tenant_slug: tenantSlugByProgram.get(p.id) ?? '',
                status: p.status,
                max_dials_per_lead: p.max_dials_per_lead ?? 5,
                min_rest_hours: p.min_rest_hours ?? 24,
                daily_dial_budget: p.daily_dial_budget ?? null,
                source_rules: {
                  source_ids: ((p.source_rules as Record<string, unknown>)?.source_ids as string[]) ?? [],
                  cost_min: ((p.source_rules as Record<string, unknown>)?.cost_min as number) ?? null,
                  cost_max: ((p.source_rules as Record<string, unknown>)?.cost_max as number) ?? null,
                  combine: ((p.source_rules as Record<string, unknown>)?.combine as boolean) ?? true,
                },
                pool_count: pool.get(p.id) ?? 0,
              }}
              sources={(sources ?? []).map((s) => ({
                id: s.id,
                name: s.name,
                kind: s.kind,
                cost_per_lead: Number(s.cost_per_lead),
                consent_scope: s.consent_scope,
              }))}
            />
          ))}
        </div>
      </main>
    </>
  );
}
