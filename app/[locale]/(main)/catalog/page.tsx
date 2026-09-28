import Link from "next/link";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { externalBaseURL } from "@/lib/axios";
import {
  ProductCard,
  type StoreProduct,
} from "@/components/commerce/ProductCard";
type Filters = Record<string, string | string[] | undefined>;
const text = {
  ru: {
    eyebrow: "КАТАЛОГ AVERON",
    title: "Товары из Китая",
    intro: "Одежда, обувь и аксессуары, проверенные перед публикацией.",
    filters: "Параметры поиска",
    search: "Поиск",
    placeholder: "Название товара",
    category: "Категория",
    all: "Все товары",
    women: "Женское",
    men: "Мужское",
    shoes: "Обувь",
    accessories: "Аксессуары",
    audience: "Для кого",
    everyone: "Для всех",
    kids: "Детям",
    size: "Размер",
    anySize: "Любой размер",
    color: "Цвет",
    anyColor: "Любой цвет",
    price: "Цена, сум",
    from: "От",
    to: "До",
    sort: "Сортировка",
    newest: "Сначала новые",
    cheap: "Сначала дешевле",
    expensive: "Сначала дороже",
    show: "Показать товары",
    reset: "Сбросить",
    products: "Товары",
    empty: "Подходящих товаров пока нет",
    emptyText: "Измените запрос или сбросьте фильтры.",
  },
  uz: {
    eyebrow: "AVERON KATALOGI",
    title: "Xitoydan mahsulotlar",
    intro:
      "E’lon qilishdan oldin tekshirilgan kiyim, poyabzal va aksessuarlar.",
    filters: "Qidiruv parametrlari",
    search: "Qidiruv",
    placeholder: "Mahsulot nomi",
    category: "Kategoriya",
    all: "Barcha mahsulotlar",
    women: "Ayollar",
    men: "Erkaklar",
    shoes: "Poyabzal",
    accessories: "Aksessuarlar",
    audience: "Kim uchun",
    everyone: "Barcha uchun",
    kids: "Bolalar",
    size: "O‘lcham",
    anySize: "Istalgan o‘lcham",
    color: "Rang",
    anyColor: "Istalgan rang",
    price: "Narx, so‘m",
    from: "Dan",
    to: "Gacha",
    sort: "Saralash",
    newest: "Avval yangilari",
    cheap: "Avval arzonlari",
    expensive: "Avval qimmatlari",
    show: "Mahsulotlarni ko‘rsatish",
    reset: "Tozalash",
    products: "Mahsulotlar",
    empty: "Mos mahsulotlar topilmadi",
    emptyText: "So‘rovni o‘zgartiring yoki filtrlarni tozalang.",
  },
  en: {
    eyebrow: "AVERON CATALOG",
    title: "Products from China",
    intro: "Clothing, shoes and accessories verified before publication.",
    filters: "Search filters",
    search: "Search",
    placeholder: "Product name",
    category: "Category",
    all: "All products",
    women: "Women",
    men: "Men",
    shoes: "Shoes",
    accessories: "Accessories",
    audience: "For whom",
    everyone: "Everyone",
    kids: "Kids",
    size: "Size",
    anySize: "Any size",
    color: "Color",
    anyColor: "Any color",
    price: "Price, UZS",
    from: "From",
    to: "To",
    sort: "Sort",
    newest: "Newest first",
    cheap: "Lowest price",
    expensive: "Highest price",
    show: "Show products",
    reset: "Reset",
    products: "Products",
    empty: "No matching products yet",
    emptyText: "Change the query or reset filters.",
  },
} as const;
async function loadCatalog(f: Filters) {
  const q = new URLSearchParams();
  for (const k of [
    "q",
    "category",
    "audience",
    "size",
    "color",
    "minPrice",
    "maxPrice",
    "sort",
    "page",
  ]) {
    const v = f[k];
    if (typeof v === "string" && v.trim()) q.set(k, v.trim());
  }
  q.set("limit", "24");
  try {
    const r = await fetch(`${externalBaseURL}/api/v1/products?${q}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw Error();
    return r.json();
  } catch {
    return { items: [], pagination: { total: 0 } };
  }
}
const input =
  "h-11 w-full rounded-xl border border-stone-300 bg-transparent px-3 text-sm outline-none focus:border-violet-500 dark:border-white/15";
function Controls({
  f,
  t,
}: {
  f: Filters;
  t: typeof text.ru | typeof text.uz | typeof text.en;
}) {
  const cats = [
    ["", t.all],
    ["women", t.women],
    ["men", t.men],
    ["shoes", t.shoes],
    ["accessories", t.accessories],
  ];
  const audiences = [
    ["", t.everyone],
    ["women", t.women],
    ["men", t.men],
    ["kids", t.kids],
  ];
  return (
    <>
      <label className="text-xs font-bold uppercase text-stone-500">
        {t.search}
      </label>
      <input
        className={`${input} mt-2`}
        name="q"
        defaultValue={f.q as string}
        placeholder={t.placeholder}
      />
      <p className="mt-5 text-xs font-bold uppercase text-stone-500">
        {t.category}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {cats.map(([v, l]) => (
          <label
            key={v}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${(f.category ?? "") === v ? "border-violet-600 bg-violet-600 text-white" : "border-stone-300 dark:border-white/15"}`}
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
        {t.audience}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {audiences.map(([v, l]) => (
          <label
            key={v}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${(f.audience ?? "") === v ? "border-violet-600 bg-violet-600 text-white" : "border-stone-300 dark:border-white/15"}`}
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
          {t.size}
          <select
            name="size"
            defaultValue={(f.size as string) || ""}
            className={`${input} mt-2 normal-case`}
          >
            <option value="">{t.anySize}</option>
            {["XS", "S", "M", "L", "XL", "XXL", "One size"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold uppercase text-stone-500">
          {t.color}
          <select
            name="color"
            defaultValue={(f.color as string) || ""}
            className={`${input} mt-2 normal-case`}
          >
            <option value="">{t.anyColor}</option>
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
        {t.price}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          className={input}
          name="minPrice"
          inputMode="numeric"
          defaultValue={f.minPrice as string}
          placeholder={t.from}
        />
        <input
          className={input}
          name="maxPrice"
          inputMode="numeric"
          defaultValue={f.maxPrice as string}
          placeholder={t.to}
        />
      </div>
      <label className="mt-5 block text-xs font-bold uppercase text-stone-500">
        {t.sort}
        <select
          name="sort"
          defaultValue={(f.sort as string) || "newest"}
          className={`${input} mt-2 normal-case`}
        >
          <option value="newest">{t.newest}</option>
          <option value="price_asc">{t.cheap}</option>
          <option value="price_desc">{t.expensive}</option>
        </select>
      </label>
      <button className="mt-5 h-11 w-full rounded-xl bg-violet-600 text-sm font-bold text-white">
        {t.show}
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
  const t = text[locale as keyof typeof text] ?? text.ru;
  const data = await loadCatalog(f);
  const products: StoreProduct[] = data.items ?? [];
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <section className="border-b border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[.18em] text-violet-600">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">{t.title}</h1>
          <p className="mt-2 text-sm text-stone-500">{t.intro}</p>
        </div>
      </section>
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <form className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900 lg:hidden">
          <details>
            <summary className="flex h-11 list-none items-center justify-center gap-2 rounded-xl bg-violet-600 font-bold text-white">
              <SlidersHorizontal size={17} />
              {t.filters}
            </summary>
            <div className="mt-4">
              <Controls f={f} t={t} />
            </div>
          </details>
        </form>
        <div className="mt-6 grid gap-6 lg:mt-0 lg:grid-cols-[290px_1fr]">
          <aside className="hidden lg:block">
            <form className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
              <div className="flex items-center gap-2 border-b pb-4 font-bold dark:border-white/10">
                <Filter className="text-violet-600" size={18} />
                {t.filters}
              </div>
              <Controls f={f} t={t} />
              <Link
                href={`/${locale}/catalog`}
                className="mt-2 flex h-10 items-center justify-center text-sm text-stone-500"
              >
                {t.reset}
              </Link>
            </form>
          </aside>
          <section>
            <h2 className="text-xl font-bold">
              {t.products}{" "}
              <span className="text-stone-400">
                ({data.pagination?.total ?? 0})
              </span>
            </h2>
            {products.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-stone-900">
                <Search className="mx-auto text-violet-600" size={36} />
                <h2 className="mt-4 text-xl font-bold">{t.empty}</h2>
                <p className="mt-2 text-sm text-stone-500">{t.emptyText}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
