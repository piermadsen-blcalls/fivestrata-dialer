import Link from 'next/link';

export function Nav({ email }: { email: string }) {
  return (
    <nav
      className="mb-2 flex items-center justify-between border-b px-8 py-3 text-sm"
      style={{ borderColor: 'var(--line)' }}
    >
      <div className="flex items-center gap-5">
        <span className="font-semibold">AICC</span>
        <Link href="/">Overview</Link>
        <Link href="/controls">Controls</Link>
      </div>
      <form action="/auth/signout" method="post" className="flex items-center gap-3">
        <span style={{ color: 'var(--muted)' }}>{email}</span>
        <button type="submit" className="underline" style={{ color: 'var(--muted)' }}>
          sign out
        </button>
      </form>
    </nav>
  );
}
