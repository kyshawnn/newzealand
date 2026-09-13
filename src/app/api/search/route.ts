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
  const type = (searchParams.get('type') || 'song').trim();

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    if (type === 'song' || type === 'video') {
      const tokens = query
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 2);

      const queryLower = query.toLowerCase();

      // Focused variations to prevent serverless timeout / external rate limits
      const searchVariations = [query];
      if (tokens.length >= 1) {
        searchVariations.push(`${query} lagu`);
      }

      // Concurrently query YouTube & direct music providers without redundant duplicates
      const [scrapedBatches, directSongs] = await Promise.all([
        Promise.allSettled(
          searchVariations.slice(0, 2).map((v) => fetchYtTracks(v))
        ),
        fetchSongsDirectly(query).catch((err) => {
          console.warn('[Search] direct songs fallback warning:', err?.name, err?.message);
          return [];
        }),
      ]);

      const pool: any[] = [];
      scrapedBatches.forEach((result, batchIdx) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          result.value.forEach((item, itemIdx) => {
            pool.push({
              ...item,
              _batchIdx: batchIdx,
              _itemIdx: itemIdx,
            });
          });
        }
      });

      if (Array.isArray(directSongs)) {
        for (const s of directSongs) {
          pool.push({
            type: 'SONG',
            videoId: s.id.startsWith('yt_') ? s.id.replace('yt_', '') : s.videoId || undefined,
            id: s.id,
            name: s.title,
            title: s.title,
            artist: s.artist,
            artists: s.artist,
            album: s.album,
            duration: s.duration,
            thumbnails: [{ url: s.image, width: 500, height: 500 }],
            thumbnail: s.image,
            streamUrl: s.streamUrl,
            quality320: s.quality320,
            quality160: s.quality160,
            source: s.source || 'saavn',
            _batchIdx: 1,
            _itemIdx: 0,
          });
        }
      }

      // Relevance and deduplication
      const seenIds = new Set<string>();
      const scoredItems: { item: any; score: number }[] = [];

      for (const item of pool) {
        const videoId = item.videoId || (item.type === 'SONG' ? item.id : null);
        const uniqueKey = videoId || item.id;
        if (!uniqueKey || seenIds.has(uniqueKey)) continue;

        const title = cleanString(item.name || item.title, '').toLowerCase();
        const artist = cleanString(item.artist || item.artists, '').toLowerCase();
        const album = cleanString(item.album, '').toLowerCase();
        const full = `${title} ${artist} ${album}`;

        // Reject multi-hour compilations and placeholder titles
        const isCompilation =
          full.includes('full album') ||
          full.includes('koleksi lagu') ||
          full.includes('kompilasi') ||
          full.includes('1 jam') ||
          full.includes('1 hour') ||
          full.includes('non stop') ||
          full.includes('playlist terbaik') ||
          full.includes('kumpulan lagu');

        const dur = typeof item.duration === 'number' ? item.duration : 0;
        if (dur > 900 || (isCompilation && dur > 600)) {
          continue;
        }

        let score = 0;

        // Exact matches
        if (title === queryLower) score += 100;
        else if (title.startsWith(queryLower)) score += 80;
        else if (title.includes(queryLower)) score += 60;

        if (artist === queryLower) score += 70;
        else if (artist.includes(queryLower)) score += 40;

        // Token match
        let matchedTokens = 0;
        for (const token of tokens) {
          if (title.includes(token)) {
            score += 25;
            matchedTokens++;
          } else if (artist.includes(token)) {
            score += 15;
            matchedTokens++;
          }
        }

        if (tokens.length > 0 && matchedTokens === 0 && !full.includes(queryLower)) {
          continue;
        }

        // Penalty for low quality covers / slowed
        if (
          title.includes('slowed') ||
          title.includes('reverb') ||
          title.includes('bass boosted') ||
          title.includes('remix')
        ) {
          score -= 15;
        }

        // Penalty for deep in batch
        score -= (item._batchIdx || 0) * 8;
        score -= Math.min(item._itemIdx || 0, 20) * 1.5;

        seenIds.add(uniqueKey);
        scoredItems.push({ item, score });
      }

      scoredItems.sort((a, b) => b.score - a.score);
      let formatted: any[] = scoredItems.slice(0, 45).map(({ item }) => {
        const vId = item.videoId || (item.id && item.id.replace('yt_', '')) || '';
        let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail || item.image;
        if (bestThumb && bestThumb.includes('googleusercontent.com')) {
          bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
        }
        if (!bestThumb && vId) {
          bestThumb = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
        }

        const t = cleanString(item.name || item.title, 'Lagu');
        const a = cleanString(item.artist || item.artists, 'Artis');
        const alb = cleanString(item.album, 'YouTube Music');

        return {
          id: `yt_${vId || item.id}`,
          videoId: vId || undefined,
          title: t,
          name: t,
          artist: a,
          artists: a,
          album: alb,
          duration: typeof item.duration === 'number' ? item.duration : 210,
          image: bestThumb || 'https://i.ytimg.com/vi/default/hqdefault.jpg',
          streamUrl: item.streamUrl,
          quality320: item.quality320,
          quality160: item.quality160,
          source: item.source || 'youtube',
        };
      });

      // Ultra-resilient fallback if 0 results
      if (formatted.length === 0) {
        console.warn(`[Search] 0 results from initial pool for "${query}". Invoking direct scraper.`);
        const directYt = await scrapeDirectYouTube(query);
        if (directYt.length > 0) {
          formatted = directYt;
        } else {
          const directFallback = await fetchSongsDirectly(query);
          formatted = directFallback;
        }
      }

      console.log(`[API /api/search] type=${type}, query="${query}", results=${formatted.length}, took=${Date.now() - startTime}ms`);
      return NextResponse.json(formatted);
    }

    // Handle other types (artist, album, playlist)
    const ytUrl = `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`;
    let results: any[] = [];
    try {
      const ytRes = await fetch(ytUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (ytRes.ok) {
        const data = await ytRes.json().catch((err) => {
          console.warn(`[Search] JSON parse error for "${query}" (type=${type}):`, err?.message);
          return [];
        });
        if (Array.isArray(data) && data.length > 0) {
          if (type === 'album') {
            results = data.map((item: any) => ({
              type: 'ALBUM',
              albumId: item.albumId || item.album?.albumId || item.id || `alb_${encodeURIComponent(cleanString(item.name || item.title, 'Album'))}`,
              name: cleanString(item.album?.name || item.name || item.title, 'Album'),
              artist: cleanString(item.artist || item.artists, 'Artis'),
              year: item.year || '2024',
              thumbnail:
                item.thumbnail ||
                item.thumbnails?.[item.thumbnails.length - 1]?.url ||
                item.image ||
                '',
            }));
          } else if (type === 'artist') {
            results = data.map((item: any) => ({
              type: 'ARTIST',
              artistId: item.artistId || item.id || `art_${encodeURIComponent(cleanString(item.name, 'Artis'))}`,
              name: cleanString(item.name, 'Artis'),
              thumbnail:
                item.thumbnail ||
                item.thumbnails?.[item.thumbnails.length - 1]?.url ||
                item.image ||
                '',
              subscribers: cleanString(item.subscribers, 'Artis Populer'),
            }));
          } else if (type === 'playlist') {
            results = data.map((item: any) => ({
              type: 'PLAYLIST',
              playlistId: item.playlistId || item.id || `pl_${encodeURIComponent(cleanString(item.name, 'Playlist'))}`,
              name: cleanString(item.name, 'Playlist'),
              trackCount: cleanString(item.trackCount || item.count, 'Daftar Putar'),
              thumbnail:
                item.thumbnail ||
                item.thumbnails?.[item.thumbnails.length - 1]?.url ||
                item.image ||
                '',
            }));
          } else {
            results = data;
          }
        }
      } else {
        console.warn(`[Search] risyadh-musik HTTP ${ytRes.status} for "${query}" (type=${type})`);
      }
    } catch (err: any) {
      console.warn(`[Search] risyadh-musik non-song search failed for "${query}":`, err?.name, err?.message);
    }

    if (results.length === 0) {
      const fallbackSongs = await searchInternalMusic(query);
      if (type === 'artist') {
        const seenArtists = new Set<string>();
        results = fallbackSongs
          .filter((s) => {
            const aName = cleanString(s.artist, '');
            if (!aName || seenArtists.has(aName)) return false;
            seenArtists.add(aName);
            return true;
          })
          .map((s) => ({
            type: 'ARTIST',
            artistId: 'art_' + encodeURIComponent(s.artist),
            name: s.artist,
            thumbnail: s.image,
            subscribers: 'Artis Populer',
          }));
      } else if (type === 'album') {
        results = fallbackSongs.slice(0, 5).map((s) => ({
          type: 'ALBUM',
          albumId: 'alb_' + encodeURIComponent(s.album),
          name: cleanString(s.album, 'Album'),
          artist: cleanString(s.artist, 'Artis'),
          year: s.year || '2024',
          thumbnail: s.image,
        }));
      } else if (type === 'playlist') {
        results = [
          {
            type: 'PLAYLIST',
            playlistId: 'pl_' + encodeURIComponent(query),
            name: `${query} Mix`,
            trackCount: `${fallbackSongs.length} lagu`,
            thumbnail: fallbackSongs[0]?.image || '',
            songs: fallbackSongs,
          },
        ];
      }
    }

    console.log(`[API /api/search] type=${type}, query="${query}", results=${results.length}, took=${Date.now() - startTime}ms`);
    return NextResponse.json(results);
  } catch (err: any) {
    console.error(`[API /api/search] Unhandled Error for query "${query}":`, err?.name, err?.message, err?.stack);
    return NextResponse.json([]);
  }
}
