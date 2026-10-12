'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { PanelRightClose, PanelRightOpen, ShoppingCart, Trash2, X } from 'lucide-react';
import { getFittingProduct, getFittingProducts, type FittingAsset, type FittingLayer, type FittingProduct } from '@/lib/fitting-room';
import { useCommerceCart } from '@/hooks/useCommerceCart';
import { useAuthStore } from '@/store/useAuthStore';
import { repairMojibake } from '@/lib/repair-mojibake';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const FittingRoomViewer = dynamic(() => import('./FittingRoomViewer').then((module) => module.FittingRoomViewer), { ssr: false });
const text = {
  ru: {
    title: 'Виртуальная примерочная', kicker: 'AVERON FITTING ROOM', close: 'Закрыть примерочную', loading: 'Загружаем модель…', loadingItems: 'Загружаем вещи…', unavailable: 'Не удалось загрузить 3D-модель. Попробуйте открыть её позже.', webgl: 'На этом устройстве 3D-просмотр недоступен. Используйте фотографии товара.', front: 'Вид спереди', left: 'Повернуть влево', right: 'Повернуть вправо', wardrobe: 'Мой образ', add: 'Добавить', remove: 'Убрать', search: 'Найти вещь', variant: 'Цвет и размер', total: 'Итого', cart: 'Добавить образ в корзину', signIn: 'Войдите, чтобы добавить выбранные товары в корзину.', login: 'Войти', adding: 'Добавляем…', added: 'Товары добавлены в корзину.', partial: 'Часть товаров добавить не удалось. Проверьте корзину и наличие.', empty: 'Выберите вещь из списка ниже.', approximate: 'Приблизительная визуализация для выбранного варианта.', disclaimer: 'Визуализация не определяет размер и посадку. Сверьтесь с размерной таблицей товара.', noResults: 'Подходящих моделей не найдено.', layer: { BASE_TOP: 'Верхний слой', MID_LAYER: 'Средний слой', OUTERWEAR: 'Верхняя одежда', BOTTOM: 'Низ', FOOTWEAR: 'Обувь', ACCESSORY: 'Аксессуары' },
  },
  uz: {
    title: 'Virtual kiyib ko‘rish', kicker: 'AVERON FITTING ROOM', close: 'Yopish', loading: 'Model yuklanmoqda…', loadingItems: 'Kiyimlar yuklanmoqda…', unavailable: '3D model yuklanmadi. Keyinroq qayta urinib ko‘ring.', webgl: 'Bu qurilmada 3D ko‘rish mavjud emas. Mahsulot rasmlaridan foydalaning.', front: 'Old tomondan', left: 'Chapga burish', right: 'O‘ngga burish', wardrobe: 'Mening obrazim', add: 'Qo‘shish', remove: 'Olib tashlash', search: 'Kiyim qidirish', variant: 'Rang va o‘lcham', total: 'Jami', cart: 'Obrazni savatchaga qo‘shish', signIn: 'Tanlangan mahsulotlarni savatchaga qo‘shish uchun tizimga kiring.', login: 'Kirish', adding: 'Qo‘shilmoqda…', added: 'Mahsulotlar savatchaga qo‘shildi.', partial: 'Ayrim mahsulotlar qo‘shilmadi. Savatcha va mavjudligini tekshiring.', empty: 'Quyidagi ro‘yxatdan kiyim tanlang.', approximate: 'Tanlangan variantning taxminiy ko‘rinishi.', disclaimer: 'Bu ko‘rinish o‘lcham va kiyilish aniqligini bildirmaydi. Mahsulot o‘lcham jadvalini tekshiring.', noResults: 'Mos model topilmadi.', layer: { BASE_TOP: 'Ichki ustki qatlam', MID_LAYER: 'O‘rta qatlam', OUTERWEAR: 'Tashqi kiyim', BOTTOM: 'Pastki kiyim', FOOTWEAR: 'Oyoq kiyim', ACCESSORY: 'Aksessuarlar' },
  },
  en: {
    title: 'Virtual fitting room', kicker: 'AVERON FITTING ROOM', close: 'Close fitting room', loading: 'Loading model…', loadingItems: 'Loading items…', unavailable: 'This 3D model could not be loaded. Please try again later.', webgl: '3D viewing is unavailable on this device. You can still view product photos.', front: 'Front view', left: 'Turn left', right: 'Turn right', wardrobe: 'My look', add: 'Add', remove: 'Remove', search: 'Find an item', variant: 'Color and size', total: 'Total', cart: 'Add look to cart', signIn: 'Sign in to add selected products to your cart.', login: 'Sign in', adding: 'Adding…', added: 'Items added to your cart.', partial: 'Some items could not be added. Check your cart and availability.', empty: 'Choose an item from the list below.', approximate: 'Approximate visualization for this variant.', disclaimer: 'This visualization does not determine size or fit. Check the product size chart.', noResults: 'No compatible models found.', layer: { BASE_TOP: 'Base layer', MID_LAYER: 'Mid layer', OUTERWEAR: 'Outerwear', BOTTOM: 'Bottom', FOOTWEAR: 'Footwear', ACCESSORY: 'Accessories' },
  },
} as const;

type Locale = keyof typeof text;
type SelectedItem = { product: FittingProduct; variantId: string | null; asset: FittingAsset };

function pickAsset(product: FittingProduct, variantId: string | null) {
  return product.assets.find((asset) => asset.variantId === variantId)
    ?? product.assets.find((asset) => asset.variantId === null);
}

function chosenVariant(product: FittingProduct) {
  return product.variants.find((variant) => variant.stock > 0) ?? product.variants[0] ?? null;
}

export function FittingRoomDialog({ productId, locale, imageUrl, onClose }: { productId: string; locale: string; imageUrl?: string | null; onClose: () => void }) {
  const language: Locale = locale === 'uz' || locale === 'en' ? locale : 'ru';
  const copy = repairMojibake(text[language]);
  const collapseLabel = language === 'en' ? 'Collapse fitting room' : language === 'uz' ? 'Kiyib ko‘rishni yig‘ish' : 'Свернуть примерочную';
  const expandLabel = language === 'en' ? 'Expand fitting room' : language === 'uz' ? 'Kiyib ko‘rishni kengaytirish' : 'Развернуть примерочную';
  const outOfStock = language === 'en' ? 'out of stock' : language === 'uz' ? 'mavjud emas' : repairMojibake('РЅРµС‚ РІ РЅР°Р»РёС‡РёРё');
  const dialogRef = useRef<HTMLElement>(null);
  const { isAuthenticated } = useAuthStore();
  const { mutation } = useCommerceCart();
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [customized, setCustomized] = useState(false);
  const [query, setQuery] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [cartPending, setCartPending] = useState(false);
  const [initialProduct, setInitialProduct] = useState<FittingProduct | null>(null);
  const [initialError, setInitialError] = useState(false);
  const [productListState, setProductListState] = useState<{ key: string; items: FittingProduct[]; error: boolean }>({ key: '', items: [], error: false });
  const productListKey = `${language}:${query.trim()}`;
  const loadingProducts = productListState.key !== productListKey;
  const listError = !loadingProducts && productListState.error;
  const productList = loadingProducts ? [] : productListState.items;

  useEffect(() => {
    let active = true;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]'));
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault();
        focusable[0]?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    void getFittingProduct(productId, language).then((product) => { if (active) setInitialProduct(product); }).catch(() => { if (active) setInitialError(true); });
    return () => {
      active = false;
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [language, onClose, productId]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      void getFittingProducts(language, { q: query.trim() || undefined })
        .then((items) => { if (active) setProductListState({ key: productListKey, items, error: false }); })
        .catch(() => { if (active) setProductListState({ key: productListKey, items: [], error: true }); });
    }, query.trim() ? 250 : 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [language, productListKey, query]);

  const shownItems = customized ? selected : initialProduct ? [{
    product: initialProduct,
    variantId: chosenVariant(initialProduct)?.id ?? null,
    asset: pickAsset(initialProduct, chosenVariant(initialProduct)?.id ?? null) ?? initialProduct.assets[0],
  }] : selected;
  const filteredProducts = productList.filter((product) => product.id !== productId && (query.trim() === '' || product.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
  const total = shownItems.reduce((sum, item) => {
    const variant = item.variantId ? item.product.variants.find((candidate) => candidate.id === item.variantId) : null;
    return sum + Number(variant?.salePriceUzs ?? item.product.salePriceUzs);
  }, 0);

  const addProduct = (product: FittingProduct) => {
    const variant = chosenVariant(product);
    const asset = pickAsset(product, variant?.id ?? null);
    if (!asset) return;
    setCustomized(true);
    setSelected([
      ...shownItems.filter((item) => item.asset.garmentLayer !== asset.garmentLayer),
      { product, variantId: variant?.id ?? null, asset },
    ]);
    setCartMessage('');
  };

  const removeProduct = (layer: FittingLayer) => {
    setCustomized(true);
    setSelected(shownItems.filter((item) => item.asset.garmentLayer !== layer));
  };

  const changeVariant = (item: SelectedItem, variantId: string) => {
    const asset = pickAsset(item.product, variantId || null);
    if (!asset) {
      setCustomized(true);
      setSelected(shownItems.map((current) => current.asset.garmentLayer === item.asset.garmentLayer
        ? { ...current, variantId: variantId || null }
        : current));
      setCartMessage(copy.approximate);
      return;
    }
    setCustomized(true);
    setSelected(shownItems.map((current) => current.asset.garmentLayer === item.asset.garmentLayer
      ? { ...current, variantId: variantId || null, asset }
      : current));
    setCartMessage('');
  };

  const addLookToCart = async () => {
    if (!isAuthenticated || cartPending || !shownItems.length) return;
    setCartPending(true);
    setCartMessage('');
    let added = 0;
    for (const item of shownItems) {
      try {
        await mutation.mutateAsync({ type: 'add', productId: item.product.id, ...(item.variantId ? { variantId: item.variantId } : {}), quantity: 1 });
        added += 1;
      } catch {
        // Continue so the cart can contain the available items; the server owns availability and price.
      }
    }
    setCartMessage(added === shownItems.length ? copy.added : added ? copy.partial : copy.partial);
    setCartPending(false);
  };

  const formatPrice = (amount: number) => `${Number.isFinite(amount) ? amount.toLocaleString(language === 'en' ? 'en-US' : language === 'uz' ? 'uz-UZ' : 'ru-RU') : '0'} ${language === 'en' ? 'UZS' : language === 'uz' ? "so'm" : 'сум'}`;

  return (
    <div className="fixed inset-0 z-[75]">
      <button type="button" className="absolute inset-0 hidden bg-black/20 sm:block" aria-label={copy.close} onClick={onClose} />
      <aside
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        className={`fixed inset-0 flex min-h-0 flex-col border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:border-l sm:border-y-0 sm:border-r-0 ${collapsed ? 'sm:w-16' : 'sm:w-[min(760px,76vw)]'}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 sm:py-4">
          <div className={`min-w-0 ${collapsed ? 'sm:hidden' : ''}`}><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#244FC7] dark:text-[#8EA5FF]">{copy.kicker}</p><h2 className="mt-1 truncate text-lg font-semibold sm:text-xl">{copy.title}</h2></div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" aria-label={collapsed ? expandLabel : collapseLabel} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)} className="hidden size-11 place-items-center border border-[var(--color-border)] text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244FC7] sm:grid">{collapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}</button>
            <button type="button" aria-label={copy.close} onClick={onClose} className="grid size-11 shrink-0 place-items-center border border-[var(--color-border)] text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244FC7]"><X size={18} /></button>
          </div>
        </header>
        {!collapsed && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
            <section aria-label={copy.title}>
              {initialError ? <div role="alert" className="grid min-h-[320px] place-items-center bg-[var(--color-surface-soft)] p-6 text-center text-sm text-[var(--color-text-secondary)]">{imageUrl && <Image src={imageUrl} alt="" width={640} height={800} unoptimized className="max-h-[min(48vh,420px)] object-contain" />}{copy.unavailable}</div>
                : initialProduct ? <FittingRoomViewer assets={shownItems.map((item) => item.asset)} fallbackImageUrl={imageUrl ?? initialProduct.imageUrl} labels={{ loading: copy.loading, unavailable: copy.unavailable, front: copy.front, left: copy.left, right: copy.right, webgl: copy.webgl }} />
                  : <div role="status" className="grid min-h-[320px] place-items-center text-sm text-[var(--color-text-secondary)]">{copy.loading}</div>}
              <p className="px-4 pt-3 text-xs leading-5 text-[var(--color-text-secondary)] sm:px-0">{copy.disclaimer}</p>
            </section>
            <section className="space-y-4 px-4 sm:px-0" aria-label={copy.wardrobe}>
              <div className="border-b border-[var(--color-border)] pb-2"><h3 className="font-semibold">{copy.wardrobe}</h3></div>
              {!shownItems.length && <p className="text-sm text-[var(--color-text-secondary)]">{copy.empty}</p>}
              <ul className="space-y-3">
                {shownItems.map((item) => {
                  const variant = item.variantId ? item.product.variants.find((candidate) => candidate.id === item.variantId) : null;
                  const exactAsset = item.asset.variantId === item.variantId;
                  return <li key={item.asset.garmentLayer} className="border-b border-[var(--color-border)] pb-3">
                    <div className="flex gap-3">
                      <div className="size-16 shrink-0 overflow-hidden bg-[var(--color-surface-soft)]">{item.product.imageUrl && <Image src={item.product.imageUrl} alt="" width={64} height={64} unoptimized className="size-full object-cover" />}</div>
                      <div className="min-w-0 flex-1"><p className="text-[11px] text-[var(--color-text-secondary)]">{copy.layer[item.asset.garmentLayer]}</p><p className="mt-1 line-clamp-2 text-sm font-medium">{item.product.title}</p><p className="mt-1 text-sm font-semibold">{formatPrice(Number(variant?.salePriceUzs ?? item.product.salePriceUzs))}</p></div>
                      <button type="button" aria-label={`${copy.remove}: ${item.product.title}`} onClick={() => removeProduct(item.asset.garmentLayer)} className="grid size-11 shrink-0 place-items-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"><Trash2 size={16} /></button>
                    </div>
                    {item.product.variants.length > 0 && <div className="mt-2 text-xs text-[var(--color-text-secondary)]"><span>{copy.variant}</span><Select value={item.variantId ?? item.product.variants[0]?.id ?? ''} onValueChange={(value) => changeVariant(item, value)}><SelectTrigger aria-label={copy.variant + ': ' + item.product.title} className="mt-1"><SelectValue placeholder={copy.variant} /></SelectTrigger><SelectContent>{item.product.variants.map((entry) => <SelectItem key={entry.id} value={entry.id} disabled={entry.stock <= 0}>{[entry.color, entry.size].filter(Boolean).join(' / ')}{entry.stock <= 0 ? ' · ' + outOfStock : ''}</SelectItem>)}</SelectContent></Select></div>}
                    {!exactAsset && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{copy.approximate}</p>}
                  </li>;
                })}
              </ul>
              <div className="flex items-baseline justify-between border-t border-[var(--color-border)] pt-3"><span className="text-sm text-[var(--color-text-secondary)]">{copy.total}</span><strong className="text-base tabular-nums">{formatPrice(total)}</strong></div>
              {!isAuthenticated ? <p className="text-xs text-[var(--color-text-secondary)]">{copy.signIn} <Link href={`/${language}/login`} className="font-semibold text-[#244FC7] underline dark:text-[#8EA5FF]">{copy.login}</Link></p>
                : <button type="button" disabled={!shownItems.length || cartPending} aria-busy={cartPending} onClick={() => void addLookToCart()} className="flex min-h-11 w-full items-center justify-center gap-2 bg-[#244FC7] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#8EA5FF] dark:text-[#111315]"> <ShoppingCart size={17} />{cartPending ? copy.adding : copy.cart}</button>}
              {cartMessage && <p role="status" className="text-sm text-[var(--color-text-secondary)]">{cartMessage}</p>}
            </section>
          </div>
          <section className="mt-7 border-t border-[var(--color-border)] px-4 pt-4 sm:px-0" aria-label={copy.add}>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)]"><span className="sr-only">{copy.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[#244FC7] focus:ring-2 focus:ring-[#244FC7]/20" /></label>
            {listError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{copy.unavailable}</p>}
            {loadingProducts ? <p role="status" className="mt-3 text-sm text-[var(--color-text-secondary)]">{copy.loadingItems}</p>
              : filteredProducts.length ? <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">{filteredProducts.map((product) => {
                const layer = product.assets[0]?.garmentLayer;
                const currentVariant = chosenVariant(product);
                const asset = pickAsset(product, currentVariant?.id ?? null);
                if (!layer || !asset) return null;
                return <li key={product.id} className="min-w-0">
                  <div className="aspect-[3/4] bg-[var(--color-surface-soft)]">{product.imageUrl && <Image src={product.imageUrl} alt="" width={360} height={480} unoptimized className="size-full object-cover" />}</div>
                  <p className="mt-2 line-clamp-2 text-xs font-medium">{product.title}</p>
                  <p className="mt-1 text-xs tabular-nums text-[var(--color-text-secondary)]">{formatPrice(Number(currentVariant?.salePriceUzs ?? product.salePriceUzs))}</p>
                  <button type="button" onClick={() => addProduct(product)} className="mt-2 min-h-10 w-full border border-[var(--color-border)] px-2 text-xs font-semibold hover:border-[#244FC7] hover:text-[#244FC7] dark:hover:border-[#8EA5FF] dark:hover:text-[#8EA5FF]">{copy.add} · {copy.layer[layer]}</button>
                </li>;
              })}</ul> : <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{copy.noResults}</p>}
          </section>
        </div>}
      </aside>
    </div>
  );
}
