import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { downloadMedia } from '@/lib/telnyx';

/** Authenticated playback proxy for Telnyx media storage (console listen-back). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  await requireUser(); // redirects to /login when signed out
  const { name } = await params;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(name)) return new NextResponse('bad name', { status: 400 });

  const stream = await downloadMedia(name);
  if (!stream) return new NextResponse('not found', { status: 404 });
  return new NextResponse(stream, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' },
  });
}
