import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { LanguagePicker } from "./Header";
import enMessages from "@/messages/en.json";
import ruMessages from "@/messages/ru.json";
import uzMessages from "@/messages/uz.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ru",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("LanguagePicker accessible name", () => {
  it.each([
    ["ru", ruMessages, `${ruMessages.nav.language}: RU`],
    ["uz", uzMessages, "Til: UZ"],
    ["en", enMessages, "Language: EN"],
  ])("includes the visible %s locale code in the name", (locale, messages, name) => {
    render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <LanguagePicker />
      </NextIntlClientProvider>,
    );

    const selector = screen.getByRole("button", { name });
    expect(selector.querySelector('img')).toHaveAttribute('src', expect.stringContaining(`/flags/${locale === 'en' ? 'us' : locale}.svg`));
    expect(selector).toHaveAccessibleName(name);
  });
});
