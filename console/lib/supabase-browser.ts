'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser client. NEXT_PUBLIC_ vars are inlined at build time, so they are
 * referenced directly here (imports from public-env.ts would not inline).
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
