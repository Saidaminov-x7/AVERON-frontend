"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/commerce/ProductCard";
import { formatUzs } from "@/lib/price";
import { CatalogAssistantError, requestStyleOutfit, type OutfitResult } from "@/lib/catalog-assistant";

function suggestions(locale: string) {
  if (locale === "uz") return [
    "Kuz uchun obraz",
    "Universitetga casual obraz",
    "Minimalist qora-oq obraz",
    "1 000 000 so‘mgacha obraz",
  ];
  if (locale === "en") return [
    "An outfit for autumn",
    "Casual outfit for university",
    "Minimalist black-and-white look",
    "Outfit under 1,000,000 UZS",
  ];
  return [
    "Образ на осень",
    "Casual-образ в университет",
    "Минималистичный чёрно-белый образ",
    "Образ до 1 000 000 сум",
  ];
}

export function StyleAssistant({
  locale,
  enabled,
}: {
  locale: string;
  enabled: boolean;
}) {
  const t = useTranslations("catalog");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<OutfitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [disabled, setDisabled] = useState(false);

  if (!enabled) return null;

  async function suggest(value = prompt) {
    if (!value.trim()) return;
    setPrompt(value);
    setLoading(true);
    setError(false);
    setDisabled(false);
    try {
      const response = await requestStyleOutfit(value, locale === "uz" || locale === "en" ? locale : "ru");
      setResult(response);
    } catch (caught) {
      setError(!(caught instanceof CatalogAssistantError && caught.code === "FEATURE_DISABLED"));
      setDisabled(caught instanceof CatalogAssistantError && caught.code === "FEATURE_DISABLED");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void suggest();
  }

  return (
    <section className="mt-6 rounded-2xl border border-stone-200 bg-stone-950 p-5 text-white shadow-sm dark:border-white/10" aria-labelledby="averon-style-assistant-title">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-300">AVERON</p>
      <h2 id="averon-style-assistant-title" className="mt-2 text-xl font-extrabold">{t("styleAssistantTitle")}</h2>
      <p className="mt-1 text-sm text-stone-300">{t("styleAssistantIntro")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions(locale).map((value) => (
          <button key={value} type="button" onClick={() => void suggest(value)} disabled={loading} className="min-h-10 rounded-full border border-white/20 px-3 text-xs font-semibold transition hover:border-primary-300 hover:text-primary-200 disabled:opacity-50">
            {value}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <textarea
          className="min-h-20 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-stone-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-300/20"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("styleAssistantPlaceholder")}
          maxLength={500}
          aria-label={t("styleAssistantTitle")}
        />
        <button type="submit" disabled={loading || !prompt.trim()} aria-busy={loading} className="min-h-11 self-end rounded-xl bg-primary-600 px-5 text-sm font-bold text-white transition hover:bg-primary-500 disabled:cursor-wait disabled:opacity-60">
          {loading ? t("styleAssistantLoading") : t("styleAssistantSubmit")}
        </button>
      </form>
      {loading ? <p className="mt-4 text-sm text-stone-300" role="status" aria-live="polite">{t("styleAssistantLoading")}</p> : null}
      {disabled ? <p className="mt-4 text-sm text-amber-300" role="status">{t("styleAssistantError")}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-300" role="alert">{t("styleAssistantError")}</p> : null}
      {result?.meta.fallbackUsed ? <p className="mt-4 text-sm text-amber-300" role="status">{t("styleAssistantFallback")}</p> : null}
      {result && !result.complete ? <p className="mt-4 text-sm text-amber-200" role="status">{t("styleAssistantPartial")}</p> : null}
      {result && result.items.length === 0 ? (
        <p className="mt-4 text-sm text-stone-300" role="status">
          {result.withinBudget ? t("styleAssistantEmpty") : t("styleAssistantBudgetEmpty")}
        </p>
      ) : null}
      {result && result.items.length > 0 ? (
        <>
          <p className="mt-4 text-sm text-stone-300">{result.explanation}</p>
          <p className="mt-3 text-sm font-bold">{t("styleAssistantTotal")}: {formatUzs(result.totalPriceUzs, locale)}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" aria-live="polite">
            {result.items.map(({ product }) => <ProductCard key={product.id} product={product} locale={locale} />)}
          </div>
        </>
      ) : null}
    </section>
  );
}
