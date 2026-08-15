'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { EDITABLE_KEYS } from './keys';

export type SaveResult = { ok: boolean; message: string };

export async function saveConfigKey(key: string, value: string): Promise<SaveResult> {
  const user = await requireRole('operator');

  const spec = EDITABLE_KEYS[key];
  if (!spec) return { ok: false, message: `Key '${key}' is not editable from the console.` };
  if (spec.type === 'boolean' && value !== 'true' && value !== 'false')
    return { ok: false, message: 'Value must be true or false.' };
  if (spec.allowed && value !== '' && !spec.allowed.includes(value))
    return { ok: false, message: `Allowed values: ${spec.allowed.join(', ')} (or empty).` };

  const db = supabaseAdmin();

  const { data: existing } = await db
    .from('dialer_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  const { error } = await db
    .from('dialer_config')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: error.message };

  // Audit (0006). Non-fatal if the table is missing, but always attempted.
  const { error: auditError } = await db.from('console_audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'config.set',
    target: key,
    detail: { old: existing?.value ?? null, new: value },
  });
  if (auditError) console.error('audit write failed:', auditError.message);

  revalidatePath('/controls');
  return { ok: true, message: `${key} saved.` };
}
