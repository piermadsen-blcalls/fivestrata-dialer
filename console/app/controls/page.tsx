import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { EDITABLE_KEYS, SECRET_KEYS } from './keys';
import { ControlRow } from './row';
import { Nav } from '../nav';

export const dynamic = 'force-dynamic';

export default async function ControlsPage() {
  const user = await requireUser();
  const canEdit = user.memberships.some((m) => m.role === 'admin' || m.role === 'operator');

  const db = supabaseAdmin();
  const editableKeys = Object.keys(EDITABLE_KEYS);
  const [{ data: editable }, { data: secrets }] = await Promise.all([
    db.from('dialer_config').select('key, value, updated_at').in('key', editableKeys),
    db.from('dialer_config').select('key, updated_at').in('key', SECRET_KEYS),
  ]);

  const valueOf = (k: string) => editable?.find((r) => r.key === k)?.value ?? '';
  const updatedOf = (k: string) => editable?.find((r) => r.key === k)?.updated_at ?? null;

  return (
    <>
    <Nav email={user.email} />
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Controls</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Live platform switches — the engine reads these keys on the next call/request.
          Every change is audit-logged.
          {!canEdit ? ' You have viewer access: read-only.' : ''}
        </p>
      </header>

      <section className="space-y-4">
        {Object.entries(EDITABLE_KEYS).map(([key, spec]) => (
          <ControlRow
            key={key}
            configKey={key}
            spec={spec}
            value={valueOf(key)}
            updatedAt={updatedOf(key)}
            readOnly={!canEdit}
          />
        ))}
      </section>

      <h2 className="mb-2 mt-10 text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        Secrets (managed outside the console)
      </h2>
      <ul
        className="divide-y rounded-xl border text-sm"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {SECRET_KEYS.map((k) => {
          const row = secrets?.find((r) => r.key === k);
          return (
            <li key={k} className="flex items-center justify-between px-4 py-3" style={{ borderColor: 'var(--line)' }}>
              <span className="font-mono text-xs">{k}</span>
              <span style={{ color: row ? 'var(--good)' : 'var(--bad)' }}>
                {row ? '•••• set' : 'not set'}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
    </>
  );
}
