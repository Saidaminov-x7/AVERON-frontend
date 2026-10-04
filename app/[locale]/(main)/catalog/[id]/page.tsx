import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CheckCircle2, Headphones, MessageCircle, PackageCheck } from "lucide-react";
import { externalBaseURL } from "@/lib/axios";
import { SITE_URL } from "@/lib/siteUrl";
import { AddToCart } from "@/components/commerce/AddToCart";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductRichText } from "@/components/commerce/ProductRichText";
import { ProductReviews } from "@/components/commerce/ProductReviews";
import { ProductSizeChart } from "@/components/commerce/ProductSizeChart";
import { CompleteTheLook } from "@/components/commerce/CompleteTheLook";
import { ProductRecommendations } from "@/components/commerce/ProductRecommendations";
import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import { ProductLoadFailure } from "@/components/commerce/ProductLoadFailure";
import { SmartBackButton } from "@/components/navigation/SmartBackButton";
import {
  buildCatalogSearchParams,
  categoryName,
  productPlainText,
  productRouteId,
  productTitle,
  type StoreProduct,
} from "@/lib/products";

type Filters = Record<string, string | string[] | undefined>;

class ProductRequestError extends Error {
  constructor(public readonly kind: "network" | "server" | "malformed") {
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
  if (response.status === 404) return null;
  if (!response.ok) throw new ProductRequestError("server");
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProductRequestError("malformed");
  }
  if (!isStoreProduct(payload)) throw new ProductRequestError("malformed");
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
  const title = productPlainText(productTitle(product, locale));
  const description = productPlainText(getProductDescription(product, locale) ?? t("seoDescriptionFallback"));
  const routeId = productRouteId(product);
  const canonical = `/${locale}/catalog/${encodeURIComponent(routeId)}`;
  const image = product.images?.[0]?.url;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ru: `/ru/catalog/${encodeURIComponent(routeId)}`,
        uz: `/uz/catalog/${encodeURIComponent(routeId)}`,
        en: `/en/catalog/${encodeURIComponent(routeId)}`,
        'x-default': `/ru/catalog/${encodeURIComponent(routeId)}`,
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
  if (product.publicId && id !== product.publicId) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "string") query.set(key, value);
      else if (Array.isArray(value)) value.forEach((entry) => query.append(key, entry));
    });
    const suffix = query.toString();
    permanentRedirect(`/${locale}/catalog/${encodeURIComponent(product.publicId)}${suffix ? `?${suffix}` : ""}`);
  }
  const title = productTitle(product, locale);
  const plainTitle = productPlainText(title);
  const copy = {
    back: t("back"),
    verified: t("verified"),
    descriptionTitle: t("descriptionTitle"),
    productDetails: t("productDetails"),
    purchaseOptions: t("purchaseOptions"),
    country: t("country"),
    category: t("category"),
    sizes: t("sizes"),
    colors: t("colors"),
    descriptionFallback: t("descriptionFallback"),
    gallery: t("gallery"),
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
  const variantSizes = [...new Set((product.variants ?? []).map(({ size }) => size).filter((size): size is string => Boolean(size)))];
  const variantColors = [...new Set((product.variants ?? []).map(({ color }) => color).filter((color): color is string => Boolean(color)))];
  const productDetails = [
    ...(product.category ? [{ label: copy.category, value: categoryName(product.category, locale) }] : []),
    ...(product.country ? [{ label: copy.country, value: product.country }] : []),
    ...(variantSizes.length ? [{ label: copy.sizes, value: variantSizes.join(" / ") }] : []),
    ...(variantColors.length ? [{ label: copy.colors, value: variantColors.join(", ") }] : []),
  ];
  const productUrl = `${SITE_URL}/${locale}/catalog/${encodeURIComponent(productRouteId(product))}`;
  const canonicalPrice = String(product.salePriceUzs);
  const hasCanonicalPrice = /^\d+(?:\.\d+)?$/.test(canonicalPrice) && Number(canonicalPrice) >= 0;
  const availability = getStructuredAvailability(product);
  const productImages = product.images?.map(({ url }) => url);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: plainTitle,
    ...(typeof localizedDescription === 'string'
      ? { description: productPlainText(localizedDescription) }
      : localizedDescription?.text
        ? { description: productPlainText(localizedDescription.text) }
        : {}),
    ...(productImages?.length ? { image: productImages } : {}),
    sku: product.publicId ?? product.slug,
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
      { '@type': 'ListItem', position: 3, name: plainTitle, item: productUrl },
    ],
  };
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <ProductViewTracker productId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <SmartBackButton fallbackHref={catalogHref} />
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <ProductGallery
              images={product.images ?? []}
              productTitle={plainTitle}
              locale={locale}
              label={copy.gallery}
              imageLabels={(product.images ?? []).map((_, index) => t("imageLabel", { index: index + 1 }))}
            />
          </div>
          <section className="min-w-0 lg:sticky lg:top-24">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-text-secondary)]">
              {copy.verified}
            </p>
            <h1 className="averon-title mt-3 text-3xl leading-tight sm:text-4xl lg:text-[2.65rem]">
              <ProductRichText content={title} inline />
            </h1>

            {productDetails.length > 0 && (
              <section aria-label={copy.productDetails} className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-[var(--color-border)] py-4">
                {productDetails.map(({ label, value }) => (
                  <div key={label} className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[var(--color-muted)]">{label}</p>
                    <p className="mt-1 break-words text-sm font-medium text-[var(--color-text)]">{value}</p>
                  </div>
                ))}
              </section>
            )}

            <section aria-labelledby="purchase-options-title" className="mt-7 rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 sm:p-6">
              <h2 id="purchase-options-title" className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                {copy.purchaseOptions}
              </h2>
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
                className="averon-secondary-button mt-3 h-11 w-full"
              >
                {t("addToOutfit")}
              </Link>
            </section>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <div className="flex min-w-0 gap-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)]">
                  <PackageCheck size={18} className="text-[var(--color-text)]" />
                </span>
                <div>
                  <b className="text-sm text-[var(--color-text)]">{copy.delivery}</b>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                    {copy.orderStatus}
                  </p>
                </div>
              </div>
              <Link
                href={`/${locale}/support`}
                className="flex min-w-0 gap-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] p-4 transition-[background-color,box-shadow] hover:bg-[var(--color-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)]">
                  <Headphones size={18} className="text-[var(--color-text)]" />
                </span>
                <div>
                  <b className="text-sm text-[var(--color-text)]">{copy.support}</b>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                    {copy.supportText}
                  </p>
                </div>
              </Link>
              <Link
                href={`/${locale}/mini-app?product=${encodeURIComponent(product.slug)}#ask`}
                className="flex min-w-0 gap-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] p-4 transition-[background-color,box-shadow] hover:bg-[var(--color-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)]">
                  <MessageCircle size={18} className="text-[var(--color-text)]" />
                </span>
                <div>
                  <b className="text-sm text-[var(--color-text)]">{copy.askProduct}</b>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{copy.askProductText}</p>
                </div>
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <CheckCircle2 size={16} className="text-[var(--color-success)]" />
              {copy.confirmed}
            </p>
          </section>
        </div>
      </div>
      <section
        aria-label={copy.productDetails}
        className="mx-auto mt-4 max-w-[1440px] border-t border-[var(--color-border)] px-4 py-10 sm:px-6 lg:px-10 lg:py-14"
      >
        <div className={product.sizeChartType ? "grid gap-10 lg:grid-cols-2 lg:gap-16" : "max-w-3xl"}>
          <article aria-labelledby="product-description-title">
            <h2 id="product-description-title" className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
              {copy.descriptionTitle}
            </h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--color-text-secondary)]">
              <ProductRichText content={description} />
            </div>
          </article>
          {product.sizeChartType ? (
            <ProductSizeChart sizeChartType={product.sizeChartType} locale={locale} title={t("sizeChartTitle")} />
          ) : null}
        </div>
      </section>
      <div className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6 lg:px-8">
        <ProductReviews slug={product.slug} routeId={productRouteId(product)} locale={locale} initialOrderNumber={initialOrderNumber} />
        <CompleteTheLook slug={product.slug} locale={locale} />
        <ProductRecommendations slug={product.slug} locale={locale} />
      </div>
    </main>
  );
}
