import { describe, expect, it, vi } from "vitest";
import {
  loadCommerceCapabilities,
  loadSimilarProducts,
  NO_COMMERCE_CAPABILITIES,
  searchProductsByImage,
} from "./visual-search";

describe("commerce visual-search API", () => {
  it("loads only explicitly enabled capability flags", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          visualSearch: true,
          similarProducts: false,
          imageEmbeddings: true,
        }),
        { status: 200 },
      ),
    );

    await expect(loadCommerceCapabilities(fetcher)).resolves.toEqual({
      visualSearch: true,
      similarProducts: false,
      imageEmbeddings: true,
    });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/capabilities$/),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("fails closed when the capability request fails", async () => {
    await expect(
      loadCommerceCapabilities(vi.fn().mockRejectedValue(new Error("offline"))),
    ).resolves.toEqual(NO_COMMERCE_CAPABILITIES);
  });

  it("posts the selected image and optional catalog filters as multipart data", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], meta: { limit: 12 } }), {
        status: 200,
      }),
    );
    const image = new File(["photo"], "coat.webp", { type: "image/webp" });

    const result = await searchProductsByImage(
      image,
      { country: "CN", category: "coats", limit: 12 },
      fetcher,
    );

    expect(result).toEqual({ items: [], meta: { limit: 12 } });
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/products\/visual-search$/);
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const body = init.body as FormData;
    expect(body.get("image")).toBe(image);
    expect(body.get("country")).toBe("CN");
    expect(body.get("category")).toBe("coats");
    expect(body.get("limit")).toBe("12");
  });

  it("surfaces controlled API error codes", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: "EMBEDDING_NOT_AVAILABLE" }), {
        status: 503,
      }),
    );
    const image = new File(["photo"], "coat.jpg", { type: "image/jpeg" });

    await expect(searchProductsByImage(image, {}, fetcher)).rejects.toMatchObject({
      code: "EMBEDDING_NOT_AVAILABLE",
    });
  });

  it("treats unavailable similar-product embeddings as an empty result", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ items: [], code: "EMBEDDING_NOT_AVAILABLE" }),
        { status: 200 },
      ),
    );

    await expect(loadSimilarProducts("red coat", fetcher)).resolves.toEqual({
      items: [],
      code: "EMBEDDING_NOT_AVAILABLE",
    });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/products\/red%20coat\/similar\?limit=8$/),
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
