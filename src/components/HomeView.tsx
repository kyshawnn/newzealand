import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  PlusCircle,
  ListPlus,
  User,
  History,
  Check,
  Shuffle,
  Loader2,
  Radio,
  Plus,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface FeaturedArtist {
  name: string;
  image: string;
  artistId?: string;
  subscribers?: string;
}

interface CommunityPlaylist {
  id: string;
  title: string;
  trackCount?: number | string;
  covers?: string[];
  gridCovers?: string[];
  tracks?: Song[];
  songs?: Song[];
}

interface SimilarSection {
  artist: {
    name: string;
    artistId?: string;
    image: string;
  };
  tracks?: Song[];
  songs?: Song[];
}

interface GenreItem {
  name: string;
  color?: string;
  gradient?: string;
}

interface HomeSectionsData {
  pilihan?: Song[];
  pamungkasSection?: SimilarSection;
  top50Indonesia?: Song[];
  surrenderToTheBeat?: Song[];
  funThrowbacks?: Song[];
  moreLikeChill?: Song[];
  suasanaHatiDanGenre?: GenreItem[];
  communityPlaylists?: CommunityPlaylist[];
  listeningArtists?: FeaturedArtist[];
  trendingNow?: Song[];
  newReleases?: Song[];
  similarSections?: SimilarSection[];
  viralTikTok?: Song[];
  feelGoodRock?: Song[];
  acousticChill?: Song[];
  eidGetaways?: Song[];
}

export const HomeView: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    isLiked,
    toggleLike,
    addToQueue,
    setTrackToAddToPlaylist,
    openArtist,
    openPlaylist,
    openGenre,
    setCurrentView,
    setIsHistoryOpen,
  } = useMusic();

  const [songs, setSongs] = useState<Song[]>([]);
  const [quickPicks, setQuickPicks] = useState<Song[]>([]);
  const [sectionsData, setSectionsData] = useState<HomeSectionsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activePill, setActivePill] = useState<string>('Beranda');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleOpenCommunityPlaylist = async (playlist: CommunityPlaylist) => {
    const plTracks = playlist.tracks || playlist.songs || [];

    // Open immediately with initial tracks
    openPlaylist({
      id: playlist.id,
      name: playlist.title,
      description: `Playlist Komunitas • ${playlist.trackCount || plTracks.length || '100'} lagu`,
      image: playlist.covers?.[0] || playlist.gridCovers?.[0],
      songs: plTracks,
      createdAt: Date.now(),
    });

    // Fetch full 100+ songs from scraper in background and update playlist
    try {
      const res = await fetch(
        `/api/community-playlist-songs?id=${encodeURIComponent(playlist.id)}&title=${encodeURIComponent(
          playlist.title
        )}`
      );
      if (res.ok) {
        const fullSongs: Song[] = await res.json();
        if (Array.isArray(fullSongs) && fullSongs.length > 0) {
          openPlaylist({
            id: playlist.id,
            name: playlist.title,
            description: `Playlist Komunitas • ${fullSongs.length} lagu`,
            image: playlist.covers?.[0] || playlist.gridCovers?.[0],
            songs: fullSongs,
            createdAt: Date.now(),
          });
        }
      }
    } catch (e) {
      console.error('Error fetching full community playlist songs:', e);
    }
  };

  // Helper to pick 4 random songs
  const pickRandomSongs = (source: Song[], count: number = 4): Song[] => {
    if (!source || source.length === 0) return [];
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const handleShuffleQuickPicks = () => {
    if (songs.length > 0) {
      setQuickPicks(pickRandomSongs(songs, 4));
      showToast('Pilihan cepat diperbarui');
    }
  };

  // Fetch initial home songs & home sections data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch('/api/home-sections')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && typeof data === 'object') {
          setSectionsData(data);
          if (Array.isArray(data.trendingNow) && data.trendingNow.length > 0) {
            setSongs((prev) => (prev.length === 0 ? data.trendingNow : prev));
            setQuickPicks((prev) => (prev.length === 0 ? pickRandomSongs(data.trendingNow, 4) : prev));
          }
        }
      })
      .catch((err) => console.error('Error fetching home sections:', err));

    fetch('/api/home-songs')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data);
          setQuickPicks(pickRandomSongs(data, 4));
        } else {
          fetch('/api/top-indonesia')
            .then((r2) => (r2.ok ? r2.json() : []))
            .then((topData) => {
              if (isMounted && Array.isArray(topData) && topData.length > 0) {
                setSongs(topData);
                setQuickPicks(pickRandomSongs(topData, 4));
              }
            })
            .catch(() => {});
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Standard horizontal square track card renderer (10+ songs scrollable)
  const renderHorizontalTrackCard = (song: Song, contextQueue: Song[], index?: number, keyPrefix?: string) => {
    const isCurrent = Boolean(
      currentSong && (
        (currentSong.videoId && song.videoId && currentSong.videoId === song.videoId) ||
        (currentSong.id && song.id && currentSong.id === song.id) ||
        (currentSong.videoId && song.id && currentSong.videoId === song.id.replace('yt_', '')) ||
        (currentSong.id && song.videoId && currentSong.id.replace('yt_', '') === song.videoId)
      )
    );
    const isSongPlaying = isCurrent && isPlaying;
    const liked = isLiked(song);

    return (
      <motion.div
        key={`${keyPrefix || 'track'}-${song.id || song.videoId || 's'}-${index ?? 0}`}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10px' }}
        transition={{ duration: 0.22, delay: Math.min((index ?? 0) * 0.03, 0.2) }}
        onClick={() => playSong(song, contextQueue)}
        className="w-[140px] sm:w-[155px] shrink-0 group flex flex-col cursor-pointer"
      >
        <div className="relative w-[140px] sm:w-[155px] h-[140px] sm:h-[155px] rounded-2xl overflow-hidden mb-2 bg-[#1C1C1E] border border-white/5 group-hover:border-white/20 transition-all shadow-md">
          <ImageWithSkeleton
            src={song.image}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Play status overlay */}
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isCurrent && isSongPlaying ? (
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-1 h-4.5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
              </div>
            ) : isCurrent ? (
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <Pause className="w-4 h-4 fill-current" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            )}
          </div>
        </div>

        {/* Title and Artist */}
        <div className="px-0.5">
          <h4
            className={`text-xs font-bold truncate leading-snug ${
              isCurrent ? 'text-emerald-400 font-extrabold' : 'text-white'
            }`}
          >
            {song.title}
          </h4>
          <p className="text-[11px] text-white/50 truncate mt-0.5">
            {song.artist}
          </p>
        </div>
      </motion.div>
    );
  };

  // 3x3 Grid card renderer for "Pilihan" section
  const renderPilihanGrid = (pilihanSongs: Song[]) => {
    // Break into columns of 3 songs each for smooth horizontal 3x3 scrolling
    const columns: Song[][] = [];
    for (let i = 0; i < pilihanSongs.length; i += 3) {
      columns.push(pilihanSongs.slice(i, i + 3));
    }

    return (
      <div className="flex gap-4 overflow-x-auto horizontal-scroll-row no-scrollbar py-2 px-1">
        {columns.map((col, colIdx) => (
          <motion.div
            key={colIdx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.22, delay: Math.min(colIdx * 0.04, 0.2) }}
            className="w-[280px] sm:w-[320px] shrink-0 flex flex-col gap-2.5"
          >
            {col.map((song, songIdx) => {
              const isCurrent = Boolean(
                currentSong && (
                  (currentSong.videoId && song.videoId && currentSong.videoId === song.videoId) ||
                  (currentSong.id && song.id && currentSong.id === song.id) ||
                  (currentSong.videoId && song.id && currentSong.videoId === song.id.replace('yt_', '')) ||
                  (currentSong.id && song.videoId && currentSong.id.replace('yt_', '') === song.videoId)
                )
              );
              const isSongPlaying = isCurrent && isPlaying;
              const liked = isLiked(song);

              return (
                <div
                  key={`${song.id || song.videoId || 'pil'}-${colIdx}-${songIdx}`}
                  onClick={() => playSong(song, pilihanSongs)}
                  className={`flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer group ${
                    isCurrent
                      ? 'bg-white/15 border border-white/25 shadow-md'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.15] border border-white/10 hover:border-white/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0 shadow-md">
                      <img
                        src={song.image}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrent && isSongPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="w-1 h-4.5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
                          </div>
                        ) : isCurrent ? (
                          <Pause className="w-4 h-4 fill-current text-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCurrent ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-white/50 truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    className={`p-2 rounded-full transition-transform active:scale-90 cursor-pointer ${
                      liked ? 'text-red-500' : 'text-white/30 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div id="home-view-container" className="pb-36 min-h-screen text-white select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* TOP HEADER - Natural blend with background, static, no borders or container boxes */}
      <div className="w-full px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between bg-transparent">
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-white leading-tight">
          Beranda
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white/85 hover:text-white cursor-pointer"
            title="Riwayat Pemutaran"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentView('developer')}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white/85 hover:text-white cursor-pointer"
            title="Profil / Tentang Pengembang"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category Pills - Clean & containerless */}
      <div className="w-full px-4 sm:px-6 pt-2 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto horizontal-scroll-row no-scrollbar py-1">
          {['Beranda', 'Santai', 'Energi', 'Fokus', 'Pesta', 'Romansa'].map((pill) => (
            <button
              key={pill}
              onClick={() => {
                setActivePill(pill);
                if (pill !== 'Beranda') {
                  const mappedGenre =
                    pill === 'Santai'
                      ? 'Chill'
                      : pill === 'Energi'
                      ? 'Energy'
                      : pill === 'Fokus'
                      ? 'Focus'
                      : pill === 'Pesta'
                      ? 'Party'
                      : pill === 'Romansa'
                      ? 'Romance'
                      : pill;
                  openGenre(mappedGenre);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activePill === pill
                  ? 'bg-white text-black font-bold shadow'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SECTIONS CONTAINER */}
      <div className="px-4 py-5 max-w-7xl mx-auto space-y-9">
        {/* 1. PILIHAN CEPAT */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pilihan Cepat
            </h2>

            <button
              onClick={handleShuffleQuickPicks}
              className="text-xs font-semibold text-white/50 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Acak
            </button>
          </div>

          {/* Quick picks list with enhanced border-radius and scroll-in animations */}
          <div className="space-y-2.5">
            {isLoading && quickPicks.length === 0 ? (
              <div className="py-12 flex justify-center items-center text-white/40">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              quickPicks.map((song, idx) => {
                const isCurrent = Boolean(
                  currentSong && (
                    (currentSong.videoId && song.videoId && currentSong.videoId === song.videoId) ||
                    (currentSong.id && song.id && currentSong.id === song.id) ||
                    (currentSong.videoId && song.id && currentSong.videoId === song.id.replace('yt_', '')) ||
                    (currentSong.id && song.videoId && currentSong.id.replace('yt_', '') === song.videoId)
                  )
                );
                const isSongPlaying = isCurrent && isPlaying;
                const liked = isLiked(song);
                const itemKey = `${song.id || song.videoId || 'qp'}-${idx}`;

                return (
                  <motion.div
                    key={itemKey}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-15px' }}
                    transition={{ duration: 0.24, delay: Math.min(idx * 0.03, 0.25) }}
                    onClick={() => playSong(song, quickPicks)}
                    className={`flex items-center justify-between p-2.5 rounded-[24px] transition-all cursor-pointer group ${
                      isCurrent
                        ? 'bg-white/15 border border-white/25 shadow-md'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.15] border border-white/10 hover:border-white/20 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1">
                      <div className="relative w-12 h-12 rounded-[18px] overflow-hidden bg-neutral-900 shrink-0 shadow-md">
                        <img
                          src={song.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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

                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isCurrent ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-white/50 truncate mt-0.5">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pr-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleLike(song)}
                        className={`p-2 rounded-full transition-transform active:scale-90 cursor-pointer ${
                          liked ? 'text-red-500' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuSongId(
                              activeMenuSongId === (song.id || song.videoId) ? null : (song.id || song.videoId)
                            )
                          }
                          className="p-2 text-white/40 hover:text-white rounded-full transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuSongId === (song.id || song.videoId) && (
                          <div className="absolute right-0 top-10 w-48 bg-[#18181b]/95 backdrop-blur-md border border-white/15 rounded-2xl p-1.5 shadow-2xl z-40">
                            <button
                              onClick={() => {
                                playSong(song, quickPicks);
                                setActiveMenuSongId(null);
                              }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white hover:bg-white/10 rounded-xl"
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
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white hover:bg-white/10 rounded-xl"
                            >
                              <ListPlus className="w-3.5 h-3.5" />
                              Tambah ke Antrean
                            </button>
                            <button
                              onClick={() => {
                                setTrackToAddToPlaylist(song);
                                setActiveMenuSongId(null);
                              }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white hover:bg-white/10 rounded-xl"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Tambah ke Playlist
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. FROM THE COMMUNITY (Clean cover cards outside containers) */}
        {sectionsData?.communityPlaylists && sectionsData.communityPlaylists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                From the community
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto horizontal-scroll-row no-scrollbar py-2 px-1">
              {(sectionsData.communityPlaylists || []).map((playlist, pIdx) => {
                const covers = (playlist.covers || playlist.gridCovers || []).slice(0, 4);
                const playlistTracks = playlist.tracks || playlist.songs || [];
                const firstCover = covers[0] || (playlistTracks[0]?.image) || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
                return (
                  <motion.div
                    key={`${playlist.id || 'pl'}-${pIdx}`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.22, delay: Math.min(pIdx * 0.03, 0.2) }}
                    onClick={() => handleOpenCommunityPlaylist(playlist)}
                    className="w-[140px] sm:w-[155px] shrink-0 group flex flex-col cursor-pointer"
                  >
                    <div className="relative w-[140px] sm:w-[155px] h-[140px] sm:h-[155px] rounded-2xl overflow-hidden mb-2 bg-[#1C1C1E] border border-white/5 group-hover:border-white/20 transition-all shadow-md">
                      {covers.length >= 4 ? (
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                          {covers.map((c, i) => (
                            <img
                              key={i}
                              src={c}
                              alt="Cover"
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      ) : (
                        <img
                          src={firstCover}
                          alt={playlist.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playlistTracks.length > 0) {
                              playSong(playlistTracks[0], playlistTracks);
                            }
                          }}
                          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="px-0.5">
                      <h4 className="text-xs font-bold truncate leading-snug text-white group-hover:text-emerald-400 transition-colors">
                        {playlist.title}
                      </h4>
                      <p className="text-[11px] text-white/50 truncate mt-0.5">
                        {playlist.trackCount || `${playlistTracks.length || 100} lagu`}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. TETAP MENDENGARKAN (Circular Artist Cards) */}
        {sectionsData?.listeningArtists && sectionsData.listeningArtists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Tetap mendengarkan
              </h2>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto horizontal-scroll-row no-scrollbar py-2 px-1">
              {(sectionsData.listeningArtists || []).map((artist, aIdx) => (
                <motion.div
                  key={`${artist.artistId || artist.name || 'art'}-${aIdx}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.22, delay: Math.min(aIdx * 0.03, 0.2) }}
                  onClick={() =>
                    openArtist({
                      name: artist.name,
                      artistId: artist.artistId,
                      image: artist.image,
                    })
                  }
                  className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer w-24 sm:w-28 text-center"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-white/15 group-hover:border-white/40 transition-all bg-neutral-900 shadow-xl">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="w-full px-1">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 truncate block transition-colors">
                      {artist.name}
                    </span>
                    <span className="text-[10px] text-white/50 block mt-0.5">Artis</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 5. TRENDING NOW (10+ Songs) */}
        {sectionsData?.trendingNow && sectionsData.trendingNow.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Trending now
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto horizontal-scroll-row no-scrollbar py-1 px-1">
              {(sectionsData.trendingNow || []).map((song, idx) =>
                renderHorizontalTrackCard(song, sectionsData.trendingNow || [], idx, 'trending')
              )}
            </div>
          </div>
        )}

        {/* 6. NEW RELEASES (10+ Songs) */}
        {sectionsData?.newReleases && sectionsData.newReleases.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                New Releases
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto horizontal-scroll-row no-scrollbar py-1 px-1">
              {(sectionsData.newReleases || []).map((song, idx) =>
                renderHorizontalTrackCard(song, sectionsData.newReleases || [], idx, 'newreleases')
              )}
            </div>
          </div>
        )}

        {/* 8. MORE SERUPA DENGAN SECTIONS */}
        {sectionsData?.similarSections && sectionsData.similarSections.length > 0 && (
          <div className="space-y-8">
            {sectionsData.similarSections.map((sim, sIdx) => {
              const simArtist = sim.artist || { name: 'Artis', image: '' };
              const simTracks = sim.tracks || sim.songs || [];
              return (
                <div key={`${simArtist.artistId || simArtist.name || 'sim'}-${sIdx}`}>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div
                      onClick={() => openArtist(simArtist)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0 bg-neutral-800 shadow-md">
                        <img
                          src={simArtist.image}
                          alt={simArtist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-white/50 font-medium block leading-none">
                          Serupa dengan
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight mt-0.5">
                          {simArtist.name}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => openArtist(simArtist)}
                      className="p-2 text-white/40 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      title={`Buka ${simArtist.name}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-3.5 overflow-x-auto horizontal-scroll-row no-scrollbar py-1 px-1">
                    {simTracks.map((song, idx) => renderHorizontalTrackCard(song, simTracks, idx, `sim-${sIdx}`))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 13. VIRAL ON TIKTOK */}
        {sectionsData?.viralTikTok && sectionsData.viralTikTok.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Viral On Tiktok
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto horizontal-scroll-row no-scrollbar py-1 px-1">
              {(sectionsData.viralTikTok || []).map((song, idx) =>
                renderHorizontalTrackCard(song, sectionsData.viralTikTok || [], idx, 'viral')
              )}
            </div>
          </div>
        )}

        {/* 14. FEEL-GOOD ROCK */}
        {sectionsData?.feelGoodRock && sectionsData.feelGoodRock.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Feel-good rock
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto horizontal-scroll-row no-scrollbar py-1 px-1">
              {(sectionsData.feelGoodRock || []).map((song, idx) =>
                renderHorizontalTrackCard(song, sectionsData.feelGoodRock || [], idx, 'rock')
              )}
            </div>
          </div>
        )}

        {/* 15. ACOUSTIC CHILL */}
        {sectionsData?.acousticChill && sectionsData.acousticChill.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Acoustic Chill
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto horizontal-scroll-row no-scrollbar py-1 px-1">
              {(sectionsData.acousticChill || []).map((song, idx) =>
                renderHorizontalTrackCard(song, sectionsData.acousticChill || [], idx, 'acoustic')
              )}
            </div>
          </div>
        )}

        {/* 16. FOR EID GETAWAYS */}
        {sectionsData?.eidGetaways && sectionsData.eidGetaways.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                For Eid Getaways
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto horizontal-scroll-row no-scrollbar py-1 px-1">
              {(sectionsData.eidGetaways || []).map((song, idx) =>
                renderHorizontalTrackCard(song, sectionsData.eidGetaways || [], idx, 'eid')
              )}
            </div>
          </div>
        )}

        {/* 17. SUASANA HATI DAN GENRE (Image 4 reference at the bottom of Home) */}
        {sectionsData?.suasanaHatiDanGenre && sectionsData.suasanaHatiDanGenre.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Suasana hati dan genre
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sectionsData.suasanaHatiDanGenre.map((genre, gIdx) => (
                <div
                  key={`${genre.name}-${gIdx}`}
                  onClick={() => openGenre(genre.name)}
                  style={{ backgroundColor: genre.color || '#2B4C5F' }}
                  className="h-16 sm:h-20 rounded-2xl p-4 flex items-center justify-between cursor-pointer border border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95 transition-all shadow-lg group"
                >
                  <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                    {genre.name}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/80 group-hover:text-white group-hover:bg-white/25 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
