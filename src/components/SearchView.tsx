'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search as SearchIcon,
  ArrowLeft,
  X,
  Play,
  Pause,
  Heart,
  MoreVertical,
  PlusCircle,
  ListPlus,
  User,
  Check,
  ExternalLink,
  History,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { TrackRowsSkeleton } from './PageSkeleton';

const DEFAULT_COVER = '';

const SEARCH_FILTERS = ['Semua', 'Lagu', 'Video', 'Album', 'Artis', 'Daftar putar'];

const FILTER_TYPE_MAP: Record<string, string> = {
  Semua: 'song',
  Lagu: 'song',
  Video: 'video',
  Album: 'album',
  Artis: 'artist',
  'Daftar putar': 'playlist',
};

const HISTORY_STORAGE_KEY = 'aura_music_search_history';

export const SearchView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    toggleLike,
    isLiked,
    addToQueue,
    setCurrentView,
    openArtist,
    setTrackToAddToPlaylist,
  } = useMusic();

  const [activeFilter, setActiveFilter] = useState('Semua');
  const [results, setResults] = useState<Song[]>([]);
  const [artistResults, setArtistResults] = useState<any[]>([]);
  const [albumResults, setAlbumResults] = useState<any[]>([]);
  const [playlistResults, setPlaylistResults] = useState<any[]>([]);
  const [topMatchedArtist, setTopMatchedArtist] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search History & Keyword Suggestions state
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const [showAllSongsInAllTab, setShowAllSongsInAllTab] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const suggestTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Save query to search history
  const saveToHistory = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== q.toLowerCase());
      const next = [q, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeFromHistory = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const next = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {}
    showToast('Riwayat pencarian dihapus');
  };

  // Fetch search keyword suggestions as user types or pauses
  useEffect(() => {
    if (suggestTimerRef.current) {
      clearTimeout(suggestTimerRef.current);
    }

    const q = searchQuery.trim();
    if (!q || q.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsFetchingSuggestions(false);
      return;
    }

    setIsFetchingSuggestions(true);
    suggestTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(data);
            if (data.length > 0) {
              setShowSuggestions(true);
            }
          }
        }
      } catch {
        // keep previous suggestions if any
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 60);

    return () => {
      if (suggestTimerRef.current) {
        clearTimeout(suggestTimerRef.current);
      }
    };
  }, [searchQuery]);

  const mapSongItems = (data: any[]): Song[] => {
    if (!Array.isArray(data)) return [];
    const seenIds = new Set<string>();
    const mapped: Song[] = [];

    for (const item of data) {
      const videoId =
        item.videoId ||
        (item.type === 'SONG' || item.type === 'VIDEO' ? item.id : null) ||
        (typeof item.id === 'string' && item.id.startsWith('yt_') ? item.id.replace('yt_', '') : undefined);
      const uniqueId = videoId
        ? `yt_${videoId}`
        : item.id || `track_${Date.now()}_${Math.random()}`;

      if (seenIds.has(uniqueId)) continue;
      seenIds.add(uniqueId);

      let cover =
        item.image ||
        item.thumbnail ||
        (Array.isArray(item.thumbnails) && item.thumbnails.length > 0
          ? item.thumbnails[item.thumbnails.length - 1]?.url || item.thumbnails[0]?.url
          : '');

      if (cover && (cover.includes('googleusercontent.com') || cover.includes('ytimg.com') || cover.includes('ggpht.com'))) {
        cover = cover.replace(/=w\d+-h\d+/, '=w300-h300');
      }
      if (!cover && videoId) {
        cover = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }

      const artistStr =
        typeof item.artist === 'string'
          ? item.artist
          : item.artist?.name ||
            (typeof item.artists === 'string' ? item.artists : 'Artis');

      const albumStr =
        typeof item.album === 'string'
          ? item.album
          : item.album?.name || 'Single';

      mapped.push({
        id: uniqueId,
        videoId: videoId || undefined,
        title: item.title || item.name || 'Lagu',
        name: item.title || item.name || 'Lagu',
        artist: artistStr,
        artists: artistStr,
        album: albumStr,
        duration: typeof item.duration === 'number' ? item.duration : 200,
        image: cover || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''),
        thumbnails: item.thumbnails || (cover ? [{ url: cover, width: 300, height: 300 }] : []),
        source: 'youtube',
      });
    }
    return mapped;
  };

  const executeSearch = async (queryText: string, filterName: string = activeFilter) => {
    const q = queryText.trim();
    setShowSuggestions(false);
    if (!q) {
      setResults([]);
      setArtistResults([]);
      setAlbumResults([]);
      setPlaylistResults([]);
      setTopMatchedArtist(null);
      setIsSearching(false);
      return;
    }

    saveToHistory(q);
    setIsSearching(true);
    setShowAllSongsInAllTab(false);

    try {
      if (filterName === 'Semua') {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const allItems = res.ok ? await res.json() : [];

        const songItems = Array.isArray(allItems)
          ? allItems.filter((i: any) => !i.type || i.type === 'SONG' || i.type === 'VIDEO')
          : [];
        const artistItems = Array.isArray(allItems)
          ? allItems.filter((i: any) => i.type === 'ARTIST')
          : [];
        const albumItems = Array.isArray(allItems)
          ? allItems.filter((i: any) => i.type === 'ALBUM')
          : [];
        const playlistItems = Array.isArray(allItems)
          ? allItems.filter((i: any) => i.type === 'PLAYLIST')
          : [];

        const mappedSongs = mapSongItems(songItems);
        setResults(mappedSongs);
        setArtistResults(artistItems);
        setAlbumResults(albumItems);
        setPlaylistResults(playlistItems);

        if (artistItems.length > 0) {
          const first = artistItems[0];
          if (
            first.name &&
            (first.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(first.name.toLowerCase()))
          ) {
            setTopMatchedArtist(first);
          } else {
            setTopMatchedArtist(null);
          }
        } else {
          setTopMatchedArtist(null);
        }
      } else if (filterName === 'Artis') {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=artist`);
        const data = res.ok ? await res.json() : [];
        setArtistResults(Array.isArray(data) ? data : []);
        setResults([]);
        setAlbumResults([]);
        setPlaylistResults([]);
        setTopMatchedArtist(null);
      } else if (filterName === 'Album') {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=album`);
        const data = res.ok ? await res.json() : [];
        setAlbumResults(Array.isArray(data) ? data : []);
        setResults([]);
        setArtistResults([]);
        setPlaylistResults([]);
        setTopMatchedArtist(null);
      } else if (filterName === 'Daftar putar' || filterName === 'Playlist') {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=playlist`);
        const data = res.ok ? await res.json() : [];
        setPlaylistResults(Array.isArray(data) ? data : []);
        setResults([]);
        setArtistResults([]);
        setAlbumResults([]);
        setTopMatchedArtist(null);
      } else {
        // 'Lagu' or 'Video'
        const filterParam = FILTER_TYPE_MAP[filterName] || 'song';
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(filterParam)}`);
        const data = res.ok ? await res.json() : [];

        setArtistResults([]);
        setAlbumResults([]);
        setPlaylistResults([]);

        const mapped = mapSongItems(data);
        setResults(mapped);

        if (filterName === 'Lagu') {
          fetch(`/api/search?q=${encodeURIComponent(q)}&type=artist`)
            .then((r) => (r.ok ? r.json() : []))
            .then((artList) => {
              if (Array.isArray(artList) && artList.length > 0) {
                const first = artList[0];
                if (
                  first.name &&
                  (first.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(first.name.toLowerCase()))
                ) {
                  setTopMatchedArtist(first);
                } else {
                  setTopMatchedArtist(null);
                }
              } else {
                setTopMatchedArtist(null);
              }
            })
            .catch(() => setTopMatchedArtist(null));
        } else {
          setTopMatchedArtist(null);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterClick = (filterName: string) => {
    setActiveFilter(filterName);
    setShowAllSongsInAllTab(false);
    if (searchQuery.trim()) {
      executeSearch(searchQuery, filterName);
    }
  };

  const handleSelectKeyword = (keyword: string) => {
    setSearchQuery(keyword);
    executeSearch(keyword, activeFilter);
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '3:20';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="search-view-container" className="pb-36 min-h-screen bg-transparent text-white select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Search Header - Static without background container, matches Beranda */}
      <div className="relative z-30 px-4 pt-4 pb-2 bg-transparent space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('home')}
            className="p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-white transition-all cursor-pointer shrink-0 shadow-sm"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Capsule Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              id="search-input-field"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  executeSearch(searchQuery, activeFilter);
                }
              }}
              placeholder="Cari lagu, artis, lirik..."
              autoFocus
              className="w-full pl-10 pr-16 py-2.5 bg-white/[0.08] text-white placeholder-white/40 rounded-full border border-white/15 focus:outline-none focus:border-white/30 text-xs sm:text-sm transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setResults([]);
                    setArtistResults([]);
                    setAlbumResults([]);
                    setPlaylistResults([]);
                    setTopMatchedArtist(null);
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="p-1 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Hapus teks"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => executeSearch(searchQuery, activeFilter)}
                  className="px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-bold hover:scale-105 active:scale-95 transition-all shadow cursor-pointer"
                  title="Cari"
                >
                  Cari
                </button>
              )}
            </div>

            {/* Attached Floating Suggestions Dropdown (Nempel di Input) */}
            {showSuggestions && searchQuery.trim().length > 0 && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b]/95 backdrop-blur-md border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Saran Pencarian
                </div>
                {suggestions.map((sug, i) => (
                  <div
                    key={`${sug}_${i}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectKeyword(sug);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-white/90 hover:text-white cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SearchIcon className="w-3.5 h-3.5 text-white/40 group-hover:text-white shrink-0" />
                      <span className="truncate font-medium">{sug}</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {SEARCH_FILTERS.map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-white/[0.06] backdrop-blur-xl text-white/75 border-white/10 hover:bg-white/[0.14] hover:text-white'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto space-y-4">
        {/* Empty Query: Riwayat Pencarian (Search History) */}
        {!searchQuery.trim() && (
          <div className="py-2 space-y-4">
            {searchHistory.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-white/40" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                      Riwayat Pencarian
                    </span>
                  </div>
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-white/40 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                </div>

                <div className="space-y-1">
                  {searchHistory.map((item, idx) => (
                    <div
                      key={`${item}_${idx}`}
                      onClick={() => handleSelectKeyword(item)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-white/90 hover:text-white transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <History className="w-4 h-4 text-white/30 group-hover:text-white/60 shrink-0" />
                        <span className="truncate font-medium">{item}</span>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(item, e)}
                        className="p-1 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Hapus riwayat ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-white/40 text-xs space-y-2">
                <SearchIcon className="w-8 h-8 text-white/20 mx-auto" />
                <p>Ketik kata kunci untuk mencari lagu, artis, atau album favoritmu.</p>
              </div>
            )}
          </div>
        )}

        {/* Loading Skeleton */}
        {isSearching && (
          <div className="py-2">
            <TrackRowsSkeleton count={8} />
          </div>
        )}

        {/* SONG & VIDEO Results List */}
        {!isSearching && searchQuery && results.length > 0 && (activeFilter === 'Semua' || activeFilter === 'Lagu' || activeFilter === 'Video') && (
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40 px-1 block mb-2">
              {activeFilter === 'Video' ? 'Video Musik' : 'Lagu'} ({results.length})
            </span>
            {results.map((song, idx) => {
              const isCurrent =
                currentSong?.videoId === song.videoId || currentSong?.id === song.id;
              const isSongPlaying = isCurrent && isPlaying;
              const liked = isLiked(song.videoId || song.id);

              return (
                <div
                  key={`${song.id || song.videoId || 's'}_${idx}`}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-white/10 ${
                    isCurrent ? 'bg-white/10' : 'hover:bg-white/[0.06]'
                  }`}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playSong(song, results);
                    }
                  }}
                >
                  {/* Square Cover Art - full frame matching Beranda */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10 shadow-md">
                    <img
                      src={song.image || (song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : '')}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (song.videoId && !target.src.includes('hqdefault.jpg')) {
                          target.src = `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`;
                        }
                      }}
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        {isSongPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                            <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-white' : 'text-white/90'
                      }`}
                    >
                      {song.title}
                    </h4>
                    <p className="text-xs text-white/50 truncate block mt-0.5">
                      {song.artist}
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="text-xs text-white/40 hidden sm:inline-block">
                    {formatDuration(song.duration)}
                  </span>

                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    className={`p-2 rounded-full transition-transform active:scale-90 cursor-pointer ${
                      liked ? 'text-red-500' : 'text-white/40 hover:text-white'
                    }`}
                    title={liked ? 'Hapus Suka' : 'Sukai'}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  </button>

                  {/* Options Menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() =>
                        setActiveMenuSongId(
                          activeMenuSongId === song.id ? null : song.id
                        )
                      }
                      className="p-2 text-white/40 hover:text-white rounded-full transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuSongId === song.id && (
                      <div className="absolute right-0 top-10 w-48 bg-[#1E1E20] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => {
                            playSong(song, results);
                            setActiveMenuSongId(null);
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Putar Sekarang
                        </button>
                        <button
                          onClick={() => {
                            addToQueue(song);
                            setActiveMenuSongId(null);
                            showToast('Ditambahkan ke Antrean');
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                          Tambah ke Antrean
                        </button>
                        <button
                          onClick={() => {
                            setTrackToAddToPlaylist(song);
                            setActiveMenuSongId(null);
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Tambah ke Playlist
                        </button>
                        {song.artist && (
                          <button
                            onClick={() => {
                              openArtist({ name: song.artist });
                              setActiveMenuSongId(null);
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5" />
                            Buka Artis
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ARTIS Filter Results List */}
        {!isSearching && searchQuery && (activeFilter === 'Semua' || activeFilter === 'Artis') && artistResults.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40 px-1">
              Hasil Artis ({artistResults.length})
            </span>
            {(activeFilter === 'Semua' ? artistResults.slice(0, 4) : artistResults).map((art, idx) => (
              <div
                key={`${art.artistId || art.name || 'art'}_${idx}`}
                onClick={() =>
                  openArtist({
                    name: art.name,
                    artistId: art.artistId,
                    image:
                      art.thumbnail ||
                      art.thumbnails?.[art.thumbnails.length - 1]?.url,
                  })
                }
                className="flex items-center justify-between p-3.5 rounded-[24px] bg-white/[0.06] hover:bg-white/[0.12] transition-all cursor-pointer border border-white/10 shadow-sm group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-white/10 bg-neutral-900 shadow-sm">
                    <ImageWithSkeleton
                      src={
                        art.thumbnail ||
                        art.thumbnails?.[art.thumbnails.length - 1]?.url
                      }
                      alt={art.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{art.name}</h4>
                    <p className="text-xs text-white/50">
                      {art.subscribers || 'Artis Resmi'}
                    </p>
                  </div>
                </div>

                <button className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0 group-hover:bg-white group-hover:text-black transition-all">
                  Lihat Profil
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ALBUM Filter Results */}
        {!isSearching && searchQuery && (activeFilter === 'Semua' || activeFilter === 'Album') && albumResults.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40 px-1">
              Hasil Album ({albumResults.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(activeFilter === 'Semua' ? albumResults.slice(0, 6) : albumResults).map((alb, idx) => (
                <div
                  key={`${alb.albumId || 'alb'}_${idx}`}
                  onClick={() => {
                    if (alb.artist) {
                      openArtist({ name: alb.artist });
                    }
                  }}
                  className="bg-white/[0.06] border border-white/10 rounded-[28px] p-3 hover:bg-white/[0.12] transition-all cursor-pointer group shadow-sm"
                >
                  <div className="aspect-square rounded-[22px] overflow-hidden bg-black/40 mb-2.5 shadow-md relative">
                    <ImageWithSkeleton
                      src={alb.thumbnail || alb.thumbnails?.[0]?.url}
                      alt={alb.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h5 className="text-xs font-bold text-white truncate px-1">
                    {alb.name}
                  </h5>
                  <p className="text-[11px] text-white/50 px-1 truncate mt-0.5">
                    {(typeof alb.artist === 'string' ? alb.artist : alb.artist?.name) || 'Artis'} {alb.year ? `• ${alb.year}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAYLIST Filter Results */}
        {!isSearching && searchQuery && (activeFilter === 'Semua' || activeFilter === 'Daftar putar') && playlistResults.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40 px-1">
              Playlist ({playlistResults.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(activeFilter === 'Semua' ? playlistResults.slice(0, 6) : playlistResults).map((pl, idx) => (
                <div
                  key={`${pl.playlistId || 'pl'}_${idx}`}
                  className="bg-white/[0.06] border border-white/10 rounded-[28px] p-3 hover:bg-white/[0.12] transition-all cursor-pointer group shadow-sm"
                >
                  <div className="aspect-square rounded-[22px] overflow-hidden bg-black/40 mb-2.5 shadow-md relative">
                    <ImageWithSkeleton
                      src={pl.thumbnail || pl.thumbnails?.[0]?.url}
                      alt={pl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h5 className="text-xs font-bold text-white truncate px-1">
                    {pl.name}
                  </h5>
                  <p className="text-[11px] text-white/50 px-1 truncate mt-0.5">
                    Playlist
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPTY RESULTS STATE */}
        {!isSearching && searchQuery.trim().length > 0 && !topMatchedArtist && results.length === 0 && artistResults.length === 0 && albumResults.length === 0 && playlistResults.length === 0 && (
          <div className="py-16 text-center text-white/40 text-xs space-y-2">
            <SearchIcon className="w-8 h-8 text-white/20 mx-auto" />
            <p>Tidak ada hasil ditemukan untuk &quot;{searchQuery}&quot;.</p>
          </div>
        )}
      </div>
    </div>
  );
};
