import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Menu, Sparkles } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

interface TopNavProps {
  onToggleMobileMenu: () => void;
  onSearchSubmit?: (query: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleMobileMenu, onSearchSubmit }) => {
  const { currentView, setCurrentView, searchQuery, setSearchQuery } = useMusic();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync searchQuery from context
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (currentView !== 'search') {
      setCurrentView('search');
    }
    setSearchQuery(val);
  };

  const handleClear = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (onSearchSubmit && localSearch.trim()) {
        onSearchSubmit(localSearch.trim());
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-3 border-b border-zinc-900 select-none">
      {/* Left: Mobile toggle & history navigation */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('home')}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
            title="Kembali"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentView('search')}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
            title="Maju"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Middle: Prominent Search Box */}
      <div className="flex-1 max-w-lg relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
          <input
            id="top-search-input"
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (currentView !== 'search') setCurrentView('search');
            }}
            placeholder="Mau dengarkan lagu apa hari ini? (Coldplay, Tulus, Taylor Swift...)"
            className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-sm text-white placeholder-zinc-400 pl-10 pr-9 py-2.5 rounded-full border border-transparent focus:border-zinc-500 focus:outline-none transition-all shadow-inner"
          />
          {localSearch && (
            <button
              onClick={handleClear}
              className="absolute right-3 text-zinc-400 hover:text-white p-0.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick shortcuts */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <button
          onClick={() => {
            setCurrentView('search');
            setSearchQuery('Lagu Mellow Indonesia');
          }}
          className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors border border-zinc-700/50"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#1ED760]" />
          <span>Mellow Indo</span>
        </button>
      </div>
    </header>
  );
};
