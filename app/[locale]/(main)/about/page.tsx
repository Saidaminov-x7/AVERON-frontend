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
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-[#10263f] to-[#075b78] px-6 py-12 text-white shadow-xl shadow-slate-950/10 sm:px-10 sm:py-16 lg:px-14">
          <div aria-hidden="true" className="absolute -right-20 -top-28 -z-10 size-96 rounded-full bg-cyan-400/15 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-36 left-1/3 -z-10 size-80 rounded-full bg-blue-500/20 blur-3xl" />
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            {t("intro")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/catalog`} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
              {t("catalog")}
            </Link>
            <Link href={`/${locale}/ai`} className="rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              {t("ai")}
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([title, text], i) => {
            const Icon = icons[i];
            return (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
                  <Icon size={21} />
                </span>
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-800 dark:text-cyan-300">
              {t("principle")}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">{t("principleTitle")}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
              {t("principleText")}
            </p>
          </div>
          <ul className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            {benefits.map((x) => (
              <li key={x} className="flex gap-3 font-semibold">
                <CheckCircle2 className="shrink-0 text-cyan-700 dark:text-cyan-300" size={19} />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">{t("cta")}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("ctaText")}</p>
          </div>
          <div className="mt-5 flex gap-3 sm:mt-0">
            <Link
              href={`/${locale}/catalog`}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              {t("catalog")}
            </Link>
            <Link
              href={`/${locale}/ai`}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold transition hover:bg-slate-50 dark:border-white/20 dark:hover:bg-white/5"
            >
              {t("ai")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
