import React, { useState } from 'react';
import { Home, Search, Library, Plus, Heart, Music, Disc3, Radio, Trash2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { FEATURED_PLAYLISTS } from '../data/defaultData';

interface SidebarProps {
  onOpenCreatePlaylist: () => void;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreatePlaylist,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
}) => {
  const {
    currentView,
    setCurrentView,
    activePlaylistId,
    setActivePlaylistId,
    likedSongs,
    playlists,
    deletePlaylist,
  } = useMusic();

  const handleNavClick = (view: 'home' | 'search' | 'library' | 'liked') => {
    setCurrentView(view);
    setActivePlaylistId(null);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  const handlePlaylistClick = (playlistId: string) => {
    setActivePlaylistId(playlistId);
    setCurrentView('playlist');
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  return (
    <aside
      id="spotify-sidebar"
      className={`fixed inset-y-0 left-0 z-40 w-64 md:w-72 bg-black flex flex-col p-2 space-y-2 select-none transition-transform duration-300 md:static md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Top Section: Brand & Primary Navigation */}
      <div className="bg-[#121212] rounded-xl p-4 flex flex-col space-y-4">
        {/* Brand Logo */}
        <div
          id="spotify-brand-logo"
          onClick={() => handleNavClick('home')}
          className="flex items-center space-x-3 cursor-pointer group px-1"
        >
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-zinc-800 shadow-md group-hover:scale-105 transition-transform">
            <Disc3 className="w-6 h-6 text-[#1ED760] animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-[#1ED760] transition-colors">
                Spotify
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-[#1ED760] border border-emerald-800/60 font-semibold uppercase tracking-wider">
                Full
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Jutaan Musik Lengkap</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1">
          <button
            id="nav-btn-home"
            onClick={() => handleNavClick('home')}
            className={`flex items-center space-x-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              currentView === 'home' && !activePlaylistId
                ? 'bg-zinc-800/80 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Home className={`w-5 h-5 ${currentView === 'home' && !activePlaylistId ? 'text-[#1ED760]' : ''}`} />
            <span>Beranda</span>
          </button>

          <button
            id="nav-btn-search"
            onClick={() => handleNavClick('search')}
            className={`flex items-center space-x-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              currentView === 'search'
                ? 'bg-zinc-800/80 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Search className={`w-5 h-5 ${currentView === 'search' ? 'text-[#1ED760]' : ''}`} />
            <span>Cari</span>
          </button>
        </nav>
      </div>

      {/* Library Section */}
      <div className="bg-[#121212] rounded-xl flex-1 flex flex-col p-3 overflow-hidden">
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <button
            onClick={() => handleNavClick('library')}
            className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <Library className="w-5 h-5 text-zinc-400 group-hover:text-white" />
            <span className="font-bold text-sm tracking-wide">Koleksi Kamu</span>
          </button>
          <button
            id="create-playlist-btn"
            onClick={onOpenCreatePlaylist}
            title="Buat Playlist Baru"
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors hover:scale-110 active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Liked Songs Tile */}
        <div
          id="liked-songs-nav-tile"
          onClick={() => handleNavClick('liked')}
          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-150 group ${
            currentView === 'liked' ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-900/80 text-zinc-300'
          }`}
        >
          <div className="w-11 h-11 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 shadow text-emerald-400">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold truncate group-hover:text-white">Lagu yang Disukai</div>
            <div className="text-xs text-zinc-400 truncate flex items-center space-x-1">
              <span>{likedSongs.length} lagu tersimpan</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/80 my-2.5 mx-2" />

        {/* Scrollable Playlists List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1">
          {/* User Playlists */}
          {playlists.length > 0 && (
            <div className="mb-2">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold px-2 py-1 block">
                Playlist Buatanmu
              </span>
              {playlists.map((pl, idx) => {
                const isActive = currentView === 'playlist' && activePlaylistId === pl.id;
                return (
                  <div
                    key={`${pl.id}_${idx}`}
                    className={`flex items-center justify-between group p-2 rounded-lg cursor-pointer transition-colors ${
                      isActive ? 'bg-zinc-800/90 text-[#1ED760]' : 'hover:bg-zinc-900/80 text-zinc-300'
                    }`}
                  >
                    <div
                      onClick={() => handlePlaylistClick(pl.id)}
                      className="flex items-center space-x-3 overflow-hidden flex-1"
                    >
                      <div className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {pl.image ? (
                          <img src={pl.image} alt={pl.name} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{pl.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{pl.songs.length} lagu</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlaylist(pl.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                      title="Hapus playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Curated Official Playlists */}
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold px-2 py-1 block">
              Playlist Unggulan
            </span>
            {FEATURED_PLAYLISTS.map((pl, idx) => {
              const isActive = currentView === 'playlist' && activePlaylistId === pl.id;
              return (
                <div
                  key={`${pl.id}_${idx}`}
                  onClick={() => handlePlaylistClick(pl.id)}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors group ${
                    isActive ? 'bg-zinc-800/90 text-[#1ED760]' : 'hover:bg-zinc-900/80 text-zinc-300'
                  }`}
                >
                  <img
                    src={pl.image}
                    alt={pl.name}
                    className="w-9 h-9 rounded object-cover shrink-0 shadow"
                    loading="lazy"
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate group-hover:text-white">{pl.name}</p>
                    <p className="text-xs text-zinc-500 truncate">Spotify Curated</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Audio Info Badge */}
        <div className="pt-2 mt-auto border-t border-zinc-800/60 text-center">
          <div className="flex items-center justify-center space-x-2 text-[11px] text-zinc-400">
            <Radio className="w-3 h-3 text-[#1ED760]" />
            <span>Streaming Audio 320kbps</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
