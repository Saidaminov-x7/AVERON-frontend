import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Filter, Search } from "lucide-react";
import {
  ProductCard,
  type StoreProduct,
} from "@/components/commerce/ProductCard";
import { VisualSearch } from "@/components/commerce/VisualSearch";
import { CatalogAiSearch } from "@/components/commerce/CatalogAiSearch";
import { StyleAssistant } from "@/components/commerce/StyleAssistant";
import { CatalogFilterLayout } from "@/components/commerce/CatalogFilterLayout";
import { CatalogFilterControls } from "@/components/commerce/CatalogFilterControls";
import { CatalogCountryDefaultResolver } from "@/components/commerce/CatalogCountryDefaultResolver";
import { CatalogSortControl } from "@/components/commerce/CatalogSortControl";
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
    ...(f.saleOnly === "true" ? [[t("saleOnly"), t("saleOnly")]] : []),
    ...(Boolean(typeof f.minPrice === "string" && f.minPrice.trim()) || Boolean(typeof f.maxPrice === "string" && f.maxPrice.trim())
      ? [[t("price"), `${typeof f.minPrice === "string" && f.minPrice.trim() ? f.minPrice : "–"}–${typeof f.maxPrice === "string" && f.maxPrice.trim() ? f.maxPrice : "∞"} UZS`]]
      : []),
    ...(f.sort === "popular" ? [[t("sort"), t("popular")]] : []),
    ...(f.sort === "price_asc" ? [[t("sort"), t("cheap")]] : []),
    ...(f.sort === "price_desc" ? [[t("sort"), t("expensive")]] : []),
  ];

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="mx-auto max-w-[1344px] px-4 py-8 sm:px-8 lg:px-12">
        <CatalogCountryDefaultResolver
          locale={locale}
          hasExplicitCountry={Object.prototype.hasOwnProperty.call(f, "country")}
        />
        <CatalogFilterLayout
          filters={
            <div className="sticky top-24 flex h-fit max-h-[calc(100vh-6rem)] flex-col overflow-y-auto rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-3 font-bold">
                <Filter className="text-primary-700 dark:text-primary-300" size={18} />
                {t("filters")}
              </div>
              <CatalogFilterControls locale={locale} categories={categories} categoriesError={categoriesError} facets={facets} facetsError={facetsError} />
            </div>
          }
          mobileFilters={<CatalogFilterControls locale={locale} categories={categories} categoriesError={categoriesError} facets={facets} facetsError={facetsError} />}
          resultCount={data.pagination?.total ?? 0}
        >
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
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
              <CatalogSortControl />
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
              <div className="catalog-product-grid mt-5 grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-5">
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
