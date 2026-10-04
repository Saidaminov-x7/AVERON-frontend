"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/commerce/ProductCard";
import { clearRecentlyViewed, loadProductRecommendations, loadRecentlyViewed, recordProductView, type Recommendation } from "@/lib/recommendations";
import type { StoreProduct } from "@/lib/products";
import { useCommerceCapabilities } from "./useCommerceCapabilities";

type Sections = {
  related: StoreProduct[];
  recent: StoreProduct[];
  personalized: StoreProduct[];
};

function reportOptionalFailure(section: string, error: unknown) {
  console.warn(`Recommendation section unavailable: ${section}`, error instanceof Error ? error.name : "UnknownError");
}

export function ProductRecommendations({ slug, locale }: { slug: string; locale: string }) {
  const t = useTranslations("catalog");
  const capabilities = useCommerceCapabilities();
  const [sections, setSections] = useState<Sections>({
    related: [],
    recent: [],
    personalized: [],
  });
  const [historyClearFailed, setHistoryClearFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (
        !capabilities.recommendations &&
        !capabilities.personalizedRecommendations &&
        !capabilities.recentlyViewed
      ) return;
      if (capabilities.recentlyViewed) {
        await recordProductView(slug).catch((error: unknown) => reportOptionalFailure("view tracking", error));
      }
      const [related, recent, personalized] = await Promise.all([
        capabilities.recommendations
          ? loadProductRecommendations(slug, "related").catch((error: unknown) => {
            reportOptionalFailure("related products", error);
            return null;
          })
          : Promise.resolve(null),
        capabilities.recentlyViewed
          ? loadRecentlyViewed(slug).catch((error: unknown) => {
            reportOptionalFailure("recent history", error);
            return [];
          })
          : Promise.resolve([]),
        capabilities.personalizedRecommendations
          ? loadProductRecommendations(slug, "personalized").catch((error: unknown) => {
            reportOptionalFailure("personalized products", error);
            return null;
          })
          : Promise.resolve(null),
      ]);
      if (!active) return;
      const seen = new Set<string>([slug]);
      const unique = (items: Recommendation[] | undefined) => (items ?? []).flatMap(({ product }) => {
        if (seen.has(product.id)) return [];
        seen.add(product.id);
        return [product];
      });
      const relatedProducts = unique(related?.items);
      const personalizedProducts = personalized?.meta?.personalized
        ? unique(personalized.items)
        : [];
      const recentProducts = unique(recent);
      setSections({
        related: relatedProducts,
        recent: recentProducts,
        personalized: personalizedProducts,
      });
    };
    void load();
    return () => {
      active = false;
    };
  }, [
    capabilities.personalizedRecommendations,
    capabilities.recentlyViewed,
    capabilities.recommendations,
    slug,
  ]);

  const rows: Array<[keyof Sections, string]> = [
    ["related", "relatedProductsTitle"],
    ["personalized", "personalizedProductsTitle"],
    ["recent", "recentlyViewedTitle"],
  ];
  async function clearHistory() {
    setHistoryClearFailed(false);
    try {
      await clearRecentlyViewed();
      setSections((current) => ({ ...current, recent: [] }));
    } catch (error) {
      reportOptionalFailure("clear recent history", error);
      setHistoryClearFailed(true);
    }
  }

  return (
    <>
      {rows.map(([key, titleKey]) => sections[key].length ? (
        <section key={key} className="mt-12 border-t border-stone-200 pt-8 dark:border-white/10" aria-labelledby={`${key}-recommendations-title`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id={`${key}-recommendations-title`} className="text-2xl font-extrabold">{t(titleKey)}</h2>
            {key === "recent" ? (
              <button type="button" onClick={() => void clearHistory()} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-stone-600 underline-offset-4 hover:underline dark:text-stone-300">
                {t("recentlyViewedClear")}
              </button>
            ) : null}
          </div>
          {key === "recent" && historyClearFailed ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">{t("recentlyViewedClearError")}</p>
          ) : null}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {sections[key].map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
          </div>
        </section>
      ) : null)}
    </>
  );
}
