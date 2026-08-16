'use client';

import { useTransition } from 'react';
import { setBuyerActive } from './actions';

export function ActiveToggle({ clientId, active }: { clientId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await setBuyerActive(clientId, !active); })}
      className="rounded-full px-3 py-0.5 text-xs font-medium"
      style={{
        background: active ? 'var(--good)' : 'var(--line)',
        color: active ? '#04210f' : 'var(--text)',
        opacity: pending ? 0.5 : 1,
      }}
    >
      {active ? 'active' : 'off'}
    </button>
  );
}
