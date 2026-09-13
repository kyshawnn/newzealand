import React, { useState, useEffect, useRef, useMemo } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ChevronDown,
  ListMusic,
  Mic2,
  Disc,
  MoreVertical,
  PlusCircle,
  Share2,
  Check,
  X,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';

function parseSyncedLyrics(lrcText: string): { time: number; text: string }[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: { time: number; text: string }[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const line of lines) {
    const matches = Array.from(line.matchAll(timeRegex));
    if (matches.length > 0) {
      const text = line.replace(timeRegex, '').trim();
      if (!text) continue;
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const msRaw = match[3] || '0';
        const ms = parseInt(msRaw.padEnd(3, '0').slice(0, 3), 10);
        const totalSeconds = minutes * 60 + seconds + ms / 1000;
        result.push({ time: totalSeconds, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export const Player: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    isShuffle,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    toggleRepeat,
    toggleShuffle,
    isLiked,
    toggleLike,
    registerYtPlayer,
    handleYtStateChange,
    upNextTracks,
    playSong,
    lyricsData,
    isLoadingLyrics,
    isPlayerExpanded,
    setIsPlayerExpanded,
    isMiniPlayerDismissed,
    setIsMiniPlayerDismissed,
    setTrackToAddToPlaylist,
    openArtist,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'track' | 'lyrics' | 'upnext'>('track');
  const [copied, setCopied] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  const syncedLines = useMemo(() => {
    if (!lyricsData?.syncedLyrics) return [];
    return parseSyncedLyrics(lyricsData.syncedLyrics);
  }, [lyricsData?.syncedLyrics]);

  const activeLyricsLineIndex = useMemo(() => {
    if (syncedLines.length > 0) {
      let idx = -1;
      for (let i = 0; i < syncedLines.length; i++) {
        if (currentTime >= syncedLines[i].time - 0.2) {
          idx = i;
        } else {
          break;
        }
      }
      return idx;
    }
    // Fallback: if only plain lines are available, estimate based on song progress
    if (lyricsData?.lines && lyricsData.lines.length > 0 && duration > 0) {
      const fraction = Math.min(1, Math.max(0, currentTime / duration));
      return Math.min(lyricsData.lines.length - 1, Math.floor(fraction * lyricsData.lines.length));
    }
    return -1;
  }, [currentTime, duration, syncedLines, lyricsData?.lines]);

  // Auto scroll active lyric in full player lyrics tab
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricsLineIndex, activeTab]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    registerYtPlayer(event.target);
    try {
      if (typeof event.target.unMute === 'function') {
        event.target.unMute();
      }
      if (typeof event.target.setVolume === 'function') {
        event.target.setVolume(100);
      }
      if (isPlaying && currentSong?.videoId) {
        event.target.playVideo();
      }
    } catch {
      // ignore
    }

    // Handle mobile browser autoplay restrictions by unlocking audio on user gesture
    const unlockAudio = () => {
      try {
        if (event.target && typeof event.target.unMute === 'function') {
          event.target.unMute();
          event.target.setVolume(100);
          if (isPlaying) {
            event.target.playVideo();
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
  };

  const onPlayerError: YouTubeProps['onError'] = (event) => {
    console.warn('YouTube Player error code:', event.data);
    // Avoid rapid endless skipping loop if video embedding is restricted (code 150/101)
    if (event.data === 150 || event.data === 101) {
      console.warn('Embedding restricted for this track, moving to next after brief pause');
      setTimeout(() => {
        playNext();
      }, 2500);
    }
  };

  const handleShare = () => {
    if (currentSong) {
      const url = currentSong.videoId
        ? `https://youtu.be/${currentSong.videoId}`
        : window.location.href;
      navigator.clipboard?.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (!currentSong) return null;

  const liked = isLiked(currentSong.videoId || currentSong.id);
  const songImage =
    currentSong.image ||
    currentSong.thumbnails?.[0]?.url ||
    (currentSong.videoId ? `https://i.ytimg.com/vi/${currentSong.videoId}/hqdefault.jpg` : '');

  return (
    <>
      {/* Background YouTube Audio Engine (In-DOM 1px element to guarantee continuous audio playback when minimized/screen off) */}
      <div
        className="fixed bottom-0 right-0 pointer-events-none w-[1px] h-[1px] opacity-[0.001] overflow-hidden z-[-1]"
        aria-hidden="true"
      >
        {currentSong.videoId && (
          <YouTube
            key={currentSong.videoId}
            videoId={currentSong.videoId}
            opts={{
              height: '180',
              width: '320',
              playerVars: {
                autoplay: 1,
                controls: 0,
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
                enablejsapi: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : undefined,
              },
            }}
            onReady={onPlayerReady}
            onStateChange={handleYtStateChange}
            onError={onPlayerError}
          />
        )}
      </div>

      {/* 1. FLOATING MINI PLAYER (Liquid Glass Translucent Docked above BottomNav, radius 40px, isolated events) */}
      {!isPlayerExpanded && !isMiniPlayerDismissed && (
        <div
          id="mini-player-bar"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsPlayerExpanded(true);
          }}
          className="fixed bottom-[74px] left-3.5 right-3.5 z-40 max-w-lg mx-auto bg-[#18181b]/90 hover:bg-[#202024]/95 active:scale-[0.99] backdrop-blur-md rounded-full p-2 pl-2.5 pr-2.5 flex items-center justify-between border border-white/15 cursor-pointer shadow-[0_12px_40px_rgba(0,0,0,0.65)] transition-all duration-200 select-none pointer-events-auto"
        >
          {/* Track Info (Left) */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            {/* Circular Cover Art */}
            <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/15 bg-neutral-900 shadow-md">
              <img
                src={songImage}
                alt={currentSong.title || currentSong.name}
                className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                loading="eager"
              />
            </div>

            {/* Title & Artist */}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                {currentSong.title || currentSong.name}
              </h4>
              <p className="text-[11px] sm:text-xs text-white/50 truncate mt-0.5">
                {currentSong.artist || currentSong.artists}
              </p>
            </div>
          </div>

          {/* Quick Controls (Right) */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Play/Pause Button */}
            <button
              id="mini-play-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePlay();
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Heart Button */}
            <button
              id="mini-like-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleLike(currentSong);
              }}
              className={`w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                liked ? 'text-red-500' : 'text-white/60 hover:text-white'
              }`}
              title={liked ? 'Hapus Suka' : 'Sukai'}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </button>

            {/* Next Track Button */}
            <button
              id="mini-next-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playNext();
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Berikutnya"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Close / Dismiss mini player button: stops playback & dismisses mini player */}
            <button
              id="mini-dismiss-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPlaying) {
                  togglePlay();
                }
                setIsMiniPlayerDismissed(true);
              }}
              className="w-7 h-7 rounded-full text-white/40 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-0.5"
              title="Hentikan & Tutup Pemutar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Micro Progress Bar along bottom */}
          <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. FULL-SCREEN EXPANDED PLAYER POPUP (iPhone Clean modal with Dynamic Fluid Ambient Backdrop) */}
      {isPlayerExpanded && (
        <div
          id="full-screen-player-modal"
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-[#0A0A0C] flex flex-col justify-between p-5 sm:p-6 overflow-y-auto no-scrollbar pointer-events-auto animate-in fade-in slide-in-from-bottom-6 duration-300 relative"
        >
          {/* Dynamic Background matching song artwork with slow smooth 2.5s transition */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
            {songImage ? (
              <>
                <img
                  src={songImage}
                  alt=""
                  className="w-full h-full object-cover scale-150 blur-[90px] opacity-65 saturate-150 brightness-75 transition-all duration-[2500ms] ease-in-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0A0A0C]/70 to-[#0A0A0C]/90" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-neutral-900/60 via-[#0A0A0C]/80 to-[#0A0A0C]" />
            )}
          </div>

          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between relative z-10 max-w-md mx-auto w-full">
            <button
              id="close-expanded-player-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPlayerExpanded(false);
              }}
              className="p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl border border-white/10 text-white transition-all cursor-pointer shadow-md active:scale-95"
              title="Tutup Popup"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                Memutar Sekarang
              </span>
              <p className="text-xs font-semibold text-white/90 truncate max-w-[180px]">
                {currentSong.album || 'Top Hits'}
              </p>
            </div>

            <div className="relative">
              <button
                id="expanded-options-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(!showOptionsMenu);
                }}
                className="p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl border border-white/10 text-white transition-all cursor-pointer shadow-md active:scale-95"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-12 w-48 bg-black/80 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setTrackToAddToPlaylist(currentSong);
                      setShowOptionsMenu(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-white/70" />
                    Tambah ke Playlist
                  </button>
                  <button
                    onClick={() => {
                      handleShare();
                      setShowOptionsMenu(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white/70" />}
                    {copied ? 'Tautan Disalin' : 'Bagikan'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subtabs: Lagu | Lirik | Berikutnya */}
          <div className="flex items-center justify-center gap-2 my-4 relative z-10 max-w-md mx-auto w-full">
            <button
              onClick={() => setActiveTab('track')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.08] backdrop-blur-xl border border-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5" />
                Lagu
              </span>
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.08] backdrop-blur-xl border border-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5" />
                Lirik
              </span>
            </button>
            <button
              onClick={() => setActiveTab('upnext')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'upnext'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5" />
                Berikutnya ({upNextTracks.length})
              </span>
            </button>
          </div>

          {/* TAB 1: TRACK VIEW (Artwork, Scrub Bar, Controls) */}
          {activeTab === 'track' && (
            <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full pt-1 pb-4 relative z-10">
              {/* Square Artwork with elevated position to eliminate upper gap */}
              <div className="relative aspect-square w-full max-w-[340px] sm:max-w-[380px] mx-auto rounded-[32px] overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 mt-1 mb-5">
                <img
                  src={songImage}
                  alt={currentSong.title || currentSong.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Artist & Like */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="min-w-0 flex-1 pr-4">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate leading-tight">
                    {currentSong.title || currentSong.name}
                  </h2>
                  <p
                    onClick={() => {
                      if (currentSong?.artist) {
                        setIsPlayerExpanded(false);
                        openArtist({ name: currentSong.artist });
                      }
                    }}
                    className="text-xs sm:text-sm text-white/60 hover:text-white hover:underline font-medium truncate mt-1 cursor-pointer inline-block"
                  >
                    {currentSong.artist || currentSong.artists}
                  </p>
                </div>

                <button
                  id="expanded-like-btn"
                  onClick={() => toggleLike(currentSong)}
                  className={`p-3 rounded-full transition-transform active:scale-90 cursor-pointer ${
                    liked ? 'text-red-500' : 'text-white/50 hover:text-white'
                  }`}
                  title={liked ? 'Hapus Suka' : 'Sukai'}
                >
                  <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Timeline Slider with Clean White Trail & Thumb (No Neon) */}
              <div className="mb-4 px-1">
                <div className="relative w-full h-7 flex items-center group cursor-pointer select-none">
                  {/* Background Track */}
                  <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden">
                    {/* White Progress Trail behind the circle */}
                    <div
                      className="h-full bg-white rounded-full transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Moving Round Thumb (Clean White, No Neon Glow) */}
                  <div
                    className="absolute w-3.5 h-3.5 bg-white rounded-full -translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform"
                    style={{ left: `${progressPercent}%` }}
                  />

                  {/* Interactive Range Input */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-white/40 -mt-0.5 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls Row */}
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 transition-colors cursor-pointer ${
                    isShuffle ? 'text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title="Acak"
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button
                  onClick={playPrev}
                  className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Sebelumnya"
                >
                  <SkipBack className="w-7 h-7" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title={isPlaying ? 'Jeda' : 'Putar'}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Berikutnya"
                >
                  <SkipForward className="w-7 h-7" />
                </button>

                <button
                  onClick={toggleRepeat}
                  className={`p-2 transition-colors cursor-pointer ${
                    repeatMode !== 'off' ? 'text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title="Ulangi"
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-5 h-5 text-white" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LYRICS VIEW */}
          {activeTab === 'lyrics' && (
            <div
              ref={lyricsContainerRef}
              className="flex-1 overflow-y-auto max-w-md mx-auto w-full py-8 px-6 space-y-4 no-scrollbar scroll-smooth"
            >
              {isLoadingLyrics ? (
                <div className="flex justify-center py-20 text-white/50 text-xs">
                  Memuat lirik...
                </div>
              ) : syncedLines.length > 0 ? (
                /* Synced Lyrics - clean and normal Spotify-style text */
                syncedLines.map((line, idx) => {
                  const isActive = idx === activeLyricsLineIndex;
                  const isPast = idx < activeLyricsLineIndex;
                  return (
                    <p
                      key={idx}
                      ref={isActive ? activeLyricRef : null}
                      onClick={() => seekTo(line.time)}
                      className={`text-lg sm:text-xl font-bold transition-all duration-200 cursor-pointer leading-relaxed ${
                        isActive
                          ? 'text-white scale-[1.02] font-extrabold opacity-100'
                          : isPast
                          ? 'text-white/60 hover:text-white/80'
                          : 'text-white/30 hover:text-white/60'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })
              ) : lyricsData?.lines && lyricsData.lines.length > 0 ? (
                lyricsData.lines.map((line, idx) => {
                  const isActive = idx === activeLyricsLineIndex;
                  const isPast = idx < activeLyricsLineIndex;
                  return (
                    <p
                      key={idx}
                      ref={isActive ? activeLyricRef : null}
                      className={`text-lg sm:text-xl font-bold transition-all duration-200 leading-relaxed ${
                        isActive
                          ? 'text-white scale-[1.02] font-extrabold opacity-100'
                          : isPast
                          ? 'text-white/60 hover:text-white/80'
                          : 'text-white/30 hover:text-white/60'
                      }`}
                    >
                      {line}
                    </p>
                  );
                })
              ) : (
                <div className="text-center py-24 text-white/40 text-sm">
                  Lirik tidak tersedia untuk lagu ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UP NEXT QUEUE */}
          {activeTab === 'upnext' && (
            <div className="flex-1 overflow-y-auto max-w-md mx-auto w-full py-4 space-y-2 no-scrollbar">
              {upNextTracks.length === 0 ? (
                <div className="text-center py-20 text-white/40 text-xs">
                  Tidak ada lagu berikutnya di antrean.
                </div>
              ) : (
                upNextTracks.map((trk, i) => (
                  <div
                    key={`${trk.videoId || trk.id || 'up'}_${i}`}
                    onClick={() => playSong(trk, upNextTracks)}
                    className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                      <img
                        src={
                          trk.image ||
                          `https://i.ytimg.com/vi/${trk.videoId}/hqdefault.jpg`
                        }
                        alt={trk.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs sm:text-sm font-semibold text-white truncate">
                        {trk.title}
                      </h5>
                      <p className="text-[11px] text-white/50 truncate">
                        {trk.artist}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
