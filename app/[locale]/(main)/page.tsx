import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { ProductCard, type StoreProduct } from '@/components/commerce/ProductCard';
import { ProductImage } from '@/components/commerce/ProductImage';
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
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="averon-title text-xl sm:text-2xl">{title}</h2>
        <Link href={href} className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--color-text)] hover:opacity-60">
          {allLabel} <ArrowRight size={15} />
        </Link>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-3">
          {products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
        </div>
      ) : null}
    </section>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('title') };
}

const copy = {
  ru: { route: 'Доставка из: Китай • США • Италия • Турция • Великобритания', season: 'Весна–лето 2026 · Новая коллекция', world: 'Каталог AVERON', categories: 'Выберите категорию', clothing: 'Одежда', outerwear: 'Верхняя одежда', shoes: 'Обувь', accessories: 'Сумки и аксессуары', categoryHint: 'Перейти к товарам', process: 'Как работает AVERON', guarantee: 'Понятный заказ и доставка', guaranteeBody: 'Вы видите наличие, цену и информацию о товаре до оформления заказа.', steps: ['Выберите товар', 'Оформите заказ', 'Проверка и доставка'] },
  uz: { route: 'Yetkazib berish: Xitoy • AQSh • Italiya • Turkiya • Buyuk Britaniya', season: 'Bahor–yoz 2026 · Yangi kolleksiya', world: 'AVERON katalogi', categories: 'Toifani tanlang', clothing: 'Kiyim', outerwear: 'Ustki kiyim', shoes: 'Oyoq kiyim', accessories: 'Sumkalar va aksessuarlar', categoryHint: 'Mahsulotlarga o‘tish', process: 'AVERON qanday ishlaydi', guarantee: 'Tushunarli buyurtma va yetkazib berish', guaranteeBody: 'Buyurtma berishdan oldin mavjudlik, narx va mahsulot ma’lumotlarini ko‘rasiz.', steps: ['Mahsulotni tanlang', 'Buyurtma bering', 'Tekshiruv va yetkazish'] },
  en: { route: 'Delivery from: China • USA • Italy • Turkey • United Kingdom', season: 'Spring–Summer 2026 · New collection', world: 'AVERON catalog', categories: 'Choose a category', clothing: 'Clothing', outerwear: 'Outerwear', shoes: 'Footwear', accessories: 'Bags & accessories', categoryHint: 'Shop products', process: 'How AVERON works', guarantee: 'Clear ordering and delivery', guaranteeBody: 'See availability, price, and product details before placing an order.', steps: ['Choose a product', 'Place your order', 'Verification and delivery'] },
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
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', name: 'AVERON', url: SITE_URL }, { '@type': 'WebSite', name: 'AVERON', url: `${SITE_URL}/${locale}`, inLanguage: locale }] }).replace(/</g, '\\u003c') }} />
      <div className="border-y border-[var(--color-border)] bg-[var(--color-surface-soft)]"><div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-between px-4 text-[10px] font-semibold uppercase tracking-[.08em] sm:px-8 lg:px-12"><span className="truncate">{c.route}</span><span className="hidden text-[var(--color-muted)] md:block">RU · UZ · EN</span></div></div>

      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12">
        <div className="bg-[var(--color-surface-soft)] px-6 py-9 sm:px-10 sm:py-11 lg:px-12">
          <h1 className="averon-title max-w-3xl text-3xl leading-tight sm:text-4xl">{t('heroTitle')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--color-muted)] sm:text-base">{t('heroBody')}</p>
          <Link href={to('/how-to-order')} className="mt-6 inline-flex items-center gap-2 border-b border-current pb-0.5 text-sm font-semibold hover:opacity-60">
            {locale === 'en' ? 'How to order' : locale === 'uz' ? 'Qanday buyurtma berish' : 'Как заказать'} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-6 pt-8 sm:px-8 lg:px-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="averon-kicker">{c.world}</p>
            <h2 className="averon-title mt-2 text-2xl sm:text-3xl">{c.categories}</h2>
          </div>
          <Link href={to('/catalog')} className="hidden items-center gap-2 text-sm font-semibold hover:opacity-60 sm:flex">{s.all} <ArrowRight size={15} /></Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: c.clothing, image: newest[0]?.images?.[0]?.url || products[0]?.images?.[0]?.url },
            { title: c.outerwear, image: newest[1]?.images?.[0]?.url || products[1]?.images?.[0]?.url },
            { title: c.shoes, image: newest[2]?.images?.[0]?.url || products[2]?.images?.[0]?.url },
            { title: c.accessories, image: newest[3]?.images?.[0]?.url || products[3]?.images?.[0]?.url },
          ].map((category) => (
            <Link
              key={category.title}
              href={to(`/catalog?q=${encodeURIComponent(category.title)}`)}
              className="group border-0 bg-[var(--color-surface)]"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-image-surface)]">
                <ProductImage src={category.image} alt={category.title} fit="contain" zoomOnHover={false} />
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <h3 className="text-sm font-semibold">{category.title}</h3>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductShelf title={s.new} href={to('/catalog?sort=newest')} products={newest} locale={locale} allLabel={s.all} />
      <ProductShelf title={s.sale} href={to('/catalog?sort=price_asc')} products={discounted} locale={locale} allLabel={s.all} />
      <ProductShelf title={s.popular} href={to('/catalog?sort=popular')} products={products} locale={locale} allLabel={s.all} />

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-soft)]"><div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12"><p className="averon-kicker">{c.process}</p><h2 className="averon-title mt-2 max-w-2xl text-2xl sm:text-3xl">{c.guarantee}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">{c.guaranteeBody}</p><div className="mt-6 grid gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-3">{c.steps.map((step, index) => <div key={step} className="bg-[var(--color-surface)] p-5"><span className="text-xs font-bold text-[var(--color-primary)]">0{index + 1}</span><h3 className="mt-4 font-semibold">{step}</h3><div className="mt-3 text-[var(--color-muted)]">{index === 0 ? <Sparkles size={19}/> : index === 1 ? <ShieldCheck size={19}/> : <Truck size={19}/>}</div></div>)}</div></div></section>
    </main>
  );
}
