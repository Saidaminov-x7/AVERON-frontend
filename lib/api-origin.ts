export function resolveApiOrigin(value: string, isLocalRuntime: boolean, fallback: string): string {
  const raw = value.trim() || fallback;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('API origin must be a valid absolute URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('API origin must be an HTTP(S) URL without credentials, query, or fragment');
  }
  if (!isLocalRuntime && parsed.protocol !== 'https:') {
    throw new Error('Production API origin must use HTTPS');
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}

export function isLocalApiHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname.toLowerCase());
}

export function resolveBrowserApiBaseUrl(hostname: string, localApiUrl: string): string {
  return isLocalApiHost(hostname) ? localApiUrl : '/api/backend';
}
