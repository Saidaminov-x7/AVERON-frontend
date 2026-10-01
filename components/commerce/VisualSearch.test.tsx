import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/ru.json";
import { VisualSearch } from "./VisualSearch";

const capabilities = {
  visualSearch: true,
  similarProducts: true,
  imageEmbeddings: true,
};

vi.mock("./useCommerceCapabilities", () => ({
  useCommerceCapabilities: () => capabilities,
}));

function renderSearch() {
  return render(
    <NextIntlClientProvider locale="ru" messages={messages}>
      <VisualSearch locale="ru" country="CN" category="outerwear" />
    </NextIntlClientProvider>,
  );
}

describe("VisualSearch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:photo-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not show the entry point when the capability is disabled", () => {
    capabilities.visualSearch = false;
    renderSearch();
    expect(screen.queryByRole("button", { name: "Поиск по фото" })).toBeNull();
    capabilities.visualSearch = true;
  });

  it("rejects unsupported images and images larger than 10 MB", () => {
    const { container } = renderSearch();
    fireEvent.click(screen.getByRole("button", { name: "Поиск по фото" }));
    const [gallery] = container.querySelectorAll<HTMLInputElement>('input[type="file"]');

    fireEvent.change(gallery, {
      target: { files: [new File(["gif"], "photo.gif", { type: "image/gif" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("JPEG, PNG или WEBP");

    fireEvent.change(gallery, {
      target: {
        files: [
          new File(
            [new Uint8Array(10 * 1024 * 1024 + 1)],
            "large.png",
            { type: "image/png" },
          ),
        ],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("не должен превышать 10 МБ");
  });

  it("previews, uploads, and removes a supported photo", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ items: [], meta: { limit: 24 } }),
        { status: 200 },
      ),
    );
    const { container } = renderSearch();
    fireEvent.click(screen.getByRole("button", { name: "Поиск по фото" }));
    const [gallery] = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const image = new File(["webp"], "coat.webp", { type: "image/webp" });
    fireEvent.change(gallery, { target: { files: [image] } });

    expect(screen.getByAltText("Предпросмотр выбранного фото")).toHaveAttribute(
      "src",
      "blob:photo-preview",
    );
    fireEvent.click(screen.getByRole("button", { name: "Найти" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/products\/visual-search$/);
    expect((options.body as FormData).get("image")).toBe(image);
    expect((options.body as FormData).get("country")).toBe("CN");
    expect((options.body as FormData).get("category")).toBe("outerwear");
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("не найдены"));

    fireEvent.click(screen.getByRole("button", { name: "Удалить фото" }));
    expect(screen.queryByAltText("Предпросмотр выбранного фото")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:photo-preview");
  });

  it("closes on Escape and restores focus to the entry point", async () => {
    renderSearch();
    const open = screen.getByRole("button", { name: "Поиск по фото" });
    fireEvent.click(open);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(open).toHaveFocus());
  });
});
