'use client';

interface ProductVariant { id: string; color?: string | null; size?: string | null; stock?: number; available?: boolean; }
interface ProductVariantSelectorProps { variants: ProductVariant[]; value: string; label: string; sizeLabel: string; colorLabel: string; availabilityLabel: (available: boolean) => string; onChange: (variantId: string) => void; }

export function parseVariantColor(value: string, fallbackName: string) {
  const [rawName, rawHex] = value.split('::').map((part) => part.trim());
  const candidateHex = rawHex ?? rawName;
  const hex = /^#[0-9a-fA-F]{6}$/.test(candidateHex ?? '') ? candidateHex.toUpperCase() : null;
  const name = hex && (!rawName || rawName === candidateHex) ? fallbackName : rawName || fallbackName;
  return { name, hex };
}

export function isVariantUnavailable(available?: boolean, stock?: number) {
  return available === false || (available !== true && typeof stock === 'number' && stock <= 0);
}

export function ProductVariantSelector({ variants, value, label, sizeLabel, colorLabel, availabilityLabel, onChange }: ProductVariantSelectorProps) {
  if (variants.length === 0) return null;
  const selected = variants.find((variant) => variant.id === value) ?? variants[0];
  const sizes = [...new Set(variants.map(({ size }) => size).filter((size): size is string => Boolean(size)))];
  const colors = [...new Set(variants.map(({ color }) => color).filter((color): color is string => Boolean(color)))];
  const chooseVariant = (field: 'size' | 'color', option: string) => {
    const matching = variants.filter((variant) => variant[field] === option);
    const sameOtherChoice = matching.find((variant) => variant[field === 'size' ? 'color' : 'size'] === selected[field === 'size' ? 'color' : 'size']);
    const available = matching.find((variant) => !isVariantUnavailable(variant.available, variant.stock));
    onChange((sameOtherChoice ?? available ?? matching[0]).id);
  };
  const renderOptions = (field: 'size' | 'color', options: string[], title: string) => (
    <fieldset key={field} className="space-y-2">
      <legend className="text-sm font-semibold text-[var(--color-text)]">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const matching = variants.filter((variant) => variant[field] === option);
          const optionUnavailable = matching.every((variant) => isVariantUnavailable(variant.available, variant.stock));
          const active = selected[field] === option;
          const parsedColor = field === 'color' ? parseVariantColor(option, colorLabel) : null;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              aria-label={`${parsedColor?.name ?? option}${parsedColor?.hex ? ` (${parsedColor.hex})` : ''}, ${availabilityLabel(!optionUnavailable)}`}
              onClick={() => chooseVariant(field, option)}
              className={`relative inline-flex min-h-11 items-center gap-2 border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${active ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-surface)]' : optionUnavailable ? 'border-[var(--color-border)] bg-[linear-gradient(to_bottom_right,transparent_48%,var(--color-border)_49%,var(--color-border)_51%,transparent_52%)] text-[var(--color-muted)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-text)]'}`}
            >
              {parsedColor?.hex ? <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-black/15 shadow-sm" style={{ backgroundColor: parsedColor.hex }} /> : null}
              <span>{parsedColor?.name ?? option}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
  return (
    <div className="space-y-4" role="group" aria-label={label}>
      {sizes.length > 0
        ? renderOptions('size', sizes, sizeLabel)
        : colors.length > 1
          ? renderOptions('color', colors, colorLabel)
          : null}
      {sizes.length > 0 && colors.length > 1 ? renderOptions('color', colors, colorLabel) : null}
    </div>
  );
}
