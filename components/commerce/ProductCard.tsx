import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductImage } from './ProductImage';

export type StoreProduct = { id: string; slug: string; translations?: Record<string, any>; salePriceUzs: string | number; compareAtPriceUzs?: string | number | null; images?: Array<{ id?: string; url: string; alt?: Record<string, string> }>; category?: { slug: string; translations?: Record<string, any> } | null };

export function productTitle(product: StoreProduct, locale = 'ru') {
  const value = product.translations?.[locale] ?? product.translations?.ru ?? product.translations;
  return value?.title ?? value?.name ?? product.slug.replaceAll('-', ' ');
}

export function ProductCard({ product, locale }: { product: StoreProduct; locale: string }) {
  const title = productTitle(product, locale);
  const image = product.images?.[0]?.url;
  const price = Number(product.salePriceUzs || 0).toLocaleString('ru-RU');
  return (
    <article className="group max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-stone-900">
      <Link href={`/${locale}/catalog/${product.slug}`} className="block">
        <div className="relative h-52 overflow-hidden bg-stone-100 sm:h-56 dark:bg-stone-800">
          <ProductImage src={image} alt={title} />
          <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/60 bg-white/85 text-stone-800 backdrop-blur"><Heart size={17} /></span>
        </div>
        <div className="p-4">
          <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{title}</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-2"><strong>{price} сум</strong>{product.compareAtPriceUzs && <span className="text-xs text-stone-400 line-through">{Number(product.compareAtPriceUzs).toLocaleString('ru-RU')} сум</span>}</div>
        </div>
      </Link>
    </article>
  );
}
