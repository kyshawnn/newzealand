import CryptoJS from 'crypto-js';

export interface SongItem {
  id: string;
  title: string;
  name?: string;
  artist: string;
  artists?: string;
  album: string;
  duration: number;
  image: string;
  streamUrl?: string;
  quality320?: string;
  quality160?: string;
  source?: 'saavn' | 'audius' | 'youtube';
  year?: string | number;
  videoId?: string;
}

export function cleanHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function decryptMediaUrl(encryptedMediaUrl: string): { primaryUrl: string; quality320: string; quality160: string } | null {
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const encrypted = CryptoJS.enc.Base64.parse(encryptedMediaUrl);
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: encrypted } as any,
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    const decryptedUrl = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedUrl || !decryptedUrl.startsWith('http')) {
      return null;
    }

    const quality320 = decryptedUrl.replace(/_96\.mp4|_160\.mp4/, '_320.mp4');
    const quality160 = decryptedUrl.replace(/_96\.mp4|_320\.mp4/, '_160.mp4');

    return {
      primaryUrl: quality320,
      quality320,
      quality160,
    };
  } catch (err) {
    console.error('Decryption failed for URL:', err);
    return null;
  }
}

function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr) return 210;
  const parts = durationStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  } else if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 210;
}

/**
 * Direct YouTube search scraper as ultra-resilient fallback
 * Extracts authentic video IDs directly from YouTube web results
 */
export async function scrapeDirectYouTube(query: string, limit = 25): Promise<SongItem[]> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const sections =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    const results: SongItem[] = [];
    const seen = new Set<string>();

    for (const section of sections) {
      const itemSectionContents = section?.itemSectionRenderer?.contents || [];
      for (const item of itemSectionContents) {
        if (results.length >= limit) break;
        if (item.videoRenderer) {
          const vr = item.videoRenderer;
          const videoId = vr.videoId;
          if (!videoId || seen.has(videoId)) continue;

          // Exclude live streams
          if (vr.badges && JSON.stringify(vr.badges).includes('LIVE')) continue;

          const title = vr.title?.runs?.map((r: any) => r.text).join('') || '';
          const artist =
            vr.ownerText?.runs?.map((r: any) => r.text).join('') ||
            vr.longBylineText?.runs?.map((r: any) => r.text).join('') ||
            'Artis';
          const durationStr = vr.lengthText?.simpleText;
          const duration = parseDurationToSeconds(durationStr);

          seen.add(videoId);
          results.push({
            id: `yt_${videoId}`,
            videoId,
            title: title.trim(),
            name: title.trim(),
            artist: artist.trim(),
            artists: artist.trim(),
            album: 'YouTube Music',
            duration,
            image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            source: 'youtube',
          });
        }
      }
    }

    return results;
  } catch (err: any) {
    console.warn(`[scrapeDirectYouTube] Failed for "${query}":`, err?.message || err);
    return [];
  }
}

/**
 * Fetch YouTube tracks with fallback to direct scraper
 */
export async function fetchYtTracks(query: string): Promise<SongItem[]> {
  // 1. Try risyadh-musik API with strict 3.5s timeout
  try {
    const ytUrl = `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(query)}&type=song`;
    const ytRes = await fetch(ytUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3500),
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);

    if (Array.isArray(ytRes) && ytRes.length > 0) {
      const valid = ytRes
        .filter((item: any) => item.videoId || (item.type === 'SONG' && item.id))
        .map((item: any) => {
          const vId = item.videoId || item.id;
          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
          }
          if (!bestThumb) {
            bestThumb = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
          }
          const t = (item.name || item.title || '').trim();
          const a = typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || 'Artis';
          return {
            id: `yt_${vId}`,
            videoId: vId,
            title: t,
            name: t,
            artist: a,
            artists: a,
            album: item.album?.name || 'YouTube Music',
            duration: typeof item.duration === 'number' ? item.duration : 210,
            image: bestThumb,
            source: 'youtube' as const,
          };
        });

      if (valid.length > 0) {
        return valid;
      }
    }
  } catch (err: any) {
    console.warn(`[fetchYtTracks] risyadh-musik failed for "${query}":`, err?.message || err);
  }

  // 2. Direct fallback to YouTube scraper
  const fallback = await scrapeDirectYouTube(query);
  return fallback;
}

/**
 * Fetch songs directly from JioSaavn and Audius
 */
export async function fetchSongsDirectly(query: string): Promise<SongItem[]> {
  const songs: SongItem[] = [];
  const seenIds = new Set<string>();
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
  };

  try {
    const [searchRes, audiusRes] = await Promise.all([
      fetch(
        `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(
          query
        )}&p=1&n=20`,
        { headers, signal: AbortSignal.timeout(3500) }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=spotify_web_app`, {
        signal: AbortSignal.timeout(3500),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    if (searchRes?.results && Array.isArray(searchRes.results)) {
      for (const item of searchRes.results) {
        if (item.encrypted_media_url && !seenIds.has(item.id)) {
          const urls = decryptMediaUrl(item.encrypted_media_url);
          if (urls) {
            seenIds.add(item.id);
            songs.push({
              id: `saavn_${item.id}`,
              title: cleanHtml(item.song),
              artist: cleanHtml(item.primary_artists || item.singers || item.music || 'Unknown Artist'),
              album: cleanHtml(item.album || 'Single'),
              duration: parseInt(item.duration, 10) || 180,
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

    if (audiusRes?.data && Array.isArray(audiusRes.data)) {
      for (const track of audiusRes.data) {
        if (track.track_id && !seenIds.has(String(track.track_id))) {
          seenIds.add(String(track.track_id));
          const artwork = track.artwork?.['480x480'] || track.artwork?.['150x150'] || '';
          const stream = `https://discoveryprovider.audius.co/v1/tracks/${track.track_id}/stream?app_name=spotify_web_app`;
          songs.push({
            id: `audius_${track.track_id}`,
            title: cleanHtml(track.title),
            artist: cleanHtml(track.user?.name || 'Audius Creator'),
            album: cleanHtml(track.genre || 'Single'),
            duration: Math.round(track.duration) || 180,
            image: artwork,
            streamUrl: stream,
            quality320: stream,
            quality160: stream,
            source: 'audius',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error fetching songs directly:', err);
  }

  return songs;
}

/**
 * Shared internal music search function
 */
export async function searchInternalMusic(query: string): Promise<SongItem[]> {
  const results: SongItem[] = [];
  const seenIds = new Set<string>();

  try {
    const ytSongs = await fetchYtTracks(query);
    for (const song of ytSongs) {
      if (!seenIds.has(song.id)) {
        seenIds.add(song.id);
        results.push(song);
      }
    }

    const directSongs = await fetchSongsDirectly(query);
    for (const s of directSongs) {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        results.push(s);
      }
    }
  } catch (err) {
    console.error('Error in searchInternalMusic:', err);
  }

  return results;
}

export function isSongByArtistStrict(song: any, targetArtist: string): boolean {
  if (!targetArtist) return true;
  const t = targetArtist.toLowerCase().trim();
  const title = (song.name || song.title || '').toLowerCase();
  const rawArtist =
    typeof song.artist === 'string'
      ? song.artist.toLowerCase()
      : (song.artist?.name || song.artists || '').toLowerCase();

  // Specific discography safeguard for Indonesian band Seventeen
  if (t.includes('seventeen')) {
    const seventeenHits = [
      'kemarin',
      'jaga selalu hatimu',
      'jaga slalu hatimu',
      'selalu mengalah',
      'menemukanmu',
      'untuk mencintaimu',
      'hal terindah',
      'ayah',
      'jalan terbaik',
      'cinta tak bertuan',
      'jangan dulu pergi',
      'saat kau temukan aku',
      'sumpah ku mencintaimu',
      'seisi hati',
      'jika kau percaya',
      'dendam',
      'ramadhan yang indah',
      'tanpa pesan terakhir',
      'dua hati',
      'mimpi besar',
    ];
    if (seventeenHits.some((h) => title.includes(h))) {
      return true;
    }
    if (rawArtist.includes('seventeen') || title.includes('seventeen')) {
      const kpopDisqualifiers = [
        'super',
        'clap',
        "don't wanna cry",
        'left & right',
        'hot',
        'god of music',
        'maestro',
        'home;run',
      ];
      if (kpopDisqualifiers.some((k) => title.includes(k))) return false;
      return true;
    }
    return false;
  }

  if (rawArtist && rawArtist.includes(t)) return true;
  if (Array.isArray(song.artists)) {
    if (song.artists.some((a: any) => (a.name || '').toLowerCase().includes(t))) return true;
  }
  if (title.includes(t)) return true;

  return false;
}
