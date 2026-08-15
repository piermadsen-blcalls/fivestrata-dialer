import { NextResponse, type NextRequest } from 'next/server';
import { supabaseSession } from '@/lib/supabase-rsc';

export async function POST(request: NextRequest) {
  const supabase = await supabaseSession();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url));
}
