"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard, type StoreProduct } from "@/components/commerce/ProductCard";
import { loadSimilarProducts } from "@/lib/visual-search";
import { useCommerceCapabilities } from "./useCommerceCapabilities";

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

  useEffect(() => {
    if (!capabilities.similarProducts || !capabilities.imageEmbeddings) return;
    let active = true;
    void loadSimilarProducts(slug)
      .then((result) => {
        if (active) setProducts(result.items);
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, [capabilities.imageEmbeddings, capabilities.similarProducts, slug]);

  if (!capabilities.similarProducts || !capabilities.imageEmbeddings || !products.length) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-stone-200 pt-8 dark:border-white/10" aria-labelledby="similar-products-title">
      <h2 id="similar-products-title" className="text-2xl font-extrabold">
        {t("similarProductsTitle")}
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </section>
  );
}
