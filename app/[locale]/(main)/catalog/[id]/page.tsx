import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Headphones, MessageCircle, PackageCheck } from "lucide-react";
import { externalBaseURL } from "@/lib/axios";
import { AddToCart } from "@/components/commerce/AddToCart";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductReviews } from "@/components/commerce/ProductReviews";
import { SimilarProducts } from "@/components/commerce/SimilarProducts";
import { CompleteTheLook } from "@/components/commerce/CompleteTheLook";
import { ProductRecommendations } from "@/components/commerce/ProductRecommendations";
import { ProductLoadFailure } from "@/components/commerce/ProductLoadFailure";
import { SmartBackButton } from "@/components/navigation/SmartBackButton";
import {
  buildCatalogSearchParams,
  productTitle,
  type StoreProduct,
} from "@/lib/products";

type Filters = Record<string, string | string[] | undefined>;

class ProductRequestError extends Error {
  constructor(public readonly kind: "network" | "server") {
    super(kind);
    this.name = "ProductRequestError";
  }
}

type ProductDetail = StoreProduct & {
  description?: Record<string, string | { text?: string }>;
};

function isStoreProduct(value: unknown): value is ProductDetail {
  if (typeof value !== "object" || value === null) return false;
  const product = value as Record<string, unknown>;
  if (
    typeof product.id !== "string" ||
    typeof product.slug !== "string" ||
    !["string", "number"].includes(typeof product.salePriceUzs)
  ) return false;
  if (product.images !== undefined && (
    !Array.isArray(product.images) ||
    product.images.some((image) =>
      typeof image !== "object" || image === null || typeof (image as Record<string, unknown>).url !== "string",
    )
  )) return false;
  if (product.variants !== undefined && (
    !Array.isArray(product.variants) ||
    product.variants.some((variant) =>
      typeof variant !== "object" || variant === null || typeof (variant as Record<string, unknown>).id !== "string",
    )
  )) return false;
  if (product.description !== undefined && product.description !== null && (
    typeof product.description !== "object" || Array.isArray(product.description)
  )) return false;
  return true;
}

async function loadProduct(slug: string): Promise<ProductDetail | null> {
  let identifier: string;
  try {
    identifier = decodeURIComponent(slug);
  } catch {
    return null;
  }
  let response: Response;
  try {
    response = await fetch(
      `${externalBaseURL}/api/v1/products/${encodeURIComponent(identifier)}`,
      { cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
  } catch {
    throw new ProductRequestError("network");
  }
  if (response.status === 404 || (response.status >= 400 && response.status < 500)) return null;
  if (!response.ok) throw new ProductRequestError("server");
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProductRequestError("server");
  }
  if (!isStoreProduct(payload)) throw new ProductRequestError("server");
  return payload;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  let product: StoreProduct | null = null;
  try {
    product = await loadProduct(id);
  } catch {
    return { title: "AVERON" };
  }
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
  let product: ProductDetail | null;
  try {
    product = await loadProduct(id);
  } catch (error) {
    const kind = error instanceof ProductRequestError ? error.kind : "server";
    const catalogQuery = buildCatalogSearchParams(filters).toString();
    return (
      <ProductLoadFailure
        locale={locale}
        kind={kind}
        catalogHref={`/${locale}/catalog${catalogQuery ? `?${catalogQuery}` : ""}`}
      />
    );
  }
  if (!product) notFound();
  const title = productTitle(product, locale);
  const copy = {
    ru: {
      back: "Назад в каталог",
      verified: "AVERON · ПРОВЕРЕНО",
      descriptionFallback: "Проверенный товар из каталога AVERON.",
      descriptionUnavailable: "Подробности товара доступны у поддержки.",
      gallery: "Фотографии товара",
      imageLabel: (index: number) => `Показать фото ${index}`,
      delivery: "Доставка",
      orderStatus: "Статус заказа всегда под рукой",
      support: "Поддержка",
      supportText: "Поможем с размером и товаром",
      askProduct: "Задать вопрос о товаре",
      askProductText: "Размер, цвет, наличие и доставка",
      confirmed: "Карточка подтверждена администратором",
    },
    uz: {
      back: "Katalogga qaytish",
      verified: "AVERON · TEKSHIRILGAN",
      descriptionFallback: "AVERON katalogidagi tekshirilgan mahsulot.",
      descriptionUnavailable: "Mahsulot tafsilotlarini yordam xizmatidan olishingiz mumkin.",
      gallery: "Mahsulot rasmlari",
      imageLabel: (index: number) => `${index}-rasmni ko‘rsatish`,
      delivery: "Yetkazib berish",
      orderStatus: "Buyurtma holati doimo yoningizda",
      support: "Yordam",
      supportText: "O‘lcham va mahsulot bo‘yicha yordam beramiz",
      askProduct: "Mahsulot haqida savol berish",
      askProductText: "O‘lcham, rang, mavjudlik va yetkazib berish",
      confirmed: "Mahsulot sahifasi administrator tomonidan tasdiqlangan",
    },
    en: {
      back: "Back to catalog",
      verified: "AVERON · VERIFIED",
      descriptionFallback: "A verified product from the AVERON catalog.",
      descriptionUnavailable: "Contact support for more product details.",
      gallery: "Product images",
      imageLabel: (index: number) => `Show image ${index}`,
      delivery: "Delivery",
      orderStatus: "Keep your order status close at hand",
      support: "Support",
      supportText: "Get help with sizing and product details",
      askProduct: "Ask about this product",
      askProductText: "Size, color, availability, and delivery",
      confirmed: "Product listing verified by an administrator",
    },
  }[locale as "ru" | "uz" | "en"] ?? {
    back: "Назад в каталог",
    verified: "AVERON · ПРОВЕРЕНО",
    descriptionFallback: "Проверенный товар из каталога AVERON.",
    descriptionUnavailable: "Подробности товара доступны у поддержки.",
    gallery: "Фотографии товара",
    imageLabel: (index: number) => `Показать фото ${index}`,
    delivery: "Доставка",
    orderStatus: "Статус заказа всегда под рукой",
    support: "Поддержка",
    supportText: "Поможем с размером и товаром",
    askProduct: "Задать вопрос о товаре",
    askProductText: "Размер, цвет, наличие и доставка",
    confirmed: "Карточка подтверждена администратором",
  };
  const catalogQuery = buildCatalogSearchParams(filters).toString();
  const initialOrderNumber = typeof filters.reviewOrderNumber === "string"
    ? filters.reviewOrderNumber
    : undefined;
  const catalogHref = `/${locale}/catalog${catalogQuery ? `?${catalogQuery}` : ""}`;
  const localizedDescription = product.description?.[locale] ?? product.description?.ru;
  const description =
    (typeof localizedDescription === "string"
      ? localizedDescription
      : localizedDescription?.text) ?? copy.descriptionFallback;
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <SmartBackButton fallbackHref={catalogHref} />
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <ProductGallery
            images={product.images ?? []}
            productTitle={title}
            locale={locale}
            label={copy.gallery}
            imageLabel={copy.imageLabel}
          />
          <section>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-700 dark:text-primary-300">
              {copy.verified}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              {title}
            </h1>
            <p className="mt-5 leading-7 text-stone-600 dark:text-stone-300">
              {typeof description === "string"
                ? description
                : copy.descriptionUnavailable}
            </p>
            <AddToCart
              productId={product.id}
              productPrice={product.salePriceUzs}
              productStock={product.stock}
              productAvailable={product.available}
              productAvailability={product.availability}
              variants={product.variants ?? []}
            />
            <Link
              href={`/${locale}/outfits?product=${encodeURIComponent(product.slug)}`}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-primary-700 px-4 text-sm font-bold text-primary-800 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-200 dark:hover:bg-primary-950/30"
            >
              {locale === "uz" ? "Obrazga qo‘shish" : locale === "en" ? "Add to outfit" : "Добавить в образ"}
            </Link>
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
              <Link
                href={`/${locale}/mini-app?product=${encodeURIComponent(product.slug)}#ask`}
                className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:border-white/10 dark:bg-stone-900"
              >
                <MessageCircle className="text-primary-700 dark:text-primary-300" />
                <div>
                  <b className="text-sm">{copy.askProduct}</b>
                  <p className="mt-1 text-xs text-stone-500">{copy.askProductText}</p>
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
        <ProductReviews slug={product.slug} locale={locale} initialOrderNumber={initialOrderNumber} />
        <SimilarProducts slug={product.slug} locale={locale} />
        <CompleteTheLook slug={product.slug} locale={locale} />
        <ProductRecommendations slug={product.slug} locale={locale} />
      </div>
    </main>
  );
}
