'use client';

import { useEffect } from 'react';
import { getSafeErrorReportPath } from '@/lib/safe-error-report';
import { resolveBrowserApiBaseUrl } from '@/lib/api-origin';

const REPORTED_ERROR_TTL_MS = 60_000;
const MAX_REPORTED_ERRORS = 200;
const reportedErrors = new Map<string, number>();

function shouldReport(message: string, stack?: string) {
  const now = Date.now();
  for (const [fingerprint, expiresAt] of reportedErrors) {
    if (expiresAt <= now) reportedErrors.delete(fingerprint);
  }

  const firstFrame = stack?.split('\n').find((line) => line.trim())?.trim() ?? '';
  const pathname = window.location.pathname;
  const fingerprint = `${message}\n${pathname}\n${firstFrame}`;
  if ((reportedErrors.get(fingerprint) ?? 0) > now) return false;

  if (reportedErrors.size >= MAX_REPORTED_ERRORS) {
    const oldest = reportedErrors.keys().next().value;
    if (oldest) reportedErrors.delete(oldest);
  }
  reportedErrors.set(fingerprint, now + REPORTED_ERROR_TTL_MS);
  return true;
}

export function GlobalErrorListener() {
  useEffect(() => {
    const reportUrl = `${resolveBrowserApiBaseUrl(window.location.hostname, localApiUrl())}/error-reports`;

    const sendReport = (payload: { message: string; stack?: string; severity?: string }) => {
      if (!shouldReport(payload.message, payload.stack)) return;
      try {
        fetch(reportUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Client-side application error',
            stack: '',
            url: getSafeErrorReportPath(),
            severity: payload.severity || 'error',
          }),
        }).catch(() => {});
      } catch {
        // silent
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      // Ignore trivial script load or third-party extension errors
      if (event.filename && !event.filename.includes(window.location.host)) return;
      sendReport({
        message: event.message || 'Window error',
        stack: event.error?.stack,
        severity: 'error',
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message || 'Unhandled Promise Rejection';
      const stack = typeof reason === 'object' && reason !== null && 'stack' in reason
        ? String(reason.stack)
        : undefined;
      if (stack?.includes('chrome-extension://') || stack?.includes('moz-extension://')) return;
      sendReport({
        message: msg,
        stack,
        severity: 'warning',
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

function localApiUrl() {
  return process.env.NEXT_PUBLIC_AVERON_LOCAL_API_URL || 'http://127.0.0.1:8080';
}
