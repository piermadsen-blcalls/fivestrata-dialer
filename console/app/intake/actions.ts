'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { userCanOperate } from '@/lib/programs';
import { toDigits, isValidNanp } from '@/lib/csv';

export type MappedRow = {
  phone: string;
  first_name?: string;
  last_name?: string;
  address1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  email?: string;
  external_lead_id?: string;
  source?: string;
  acquisition_cost?: string;
  payload?: Record<string, string>;
};

export type ChunkReport = {
  accepted: number;
  rejected: Record<string, number>; // reason -> count
};

async function authorizeProgram(programId: string) {
  const user = await requireRole('operator');
  const db = supabaseAdmin();
  const { data: program } = await db
    .from('programs')
    .select('id, tenant_id, slug')
    .eq('id', programId)
    .single();
  if (!program || !userCanOperate(user, program.tenant_id))
    throw new Error('Not authorized for this program');
  return { user, db, program };
}

export async function startBatch(
  programId: string,
  fileName: string,
  leadType: 'fresh' | 'revive',
  sourceId: string | null,
  mapping: Record<string, string>,
): Promise<{ batchId: string }> {
  const { user, db, program } = await authorizeProgram(programId);

  const { data, error } = await db
    .from('lead_batches')
    .insert({
      program_id: programId,
      source_id: sourceId,
      file_name: fileName,
      uploaded_by: user.email,
      mapping: { ...mapping, lead_type: leadType },
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await db.from('console_audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'batch.start',
    target: program.slug,
    detail: { file: fileName, lead_type: leadType },
  });
  return { batchId: data.id };
}

/** Insert one chunk (client sends <=500 rows/call to stay under action body limits). */
export async function appendRows(
  batchId: string,
  rows: MappedRow[],
): Promise<ChunkReport> {
  const db0 = supabaseAdmin();
  const { data: batch } = await db0
    .from('lead_batches')
    .select('id, program_id, source_id, mapping, status')
    .eq('id', batchId)
    .single();
  if (!batch || batch.status !== 'committed') throw new Error('Unknown or undone batch');
  const { db, program } = await authorizeProgram(batch.program_id);

  const rejected: Record<string, number> = {};
  const reject = (reason: string) => (rejected[reason] = (rejected[reason] ?? 0) + 1);

  // Phone validation + in-chunk dedupe
  const seen = new Set<string>();
  const candidates: (MappedRow & { digits: string })[] = [];
  for (const r of rows) {
    if (!isValidNanp(r.phone ?? '')) {
      reject('bad_phone');
      continue;
    }
    const digits = toDigits(r.phone);
    if (seen.has(digits)) {
      reject('duplicate_in_file');
      continue;
    }
    seen.add(digits);
    candidates.push({ ...r, digits });
  }

  const digitsList = candidates.map((c) => c.digits);
  const [dncRes, dupRes] = await Promise.all([
    db.from('dnc_numbers').select('phone_digits').in('phone_digits', digitsList),
    db
      .from('leads')
      .select('phone_number')
      .eq('program_id', batch.program_id)
      .is('removed_at', null)
      .in('phone_number', digitsList.map((d) => `+1${d}`)),
  ]);
  const dnc = new Set((dncRes.data ?? []).map((r) => r.phone_digits as string));
  const dupes = new Set((dupRes.data ?? []).map((r) => toDigits(r.phone_number as string)));

  const leadType = (batch.mapping as Record<string, string>)?.lead_type === 'fresh' ? 'fresh' : 'revive';
  const inserts = [];
  for (const c of candidates) {
    if (dnc.has(c.digits)) {
      reject('dnc');
      continue;
    }
    if (dupes.has(c.digits)) {
      reject('duplicate_in_pool');
      continue;
    }
    const cost = c.acquisition_cost ? Number(c.acquisition_cost.replace(/[^0-9.]/g, '')) : null;
    inserts.push({
      phone_number: `+1${c.digits}`,
      first_name: c.first_name || null,
      last_name: c.last_name || null,
      address1: c.address1 || null,
      city: c.city || null,
      state: c.state || null,
      postal_code: c.postal_code || null,
      email: c.email || null,
      oleadid: c.external_lead_id || null,
      source: c.source || null,
      lead_type: leadType,
      status: 'received',
      program_id: batch.program_id,
      batch_id: batchId,
      source_id: batch.source_id,
      acquisition_cost: Number.isFinite(cost) ? cost : null,
      payload: c.payload && Object.keys(c.payload).length ? c.payload : null,
    });
  }

  if (inserts.length) {
    const { error } = await db.from('leads').insert(inserts);
    if (error) throw new Error(`insert failed: ${error.message}`);
  }

  // Roll counts into the batch (read-modify-write is fine: single uploader per batch)
  const rejectedCount = Object.values(rejected).reduce((a, b) => a + b, 0);
  const { data: cur } = await db
    .from('lead_batches')
    .select('row_count, accepted_count, rejected_count, reject_summary')
    .eq('id', batchId)
    .single();
  const summary = { ...(cur?.reject_summary as Record<string, number>) };
  for (const [k, v] of Object.entries(rejected)) summary[k] = (summary[k] ?? 0) + v;
  await db
    .from('lead_batches')
    .update({
      row_count: (cur?.row_count ?? 0) + rows.length,
      accepted_count: (cur?.accepted_count ?? 0) + inserts.length,
      rejected_count: (cur?.rejected_count ?? 0) + rejectedCount,
      reject_summary: summary,
    })
    .eq('id', batchId);

  void program;
  return { accepted: inserts.length, rejected };
}

/** Undo an entire batch: soft-delete its leads, mark the batch undone. */
export async function undoBatch(batchId: string): Promise<{ removed: number }> {
  const db0 = supabaseAdmin();
  const { data: batch } = await db0
    .from('lead_batches')
    .select('id, program_id, file_name, status')
    .eq('id', batchId)
    .single();
  if (!batch) throw new Error('Unknown batch');
  const { user, db, program } = await authorizeProgram(batch.program_id);
  if (batch.status === 'undone') return { removed: 0 };

  const now = new Date().toISOString();
  const { data: removedRows, error } = await db
    .from('leads')
    .update({ removed_at: now })
    .eq('batch_id', batchId)
    .is('removed_at', null)
    .select('id');
  if (error) throw new Error(error.message);
  await db.from('lead_batches').update({ status: 'undone' }).eq('id', batchId);

  await db.from('console_audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'batch.undo',
    target: program.slug,
    detail: { batch_id: batchId, file: batch.file_name, removed: removedRows?.length ?? 0 },
  });

  revalidatePath('/intake');
  return { removed: removedRows?.length ?? 0 };
}
