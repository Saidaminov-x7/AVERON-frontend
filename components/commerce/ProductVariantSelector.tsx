'use client';

import { useLocale } from 'next-intl';

interface ProductVariant { id: string; color?: string | null; size?: string | null; stock?: number; available?: boolean; }
interface ProductVariantSelectorProps { variants: ProductVariant[]; sizeValue: string; colorValue: string; label: string; sizeLabel: string; colorLabel: string; availabilityLabel: (available: boolean) => string; onChange: (variantId: string, size: string, color: string) => void; }

const colorNames = {
  black: { ru: '\u0447\u0451\u0440\u043d\u044b\u0439', uz: 'qora', en: 'black' },
  white: { ru: '\u0431\u0435\u043b\u044b\u0439', uz: 'oq', en: 'white' },
  red: { ru: '\u043a\u0440\u0430\u0441\u043d\u044b\u0439', uz: 'qizil', en: 'red' },
  blue: { ru: '\u0441\u0438\u043d\u0438\u0439', uz: '\u043a\u043e\u0027\u043a', en: 'blue' },
  darkBlue: { ru: '\u0442\u0451\u043c\u043d\u043e-\u0441\u0438\u043d\u0438\u0439', uz: '\u0442\u043e\u0027\u043a \u043a\u043e\u0027\u043a', en: 'dark blue' },
  lightBlue: { ru: '\u0441\u0432\u0435\u0442\u043b\u043e-\u0441\u0438\u043d\u0438\u0439', uz: '\u043e\u0447 \u043a\u043e\u0027\u043a', en: 'light blue' },
  green: { ru: '\u0437\u0435\u043b\u0451\u043d\u044b\u0439', uz: 'yashil', en: 'green' },
  yellow: { ru: '\u0436\u0451\u043b\u0442\u044b\u0439', uz: 'sariq', en: 'yellow' },
  gray: { ru: '\u0441\u0435\u0440\u044b\u0439', uz: 'kulrang', en: 'gray' },
  beige: { ru: '\u0431\u0435\u0436\u0435\u0432\u044b\u0439', uz: 'bej', en: 'beige' },
  brown: { ru: '\u043a\u043e\u0440\u0438\u0447\u043d\u0435\u0432\u044b\u0439', uz: 'jigarrang', en: 'brown' },
  pink: { ru: '\u0440\u043e\u0437\u043e\u0432\u044b\u0439', uz: 'pushti', en: 'pink' },
  purple: { ru: '\u0444\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439', uz: 'binafsha', en: 'purple' },
  orange: { ru: '\u043e\u0440\u0430\u043d\u0436\u0435\u0432\u044b\u0439', uz: '\u0442\u043e\u0027q sariq', en: 'orange' },
  custom: { ru: '\u0434\u0440\u0443\u0433\u043e\u0439 \u0446\u0432\u0435\u0442', uz: 'boshqa rang', en: 'custom color' },
} as const;

const colorAliases: Record<string, keyof typeof colorNames> = {
  black: 'black', '\u0447\u0451\u0440\u043d\u044b\u0439': 'black', '\u0447\u0435\u0440\u043d\u044b\u0439': 'black', qora: 'black',
  white: 'white', '\u0431\u0435\u043b\u044b\u0439': 'white', oq: 'white',
  red: 'red', '\u043a\u0440\u0430\u0441\u043d\u044b\u0439': 'red', '\u043a\u0440\u0430\u0441\u043d\u0430\u044f': 'red', qizil: 'red',
  blue: 'blue', '\u0441\u0438\u043d\u0438\u0439': 'blue', '\u0441\u0438\u043d\u044f\u044f': 'blue', '\u0433\u043e\u043b\u0443\u0431\u043e\u0439': 'lightBlue',
  'light blue': 'lightBlue', 'dark blue': 'darkBlue', 'dark-blue': 'darkBlue', navy: 'darkBlue',
  '\u0442\u0451\u043c\u043d\u043e-\u0441\u0438\u043d\u0438\u0439': 'darkBlue', '\u0442\u0435\u043c\u043d\u043e-\u0441\u0438\u043d\u0438\u0439': 'darkBlue',
  green: 'green', '\u0437\u0435\u043b\u0451\u043d\u044b\u0439': 'green', '\u0437\u0435\u043b\u0435\u043d\u044b\u0439': 'green', yashil: 'green',
  yellow: 'yellow', '\u0436\u0451\u043b\u0442\u044b\u0439': 'yellow', '\u0436\u0435\u043b\u0442\u044b\u0439': 'yellow', sariq: 'yellow',
  gray: 'gray', grey: 'gray', '\u0441\u0435\u0440\u044b\u0439': 'gray', kulrang: 'gray',
  beige: 'beige', '\u0431\u0435\u0436\u0435\u0432\u044b\u0439': 'beige', bej: 'beige',
  brown: 'brown', '\u043a\u043e\u0440\u0438\u0447\u043d\u0435\u0432\u044b\u0439': 'brown', jigarrang: 'brown',
  pink: 'pink', '\u0440\u043e\u0437\u043e\u0432\u044b\u0439': 'pink', pushti: 'pink',
  purple: 'purple', violet: 'purple', '\u0444\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439': 'purple', binafsha: 'purple',
  orange: 'orange', '\u043e\u0440\u0430\u043d\u0436\u0435\u0432\u044b\u0439': 'orange',
};

const hexColorAliases: Record<string, keyof typeof colorNames> = {
  '#000000': 'black', '#ffffff': 'white', '#ff0000': 'red', '#0000ff': 'blue',
  '#000080': 'darkBlue', '#1e3a8a': 'darkBlue', '#87ceeb': 'lightBlue', '#00ffff': 'blue',
  '#008000': 'green', '#ffff00': 'yellow', '#808080': 'gray', '#f5f5dc': 'beige',
  '#a52a2a': 'brown', '#ffc0cb': 'pink', '#800080': 'purple', '#ffa500': 'orange',
};

const colorSwatches: Record<keyof typeof colorNames, string> = {
  black: '#171717', white: '#f5f5f5', red: '#ef4444', blue: '#2563eb',
  darkBlue: '#172554', lightBlue: '#7dd3fc', green: '#15803d', yellow: '#facc15',
  gray: '#9ca3af', beige: '#f5f5dc', brown: '#8b5e3c', pink: '#f9a8d4',
  purple: '#9333ea', orange: '#f97316',
  custom: '#a3a3a3',
};

export function parseVariantColor(value: string, fallbackName: string, locale = 'ru') {
  const [rawName, rawHex] = value.split('::').map((part) => part.trim());
  const candidateHex = rawHex ?? rawName;
  const explicitHex = /^#[0-9a-fA-F]{6}$/.test(candidateHex ?? '') ? candidateHex.toUpperCase() : null;
  const normalizedName = rawName?.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  const colorKey = (normalizedName && colorAliases[normalizedName]) || (explicitHex && hexColorAliases[explicitHex.toLowerCase()]);
  const localizedColor = colorKey ? colorNames[colorKey][locale as keyof typeof colorNames[typeof colorKey]] : null;
  const hex = explicitHex ?? (colorKey ? colorSwatches[colorKey] : null);
  const name = localizedColor ?? (rawName && rawName !== candidateHex ? rawName : fallbackName);
  return { name: colorKey ? name : explicitHex ? fallbackName : name, hex };
}

export function isVariantUnavailable(available?: boolean, stock?: number) {
  return available === false || (available !== true && typeof stock === 'number' && stock <= 0);
}

export function ProductVariantSelector({ variants, sizeValue, colorValue, label, sizeLabel, colorLabel, availabilityLabel, onChange }: ProductVariantSelectorProps) {
  const locale = useLocale();
  if (variants.length === 0) return null;
  const sizes = [...new Set(variants.map(({ size }) => size).filter((size): size is string => Boolean(size)))];
  const colors = [...new Set(variants.map(({ color }) => color).filter((color): color is string => Boolean(color)))];
  const chooseVariant = (field: 'size' | 'color', option: string) => {
    const nextSize = field === 'size' ? option : sizeValue;
    const nextColor = field === 'color' ? option : colorValue;
    const matching = variants.find((variant) =>
      (!variant.size || variant.size === nextSize) && (!variant.color || variant.color === nextColor),
    );
    const complete = (!sizes.length || Boolean(nextSize)) && (!colors.length || Boolean(nextColor));
    onChange(complete && matching ? matching.id : '', nextSize, nextColor);
  };
  const renderOptions = (field: 'size' | 'color', options: string[], title: string, selectedValue?: string | null) => (
    <fieldset key={field} className="space-y-2">
      <legend className="text-sm font-semibold text-[var(--color-text)]">
        {title}{selectedValue ? <span className="font-normal">: {selectedValue}</span> : null}
      </legend>
      <div className={`flex flex-wrap ${field === 'color' ? 'items-center gap-3' : 'gap-2'}`}>
        {options.map((option) => {
          const otherField = field === 'size' ? 'color' : 'size';
          const otherValue = otherField === 'size' ? sizeValue : colorValue;
          const matching = variants.filter((variant) => variant[field] === option && (!otherValue || variant[otherField] === otherValue));
          const optionUnavailable = matching.every((variant) => isVariantUnavailable(variant.available, variant.stock));
          const active = (field === 'size' ? sizeValue : colorValue) === option;
          const parsedColor = field === 'color' ? parseVariantColor(option, colorLabel, locale) : null;
          const accessibleColorName = parsedColor?.name ?? option;
          const optionClass = field === 'color'
            ? `relative inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${active ? 'ring-2 ring-[var(--color-text)] ring-offset-2 ring-offset-[var(--color-surface)]' : ''} ${optionUnavailable ? 'opacity-40' : ''}`
            : `relative inline-flex min-h-11 min-w-11 items-center justify-center border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${active ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-surface)]' : optionUnavailable ? 'border-[var(--color-border)] bg-[linear-gradient(to_bottom_right,transparent_48%,var(--color-border)_49%,var(--color-border)_51%,transparent_52%)] text-[var(--color-muted)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-text)]'}`;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              aria-label={field === 'color'
                ? `${colorLabel}: ${accessibleColorName}${parsedColor?.hex ? ` (${parsedColor.hex})` : ''}, ${availabilityLabel(!optionUnavailable)}`
                : `${option}, ${availabilityLabel(!optionUnavailable)}`}
              title={field === 'color' ? accessibleColorName : undefined}
              disabled={optionUnavailable}
              onClick={() => chooseVariant(field, option)}
              className={optionClass}
            >
              {field === 'color' ? (
                <>
                  <span aria-hidden="true" className="size-7 rounded-full border border-black/15 shadow-sm" style={{ backgroundColor: parsedColor?.hex ?? '#a3a3a3' }} />
                  {optionUnavailable && <span aria-hidden="true" className="absolute h-px w-8 rotate-45 bg-[var(--color-border)]" />}
                </>
              ) : option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
  const selectedColorName = colorValue ? parseVariantColor(colorValue, colorLabel, locale).name : null;
  return (
    <div className="space-y-4" role="group" aria-label={label}>
      {sizes.length > 0 ? renderOptions('size', sizes, sizeLabel, sizeValue) : null}
      {colors.length > 0 ? renderOptions('color', colors, colorLabel, selectedColorName) : null}
    </div>
  );
}
