"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Scale, Trash2, X } from "lucide-react";
import { ProductImage } from "@/components/commerce/ProductImage";
import {
  productTitle,
  type StoreProduct,
} from "@/components/commerce/ProductCard";
import { getProduct } from "@/lib/products";
import { useCompareStore } from "@/store/useCompareStore";

export default function ComparePage() {
  const { locale = "ru" } = useParams<{ locale: string }>();
  const { ids, remove, clear } = useCompareStore();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const idsKey = ids.map(String).join("|");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      Promise.all(ids.map((id) => getProduct(String(id))))
        .then((items) =>
          setProducts(
            items.filter((item): item is StoreProduct => item !== null),
          ),
        )
        .catch(() => setError("Не удалось загрузить товары для сравнения."))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (loading)
    return (
      <div className="flex min-h-[60dvh] items-center justify-center gap-3 text-stone-500">
        <LoaderCircle className="animate-spin" />
        Загружаем сравнение…
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-red-500">
        {error}
      </div>
    );
  if (!products.length)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Scale size={42} className="mx-auto text-primary-700" />
        <h1 className="mt-5 text-2xl font-bold">Список сравнения пуст</h1>
        <p className="mt-2 text-stone-500">
          Добавьте до четырёх товаров кнопкой сравнения на карточке.
        </p>
        <Link
          href={`/${locale}/catalog`}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-700 px-5 font-semibold text-white"
        >
          Открыть каталог <ArrowRight size={16} />
        </Link>
      </div>
    );

  const rows = [
    [
      "Цена",
      (p: StoreProduct) =>
        `${Number(p.salePriceUzs).toLocaleString("ru-RU")} сум`,
    ],
    ["Категория", (p: StoreProduct) => p.category?.slug || "—"],
    ["Материал", (p: StoreProduct) => p.material || "—"],
    [
      "Цвета",
      (p: StoreProduct) =>
        [...new Set(p.variants?.map((v) => v.color).filter(Boolean))].join(
          ", ",
        ) || "—",
    ],
    [
      "Размеры",
      (p: StoreProduct) =>
        [...new Set(p.variants?.map((v) => v.size).filter(Boolean))].join(
          ", ",
        ) || "—",
    ],
    [
      "В наличии",
      (p: StoreProduct) =>
        `${p.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0} шт.`,
    ],
  ] as const;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-700">
            AVERON
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Сравнение товаров ({products.length})
          </h1>
        </div>
        <button
          onClick={clear}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-500"
        >
          <Trash2 size={16} />
          Очистить
        </button>
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10">
        <div
          style={{
            minWidth: `${Math.max(720, 180 + products.length * 230)}px`,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `180px repeat(${products.length}, minmax(210px, 1fr))`,
            }}
          >
            <div className="border-b border-r border-stone-200 p-4 font-bold dark:border-white/10">
              Товар
            </div>
            {products.map((product) => (
              <div
                key={product.id}
                className="relative border-b border-r border-stone-200 p-4 dark:border-white/10"
              >
                <button
                  onClick={() => remove(product.id)}
                  aria-label="Убрать из сравнения"
                  className="absolute right-6 top-6 z-10 flex size-9 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={16} />
                </button>
                <div className="h-40 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
                  <ProductImage
                    src={product.images?.[0]?.url}
                    alt={productTitle(product, locale)}
                  />
                </div>
                <h2 className="mt-3 line-clamp-2 font-bold">
                  {productTitle(product, locale)}
                </h2>
                <Link
                  href={`/${locale}/catalog/${product.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700"
                >
                  Подробнее <ArrowRight size={14} />
                </Link>
              </div>
            ))}
            {rows.flatMap(([label, getValue]) => [
              <div
                key={`${label}-label`}
                className="border-b border-r border-stone-200 p-4 text-sm font-semibold text-stone-500 dark:border-white/10"
              >
                {label}
              </div>,
              ...products.map((product) => (
                <div
                  key={`${label}-${product.id}`}
                  className="border-b border-r border-stone-200 p-4 text-sm dark:border-white/10"
                >
                  {getValue(product)}
                </div>
              )),
            ])}
          </div>
        </div>
      </div>
    </main>
  );
}
