import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main
      className="min-h-screen bg-stone-50 px-4 py-10 text-stone-950 dark:bg-stone-950 dark:text-white sm:px-6 lg:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="sr-only" role="status">Загрузка каталога и товаров</p>
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>

        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900">
              <Skeleton className="aspect-[4/5] w-full rounded-xl" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}