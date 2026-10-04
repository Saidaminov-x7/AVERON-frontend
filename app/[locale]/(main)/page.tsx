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
  ru: { route: 'Доставка из: Китай • США • Италия • Турция • Великобритания', season: 'Весна–лето 2026 · Новая коллекция', world: 'География поставок', categories: 'Популярные категории', outerwear: 'Верхняя одежда', shoes: 'Обувь', accessories: 'Аксессуары и сумки', process: 'Как работает AVERON', guarantee: 'Проверенные карточки и прозрачная доставка', guaranteeBody: 'Мы показываем источник товара, статус наличия и путь заказа до Узбекистана.', steps: ['Выберите оригинал', 'Оформите заказ', 'Проверка и доставка'] },
  uz: { route: 'Yetkazib berish: Xitoy • AQSh • Italiya • Turkiya • Buyuk Britaniya', season: 'Bahor–yoz 2026 · Yangi kolleksiya', world: 'Yetkazib berish geografiyasi', categories: 'Mashhur toifalar', outerwear: 'Ustki kiyim', shoes: 'Oyoq kiyim', accessories: 'Aksessuarlar va sumkalar', process: 'AVERON qanday ishlaydi', guarantee: 'Tekshirilgan kartalar va shaffof yetkazib berish', guaranteeBody: 'Mahsulot manbasi, mavjudligi va O‘zbekistongacha bo‘lgan yo‘lini ko‘rsatamiz.', steps: ['Asl mahsulotni tanlang', 'Buyurtma bering', 'Tekshiruv va yetkazish'] },
  en: { route: 'Delivery from: China • USA • Italy • Turkey • United Kingdom', season: 'Spring–Summer 2026 · New collection', world: 'Shipping geography', categories: 'Popular categories', outerwear: 'Outerwear', shoes: 'Footwear', accessories: 'Accessories & bags', process: 'How AVERON works', guarantee: 'Verified listings and transparent delivery', guaranteeBody: 'We show the product source, availability, and route to Uzbekistan.', steps: ['Choose the original', 'Place your order', 'Verification and delivery'] },
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
  const heroImage = '/images/stitch-hero-editorial.jpg';

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', name: 'AVERON', url: SITE_URL }, { '@type': 'WebSite', name: 'AVERON', url: `${SITE_URL}/${locale}`, inLanguage: locale }] }).replace(/</g, '\\u003c') }} />
      <div className="border-y border-[var(--color-border)] bg-[var(--color-surface-soft)]"><div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-between px-4 text-[10px] font-semibold uppercase tracking-[.08em] sm:px-8 lg:px-12"><span className="truncate">{c.route}</span><span className="hidden text-[var(--color-muted)] md:block">RU · UZ · EN</span></div></div>

      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12">
        <div className="relative min-h-[540px] overflow-hidden border border-[var(--color-border)] bg-[#d9d5cf] lg:min-h-[610px]">
          {heroImage ? <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: `url(${heroImage})` }} /> : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
          <div className="relative flex min-h-[540px] max-w-[780px] flex-col justify-end p-7 text-white sm:p-12 lg:min-h-[610px] lg:p-16">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[.1em]">{c.season}</p>
            <h1 className="font-display max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-.035em] sm:text-6xl lg:text-7xl">{t('heroTitle')}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">{t('heroBody')}</p>
            <div className="mt-7 max-w-xl"><SearchInput locale={locale} placeholder={t('searchPlaceholder')} className="h-12 rounded-none border-white/35 bg-black/35 text-white backdrop-blur placeholder:text-white/70" /></div>
            <div className="averon-hero-actions mt-5 flex flex-wrap gap-2"><Link href={to('/catalog')} className="averon-primary-button">{t('catalogButton')} <ArrowRight size={15} /></Link><Link href={to('/about')} className="averon-secondary-button">{t('aboutButton')}</Link></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-8 pt-10 sm:px-8 lg:px-12">
        <div className="mb-6 max-w-2xl">
          <p className="averon-kicker">{c.world}</p>
          <h2 className="averon-title mt-2 text-3xl sm:text-4xl">{s.directions}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{s.directionsBody}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { code: 'CN', title: s.china, body: s.chinaBody, mark: 'CN' },
            { code: 'US', title: s.usa, body: s.usaBody, mark: 'US' },
            { code: 'TR', title: s.turkey, body: s.turkeyBody, mark: 'TR' },
            { code: 'IT', title: s.europe, body: s.europeBody, mark: 'EU' },
          ].map((market) => (
            <Link
              key={market.code}
              href={to(`/catalog?country=${market.code}`)}
              className="group flex min-h-44 flex-col justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:bg-[var(--color-surface-soft)] sm:min-h-52 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] text-xs font-black tracking-wider">{market.mark}</span>
                <ArrowRight size={18} className="text-[var(--color-muted)] transition-transform group-hover:translate-x-1" />
              </div>
              <div>
                <h3 className="averon-title text-xl sm:text-2xl">{market.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--color-muted)] sm:text-sm">{market.body}</p>
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
