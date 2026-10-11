'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProduct, getProducts, productRouteId, productTitle, type StoreProduct } from '@/lib/products';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  addOutfitToCart,
  commerceQueryKeys,
  deleteOutfit,
  getSavedOutfits,
  saveOutfit,
  updateOutfit,
  type SavedOutfit,
} from '@/lib/commerce-orders';
import { trackCommerceEvent } from '@/lib/commerceAnalytics';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatUzs } from '@/lib/price';

type DraftItem = { product: StoreProduct; variantId: string | null };

const copy = {
  ru: {
    title: 'Конструктор образа', intro: 'Соберите образ вручную. Цены и наличие проверяются сервером.',
    search: 'Найти товар по названию, артикулу или ссылке', find: 'Найти', searching: 'Ищем…', saving: 'Сохраняем…', addingCart: 'Добавляем…', deleting: 'Удаляем…', loading: 'Загружаем…', add: 'Добавить',
    name: 'Название образа', save: 'Сохранить образ', update: 'Сохранить изменения', start: 'Новый образ',
    saved: 'Сохранённые образы', remove: 'Убрать', replace: 'Заменить найденным товаром',
    variant: 'Вариант', total: 'Предварительная сумма', cart: 'Добавить образ в корзину',
    delete: 'Удалить образ', empty: 'Добавьте товары из каталога.', result: 'Результаты поиска',
    none: 'Товары не найдены.', error: 'Не удалось выполнить действие. Попробуйте ещё раз.',
    partial: 'Некоторые товары не добавлены. Недоступные позиции перечислены ниже.',
    added: 'Образ добавлен в корзину.', priceNote: 'Итоговую цену и наличие подтвердит сервер.',
  },
  uz: {
    title: 'Obraz yaratuvchi', intro: 'Obrazni o‘zingiz tuzing. Narx va mavjudlik serverda tekshiriladi.',
    search: 'Nom, artikul yoki havola bo‘yicha mahsulot qidirish', find: 'Qidirish', searching: 'Qidirilmoqda…', saving: 'Saqlanmoqda…', addingCart: 'Qo‘shilmoqda…', deleting: 'O‘chirilmoqda…', loading: 'Yuklanmoqda…', add: 'Qo‘shish',
    name: 'Obraz nomi', save: 'Obrazni saqlash', update: 'O‘zgarishlarni saqlash', start: 'Yangi obraz',
    saved: 'Saqlangan obrazlar', remove: 'Olib tashlash', replace: 'Topilgan mahsulot bilan almashtirish',
    variant: 'Variant', total: 'Taxminiy summa', cart: 'Obrazni savatchaga qo‘shish',
    delete: 'Obrazni o‘chirish', empty: 'Katalogdan mahsulot qo‘shing.', result: 'Qidiruv natijalari',
    none: 'Mahsulot topilmadi.', error: 'Amal bajarilmadi. Qayta urinib ko‘ring.',
    partial: 'Ba’zi mahsulotlar qo‘shilmadi. Mavjud bo‘lmaganlar quyida ko‘rsatilgan.',
    added: 'Obraz savatchaga qo‘shildi.', priceNote: 'Yakuniy narx va mavjudlik serverda tasdiqlanadi.',
  },
  en: {
    title: 'Outfit builder', intro: 'Build an outfit yourself. Prices and availability are revalidated by the server.',
    search: 'Find a product by name, SKU, or link', find: 'Search', searching: 'Searching…', saving: 'Saving…', addingCart: 'Adding…', deleting: 'Deleting…', loading: 'Loading…', add: 'Add',
    name: 'Outfit name', save: 'Save outfit', update: 'Save changes', start: 'New outfit',
    saved: 'Saved outfits', remove: 'Remove', replace: 'Replace with found product',
    variant: 'Option', total: 'Estimated total', cart: 'Add outfit to cart',
    delete: 'Delete outfit', empty: 'Add products from the catalog.', result: 'Search results',
    none: 'No products found.', error: 'Could not complete the action. Try again.',
    partial: 'Some items could not be added. Unavailable items are listed below.',
    added: 'Outfit added to cart.', priceNote: 'The server confirms final prices and availability.',
  },
} as const;

function initialVariant(product: StoreProduct): string | null {
  const variants = product.variants ?? [];
  if (!variants.length) return null;
  return variants.find((variant) => variant.available !== false && (variant.stock ?? 0) > 0)?.id
    ?? variants.find((variant) => variant.available !== false)?.id
    ?? null;
}

function OutfitBuilderContent() {
  const locale = useLocale();
  const text = copy[locale as keyof typeof copy] ?? copy.ru;
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [outfitId, setOutfitId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<StoreProduct[]>([]);
  const [replaceAt, setReplaceAt] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [rejected, setRejected] = useState<Array<{ productId: string; variantId: string | null; code: string }>>([]);
  const [searchPending, setSearchPending] = useState(false);
  const [cartPending, setCartPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [openingOutfit, setOpeningOutfit] = useState<string | null>(null);

  const savedQuery = useQuery({ queryKey: commerceQueryKeys.outfits, queryFn: getSavedOutfits });

  useEffect(() => {
    const productIdentifier = searchParams.get('product');
    if (!productIdentifier) return;
    void getProduct(productIdentifier).then((product) => {
      if (product) setItems((current) => current.length ? current : [{ product, variantId: initialVariant(product) }]);
    }).catch(() => setMessage(text.error));
  }, [searchParams, text.error]);

  const total = useMemo(() => items.reduce((sum, item) => {
    const variant = item.product.variants?.find((candidate) => candidate.id === item.variantId);
    return sum + Number(variant?.salePriceUzs ?? item.product.salePriceUzs ?? 0);
  }, 0), [items]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim() || text.title,
        items: items.map((item) => ({ productId: item.product.id, variantId: item.variantId })),
      };
      return outfitId ? updateOutfit(outfitId, payload) : saveOutfit(payload);
    },
    onSuccess: (outfit) => {
      trackCommerceEvent({ eventName: 'outfit_save' });
      setOutfitId(outfit.id);
      setName(outfit.name);
      setMessage(text.update);
      void queryClient.invalidateQueries({ queryKey: commerceQueryKeys.outfits });
    },
    onError: () => setMessage(text.error),
  });

  const searchProducts = async () => {
    if (searchPending) return;
    setSearchPending(true);
    setMessage('');
    try {
      const query = search.trim();
      if (!query) {
        setResults([]);
        return;
      }
      const normalizedIdentifier = query.match(/\/catalog\/([^/?#]+)/)?.[1] ?? query;
      const direct = await getProduct(decodeURIComponent(normalizedIdentifier)).catch(() => null);
      if (direct) {
        setResults([direct]);
        return;
      }
      const response = await getProducts({ q: query, limit: 12 });
      setResults(response.items);
    } catch {
      setMessage(text.error);
    } finally {
      setSearchPending(false);
    }
  };

  const addProduct = (product: StoreProduct) => {
    setMessage('');
    setRejected([]);
    setItems((current) => {
      if (current.length >= 12 || current.some((item) => item.product.id === product.id)) return current;
      const next = [...current];
      const item = { product, variantId: initialVariant(product) };
      if (replaceAt === null) next.push(item);
      else next[replaceAt] = item;
      setReplaceAt(null);
      return next;
    });
  };

  const openOutfit = async (outfit: SavedOutfit) => {
    if (openingOutfit) return;
    setOpeningOutfit(outfit.id);
    try {
      const hydrated = await Promise.all(outfit.items.map(async (item) => {
        const product = await getProduct(item.product.slug);
        return product ? { product, variantId: item.variantId } : null;
      }));
      setItems(hydrated.filter((item): item is DraftItem => item !== null));
      setOutfitId(outfit.id);
      setName(outfit.name);
      setMessage('');
    } catch {
      setMessage(text.error);
    } finally {
      setOpeningOutfit(null);
    }
  };

  const addToCart = async () => {
    if (cartPending) return;
    setCartPending(true);
    setMessage('');
    setRejected([]);
    try {
      let id = outfitId;
      if (!id) {
        const saved = await saveOutfit({
          name: name.trim() || text.title,
          items: items.map((item) => ({ productId: item.product.id, variantId: item.variantId })),
        });
        id = saved.id;
        setOutfitId(id);
        setName(saved.name);
        void queryClient.invalidateQueries({ queryKey: commerceQueryKeys.outfits });
      } else {
        await updateOutfit(id, {
          name: name.trim() || text.title,
          items: items.map((item) => ({ productId: item.product.id, variantId: item.variantId })),
        });
      }
      const result = await addOutfitToCart(id);
      trackCommerceEvent({ eventName: 'outfit_add_to_cart' });
      setRejected(result.rejectedItems);
      setMessage(result.rejectedItems.length ? text.partial : text.added);
      await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.cart });
    } catch {
      setMessage(text.error);
    } finally {
      setCartPending(false);
    }
  };

  const removeSaved = async () => {
    if (!outfitId || deletePending) return;
    setDeletePending(true);
    try {
      await deleteOutfit(outfitId);
      setOutfitId(null);
      setName('');
      setItems([]);
      await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.outfits });
      setMessage(text.delete);
    } catch {
      setMessage(text.error);
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_280px]">
        <section>
          <h1 className="text-3xl font-extrabold">{text.title}</h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{text.intro}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="outfit-product-search">{text.search}</label>
            <input id="outfit-product-search" value={search} onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchProducts(); } }}
              placeholder={text.search} className="min-h-11 flex-1 rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-900" />
            <Button type="button" loading={searchPending} loadingLabel={text.searching} onClick={() => void searchProducts()} className="min-h-11 rounded-xl bg-primary-700 px-5 font-bold text-white focus-visible:ring-primary-500">{text.find}</Button>
          </div>
          {results.length > 0 && <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900">
            <h2 className="font-bold">{text.result}</h2>
            <ul className="mt-3 space-y-3">{results.map((product) => (
              <li key={product.id} className="flex items-center gap-3">
                {product.images?.[0]?.url && <img src={product.images[0].url} alt="" className="size-12 rounded-lg object-cover" />}
                <span className="min-w-0 flex-1 truncate">{productTitle(product, locale)}</span>
                <button type="button" onClick={() => addProduct(product)} className="min-h-10 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">{replaceAt === null ? text.add : text.replace}</button>
              </li>
            ))}</ul>
          </div>}
          {results.length === 0 && search.trim() && <p className="mt-3 text-sm text-stone-500">{text.none}</p>}

          <div className="mt-8 space-y-3">
            {items.length === 0 ? <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">{text.empty}</p> :
              items.map((item, index) => (
                <article key={`${item.product.id}:${index}`} className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center dark:border-white/10 dark:bg-stone-900">
                  {item.product.images?.[0]?.url && <img src={item.product.images[0].url} alt="" className="size-20 rounded-xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <a href={`/${locale}/catalog/${encodeURIComponent(productRouteId(item.product))}`} className="font-bold hover:underline">{productTitle(item.product, locale)}</a>
                    <p className="mt-1 text-sm text-stone-500">{formatUzs(Number(item.product.variants?.find((variant) => variant.id === item.variantId)?.salePriceUzs ?? item.product.salePriceUzs ?? 0), locale)}</p>
                    {(item.product.variants?.length ?? 0) > 0 && <div className="mt-2 max-w-sm text-sm">
                      <span>{text.variant}</span>
                      <Select value={item.variantId ?? ''} onValueChange={(value) => setItems((current) => current.map((entry, itemIndex) =>
                        itemIndex === index ? { ...entry, variantId: value || null } : entry,
                      ))}>
                        <SelectTrigger aria-label={`${text.variant}: ${productTitle(item.product, locale)}`} className="mt-1 min-h-9 rounded-lg">
                          <SelectValue placeholder={text.variant} />
                        </SelectTrigger>
                        <SelectContent>
                          {item.product.variants?.map((variant) => <SelectItem key={variant.id} value={variant.id}>{[variant.color, variant.size].filter(Boolean).join(' · ') || variant.id}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setReplaceAt(index)} className="min-h-10 rounded-lg border px-3 text-sm">{text.replace}</button>
                    <button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="min-h-10 rounded-lg border px-3 text-sm">{text.remove}</button>
                  </div>
                </article>
              ))}
          </div>
          <p className="mt-4 text-sm text-stone-500">{text.priceNote}</p>
        </section>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
          <label htmlFor="outfit-name" className="block text-sm font-semibold">{text.name}</label>
          <input id="outfit-name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-950" />
          <p className="mt-5 text-sm text-stone-500">{text.total}</p>
          <p className="mt-1 text-2xl font-extrabold">{formatUzs(total, locale)}</p>
          <Button type="button" loading={saveMutation.isPending} loadingLabel={text.saving} disabled={!items.length} onClick={() => saveMutation.mutate()} className="mt-5 min-h-11 w-full rounded-xl border px-3 font-bold text-stone-900 dark:text-stone-100">{outfitId ? text.update : text.save}</Button>
          <Button type="button" loading={cartPending} loadingLabel={text.addingCart} disabled={!items.length || cartPending || saveMutation.isPending} onClick={() => void addToCart()} className="mt-2 min-h-11 w-full rounded-xl bg-primary-700 px-3 font-bold text-white">{text.cart}</Button>
          {outfitId && <Button type="button" loading={deletePending} loadingLabel={text.deleting} disabled={deletePending} onClick={() => void removeSaved()} variant="outline" className="mt-2 min-h-10 w-full rounded-xl border-rose-300 px-3 text-sm text-rose-700">{text.delete}</Button>}
          {message && <p role="status" className="mt-4 text-sm">{message}</p>}
          {rejected.length > 0 && <ul className="mt-2 list-inside list-disc text-xs text-rose-700">{rejected.map((item) => <li key={`${item.productId}:${item.variantId}`}>{item.code}</li>)}</ul>}
          <h2 className="mt-7 font-bold">{text.saved}</h2>
          <div className="mt-2 space-y-2">{savedQuery.data?.map((outfit) =>
            <Button key={outfit.id} type="button" loading={openingOutfit === outfit.id} loadingLabel={text.loading} disabled={openingOutfit !== null} onClick={() => void openOutfit(outfit)} variant="ghost" className="block min-h-10 w-full rounded-lg bg-stone-100 px-3 text-left text-sm dark:bg-white/5">{outfit.name}</Button>,
          )}</div>
          <button type="button" onClick={() => { setOutfitId(null); setName(''); setItems([]); setMessage(''); }} className="mt-3 min-h-10 w-full rounded-lg border px-3 text-sm">{text.start}</button>
        </aside>
      </div>
    </main>
  );
}

export default function OutfitBuilder() {
  return <ProtectedRoute><OutfitBuilderContent /></ProtectedRoute>;
}
