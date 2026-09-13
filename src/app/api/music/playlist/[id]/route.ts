import { NextRequest, NextResponse } from 'next/server';
import { SongItem, decryptMediaUrl, cleanHtml } from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const listId = params.id;

  try {
    const playlistData = await fetch(
      `https://www.jiosaavn.com/api.php?__call=playlist.getDetails&_format=json&_marker=0&cc=in&includeMetaTags=1&listid=${encodeURIComponent(
        listId
      )}`,
      { signal: AbortSignal.timeout(4000) }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    if (!playlistData) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const songs: SongItem[] = [];
    if (playlistData?.songs && Array.isArray(playlistData.songs)) {
      for (const item of playlistData.songs) {
        if (item.encrypted_media_url) {
          const urls = decryptMediaUrl(item.encrypted_media_url);
          if (urls) {
            songs.push({
              id: `saavn_${item.id}`,
              title: cleanHtml(item.song),
              artist: cleanHtml(item.primary_artists || item.singers || item.music || 'Artist'),
              album: cleanHtml(item.album || playlistData.listname),
              duration: parseInt(item.duration, 10) || 180,
              image: (item.image || playlistData.image || '').replace('150x150', '500x500').replace('50x50', '500x500'),
              streamUrl: urls.primaryUrl,
              quality320: urls.quality320,
              quality160: urls.quality160,
              source: 'saavn',
              year: item.year,
            });
          }
        }
      }
    }

    return NextResponse.json({
      id: playlistData.listid,
      name: cleanHtml(playlistData.listname),
      image: (playlistData.image || '').replace('150x150', '500x500'),
      description: playlistData.description || 'Koleksi playlist resmi pilihan terbaik',
      totalSongs: songs.length,
      songs,
    });
  } catch (err: any) {
    console.error('Playlist fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch playlist', message: err?.message }, { status: 500 });
  }
}
