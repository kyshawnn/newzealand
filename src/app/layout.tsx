import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0d0d0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Shawnmusic',
  description:
    'Aplikasi streaming musik modern tanpa iklan dengan koleksi lagu populer Indonesia & global lengkap dengan lirik dan pemutaran audio berkualitas tinggi.',
  openGraph: {
    title: 'Shawnmusic',
    description:
      'Aplikasi streaming musik modern tanpa iklan dengan koleksi lagu populer Indonesia & global lengkap dengan lirik dan pemutaran audio berkualitas tinggi.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#0d0d0f] text-white antialiased font-sans m-0 p-0 overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
