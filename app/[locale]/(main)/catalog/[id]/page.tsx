import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Headphones,
  PackageCheck,
} from "lucide-react";
import { externalBaseURL } from "@/lib/axios";
import { ProductImage } from "@/components/commerce/ProductImage";
import { OrderModal } from "@/components/commerce/OrderModal";
import { AddToCart } from "@/components/commerce/AddToCart";
import { SimilarProducts } from "@/components/commerce/SimilarProducts";
import {
  buildCatalogSearchParams,
  productTitle,
  type StoreProduct,
} from "@/lib/products";

type Filters = Record<string, string | string[] | undefined>;

async function loadProduct(slug: string) {
  try {
    let identifier = slug;
    try {
      identifier = decodeURIComponent(slug);
    } catch {}
    const response = await fetch(
      `${externalBaseURL}/api/v1/products/${encodeURIComponent(identifier)}`,
      { cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const product = await loadProduct(id);
  return { title: product ? productTitle(product, locale) : "Товар" };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<Filters>;
}) {
  const [{ id, locale }, filters] = await Promise.all([params, searchParams]);
  const product:
    | (StoreProduct & {
        stock?: number;
        description?: Record<string, string | { text?: string }>;
        variants?: Array<{
          id: string;
          color?: string | null;
          size?: string | null;
          stock: number;
          salePriceUzs: string | number;
        }>;
      })
    | null = await loadProduct(id);
  if (!product) notFound();
  const title = productTitle(product, locale);
  const copy = {
    ru: {
      back: "Назад в каталог",
      verified: "AVERON · ПРОВЕРЕНО",
      descriptionFallback: "Проверенный товар из каталога AVERON.",
      descriptionSupport: "Подробности товара доступны у поддержки.",
      options: "Доступные варианты",
      standard: "Стандартный",
      delivery: "Доставка",
      orderStatus: "Статус заказа всегда под рукой",
      support: "Поддержка",
      supportText: "Поможем с размером и заказом",
      confirmed: "Карточка подтверждена администратором",
      currency: "сум",
    },
    uz: {
      back: "Katalogga qaytish",
      verified: "AVERON · TEKSHIRILGAN",
      descriptionFallback: "AVERON katalogidagi tekshirilgan mahsulot.",
      descriptionSupport: "Mahsulot tafsilotlarini yordam xizmatidan bilib oling.",
      options: "Mavjud variantlar",
      standard: "Standart",
      delivery: "Yetkazib berish",
      orderStatus: "Buyurtma holati doimo yoningizda",
      support: "Yordam",
      supportText: "O‘lcham va buyurtma bo‘yicha yordam beramiz",
      confirmed: "Mahsulot sahifasi administrator tomonidan tasdiqlangan",
      currency: "so‘m",
    },
    en: {
      back: "Back to catalog",
      verified: "AVERON · VERIFIED",
      descriptionFallback: "A verified product from the AVERON catalog.",
      descriptionSupport: "Contact support for more product details.",
      options: "Available options",
      standard: "Standard",
      delivery: "Delivery",
      orderStatus: "Keep your order status close at hand",
      support: "Support",
      supportText: "We can help with sizing and orders",
      confirmed: "Product listing verified by an administrator",
      currency: "UZS",
    },
  }[locale as "ru" | "uz" | "en"] ?? {
    back: "Назад в каталог",
    verified: "AVERON · ПРОВЕРЕНО",
    descriptionFallback: "Проверенный товар из каталога AVERON.",
    descriptionSupport: "Подробности товара доступны у поддержки.",
    options: "Доступные варианты",
    standard: "Стандартный",
    delivery: "Доставка",
    orderStatus: "Статус заказа всегда под рукой",
    support: "Поддержка",
    supportText: "Поможем с размером и заказом",
    confirmed: "Карточка подтверждена администратором",
    currency: "сум",
  };
  const catalogQuery = buildCatalogSearchParams(filters).toString();
  const catalogHref = `/${locale}/catalog${catalogQuery ? `?${catalogQuery}` : ""}`;
  const localizedDescription = product.description?.[locale] ?? product.description?.ru;
  const description =
    (typeof localizedDescription === "string"
      ? localizedDescription
      : localizedDescription?.text) ?? copy.descriptionFallback;
  const currencyLocale = locale === "en" ? "en-US" : locale === "uz" ? "uz-UZ" : "ru-RU";
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={catalogHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition-colors hover:text-primary-700"
        >
          <ArrowLeft size={16} />
          {copy.back}
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            {product.images?.length ? (
              product.images.slice(0, 4).map((item, index) => (
                <div
                  key={item.id ?? item.url}
                  className={`relative overflow-hidden rounded-3xl bg-stone-100 shadow-sm dark:bg-stone-800 ${index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
                >
                  <ProductImage src={item.url} alt={title} />
                </div>
              ))
            ) : (
              <div className="col-span-2 flex aspect-[4/3] items-center justify-center rounded-2xl bg-stone-100 text-stone-400 dark:bg-stone-800">
                AVERON
              </div>
            )}
          </div>
          <section>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-700 dark:text-primary-300">
              {copy.verified}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              {title}
            </h1>
            <p className="mt-5 text-2xl font-black">
              {Number(product.salePriceUzs).toLocaleString(currencyLocale)} {copy.currency}
            </p>
            <p className="mt-5 leading-7 text-stone-600 dark:text-stone-300">
              {typeof description === "string"
                ? description
                : "Подробности товара доступны у поддержки."}
            </p>
            {product.variants?.length ? (
              <div className="mt-7">
                <h2 className="text-sm font-bold">{copy.options}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <span
                      key={variant.id}
                      className="rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-white/15"
                    >
                      {[variant.color, variant.size]
                        .filter(Boolean)
                        .join(" · ") || copy.standard}{" "}
                      · {variant.stock} шт.
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <AddToCart
              productId={product.id}
              productStock={product.stock}
              variants={product.variants ?? []}
            />
            <OrderModal product={product} locale={locale} />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900">
                <PackageCheck className="text-primary-700 dark:text-primary-300" />
                <div>
                  <b className="text-sm">{copy.delivery}</b>
                  <p className="mt-1 text-xs text-stone-500">
                    {copy.orderStatus}
                  </p>
                </div>
              </div>
              <Link
                href={`/${locale}/support`}
                className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-primary-300 dark:border-white/10 dark:bg-stone-900"
              >
                <Headphones className="text-primary-700 dark:text-primary-300" />
                <div>
                  <b className="text-sm">{copy.support}</b>
                  <p className="mt-1 text-xs text-stone-500">
                    {copy.supportText}
                  </p>
                </div>
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-stone-500">
              <CheckCircle2 size={16} className="text-emerald-500" />
              {copy.confirmed}
            </p>
          </section>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6 lg:px-8">
        <SimilarProducts slug={product.slug} locale={locale} />
      </div>
    </main>
  );
}
