"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function SiteViewportSettings() {
  const { data } = useSiteSettings();

  useEffect(() => {
    if (typeof data?.mobilePinchZoomEnabled !== "boolean") return;
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport) return;
    viewport.content = data.mobilePinchZoomEnabled
      ? "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover"
      : "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
  }, [data?.mobilePinchZoomEnabled]);

  return null;
}
