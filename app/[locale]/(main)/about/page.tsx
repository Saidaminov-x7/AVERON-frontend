import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Globe2,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from 'next';

const icons = [Search, ShieldCheck, PackageCheck];
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'aboutPage' });
  return { title: t('title') };
}
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  const steps = [
    [t("step1Title"), t("step1Text")],
    [t("step2Title"), t("step2Text")],
    [t("step3Title"), t("step3Text")],
  ];
  const benefits = [t("benefit1"), t("benefit2"), t("benefit3"), t("benefit4")];
  const countries = [
    t("countryChina"),
    t("countryUsa"),
    t("countryUk"),
    t("countryItaly"),
    t("countryTurkey"),
  ];
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-14">
          <div className="py-2">
            <p className="averon-kicker">{t("eyebrow")}</p>
            <h1 className="averon-title mt-5 max-w-3xl text-4xl leading-[1.08] sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg sm:leading-8">
              {t("intro")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/catalog`} className="averon-primary-button">
                {t("catalog")} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href={`/${locale}/ai`} className="averon-secondary-button">
                {t("ai")}
              </Link>
            </div>
          </div>

          <aside className="averon-panel overflow-hidden p-5 sm:p-7" aria-label={t("journeyTitle")}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-text)]">
                <Globe2 size={19} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t("journeyTitle")}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{t("marketsTitle")}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {countries.map((country) => (
                <span
                  key={country}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]"
                >
                  {country}
                </span>
              ))}
            </div>

            <div className="my-6 h-px bg-[var(--color-border)]" />
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="min-w-0">
                <Globe2 className="mb-3 text-[var(--color-muted)]" size={19} aria-hidden="true" />
                <p className="text-sm font-semibold">{t("journeyFrom")}</p>
              </div>
              <div className="flex flex-col items-center gap-2 text-[var(--color-muted)]">
                <ArrowDown size={17} aria-hidden="true" />
                <span className="h-7 w-px bg-[var(--color-border)]" />
                <ArrowDown size={17} aria-hidden="true" />
              </div>
              <div className="min-w-0 text-right">
                <MapPin className="mb-3 ml-auto text-[var(--color-muted)]" size={19} aria-hidden="true" />
                <p className="text-sm font-semibold">{t("journeyTo")}</p>
              </div>
            </div>
            <div className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-surface-soft)] px-4 py-3 text-center text-xs font-bold tracking-[.18em]">
              AVERON
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="averon-kicker">{t("howEyebrow")}</p>
            <h2 className="averon-title mt-3 text-2xl sm:text-3xl">{t("howItWorks")}</h2>
          </div>
          <span className="hidden text-xs text-[var(--color-muted)] sm:block">01 — 03</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map(([title, text], i) => {
            const Icon = icons[i];
            return (
              <article
                key={title}
                className="averon-panel p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-[var(--color-muted)]">0{i + 1}</span>
                </div>
                <h3 className="averon-title mt-6 text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{text}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="max-w-xl">
            <p className="averon-kicker">{t("principle")}</p>
            <h2 className="averon-title mt-3 text-3xl sm:text-4xl">{t("principleTitle")}</h2>
            <p className="mt-4 leading-7 text-[var(--color-text-secondary)]">
              {t("principleText")}
            </p>
          </div>
          <ul className="averon-panel grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {benefits.map((x) => (
              <li key={x} className="flex items-start gap-3 text-sm font-medium">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--color-text-secondary)]" size={18} aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-[var(--color-border)] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="averon-title text-2xl">{t("cta")}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{t("ctaText")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}/catalog`} className="averon-primary-button">
              {t("catalog")} <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/ai`} className="averon-secondary-button">
              {t("ai")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
