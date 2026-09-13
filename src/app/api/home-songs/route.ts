import { NextResponse } from 'next/server';
import { fetchYtTracks } from '@/src/lib/musicServer';
import { INITIAL_POPULAR_SONGS } from '@/src/data/defaultData';

export const dynamic = 'force-dynamic';

let homeSongsCache: { data: any[]; timestamp: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (homeSongsCache && now - homeSongsCache.timestamp < 300000 && homeSongsCache.data.length > 0) {
    return NextResponse.json(homeSongsCache.data);
  }

  try {
    const seedQueries = [
      'Bernadya',
      'Sal Priadi',
      'Juicy Luicy',
      'Hindia',
      'Mahalini',
      'Nadhif Basalamah',
      'Tulus',
      'Anggi Marito',
      'Fabio Asher',
      'Feby Putri',
    ];

    const results = await Promise.allSettled(
      seedQueries.map((q) => fetchYtTracks(q))
    );

    const seenVideoIds = new Set<string>();
    const songs: any[] = [];

    for (const resItem of results) {
      if (resItem.status === 'fulfilled' && Array.isArray(resItem.value)) {
        for (const rawItem of resItem.value) {
          const item = rawItem as any;
          const videoId = item.videoId || (item.id && item.id.replace('yt_', ''));
          if (!videoId || seenVideoIds.has(videoId)) continue;

          const title = (item.name || item.title || '').toLowerCase();
          const artist = (typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || '').toLowerCase();
          const combined = `${title} ${artist}`;

          if (
            /jugo muzik/i.test(combined) ||
            /kompilasi/i.test(combined) ||
            /kumpulan/i.test(combined) ||
            /full album/i.test(combined) ||
            /terbaik tahun/i.test(combined) ||
            /1 jam/i.test(combined) ||
            /2 jam/i.test(combined)
          ) {
            continue;
          }

          const dur = typeof item.duration === 'number' ? item.duration : 0;
          if (dur > 540) continue;

          seenVideoIds.add(videoId);

          songs.push({
            id: `yt_${videoId}`,
            videoId,
            title: item.name || item.title,
            name: item.name || item.title,
            artist: typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || 'Artis',
            artists: typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || 'Artis',
            album: typeof item.album === 'string' ? item.album : item.album?.name || 'Single',
            duration: item.duration || 210,
            image: item.image,
            source: 'youtube',
          });
        }
      }
    }

    if (songs.length > 0) {
      homeSongsCache = { data: songs, timestamp: now };
      return NextResponse.json(songs);
    }

    return NextResponse.json(INITIAL_POPULAR_SONGS);
  } catch (err) {
    console.error('Error fetching home songs:', err);
    return NextResponse.json(INITIAL_POPULAR_SONGS);
  }
}
