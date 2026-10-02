'use client';

import { useTransition } from 'react';
import { RotateCcw, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const copy = {
  ru: {
    networkTitle: 'Нет соединения с каталогом',
    networkDescription: 'Проверьте подключение к интернету и попробуйте загрузить товар ещё раз.',
    serverTitle: 'Не удалось загрузить товар',
    serverDescription: 'Сервис каталога временно недоступен. Попробуйте ещё раз.',
    retry: 'Повторить загрузку',
    waiting: 'Загружаем…',
    back: 'Вернуться в каталог',
  },
  uz: {
    networkTitle: 'Katalog bilan aloqa yo‘q',
    networkDescription: 'Internetga ulanishni tekshiring va mahsulotni qayta yuklang.',
    serverTitle: 'Mahsulotni yuklab bo‘lmadi',
    serverDescription: 'Katalog xizmati vaqtincha ishlamayapti. Qayta urinib ko‘ring.',
    retry: 'Qayta yuklash',
    waiting: 'Yuklanmoqda…',
    back: 'Katalogga qaytish',
  },
  en: {
    networkTitle: 'Catalog connection unavailable',
    networkDescription: 'Check your internet connection and try loading the product again.',
    serverTitle: 'Product could not be loaded',
    serverDescription: 'The catalog service is temporarily unavailable. Please try again.',
    retry: 'Retry loading',
    waiting: 'Loading…',
    back: 'Back to catalog',
  },
} as const;

export function ProductLoadFailure({
  locale,
  kind,
  catalogHref,
}: {
  locale: string;
  kind: 'network' | 'server';
  catalogHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = copy[locale as keyof typeof copy] ?? copy.ru;

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-stone-50 px-4 py-16 text-center text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
        {kind === 'network' ? <WifiOff aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
      </div>
      <h1 className="text-xl font-bold">{kind === 'network' ? t.networkTitle : t.serverTitle}</h1>
      <p className="mt-2 max-w-md text-sm text-stone-600 dark:text-stone-300">
        {kind === 'network' ? t.networkDescription : t.serverDescription}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          loading={pending}
          loadingLabel={t.waiting}
          onClick={() => startTransition(() => router.refresh())}
          className="min-h-11 rounded-xl bg-primary-700 px-5 font-semibold text-white hover:bg-primary-800"
        >
          <RotateCcw className="mr-2 size-4" aria-hidden="true" />
          {t.retry}
        </Button>
        <a href={catalogHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-700 hover:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/20 dark:text-stone-200">
          {t.back}
        </a>
      </div>
    </main>
  );
}
