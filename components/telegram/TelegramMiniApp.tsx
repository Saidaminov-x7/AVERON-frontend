'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Package, ShoppingBag } from 'lucide-react';
import { AddToCart } from '@/components/commerce/AddToCart';
import { ProductGallery } from '@/components/commerce/ProductGallery';
import { ProductImage } from '@/components/commerce/ProductImage';
import { ProductReviews } from '@/components/commerce/ProductReviews';
import api from '@/lib/axios';
import { getProduct, getProducts, productTitle, type StoreProduct } from '@/lib/products';
import { useAuthStore } from '@/store/useAuthStore';

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { start_param?: string };
      ready?: () => void;
      expand?: () => void;
    };
  };
};

type AskTopic = 'size' | 'color' | 'availability' | 'preorder' | 'delivery' | 'details';

const copy = {
  ru: {
    title: 'Магазин AVERON', catalog: 'Каталог', cart: 'Корзина', orders: 'Заказы', loading: 'Загружаем каталог…', checkingAuth: 'Проверяем вход через Telegram',
    loadError: 'Не удалось загрузить каталог.', retry: 'Повторить', unavailable: 'Товар не найден или больше недоступен.',
    back: 'В каталог', gallery: 'Фотографии товара', image: (index: number) => `Показать фото ${index}`, previousImage: 'Предыдущее фото', nextImage: 'Следующее фото',
    openImage: 'Открыть фото на весь экран', closeImageViewer: 'Закрыть просмотр фото', zoomIn: 'Увеличить фото', zoomOut: 'Уменьшить фото',
    confirmed: 'Товар из каталога AVERON', description: 'Описание пока недоступно.',
    price: 'Цена', stock: 'В наличии', lowStock: 'Заканчивается', preorder: 'Предзаказ', outOfStock: 'Нет в наличии',
    ask: 'Задать вопрос о товаре', chooseQuestion: 'Что вас интересует?', size: 'Размер', color: 'Цвет',
    availability: 'Наличие', preorderQuestion: 'Предзаказ', delivery: 'Доставка', details: 'Описание',
    sizeAnswer: 'Доступные размеры указаны в выборе варианта товара.',
    colorAnswer: 'Доступные цвета указаны в выборе варианта товара.',
    unavailableInfo: 'Эта информация не указана в карточке товара.',
    preorderAnswer: 'Этот товар доступен только для обычного заказа, не как предзаказ.',
    deliveryAnswer: 'Способ и стоимость доставки будут подтверждены при оформлении заказа.',
    help: 'Если нужна дополнительная помощь, обратитесь в поддержку AVERON.',
    login: 'Войдите в аккаунт AVERON, чтобы связать Telegram и продолжить заказ.',
    loginLink: 'Войти в AVERON', linked: 'Telegram связан с вашим аккаунтом AVERON.',
    linkConfirm: 'Подтвердите привязку этого Telegram-аккаунта к текущему аккаунту AVERON.',
    linkButton: 'Связать Telegram',
    linkError: 'Не удалось связать Telegram. Войдите в нужный аккаунт AVERON и попробуйте снова.',
    authError: 'Не удалось проверить вход Telegram. Можно продолжить просмотр каталога.',
    signIn: 'Войдите в AVERON, чтобы добавлять товары и смотреть заказы.',
    stockCount: (count: number) => `В наличии: ${count} шт.`,
  },
  uz: {
    title: 'AVERON do‘koni', catalog: 'Katalog', cart: 'Savatcha', orders: 'Buyurtmalar', loading: 'Katalog yuklanmoqda…', checkingAuth: 'Telegram orqali kirish tekshirilmoqda',
    loadError: 'Katalogni yuklab bo‘lmadi.', retry: 'Qayta urinish', unavailable: 'Mahsulot topilmadi yoki mavjud emas.',
    back: 'Katalogga', gallery: 'Mahsulot rasmlari', image: (index: number) => `${index}-rasmni ko‘rsatish`, previousImage: 'Oldingi rasm', nextImage: 'Keyingi rasm',
    openImage: 'Rasmni to‘liq ekranda ochish', closeImageViewer: 'Rasm ko‘rinishini yopish', zoomIn: 'Rasmni kattalashtirish', zoomOut: 'Rasmni kichraytirish',
    confirmed: 'AVERON katalogidagi mahsulot', description: 'Tavsif hozircha mavjud emas.',
    price: 'Narxi', stock: 'Mavjud', lowStock: 'Kam qoldi', preorder: 'Oldindan buyurtma', outOfStock: 'Mavjud emas',
    ask: 'Mahsulot haqida savol berish', chooseQuestion: 'Sizni nima qiziqtiradi?', size: 'O‘lcham', color: 'Rang',
    availability: 'Mavjudligi', preorderQuestion: 'Oldindan buyurtma', delivery: 'Yetkazib berish', details: 'Tavsif',
    sizeAnswer: 'Mavjud o‘lchamlar mahsulot variantlarini tanlash bo‘limida ko‘rsatilgan.',
    colorAnswer: 'Mavjud ranglar mahsulot variantlarini tanlash bo‘limida ko‘rsatilgan.',
    unavailableInfo: 'Bu ma’lumot mahsulot kartasida ko‘rsatilmagan.',
    preorderAnswer: 'Bu mahsulot oldindan buyurtma emas, oddiy buyurtma uchun mavjud.',
    deliveryAnswer: 'Yetkazib berish usuli va narxi buyurtma rasmiylashtirilganda tasdiqlanadi.',
    help: 'Qo‘shimcha yordam kerak bo‘lsa, AVERON yordam xizmatiga murojaat qiling.',
    login: 'Telegramni ulash va buyurtmani davom ettirish uchun AVERON hisobingizga kiring.',
    loginLink: 'AVERON hisobiga kirish', linked: 'Telegram AVERON hisobingizga ulandi.',
    linkConfirm: 'Ushbu Telegram hisobini joriy AVERON hisobiga ulashni tasdiqlang.',
    linkButton: 'Telegramni ulash',
    linkError: 'Telegramni ulab bo‘lmadi. Kerakli AVERON hisobiga kirib, qayta urinib ko‘ring.',
    authError: 'Telegram orqali kirishni tekshirib bo‘lmadi. Katalogni ko‘rishda davom etishingiz mumkin.',
    signIn: 'Mahsulot qo‘shish va buyurtmalarni ko‘rish uchun AVERON hisobiga kiring.',
    stockCount: (count: number) => `Mavjud: ${count} dona`,
  },
  en: {
    title: 'AVERON Store', catalog: 'Catalog', cart: 'Cart', orders: 'Orders', loading: 'Loading catalog…', checkingAuth: 'Checking Telegram sign-in',
    loadError: 'Could not load the catalog.', retry: 'Try again', unavailable: 'Product not found or no longer available.',
    back: 'Back to catalog', gallery: 'Product images', image: (index: number) => `Show image ${index}`, previousImage: 'Previous image', nextImage: 'Next image',
    openImage: 'Open image full screen', closeImageViewer: 'Close image viewer', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    confirmed: 'Product from the AVERON catalog', description: 'Description is not available yet.',
    price: 'Price', stock: 'In stock', lowStock: 'Low stock', preorder: 'Preorder', outOfStock: 'Out of stock',
    ask: 'Ask about this product', chooseQuestion: 'What would you like to know?', size: 'Size', color: 'Color',
    availability: 'Availability', preorderQuestion: 'Preorder', delivery: 'Delivery', details: 'Details',
    sizeAnswer: 'Available sizes are shown in the product variant selector.',
    colorAnswer: 'Available colors are shown in the product variant selector.',
    unavailableInfo: 'This information is not listed on the product page.',
    preorderAnswer: 'This product is available for a regular order, not as a preorder.',
    deliveryAnswer: 'The delivery method and cost are confirmed at checkout.',
    help: 'For further assistance, contact AVERON support.',
    login: 'Sign in to your AVERON account to link Telegram and continue your order.',
    loginLink: 'Sign in to AVERON', linked: 'Telegram is linked to your AVERON account.',
    linkConfirm: 'Confirm linking this Telegram account to your current AVERON account.',
    linkButton: 'Link Telegram',
    linkError: 'Could not link Telegram. Sign in to the intended AVERON account and try again.',
    authError: 'Could not verify Telegram sign-in. You can continue browsing the catalog.',
    signIn: 'Sign in to AVERON to add products and view orders.',
    stockCount: (count: number) => `${count} in stock`,
  },
} as const;

type Locale = keyof typeof copy;
type AuthStatus = 'checking' | 'web' | 'unlinked' | 'linking' | 'linked' | 'error';

function validProductSlug(value: string | null | undefined): string | null {
  return value && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value) ? value : null;
}

function isVariantKnownAvailable(variant: NonNullable<StoreProduct['variants']>[number]) {
  return variant.available === true || (typeof variant.stock === 'number' && variant.stock > 0);
}

function descriptionFor(product: StoreProduct, locale: Locale, unavailable: string) {
  const descriptions = (product as StoreProduct & {
    description?: Record<string, string | { text?: string }>;
  }).description;
  const value = descriptions?.[locale] ?? descriptions?.ru;
  if (typeof value === 'string') return value;
  return value?.text ?? unavailable;
}

function formatUzs(value: string | number, locale: Locale) {
  const amount = Number(value);
  return `${Number.isFinite(amount) ? amount.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU') : '0'} ${locale === 'en' ? 'UZS' : locale === 'uz' ? 'so‘m' : 'сум'}`;
}

export function TelegramMiniApp({
  locale: rawLocale,
  initialProduct,
}: {
  locale: string;
  initialProduct?: string;
}) {
  const locale: Locale = rawLocale === 'uz' || rawLocale === 'en' ? rawLocale : 'ru';
  const text = copy[locale];
  const [productSlug, setProductSlug] = useState(() => validProductSlug(initialProduct));
  const [question, setQuestion] = useState<AskTopic | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [authMessage, setAuthMessage] = useState('');
  const authAttempted = useRef(false);
  const { isAuthenticated, isLoading: authLoading, setAuth } = useAuthStore();

  useEffect(() => {
    const webApp = (window as TelegramWindow).Telegram?.WebApp;
    webApp?.ready?.();
    webApp?.expand?.();
    if (!initialProduct) {
      const startParam = webApp?.initDataUnsafe?.start_param;
      const candidate = startParam?.startsWith('p_') ? startParam.slice(2) : startParam;
      if (candidate) Promise.resolve().then(() => setProductSlug(validProductSlug(candidate)));
    }
    const initData = webApp?.initData?.trim();
    if (!initData) {
      Promise.resolve().then(() => setAuthStatus('web'));
      return;
    }
    if (authAttempted.current) return;
    authAttempted.current = true;
    api.post('/auth/telegram/mini-app/auth', { initData })
      .then(({ data }) => {
        if (data?.linked === true && typeof data.accessToken === 'string' && data.user) {
          setAuth(data.user, data.accessToken);
          setAuthStatus('linked');
        } else if (data?.linked === false) {
          setAuthStatus('unlinked');
        } else {
          setAuthStatus('error');
          setAuthMessage(text.authError);
        }
      })
      .catch(() => {
        setAuthStatus('error');
        setAuthMessage(text.authError);
      });
  }, [initialProduct, setAuth, text.authError]);

  const linkTelegramAccount = async () => {
    if (authStatus !== 'unlinked' || !isAuthenticated || authLoading) return;
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData?.trim();
    if (!initData) return;
    setAuthStatus('linking');
    setAuthMessage('');
    try {
      await api.post('/auth/telegram/mini-app/link', { initData });
      setAuthStatus('linked');
      setAuthMessage(text.linked);
    } catch {
      setAuthStatus('error');
      setAuthMessage(text.linkError);
    }
  };

  const productQuery = useQuery({
    queryKey: ['telegram-mini-app-product', productSlug],
    queryFn: () => getProduct(productSlug!),
    enabled: Boolean(productSlug),
  });
  const catalogQuery = useQuery({
    queryKey: ['telegram-mini-app-catalog'],
    queryFn: () => getProducts({ page: 1, limit: 24 }),
    enabled: !productSlug,
  });
  const returnTo = useMemo(
    () => `/${locale}/mini-app${productSlug ? `?product=${encodeURIComponent(productSlug)}` : ''}`,
    [locale, productSlug],
  );
  const product = productQuery.data;
  const title = product ? productTitle(product, locale) : '';
  const description = product ? descriptionFor(product, locale, text.description) : '';
  const localizedPrice = product ? formatUzs(product.salePriceUzs, locale) : '';
  const variantStock = product?.variants?.reduce((total, variant) => total + (typeof variant.stock === 'number' && variant.stock > 0 ? variant.stock : 0), 0) ?? 0;
  const stockCount = product?.variants?.length ? variantStock : product?.stock;
  const hasAvailableVariant = product?.variants?.some(isVariantKnownAvailable) ?? false;
  const inStock = Boolean(product && (
    product.availability?.inStock === true ||
    hasAvailableVariant ||
    (product.available === true && product.stock !== 0)
  ));
  const canPreorder = Boolean(
    product?.availability?.preorderEligible && product.availability.preorderAvailable > 0,
  );
  const availabilityLabel = !product
    ? ''
    : inStock
      ? typeof stockCount === 'number' && stockCount > 0 && stockCount <= 5
        ? `${text.lowStock} · ${text.stockCount(stockCount)}`
        : typeof stockCount === 'number' && stockCount > 0
          ? text.stockCount(stockCount)
          : text.stock
      : canPreorder
        ? text.preorder
        : product.available === false || stockCount === 0
          ? text.outOfStock
          : text.stock;

  const answerFor = (topic: AskTopic) => {
    if (!product) return text.unavailableInfo;
    if (topic === 'size') {
      const sizes = product.variants
        ?.filter(isVariantKnownAvailable)
        .map((variant) => variant.size)
        .filter((size): size is string => Boolean(size));
      return sizes?.length ? `${text.size}: ${[...new Set(sizes)].join(', ')}` : text.sizeAnswer;
    }
    if (topic === 'color') {
      const colors = product.variants
        ?.filter(isVariantKnownAvailable)
        .map((variant) => variant.color)
        .filter((color): color is string => Boolean(color));
      return colors?.length ? `${text.color}: ${[...new Set(colors)].join(', ')}` : text.colorAnswer;
    }
    if (topic === 'availability') return availabilityLabel || text.unavailableInfo;
    if (topic === 'preorder') {
      return product.availability?.preorderEligible && product.availability.preorderAvailable > 0
        ? `${text.preorder} · ${text.stockCount(product.availability.preorderAvailable)}`
        : text.preorderAnswer;
    }
    if (topic === 'delivery') return text.deliveryAnswer;
    return description;
  };

  const questionLabels: Record<AskTopic, string> = {
    size: text.size, color: text.color, availability: text.availability,
    preorder: text.preorderQuestion, delivery: text.delivery, details: text.details,
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-white/10">
          <Link href={`/${locale}/mini-app`} className="inline-flex min-h-11 items-center gap-2 text-lg font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500">
            <ShoppingBag size={20} />{text.title}
          </Link>
          <nav aria-label={text.title} className="flex flex-wrap gap-2">
            <Link href={`/${locale}/catalog`} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:hover:bg-white/10">{text.catalog}</Link>
            <Link href={`/${locale}/cart`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:hover:bg-white/10"><ShoppingBag size={16} />{text.cart}</Link>
            <Link href={`/${locale}/orders`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:hover:bg-white/10"><Package size={16} />{text.orders}</Link>
          </nav>
        </header>

        {authStatus === 'checking' && <p role="status" className="sr-only">{text.checkingAuth}</p>}
        {authStatus === 'linking' && <p role="status" className="mt-3 text-sm text-stone-600 dark:text-stone-300">{text.login}</p>}
        {authMessage && <p role={authStatus === 'error' ? 'alert' : 'status'} className="mt-3 rounded-xl border border-stone-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-stone-900">{authMessage}</p>}
        {authStatus === 'unlinked' && !isAuthenticated && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            <p>{text.login}</p>
            <Link href={`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center rounded-lg bg-stone-900 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:bg-white dark:text-stone-900">{text.loginLink}</Link>
          </div>
        )}
        {authStatus === 'unlinked' && isAuthenticated && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            <p>{text.linkConfirm}</p>
            <button type="button" onClick={() => void linkTelegramAccount()} className="inline-flex min-h-11 items-center rounded-lg bg-stone-900 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:bg-white dark:text-stone-900">{text.linkButton}</button>
          </div>
        )}
        {!isAuthenticated && authStatus !== 'unlinked' && authStatus !== 'checking' && (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">{text.signIn}</p>
        )}

        {productSlug ? (
          productQuery.isLoading ? <p role="status" className="py-12 text-center">{text.loading}</p>
            : productQuery.isError ? <div role="alert" className="py-12 text-center"><p>{text.loadError}</p><button type="button" onClick={() => void productQuery.refetch()} className="mt-3 min-h-11 rounded-lg border px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500">{text.retry}</button></div>
              : !product ? <div className="py-12 text-center"><p role="status">{text.unavailable}</p><button type="button" onClick={() => { setProductSlug(null); setQuestion(null); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"><ArrowLeft size={16} />{text.back}</button></div>
                : (
                  <>
                  <article className="mt-6 grid gap-6 lg:grid-cols-2">
                    <ProductGallery
                      images={product.images ?? []}
                      productTitle={title}
                      locale={locale}
                      label={text.gallery}
                      imageLabels={(product.images ?? []).map((_, index) => text.image(index + 1))}
                      previousLabel={text.previousImage}
                      nextLabel={text.nextImage}
                      openImageLabel={text.openImage}
                      closeViewerLabel={text.closeImageViewer}
                      zoomInLabel={text.zoomIn}
                      zoomOutLabel={text.zoomOut}
                    />
                    <section>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">{text.confirmed}</p>
                      <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
                      <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">{description}</p>
                      <p className="mt-5 text-2xl font-black" aria-label={`${text.price}: ${localizedPrice}`}>{localizedPrice}</p>
                      <p className={`mt-2 text-sm font-semibold ${availabilityLabel === text.outOfStock ? 'text-rose-700 dark:text-rose-300' : 'text-stone-600 dark:text-stone-300'}`}>{availabilityLabel}</p>
                      <AddToCart
                        productId={product.id}
                        productPrice={product.salePriceUzs}
                        productStock={product.stock}
                        productAvailable={product.available}
                        productAvailability={product.availability}
                        variants={product.variants ?? []}
                      />
                      <section id="ask" className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900" aria-labelledby="mini-app-ask">
                        <h2 id="mini-app-ask" className="flex items-center gap-2 font-bold"><MessageCircle size={18} />{text.ask}</h2>
                        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{text.chooseQuestion}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(Object.keys(questionLabels) as AskTopic[]).map((topic) => (
                            <button key={topic} type="button" aria-pressed={question === topic} onClick={() => setQuestion(topic)} className={`min-h-11 rounded-full border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 ${question === topic ? 'border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900' : 'border-stone-300 hover:bg-stone-100 dark:border-white/20 dark:hover:bg-white/10'}`}>
                              {questionLabels[topic]}
                            </button>
                          ))}
                        </div>
                        {question && <p role="status" className="mt-4 rounded-xl bg-stone-100 p-3 text-sm leading-6 dark:bg-stone-800">{answerFor(question)}</p>}
                        <p className="mt-3 text-xs text-stone-500">{text.help}</p>
                      </section>
                    </section>
                  </article>
                  <ProductReviews slug={product.slug} locale={locale} />
                  </>
                )
        ) : (
          <section className="mt-6">
            <h1 className="text-2xl font-extrabold">{text.catalog}</h1>
            {catalogQuery.isLoading ? <p role="status" className="py-12 text-center">{text.loading}</p>
              : catalogQuery.isError ? <div role="alert" className="py-12 text-center"><p>{text.loadError}</p><button type="button" onClick={() => void catalogQuery.refetch()} className="mt-3 min-h-11 rounded-lg border px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500">{text.retry}</button></div>
                : (
                  <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {catalogQuery.data?.items.map((item) => {
                      const itemTitle = productTitle(item, locale);
                      return (
                        <li key={item.slug}>
                          <Link href={`/${locale}/mini-app?product=${encodeURIComponent(item.slug)}`} className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:border-white/10 dark:bg-stone-900">
                            <div className="aspect-square bg-stone-100 dark:bg-stone-800">
                              {item.images?.[0]?.url ? <ProductImage src={item.images[0].url} alt={item.images[0].alt?.[locale] ?? itemTitle} /> : <div className="flex h-full items-center justify-center text-sm text-stone-400">AVERON</div>}
                            </div>
                            <div className="p-3">
                              <h2 className="line-clamp-2 min-h-10 text-sm font-semibold group-hover:underline">{itemTitle}</h2>
                              <p className="mt-2 font-bold">{formatUzs(item.salePriceUzs, locale)}</p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )
            }
          </section>
        )}
      </div>
    </main>
  );
}
