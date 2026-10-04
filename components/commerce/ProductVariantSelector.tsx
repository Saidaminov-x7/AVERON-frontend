'use client';

interface ProductVariant { id: string; color?: string | null; size?: string | null; stock?: number; available?: boolean; }
interface ProductVariantSelectorProps { variants: ProductVariant[]; value: string; label: string; standardLabel: string; stockLabel: string; availabilityLabel: (available: boolean) => string; onChange: (variantId: string) => void; }

export function isVariantUnavailable(available?: boolean, stock?: number) {
  return available === false || (available !== true && typeof stock === 'number' && stock <= 0);
}

export function ProductVariantSelector({ variants, value, label, standardLabel, availabilityLabel, onChange }: ProductVariantSelectorProps) {
  if (variants.length === 0) return null;
  const selected = variants.find((variant) => variant.id === value) ?? variants[0];
  const selectedUnavailable = isVariantUnavailable(selected.available, selected.stock);
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm font-semibold text-[var(--color-text)]">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {variants.map((variant) => {
          const name = [variant.color, variant.size].filter(Boolean).join(' · ') || standardLabel;
          const unavailable = isVariantUnavailable(variant.available, variant.stock);
          const active = variant.id === selected.id;
          return <button key={variant.id} type="button" role="radio" aria-checked={active} aria-label={`${name}, ${availabilityLabel(!unavailable)}`} onClick={() => onChange(variant.id)} className={`min-h-11 min-w-12 border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${active ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-surface)]' : unavailable ? 'border-[var(--color-border)] bg-[linear-gradient(to_bottom_right,transparent_48%,var(--color-border)_49%,var(--color-border)_51%,transparent_52%)] text-[var(--color-muted)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-text)]'}`}>{name}</button>;
        })}
      </div>
      <p className={`text-sm ${selectedUnavailable ? 'font-semibold text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}`} aria-live="polite">
        {selectedUnavailable ? availabilityLabel(false) : availabilityLabel(true)}
      </p>
    </fieldset>
  );
}
