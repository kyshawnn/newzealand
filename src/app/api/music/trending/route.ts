import { NextResponse } from 'next/server';
import { SongItem, decryptMediaUrl, cleanHtml } from '@/src/lib/musicServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const defaultPlaylists = [
      { id: '1081991857', name: 'English Hit Songs', category: 'Hits Teratas' },
      { id: '280083933', name: "Let's Play - Taylor Swift", category: 'Artis Populer' },
      { id: '1079336813', name: 'Chill Maaro: Lo-Fi Mix', category: 'Santai & Chill' },
      { id: '63116930', name: 'English 2010s Nostalgia', category: 'Nostalgia' },
      { id: '106074413', name: "Let's Play - Queen", category: 'Rock Classics' },
    ];

    const playlistData = await fetch(
      'https://www.jiosaavn.com/api.php?__call=playlist.getDetails&_format=json&_marker=0&cc=in&includeMetaTags=1&listid=1081991857',
      { signal: AbortSignal.timeout(3500) }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const trendingSongs: SongItem[] = [];

    if (playlistData?.songs && Array.isArray(playlistData.songs)) {
      for (const item of playlistData.songs.slice(0, 20)) {
        if (item.encrypted_media_url) {
          const urls = decryptMediaUrl(item.encrypted_media_url);
          if (urls) {
            trendingSongs.push({
              id: `saavn_${item.id}`,
              title: cleanHtml(item.song),
              artist: cleanHtml(item.primary_artists || item.singers || item.music || 'Artist'),
              album: cleanHtml(item.album || 'Hits'),
              duration: parseInt(item.duration, 10) || 200,
              image: (item.image || '').replace('150x150', '500x500').replace('50x50', '500x500'),
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

    const audiusTrending = await fetch(
      'https://discoveryprovider.audius.co/v1/tracks/trending?app_name=spotify_web_app',
      { signal: AbortSignal.timeout(3500) }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const audiusSongs: SongItem[] = [];
    if (audiusTrending?.data && Array.isArray(audiusTrending.data)) {
      for (const track of audiusTrending.data.slice(0, 15)) {
        const artwork = track.artwork?.['480x480'] || track.artwork?.['150x150'] || '';
        const stream = `https://discoveryprovider.audius.co/v1/tracks/${track.track_id}/stream?app_name=spotify_web_app`;
        audiusSongs.push({
          id: `audius_${track.track_id}`,
          title: cleanHtml(track.title),
          artist: cleanHtml(track.user?.name || 'Audius Artist'),
          album: cleanHtml(track.genre || 'Trending'),
          duration: Math.round(track.duration) || 180,
          image: artwork,
          streamUrl: stream,
          quality320: stream,
          quality160: stream,
          source: 'audius',
        });
      }
    }

    return NextResponse.json({
      trending: trendingSongs,
      audius: audiusSongs,
      featuredPlaylists: defaultPlaylists,
    });
  } catch (err: any) {
    console.error('Trending error:', err);
    return NextResponse.json({ error: 'Failed to fetch trending', message: err?.message }, { status: 500 });
  }
}
