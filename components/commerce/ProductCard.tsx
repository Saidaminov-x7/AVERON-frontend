import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';

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
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-stone-900">
      <Link href={`/${locale}/catalog/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 dark:bg-stone-800">
          {image ? <Image src={image} alt={title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" /> : <div className="flex h-full items-center justify-center text-sm text-stone-400">AVERON</div>}
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
