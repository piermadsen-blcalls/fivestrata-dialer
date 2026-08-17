import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { visiblePrograms } from '@/lib/programs';
import { Nav } from '../nav';
import { CallRow, type CallView } from './row';

export const dynamic = 'force-dynamic';

function maskPhone(p: string | null): string {
  if (!p) return '—';
  const digits = p.replace(/\D/g, '');
  return `···${digits.slice(-4)}`;
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; dispo?: string }>;
}) {
  const user = await requireUser();
  const { program: programFilter, dispo: dispoFilter } = await searchParams;
  const programs = await visiblePrograms(user);
  const db = supabaseAdmin();

  let q = db
    .from('calls')
    .select(
      'id, started_at, answered_at, duration_sec, disposition, contact_quality, direction, recording_url, canned_seconds, tts_seconds, program_id, leads ( phone_number, first_name, state )',
    )
    .in('program_id', programs.map((p) => p.id))
    .order('started_at', { ascending: false })
    .limit(100);
  if (programFilter) q = q.eq('program_id', programFilter);
  if (dispoFilter) q = q.eq('disposition', dispoFilter);
  const { data: calls } = programs.length ? await q : { data: [] as never[] };

  const views: CallView[] = (calls ?? []).map((c) => {
    const lead = c.leads as unknown as { phone_number: string; first_name: string | null; state: string | null } | null;
    return {
      id: c.id,
      started_at: c.started_at,
      duration_sec: c.duration_sec,
      disposition: c.disposition,
      contact_quality: c.contact_quality,
      direction: c.direction,
      has_recording: !!c.recording_url,
      canned_seconds: c.canned_seconds != null ? Number(c.canned_seconds) : null,
      tts_seconds: c.tts_seconds != null ? Number(c.tts_seconds) : null,
      program: programs.find((p) => p.id === c.program_id)?.slug ?? '—',
      who: `${maskPhone(lead?.phone_number ?? null)}${lead?.first_name ? ` ${lead.first_name}` : ''}${lead?.state ? ` (${lead.state})` : ''}`,
    };
  });

  const dispos = [...new Set(views.map((v) => v.disposition).filter(Boolean))] as string[];

  return (
    <>
      <Nav email={user.email} />
      <main className="mx-auto max-w-5xl p-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">Call history</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Last 100 calls, phone numbers masked to last-4. Click a row for the per-turn
            decision log — the record no human floor produces.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <FilterLink label="all programs" href="/calls" active={!programFilter} />
            {programs.map((p) => (
              <FilterLink key={p.id} label={p.slug} href={`/calls?program=${p.id}`} active={programFilter === p.id} />
            ))}
            {dispos.map((d) => (
              <FilterLink key={d} label={d} href={`/calls?dispo=${encodeURIComponent(d)}`} active={dispoFilter === d} />
            ))}
          </div>
        </header>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--muted)' }}>
              <th className="p-2 text-left">When</th>
              <th className="p-2 text-left">Program</th>
              <th className="p-2 text-left">Who</th>
              <th className="p-2 text-left">Answer</th>
              <th className="p-2 text-left">Disposition</th>
              <th className="p-2 text-right">Duration</th>
              <th className="p-2 text-right">Canned/TTS</th>
              <th className="p-2 text-left">Rec</th>
            </tr>
          </thead>
          <tbody>
            {views.map((v) => (
              <CallRow key={v.id} call={v} />
            ))}
          </tbody>
        </table>
        {views.length === 0 ? (
          <p className="mt-6 text-sm" style={{ color: 'var(--muted)' }}>
            No calls match. The engine writes here on every dial.
          </p>
        ) : null}
      </main>
    </>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a href={href} className="rounded-full border px-3 py-1"
      style={{
        borderColor: active ? 'var(--accent)' : 'var(--line)',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
      }}>
      {label}
    </a>
  );
}
