"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/commerce/ProductCard";
import { CatalogAssistantError, loadCompleteTheLook } from "@/lib/catalog-assistant";
import { useCommerceCapabilities } from "./useCommerceCapabilities";

export function CompleteTheLook({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const t = useTranslations("catalog");
  const capabilities = useCommerceCapabilities();
  const [items, setItems] = useState<Awaited<ReturnType<typeof loadCompleteTheLook>>>([]);
  const [state, setState] = useState<"idle" | "loading" | "results" | "empty" | "error">("idle");

  if (!capabilities.completeTheLook) return null;

  async function findLook() {
    setState("loading");
    setItems([]);
    try {
      const result = await loadCompleteTheLook(slug);
      setItems(result);
      setState(result.length ? "results" : "empty");
    } catch (error) {
      setState(error instanceof CatalogAssistantError && error.code === "FEATURE_DISABLED" ? "empty" : "error");
    }
  }

  return (
    <section className="mt-12 border-t border-stone-200 pt-8 dark:border-white/10" aria-labelledby="complete-the-look-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="complete-the-look-title" className="text-2xl font-extrabold">{t("completeTheLookTitle")}</h2>
        <button type="button" onClick={() => void findLook()} disabled={state === "loading"} aria-busy={state === "loading"} className="min-h-11 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-wait disabled:opacity-60">
          {state === "loading" ? t("completeTheLookLoading") : t("completeTheLookAction")}
        </button>
      </div>
      {state === "loading" ? <p className="mt-4 text-sm text-stone-600 dark:text-stone-300" role="status">{t("completeTheLookLoading")}</p> : null}
      {state === "empty" ? <p className="mt-4 text-sm text-stone-600 dark:text-stone-300" role="status">{t("completeTheLookEmpty")}</p> : null}
      {state === "error" ? <p className="mt-4 text-sm text-red-700 dark:text-red-300" role="alert">{t("completeTheLookError")}</p> : null}
      {state === "results" ? (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" aria-live="polite">
          {items.map(({ role, product }) => <div key={`${role}-${product.id}`}><p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary-700 dark:text-primary-300">{role}</p><ProductCard product={product} locale={locale} /></div>)}
        </div>
      ) : null}
    </section>
  );
}
