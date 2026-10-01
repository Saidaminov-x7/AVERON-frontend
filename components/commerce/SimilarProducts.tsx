"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard, type StoreProduct } from "@/components/commerce/ProductCard";
import { CommerceApiError, loadSimilarProducts } from "@/lib/visual-search";
import { useCommerceCapabilities } from "./useCommerceCapabilities";

type SearchState = "idle" | "loading" | "results" | "empty" | "unavailable" | "error";

export function SimilarProducts({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const t = useTranslations("catalog");
  const capabilities = useCommerceCapabilities();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [state, setState] = useState<SearchState>("idle");

  if (!capabilities.similarProducts || !capabilities.imageEmbeddings) return null;

  async function findSimilar() {
    setState("loading");
    setProducts([]);
    try {
      const result = await loadSimilarProducts(slug);
      setProducts(result.items);
      setState(result.code === "EMBEDDING_NOT_AVAILABLE" ? "unavailable" : result.items.length ? "results" : "empty");
    } catch (error) {
      setState(error instanceof CommerceApiError && error.code === "EMBEDDING_NOT_AVAILABLE" ? "unavailable" : "error");
    }
  }

  return (
    <section className="mt-12 border-t border-stone-200 pt-8 dark:border-white/10" aria-labelledby="similar-products-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="similar-products-title" className="text-2xl font-extrabold">
          {t("similarProductsTitle")}
        </h2>
        <button
          type="button"
          onClick={() => void findSimilar()}
          disabled={state === "loading"}
          aria-busy={state === "loading"}
          className="min-h-11 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-wait disabled:opacity-60"
        >
          {state === "loading"
            ? t("similarProductsLoading")
            : state === "error"
              ? t("similarProductsRetry")
              : t("similarProductsAction")}
        </button>
      </div>

      {state === "loading" && (
        <p className="mt-4 text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
          {t("similarProductsLoading")}
        </p>
      )}
      {state === "empty" && (
        <p className="mt-4 text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
          {t("similarProductsEmpty")}
        </p>
      )}
      {state === "unavailable" && (
        <p className="mt-4 text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
          {t("similarProductsUnavailable")}
        </p>
      )}
      {state === "error" && (
        <p className="mt-4 text-sm text-red-700 dark:text-red-300" role="alert">
          {t("similarProductsError")}
        </p>
      )}
      {state === "results" && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" aria-live="polite">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
