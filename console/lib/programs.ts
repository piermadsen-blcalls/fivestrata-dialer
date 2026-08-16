import 'server-only';
import { supabaseAdmin } from './supabase-server';
import type { ConsoleUser } from './auth';

export type ProgramRow = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  vertical: string | null;
  status: string;
  calling_hours: unknown;
  max_dials_per_lead?: number;
  min_rest_hours?: number;
  daily_dial_budget?: number | null;
  source_rules?: Record<string, unknown>;
  tenant_slug?: string;
};

/** Programs belonging to tenants the user is a member of. */
export async function visiblePrograms(user: ConsoleUser): Promise<ProgramRow[]> {
  const tenantIds = user.memberships.map((m) => m.tenant_id);
  if (tenantIds.length === 0) return [];
  const db = supabaseAdmin();
  const { data } = await db
    .from('programs')
    .select('*, tenants ( slug )')
    .in('tenant_id', tenantIds)
    .order('slug');
  return (data ?? []).map((p) => ({
    ...p,
    tenant_slug: (p.tenants as unknown as { slug: string } | null)?.slug,
  })) as ProgramRow[];
}

export function userCanOperate(user: ConsoleUser, tenantId: string): boolean {
  return user.memberships.some(
    (m) => m.tenant_id === tenantId && (m.role === 'admin' || m.role === 'operator'),
  );
}
