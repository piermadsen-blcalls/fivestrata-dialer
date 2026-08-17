import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Nav } from '../../nav';
import { ClipPanel } from './clips';

export const dynamic = 'force-dynamic';

export default async function ScriptDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = supabaseAdmin();

  const [{ data: script }, { data: lines }, { data: clips }] = await Promise.all([
    db.from('scripts').select('id, name, version, program_id').eq('id', id).single(),
    db.from('script_lines').select('id, line_index, tag, text, must_hit').eq('script_id', id).order('line_index'),
    db.from('voice_clips').select('script_line_id, audio_url').not('script_line_id', 'is', null),
  ]);

  if (!script) return <main className="p-8">Unknown script.</main>;
  const clipByLine = new Map((clips ?? []).map((c) => [c.script_line_id as string, c.audio_url as string]));

  return (
    <>
      <Nav email={user.email} />
      <main className="mx-auto max-w-4xl p-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">
            {script.name} <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>v{script.version}</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {lines?.length ?? 0} lines · {clipByLine.size} clips generated. Clips render in
            Claire&apos;s voice and upload to Telnyx media storage under `sl_&lt;line-id&gt;` —
            the engine plays them by that name.
          </p>
        </header>

        <ClipPanel
          scriptId={script.id}
          lines={(lines ?? []).map((l) => ({
            id: l.id,
            line_index: l.line_index,
            tag: l.tag,
            text: l.text,
            must_hit: l.must_hit,
            media: clipByLine.get(l.id) ?? null,
          }))}
        />
      </main>
    </>
  );
}
