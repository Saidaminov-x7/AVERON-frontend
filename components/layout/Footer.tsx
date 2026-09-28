"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import { MessageCircle, Send } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
const copy = {
  ru: {
    desc: "Товары из Китая с понятным выбором, ручной проверкой карточек и доставкой по Узбекистану.",
    buyers: "Покупателям",
    help: "Помощь",
    docs: "Документы",
    channel: "Наш канал",
    support: "Поддержка",
    rights: "Все права защищены.",
    country: "Сервис работает для покупателей в Республике Узбекистан.",
    links: [
      ["Все товары", "/catalog"],
      ["Избранное", "/favorites"],
      ["Сравнение", "/compare"],
      ["Как заказать", "/how-to-order"],
    ],
    helpLinks: [
      ["AI-помощник", "/ai"],
      ["Вопросы и ответы", "/faq"],
      ["О компании", "/about"],
    ],
    docLinks: [
      ["Пользовательское соглашение", "/terms"],
      ["Политика конфиденциальности", "/privacy"],
      ["Публичная оферта", "/public-offer"],
      ["Доставка и оплата", "/delivery"],
      ["Возврат товара", "/returns"],
    ],
  },
  uz: {
    desc: "Xitoydan mahsulotlar: tushunarli tanlov, qo‘lda tekshiruv va O‘zbekiston bo‘ylab yetkazib berish.",
    buyers: "Xaridorlarga",
    help: "Yordam",
    docs: "Hujjatlar",
    channel: "Kanalimiz",
    support: "Yordam",
    rights: "Barcha huquqlar himoyalangan.",
    country: "Xizmat O‘zbekiston Respublikasi xaridorlari uchun ishlaydi.",
    links: [
      ["Barcha mahsulotlar", "/catalog"],
      ["Sevimlilar", "/favorites"],
      ["Taqqoslash", "/compare"],
      ["Qanday buyurtma beriladi", "/how-to-order"],
    ],
    helpLinks: [
      ["AI-yordamchi", "/ai"],
      ["Savol-javoblar", "/faq"],
      ["Kompaniya haqida", "/about"],
    ],
    docLinks: [
      ["Foydalanuvchi kelishuvi", "/terms"],
      ["Maxfiylik siyosati", "/privacy"],
      ["Ommaviy oferta", "/public-offer"],
      ["Yetkazib berish va to‘lov", "/delivery"],
      ["Tovarni qaytarish", "/returns"],
    ],
  },
  en: {
    desc: "Products from China with clear choices, manual verification and delivery across Uzbekistan.",
    buyers: "For buyers",
    help: "Help",
    docs: "Documents",
    channel: "Our channel",
    support: "Support",
    rights: "All rights reserved.",
    country: "The service operates for buyers in the Republic of Uzbekistan.",
    links: [
      ["All products", "/catalog"],
      ["Favorites", "/favorites"],
      ["Compare", "/compare"],
      ["How to order", "/how-to-order"],
    ],
    helpLinks: [
      ["AI assistant", "/ai"],
      ["FAQ", "/faq"],
      ["About us", "/about"],
    ],
    docLinks: [
      ["Terms of use", "/terms"],
      ["Privacy policy", "/privacy"],
      ["Public offer", "/public-offer"],
      ["Delivery and payment", "/delivery"],
      ["Returns", "/returns"],
    ],
  },
} as const;
export function Footer({ locale: localeProp }: { locale?: string } = {}) {
  const locale = (useLocale() || localeProp || 'ru') as keyof typeof copy;
  const t = copy[locale] ?? copy.ru;
  const { data: settings } = useSiteSettings();
  const configuredFooterLinks = Array.isArray(settings?.navLinks)
    ? settings.navLinks
        .filter((item: any) => item.position === "footer" && item.label && (item.href || item.url))
        .map((item: any) => [
          typeof item.label === "object"
            ? item.label[locale] || item.label.ru || item.label.uz || item.label.en
            : String(item.label),
          String(item.href || item.url),
        ] as const)
    : [];
  const col = (
    title: string,
    links: readonly (readonly [string, string])[],
  ) => (
    <div>
      <h2 className="mb-4 text-xs font-bold uppercase tracking-[.14em]">
        {title}
      </h2>
      <ul className="space-y-3">
        {links.map(([l, h]) => (
          <li key={h}>
            <Link
              className="text-sm text-stone-500 hover:text-violet-600 dark:text-stone-400"
              href={`/${locale}${h}`}
            >
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="w-full border-t border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_repeat(3,1fr)]">
          <div>
            <Link
              href={`/${locale}`}
              className="text-xl font-black tracking-[.18em]"
            >
              {settings?.siteName || "AVERON"}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-stone-500">
              {t.desc}
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href="https://t.me/averon_fashion"
                className="rounded-xl border px-3 py-2 text-sm font-semibold dark:border-white/10"
              >
                <Send className="mr-2 inline" size={15} />
                {t.channel}
              </a>
              <a
                href="https://t.me/averon_fashion_admin"
                className="rounded-xl border px-3 py-2 text-sm font-semibold dark:border-white/10"
              >
                <MessageCircle className="mr-2 inline" size={15} />
                {t.support}
              </a>
            </div>
            {(settings?.contactEmail || settings?.contactPhone) && <div className="mt-4 space-y-1 text-sm text-stone-500 dark:text-stone-400">{settings.contactEmail && <a className="block hover:text-violet-500" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}{settings.contactPhone && <a className="block hover:text-violet-500" href={`tel:${settings.contactPhone.replace(/[^+\d]/g, '')}`}>{settings.contactPhone}</a>}</div>}
          </div>
          {col(t.buyers, configuredFooterLinks.length ? configuredFooterLinks : t.links)}
          {col(t.help, t.helpLinks)}
          {col(t.docs, t.docLinks)}
        </div>
        <div className="mt-10 flex flex-col justify-between gap-3 border-t pt-6 text-xs text-stone-400 dark:border-white/10 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings?.siteName || "AVERON"}. {t.rights}
          </p>
          <p>{t.country}</p>
        </div>
      </div>
    </footer>
  );
}
