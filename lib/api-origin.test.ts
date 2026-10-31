import { describe, expect, it } from 'vitest';
import { resolveApiOrigin } from './api-origin';

describe('resolveApiOrigin', () => {
  it.each(['development', 'test'])('ignores a production API override in %s', (NODE_ENV) => {
    expect(
      resolveApiOrigin({
        NODE_ENV,
        NEXT_PUBLIC_API_URL: 'https://averon-backend-production.up.railway.app',
      }),
    ).toBe('http://127.0.0.1:8080');
  });

  it('isolates a test runner even when NODE_ENV is production', () => {
    expect(
      resolveApiOrigin({
        NODE_ENV: 'production',
        VITEST: 'true',
        NEXT_PUBLIC_API_URL: 'https://averon-backend-production.up.railway.app',
      }),
    ).toBe('http://127.0.0.1:8080');
  });

  it('isolates an explicit local production preview', () => {
    expect(
      resolveApiOrigin({
        NODE_ENV: 'production',
        NEXT_PUBLIC_AVERON_RUNTIME_TARGET: 'local',
        NEXT_PUBLIC_API_URL: 'https://averon-backend-production.up.railway.app',
      }),
    ).toBe('http://127.0.0.1:8080');
  });

  it('accepts a configured loopback API URL', () => {
    expect(
      resolveApiOrigin({ NODE_ENV: 'development', NEXT_PUBLIC_AVERON_LOCAL_API_URL: 'http://localhost:9090' }),
    ).toBe('http://localhost:9090');
  });

  it('accepts 127.0.0.1 and rejects out-of-range 127/8 octets', () => {
    expect(resolveApiOrigin({ NODE_ENV: 'development', NEXT_PUBLIC_AVERON_LOCAL_API_URL: 'http://127.0.0.1:8080' }))
      .toBe('http://127.0.0.1:8080');
    expect(() =>
      resolveApiOrigin({
        NODE_ENV: 'development',
        NEXT_PUBLIC_AVERON_LOCAL_API_URL: 'http://127.999.1.1:8080',
      }),
    ).toThrow('NEXT_PUBLIC_AVERON_LOCAL_API_URL must be an HTTP loopback URL');
  });

  it.each([
    'https://averon-backend-production.up.railway.app',
    'http://192.168.1.10:8080',
    'http://127.0.0.1:8080/path',
    'http://user:password@127.0.0.1:8080',
    'not a url',
  ])('fails closed for invalid local API override %s', (NEXT_PUBLIC_AVERON_LOCAL_API_URL) => {
    expect(() => resolveApiOrigin({ NODE_ENV: 'test', NEXT_PUBLIC_AVERON_LOCAL_API_URL })).toThrow(
      'NEXT_PUBLIC_AVERON_LOCAL_API_URL must be an HTTP loopback URL',
    );
  });

  it('preserves configured production API origin', () => {
    expect(
      resolveApiOrigin({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.averon.example',
      }),
    ).toBe('https://api.averon.example');
  });

  it('uses the existing production fallback outside development and test', () => {
    expect(resolveApiOrigin({ NODE_ENV: 'production' })).toBe(
      'https://averon-backend-production.up.railway.app',
    );
  });
});
