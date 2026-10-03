import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/ru.json";
import { CatalogAssistantError, requestStyleOutfit, searchCatalogWithIntent, loadCompleteTheLook } from "@/lib/catalog-assistant";
import { CatalogAiSearch } from "./CatalogAiSearch";
import { StyleAssistant } from "./StyleAssistant";
import { CompleteTheLook } from "./CompleteTheLook";

const capabilities = {
  aiSearch: true,
  styleAssistant: true,
  completeTheLook: true,
  visualSearch: false,
  similarProducts: false,
  imageEmbeddings: false,
  aiProviderConfigured: true,
};

vi.mock("./useCommerceCapabilities", () => ({
  useCommerceCapabilities: () => capabilities,
}));

vi.mock("@/lib/catalog-assistant", async () => {
  const original = await vi.importActual<typeof import("@/lib/catalog-assistant")>("@/lib/catalog-assistant");
  return {
    ...original,
    searchCatalogWithIntent: vi.fn(),
    requestStyleOutfit: vi.fn(),
    loadCompleteTheLook: vi.fn(),
  };
});

vi.mock("@/components/commerce/ProductCard", () => ({
  ProductCard: ({ product }: { product: { id: string } }) => <div>{product.id}</div>,
}));

function renderWithMessages(component: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="ru" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
}

describe("catalog AI experiences", () => {
  beforeEach(() => {
    capabilities.aiSearch = true;
    capabilities.styleAssistant = true;
    capabilities.completeTheLook = true;
    vi.mocked(searchCatalogWithIntent).mockReset();
    vi.mocked(requestStyleOutfit).mockReset();
    vi.mocked(loadCompleteTheLook).mockReset();
  });

  it("hides AI search unless the backend capability is enabled", () => {
    const { rerender } = renderWithMessages(<CatalogAiSearch locale="ru" enabled={false} providerConfigured={false} />);
    expect(screen.queryByRole("heading", { name: "Умный поиск по каталогу" })).toBeNull();
    rerender(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <CatalogAiSearch locale="ru" enabled providerConfigured={false} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("AI-провайдер не настроен; обычный поиск по каталогу остаётся доступен.")).toBeInTheDocument();
  });

  it("renders real search results and lets customers remove interpreted filters", async () => {
    vi.mocked(searchCatalogWithIntent)
      .mockResolvedValueOnce({
        items: [{ id: "real-shirt", slug: "real-shirt", salePriceUzs: "250000" }],
        intent: { colors: ["black"], maxPrice: 500000 },
        meta: { aiUsed: true, fallbackUsed: false },
      })
      .mockResolvedValueOnce({
        items: [{ id: "real-shirt", slug: "real-shirt", salePriceUzs: "250000" }],
        intent: { maxPrice: 500000 },
        meta: { aiUsed: true, fallbackUsed: false },
      });
    renderWithMessages(<CatalogAiSearch locale="ru" enabled providerConfigured />);
    fireEvent.change(screen.getByRole("textbox", { name: "Умный поиск по каталогу" }), {
      target: { value: "черная худи до 500 000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Найти товары" }));
    expect(await screen.findByText("real-shirt")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Убрать фильтр: black" }));
    await waitFor(() => expect(searchCatalogWithIntent).toHaveBeenLastCalledWith(
      "черная худи до 500 000",
      "ru",
      expect.objectContaining({ colors: [] }),
    ));
    expect(screen.queryByRole("button", { name: "Убрать фильтр: black" })).toBeNull();
  });

  it("presents a truthful provider fallback in the style assistant", async () => {
    vi.mocked(requestStyleOutfit).mockResolvedValue({
      items: [{ role: "top", reason: "Published category.", product: { id: "published-top", slug: "published-top", salePriceUzs: "100000" } }],
      totalPriceUzs: "100000",
      complete: false,
      withinBudget: true,
      explanation: "Eligible catalog picks.",
      meta: { aiUsed: false, fallbackUsed: true, fallbackReason: "PROVIDER_NOT_CONFIGURED" },
    });
    renderWithMessages(<StyleAssistant locale="ru" enabled />);
    fireEvent.click(screen.getByRole("button", { name: "Образ на осень" }));

    expect(await screen.findByText("published-top")).toBeInTheDocument();
    expect(screen.getByText(/AI-разбор недоступен/)).toBeInTheDocument();
    expect(requestStyleOutfit).toHaveBeenCalledWith("Образ на осень", "ru");
  });

  it("keeps Complete the Look hidden when its feature flag is off", () => {
    capabilities.completeTheLook = false;
    renderWithMessages(<CompleteTheLook slug="base" locale="ru" />);
    expect(screen.queryByRole("heading", { name: "Дополните образ" })).toBeNull();
  });

  it("loads complementary items separately from similar products", async () => {
    capabilities.completeTheLook = true;
    vi.mocked(loadCompleteTheLook).mockResolvedValue([
      { role: "shoes", reason: "", product: { id: "complementary-shoes", slug: "shoes", salePriceUzs: "300000" } },
    ]);
    renderWithMessages(<CompleteTheLook slug="base-trousers" locale="ru" />);
    fireEvent.click(screen.getByRole("button", { name: "Подобрать сочетания" }));

    expect(await screen.findByText("complementary-shoes")).toBeInTheDocument();
    expect(loadCompleteTheLook).toHaveBeenCalledWith("base-trousers");
  });

  it("reports a controlled disabled state if a capability changes after page load", async () => {
    vi.mocked(requestStyleOutfit).mockRejectedValue(new CatalogAssistantError("FEATURE_DISABLED"));
    renderWithMessages(<StyleAssistant locale="ru" enabled />);
    fireEvent.click(screen.getByRole("button", { name: "Образ на осень" }));
    expect(await screen.findByText("Не удалось подобрать образ. Попробуйте позже.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
