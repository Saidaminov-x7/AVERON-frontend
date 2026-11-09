import { Skeleton } from '@/components/ui/Skeleton';
import { Container } from '@/components/ui/Container';

export default function Loading() {
  return (
    <main
      className="min-h-screen bg-stone-50 py-10 text-stone-950 dark:bg-stone-950 dark:text-white"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="sr-only" role="status">Загрузка каталога и товаров</p>
      <Container>
        <div className="mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>

        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-3 xl:gap-x-5 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="min-w-0">
              <Skeleton className="aspect-[3/4] w-full" />
              <div className="pt-2">
                <Skeleton className="mb-1 h-4 w-1/2" />
                <div className="mb-1 flex flex-col">
                  <Skeleton className="h-[17.55px] w-full sm:h-[20.25px]" />
                  <Skeleton className="h-[17.55px] w-3/4 sm:h-[20.25px]" />
                </div>
                <Skeleton className="mt-1 h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
