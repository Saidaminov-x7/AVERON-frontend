import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/ru.json";
import { CommerceApiError, loadSimilarProducts } from "@/lib/visual-search";
import { SimilarProducts } from "./SimilarProducts";

const capabilityState = {
  similarProducts: true,
  imageEmbeddings: true,
  visualSearch: false,
};

vi.mock("./useCommerceCapabilities", () => ({
  useCommerceCapabilities: () => capabilityState,
}));

vi.mock("@/lib/visual-search", async () => {
  const original = await vi.importActual<typeof import("@/lib/visual-search")>("@/lib/visual-search");
  return { ...original, loadSimilarProducts: vi.fn() };
});

vi.mock("@/components/commerce/ProductCard", () => ({
  ProductCard: ({ product }: { product: { id: string } }) => <div>{product.id}</div>,
}));

function renderSimilarProducts() {
  return render(
    <NextIntlClientProvider locale="ru" messages={messages}>
      <SimilarProducts slug="coat" locale="ru" />
    </NextIntlClientProvider>,
  );
}

describe("SimilarProducts", () => {
  beforeEach(() => {
    capabilityState.similarProducts = true;
    capabilityState.imageEmbeddings = true;
    vi.mocked(loadSimilarProducts).mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  it("is hidden unless backend capability data confirms both features", () => {
    capabilityState.similarProducts = false;
    const { rerender } = renderSimilarProducts();
    expect(screen.queryByRole("button", { name: "Найти похожие" })).toBeNull();

    capabilityState.similarProducts = true;
    capabilityState.imageEmbeddings = false;
    rerender(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <SimilarProducts slug="coat" locale="ru" />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole("button", { name: "Найти похожие" })).toBeNull();
  });

  it("loads published product cards only after the user activates Find Similar", async () => {
    vi.mocked(loadSimilarProducts).mockResolvedValue({
      items: [{ id: "similar-product", slug: "similar-product", salePriceUzs: 100 }],
      meta: { limit: 8 },
    });
    renderSimilarProducts();

    expect(loadSimilarProducts).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Найти похожие" }));

    await waitFor(() => expect(loadSimilarProducts).toHaveBeenCalledWith("coat"));
    expect(await screen.findByText("similar-product")).toBeInTheDocument();
  });

  it("announces loading and handles empty, unavailable, and retryable backend failures", async () => {
    let resolveRequest: ((value: { items: []; meta: { limit: number } }) => void) | undefined;
    vi.mocked(loadSimilarProducts).mockImplementationOnce(
      () => new Promise((resolve) => { resolveRequest = resolve; }),
    );
    const { rerender } = renderSimilarProducts();
    fireEvent.click(screen.getByRole("button", { name: "Найти похожие" }));
    expect(screen.getByRole("button", { name: "Ищем похожие товары…" })).toBeDisabled();
    resolveRequest?.({ items: [], meta: { limit: 8 } });
    expect(await screen.findByText("Похожие товары не найдены.")).toBeInTheDocument();

    vi.mocked(loadSimilarProducts).mockResolvedValueOnce({
      items: [],
      code: "EMBEDDING_NOT_AVAILABLE",
    });
    fireEvent.click(screen.getByRole("button", { name: "Найти похожие" }));
    expect(await screen.findByText("Для этого товара похожие товары пока недоступны.")).toBeInTheDocument();

    vi.mocked(loadSimilarProducts).mockRejectedValueOnce(new CommerceApiError("VISUAL_SEARCH_UNAVAILABLE"));
    fireEvent.click(screen.getByRole("button", { name: "Найти похожие" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось найти похожие товары. Попробуйте ещё раз.",
    );
    expect(screen.getByRole("button", { name: "Попробовать снова" })).toBeEnabled();
    rerender(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <SimilarProducts slug="coat" locale="ru" />
      </NextIntlClientProvider>,
    );
  });
});
