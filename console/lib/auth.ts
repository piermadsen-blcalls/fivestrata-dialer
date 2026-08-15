import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseSession } from './supabase-rsc';
import { supabaseAdmin } from './supabase-server';

export type Membership = {
  tenant_id: string;
  role: 'admin' | 'operator' | 'viewer';
  tenant_slug: string;
  tenant_name: string;
};

export type ConsoleUser = {
  id: string;
  email: string;
  memberships: Membership[];
};

/** Signed-in user + their tenant memberships. Redirects to /login if signed out. */
export async function requireUser(): Promise<ConsoleUser> {
  const session = await supabaseSession();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) redirect('/login');

  const db = supabaseAdmin();
  const { data } = await db
    .from('console_memberships')
    .select('tenant_id, role, tenants ( slug, name )')
    .eq('user_id', user.id);

  const memberships: Membership[] = (data ?? []).map((m) => {
    const t = m.tenants as unknown as { slug: string; name: string } | null;
    return {
      tenant_id: m.tenant_id as string,
      role: m.role as Membership['role'],
      tenant_slug: t?.slug ?? '?',
      tenant_name: t?.name ?? '?',
    };
  });

  return { id: user.id, email: user.email ?? '', memberships };
}

/** Requires at least the given role on some tenant; admin > operator > viewer. */
export async function requireRole(min: 'operator' | 'admin'): Promise<ConsoleUser> {
  const user = await requireUser();
  const rank = { viewer: 0, operator: 1, admin: 2 } as const;
  const best = Math.max(0, ...user.memberships.map((m) => rank[m.role]));
  if (best < rank[min]) redirect('/no-access');
  return user;
}
