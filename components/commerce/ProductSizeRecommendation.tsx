"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

type Recommendation = { size: string; confidence: "medium" | "low"; fit: "regular" } | null;

export function ProductSizeRecommendation({ productId, locale }: { productId: string; locale: string }) {
  const t = useTranslations("ProductDetail");
  const [recommendation, setRecommendation] = useState<Recommendation>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const heightCm = useAuthStore((state) => state.user?.heightCm);
  const weightKg = useAuthStore((state) => state.user?.weightKg);

  useEffect(() => {
    let active = true;
    api.get(`/products/${encodeURIComponent(productId)}`)
      .then(({ data }) => {
        if (active && data?.sizeRecommendation?.size) setRecommendation(data.sizeRecommendation);
      })
      .catch(() => {
        // Size recommendation is an enhancement; never block the public product page.
      });
    return () => { active = false; };
  }, [productId, accessToken, heightCm, weightKg]);

  if (!recommendation) return null;
  const confidenceLabel = recommendation.confidence === "low"
    ? locale === "uz" ? "Taxminiy tavsiya" : locale === "en" ? "Approximate recommendation" : "Ориентировочная рекомендация"
    : null;

  return (
    <p className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-[var(--color-text)]" aria-live="polite">
      {t("recommendedSize", { size: recommendation.size })}{confidenceLabel ? <span className="ml-2 text-xs font-normal text-[var(--color-text-secondary)]">{confidenceLabel}</span> : null}
    </p>
  );
}
