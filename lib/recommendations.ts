import api from "@/lib/axios";
import type { StoreProduct } from "@/lib/products";

export type Recommendation = {
  product: StoreProduct;
  reasonCode: string;
};

type RecommendationResponse = {
  items: Recommendation[];
  meta?: { personalized?: boolean; fallbackUsed?: boolean };
};

function parseResponse(value: unknown): RecommendationResponse {
  if (typeof value !== "object" || value === null || !("items" in value) || !Array.isArray(value.items)) {
    throw new Error("Invalid recommendation response");
  }
  const items = value.items.flatMap((item): Recommendation[] => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("product" in item) ||
      typeof item.product !== "object" ||
      item.product === null ||
      !("id" in item.product) ||
      typeof item.product.id !== "string" ||
      !("slug" in item.product) ||
      typeof item.product.slug !== "string" ||
      !("salePriceUzs" in item.product) ||
      (typeof item.product.salePriceUzs !== "string" && typeof item.product.salePriceUzs !== "number") ||
      !("reasonCode" in item) ||
      typeof item.reasonCode !== "string"
    ) return [];
    return [{ product: item.product as StoreProduct, reasonCode: item.reasonCode }];
  });
  if (items.length !== value.items.length) throw new Error("Invalid recommendation item");
  const meta = "meta" in value && typeof value.meta === "object" && value.meta !== null
    ? value.meta
    : undefined;
  return {
    items,
    meta: meta && "personalized" in meta && typeof meta.personalized === "boolean"
      ? { personalized: meta.personalized }
      : undefined,
  };
}

export async function loadProductRecommendations(
  slug: string,
  strategy: "related" | "you-may-also-like" | "personalized",
): Promise<RecommendationResponse> {
  const { data } = await api.get<unknown>(
    `/api/v1/products/${encodeURIComponent(slug)}/recommendations`,
    { params: { strategy, limit: 8 } },
  );
  return parseResponse(data);
}

export async function recordProductView(slug: string): Promise<void> {
  await api.post("/api/v1/recommendations/recently-viewed", { slug });
}

export async function loadRecentlyViewed(excludeSlug: string): Promise<Recommendation[]> {
  const { data } = await api.get<unknown>("/api/v1/recommendations/recently-viewed", {
    params: { limit: 8, exclude: excludeSlug },
  });
  return parseResponse(data).items;
}

export async function clearRecentlyViewed(): Promise<void> {
  await api.delete("/api/v1/recommendations/recently-viewed");
}
