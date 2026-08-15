'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setState('error');
      setMessage(error.message);
    } else {
      setState('sent');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-8">
      <h1 className="mb-1 text-xl font-semibold">AICC Console</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
        Sign in with your work email — we send a one-time link, no password.
      </p>

      {state === 'sent' ? (
        <div
          className="rounded-lg border p-4 text-sm"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          Check <span className="font-medium">{email}</span> for the sign-in link.
        </div>
      ) : (
        <form onSubmit={sendLink} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@autoweb.com"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--text)' }}
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {state === 'sending' ? 'Sending…' : 'Send sign-in link'}
          </button>
          {state === 'error' ? (
            <p className="text-sm" style={{ color: 'var(--bad)' }}>
              {message}
            </p>
          ) : null}
        </form>
      )}
    </main>
  );
}
