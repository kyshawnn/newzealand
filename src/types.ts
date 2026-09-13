export interface Song {
  id: string;
  videoId?: string;
  title: string;
  name?: string;
  artist: string;
  artists?: string;
  album: string;
  duration: number; // in seconds
  image: string;
  thumbnails?: Array<{ url: string; width?: number; height?: number }>;
  streamUrl?: string;
  quality320?: string;
  quality160?: string;
  source?: 'youtube' | 'saavn' | 'audius' | 'local';
  audioUrl?: string;
  year?: string | number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  image?: string;
  songs: Song[];
  isCustom?: boolean;
  createdAt?: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type AudioQuality = 'auto' | '320' | '160';

export type ViewMode = 'home' | 'search' | 'library' | 'developer' | 'profile' | 'playlist' | 'liked' | 'history' | 'artist' | 'top' | 'genre' | 'downloaded';

export interface ArtistInfo {
  id?: string;
  artistId?: string;
  name: string;
  image?: string;
  subscribers?: string;
  description?: string;
  topSongs?: Song[];
}

export interface LyricsData {
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental: boolean;
  lines?: string[];
}

export interface SyncedLine {
  time: number; // in seconds
  text: string;
}
