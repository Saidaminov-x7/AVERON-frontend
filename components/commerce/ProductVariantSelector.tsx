'use client';

interface ProductVariant { id: string; color?: string | null; size?: string | null; stock?: number; available?: boolean; }
interface ProductVariantSelectorProps { variants: ProductVariant[]; selectedSize: string; selectedColor: string; label: string; sizeLabel: string; colorLabel: string; chooseLabel: string; formatColorLabel: (color: string) => string; availabilityLabel: (available: boolean) => string; onChange: (selection: { size: string; color: string }) => void; }

export function isVariantUnavailable(available?: boolean, stock?: number) {
  return available === false || (available !== true && typeof stock === 'number' && stock <= 0);
}

export function ProductVariantSelector({ variants, selectedSize, selectedColor, label, sizeLabel, colorLabel, chooseLabel, formatColorLabel, availabilityLabel, onChange }: ProductVariantSelectorProps) {
  if (variants.length === 0) return null;
  const sizes = [...new Set(variants.map(({ size }) => size).filter((size): size is string => Boolean(size)))];
  const colors = [...new Set(variants.map(({ color }) => color).filter((color): color is string => Boolean(color)))];
  const chooseVariant = (field: 'size' | 'color', option: string) => {
    onChange({ size: field === 'size' ? option : selectedSize, color: field === 'color' ? option : selectedColor });
  };
  const renderOptions = (field: 'size' | 'color', options: string[], title: string) => (
    <fieldset key={field} className="space-y-2">
      <legend className="text-sm font-semibold text-[var(--color-text)]">{title}: <span className="font-normal text-[var(--color-text-secondary)]">{field === 'color' && selectedColor ? formatColorLabel(selectedColor) : (field === 'size' ? selectedSize : selectedColor) || chooseLabel}</span></legend>
      <div className={`flex flex-wrap ${field === 'color' ? 'items-center gap-3' : 'gap-2'}`}>
        {options.map((option) => {
          const otherField = field === 'size' ? 'color' : 'size';
          const otherSelection = otherField === 'size' ? selectedSize : selectedColor;
          const matching = variants.filter((variant) => variant[field] === option && (!otherSelection || variant[otherField] === otherSelection));
          const optionUnavailable = matching.every((variant) => isVariantUnavailable(variant.available, variant.stock));
          const active = (field === 'size' ? selectedSize : selectedColor) === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              aria-label={`${title}: ${field === 'color' ? formatColorLabel(option) : option}, ${availabilityLabel(!optionUnavailable)}`}
              title={field === 'color' ? formatColorLabel(option) : undefined}
              onClick={() => chooseVariant(field, option)}
              style={field === 'color' ? { backgroundColor: getSwatchColor(option), borderRadius: '50%' } : undefined}
              className={field === 'color'
                ? `grid size-10 place-items-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${active ? 'border-[var(--color-text)] ring-2 ring-[var(--color-surface)] ring-offset-1 ring-offset-[var(--color-text)]' : 'border-[var(--color-border)] hover:border-[var(--color-text)]'} ${optionUnavailable ? 'opacity-40' : ''}`
                : `relative min-h-11 min-w-12 border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${active ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-surface)]' : optionUnavailable ? 'border-[var(--color-border)] bg-[linear-gradient(to_bottom_right,transparent_48%,var(--color-border)_49%,var(--color-border)_51%,transparent_52%)] text-[var(--color-muted)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-text)]'}`}
            >
              {field === 'color'
                ? <span className="sr-only">{option.split('::')[0]}</span>
                : option}
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
        : colors.length > 0
          ? renderOptions('color', colors, colorLabel)
          : null}
      {sizes.length > 0 && colors.length > 0 ? renderOptions('color', colors, colorLabel) : null}
    </div>
  );
}

function getSwatchColor(value: string) {
  const hexMatch = value.match(/#([0-9a-f]{6})/i);
  if (hexMatch) return `#${hexMatch[1]}`;
  const name = value.split('::')[0].trim().toLocaleLowerCase();
  const knownColors: Record<string, string> = {
    blue: '#2563eb', red: '#dc2626', green: '#16a34a', black: '#171717', white: '#ffffff',
    navy: '#1e3a8a', 'dark blue': '#000080', 'dark-blue': '#000080', gray: '#9ca3af', grey: '#9ca3af',
    yellow: '#eab308', pink: '#ec4899', purple: '#9333ea', brown: '#854d0e', orange: '#ea580c',
    синий: '#2563eb', красный: '#dc2626', зелёный: '#16a34a', зеленый: '#16a34a', чёрный: '#171717', черный: '#171717',
    белый: '#ffffff', 'тёмно-синий': '#000080', 'темно-синий': '#000080', серый: '#9ca3af', розовый: '#ec4899',
  };
  return knownColors[name] ?? '#a8a29e';
}
