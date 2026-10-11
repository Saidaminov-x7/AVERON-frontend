'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

type Recommendation = { size: string; confidence: 'medium' | 'low'; fit: 'regular' };
type ProductResponse = { sizeRecommendation?: Recommendation | null };

export function ProductSizeRecommendation({ productId }: { productId: string }) {
  const t = useTranslations('productDetail');
  const [result, setResult] = useState<{ key: string; recommendation: Recommendation | null } | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const heightCm = useAuthStore((state) => state.user?.heightCm);
  const weightKg = useAuthStore((state) => state.user?.weightKg);
  const profileKey = accessToken && heightCm && weightKg ? `${productId}:${heightCm}:${weightKg}` : null;

  useEffect(() => {
    if (!profileKey) return;
    let active = true;

    api.get<ProductResponse>(`/products/${encodeURIComponent(productId)}`)
      .then(({ data }) => {
        if (active) setResult({ key: profileKey, recommendation: data.sizeRecommendation ?? null });
      })
      .catch(() => {
        // Size guidance is optional and must never block the product page.
        if (active) setResult({ key: profileKey, recommendation: null });
      });

    return () => { active = false; };
  }, [productId, profileKey]);

  const recommendation = result?.key === profileKey ? result.recommendation : null;
  if (!recommendation) return null;

  return (
    <p className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-[var(--color-text)]" aria-live="polite">
      {t('recommendedSize', { size: recommendation.size })}
      {recommendation.confidence === 'low' ? <span className="ml-2 text-xs font-normal text-[var(--color-text-secondary)]">{t('approximateRecommendation')}</span> : null}
    </p>
  );
}
