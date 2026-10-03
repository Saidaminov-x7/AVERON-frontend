'use client';

import { useState } from 'react';
import { ProductImage } from '@/components/commerce/ProductImage';

export interface ProductGalleryImage {
  id?: string;
  url: string;
  alt?: Record<string, string>;
}

interface ProductGalleryProps {
  images: ProductGalleryImage[];
  productTitle: string;
  locale: string;
  label: string;
  imageLabels: string[];
}

export function ProductGallery({
  images,
  productTitle,
  locale,
  label,
  imageLabels,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex];
  const selectedAlt = selectedImage?.alt?.[locale] ?? productTitle;

  if (images.length === 0) {
    return (
      <div
        role="img"
        aria-label={productTitle}
        className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-stone-100 text-stone-400 dark:bg-stone-800"
      >
        AVERON
      </div>
    );
  }

  return (
    <section aria-label={label} className="space-y-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-stone-100 shadow-sm dark:bg-stone-800">
        <ProductImage src={selectedImage.url} alt={selectedAlt} />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1" aria-label={label}>
          {images.map((image, index) => (
            <button
              key={image.id ?? `${image.url}-${index}`}
              type="button"
              aria-label={imageLabels[index] ?? `${label} ${index + 1}`}
              aria-pressed={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
              className={`group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 dark:bg-stone-800 dark:focus-visible:ring-offset-stone-950 ${
                index === selectedIndex ? 'border-stone-900 dark:border-white' : 'border-transparent'
              }`}
            >
              <ProductImage
                src={image.url}
                alt=""
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
