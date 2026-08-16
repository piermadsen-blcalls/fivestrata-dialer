'use client';

import { useState, useTransition } from 'react';
import { undoBatch } from './actions';

export function UndoButton({ batchId }: { batchId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming)
    return (
      <button onClick={() => setConfirming(true)} className="text-xs underline" style={{ color: 'var(--muted)' }}>
        undo
      </button>
    );
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await undoBatch(batchId); })}
      className="rounded px-2 py-1 text-xs font-medium"
      style={{ background: 'var(--bad)', color: '#fff' }}
    >
      {pending ? '…' : 'confirm undo'}
    </button>
  );
}
