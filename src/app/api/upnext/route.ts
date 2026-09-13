import { NextRequest, NextResponse } from 'next/server';
import { fetchSongsDirectly, fetchYtTracks } from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get('id') || '').trim();
  try {
    if (id) {
      const upRes = await fetch(
        `https://risyadh-musik.vercel.app/api/upnext?id=${encodeURIComponent(id)}`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(3500),
        }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (Array.isArray(upRes) && upRes.length > 0) {
        return NextResponse.json(upRes);
      }
    }

    const ytFallback = await fetchYtTracks('hits indonesia pop');
    if (ytFallback.length > 0) {
      return NextResponse.json(ytFallback.slice(0, 10));
    }

    const fallbackSongs = await fetchSongsDirectly('hits indonesia pop');
    return NextResponse.json(fallbackSongs.slice(0, 10));
  } catch {
    return NextResponse.json([]);
  }
}
