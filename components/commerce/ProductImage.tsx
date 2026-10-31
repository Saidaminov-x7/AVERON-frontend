'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { canOptimizeProductImage, resolveProductAssetUrl } from '@/lib/product-images';

export function ProductImage({
  src,
  alt,
  fit = 'contain',
  zoomOnHover = true,
  sizes = '100vw',
  priority = false,
  onLoad,
  onError,
}: {
  src?: string;
  alt: string;
  fit?: 'contain' | 'cover';
  zoomOnHover?: boolean;
  sizes?: string;
  priority?: boolean;
  onLoad?: (naturalWidth: number, naturalHeight: number) => void;
  onError?: () => void;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = src ? resolveProductAssetUrl(src) : undefined;
  const failed = Boolean(resolvedSrc && failedSrc === resolvedSrc);

  if (!resolvedSrc || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink">
        <ImageOff size={24} aria-hidden="true" />
        <span className="text-xs font-semibold tracking-[0.16em]">AVERON</span>
      </div>
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      unoptimized={!canOptimizeProductImage(resolvedSrc)}
      onError={() => {
        setFailedSrc(resolvedSrc);
        onError?.();
      }}
      onLoad={(event) => onLoad?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
      className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${zoomOnHover ? 'transition-transform duration-300 ease-out group-hover:scale-[1.03]' : ''}`}
    />
  );
}
