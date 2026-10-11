"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, Send } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { NavLink } from "@/lib/siteSettings";

const BUYER_LINKS = [
  ["links.catalog", "/catalog"],
  ["links.favorites", "/favorites"],
  ["links.compare", "/compare"],
  ["links.howToOrder", "/how-to-order"],
] as const;
const HELP_LINKS = [
  ["help.ai", "/ai"],
  ["help.faq", "/faq"],
  ["help.about", "/about"],
] as const;
const DOCUMENT_LINKS = [
  ["documents.terms", "/terms"],
  ["documents.privacy", "/privacy"],
  ["documents.offer", "/public-offer"],
  ["documents.delivery", "/delivery"],
  ["documents.returns", "/returns"],
] as const;

export function Footer({ locale: localeProp }: { locale?: string } = {}) {
  const locale = useLocale() || localeProp || "ru";
  const t = useTranslations("footer");
  const { data: settings } = useSiteSettings();
  const configuredFooterLinks = Array.isArray(settings?.navLinks)
    ? settings.navLinks
        .filter((item: NavLink) => item && item.position === "footer" && item.label && (item.href || item.url))
        .map((item: NavLink) => [
          typeof item.label === "object"
            ? item.label[locale] || item.label.en || item.label.uz || item.label.ru
            : String(item.label),
          String(item.href || item.url),
        ] as const)
    : [];

  const col = (
    title: string,
    links: readonly (readonly [string, string])[],
  ) => (
    <div className="min-w-0">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--color-text-secondary)] sm:mb-3">
        {title}
      </h2>
      <ul className="space-y-1">
        {links.map(([key, href]) => (
          <li key={href}>
            <Link
              className="flex min-h-11 items-center py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              href={href.startsWith("http") ? href : `/${locale}${href}`}
            >
              {key}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const buyerLinks = configuredFooterLinks.length
    ? configuredFooterLinks.map(([label, href]) => [label, href] as const)
    : BUYER_LINKS.map(([key, href]) => [t(key), href] as const);
  const helpLinks = HELP_LINKS.map(([key, href]) => [t(key), href] as const);
  const documentLinks = DOCUMENT_LINKS.map(([key, href]) => [t(key), href] as const);

  return (
    <footer className="w-full border-t border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]">
      <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-12 sm:pb-[calc(3rem+env(safe-area-inset-bottom))] lg:px-8">
        <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-[1.25fr_repeat(3,1fr)] lg:gap-10">
          <div className="min-w-0">
            <Link
              href={`/${locale}`}
              className="inline-flex min-h-11 items-center text-xl font-black tracking-[.18em] text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              AVERON
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]">
              {t("description")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ThemeToggle />
              <a
                href="https://t.me/averon_fashion"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Send className="mr-2 shrink-0" size={15} />
                {t("channel")}
              </a>
              <a
                href="https://t.me/averon_fashion_admin"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <MessageCircle className="mr-2 shrink-0" size={15} />
                {t("support")}
              </a>
            </div>
            {(settings?.contactEmail || settings?.contactPhone) && (
              <div className="mt-3 space-y-1 text-sm text-[var(--color-text-secondary)]">
                {settings.contactEmail && (
                  <a className="flex min-h-11 items-center break-all text-[var(--color-text-secondary)]" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                )}
                {settings.contactPhone && (
                  <a className="flex min-h-11 items-center text-[var(--color-text-secondary)]" href={`tel:${settings.contactPhone.replace(/[^+\d]/g, '')}`}>{settings.contactPhone}</a>
                )}
              </div>
            )}
          </div>
          {col(t("buyers"), buyerLinks)}
          {col(t("helpTitle"), helpLinks)}
          {col(t("documentsTitle"), documentLinks)}
        </div>
        <div className="mt-6 flex flex-col justify-between gap-2 border-t border-[var(--color-border)] pt-4 text-xs leading-5 text-[var(--color-text-secondary)] sm:mt-8 sm:flex-row sm:gap-4 sm:pt-5">
          <p>
            © {new Date().getFullYear()} AVERON. {t("rights")}
          </p>
          <p>{t("country")}</p>
        </div>
      </div>
    </footer>
  );
}
