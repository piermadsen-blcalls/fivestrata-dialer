import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the service role key.
 * NEVER import from a client component — `server-only` enforces it at build time.
 * All console writes go through RPCs / Edge Functions; reads here are scoped by
 * the tenant the signed-in user belongs to (console_memberships).
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Engine .env calls it SUPABASE_SECRET_KEY; accept either name.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY not configured');
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
