import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/axios";
import {
  clearRecentlyViewed,
  loadProductRecommendations,
  loadRecentlyViewed,
  recordProductView,
} from "./recommendations";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const recommendation = {
  product: { id: "canonical-1", slug: "canonical-product", salePriceUzs: "125000" },
  reasonCode: "RELATED_CATEGORY",
};

describe("recommendation API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads bounded strategy results from the canonical product endpoint", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [recommendation], meta: { strategy: "RELATED", personalized: false } },
    });

    await expect(loadProductRecommendations("base-product", "related")).resolves.toEqual({
      items: [recommendation],
      meta: { personalized: false },
    });
    expect(api.get).toHaveBeenCalledWith(
      "/api/v1/products/base-product/recommendations",
      { params: { strategy: "related", limit: 8 } },
    );
  });

  it("rejects malformed items instead of passing incomplete product cards to the UI", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [{ product: { id: "fake", slug: "fake", salePriceUzs: null }, reasonCode: "RELATED_CATEGORY" }] },
    });

    await expect(loadRecentlyViewed("current-product")).rejects.toThrow("Invalid recommendation item");
  });

  it("records a real product detail view and lets the current owner clear history", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { recorded: true } });
    vi.mocked(api.delete).mockResolvedValue({ data: { cleared: true } });

    await recordProductView("real-product");
    await clearRecentlyViewed();

    expect(api.post).toHaveBeenCalledWith("/api/v1/recommendations/recently-viewed", { slug: "real-product" });
    expect(api.delete).toHaveBeenCalledWith("/api/v1/recommendations/recently-viewed");
  });
});
