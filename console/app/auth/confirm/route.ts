import { NextResponse, type NextRequest } from 'next/server';
import { supabaseSession } from '@/lib/supabase-rsc';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Magic-link landing. Handles both formats Supabase sends depending on email
 * template / flow: PKCE `?code=` (exchangeCodeForSession) and `?token_hash=`
 * (verifyOtp).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') ?? 'email') as EmailOtpType;

  const supabase = await supabaseSession();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
