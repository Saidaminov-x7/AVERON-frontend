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
        description?: Record<string, string | { text?: string }>;
        variants?: Array<{
          id: string;
          color?: string;
          size?: string;
          stock: number;
          salePriceUzs: string | number;
        }>;
      })
    | null = await loadProduct(id);
  if (!product) notFound();
  const title = productTitle(product, locale);
  const catalogQuery = buildCatalogSearchParams(filters).toString();
  const catalogHref = `/${locale}/catalog${catalogQuery ? `?${catalogQuery}` : ""}`;
  const localizedDescription = product.description?.[locale] ?? product.description?.ru;
  const description =
    (typeof localizedDescription === "string"
      ? localizedDescription
      : localizedDescription?.text) ?? "Проверенный товар из каталога AVERON.";
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={catalogHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-violet-600"
        >
          <ArrowLeft size={16} />
          Назад в каталог
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            {product.images?.length ? (
              product.images.slice(0, 4).map((item, index) => (
                <div
                  key={item.id ?? item.url}
                  className={`relative overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800 ${index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
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
            <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-600">
              AVERON · ПРОВЕРЕНО
            </p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              {title}
            </h1>
            <p className="mt-5 text-2xl font-black">
              {Number(product.salePriceUzs).toLocaleString("ru-RU")} сум
            </p>
            <p className="mt-5 leading-7 text-stone-600 dark:text-stone-300">
              {typeof description === "string"
                ? description
                : "Подробности товара доступны у поддержки."}
            </p>
            {product.variants?.length ? (
              <div className="mt-7">
                <h2 className="text-sm font-bold">Доступные варианты</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <span
                      key={variant.id}
                      className="rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-white/15"
                    >
                      {[variant.color, variant.size]
                        .filter(Boolean)
                        .join(" · ") || "Стандартный"}{" "}
                      · {variant.stock} шт.
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <OrderModal product={product} locale={locale} />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-xl border border-stone-200 p-4 dark:border-white/10">
                <PackageCheck className="text-violet-600" />
                <div>
                  <b className="text-sm">Доставка</b>
                  <p className="mt-1 text-xs text-stone-500">
                    Статус заказа всегда под рукой
                  </p>
                </div>
              </div>
              <Link
                href={`/${locale}/support`}
                className="flex gap-3 rounded-xl border border-stone-200 p-4 dark:border-white/10"
              >
                <Headphones className="text-violet-600" />
                <div>
                  <b className="text-sm">Поддержка</b>
                  <p className="mt-1 text-xs text-stone-500">
                    Поможем с размером и заказом
                  </p>
                </div>
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-stone-500">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Карточка подтверждена администратором
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
