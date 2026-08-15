/**
 * Browser-safe Supabase coordinates, from NEXT_PUBLIC_ env vars only.
 * Values live in console/.env.local (copy from ../env.template:
 * SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY — the publishable key is the
 * browser-safe one; the secret key must NEVER appear in a NEXT_PUBLIC_ var).
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — add it to console/.env.local`);
  return v;
}

export const SUPABASE_URL = required('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_PUBLISHABLE_KEY = required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
