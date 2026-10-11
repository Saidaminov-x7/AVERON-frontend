"use client";

import { useEffect } from "react";
export function SiteViewportSettings() {
  useEffect(() => {
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport) return;
    viewport.content = "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover";
  }, []);

  return null;
}
