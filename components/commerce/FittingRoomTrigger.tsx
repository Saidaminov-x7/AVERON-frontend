'use client';

import { useCallback, useState } from 'react';
import { Shirt } from 'lucide-react';
import { FittingRoomDialog } from './FittingRoomDialog';
import { repairMojibake } from '@/lib/repair-mojibake';

export function FittingRoomTrigger({ productId, locale, compact = false, imageUrl }: { productId: string; locale: string; compact?: boolean; imageUrl?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const labels = { ru: 'РџСЂРёРјРµСЂРёС‚СЊ', uz: 'Kiyib koвЂrish', en: 'Try it on' };
  const label = repairMojibake(labels[locale as keyof typeof labels] ?? labels.ru);

  return <>
    <button type="button" onClick={() => setIsOpen(true)} className={`inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--color-border)] px-2 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[#244FC7] hover:text-[#244FC7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244FC7] dark:hover:border-[#8EA5FF] dark:hover:text-[#8EA5FF] sm:px-3 sm:text-sm ${compact ? '' : 'w-full'}`}>
      <Shirt size={16} aria-hidden="true" />{label}
    </button>
    {isOpen && <FittingRoomDialog productId={productId} locale={locale} imageUrl={imageUrl} onClose={close} />}
  </>;
}

