import { externalBaseURL } from './axios';

/** Resolve backend-hosted relative image paths without changing absolute CDN URLs. */
export function resolveProductAssetUrl(url: string, apiBaseUrl = externalBaseURL) {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  try {
    return new URL(url, apiBaseUrl).toString();
  } catch {
    return url;
  }
}
