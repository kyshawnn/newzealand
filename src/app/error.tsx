'use client';

import React from 'react';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold mb-2">Terjadi kesalahan</h2>
      <p className="text-white/60 mb-6">Silakan coba beberapa saat lagi</p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition"
      >
        Coba Lagi
      </button>
    </div>
  );
}
