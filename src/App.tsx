'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { BottomNav } from './components/BottomNav';
import { Player } from './components/Player';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { LikedSongsView } from './components/LikedSongsView';
import { PlaylistView } from './components/PlaylistView';
import { ArtistView } from './components/ArtistView';
import { TopIndonesiaView } from './components/TopIndonesiaView';
import { DevView } from './components/DevView';
import { GenreView } from './components/GenreView';
import { DownloadedView } from './components/DownloadedView';
import { HistoryModal } from './components/HistoryModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { DynamicBackground } from './components/DynamicBackground';

const MainApp: React.FC = () => {
  const { currentView, activePlaylistId } = useMusic();
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);

  const renderCurrentView = () => {
    if (activePlaylistId) {
      return <PlaylistView />;
    }

    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'top':
        return <TopIndonesiaView />;
      case 'genre':
        return <GenreView />;
      case 'downloaded':
        return <DownloadedView />;
      case 'library':
        return <LibraryView onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)} />;
      case 'liked':
        return <LikedSongsView />;
      case 'playlist':
        return <PlaylistView />;
      case 'artist':
        return <ArtistView />;
      case 'developer':
        return <DevView />;
      default:
        return <HomeView />;
    }
  };

  const currentKey = activePlaylistId ? `playlist_${activePlaylistId}` : currentView;

  return (
    <div className="h-[100dvh] h-screen w-full text-white flex flex-col font-sans antialiased relative selection:bg-white/20 overflow-hidden bg-[#0d0d0f]">
      {/* Dynamic Album Art / Dominant Color Light Background */}
      <DynamicBackground />

      {/* Main Content Area - Full vertical scrolling with smooth snappy page transitions */}
      <main
        id="main-content-scroll"
        className="relative z-10 flex-1 w-full overflow-y-auto overflow-x-hidden bg-transparent"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <motion.div
          key={currentKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="w-full min-h-full"
        >
          {renderCurrentView()}
        </motion.div>
      </main>

      {/* Floating Mini Player & Full-Screen Player Modal */}
      <Player />

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav />

      {/* Modal Dialogs */}
      <HistoryModal />
      <AddToPlaylistModal />
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainApp />
    </MusicProvider>
  );
}
