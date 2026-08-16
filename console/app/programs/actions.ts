'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { userCanOperate } from '@/lib/programs';

export type ProgramSettings = {
  status: string;
  max_dials_per_lead: number;
  min_rest_hours: number;
  daily_dial_budget: number | null;
  source_rules: {
    source_ids: string[];
    cost_min: number | null;
    cost_max: number | null;
    combine: boolean;
  };
};

const STATUSES = ['draft', 'testing', 'live', 'paused', 'retired'];

export async function saveProgramSettings(
  programId: string,
  s: ProgramSettings,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole('operator');
  const db = supabaseAdmin();

  const { data: program } = await db
    .from('programs')
    .select('id, tenant_id, slug, status, tenants ( slug )')
    .eq('id', programId)
    .single();
  if (!program || !userCanOperate(user, program.tenant_id))
    return { ok: false, message: 'Not authorized for this program' };

  if (!STATUSES.includes(s.status)) return { ok: false, message: 'Bad status' };
  if (s.max_dials_per_lead < 1 || s.max_dials_per_lead > 50)
    return { ok: false, message: 'max dials must be 1–50' };
  if (s.min_rest_hours < 0 || s.min_rest_hours > 24 * 90)
    return { ok: false, message: 'rest hours must be 0–2160' };

  // Consent-scope gate (deny-by-default): a program may only draw from sources whose
  // consent_scope matches its tenant slug, or platform sources scoped 'fivestrata' for
  // fs-* programs. Cross-scope use requires the future sign-off flag — hard NO for now.
  const tenantSlug = (program.tenants as unknown as { slug: string } | null)?.slug ?? '';
  if (s.source_rules.source_ids.length) {
    const { data: sources } = await db
      .from('lead_sources')
      .select('id, name, consent_scope')
      .in('id', s.source_rules.source_ids);
    const offScope = (sources ?? []).filter(
      (src) => src.consent_scope && src.consent_scope !== tenantSlug,
    );
    if (offScope.length)
      return {
        ok: false,
        message: `Consent scope blocks: ${offScope.map((s2) => s2.name).join(', ')} — cross-scope use needs compliance sign-off (not yet grantable).`,
      };
  }

  const { error } = await db
    .from('programs')
    .update({
      status: s.status,
      max_dials_per_lead: s.max_dials_per_lead,
      min_rest_hours: s.min_rest_hours,
      daily_dial_budget: s.daily_dial_budget,
      source_rules: s.source_rules,
      updated_at: new Date().toISOString(),
    })
    .eq('id', programId);
  if (error) return { ok: false, message: error.message };

  await db.from('console_audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'program.settings',
    target: program.slug,
    detail: { old_status: program.status, ...s },
  });

  revalidatePath('/programs');
  return { ok: true, message: `${program.slug} saved.` };
}
