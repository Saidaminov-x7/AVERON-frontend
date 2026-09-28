'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-stone-400">
        <ImageOff size={24} aria-hidden="true" />
        <span className="text-xs font-semibold tracking-[0.16em]">AVERON</span>
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
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
    />
  );
}
