import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PlaylistSkeletonProps {
  onBack?: () => void;
  title?: string;
}

export const PlaylistDetailSkeleton: React.FC<PlaylistSkeletonProps> = ({ onBack, title }) => {
  return (
    <div className="pb-36 min-h-screen bg-transparent text-white select-none animate-in fade-in duration-200">
      {/* Hero Banner Skeleton */}
      <div className="relative w-full h-[370px] sm:h-[430px] overflow-hidden bg-neutral-900/90">
        <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-neutral-900/60 to-black/50" />

        {/* Floating Top Navigation */}
        <div className="absolute top-4 left-0 right-0 px-4 sm:px-6 flex items-center justify-between z-20">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
        </div>

        {/* Shimmer pulse in banner */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-white/5 animate-ping opacity-20" />
        </div>

        {/* Bottom Hero Info Skeleton */}
        <div className="absolute bottom-4 left-0 right-0 px-5 sm:px-8 z-20 space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 rounded-full bg-white/15 animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
          </div>

          {/* Title */}
          <div className="h-9 sm:h-12 w-3/4 max-w-md bg-white/20 rounded-2xl animate-pulse" />

          {/* Subtitle / Description */}
          <div className="h-4 w-1/2 max-w-xs bg-white/10 rounded-lg animate-pulse" />

          {/* Buttons Row */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-10 w-32 rounded-full bg-white/25 animate-pulse" />
            <div className="h-10 w-24 rounded-full bg-white/15 animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-emerald-500/40 animate-pulse ml-auto" />
          </div>
        </div>
      </div>

      {/* Tracklist Listing Skeleton */}
      <div className="px-4 pt-6 max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
        </div>

        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.03] animate-pulse"
            >
              <div className="w-6 text-center text-xs font-bold text-white/20">
                {i}
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div
                  className="h-4 bg-white/15 rounded-md"
                  style={{ width: `${Math.min(90, 45 + (i * 13) % 45)}%` }}
                />
                <div className="h-3 w-28 bg-white/10 rounded-md" />
              </div>
              <div className="h-3 w-8 bg-white/10 rounded hidden sm:block" />
              <div className="w-7 h-7 rounded-full bg-white/10 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TrackRowsSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="space-y-1.5 animate-in fade-in duration-200">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.03] animate-pulse"
        >
          <div className="w-12 h-12 rounded-[16px] bg-white/10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div
              className="h-4 bg-white/15 rounded-md"
              style={{ width: `${Math.min(90, 40 + (i * 15) % 50)}%` }}
            />
            <div className="h-3 w-32 bg-white/10 rounded-md" />
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 shrink-0" />
        </div>
      ))}
    </div>
  );
};
