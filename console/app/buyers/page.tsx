import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { visiblePrograms } from '@/lib/programs';
import { Nav } from '../nav';
import { BuyerUpload } from './upload';
import { ActiveToggle } from './toggle';

export const dynamic = 'force-dynamic';

export default async function BuyersPage() {
  const user = await requireUser();
  const programs = await visiblePrograms(user);
  const db = supabaseAdmin();

  const { data: buyers } = programs.length
    ? await db
        .from('clients')
        .select('*')
        .in('program_id', programs.map((p) => p.id))
        .order('priority')
    : { data: [] as never[] };

  const programName = (id: string | null) => programs.find((p) => p.id === id)?.slug ?? '—';
  const hours = (h: { tz?: string; open?: string; close?: string } | null) =>
    h?.open ? `${h.open}–${h.close} ${h.tz?.split('/')[1] ?? h.tz}` : 'always';

  return (
    <>
      <Nav email={user.email} />
      <main className="mx-auto max-w-4xl p-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">Buyers</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Program-scoped transfer buyers (the internal pre-auth pool for tenants outside
            Command Center). CSV columns: name, transfer_number, branding_name, daily_cap,
            priority, payout, tz, open, close.
          </p>
        </header>

        <BuyerUpload
          programs={programs.map((p) => ({ id: p.id, slug: p.slug, tenant_slug: p.tenant_slug }))}
        />

        <h2 className="mb-2 mt-10 text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Buyer pool
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--muted)' }}>
              <th className="p-2 text-left">Program</th>
              <th className="p-2 text-left">Buyer</th>
              <th className="p-2 text-left">Transfer to</th>
              <th className="p-2 text-left">Hours</th>
              <th className="p-2 text-right">Cap/day</th>
              <th className="p-2 text-right">Priority</th>
              <th className="p-2 text-right">Payout</th>
              <th className="p-2 text-left">Active</th>
            </tr>
          </thead>
          <tbody>
            {(buyers ?? []).map((b) => (
              <tr key={b.id} className="border-t" style={{ borderColor: 'var(--line)', opacity: b.active ? 1 : 0.5 }}>
                <td className="p-2 font-mono text-xs">{programName(b.program_id)}</td>
                <td className="p-2">
                  {b.name}
                  {b.branding_name ? (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}> “{b.branding_name}”</span>
                  ) : null}
                </td>
                <td className="p-2 font-mono text-xs">{b.transfer_number ?? '—'}</td>
                <td className="p-2 text-xs">{hours(b.calling_hours)}</td>
                <td className="p-2 text-right">{b.daily_cap ?? '∞'}</td>
                <td className="p-2 text-right">{b.priority}</td>
                <td className="p-2 text-right">{b.payout != null ? `$${Number(b.payout).toFixed(2)}` : '—'}</td>
                <td className="p-2">
                  <ActiveToggle clientId={b.id} active={b.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
