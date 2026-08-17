'use server';

import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { userCanOperate } from '@/lib/programs';
import { synthesize, uploadMedia, DEFAULT_VOICE } from '@/lib/telnyx';

/**
 * Clip generation: one line per call (client loops) so no serverless timeout.
 * Media name convention: sl_<script_line_id> — stable, unique, and the exact
 * name the engine plays via playback_start.
 */

export type LineInfo = { id: string; line_index: number; text: string; tag: string; has_clip: boolean };

async function authorizeScript(scriptId: string) {
  const user = await requireRole('operator');
  const db = supabaseAdmin();
  const { data: script } = await db
    .from('scripts')
    .select('id, name, version, program_id, programs ( tenant_id, slug )')
    .eq('id', scriptId)
    .single();
  const program = script?.programs as unknown as { tenant_id: string; slug: string } | null;
  if (!script || !program || !userCanOperate(user, program.tenant_id))
    throw new Error('Not authorized for this script');
  return { user, db, script, program };
}

export async function listLines(scriptId: string): Promise<LineInfo[]> {
  const { db } = await authorizeScript(scriptId);
  const [{ data: lines }, { data: clips }] = await Promise.all([
    db.from('script_lines').select('id, line_index, text, tag').eq('script_id', scriptId).order('line_index'),
    db.from('voice_clips').select('script_line_id').not('script_line_id', 'is', null),
  ]);
  const clipped = new Set((clips ?? []).map((c) => c.script_line_id as string));
  return (lines ?? []).map((l) => ({ ...l, has_clip: clipped.has(l.id) })) as LineInfo[];
}

export async function generateClip(
  scriptId: string,
  scriptLineId: string,
  voice?: string,
): Promise<{ ok: boolean; message: string; mediaName?: string }> {
  const { user, db, script, program } = await authorizeScript(scriptId);

  const { data: line } = await db
    .from('script_lines')
    .select('id, text, tag, line_index')
    .eq('id', scriptLineId)
    .eq('script_id', scriptId)
    .single();
  if (!line) return { ok: false, message: 'Unknown line' };

  const ttsVoice = voice ?? DEFAULT_VOICE;

  // One voice pack per script version + voice.
  const packName = `${script.name}-v${script.version}`;
  let { data: pack } = await db
    .from('voice_packs')
    .select('id')
    .eq('name', packName)
    .eq('version', script.version)
    .maybeSingle();
  if (!pack) {
    const { data: created, error } = await db
      .from('voice_packs')
      .insert({ name: packName, script_id: scriptId, tts_voice: ttsVoice, version: script.version, program_id: program ? script.program_id : null })
      .select('id')
      .single();
    if (error) return { ok: false, message: `voice pack: ${error.message}` };
    pack = created;
  }

  const mediaName = `sl_${scriptLineId}`;
  try {
    const audio = await synthesize(line.text, ttsVoice);
    await uploadMedia(mediaName, audio);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }

  // Upsert the clip row for this line (replace previous render).
  const { data: existing } = await db
    .from('voice_clips')
    .select('id')
    .eq('script_line_id', scriptLineId)
    .maybeSingle();
  const clipRow = {
    voice_pack_id: pack.id,
    intent: line.tag,
    transcript: line.text,
    audio_url: mediaName,
    script_line_id: scriptLineId,
  };
  const { error: clipErr } = existing
    ? await db.from('voice_clips').update(clipRow).eq('id', existing.id)
    : await db.from('voice_clips').insert(clipRow);
  if (clipErr) return { ok: false, message: `clip row: ${clipErr.message}` };

  await db.from('console_audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'clip.generate',
    target: `${program.slug}:${script.name} v${script.version} line ${line.line_index}`,
    detail: { media_name: mediaName, voice: ttsVoice },
  });

  return { ok: true, message: 'generated', mediaName };
}
