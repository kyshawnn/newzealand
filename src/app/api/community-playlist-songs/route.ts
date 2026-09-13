import { NextRequest, NextResponse } from 'next/server';
import { fetchYtTracks, fetchSongsDirectly } from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

const communityPlaylistSongsCache: Record<string, { data: any[]; timestamp: number }> = {};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = (searchParams.get('id') || '').trim();
  const title = (searchParams.get('title') || '').trim();
  const cacheKey = `${id}_${title}`.toLowerCase();
  const now = Date.now();

  if (communityPlaylistSongsCache[cacheKey] && now - communityPlaylistSongsCache[cacheKey].timestamp < 600000) {
    return NextResponse.json(communityPlaylistSongsCache[cacheKey].data);
  }

  try {
    let searchQueries = ['lagu indonesia populer', 'pop indonesia terbaik', 'lagu mellow indonesia', 'lagu galau terpopuler'];
    if (title.toLowerCase().includes('chill') || id === 'comm_1') {
      searchQueries = ['chill songs spotify', 'chill pop indonesia', 'indie chill indonesia', 'acoustic chill', 'lagu santai indonesia'];
    } else if (title.toLowerCase().includes('close') || id === 'comm_2') {
      searchQueries = ['pop hits indonesia', 'lagu romantis indonesia', 'lagu galau indonesia', 'populer indonesia', 'lagu viral tiktok indonesia'];
    } else if (title.toLowerCase().includes('indie') || title.toLowerCase().includes('senja') || id === 'comm_3') {
      searchQueries = ['indie indonesia', 'lagu senja indonesia', 'hindia sal priadi nadin amizah', 'indie pop indonesia', 'lagu sore senja'];
    } else if (title) {
      searchQueries = [title, `${title} lagu`, 'top indonesia songs', 'lagu pop indonesia'];
    }

    const allSongs: any[] = [];
    const seenIds = new Set<string>();

    for (const query of searchQueries) {
      if (allSongs.length >= 100) break;
      const ytSongs = await fetchYtTracks(query);
      for (const song of ytSongs) {
        if (!seenIds.has(song.id)) {
          seenIds.add(song.id);
          allSongs.push(song);
          if (allSongs.length >= 100) break;
        }
      }
    }

    if (allSongs.length === 0) {
      const fallbackSongs = await fetchSongsDirectly(searchQueries[0]);
      allSongs.push(...fallbackSongs);
    }

    communityPlaylistSongsCache[cacheKey] = { data: allSongs, timestamp: now };
    return NextResponse.json(allSongs);
  } catch (err) {
    console.error('Error fetching community playlist songs:', err);
    return NextResponse.json([]);
  }
}
