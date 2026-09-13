import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = (searchParams.get('id') || '').trim();
  const artist = (searchParams.get('artist') || '').trim();
  const title = (searchParams.get('title') || '').trim();

  try {
    // 1. FIRST: Try fetching precision synced lyrics from LRCLIB
    if (title) {
      const cleanTitle = title
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\{.*?\}/g, '')
        .replace(/feat\..*$/i, '')
        .replace(/ft\..*$/i, '')
        .replace(/official.*$/i, '')
        .replace(/audio.*$/i, '')
        .replace(/video.*$/i, '')
        .replace(/music video.*$/i, '')
        .replace(/lirik.*$/i, '')
        .replace(/lyrics.*$/i, '')
        .trim();

      const cleanArtist = artist
        .split(',')[0]
        .split('&')[0]
        .split('feat.')[0]
        .split('ft.')[0]
        .replace(/feat\..*$/i, '')
        .replace(/ft\..*$/i, '')
        .trim();

      // Attempt 1: Exact get on LRCLIB
      try {
        const lrcUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
          cleanArtist
        )}&track_name=${encodeURIComponent(cleanTitle)}`;
        const lrcRes = await fetch(lrcUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(3500),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (lrcRes && (lrcRes.syncedLyrics || lrcRes.plainLyrics)) {
          const rawLines = lrcRes.plainLyrics
            ? lrcRes.plainLyrics.split('\n').filter(Boolean)
            : [];
          return NextResponse.json({
            lyrics: rawLines,
            plainLyrics: lrcRes.plainLyrics || null,
            syncedLyrics: lrcRes.syncedLyrics || null,
            instrumental: Boolean(lrcRes.instrumental),
          });
        }
      } catch {
        // Continue
      }

      // Attempt 2: Search with artist_name & track_name
      try {
        const lrcSearchTrackUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
          cleanTitle
        )}&artist_name=${encodeURIComponent(cleanArtist)}`;
        const lrcSearchTrackRes = await fetch(lrcSearchTrackUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(3500),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (Array.isArray(lrcSearchTrackRes) && lrcSearchTrackRes.length > 0) {
          const withSync = lrcSearchTrackRes.find((item: any) => item.syncedLyrics);
          const best = withSync || lrcSearchTrackRes[0];
          if (best && (best.syncedLyrics || best.plainLyrics)) {
            const rawLines = best.plainLyrics
              ? best.plainLyrics.split('\n').filter(Boolean)
              : [];
            return NextResponse.json({
              lyrics: rawLines,
              plainLyrics: best.plainLyrics || null,
              syncedLyrics: best.syncedLyrics || null,
              instrumental: Boolean(best.instrumental),
            });
          }
        }
      } catch {
        // Continue
      }

      // Attempt 3: Flexible search with clean query on LRCLIB
      try {
        const queryTerm = `${cleanTitle} ${cleanArtist}`.trim();
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(queryTerm)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(3500),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (Array.isArray(searchRes) && searchRes.length > 0) {
          const withSync = searchRes.find((item: any) => item.syncedLyrics);
          const best = withSync || searchRes[0];
          if (best && (best.syncedLyrics || best.plainLyrics)) {
            const rawLines = best.plainLyrics
              ? best.plainLyrics.split('\n').filter(Boolean)
              : [];
            return NextResponse.json({
              lyrics: rawLines,
              plainLyrics: best.plainLyrics || null,
              syncedLyrics: best.syncedLyrics || null,
              instrumental: Boolean(best.instrumental),
            });
          }
        }
      } catch {
        // Continue to YouTube fallback
      }

      // Attempt 4: Title-only search
      try {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(3500),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (Array.isArray(searchRes) && searchRes.length > 0) {
          const withSync = searchRes.find((item: any) => item.syncedLyrics);
          const best = withSync || searchRes[0];
          if (best && (best.syncedLyrics || best.plainLyrics)) {
            const rawLines = best.plainLyrics
              ? best.plainLyrics.split('\n').filter(Boolean)
              : [];
            return NextResponse.json({
              lyrics: rawLines,
              plainLyrics: best.plainLyrics || null,
              syncedLyrics: best.syncedLyrics || null,
              instrumental: Boolean(best.instrumental),
            });
          }
        }
      } catch {
        // Continue
      }
    }

    // 2. SECOND: Fallback to YouTube scraper lyrics if LRCLIB didn't have it
    if (id) {
      try {
        const ytLyrics = await fetch(
          `https://risyadh-musik.vercel.app/api/lyrics?id=${encodeURIComponent(id)}`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(3500),
          }
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (ytLyrics?.lyrics && Array.isArray(ytLyrics.lyrics) && ytLyrics.lyrics.length > 0) {
          return NextResponse.json({
            lyrics: ytLyrics.lyrics,
            plainLyrics: ytLyrics.lyrics.join('\n'),
            syncedLyrics: null,
            instrumental: false,
          });
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      lyrics: [],
      plainLyrics: null,
      syncedLyrics: null,
      instrumental: false,
    });
  } catch {
    return NextResponse.json({
      lyrics: [],
      plainLyrics: null,
      syncedLyrics: null,
      instrumental: false,
    });
  }
}
