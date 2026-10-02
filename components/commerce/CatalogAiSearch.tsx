"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/commerce/ProductCard";
import {
  CatalogAssistantError,
  searchCatalogWithIntent,
  type AiSearchResult,
  type SearchOverrides,
} from "@/lib/catalog-assistant";

type Chip = {
  label: string;
  field: keyof SearchOverrides;
  value?: string;
};

function intentChips(intent: Record<string, unknown>, locale: string): Chip[] {
  const chips: Chip[] = [];
  for (const field of ["category", "gender"] as const) {
    if (typeof intent[field] === "string") chips.push({ field, label: intent[field] as string });
  }
  for (const field of ["colors", "sizes"] as const) {
    if (Array.isArray(intent[field])) {
      for (const value of intent[field] as unknown[]) {
        if (typeof value === "string") chips.push({ field, value, label: value });
      }
    }
  }
  for (const field of ["minPrice", "maxPrice"] as const) {
    if (typeof intent[field] === "number") {
      const amount = (intent[field] as number).toLocaleString(locale === "en" ? "en-US" : locale === "uz" ? "uz-UZ" : "ru-RU");
      chips.push({ field, label: `${field === "minPrice" ? "≥" : "≤"} ${amount} UZS` });
    }
  }
  return chips;
}

export function CatalogAiSearch({
  locale,
  enabled,
  providerConfigured,
}: {
  locale: string;
  enabled: boolean;
  providerConfigured: boolean;
}) {
  const t = useTranslations("catalog");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AiSearchResult | null>(null);
  const [overrides, setOverrides] = useState<SearchOverrides>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [disabled, setDisabled] = useState(false);

  if (!enabled) return null;

  async function search(nextQuery = query, nextOverrides = overrides) {
    if (!nextQuery.trim()) return;
    setLoading(true);
    setError(false);
    setDisabled(false);
    try {
      const response = await searchCatalogWithIntent(
        nextQuery,
        locale === "uz" || locale === "en" ? locale : "ru",
        nextOverrides,
      );
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
    setOverrides(undefined);
    void search(query, undefined);
  }

  function removeChip(chip: Chip) {
    if (!result) return;
    const next: SearchOverrides = {
      category: typeof result.intent.category === "string" ? result.intent.category : null,
      gender: result.intent.gender === "men" || result.intent.gender === "women" || result.intent.gender === "kids"
        ? result.intent.gender
        : null,
      colors: Array.isArray(result.intent.colors) ? result.intent.colors.filter((value): value is string => typeof value === "string" && value !== chip.value) : [],
      sizes: Array.isArray(result.intent.sizes) ? result.intent.sizes.filter((value): value is string => typeof value === "string" && value !== chip.value) : [],
      minPrice: typeof result.intent.minPrice === "number" ? result.intent.minPrice : null,
      maxPrice: typeof result.intent.maxPrice === "number" ? result.intent.maxPrice : null,
    };
    if (chip.field === "category" || chip.field === "gender" || chip.field === "minPrice" || chip.field === "maxPrice") {
      next[chip.field] = null;
    }
    setOverrides(next);
    void search(query, next);
  }

  const chips = result ? intentChips(result.intent, locale) : [];

  return (
    <section className="mt-6 rounded-2xl border border-primary-200 bg-gradient-to-br from-white to-primary-50/60 p-5 shadow-sm dark:border-primary-900/60 dark:from-stone-900 dark:to-primary-950/20" aria-labelledby="ai-catalog-search-title">
      <h2 id="ai-catalog-search-title" className="text-xl font-extrabold">{t("aiSearchTitle")}</h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{t("aiSearchIntro")}</p>
      {!providerConfigured ? <p className="mt-3 text-sm text-amber-800 dark:text-amber-300" role="status">{t("aiSearchProviderMissing")}</p> : null}
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 dark:border-white/15 dark:bg-stone-950"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("aiSearchPlaceholder")}
          maxLength={500}
          aria-label={t("aiSearchTitle")}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          aria-busy={loading}
          className="min-h-12 rounded-xl bg-primary-700 px-5 text-sm font-bold text-white transition hover:bg-primary-800 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? t("aiSearchLoading") : t("aiSearchSubmit")}
        </button>
      </form>

      {loading ? <p className="mt-4 text-sm" role="status" aria-live="polite">{t("aiSearchLoading")}</p> : null}
      {disabled ? <p className="mt-4 text-sm text-amber-800 dark:text-amber-300" role="status">{t("aiSearchError")}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700 dark:text-red-300" role="alert">{t("aiSearchError")}</p> : null}
      {result?.meta.fallbackUsed ? <p className="mt-4 text-sm text-amber-800 dark:text-amber-300" role="status">{t("aiSearchFallback")}</p> : null}
      {result && chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label={t("aiSearchResults")}>
          {chips.map((chip, index) => (
            <button
              key={`${chip.field}-${chip.label}-${index}`}
              type="button"
              onClick={() => removeChip(chip)}
              aria-label={`${t("aiSearchRemoveFilter")}: ${chip.label}`}
              className="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-900 hover:border-primary-500 dark:border-primary-900 dark:bg-stone-900 dark:text-primary-200"
            >
              {chip.label} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
      {result && result.items.length === 0 ? <p className="mt-4 text-sm text-stone-600 dark:text-stone-300" role="status">{t("aiSearchEmpty")}</p> : null}
      {result && result.items.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" aria-live="polite">
          {result.items.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
        </div>
      ) : null}
    </section>
  );
}
