import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Search, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { ProductCard, type StoreProduct } from '@/components/commerce/ProductCard';
import { externalBaseURL } from '@/lib/axios';
import { SITE_URL } from '@/lib/siteUrl';

async function getProducts(sort: 'popular' | 'newest', limit = 12) {
  try {
    const response = await fetch(`${externalBaseURL}/api/v1/products?sort=${sort}&limit=${limit}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(3000) });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || data || [];
  } catch { return []; }
}

const sectionCopy = {
  ru: {
    directions: 'Магазины мира', directionsBody: 'Выберите страну — мы покажем товары именно из этого направления.',
    new: 'Новинки', sale: 'Скидки', popular: 'Популярное', all: 'Смотреть все',
    china: 'Китай', chinaBody: 'Одежда, обувь и аксессуары', usa: 'США', usaBody: 'Бренды и редкие находки',
    turkey: 'Турция', turkeyBody: 'Повседневная мода и обувь', europe: 'Европа', europeBody: 'Италия и Великобритания',
  },
  uz: {
    directions: 'Dunyo do‘konlari', directionsBody: 'Mamlakatni tanlang — shu yo‘nalishdagi mahsulotlarni ko‘rsatamiz.',
    new: 'Yangiliklar', sale: 'Chegirmalar', popular: 'Ommabop', all: 'Barchasini ko‘rish',
    china: 'Xitoy', chinaBody: 'Kiyim, poyabzal va aksessuarlar', usa: 'AQSh', usaBody: 'Brendlar va noyob topilmalar',
    turkey: 'Turkiya', turkeyBody: 'Kundalik moda va poyabzal', europe: 'Yevropa', europeBody: 'Italiya va Buyuk Britaniya',
  },
  en: {
    directions: 'Shop the world', directionsBody: 'Choose a country to see products from that market.',
    new: 'New arrivals', sale: 'Sale', popular: 'Popular', all: 'View all',
    china: 'China', chinaBody: 'Clothing, footwear and accessories', usa: 'USA', usaBody: 'Brands and rare finds',
    turkey: 'Turkey', turkeyBody: 'Everyday fashion and footwear', europe: 'Europe', europeBody: 'Italy and United Kingdom',
  },
} as const;

function ProductShelf({ title, href, products, locale, allLabel }: {
  title: string;
  href: string;
  products: StoreProduct[];
  locale: string;
  allLabel: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="averon-title text-2xl sm:text-3xl">{title}</h2>
        <Link href={href} className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--color-text)] hover:opacity-60">
          {allLabel} <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
        {products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('title') };
}

const copy = {
  ru: { route: 'Доставка из: Китай • США • Италия • Турция • Великобритания', season: 'Весна–лето 2026 · Новая коллекция', world: 'Подборка AVERON', categories: 'Выберите, что ищете', clothing: 'Одежда', outerwear: 'Верхняя одежда', shoes: 'Обувь', accessories: 'Сумки и аксессуары', categoryHint: 'Перейти к товарам', process: 'Как работает AVERON', guarantee: 'Проверенные карточки и прозрачная доставка', guaranteeBody: 'Мы показываем источник товара, статус наличия и путь заказа до Узбекистана.', steps: ['Выберите оригинал', 'Оформите заказ', 'Проверка и доставка'] },
  uz: { route: 'Yetkazib berish: Xitoy • AQSh • Italiya • Turkiya • Buyuk Britaniya', season: 'Bahor–yoz 2026 · Yangi kolleksiya', world: 'AVERON tanlovi', categories: 'Nimani izlayapsiz?', clothing: 'Kiyim', outerwear: 'Ustki kiyim', shoes: 'Oyoq kiyim', accessories: 'Sumkalar va aksessuarlar', categoryHint: 'Mahsulotlarga o‘tish', process: 'AVERON qanday ishlaydi', guarantee: 'Tekshirilgan kartalar va shaffof yetkazib berish', guaranteeBody: 'Mahsulot manbasi, mavjudligi va O‘zbekistongacha bo‘lgan yo‘lini ko‘rsatamiz.', steps: ['Asl mahsulotni tanlang', 'Buyurtma bering', 'Tekshiruv va yetkazish'] },
  en: { route: 'Delivery from: China • USA • Italy • Turkey • United Kingdom', season: 'Spring–Summer 2026 · New collection', world: 'Curated by AVERON', categories: 'What are you looking for?', clothing: 'Clothing', outerwear: 'Outerwear', shoes: 'Footwear', accessories: 'Bags & accessories', categoryHint: 'Shop products', process: 'How AVERON works', guarantee: 'Verified listings and transparent delivery', guaranteeBody: 'We show the product source, availability, and route to Uzbekistan.', steps: ['Choose the original', 'Place your order', 'Verification and delivery'] },
} as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const activeLocale = locale === 'en' || locale === 'uz' ? locale : 'ru';
  const [popularProducts, newestProducts, t] = await Promise.all([
    getProducts('popular'),
    getProducts('newest'),
    getTranslations({ locale, namespace: 'home' }),
  ]);
  const products = popularProducts as StoreProduct[];
  const newest = newestProducts as StoreProduct[];
  const discounted = [...newest, ...products].filter((product, index, items) => {
    const compareAt = Number(product.compareAtPriceUzs ?? 0);
    const sale = Number(product.salePriceUzs ?? 0);
    return compareAt > sale && sale > 0 && items.findIndex((item) => item.id === product.id) === index;
  });
  const c = copy[activeLocale];
  const s = sectionCopy[activeLocale];
  const to = (path: string) => `/${locale}${path}`;
  const heroMarkets = [
    { code: 'CN', title: s.china, caption: s.chinaBody },
    { code: 'US', title: s.usa, caption: s.usaBody },
    { code: 'TR', title: s.turkey, caption: s.turkeyBody },
    { code: 'IT', title: s.europe, caption: s.europeBody },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', name: 'AVERON', url: SITE_URL }, { '@type': 'WebSite', name: 'AVERON', url: `${SITE_URL}/${locale}`, inLanguage: locale }] }).replace(/</g, '\\u003c') }} />
      <div className="border-y border-[var(--color-border)] bg-[var(--color-surface-soft)]"><div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-between px-4 text-[10px] font-semibold uppercase tracking-[.08em] sm:px-8 lg:px-12"><span className="truncate">{c.route}</span><span className="hidden text-[var(--color-muted)] md:block">RU · UZ · EN</span></div></div>

      <section className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-9">
        <div className="grid overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:min-h-[460px] lg:px-14 lg:py-16 xl:px-16">
            <p className="averon-kicker">{t('badge')}</p>
            <h1 className="font-display mt-4 max-w-4xl text-[clamp(2.5rem,5.2vw,5rem)] font-semibold leading-[.98] tracking-[-.045em]">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--color-muted)] sm:text-base sm:leading-7">{t('heroBody')}</p>
            <div className="mt-8 max-w-2xl">
              <SearchInput locale={locale} placeholder={t('searchPlaceholder')} className="h-14 rounded-none bg-[var(--color-bg)]" />
            </div>
            <div className="averon-hero-actions mt-4 flex flex-wrap gap-2">
              <Link href={to('/catalog')} className="averon-primary-button">{t('catalogButton')} <ArrowRight size={15} /></Link>
              <Link href={to('/about')} className="averon-secondary-button">{t('aboutButton')}</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-[var(--color-border)] bg-[var(--color-border)] lg:border-l lg:border-t-0">
            {heroMarkets.map((market, index) => (
              <Link
                key={market.code}
                href={to(`/catalog?country=${market.code}`)}
                className="group flex min-h-40 flex-col justify-between bg-[var(--color-surface-soft)] p-5 transition-colors hover:bg-[var(--color-surface)] sm:min-h-48 sm:p-6 lg:min-h-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold tracking-[.16em] text-[var(--color-muted)]">0{index + 1} / {market.code}</span>
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </div>
                <div>
                  <h2 className="averon-title text-xl sm:text-2xl">{market.title}</h2>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">{market.caption}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-8 pt-10 sm:px-8 lg:px-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="averon-kicker">{c.world}</p>
            <h2 className="averon-title mt-2 text-3xl sm:text-4xl">{c.categories}</h2>
          </div>
          <Link href={to('/catalog')} className="hidden items-center gap-2 text-sm font-semibold hover:opacity-60 sm:flex">{s.all} <ArrowRight size={15} /></Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: c.clothing, featured: true },
            { title: c.outerwear },
            { title: c.shoes },
            { title: c.accessories },
          ].map((category, index) => (
            <Link
              key={category.title}
              href={to(`/catalog?q=${encodeURIComponent(category.title)}`)}
              className={`group flex min-h-56 flex-col justify-between border p-6 transition-transform hover:-translate-y-1 sm:min-h-64 ${category.featured ? 'border-[#222] bg-[#222] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface-soft)]'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold tracking-[.16em] ${category.featured ? 'text-white/55' : 'text-[var(--color-muted)]'}`}>0{index + 1}</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </div>
              <div>
                <h3 className="averon-title max-w-[12ch] text-2xl sm:text-3xl">{category.title}</h3>
                <p className={`mt-3 text-xs font-semibold uppercase tracking-[.08em] ${category.featured ? 'text-white/65' : 'text-[var(--color-muted)]'}`}>{c.categoryHint}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductShelf title={s.new} href={to('/catalog?sort=newest')} products={newest} locale={locale} allLabel={s.all} />
      <ProductShelf title={s.sale} href={to('/catalog?sort=price_asc')} products={discounted} locale={locale} allLabel={s.all} />
      <ProductShelf title={s.popular} href={to('/catalog?sort=popular')} products={products} locale={locale} allLabel={s.all} />

      {products.length === 0 && newest.length === 0 ? (
        <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12">
          <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center">
            <Search className="mx-auto text-[var(--color-primary)]" size={30} />
            <h3 className="mt-4 font-semibold">{t('emptyTitle')}</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{t('emptyBody')}</p>
          </div>
        </section>
      ) : null}

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-soft)]"><div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-8 lg:px-12"><p className="averon-kicker">{c.process}</p><h2 className="averon-title mt-2 max-w-2xl text-3xl sm:text-4xl">{c.guarantee}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">{c.guaranteeBody}</p><div className="mt-8 grid gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-3">{c.steps.map((step, index) => <div key={step} className="bg-[var(--color-surface)] p-6"><span className="text-xs font-bold text-[var(--color-primary)]">0{index + 1}</span><h3 className="mt-6 font-semibold">{step}</h3><div className="mt-4 text-[var(--color-muted)]">{index === 0 ? <Sparkles size={21}/> : index === 1 ? <ShieldCheck size={21}/> : <Truck size={21}/>}</div></div>)}</div></div></section>
    </main>
  );
}
