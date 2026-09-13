import { NextRequest, NextResponse } from 'next/server';
import {
  isSongByArtistStrict,
  fetchSongsDirectly,
  fetchYtTracks,
} from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let id = (searchParams.get('id') || '').trim();
  const name = (searchParams.get('name') || '').trim();

  try {
    let artistName = name;
    if (!id || !id.startsWith('UC')) {
      const searchTerm = name || id;
      if (!searchTerm) {
        return NextResponse.json({ error: 'Artist ID or Name required' }, { status: 400 });
      }

      const sRes = await fetch(
        `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(searchTerm)}&type=artist`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(3500),
        }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (Array.isArray(sRes) && sRes.length > 0 && sRes[0].artistId) {
        id = sRes[0].artistId;
        artistName = sRes[0].name || artistName || searchTerm;
      } else {
        artistName = searchTerm;
        const songQueries = [
          `${searchTerm} lagu`,
          `${searchTerm} official audio`,
          `${searchTerm} popular`,
        ];
        if (searchTerm.toLowerCase().includes('seventeen')) {
          songQueries.push('Seventeen Kemarin Jaga Slalu Hatimu', 'Band Seventeen lagu terbaik');
        }

        const resLists = await Promise.all(
          songQueries.map((q) => fetchYtTracks(q))
        );

        const seen = new Set<string>();
        const allSongs: any[] = [];
        for (const list of resLists) {
          if (Array.isArray(list)) {
            for (const sItem of list) {
              const s = sItem as any;
              const vid = s.videoId || (s.id && s.id.replace('yt_', ''));
              if (vid && !seen.has(vid) && isSongByArtistStrict(s, artistName)) {
                seen.add(vid);
                allSongs.push({
                  ...s,
                  id: `yt_${vid}`,
                  videoId: vid,
                  title: s.name || s.title,
                  name: s.name || s.title,
                  artist: typeof s.artist === 'string' ? s.artist : s.artist?.name || searchTerm,
                  album: typeof s.album === 'string' ? s.album : s.album?.name || 'Single',
                  duration: typeof s.duration === 'number' ? s.duration : 200,
                  image: s.image || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                });
              }
            }
          }
        }

        return NextResponse.json({
          type: 'ARTIST',
          artistId: id || 'art_' + encodeURIComponent(searchTerm),
          name: searchTerm,
          thumbnails: [
            {
              url:
                allSongs[0]?.image ||
                `https://i.ytimg.com/vi/${allSongs[0]?.videoId || 'default'}/hqdefault.jpg`,
              width: 600,
              height: 600,
            },
          ],
          topSongs: allSongs,
          topAlbums: [],
          topSingles: [],
        });
      }
    }

    const aRes = await fetch(
      `https://risyadh-musik.vercel.app/api/artist?id=${encodeURIComponent(id)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500),
      }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    if (aRes) {
      artistName = aRes.name || artistName || name || id;
      const initialTopSongs: any[] = [];
      if (Array.isArray(aRes.topSongs)) {
        for (const s of aRes.topSongs) {
          if (!isSongByArtistStrict(s, artistName)) continue;
          let bestThumb = s.thumbnails?.[s.thumbnails.length - 1]?.url || s.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
          }
          if (!bestThumb && s.videoId) {
            bestThumb = `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`;
          }
          initialTopSongs.push({
            ...s,
            id: s.videoId ? `yt_${s.videoId}` : s.id,
            title: s.name || s.title,
            name: s.name || s.title,
            artist: typeof s.artist === 'string' ? s.artist : s.artist?.name || artistName,
            album: typeof s.album === 'string' ? s.album : s.album?.name || 'Single',
            image: bestThumb,
          });
        }
      }

      // Concurrently collect authentic songs by artist
      const searchQueries = [
        `${artistName} lagu`,
        `${artistName} official audio`,
      ];
      if (artistName.toLowerCase().includes('seventeen')) {
        searchQueries.push('Band Seventeen lagu terbaik', 'Seventeen Kemarin Selalu Mengalah Jaga Slalu Hatimu');
      }
      if (Array.isArray(aRes.topAlbums)) {
        for (const alb of aRes.topAlbums.slice(0, 3)) {
          if (alb.name) {
            searchQueries.push(`${artistName} ${alb.name}`);
          }
        }
      }

      const searchResults = await Promise.all(
        searchQueries.map((q) => fetchYtTracks(q))
      );

      const existingIds = new Set<string>();
      const combinedSongs: any[] = [];
      for (const s of initialTopSongs) {
        const vid = s.videoId || (s.id && s.id.replace('yt_', ''));
        if (vid && !existingIds.has(vid)) {
          existingIds.add(vid);
          combinedSongs.push(s);
        }
      }

      for (const resList of searchResults) {
        if (Array.isArray(resList)) {
          for (const rawItem of resList) {
            const item = rawItem as any;
            const vid = item.videoId || (item.id && item.id.replace('yt_', ''));
            if (vid && !existingIds.has(vid) && isSongByArtistStrict(item, artistName)) {
              existingIds.add(vid);
              combinedSongs.push({
                ...item,
                id: `yt_${vid}`,
                videoId: vid,
                title: item.name || item.title,
                name: item.name || item.title,
                artist: typeof item.artist === 'string' ? item.artist : item.artist?.name || artistName,
                album: typeof item.album === 'string' ? item.album : item.album?.name || 'Single',
                duration: typeof item.duration === 'number' ? item.duration : 200,
                image: item.image || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
              });
            }
          }
        }
      }

      if (Array.isArray(aRes.topVideos)) {
        for (const v of aRes.topVideos) {
          if (v.videoId && !existingIds.has(v.videoId) && isSongByArtistStrict(v, artistName)) {
            const thumb = v.thumbnails?.[v.thumbnails.length - 1]?.url || v.thumbnail;
            existingIds.add(v.videoId);
            combinedSongs.push({
              id: `yt_${v.videoId}`,
              videoId: v.videoId,
              title: v.name || v.title,
              name: v.name || v.title,
              artist: artistName,
              album: 'Official Video',
              duration: typeof v.duration === 'number' ? v.duration : 220,
              image: thumb || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            });
          }
        }
      }

      aRes.topSongs = combinedSongs;
      return NextResponse.json(aRes);
    }
  } catch (e) {
    console.error('Error fetching artist:', e);
  }

  const fallbackSongs = await fetchSongsDirectly(name || id || 'Bernadya');
  return NextResponse.json({
    type: 'ARTIST',
    artistId: 'art_' + encodeURIComponent(name || 'artist'),
    name: name || id || 'Artist',
    thumbnails: [
      {
        url: fallbackSongs[0]?.image || 'https://i.ytimg.com/vi/D47mUu1b_54/hqdefault.jpg',
        width: 600,
        height: 600,
      },
    ],
    topSongs: fallbackSongs,
    topAlbums: [],
    topSingles: [],
  });
}
