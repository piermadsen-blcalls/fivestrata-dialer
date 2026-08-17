'use server';

import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export type TurnView = {
  turn_index: number;
  source: 'canned' | 'tts';
  what: string; // clip transcript or TTS text
  outcome: string | null;
  audio_sec: number | null;
  occurred_at: string;
  media: string | null; // playable media name for canned clips
};

export async function getTurns(callId: string): Promise<TurnView[]> {
  const user = await requireUser();
  const db = supabaseAdmin();

  // Tenant scoping: the call's program must belong to one of the user's tenants.
  const { data: call } = await db
    .from('calls')
    .select('id, program_id, programs ( tenant_id )')
    .eq('id', callId)
    .single();
  const tenantId = (call?.programs as unknown as { tenant_id: string } | null)?.tenant_id;
  if (!call || !user.memberships.some((m) => m.tenant_id === tenantId)) return [];

  const { data: turns } = await db
    .from('call_turns')
    .select('turn_index, source, tts_text, outcome, audio_sec, occurred_at, voice_clips ( transcript, audio_url )')
    .eq('call_id', callId)
    .order('turn_index');

  return (turns ?? []).map((t) => {
    const clip = t.voice_clips as unknown as { transcript: string; audio_url: string } | null;
    return {
      turn_index: t.turn_index,
      source: t.source as 'canned' | 'tts',
      what: t.source === 'canned' ? clip?.transcript ?? '(clip)' : t.tts_text ?? '(tts)',
      outcome: t.outcome,
      audio_sec: t.audio_sec != null ? Number(t.audio_sec) : null,
      occurred_at: t.occurred_at,
      media: t.source === 'canned' ? clip?.audio_url ?? null : null,
    };
  });
}
