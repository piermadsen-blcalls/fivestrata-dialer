export default function NoAccess() {
  return (
    <main className="mx-auto max-w-md p-16 text-center">
      <h1 className="mb-2 text-lg font-semibold">No console access</h1>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        You are signed in, but no tenant membership grants you this action. Ask an admin to
        add you in console_memberships.
      </p>
    </main>
  );
}
