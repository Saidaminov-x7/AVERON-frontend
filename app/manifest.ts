// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AVERON — одежда, обувь и аксессуары из Китая',
    short_name: 'AVERON',
    description: 'Каталог одежды, обуви и аксессуаров из Китая с проверкой товаров и доставкой по Узбекистану.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#7c3aed',
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
