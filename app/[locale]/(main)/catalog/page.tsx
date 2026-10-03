import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import {
  ProductCard,
  type StoreProduct,
} from "@/components/commerce/ProductCard";
import { VisualSearch } from "@/components/commerce/VisualSearch";
import { CatalogAiSearch } from "@/components/commerce/CatalogAiSearch";
import { StyleAssistant } from "@/components/commerce/StyleAssistant";
import { CatalogSelect } from "@/components/commerce/CatalogSelect";
import { CatalogFilterLayout } from "@/components/commerce/CatalogFilterLayout";
import { CatalogCountryDefaultResolver } from "@/components/commerce/CatalogCountryDefaultResolver";
import type { CatalogFacets } from "@/lib/storefront-catalog";
import {
  buildCatalogPageSearchParams,
  buildCatalogSearchParams,
  categoryName,
  type StoreCategory,
} from "@/lib/products";
import { loadStoreCatalog, loadStoreCategories, loadStoreCatalogFacets } from "@/lib/storefront-catalog";
import { loadCommerceCapabilities } from "@/lib/visual-search";

type Filters = Record<string, string | string[] | undefined>;

const input =
  "h-11 w-full rounded-xl border border-stone-300 bg-transparent px-3 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 dark:border-white/15";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Filters>;
}): Promise<Metadata> {
  const [{ locale }, filters] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "catalog" });
  const hasQueryFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.some((entry) => entry.trim()) : Boolean(value?.trim()),
  );
  const canonical = `/${locale}/catalog`;
  const languages = {
    ru: "/ru/catalog",
    uz: "/uz/catalog",
    en: "/en/catalog",
    "x-default": "/ru/catalog",
  };
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical, languages },
    robots: hasQueryFilters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("subtitle"),
      url: canonical,
    },
  };
}

function Controls({
  f,
  t,
  categories,
  categoriesError,
  facets,
  facetsError,
  locale,
}: {
  f: Filters;
  t: (key: string) => string;
  categories: StoreCategory[];
  categoriesError: boolean;
  facets: CatalogFacets;
  facetsError: boolean;
  locale: string;
}) {
  const cats: Array<[string, string]> = [
    ["", t("all")],
    ...categories.map(
      (category): [string, string] => [
        category.slug,
        categoryName(category, locale),
      ],
    ),
  ];
  const audiences = [
    ["", t("everyone")],
    ["women", t("women")],
    ["men", t("men")],
    ["kids", t("kids")],
  ];
  const countries = [
    ["", t("allCountries")],
    ["CN", t("china")],
    ["US", t("unitedStates")],
    ["TR", t("turkey")],
    ["IT", t("italy")],
    ["GB", t("unitedKingdom")],
  ];
  const selectedSize = typeof f.size === "string" ? f.size : "";
  const selectedColor = typeof f.color === "string" ? f.color : "";
  const sizes = [...new Set([...(selectedSize ? [selectedSize] : []), ...facets.sizes])];
  const colors = [...new Set([...(selectedColor ? [selectedColor] : []), ...facets.colors])];
  return (
    <>
      {categoriesError && typeof f.category === "string" && f.category.trim() ? (
        <input type="hidden" name="category" value={f.category} />
      ) : null}
      <label className="text-xs font-bold uppercase text-stone-500">
        {t("search")}
      </label>
      <input
        className={`${input} mt-2`}
        name="q"
        defaultValue={typeof f.q === "string" ? f.q : ""}
        placeholder={t("placeholder")}
      />
      <p className="mt-5 text-xs font-bold uppercase text-stone-500">
        {t("category")}
      </p>
      {categoriesError ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">
          {locale === "uz" ? "Toifalarni yuklab bo‘lmadi." : locale === "en" ? "Categories could not be loaded." : "Не удалось загрузить категории."}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {cats.map(([v, l]) => (
          <label
            key={v}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors ${(f.category ?? "") === v ? "border-primary-700 bg-primary-700 text-white" : "border-stone-300 hover:border-primary-600 dark:border-white/15"}`}
          >
            <input
              className="sr-only"
              type="radio"
              name="category"
              value={v}
              defaultChecked={(f.category ?? "") === v}
            />
            {l}
          </label>
        ))}
      </div>
      <p className="mt-5 text-xs font-bold uppercase text-stone-500">
        {t("audience")}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {audiences.map(([v, l]) => (
          <label
            key={v}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors ${(f.audience ?? "") === v ? "border-primary-700 bg-primary-700 text-white" : "border-stone-300 hover:border-primary-600 dark:border-white/15"}`}
          >
            <input
              className="sr-only"
              type="radio"
              name="audience"
              value={v}
              defaultChecked={(f.audience ?? "") === v}
            />
            {l}
          </label>
        ))}
      </div>
      <div className="mt-5">
        <CatalogSelect
          name="country"
          label={t("country")}
          value={typeof f.country === "string" ? f.country : ""}
          placeholder={t("allCountries")}
          options={countries.map(([value, label]) => ({ value, label }))}
        />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <CatalogSelect
          name="size"
          label={t("size")}
          value={typeof f.size === "string" ? f.size : ""}
          placeholder={t("anySize")}
          options={[
            { value: "", label: t("anySize") },
            ...sizes.map((value) => ({ value, label: value })),
          ]}
        />
        <CatalogSelect
          name="color"
          label={t("color")}
          value={typeof f.color === "string" ? f.color : ""}
          placeholder={t("anyColor")}
          options={[
            { value: "", label: t("anyColor") },
            ...colors.map((value) => ({ value, label: value })),
          ]}
        />
      </div>
      {facetsError ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">
          {locale === "uz" ? "O‘lcham va ranglar ro‘yxatini yuklab bo‘lmadi." : locale === "en" ? "Available sizes and colors could not be loaded." : "Не удалось загрузить доступные размеры и цвета."}
        </p>
      ) : null}
      <p className="mt-5 text-xs font-bold uppercase text-stone-500">
        {t("price")}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          className={input}
          name="minPrice"
          type="number"
          min="0"
          step="0.01"
          inputMode="numeric"
          defaultValue={typeof f.minPrice === "string" ? f.minPrice : ""}
          placeholder={t("from")}
        />
        <input
          className={input}
          name="maxPrice"
          type="number"
          min="0"
          step="0.01"
          inputMode="numeric"
          defaultValue={typeof f.maxPrice === "string" ? f.maxPrice : ""}
          placeholder={t("to")}
        />
      </div>
      <div className="mt-5">
        <CatalogSelect
          name="sort"
          label={t("sort")}
          value={typeof f.sort === "string" ? f.sort : "newest"}
          placeholder={t("newest")}
          options={[
            { value: "newest", label: t("newest") },
            { value: "price_asc", label: t("cheap") },
            { value: "price_desc", label: t("expensive") },
            { value: "popular", label: t("popular") },
          ]}
        />
      </div>
      <button className="mt-5 h-11 w-full rounded-xl bg-primary-700 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-800">
        {t("show")}
      </button>
    </>
  );
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Filters>;
}) {
  const [{ locale }, f] = await Promise.all([params, searchParams]);
  const [catalog, categoryResult, facetResult, capabilities] = await Promise.all([
    loadStoreCatalog(f),
    loadStoreCategories(),
    loadStoreCatalogFacets(),
    loadCommerceCapabilities(),
  ]);
  const { data } = catalog;
  const products: StoreProduct[] = data.items;
  return (
    <CatalogContent
      locale={locale}
      f={f}
      data={data}
      products={products}
      categories={categoryResult.categories}
      capabilities={capabilities}
      catalogError={catalog.status === "error"}
      categoriesError={categoryResult.status === "error"}
      facets={facetResult.facets}
      facetsError={facetResult.status === "error"}
    />
  );
}

function CatalogContent({
  locale,
  f,
  data,
  products,
  categories,
  capabilities,
  catalogError,
  categoriesError,
  facets,
  facetsError,
}: {
  locale: string;
  f: Filters;
  data: { pagination: { page: number; pages: number; total: number } };
  products: StoreProduct[];
  categories: StoreCategory[];
  capabilities: Awaited<ReturnType<typeof loadCommerceCapabilities>>;
  catalogError: boolean;
  categoriesError: boolean;
  facets: CatalogFacets;
  facetsError: boolean;
}) {
  const t = useTranslations("catalog");
  const catalogQuery = buildCatalogSearchParams(f).toString();
  const requestedPage = Number(data.pagination.page ?? f.page ?? 1);
  const page = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.floor(requestedPage)
    : 1;
  const pageCount = Math.max(1, data.pagination.pages || 1);
  const pageHref = (targetPage: number) => {
    const query = buildCatalogPageSearchParams(f, targetPage).toString();
    return `/${locale}/catalog${query ? `?${query}` : ""}`;
  };
  const activeFilters = [
    ...(typeof f.q === "string" && f.q.trim() ? [[t("search"), f.q.trim()]] : []),
    ...(typeof f.category === "string" && f.category
      ? [[t("category"), categoryName(categories.find((category) => category.slug === f.category) ?? { slug: f.category }, locale)]]
      : []),
    ...(typeof f.audience === "string" && f.audience
      ? [[t("audience"), t(f.audience as "women" | "men" | "kids")]]
      : []),
    ...(typeof f.country === "string" && f.country ? [[t("country"), f.country]] : []),
    ...(typeof f.size === "string" && f.size ? [[t("size"), f.size]] : []),
    ...(typeof f.color === "string" && f.color ? [[t("color"), f.color]] : []),
    ...(typeof f.minPrice === "string" || typeof f.maxPrice === "string"
      ? [[t("price"), `${typeof f.minPrice === "string" ? f.minPrice : "0"}–${typeof f.maxPrice === "string" ? f.maxPrice : "∞"} UZS`]]
      : []),
    ...(f.sort === "popular" ? [[t("sort"), t("popular")]] : []),
    ...(f.sort === "price_asc" ? [[t("sort"), t("cheap")]] : []),
    ...(f.sort === "price_desc" ? [[t("sort"), t("expensive")]] : []),
  ];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <CatalogCountryDefaultResolver
          locale={locale}
          hasExplicitCountry={Object.prototype.hasOwnProperty.call(f, "country")}
        />
        <form className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900 lg:hidden">
          <details>
            <summary className="group flex h-11 list-none items-center justify-center gap-2 rounded-xl bg-primary-700 font-bold text-white">
              <SlidersHorizontal size={17} />
              <span className="group-open:hidden">{t("showFilters")}</span>
              <span className="hidden group-open:inline">{t("hideFilters")}</span>
            </summary>
            <div className="mt-4">
              <Controls f={f} t={t} categories={categories} categoriesError={categoriesError} facets={facets} facetsError={facetsError} locale={locale} />
              <Link href={`/${locale}/catalog`} className="mt-2 flex h-10 items-center justify-center text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
                {t("reset")}
              </Link>
            </div>
          </details>
        </form>
        <CatalogFilterLayout
          filters={
            <form className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
              <div className="flex items-center gap-2 border-b pb-4 font-bold dark:border-white/10">
                <Filter className="text-primary-700 dark:text-primary-300" size={18} />
                {t("filters")}
              </div>
              <Controls f={f} t={t} categories={categories} categoriesError={categoriesError} facets={facets} facetsError={facetsError} locale={locale} />
              <Link
                href={`/${locale}/catalog`}
                className="mt-2 flex h-10 items-center justify-center text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              >
                {t("reset")}
              </Link>
            </form>
          }
        >
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <VisualSearch
                locale={locale}
                country={typeof f.country === "string" ? f.country : undefined}
                category={typeof f.category === "string" ? f.category : undefined}
              />
              <CatalogAiSearch
                locale={locale}
                enabled={capabilities.aiSearch}
                providerConfigured={capabilities.aiProviderConfigured}
              />
              <StyleAssistant locale={locale} enabled={capabilities.styleAssistant} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">
                {t("products")}{" "}
                <span className="text-stone-400">
                  ({data.pagination?.total ?? 0})
                </span>
              </h2>
              <Link href={`/${locale}/catalog`} className="text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300">
                {t("reset")}
              </Link>
            </div>
            {activeFilters.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2" aria-label={t("activeFilters")}>
                {activeFilters.map(([label, value], index) => (
                  <span key={`${label}-${index}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
                    <span className="text-slate-500 dark:text-slate-400">{label}:</span>
                    <span className="truncate">{value}</span>
                  </span>
                ))}
              </div>
            ) : null}
            {catalogError ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-14 text-center dark:border-amber-900/60 dark:bg-amber-950/20" role="alert">
                <h2 className="text-xl font-bold">
                  {locale === "uz" ? "Mahsulotlarni yuklab bo‘lmadi" : locale === "en" ? "Products could not be loaded" : "Не удалось загрузить товары"}
                </h2>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                  {locale === "uz" ? "Iltimos, birozdan so‘ng qayta urinib ko‘ring." : locale === "en" ? "Please try again in a moment." : "Попробуйте обновить страницу чуть позже."}
                </p>
                <Link href={`/${locale}/catalog${catalogQuery ? `?${catalogQuery}` : ""}`} className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary-700 px-5 text-sm font-bold text-white">
                  {locale === "uz" ? "Qayta urinish" : locale === "en" ? "Try again" : "Повторить"}
                </Link>
              </div>
            ) : products.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    locale={locale}
                    catalogQuery={catalogQuery}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-stone-900">
                <Search className="mx-auto text-primary-700 dark:text-primary-300" size={36} />
                <h2 className="mt-4 text-xl font-bold">{t("empty")}</h2>
                <p className="mt-2 text-sm text-stone-500">{t("emptyText")}</p>
              </div>
            )}
            {!catalogError && pageCount > 1 ? (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label={locale === "en" ? "Catalog pages" : locale === "uz" ? "Katalog sahifalari" : "Страницы каталога"}>
                <Link
                  href={pageHref(page - 1)}
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : undefined}
                  className={`inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-primary-600 hover:text-primary-700"} border-stone-300 dark:border-white/15`}
                >
                  {locale === "en" ? "Previous" : locale === "uz" ? "Oldingi" : "Назад"}
                </Link>
                <span className="min-w-16 text-center text-sm text-stone-500">
                  {page} / {pageCount}
                </span>
                <Link
                  href={pageHref(page + 1)}
                  aria-disabled={page >= pageCount}
                  tabIndex={page >= pageCount ? -1 : undefined}
                  className={`inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold ${page >= pageCount ? "pointer-events-none opacity-40" : "hover:border-primary-600 hover:text-primary-700"} border-stone-300 dark:border-white/15`}
                >
                  {locale === "en" ? "Next" : locale === "uz" ? "Keyingi" : "Дальше"}
                </Link>
              </nav>
            ) : null}
          </>
        </CatalogFilterLayout>
      </div>
    </main>
  );
}
