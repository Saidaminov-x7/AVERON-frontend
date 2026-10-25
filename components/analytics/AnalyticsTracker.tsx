"use client";

import { useOptionalAnalytics } from '@/hooks/useOptionalAnalytics';

export function AnalyticsTracker() {
  useOptionalAnalytics();
  return null;
}
