import React from 'react';
import { X, Play, Trash2, ListMusic, Music } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    queueIndex,
    currentSong,
    playSong,
    removeFromQueue,
    clearQueue,
  } = useMusic();

  if (!isQueueOpen) return null;

  const nextSongs = queue.slice(queueIndex + 1);

  return (
    <div
      id="spotify-queue-drawer"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#121212] border-l border-zinc-800 p-4 sm:p-6 flex flex-col shadow-2xl select-none text-white animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <ListMusic className="w-5 h-5 text-[#1ED760]" />
          <h2 className="text-lg font-bold">Antrean Lagu</h2>
        </div>
        <div className="flex items-center space-x-2">
          {nextSongs.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 transition-colors"
            >
              Kosongkan
            </button>
          )}
          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Tutup antrean"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* Now Playing */}
        {currentSong && (
          <div>
            <span className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider block mb-3">
              Sedang Diputar
            </span>
            <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-zinc-800/80 border border-emerald-900/40">
              <img
                src={currentSong.image}
                alt={currentSong.title}
                className="w-12 h-12 rounded object-cover shadow bg-zinc-900"
              />
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-[#1ED760] truncate">{currentSong.title}</p>
                <p className="text-xs text-zinc-300 truncate">{currentSong.artist}</p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{formatDuration(currentSong.duration)}</span>
            </div>
          </div>
        )}

        {/* Next Up */}
        <div>
          <span className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider block mb-3">
            Berikutnya ({nextSongs.length})
          </span>

          {nextSongs.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 space-y-2">
              <Music className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs">Antrean berikutnya kosong.</p>
              <p className="text-[11px] text-zinc-500">
                Pilih lagu dan tekan tombol '+' untuk menambahkan ke antrean.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {nextSongs.map((song, idx) => {
                const actualIndex = queueIndex + 1 + idx;
                return (
                  <div
                    key={`${song.id}_${idx}`}
                    onClick={() => playSong(song, queue)}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden flex-1">
                      <span className="w-5 text-xs text-zinc-500 font-mono text-center shrink-0">
                        {idx + 1}
                      </span>
                      <img
                        src={song.image}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover shrink-0 bg-zinc-900"
                        loading="lazy"
                      />
                      <div className="overflow-hidden pr-2">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-[#1ED760]">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs text-zinc-400 font-mono">
                        {formatDuration(song.duration)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(actualIndex);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition-opacity"
                        title="Hapus dari antrean"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
