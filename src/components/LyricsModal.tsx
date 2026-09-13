import React, { useMemo, useEffect, useRef } from 'react';
import { X, Mic2, Music, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusic } from '../context/MusicContext';
import { SyncedLine } from '../types';

function parseSyncedLyrics(lrcText: string): SyncedLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: SyncedLine[] = [];
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

// Generate dynamic harmonious glow colors based on track metadata
function getLyricsDynamicTones(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 45) % 360;
  const h3 = (h1 + 180) % 360;

  return {
    c1: `hsla(${h1}, 80%, 45%, 0.65)`,
    c2: `hsla(${h2}, 75%, 35%, 0.55)`,
    c3: `hsla(${h3}, 70%, 25%, 0.75)`,
  };
}

export const LyricsModal: React.FC = () => {
  const {
    currentSong,
    currentTime,
    seekTo,
    isLyricsOpen,
    setIsLyricsOpen,
    lyricsData,
    isLoadingLyrics,
  } = useMusic();

  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

  const syncedLines = useMemo(() => {
    if (!lyricsData?.syncedLyrics) return [];
    return parseSyncedLyrics(lyricsData.syncedLyrics);
  }, [lyricsData?.syncedLyrics]);

  // Find index of current active line with precise millisecond tracking
  const activeLineIndex = useMemo(() => {
    if (syncedLines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (currentTime >= syncedLines[i].time - 0.15) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [currentTime, syncedLines]);

  // Auto-scroll to active line smoothly
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  if (!isLyricsOpen || !currentSong) return null;

  const coverUrl =
    currentSong.image ||
    (currentSong.videoId ? `https://i.ytimg.com/vi/${currentSong.videoId}/hqdefault.jpg` : '');

  const seed = `${currentSong.title || ''} ${currentSong.artist || ''}`;
  const tones = getLyricsDynamicTones(seed);

  return (
    <div
      id="spotify-lyrics-view"
      className="fixed inset-0 z-50 flex flex-col p-4 sm:p-8 select-none text-white animate-in fade-in duration-300 overflow-hidden bg-[#0A0A0C]"
    >
      {/* 1. Dynamic iPhone Fluid Album Art & Glowing Orbs Background with Slow 2.5s Transitions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <AnimatePresence mode="popLayout">
          {coverUrl && (
            <motion.div
              key={coverUrl}
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 0.82, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeInOut' }}
              className="absolute -inset-24"
            >
              <img
                src={coverUrl}
                alt=""
                className="w-full h-full object-cover blur-[85px] saturate-200 contrast-125 brightness-80"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic ambient iPhone color orbs that gently pulse with slow transitions */}
        <div
          className="absolute -top-32 -left-24 w-[750px] h-[750px] rounded-full blur-[130px] transition-all duration-[2500ms] ease-in-out pointer-events-none animate-pulse"
          style={{
            background: `radial-gradient(circle, ${tones.c1} 0%, transparent 70%)`,
            animationDuration: '10s',
          }}
        />
        <div
          className="absolute top-1/3 -right-24 w-[750px] h-[750px] rounded-full blur-[140px] transition-all duration-[2800ms] ease-in-out pointer-events-none animate-pulse"
          style={{
            background: `radial-gradient(circle, ${tones.c2} 0%, transparent 70%)`,
            animationDuration: '14s',
          }}
        />
        <div
          className="absolute -bottom-24 left-1/4 w-[850px] h-[750px] rounded-full blur-[150px] transition-all duration-[3000ms] ease-in-out pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${tones.c3} 0%, transparent 75%)`,
          }}
        />

        {/* Soft Apple Music vignette and dark tint for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0C]/50 via-[#0A0A0C]/35 to-[#0A0A0C]/85" />
        <div className="absolute inset-0 backdrop-blur-[8px] bg-[#0A0A0C]/10" />
      </div>

      {/* Top Bar with Liquid Glass */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 shrink-0 backdrop-blur-xl">
        <div className="flex items-center space-x-3.5 overflow-hidden">
          <img
            src={coverUrl}
            alt={currentSong.title}
            className="w-12 h-12 rounded-xl object-cover shadow-xl border border-white/15 bg-neutral-900"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <h2 className="text-base sm:text-lg font-black truncate text-white drop-shadow-md">
              {currentSong.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 font-medium truncate drop-shadow">
              {currentSong.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLyricsOpen(false)}
            className="p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 text-white/90 hover:text-white transition-all border border-white/10 backdrop-blur-xl cursor-pointer shadow-md"
            title="Tutup Lirik"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto py-8 sm:py-12 max-w-3xl mx-auto w-full scroll-smooth no-scrollbar">
        {isLoadingLyrics ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 text-white/70">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <p className="text-base font-bold">Mengambil lirik lagu...</p>
          </div>
        ) : lyricsData?.instrumental ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-white/70">
            <Music className="w-16 h-16 text-white/40" />
            <p className="text-xl font-black text-white">Lagu Instrumental</p>
            <p className="text-sm text-white/60">Trek ini tidak memiliki lirik vokal.</p>
          </div>
        ) : syncedLines.length > 0 ? (
          /* Apple Music / iPhone Synced Lyrics with Accurate White Glow Trace */
          <div className="space-y-6 sm:space-y-8 text-left px-4 py-8">
            {syncedLines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              return (
                <p
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seekTo(line.time)}
                  className={`cursor-pointer transition-all duration-300 origin-left ${
                    isActive
                      ? 'text-white font-black text-2xl sm:text-4xl lg:text-5xl opacity-100 drop-shadow-[0_4px_24px_rgba(255,255,255,0.45)] scale-[1.02]'
                      : 'text-white/35 font-bold text-lg sm:text-2xl lg:text-3xl hover:text-white/80 hover:scale-[1.01]'
                  } leading-relaxed tracking-tight select-none`}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        ) : lyricsData?.plainLyrics ? (
          /* Plain Lyrics fallback */
          <div className="space-y-4 text-left px-4 py-6">
            <span className="text-xs uppercase font-extrabold text-white/60 tracking-wider mb-2 block">
              Teks Lirik Lengkap
            </span>
            <div className="text-lg sm:text-2xl font-bold text-white/90 whitespace-pre-line leading-relaxed drop-shadow">
              {lyricsData.plainLyrics}
            </div>
          </div>
        ) : (
          /* No Lyrics Found */
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-white/70">
            <Mic2 className="w-16 h-16 text-white/40" />
            <p className="text-xl font-black text-white">Lirik Belum Tersedia</p>
            <p className="text-sm text-white/60 max-w-sm text-center">
              Lirik untuk lagu "{currentSong.title}" sedang dalam pembaruan database publik.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
