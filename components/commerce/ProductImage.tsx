'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export function ProductImage({
  src,
  alt,
  fit = 'contain',
  coverCrop,
  zoomOnHover = true,
  onLoad,
  onError,
}: {
  src?: string;
  alt: string;
  fit?: 'contain' | 'cover';
  coverCrop?: { x: number; y: number; zoom: number } | null;
  zoomOnHover?: boolean;
  onLoad?: (naturalWidth: number, naturalHeight: number) => void;
  onError?: () => void;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src && failedSrc === src);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-text-secondary)]">
        <ImageOff size={24} aria-hidden="true" />
        <span aria-hidden="true" className="text-xs font-semibold tracking-[0.16em]">AVERON</span>
      </div>
    );
  }

  return (
    // Native img supports supplier/CDN hosts; failed URLs get a stable fallback.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        setFailedSrc(src ?? null);
        onError?.();
      }}
      onLoad={(event) => onLoad?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
      className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${zoomOnHover ? 'transition-transform duration-300 ease-out group-hover:scale-[1.03]' : ''}`}
      style={coverCrop ? { objectPosition: `${coverCrop.x}% ${coverCrop.y}%`, transform: `scale(${coverCrop.zoom})`, transformOrigin: `${coverCrop.x}% ${coverCrop.y}%` } : undefined}
    />
  );
}
