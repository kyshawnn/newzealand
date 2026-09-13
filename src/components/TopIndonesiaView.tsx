import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Shuffle,
  Heart,
  MoreVertical,
  PlusCircle,
  ListPlus,
  User,
  Flame,
  Check,
  Loader2,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';

export const TopIndonesiaView: React.FC = () => {
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
    setCurrentView,
  } = useMusic();

  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch('/api/top-indonesia')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setTopSongs(data);
        }
      })
      .catch((err) => console.error('Failed to load top songs:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayAll = () => {
    if (topSongs.length > 0) {
      playSong(topSongs[0], topSongs);
    }
  };

  const handleShuffle = () => {
    if (topSongs.length > 0) {
      const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled);
      showToast('Memutar secara acak');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Top 50 Indonesia - Tangga Lagu Terpopuler',
        text: 'Dengarkan 50 lagu terpopuler di Indonesia minggu ini',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Tautan bagikan disalin ke papan klip');
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '3:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isTopPlaying =
    isPlaying && topSongs.some((s) => s.videoId === currentSong?.videoId || s.id === currentSong?.id);

  const bannerCover =
    topSongs[0]?.image ||
    'https://i.ytimg.com/vi/NE41kVB0swQ/hqdefault.jpg';

  return (
    <div id="top-indonesia-page" className="pb-36 min-h-screen bg-transparent text-white select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Immersive Hero Banner matching ArtistView Style */}
      <div className="relative w-full h-[370px] sm:h-[430px] overflow-hidden bg-neutral-950">
        <img
          src={bannerCover}
          alt="Top 50 Indonesia"
          className="w-full h-full object-cover object-center filter saturate-125"
          referrerPolicy="no-referrer"
        />

        {/* Soft Dark Vignette & Bottom Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/55 to-black/45" />

        {/* Floating Top Navigation */}
        <div className="absolute top-4 left-0 right-0 px-4 sm:px-6 flex items-center justify-between z-20">
          <button
            onClick={() => setCurrentView('home')}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-95"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-95"
              title="Bagikan Tangga Lagu"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Bottom Info (Title + Badges + Action Buttons Row) */}
        <div className="absolute bottom-4 left-0 right-0 px-5 sm:px-8 z-20">
          {/* Category Pill */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-red-600/90 backdrop-blur-md text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 shadow-lg">
              <Flame className="w-3.5 h-3.5 fill-current" />
              Chart Resmi Indonesia
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-medium text-white/80 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Diperbarui Mingguan
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-md">
            Top 50 Indonesia
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl mb-4 drop-shadow">
            Kumpulan lagu paling populer, viral di radio dan media streaming di seluruh Nusantara minggu ini.
          </p>

          <div className="flex items-center gap-3">
            {/* Play All Button */}
            <button
              onClick={handlePlayAll}
              className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Putar Semua
            </button>

            {/* Shuffle Button */}
            <button
              onClick={handleShuffle}
              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md border border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              Acak
            </button>

            {/* Round Red Play/Pause Button */}
            <button
              onClick={() => {
                if (isTopPlaying) {
                  togglePlay();
                } else {
                  handlePlayAll();
                }
              }}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl ml-auto active:scale-95 transition-all cursor-pointer"
              title={isTopPlaying ? 'Jeda' : 'Putar Tangga Lagu'}
            >
              {isTopPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
              Daftar Tangga Lagu
            </span>
          </div>
          <span className="text-xs text-white/40">{topSongs.length} Lagu</span>
        </div>

        {/* Songs List */}
        <div className="space-y-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/50 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-white/80" />
              <span className="text-xs text-white/40">Memuat tangga lagu...</span>
            </div>
          ) : topSongs.length === 0 ? (
            <div className="text-center py-16 text-white/50 text-sm">
              Tidak ada lagu yang ditemukan.
            </div>
          ) : (
            topSongs.map((song, idx) => {
              const isCurrent =
                currentSong?.videoId === song.videoId || currentSong?.id === song.id;
              const isSongPlaying = isCurrent && isPlaying;
              const liked = isLiked(song.videoId || song.id);

              return (
                <div
                  key={`${song.id || song.videoId || 'top'}_${idx}`}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5 ${
                    isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playSong(song, topSongs);
                    }
                  }}
                >
                  {/* Rank Number */}
                  <span
                    className={`w-7 text-center text-xs font-extrabold ${
                      idx === 0
                        ? 'text-amber-400 text-sm'
                        : idx === 1
                        ? 'text-zinc-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-white/40'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Album Cover */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 shadow-md">
                    <img
                      src={
                        song.image ||
                        (song.videoId
                          ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`
                          : '')
                      }
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
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

                  {/* Title & Artist - Note: artist text is plain, clicking plays song */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-emerald-400' : 'text-white'
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

                  {/* Options Menu Button */}
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
                            playSong(song, topSongs);
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
            })
          )}
        </div>
      </div>
    </div>
  );
};
