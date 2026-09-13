'use client';

import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';

// Generate consistent, aesthetic color tones from song metadata (works 100% offline & without CORS)
function getColorFromMetadata(seed: string): { r: number; g: number; b: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  // Convert HSL (hue, 65% sat, 35% lightness) to RGB
  const s = 0.65;
  const l = 0.35;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) {
    r = c; g = x; b = 0;
  } else if (hue < 120) {
    r = x; g = c; b = 0;
  } else if (hue < 180) {
    r = 0; g = c; b = x;
  } else if (hue < 240) {
    r = 0; g = x; b = c;
  } else if (hue < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export const DynamicBackground: React.FC = () => {
  const { currentSong } = useMusic();

  const imageUrl =
    currentSong?.image ||
    (currentSong?.videoId
      ? `https://i.ytimg.com/vi/${currentSong.videoId}/hqdefault.jpg`
      : '');

  const seed = currentSong
    ? `${currentSong.title || ''} ${currentSong.artist || ''} ${currentSong.videoId || currentSong.id || ''}`
    : 'default home theme';

  // Dual-layer crossfade state for butter-smooth color transitions
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');
  const [colorA, setColorA] = useState<{ r: number; g: number; b: number }>(() =>
    getColorFromMetadata(seed)
  );
  const [colorB, setColorB] = useState<{ r: number; g: number; b: number }>(() =>
    getColorFromMetadata(seed)
  );

  const updateColor = (newColor: { r: number; g: number; b: number }) => {
    if (activeLayer === 'A') {
      setColorB(newColor);
      setActiveLayer('B');
    } else {
      setColorA(newColor);
      setActiveLayer('A');
    }
  };

  // Update whenever current song changes
  useEffect(() => {
    if (!currentSong) {
      updateColor({ r: 40, g: 35, b: 60 });
      return;
    }

    // 1. Instantly set vibrant color from song title/artist
    const initialColor = getColorFromMetadata(seed);
    updateColor(initialColor);

    // 2. If image is available, attempt to extract authentic dominant pixel color as refinement
    if (!imageUrl) return;

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 16;
        canvas.height = 16;
        ctx.drawImage(img, 0, 0, 16, 16);

        const imgData = ctx.getImageData(0, 0, 16, 16).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        let maxSat = 0;
        let bestR = initialColor.r, bestG = initialColor.g, bestB = initialColor.b;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a > 128) {
            rSum += r;
            gSum += g;
            bSum += b;
            count++;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;

            if (sat > maxSat && max > 40 && min < 225) {
              maxSat = sat;
              bestR = r;
              bestG = g;
              bestB = b;
            }
          }
        }

        if (count > 0 && isMounted) {
          const r = maxSat > 0.12 ? bestR : Math.round(rSum / count);
          const g = maxSat > 0.12 ? bestG : Math.round(gSum / count);
          const b = maxSat > 0.12 ? bestB : Math.round(bSum / count);
          updateColor({ r, g, b });
        }
      } catch {
        // Fallback already active
      }
    };

    img.src = imageUrl;

    return () => {
      isMounted = false;
    };
  }, [currentSong?.videoId, currentSong?.id, currentSong?.title, imageUrl, seed]);

  return (
    <div
      aria-hidden="true"
      id="dynamic-ambient-background"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0d0d0f]"
    >
      {/* Layer A */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out will-change-opacity"
        style={{
          opacity: activeLayer === 'A' ? 1 : 0,
          backgroundImage: `radial-gradient(ellipse 120% 75% at 50% 0%, rgba(${colorA.r}, ${colorA.g}, ${colorA.b}, 0.55) 0%, rgba(${colorA.r}, ${colorA.g}, ${colorA.b}, 0.22) 40%, rgba(13, 13, 15, 0.90) 75%, #0d0d0f 100%)`,
        }}
      />
      {/* Layer B */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out will-change-opacity"
        style={{
          opacity: activeLayer === 'B' ? 1 : 0,
          backgroundImage: `radial-gradient(ellipse 120% 75% at 50% 0%, rgba(${colorB.r}, ${colorB.g}, ${colorB.b}, 0.55) 0%, rgba(${colorB.r}, ${colorB.g}, ${colorB.b}, 0.22) 40%, rgba(13, 13, 15, 0.90) 75%, #0d0d0f 100%)`,
        }}
      />
    </div>
  );
};


