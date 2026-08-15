import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type Tenant = { id: string; slug: string; name: string; status: string };
type Program = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  vertical: string | null;
  status: string;
};

const statusColor: Record<string, string> = {
  live: 'var(--good)',
  testing: 'var(--accent)',
  paused: 'var(--warn)',
  draft: 'var(--muted)',
  retired: 'var(--bad)',
};

export default async function Home() {
  const db = supabaseAdmin();
  const [{ data: tenants }, { data: programs }] = await Promise.all([
    db.from('tenants').select('*').order('slug'),
    db.from('programs').select('*').order('slug'),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">AICC Console</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Phase 0 shell — tenant/program backbone live. Auth and operating screens land next.
        </p>
      </header>

      {(tenants ?? []).map((t: Tenant) => (
        <section
          key={t.id}
          className="mb-6 rounded-xl border p-5"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-medium">{t.name}</h2>
            <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              {t.slug} · {t.status}
            </span>
          </div>
          <ul className="space-y-2">
            {(programs ?? [])
              .filter((p: Program) => p.tenant_id === t.id)
              .map((p: Program) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span>
                    {p.name}
                    {p.vertical ? (
                      <span style={{ color: 'var(--muted)' }}> · {p.vertical}</span>
                    ) : null}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ color: statusColor[p.status] ?? 'var(--muted)', border: '1px solid var(--line)' }}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
