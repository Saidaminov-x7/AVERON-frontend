import { externalBaseURL } from './axios';

/** Match the existing Next Image remotePatterns; unknown suppliers stay direct. */
export function canOptimizeProductImage(src: string) {
  if (src.startsWith('/') && !src.startsWith('//')) return true;

  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' || url.port) return false;
    return url.hostname === 'averon.uz'
      || url.hostname === 'images.unsplash.com'
      || url.hostname === 'res.cloudinary.com'
      || url.hostname.endsWith('.cloudinary.com');
  } catch {
    return false;
  }
}

/** Keep backend uploads same-origin so the existing rewrite can serve them safely. */
export function resolveProductAssetUrl(url: string, apiBaseUrl = externalBaseURL) {
  if (url.startsWith('/api/backend/')) return url;
  if (url.startsWith('/uploads/') && !url.startsWith('//')) {
    return `/api/backend${url}`;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const assetUrl = new URL(url);
      const apiUrl = new URL(apiBaseUrl);
      if (assetUrl.origin === apiUrl.origin && assetUrl.pathname.startsWith('/uploads/')) {
        return `/api/backend${assetUrl.pathname}${assetUrl.search}`;
      }
    } catch {
      return url;
    }
  }
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  try {
    return new URL(url, apiBaseUrl).toString();
  } catch {
    return url;
  }
}
