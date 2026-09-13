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

export const TrackRowsSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="space-y-1 border-t border-white/10 pt-4 animate-pulse">
      {Array.from({ length: count }).map((_, e) => (
        <div key={e} className="flex items-center gap-4 py-2 px-2">
          <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div
              className="h-4 bg-white/15 rounded-md"
              style={{ width: `${Math.min(85, 45 + ((e * 17) % 45))}%` }}
            />
            <div className="h-3 w-32 bg-white/10 rounded-md" />
          </div>
          <div className="w-5 h-5 bg-white/10 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const ArtistDetailSkeleton: React.FC<{ onBack?: () => void; artistName?: string }> = ({
  onBack,
  artistName,
}) => {
  return (
    <div className="pb-36 min-h-screen bg-[#111113] text-white select-none animate-in fade-in duration-200">
      {/* Immersive Artist Hero Backdrop Skeleton */}
      <div className="relative w-full h-[370px] sm:h-[430px] overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-neutral-900/70 to-black/60" />

        {/* Back Button */}
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

        {/* Artist Avatar Circle & Info Skeleton */}
        <div className="absolute bottom-6 left-0 right-0 px-5 sm:px-8 z-20 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/15 border-2 border-white/20 animate-pulse shrink-0 shadow-2xl" />
          <div className="space-y-2 flex-1 w-full">
            <div className="h-4 w-20 bg-white/10 rounded-full animate-pulse" />
            <div className="h-8 sm:h-10 w-56 sm:w-72 bg-white/25 rounded-2xl animate-pulse" />
            <div className="h-4 w-32 bg-white/15 rounded-lg animate-pulse" />
            <div className="flex items-center gap-3 pt-1">
              <div className="h-9 w-28 rounded-full bg-white/20 animate-pulse" />
              <div className="h-9 w-24 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Songs Section Skeleton */}
      <div className="px-4 pt-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-white/15 rounded-lg animate-pulse mb-3" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.03] animate-pulse"
              >
                <div className="w-5 text-center text-xs font-bold text-white/20">{idx}</div>
                <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 bg-white/15 rounded-md" style={{ width: `${60 + (idx * 7) % 30}%` }} />
                  <div className="h-3 w-28 bg-white/10 rounded-md" />
                </div>
                <div className="w-7 h-7 rounded-full bg-white/10 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Albums Horizontal Row Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="h-5 w-24 bg-white/15 rounded-lg animate-pulse" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[140px] shrink-0 space-y-2">
                <div className="w-[140px] h-[140px] rounded-2xl bg-white/10 animate-pulse" />
                <div className="h-3.5 w-24 bg-white/15 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const GenreViewSkeleton: React.FC = () => {
  return (
    <div className="px-4 py-5 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Section 1 Skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-48 bg-white/15 rounded-xl animate-pulse" />
        <div className="flex gap-3.5 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[140px] sm:w-[155px] shrink-0 space-y-2">
              <div className="w-[140px] sm:w-[155px] h-[140px] sm:h-[155px] rounded-2xl bg-white/10 animate-pulse" />
              <div className="h-3.5 w-28 bg-white/15 rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="h-6 w-40 bg-white/15 rounded-xl animate-pulse" />
        <div className="flex gap-3.5 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[140px] sm:w-[155px] shrink-0 space-y-2">
              <div className="w-[140px] sm:w-[155px] h-[140px] sm:h-[155px] rounded-2xl bg-white/10 animate-pulse" />
              <div className="h-3.5 w-28 bg-white/15 rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
