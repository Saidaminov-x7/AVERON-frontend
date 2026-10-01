interface ProductVariant {
  id: string;
  color?: string | null;
  size?: string | null;
  stock?: number;
  available?: boolean;
}

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  value: string;
  label: string;
  standardLabel: string;
  stockLabel: string;
  availabilityLabel: (available: boolean) => string;
  onChange: (variantId: string) => void;
}

export function isVariantUnavailable(available?: boolean, stock?: number) {
  return available === false || (available !== true && typeof stock === 'number' && stock <= 0);
}

export function ProductVariantSelector({
  variants,
  value,
  label,
  standardLabel,
  stockLabel,
  availabilityLabel,
  onChange,
}: ProductVariantSelectorProps) {
  if (variants.length === 0) return null;

  return (
    <label className="block text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-900"
      >
        {variants.map((variant) => {
          const name = [variant.color, variant.size].filter(Boolean).join(' · ') || standardLabel;
          const unavailable = isVariantUnavailable(variant.available, variant.stock);
          const count = !unavailable && typeof variant.stock === 'number' && Number.isSafeInteger(variant.stock) && variant.stock > 0
            ? stockLabel.replace('{count}', String(variant.stock))
            : null;
          const availability = unavailable
            ? availabilityLabel(false)
            : variant.available === true && !count
              ? availabilityLabel(true)
              : '';

          return (
            <option key={variant.id} value={variant.id} disabled={unavailable}>
              {[name, count, count ? '' : availability].filter(Boolean).join(' · ')}
            </option>
          );
        })}
      </select>
    </label>
  );
}
