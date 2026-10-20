import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main
      className="min-h-screen bg-surface-soft px-4 py-10 text-ink dark:bg-surface-soft dark:text-white sm:px-6 lg:px-8"
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

        <div className="grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-3 xl:gap-x-5 min-[1400px]:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="min-w-0">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
