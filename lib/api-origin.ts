const PRODUCTION_API_FALLBACK = 'https://averon-backend-production.up.railway.app';
const LOCAL_API_DEFAULT = 'http://127.0.0.1:8080';

type ApiOriginEnvironment = {
  NODE_ENV?: string;
  VITEST?: string;
  JEST_WORKER_ID?: string;
  NEXT_PUBLIC_AVERON_RUNTIME_TARGET?: string;
  NEXT_PUBLIC_AVERON_LOCAL_API_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
};

export function resolveApiOrigin(environment: ApiOriginEnvironment): string {
  const isTestRunner = Boolean(environment.VITEST || environment.JEST_WORKER_ID);
  const isExplicitLocalTarget = environment.NEXT_PUBLIC_AVERON_RUNTIME_TARGET === 'local';
  if (
    environment.NODE_ENV !== 'development' &&
    environment.NODE_ENV !== 'test' &&
    !isTestRunner &&
    !isExplicitLocalTarget
  ) {
    return environment.NEXT_PUBLIC_API_URL || PRODUCTION_API_FALLBACK;
  }

  const configuredOrigin = environment.NEXT_PUBLIC_AVERON_LOCAL_API_URL || LOCAL_API_DEFAULT;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(configuredOrigin);
  } catch {
    throw new Error('NEXT_PUBLIC_AVERON_LOCAL_API_URL must be an HTTP loopback URL in development and test.');
  }

  const addressOctets = parsedOrigin.hostname.split('.');
  const ipv4Octets = addressOctets.map(Number);
  const isLoopbackIpv4 =
    ipv4Octets.length === 4 &&
    ipv4Octets.every((octet, index) =>
      /^\d{1,3}$/.test(addressOctets[index]) && octet >= 0 && octet <= 255,
    ) &&
    ipv4Octets[0] === 127;
  const isLoopbackHostname =
    parsedOrigin.hostname === 'localhost' || parsedOrigin.hostname === '[::1]' || isLoopbackIpv4;
  if (
    parsedOrigin.protocol !== 'http:' ||
    !isLoopbackHostname ||
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== '/' ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error('NEXT_PUBLIC_AVERON_LOCAL_API_URL must be an HTTP loopback URL in development and test.');
  }

  return parsedOrigin.origin;
}

export const externalBaseURL = resolveApiOrigin({
  NODE_ENV: process.env.NODE_ENV,
  VITEST: process.env.VITEST,
  JEST_WORKER_ID: process.env.JEST_WORKER_ID,
  NEXT_PUBLIC_AVERON_RUNTIME_TARGET: process.env.NEXT_PUBLIC_AVERON_RUNTIME_TARGET,
  NEXT_PUBLIC_AVERON_LOCAL_API_URL: process.env.NEXT_PUBLIC_AVERON_LOCAL_API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

export function isLocalApiHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname.toLowerCase());
}

export function resolveBrowserApiBaseUrl(hostname: string, localApiUrl: string): string {
  return isLocalApiHost(hostname) ? localApiUrl : '/api/backend';
}