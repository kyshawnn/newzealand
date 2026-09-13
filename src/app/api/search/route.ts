import { NextRequest, NextResponse } from 'next/server';
import {
  fetchYtTracks,
  fetchSongsDirectly,
  searchInternalMusic,
  scrapeDirectYouTube,
  cleanString,
} from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const searchParams = req.nextUrl.searchParams;
  const query = (searchParams.get('q') || '').trim();
  const type = (searchParams.get('type') || '').trim();

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // 1. Fetch from risyadh-musik API for identical data and exact ranking
    const targetUrl = `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(query)}${type ? `&type=${encodeURIComponent(type)}` : ''}`;
    let upstreamData: any[] = [];

    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(4500),
      });

      if (res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data) && data.length > 0) {
          upstreamData = data;
        }
      }
    } catch (err: any) {
      console.warn(`[Search] risyadh upstream fetch error for "${query}":`, err?.message);
    }

    // 2. If upstream succeeded, format and return exactly matching data
    if (upstreamData.length > 0) {
      const formatted = upstreamData.map((item: any) => {
        const itemType = item.type || (type ? type.toUpperCase() : 'SONG');
        const vId = item.videoId || (itemType === 'SONG' || itemType === 'VIDEO' ? item.id : undefined);

        let rawThumb =
          (Array.isArray(item.thumbnails) && item.thumbnails.length > 0
            ? item.thumbnails[item.thumbnails.length - 1]?.url || item.thumbnails[0]?.url
            : '') ||
          item.thumbnail ||
          item.image ||
          '';

        let bestThumb = rawThumb;
        if (bestThumb && (bestThumb.includes('googleusercontent.com') || bestThumb.includes('ytimg.com') || bestThumb.includes('ggpht.com'))) {
          bestThumb = bestThumb.replace(/=w\d+-h\d+/, '=w300-h300');
        } else if (!bestThumb && vId) {
          bestThumb = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
        }

        const t = cleanString(item.name || item.title, 'Lagu');
        const a = cleanString(
          typeof item.artist === 'string'
            ? item.artist
            : item.artist?.name || (typeof item.artists === 'string' ? item.artists : 'Artis'),
          'Artis'
        );
        const alb = cleanString(
          typeof item.album === 'string' ? item.album : item.album?.name,
          'Single'
        );

        return {
          type: itemType,
          id: vId ? `yt_${vId}` : item.id || `item_${Date.now()}_${Math.random()}`,
          videoId: vId,
          title: t,
          name: t,
          artist: a,
          artists: a,
          album: alb,
          duration: typeof item.duration === 'number' ? item.duration : 210,
          thumbnails: item.thumbnails || (bestThumb ? [{ url: bestThumb, width: 300, height: 300 }] : []),
          thumbnail: bestThumb,
          image: bestThumb,
          subscribers: item.subscribers,
          trackCount: item.trackCount,
          artistId: item.artistId || (item.artist && item.artist.artistId),
          albumId: item.albumId || (item.album && item.album.albumId),
          playlistId: item.playlistId,
          source: 'youtube',
        };
      });

      console.log(`[API /api/search] type=${type || 'all'}, query="${query}", results=${formatted.length}, took=${Date.now() - startTime}ms`);
      return NextResponse.json(formatted);
    }

    // 3. Fallback to direct scrapers if upstream unavailable
    if (!type || type === 'song' || type === 'video') {
      const fallbackYt = await scrapeDirectYouTube(query);
      if (fallbackYt.length > 0) {
        return NextResponse.json(fallbackYt);
      }
      const directFallback = await fetchSongsDirectly(query);
      return NextResponse.json(directFallback);
    }

    const fallbackMusic = await searchInternalMusic(query);
    return NextResponse.json(fallbackMusic);
  } catch (err: any) {
    console.error(`[API /api/search] Unhandled Error for query "${query}":`, err?.message);
    return NextResponse.json([]);
  }
}
