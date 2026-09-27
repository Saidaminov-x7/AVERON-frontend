// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AVERON — товары из Китая в Узбекистан',
    short_name: 'AVERON',
    description: 'Одежда и товары из Китая с доставкой по Узбекистану.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#151812',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
