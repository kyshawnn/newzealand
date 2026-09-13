import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackSrc,
  onError,
  onLoad,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src || '');
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setImgSrc(src || '');
    setHasError(!src);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-neutral-900 flex items-center justify-center ${containerClassName || 'w-full h-full'}`}>
      {!hasError && imgSrc ? (
        <img
          {...props}
          src={imgSrc}
          alt={alt}
          className={className}
          onLoad={(e) => {
            setHasError(false);
            if (onLoad) onLoad(e);
          }}
          onError={(e) => {
            if (fallbackSrc && imgSrc !== fallbackSrc) {
              setImgSrc(fallbackSrc);
            } else {
              setHasError(true);
            }
            if (onError) onError(e);
          }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white/30">
          <Music className="w-5 h-5 stroke-[1.75]" />
        </div>
      )}
    </div>
  );
};

