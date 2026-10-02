import { describe, expect, it, vi } from "vitest";
import {
  loadCompleteTheLook,
  requestStyleOutfit,
  searchCatalogWithIntent,
} from "./catalog-assistant";

const product = { id: "real-product", slug: "real-product", salePriceUzs: "125000" };

describe("catalog assistant API", () => {
  it("sends only the query, locale and explicit filter overrides to backend search", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [product],
      intent: { colors: ["black"] },
      meta: { aiUsed: true, fallbackUsed: false },
    }), { status: 200 }));

    await expect(searchCatalogWithIntent(
      "black shirt",
      "en",
      { colors: [] },
      fetcher,
    )).resolves.toMatchObject({
      items: [product],
      intent: { colors: ["black"] },
      meta: { aiUsed: true, fallbackUsed: false },
    });
    const [url, request] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/products\/ai-search$/);
    expect(JSON.parse(String(request.body))).toEqual({
      query: "black shirt",
      locale: "en",
      overrides: { colors: [] },
    });
    expect(JSON.stringify(request.body)).not.toContain("AI_API_KEY");
  });

  it("preserves explicit provider fallback metadata without treating invented product data as valid", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{ name: "made-up product" }],
      intent: {},
      meta: { aiUsed: false, fallbackUsed: true, fallbackReason: "PROVIDER_NOT_CONFIGURED" },
    }), { status: 200 }));

    await expect(searchCatalogWithIntent("hoodie", "ru", undefined, fetcher)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("returns catalog-hydrated style products and handles controlled feature errors", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{ role: "top", reason: "Published category match.", product }],
      totalPriceUzs: "125000",
      complete: true,
      withinBudget: true,
      explanation: "Catalog products only.",
      meta: { aiUsed: false, fallbackUsed: true },
    }), { status: 200 }));

    await expect(requestStyleOutfit("autumn look", "en", fetcher)).resolves.toMatchObject({
      items: [{ role: "top", product }],
      totalPriceUzs: "125000",
      meta: { fallbackUsed: true },
    });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/style-assistant\/outfits$/),
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );

    const disabled = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "FEATURE_DISABLED" }), { status: 403 }));
    await expect(requestStyleOutfit("look", "en", disabled)).rejects.toMatchObject({ code: "FEATURE_DISABLED" });
  });

  it("loads Complete the Look from the separate complementary endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{ role: "shoes", product }],
    }), { status: 200 }));

    await expect(loadCompleteTheLook("base trousers", fetcher)).resolves.toEqual([
      { role: "shoes", reason: "", product },
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/products\/base%20trousers\/complete-the-look$/),
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
