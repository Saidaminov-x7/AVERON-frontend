import { describe, expect, it } from 'vitest';
import { isLocalApiHost, resolveApiOrigin, resolveBrowserApiBaseUrl } from './api-origin';

describe('resolveApiOrigin', () => {
  it('requires HTTPS for production origins', () => {
    expect(() => resolveApiOrigin('http://api.example.test', false, 'https://fallback.test')).toThrow('Production API origin must use HTTPS');
    expect(resolveApiOrigin('https://api.example.test/v1/', false, 'https://fallback.test')).toBe('https://api.example.test/v1');
  });

  it('permits explicitly local HTTP origins and uses the fallback when unset', () => {
    expect(resolveApiOrigin('http://127.0.0.1:8080', true, 'https://fallback.test')).toBe('http://127.0.0.1:8080');
    expect(resolveApiOrigin('', false, 'https://fallback.test')).toBe('https://fallback.test');
  });

  it.each(['not-a-url', 'https://user:pass@api.example.test', 'https://api.example.test?token=secret', 'https://api.example.test#fragment'])('rejects malformed or credential-bearing origins: %s', (value) => {
    expect(() => resolveApiOrigin(value, false, 'https://fallback.test')).toThrow();
  });

  it.each(['localhost', '127.0.0.1', '::1', '[::1]'])('routes a local browser host to loopback instead of the production proxy: %s', (hostname) => {
    expect(isLocalApiHost(hostname)).toBe(true);
    expect(resolveBrowserApiBaseUrl(hostname, 'http://127.0.0.1:8080')).toBe('http://127.0.0.1:8080');
  });

  it('keeps non-local browser traffic on the same-origin backend proxy', () => {
    expect(resolveBrowserApiBaseUrl('shop.averon.uz', 'http://127.0.0.1:8080')).toBe('/api/backend');
  });
});
