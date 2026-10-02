import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, PackageCheck, Search, ShieldCheck } from "lucide-react";

const icons = [Search, ShieldCheck, PackageCheck];
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
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-stone-200 bg-[#f1eadf] px-6 py-14 dark:border-white/10 dark:bg-stone-900 sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-700">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl leading-7 text-stone-600 dark:text-stone-300">
            {t("intro")}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map(([title, text], i) => {
            const Icon = icons[i];
            return (
              <article
                key={title}
                className="rounded-2xl border border-stone-200 bg-white p-7 dark:border-white/10 dark:bg-stone-900"
              >
                <Icon className="text-primary-700" />
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">{text}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-700">
              {t("principle")}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">{t("principleTitle")}</h2>
            <p className="mt-4 leading-7 text-stone-600 dark:text-stone-300">
              {t("principleText")}
            </p>
          </div>
          <ul className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-stone-900">
            {benefits.map((x) => (
              <li key={x} className="flex gap-3 font-semibold">
                <CheckCircle2 className="text-primary-700" size={19} />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-14 rounded-2xl bg-stone-950 p-8 text-white dark:bg-white dark:text-stone-950 sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t("cta")}</h2>
            <p className="mt-2 text-sm opacity-70">{t("ctaText")}</p>
          </div>
          <div className="mt-5 flex gap-3 sm:mt-0">
            <Link
              href={`/${locale}/catalog`}
              className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white"
            >
              {t("catalog")}
            </Link>
            <Link
              href={`/${locale}/ai`}
              className="rounded-xl border border-current px-5 py-3 text-sm font-bold"
            >
              {t("ai")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
