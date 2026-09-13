import { NextResponse } from 'next/server';
import { fetchYtTracks, fetchSongsDirectly } from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

let topIndonesiaCache: { data: any[]; timestamp: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (topIndonesiaCache && now - topIndonesiaCache.timestamp < 600000 && topIndonesiaCache.data.length > 0) {
    return NextResponse.json(topIndonesiaCache.data);
  }

  try {
    const queries = ['top hits indonesia', 'lagu indonesia populer', 'bernadya', 'sal priadi', 'mahalini', 'hindia'];
    const songs: any[] = [];
    const seenIds = new Set<string>();

    for (const q of queries) {
      if (songs.length >= 50) break;
      const ytSongs = await fetchYtTracks(q);
      for (const song of ytSongs) {
        if (!seenIds.has(song.id)) {
          seenIds.add(song.id);
          songs.push(song);
          if (songs.length >= 50) break;
        }
      }
    }

    if (songs.length === 0) {
      const fallbackSongs = await fetchSongsDirectly('top hits indonesia 2024');
      songs.push(...fallbackSongs);
    }

    if (songs.length > 0) {
      topIndonesiaCache = { data: songs, timestamp: now };
      return NextResponse.json(songs);
    }
    return NextResponse.json([]);
  } catch (err) {
    console.error('Error in /api/top-indonesia:', err);
    return NextResponse.json([]);
  }
}
