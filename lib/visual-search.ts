import type { StoreProduct } from "@/lib/products";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://averon-backend-production-128zjje.up.railway.app"
).replace(/\/+$/, "");

export type CommerceCapabilities = {
  visualSearch: boolean;
  similarProducts: boolean;
  imageEmbeddings: boolean;
};

export const NO_COMMERCE_CAPABILITIES: CommerceCapabilities = {
  visualSearch: false,
  similarProducts: false,
  imageEmbeddings: false,
};

export type ProductEnvelope = {
  items: StoreProduct[];
  meta?: { limit: number };
  code?: string;
};

export class CommerceApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "CommerceApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseItems(value: unknown): StoreProduct[] | null {
  if (!Array.isArray(value)) return null;
  const products = value.filter(
    (item): item is StoreProduct =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.slug === "string" &&
      "salePriceUzs" in item,
  );
  return products.length === value.length ? products : null;
}

export async function loadCommerceCapabilities(
  fetcher: typeof fetch = fetch,
): Promise<CommerceCapabilities> {
  try {
    const response = await fetcher(`${apiBaseUrl}/api/v1/capabilities`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return NO_COMMERCE_CAPABILITIES;
    const payload: unknown = await response.json();
    if (!isRecord(payload)) return NO_COMMERCE_CAPABILITIES;
    return {
      visualSearch: payload.visualSearch === true,
      similarProducts: payload.similarProducts === true,
      imageEmbeddings: payload.imageEmbeddings === true,
    };
  } catch {
    return NO_COMMERCE_CAPABILITIES;
  }
}

async function readErrorCode(response: Response) {
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && typeof payload.code === "string") {
      return payload.code;
    }
  } catch {
    // Non-JSON failures are represented by a generic code.
  }
  return "REQUEST_FAILED";
}

function parseEnvelope(payload: unknown): ProductEnvelope | null {
  if (!isRecord(payload)) return null;
  const items = parseItems(payload.items);
  if (!items) return null;
  const meta = isRecord(payload.meta) ? payload.meta : null;
  if (!meta || typeof meta.limit !== "number" || !Number.isFinite(meta.limit)) {
    return null;
  }
  return { items, meta: { limit: meta.limit } };
}

export async function searchProductsByImage(
  image: File,
  options: { country?: string; category?: string; limit?: number } = {},
  fetcher: typeof fetch = fetch,
): Promise<ProductEnvelope> {
  const formData = new FormData();
  formData.append("image", image);
  if (options.country) formData.append("country", options.country);
  if (options.category) formData.append("category", options.category);
  formData.append("limit", String(options.limit ?? 24));

  const response = await fetcher(`${apiBaseUrl}/api/v1/products/visual-search`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new CommerceApiError(await readErrorCode(response));

  const envelope = parseEnvelope(await response.json());
  if (!envelope) throw new CommerceApiError("INVALID_RESPONSE");
  return envelope;
}

export async function loadSimilarProducts(
  slug: string,
  fetcher: typeof fetch = fetch,
): Promise<ProductEnvelope> {
  const response = await fetcher(
    `${apiBaseUrl}/api/v1/products/${encodeURIComponent(slug)}/similar?limit=8`,
    { cache: "no-store" },
  );
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    let code = "REQUEST_FAILED";
    if (isRecord(payload) && typeof payload.code === "string") code = payload.code;
    throw new CommerceApiError(code);
  }
  if (
    isRecord(payload) &&
    payload.code === "EMBEDDING_NOT_AVAILABLE" &&
    Array.isArray(payload.items) &&
    payload.items.length === 0
  ) {
    return { items: [], code: "EMBEDDING_NOT_AVAILABLE" };
  }
  const envelope = parseEnvelope(payload);
  if (!envelope) throw new CommerceApiError("INVALID_RESPONSE");
  return envelope;
}
