import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/ru.json";
import { VisualSearchLauncher } from "./VisualSearchLauncher";

vi.mock("./useCommerceCapabilities", () => ({
  useCommerceCapabilities: () => ({ visualSearch: true, imageEmbeddings: true }),
}));

describe("VisualSearchLauncher", () => {
  it("loads on activation, opens the existing dialog, and restores focus after Escape", async () => {
    render(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <VisualSearchLauncher locale="ru" country="CN" enabled />
      </NextIntlClientProvider>,
    );

    const launcher = screen.getByRole("button", { name: "Поиск по фото" });
    fireEvent.click(launcher);
    expect(launcher).toHaveAttribute("aria-busy", "true");
    expect(launcher.querySelector("svg")).toHaveClass("animate-spin");

    const dialog = await screen.findByRole("dialog", {}, { timeout: 10000 });
    const componentLauncher = screen.getByRole("button", { name: "Поиск по фото" });
    expect(dialog).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => expect(componentLauncher).toHaveFocus());
  });

  it("does not render or load the feature when unavailable", () => {
    render(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <VisualSearchLauncher locale="ru" enabled={false} />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole("button", { name: "Поиск по фото" })).toBeNull();
  });
});
