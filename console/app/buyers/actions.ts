'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { userCanOperate } from '@/lib/programs';
import { toDigits, isValidNanp } from '@/lib/csv';

export type BuyerRow = {
  name: string;
  transfer_number: string;
  branding_name?: string;
  daily_cap?: string;
  priority?: string;
  payout?: string;
  tz?: string;
  open?: string;
  close?: string;
};

export type BuyerReport = { accepted: number; rejected: Record<string, number> };

async function authorize(programId: string) {
  const user = await requireRole('operator');
  const db = supabaseAdmin();
  const { data: program } = await db
    .from('programs')
    .select('id, tenant_id, slug, vertical')
    .eq('id', programId)
    .single();
  if (!program || !userCanOperate(user, program.tenant_id))
    throw new Error('Not authorized for this program');
  return { user, db, program };
}

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

export async function importBuyers(programId: string, rows: BuyerRow[]): Promise<BuyerReport> {
  const { user, db, program } = await authorize(programId);

  const rejected: Record<string, number> = {};
  const reject = (r: string) => (rejected[r] = (rejected[r] ?? 0) + 1);

  const inserts = [];
  for (const r of rows) {
    if (!r.name?.trim()) { reject('missing_name'); continue; }
    const isSip = r.transfer_number?.trim().toLowerCase().startsWith('sip:');
    if (!isSip && !isValidNanp(r.transfer_number ?? '')) { reject('bad_transfer_number'); continue; }
    if ((r.open && !TIME_RE.test(r.open)) || (r.close && !TIME_RE.test(r.close))) {
      reject('bad_hours'); continue;
    }
    const num = (v?: string) => {
      if (!v) return null;
      const n = Number(v.replace(/[^0-9.]/g, ''));
      return Number.isFinite(n) ? n : null;
    };
    inserts.push({
      name: r.name.trim(),
      vertical: program.vertical ?? 'tenant',
      branding_name: r.branding_name?.trim() || null,
      program_id: programId,
      transfer_number: isSip ? r.transfer_number.trim() : `+1${toDigits(r.transfer_number)}`,
      calling_hours:
        r.open && r.close ? { tz: r.tz?.trim() || 'America/Los_Angeles', open: r.open, close: r.close } : null,
      daily_cap: num(r.daily_cap),
      priority: num(r.priority) ?? 100,
      payout: num(r.payout),
      active: true,
    });
  }

  if (inserts.length) {
    const { error } = await db.from('clients').insert(inserts);
    if (error) throw new Error(error.message);
  }

  await db.from('console_audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'buyers.import',
    target: program.slug,
    detail: { accepted: inserts.length, rejected },
  });

  revalidatePath('/buyers');
  return { accepted: inserts.length, rejected };
}

export async function setBuyerActive(clientId: string, active: boolean): Promise<void> {
  const db0 = supabaseAdmin();
  const { data: client } = await db0
    .from('clients')
    .select('id, name, program_id')
    .eq('id', clientId)
    .single();
  if (!client?.program_id) throw new Error('Not a console-managed buyer');
  const { user, db, program } = await authorize(client.program_id);

  const { error } = await db.from('clients').update({ active }).eq('id', clientId);
  if (error) throw new Error(error.message);

  await db.from('console_audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action: active ? 'buyer.activate' : 'buyer.deactivate',
    target: `${program.slug}:${client.name}`,
    detail: {},
  });
  revalidatePath('/buyers');
}
