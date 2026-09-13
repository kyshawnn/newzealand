'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const App = dynamic(() => import('@/src/App'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-[#0d0d0f] flex items-center justify-center text-white/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <span className="text-xs font-medium tracking-wider text-white/40 uppercase">Memuat Shawnmusic...</span>
      </div>
    </div>
  ),
});

export default function ClientOnlyApp() {
  return <App />;
}
