import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard, type StoreProduct } from '@/components/commerce/ProductCard';

export function HomeProductShelf({ title, href, products, locale, allLabel, emptyLabel }: {
  title: string;
  href: string;
  products: StoreProduct[];
  locale: string;
  allLabel: string;
  emptyLabel: string;
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
      ) : (
        <p className="border-y border-[var(--color-border)] py-8 text-sm text-[var(--color-muted)]" role="status">
          {emptyLabel}
        </p>
      )}
    </section>
  );
}
