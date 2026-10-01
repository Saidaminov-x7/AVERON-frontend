import Link from "next/link";
import { useTranslations } from "next-intl";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import {
  ProductCard,
  type StoreProduct,
} from "@/components/commerce/ProductCard";
import {
  buildCatalogPageSearchParams,
  buildCatalogSearchParams,
  categoryName,
  type StoreCategory,
} from "@/lib/products";
import { loadStoreCatalog, loadStoreCategories } from "@/lib/storefront-catalog";

type Filters = Record<string, string | string[] | undefined>;

const input =
  "h-11 w-full rounded-xl border border-stone-300 bg-transparent px-3 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 dark:border-white/15";

function Controls({
  f,
  t,
  categories,
  categoriesError,
  locale,
}: {
  f: Filters;
  t: (key: string) => string;
  categories: StoreCategory[];
  categoriesError: boolean;
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
  return (
    <>
      {typeof f.country === "string" && f.country.trim() ? (
        <input type="hidden" name="country" value={f.country} />
      ) : null}
      {categoriesError && typeof f.category === "string" && f.category.trim() ? (
        <input type="hidden" name="category" value={f.category} />
      ) : null}
      <label className="text-xs font-bold uppercase text-stone-500">
        {t("search")}
      </label>
      <input
        className={`${input} mt-2`}
        name="q"
        defaultValue={f.q as string}
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
      <div className="mt-5 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold uppercase text-stone-500">
          {t("size")}
          <select
            name="size"
            defaultValue={(f.size as string) || ""}
            className={`${input} mt-2 normal-case`}
          >
            <option value="">{t("anySize")}</option>
            {["XS", "S", "M", "L", "XL", "XXL", "One size"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold uppercase text-stone-500">
          {t("color")}
          <select
            name="color"
            defaultValue={(f.color as string) || ""}
            className={`${input} mt-2 normal-case`}
          >
            <option value="">{t("anyColor")}</option>
            {[
              "black",
              "white",
              "beige",
              "brown",
              "blue",
              "red",
              "green",
              "pink",
            ].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-5 text-xs font-bold uppercase text-stone-500">
        {t("price")}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          className={input}
          name="minPrice"
          inputMode="numeric"
          defaultValue={f.minPrice as string}
          placeholder={t("from")}
        />
        <input
          className={input}
          name="maxPrice"
          inputMode="numeric"
          defaultValue={f.maxPrice as string}
          placeholder={t("to")}
        />
      </div>
      <label className="mt-5 block text-xs font-bold uppercase text-stone-500">
        {t("sort")}
        <select
          name="sort"
          defaultValue={(f.sort as string) || "newest"}
          className={`${input} mt-2 normal-case`}
        >
          <option value="newest">{t("newest")}</option>
          <option value="price_asc">{t("cheap")}</option>
          <option value="price_desc">{t("expensive")}</option>
        </select>
      </label>
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
  const [catalog, categoryResult] = await Promise.all([
    loadStoreCatalog(f),
    loadStoreCategories(),
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
      catalogError={catalog.status === "error"}
      categoriesError={categoryResult.status === "error"}
    />
  );
}

function CatalogContent({
  locale,
  f,
  data,
  products,
  categories,
  catalogError,
  categoriesError,
}: {
  locale: string;
  f: Filters;
  data: { pagination: { page: number; pages: number; total: number } };
  products: StoreProduct[];
  categories: StoreCategory[];
  catalogError: boolean;
  categoriesError: boolean;
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

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <section className="border-b border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[.18em] text-primary-700 dark:text-primary-300">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">{t("title")}</h1>
          <p className="mt-2 text-sm text-stone-500">{t("intro")}</p>
        </div>
      </section>
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <form className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900 lg:hidden">
          <details>
            <summary className="flex h-11 list-none items-center justify-center gap-2 rounded-xl bg-primary-700 font-bold text-white">
              <SlidersHorizontal size={17} />
              {t("filters")}
            </summary>
            <div className="mt-4">
              <Controls f={f} t={t} categories={categories} categoriesError={categoriesError} locale={locale} />
            </div>
          </details>
        </form>
        <div className="mt-6 grid gap-6 lg:mt-0 lg:grid-cols-[290px_1fr]">
          <aside className="hidden lg:block">
            <form className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
              <div className="flex items-center gap-2 border-b pb-4 font-bold dark:border-white/10">
                <Filter className="text-primary-700 dark:text-primary-300" size={18} />
                {t("filters")}
              </div>
              <Controls f={f} t={t} categories={categories} categoriesError={categoriesError} locale={locale} />
              <Link
                href={`/${locale}/catalog`}
                className="mt-2 flex h-10 items-center justify-center text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              >
                {t("reset")}
              </Link>
            </form>
          </aside>
          <section>
            <h2 className="text-xl font-bold">
              {t("products")}{" "}
              <span className="text-stone-400">
                ({data.pagination?.total ?? 0})
              </span>
            </h2>
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
          </section>
        </div>
      </div>
    </main>
  );
}
