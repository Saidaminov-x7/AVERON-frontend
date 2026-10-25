import { hasAnalyticsConsent } from './consent';

const ANALYTICS_HOSTNAMES = new Set(['averon.uz']);

export function isProductionAnalyticsEnabled(
  hostname: string,
  nodeEnvironment: string | undefined,
  isTestRunner = false,
  runtimeTarget: string | undefined = undefined,
) {
  return !isTestRunner
    && nodeEnvironment === 'production'
    && runtimeTarget !== 'local'
    && ANALYTICS_HOSTNAMES.has(hostname.toLowerCase());
}

export function canSendAnalytics() {
  const isTestRunner = typeof process !== 'undefined'
    && (process.env.VITEST === 'true' || Boolean(process.env.JEST_WORKER_ID));
  return typeof window !== 'undefined'
    && hasAnalyticsConsent()
    && isProductionAnalyticsEnabled(
      window.location.hostname,
      process.env.NODE_ENV,
      isTestRunner,
      process.env.NEXT_PUBLIC_AVERON_RUNTIME_TARGET,
    );
}

export function canSendOptionalAnalytics() {
  return canSendAnalytics();
}
