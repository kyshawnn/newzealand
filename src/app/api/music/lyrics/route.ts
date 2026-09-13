import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const artist = (req.nextUrl.searchParams.get('artist') || '').trim();
  const title = (req.nextUrl.searchParams.get('title') || '').trim();

  if (!title) {
    return NextResponse.json({ lyrics: null });
  }

  // Clean title: remove featuring, remaster, etc.
  const cleanTitle = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .trim();

  const cleanArtistName = artist.split(',')[0].split('&')[0].trim();

  try {
    const lrcUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
      cleanArtistName
    )}&track_name=${encodeURIComponent(cleanTitle)}`;
    const lrcRes = await fetch(lrcUrl, {
      headers: { 'User-Agent': 'Spotify-Clone/1.0' },
      signal: AbortSignal.timeout(3500),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    if (lrcRes) {
      return NextResponse.json({
        plainLyrics: lrcRes.plainLyrics || null,
        syncedLyrics: lrcRes.syncedLyrics || null,
        instrumental: lrcRes.instrumental || false,
      });
    }

    // Fallback: search lrclib
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(
      `${cleanArtistName} ${cleanTitle}`
    )}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Spotify-Clone/1.0' },
      signal: AbortSignal.timeout(3500),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    if (searchRes && Array.isArray(searchRes) && searchRes.length > 0) {
      return NextResponse.json({
        plainLyrics: searchRes[0].plainLyrics || null,
        syncedLyrics: searchRes[0].syncedLyrics || null,
        instrumental: searchRes[0].instrumental || false,
      });
    }

    return NextResponse.json({ plainLyrics: null, syncedLyrics: null });
  } catch {
    return NextResponse.json({ plainLyrics: null, syncedLyrics: null });
  }
}
