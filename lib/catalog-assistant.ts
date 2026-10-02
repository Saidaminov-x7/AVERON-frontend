import type { StoreProduct } from "./products";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://averon-backend-production-128zjje.up.railway.app"
).replace(/\/+$/, "");

export type SearchOverrides = {
  category?: string | null;
  gender?: "men" | "women" | "kids" | null;
  colors?: string[];
  sizes?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
};

export type AiSearchResult = {
  items: StoreProduct[];
  intent: Record<string, unknown>;
  meta: {
    aiUsed: boolean;
    fallbackUsed: boolean;
    fallbackReason?: string;
  };
};

export type OutfitItem = {
  role: string;
  reason: string;
  product: StoreProduct;
};

export type OutfitResult = {
  items: OutfitItem[];
  totalPriceUzs: string;
  complete: boolean;
  withinBudget: boolean;
  explanation: string;
  meta: AiSearchResult["meta"];
};

export class CatalogAssistantError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "CatalogAssistantError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseProducts(value: unknown): StoreProduct[] {
  if (!Array.isArray(value)) throw new CatalogAssistantError("INVALID_RESPONSE");
  const products = value.filter(
    (item): item is StoreProduct =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.slug === "string" &&
      (typeof item.salePriceUzs === "number" || typeof item.salePriceUzs === "string"),
  );
  if (products.length !== value.length) throw new CatalogAssistantError("INVALID_RESPONSE");
  return products;
}

async function readErrorCode(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && typeof payload.code === "string") return payload.code;
  } catch {
    return "REQUEST_FAILED";
  }
  return "REQUEST_FAILED";
}

async function post(path: string, payload: unknown, fetcher: typeof fetch): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(`${apiBaseUrl}/api/v1/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new CatalogAssistantError("REQUEST_FAILED");
  }
  if (!response.ok) throw new CatalogAssistantError(await readErrorCode(response));
  try {
    return await response.json();
  } catch {
    throw new CatalogAssistantError("INVALID_RESPONSE");
  }
}

export async function searchCatalogWithIntent(
  query: string,
  locale: "ru" | "uz" | "en",
  overrides?: SearchOverrides,
  fetcher: typeof fetch = fetch,
): Promise<AiSearchResult> {
  const payload: unknown = await post("products/ai-search", {
    query,
    locale,
    ...(overrides ? { overrides } : {}),
  }, fetcher);
  if (!isRecord(payload) || !isRecord(payload.meta) || !isRecord(payload.intent)) {
    throw new CatalogAssistantError("INVALID_RESPONSE");
  }
  return {
    items: parseProducts(payload.items),
    intent: payload.intent,
    meta: {
      aiUsed: payload.meta.aiUsed === true,
      fallbackUsed: payload.meta.fallbackUsed === true,
      ...(typeof payload.meta.fallbackReason === "string" ? { fallbackReason: payload.meta.fallbackReason } : {}),
    },
  };
}

export async function requestStyleOutfit(
  prompt: string,
  locale: "ru" | "uz" | "en",
  fetcher: typeof fetch = fetch,
): Promise<OutfitResult> {
  const payload: unknown = await post("style-assistant/outfits", { prompt, locale }, fetcher);
  if (!isRecord(payload) || !Array.isArray(payload.items) || !isRecord(payload.meta)) {
    throw new CatalogAssistantError("INVALID_RESPONSE");
  }
  const items = payload.items.filter(
    (item): item is Record<string, unknown> => isRecord(item),
  ).map((item) => {
    if (typeof item.role !== "string" || typeof item.reason !== "string") {
      throw new CatalogAssistantError("INVALID_RESPONSE");
    }
    const [product] = parseProducts([item.product]);
    return { role: item.role, reason: item.reason, product };
  });
  if (items.length !== payload.items.length || typeof payload.totalPriceUzs !== "string") {
    throw new CatalogAssistantError("INVALID_RESPONSE");
  }
  return {
    items,
    totalPriceUzs: payload.totalPriceUzs,
    complete: payload.complete === true,
    withinBudget: payload.withinBudget === true,
    explanation: typeof payload.explanation === "string" ? payload.explanation : "",
    meta: {
      aiUsed: payload.meta.aiUsed === true,
      fallbackUsed: payload.meta.fallbackUsed === true,
      ...(typeof payload.meta.fallbackReason === "string" ? { fallbackReason: payload.meta.fallbackReason } : {}),
    },
  };
}

export async function loadCompleteTheLook(
  slug: string,
  fetcher: typeof fetch = fetch,
): Promise<OutfitItem[]> {
  let response: Response;
  try {
    response = await fetcher(
      `${apiBaseUrl}/api/v1/products/${encodeURIComponent(slug)}/complete-the-look`,
      { cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
  } catch {
    throw new CatalogAssistantError("REQUEST_FAILED");
  }
  if (!response.ok) throw new CatalogAssistantError(await readErrorCode(response));
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new CatalogAssistantError("INVALID_RESPONSE");
  }
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new CatalogAssistantError("INVALID_RESPONSE");
  }
  return payload.items.map((item) => {
    if (!isRecord(item) || typeof item.role !== "string") {
      throw new CatalogAssistantError("INVALID_RESPONSE");
    }
    const [product] = parseProducts([item.product]);
    return { role: item.role, reason: "", product };
  });
}
