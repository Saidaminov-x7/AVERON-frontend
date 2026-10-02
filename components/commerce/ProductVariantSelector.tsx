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
    <div className="block text-sm font-semibold">
      <span>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="mt-1.5 h-11 rounded-xl">
          <SelectValue placeholder={standardLabel} />
        </SelectTrigger>
        <SelectContent>
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
            <SelectItem key={variant.id} value={variant.id} disabled={unavailable}>
              {[name, count, count ? '' : availability].filter(Boolean).join(' · ')}
            </SelectItem>
          );
        })}
        </SelectContent>
      </Select>
    </div>
  );
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
