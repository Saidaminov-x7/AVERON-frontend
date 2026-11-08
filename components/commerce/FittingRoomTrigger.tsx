'use client';

import { useCallback, useState } from 'react';
import { Shirt } from 'lucide-react';
import { FittingRoomDialog } from './FittingRoomDialog';
import { repairMojibake } from '@/lib/repair-mojibake';
import { Button } from '@/components/ui/Button';

export function FittingRoomTrigger({ productId, locale, compact = false, imageUrl }: { productId: string; locale: string; compact?: boolean; imageUrl?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const labels = { ru: 'Примерить', uz: 'Kiyib ko‘rish', en: 'Try it on' };
  const label = repairMojibake(labels[locale as keyof typeof labels] ?? labels.ru);

  return <>
    <Button type="button" variant="outline" onClick={() => setIsOpen(true)} className={`min-h-11 border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text)] hover:border-[#244FC7] hover:text-[#244FC7] dark:hover:border-[#8EA5FF] dark:hover:text-[#8EA5FF] ${compact ? 'w-full' : ''}`}>
      <Shirt size={16} aria-hidden="true" />{label}
    </Button>
    {isOpen && <FittingRoomDialog productId={productId} locale={locale} imageUrl={imageUrl} onClose={close} />}
  </>;
}
