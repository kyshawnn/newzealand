import Link from 'next/link';
import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-4xl font-bold mb-2">404</h2>
      <p className="text-white/60 mb-6">Halaman tidak ditemukan</p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
