import Link from "next/link";
import { CheckCircle2, PackageCheck, Search, ShieldCheck } from "lucide-react";

const copy = {
  ru: {
    eyebrow: "О компании",
    title: "AVERON помогает выбирать вещи уверенно",
    intro:
      "Мы делаем заказ товаров из Китая понятным: проверяем информацию вручную и остаёмся рядом, когда нужна поддержка.",
    steps: [
      [
        "Находим",
        "Собираем одежду, обувь и аксессуары от поставщиков из Китая.",
      ],
      [
        "Проверяем",
        "Каждый товар проходит ручную модерацию перед публикацией.",
      ],
      ["Доставляем", "Сопровождаем заказ до получения в Узбекистане."],
    ],
    principle: "Наш принцип",
    ptitle: "AI помогает, человек принимает решение",
    ptext:
      "Технологии ускоряют перевод, поиск и подготовку характеристик. Публикацию всегда подтверждает администратор.",
    benefits: [
      "Понятные цены в сумах",
      "Ручная проверка карточек",
      "Поддержка по заказу",
      "Прозрачные статусы доставки",
    ],
    cta: "Готовы найти нужную вещь?",
    ctext: "Откройте каталог или спросите AI-помощника.",
    catalog: "Каталог",
    ai: "AI-помощник",
  },
  uz: {
    eyebrow: "Kompaniya haqida",
    title: "AVERON sizga ishonch bilan tanlashga yordam beradi",
    intro:
      "Xitoydan buyurtma berishni tushunarli qilamiz: ma’lumotlarni qo‘lda tekshiramiz va yordam kerak bo‘lsa yoningizdamiz.",
    steps: [
      [
        "Topamiz",
        "Xitoy yetkazib beruvchilaridan kiyim, poyabzal va aksessuarlarni topamiz.",
      ],
      [
        "Tekshiramiz",
        "Har bir mahsulot e’lon qilinishidan oldin qo‘lda tekshiriladi.",
      ],
      [
        "Yetkazamiz",
        "Buyurtmani O‘zbekistonda qabul qilguningizcha kuzatamiz.",
      ],
    ],
    principle: "Bizning tamoyil",
    ptitle: "AI yordam beradi, qarorni inson qabul qiladi",
    ptext:
      "Texnologiya tarjima, qidiruv va tavsif tayyorlashni tezlashtiradi. E’lonni har doim administrator tasdiqlaydi.",
    benefits: [
      "Narxlar so‘mda",
      "Kartochkalarni qo‘lda tekshirish",
      "Buyurtma bo‘yicha yordam",
      "Shaffof yetkazib berish holati",
    ],
    cta: "Kerakli mahsulotni topishga tayyormisiz?",
    ctext: "Katalogni oching yoki AI yordamchidan so‘rang.",
    catalog: "Katalog",
    ai: "AI-yordamchi",
  },
  en: {
    eyebrow: "About us",
    title: "AVERON helps you choose with confidence",
    intro:
      "We make ordering from China clear: information is checked manually and support stays close when you need it.",
    steps: [
      [
        "We find",
        "We source clothing, shoes and accessories from suppliers in China.",
      ],
      ["We verify", "Every product is manually reviewed before publication."],
      [
        "We deliver",
        "We support the order until it reaches you in Uzbekistan.",
      ],
    ],
    principle: "Our principle",
    ptitle: "AI assists, a person makes the decision",
    ptext:
      "Technology speeds up translation, search and product preparation. Publication is always confirmed by an administrator.",
    benefits: [
      "Clear prices in UZS",
      "Manual product review",
      "Order support",
      "Transparent delivery statuses",
    ],
    cta: "Ready to find the right item?",
    ctext: "Open the catalog or ask the AI assistant.",
    catalog: "Catalog",
    ai: "AI assistant",
  },
} as const;
const icons = [Search, ShieldCheck, PackageCheck];
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = copy[locale as keyof typeof copy] ?? copy.ru;
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-stone-200 bg-[#f1eadf] px-6 py-14 dark:border-white/10 dark:bg-stone-900 sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-600">
            {t.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold sm:text-6xl">
            {t.title}
          </h1>
          <p className="mt-6 max-w-2xl leading-7 text-stone-600 dark:text-stone-300">
            {t.intro}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {t.steps.map(([title, text], i) => {
            const Icon = icons[i];
            return (
              <article
                key={title}
                className="rounded-2xl border border-stone-200 bg-white p-7 dark:border-white/10 dark:bg-stone-900"
              >
                <Icon className="text-violet-600" />
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">{text}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-600">
              {t.principle}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">{t.ptitle}</h2>
            <p className="mt-4 leading-7 text-stone-600 dark:text-stone-300">
              {t.ptext}
            </p>
          </div>
          <ul className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-stone-900">
            {t.benefits.map((x) => (
              <li key={x} className="flex gap-3 font-semibold">
                <CheckCircle2 className="text-violet-600" size={19} />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-14 rounded-2xl bg-stone-950 p-8 text-white dark:bg-white dark:text-stone-950 sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t.cta}</h2>
            <p className="mt-2 text-sm opacity-70">{t.ctext}</p>
          </div>
          <div className="mt-5 flex gap-3 sm:mt-0">
            <Link
              href={`/${locale}/catalog`}
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
            >
              {t.catalog}
            </Link>
            <Link
              href={`/${locale}/ai`}
              className="rounded-xl border border-current px-5 py-3 text-sm font-bold"
            >
              {t.ai}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
