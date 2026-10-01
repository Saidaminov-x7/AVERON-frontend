"use client";

import { useEffect, useState } from "react";
import {
  loadCommerceCapabilities,
  NO_COMMERCE_CAPABILITIES,
} from "@/lib/visual-search";

export function useCommerceCapabilities() {
  const [capabilities, setCapabilities] = useState(NO_COMMERCE_CAPABILITIES);

  useEffect(() => {
    let active = true;
    void loadCommerceCapabilities().then((result) => {
      if (active) setCapabilities(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return capabilities;
}
