import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://averon.uz").replace(/\/+$/, "");

class ProductRequestError extends Error {
  constructor(public readonly kind: "network" | "server") {
    super(kind);
    this.name = "ProductRequestError";
  }
}

type ProductDetail = StoreProduct;

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

function getProductDescription(product: StoreProduct, locale: string) {
  const localizedDescription = product.description?.[locale];
  const description = typeof localizedDescription === "string"
    ? localizedDescription
    : localizedDescription?.text;
  return description?.trim() || null;
}

function getStructuredAvailability(product: StoreProduct) {
  if (product.availability) {
    if (product.availability.inStock) return "https://schema.org/InStock";
    if (product.availability.preorderEligible && product.availability.preorderAvailable > 0) {
      return "https://schema.org/PreOrder";
    }
    return "https://schema.org/OutOfStock";
  }
  if (product.available === false) return "https://schema.org/OutOfStock";
  if (product.available === true && typeof product.stock === "number" && product.stock > 0) {
    return "https://schema.org/InStock";
  }
  return undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "productDetail" });
  let product: StoreProduct | null = null;
  try {
    product = await loadProduct(id);
  } catch {
    return { title: "AVERON", robots: { index: false, follow: true } };
  }
  if (!product) return { title: "AVERON", robots: { index: false, follow: true } };
  const title = productTitle(product, locale);
  const description = getProductDescription(product, locale) ?? t("seoDescriptionFallback");
  const canonical = `/${locale}/catalog/${encodeURIComponent(product.slug)}`;
  const image = product.images?.[0]?.url;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ru: `/ru/catalog/${encodeURIComponent(product.slug)}`,
        uz: `/uz/catalog/${encodeURIComponent(product.slug)}`,
        en: `/en/catalog/${encodeURIComponent(product.slug)}`,
        'x-default': `/ru/catalog/${encodeURIComponent(product.slug)}`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<Filters>;
}) {
  const [{ id, locale }, filters] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "productDetail" });
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
    back: t("back"),
    verified: t("verified"),
    descriptionFallback: t("descriptionFallback"),
    gallery: t("gallery"),
    imageLabel: (index: number) => t("imageLabel", { index }),
    delivery: t("delivery"),
    orderStatus: t("orderStatus"),
    support: t("support"),
    supportText: t("supportText"),
    askProduct: t("askProduct"),
    askProductText: t("askProductText"),
    confirmed: t("confirmed"),
  };
  const catalogQuery = buildCatalogSearchParams(filters).toString();
  const initialOrderNumber = typeof filters.reviewOrderNumber === "string"
    ? filters.reviewOrderNumber
    : undefined;
  const catalogHref = `/${locale}/catalog${catalogQuery ? `?${catalogQuery}` : ""}`;
  const localizedDescription = product.description?.[locale];
  const description = getProductDescription(product, locale) ?? copy.descriptionFallback;
  const productUrl = `${SITE_URL}/${locale}/catalog/${encodeURIComponent(product.slug)}`;
  const canonicalPrice = String(product.salePriceUzs);
  const hasCanonicalPrice = /^\d+(?:\.\d+)?$/.test(canonicalPrice) && Number(canonicalPrice) >= 0;
  const availability = getStructuredAvailability(product);
  const productImages = product.images?.map(({ url }) => url);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    ...(typeof localizedDescription === 'string'
      ? { description: localizedDescription }
      : localizedDescription?.text
        ? { description: localizedDescription.text }
        : {}),
    ...(productImages?.length ? { image: productImages } : {}),
    sku: product.slug,
    ...(hasCanonicalPrice ? { offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'UZS',
      price: canonicalPrice,
      ...(availability ? { availability } : {}),
    } } : {}),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AVERON', item: `${SITE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: t("catalog"), item: `${SITE_URL}/${locale}/catalog` },
      { '@type': 'ListItem', position: 3, name: title, item: productUrl },
    ],
  };
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
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
              {description}
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
              {t("addToOutfit")}
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
