import { NextRequest, NextResponse } from 'next/server';
import { fetchSongsDirectly } from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get('id') || '').trim();
  if (!id) {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
  }

  try {
    const plRes = await fetch(
      `https://risyadh-musik.vercel.app/api/ytplaylist?id=${encodeURIComponent(id)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500),
      }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    if (plRes) {
      return NextResponse.json(plRes);
    }

    const fallbackSongs = await fetchSongsDirectly('hits indonesia pop');
    return NextResponse.json({
      id,
      title: 'Playlist Populer',
      songs: fallbackSongs,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}
