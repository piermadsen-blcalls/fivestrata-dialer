'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { userCanOperate } from '@/lib/programs';

export type LineDraft = { text: string; tag: string; must_hit: boolean };

const TAGS = ['greeting', 'info', 'question', 'ack', 'objection', 'close', 'transfer_announce', 'must_hit'];

/** Paste a script body -> proposed lines (server does the split so it's consistent). */
export async function splitScript(body: string): Promise<LineDraft[]> {
  await requireRole('operator');
  return body
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(\d+[.)]\s*|[-•*]\s*)/, '').trim()) // strip list numbering
    .filter((l) => l.length > 1)
    .map((text) => ({
      text,
      // cheap suggestions; the human tags the rest
      tag: /\?\s*$/.test(text) ? 'question' : /record|consent|licensed|do not call|opt.?out/i.test(text) ? 'must_hit' : 'info',
      must_hit: /record|consent|licensed|do not call|opt.?out/i.test(text),
    }));
}

export async function saveScript(
  programId: string,
  name: string,
  body: string,
  lines: LineDraft[],
): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole('operator');
  const db = supabaseAdmin();

  const { data: program } = await db
    .from('programs')
    .select('id, tenant_id, slug, vertical')
    .eq('id', programId)
    .single();
  if (!program || !userCanOperate(user, program.tenant_id))
    return { ok: false, message: 'Not authorized for this program' };
  if (!name.trim()) return { ok: false, message: 'Script needs a name' };
  if (!lines.length) return { ok: false, message: 'No lines to save' };
  if (lines.some((l) => !TAGS.includes(l.tag))) return { ok: false, message: 'Bad tag' };

  // Version = 1 + latest existing version of this name
  const { data: prior } = await db
    .from('scripts')
    .select('version')
    .eq('name', name.trim())
    .order('version', { ascending: false })
    .limit(1);
  const version = (prior?.[0]?.version ?? 0) + 1;

  const { data: script, error } = await db
    .from('scripts')
    .insert({
      name: name.trim(),
      vertical: program.vertical ?? 'tenant',
      kind: 'soundboard',
      content: body,
      version,
      active: false,
      program_id: programId,
    })
    .select('id')
    .single();
  if (error) return { ok: false, message: error.message };

  const { error: lineErr } = await db.from('script_lines').insert(
    lines.map((l, i) => ({
      script_id: script.id,
      line_index: i,
      tag: l.must_hit ? 'must_hit' : l.tag,
      text: l.text,
      must_hit: l.must_hit,
      ab_testable: !l.must_hit,
    })),
  );
  if (lineErr) return { ok: false, message: `lines failed: ${lineErr.message}` };

  await db.from('console_audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'script.save',
    target: `${program.slug}:${name.trim()} v${version}`,
    detail: { lines: lines.length, must_hits: lines.filter((l) => l.must_hit).length },
  });

  revalidatePath('/scripts');
  return { ok: true, message: `Saved ${name.trim()} v${version} (${lines.length} lines). Clip generation comes next (W6 pipeline).` };
}
