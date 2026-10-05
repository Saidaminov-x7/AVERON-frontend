import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { externalBaseURL } from "@/lib/axios";
import { SITE_URL } from "@/lib/siteUrl";
import { AddToCart } from "@/components/commerce/AddToCart";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { ProductRichText } from "@/components/commerce/ProductRichText";
import { ProductReviews } from "@/components/commerce/ProductReviews";
import { ProductSizeChart } from "@/components/commerce/ProductSizeChart";
import { CompleteTheLook } from "@/components/commerce/CompleteTheLook";
import { ProductRecommendations } from "@/components/commerce/ProductRecommendations";
import { SimilarProducts } from "@/components/commerce/SimilarProducts";
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

function recommendationScore(current: StoreProduct, candidate: StoreProduct) {
  let score = 0;
  if (current.category?.slug && current.category.slug === candidate.category?.slug) score += 8;
  if (current.country && current.country === candidate.country) score += 2;
  if (current.material && current.material === candidate.material) score += 3;
  const currentAudience = current.attributes?.audience;
  if (typeof currentAudience === "string" && currentAudience === candidate.attributes?.audience) score += 4;
  const sizes = new Set((current.variants ?? []).map(({ size }) => size).filter(Boolean));
  const colors = new Set((current.variants ?? []).map(({ color }) => color).filter(Boolean));
  if ((candidate.variants ?? []).some(({ size }) => size && sizes.has(size))) score += 1;
  if ((candidate.variants ?? []).some(({ color }) => color && colors.has(color))) score += 2;
  return score;
}

function isSemanticallyRelated(current: StoreProduct, candidate: StoreProduct) {
  const sameCategory = Boolean(
    current.category?.slug && current.category.slug === candidate.category?.slug,
  );
  const currentAudience = current.attributes?.audience;
  const normalizedAudience = typeof currentAudience === "string"
    ? currentAudience.trim().toLocaleLowerCase()
    : "";
  const sameAudience = Boolean(
    normalizedAudience &&
    !["all", "everyone", "unisex", "для всех"].includes(normalizedAudience) &&
    normalizedAudience === String(candidate.attributes?.audience ?? "").trim().toLocaleLowerCase(),
  );

  // A matching colour, size or source country alone does not make products similar.
  // Without category/audience metadata it is better to show no fallback section
  // than to disguise the rest of the catalogue as recommendations.
  return sameCategory || sameAudience;
}

async function loadFallbackRecommendations(product: StoreProduct): Promise<StoreProduct[]> {
  try {
    const query = new URLSearchParams({ limit: "24", sort: "newest" });
    const response = await fetch(`${externalBaseURL}/api/v1/products?${query}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return [];
    const payload = await response.json() as { items?: unknown };
    if (!Array.isArray(payload.items)) return [];
    return payload.items
      .filter((candidate): candidate is StoreProduct => isStoreProduct(candidate) && candidate.id !== product.id)
      .filter((candidate) => isSemanticallyRelated(product, candidate))
      .map((candidate) => ({ candidate, score: recommendationScore(product, candidate) }))
      .filter(({ score }) => score >= 3)
      .sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id))
      .slice(0, 8)
      .map(({ candidate }) => candidate);
  } catch {
    return [];
  }
}

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
  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch(
        `${externalBaseURL}/api/v1/products/${encodeURIComponent(identifier)}`,
        { cache: "no-store", signal: AbortSignal.timeout(15000) },
      );
    } catch {
      if (attempt === 1) throw new ProductRequestError("network");
      await new Promise((resolve) => setTimeout(resolve, 300));
      continue;
    }
    if (response.ok || response.status === 404) break;
    if (response.status >= 500 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      continue;
    }
    throw new ProductRequestError("server");
  }
  if (!response) throw new ProductRequestError("network");
  if (response.status === 404) return null;
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

function getProductAttribute(product: StoreProduct, names: string[], locale: string) {
  for (const name of names) {
    const value = product.attributes?.[name];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value !== "object" || value === null || Array.isArray(value)) continue;
    const localized = value as Record<string, unknown>;
    const text = localized[locale] ?? localized.text ?? localized.value;
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return null;
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
    compositionTitle: t("compositionTitle"),
    careTitle: t("careTitle"),
    compositionCareTitle: t("compositionCareTitle"),
    productDetails: t("productDetails"),
    purchaseOptions: t("purchaseOptions"),
    country: t("country"),
    category: t("category"),
    sizes: t("sizes"),
    colors: t("colors"),
    descriptionFallback: t("descriptionFallback"),
    gallery: t("gallery"),
    confirmed: t("confirmed"),
  };
  const catalogQuery = buildCatalogSearchParams(filters).toString();
  const initialOrderNumber = typeof filters.reviewOrderNumber === "string"
    ? filters.reviewOrderNumber
    : undefined;
  const catalogHref = `/${locale}/catalog${catalogQuery ? `?${catalogQuery}` : ""}`;
  const localizedDescription = product.description?.[locale];
  const description = getProductDescription(product, locale) ?? copy.descriptionFallback;
  const composition = getProductAttribute(product, ["composition", "fabricComposition"], locale) ?? product.material?.trim() ?? null;
  const care = getProductAttribute(product, ["careInstructions", "care"], locale);
  const fallbackRecommendations = await loadFallbackRecommendations(product);
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SmartBackButton fallbackHref={catalogHref} />
          <nav aria-label={copy.productDetails} className="hidden min-w-0 items-center gap-2 truncate text-xs text-[var(--color-muted)] sm:flex">
            <Link href={`/${locale}`} className="transition-colors hover:text-[var(--color-text)]">AVERON</Link>
            <span aria-hidden="true">/</span>
            <Link href={catalogHref} className="transition-colors hover:text-[var(--color-text)]">{t("catalog")}</Link>
            {product.category ? (
              <>
                <span aria-hidden="true">/</span>
                <span>{categoryName(product.category, locale)}</span>
              </>
            ) : null}
            <span aria-hidden="true">/</span>
            <span className="truncate text-[var(--color-text)]">{plainTitle}</span>
          </nav>
        </div>
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,.85fr)] lg:gap-10 xl:gap-14">
          <div className="min-w-0">
            <ProductGallery
              images={product.images ?? []}
              productTitle={plainTitle}
              locale={locale}
              label={copy.gallery}
              imageLabels={(product.images ?? []).map((_, index) => t("imageLabel", { index: index + 1 }))}
              previousLabel={t("previousImage")}
              nextLabel={t("nextImage")}
              openImageLabel={t("openImage")}
              closeViewerLabel={t("closeImageViewer")}
              zoomInLabel={t("zoomIn")}
              zoomOutLabel={t("zoomOut")}
            />
          </div>
          <section className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[var(--color-text-secondary)]">
              {copy.verified}
            </p>
            <h1 className="averon-title mt-2 text-2xl leading-tight sm:text-3xl lg:text-[2rem]">
              <ProductRichText content={title} inline />
            </h1>

            {(product.category || product.country) && (
              <section aria-label={copy.productDetails} className="mt-3 flex flex-wrap gap-x-2 text-xs text-[var(--color-text-secondary)]">
                {product.category ? <span>{categoryName(product.category, locale)}</span> : null}
                {product.country ? <><span aria-hidden="true">·</span><span>{product.country}</span></> : null}
              </section>
            )}

            <section aria-labelledby="purchase-options-title" className="mt-5">
              <h2 id="purchase-options-title" className="sr-only">{copy.purchaseOptions}</h2>
              <AddToCart
                productId={product.id}
                productPrice={product.salePriceUzs}
                productCompareAtPrice={product.compareAtPriceUzs}
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

            <p className="mt-5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <CheckCircle2 size={16} className="text-[var(--color-success)]" />
              {copy.confirmed}
            </p>
          </section>
        </div>
      </div>
      <section className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-10">
        <div className="border-t border-[var(--color-border)] pt-8 sm:pt-10">
          <div className={`grid items-start gap-8 ${product.sizeChartType ? 'lg:grid-cols-2 lg:gap-0' : ''}`}>
            <div className={`min-w-0 ${product.sizeChartType ? 'lg:border-r lg:border-[var(--color-border)] lg:pr-8' : ''}`}>
              <article aria-labelledby="product-description-title">
                <h2 id="product-description-title" className="text-xl font-semibold tracking-tight text-[var(--color-text)] sm:text-2xl">
                  {copy.descriptionTitle}
                </h2>
                <div className="mt-4 max-w-[72ch] whitespace-pre-line break-words text-[15px] leading-7 text-[var(--color-text-secondary)]">
                  <ProductRichText content={description} />
                </div>
              </article>
            </div>
            {product.sizeChartType ? (
              <div className="min-w-0 lg:pl-8">
                <ProductSizeChart sizeChartType={product.sizeChartType} locale={locale} title={t("sizeChartTitle")} />
              </div>
            ) : null}
          </div>
          {composition || care ? (
            <section
              className={`mt-8 grid grid-cols-1 border-t border-[var(--color-border)] pt-6 sm:pt-8 ${product.sizeChartType ? 'lg:grid-cols-2' : ''}`}
              aria-label={copy.productDetails}
            >
              <div className={`min-w-0 space-y-5 ${product.sizeChartType ? 'lg:pr-8' : ''}`}>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)] sm:text-xl">
                  {copy.compositionCareTitle}
                </h2>
                {composition ? (
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">{copy.compositionTitle}</h3>
                    <div className="mt-2 max-w-[72ch] break-words [overflow-wrap:anywhere] whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                      <ProductRichText content={composition} />
                    </div>
                  </div>
                ) : null}
                {care ? (
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">{copy.careTitle}</h3>
                    <div className="mt-2 max-w-[72ch] break-words [overflow-wrap:anywhere] whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                      <ProductRichText content={care} />
                    </div>
                  </div>
                ) : null}
              </div>
              {product.sizeChartType ? (
                <div aria-hidden="true" className="hidden min-w-0 lg:block lg:border-l lg:border-[var(--color-border)] lg:pl-8" />
              ) : null}
            </section>
          ) : null}
          <ProductReviews slug={product.slug} routeId={productRouteId(product)} locale={locale} initialOrderNumber={initialOrderNumber} />
          <ProductRecommendations slug={product.slug} locale={locale} fallbackProducts={fallbackRecommendations} />
          <SimilarProducts slug={product.slug} locale={locale} />
          <CompleteTheLook slug={product.slug} locale={locale} />
        </div>
      </section>
    </main>
  );
}
