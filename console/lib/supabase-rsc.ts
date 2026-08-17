import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './public-env';

/** Cookie-session Supabase client for Server Components, Route Handlers, Server Actions. */
export async function supabaseSession() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options?: CookieOptions }[]) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; middleware refreshes the session.
        }
      },
    },
  });
}
