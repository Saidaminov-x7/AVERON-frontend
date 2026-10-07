import type { ProductSizeChartRow } from '@/lib/products';

type ChartField = keyof ProductSizeChartRow;

const localizedHeaders = {
  ru: ['Размер', 'Плечи, см', 'Грудь, см', 'Длина, см', 'Рукав, см', 'Талия, см', 'Бёдра, см', 'Шаговый шов, см', 'Рост, см', 'Вес, кг'],
  uz: ['O‘lcham', 'Yelka, sm', 'Ko‘krak, sm', 'Uzunlik, sm', 'Yeng, sm', 'Bel, sm', 'Son, sm', 'Ichki chok, sm', 'Bo‘y, sm', 'Vazn, kg'],
  en: ['Size', 'Shoulders, cm', 'Chest, cm', 'Length, cm', 'Sleeve, cm', 'Waist, cm', 'Hips, cm', 'Inseam, cm', 'Height, cm', 'Weight, kg'],
} as const;

const fields: ChartField[] = [
  'size', 'shouldersCm', 'chestCm', 'lengthCm', 'sleeveCm', 'waistCm', 'hipsCm', 'inseamCm',
  'recommendedHeightMinCm', 'recommendedWeightMinKg',
];

function valueFor(row: ProductSizeChartRow, index: number): string | number | undefined {
  if (index === 8) {
    if (row.recommendedHeightMinCm === undefined && row.recommendedHeightMaxCm === undefined) return undefined;
    return `${row.recommendedHeightMinCm ?? '—'}–${row.recommendedHeightMaxCm ?? '—'}`;
  }
  if (index === 9) {
    if (row.recommendedWeightMinKg === undefined && row.recommendedWeightMaxKg === undefined) return undefined;
    return `${row.recommendedWeightMinKg ?? '—'}–${row.recommendedWeightMaxKg ?? '—'}`;
  }
  return row[fields[index]] as string | number | undefined;
}

export function ProductSizeChart({
  sizeChart,
  locale,
  title,
}: {
  sizeChartType?: string | null;
  sizeChart?: ProductSizeChartRow[] | null;
  locale: string;
  title: string;
}) {
  if (!sizeChart?.length) return null;
  const language = locale === 'en' || locale === 'uz' ? locale : 'ru';
  const headers = localizedHeaders[language];
  const activeColumns = fields.map((_, index) => index).filter((index) => index === 0 || sizeChart.some((row) => valueFor(row, index) !== undefined));

  return (
    <section aria-labelledby="product-size-chart-title" className="mt-6">
      <h2 id="product-size-chart-title" className="text-xl font-semibold tracking-tight text-[var(--color-text)]">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-[var(--radius-control)] border border-[var(--color-border)]">
        <table className="w-full min-w-[420px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]">
              {activeColumns.map((index) => <th key={headers[index]} scope="col" className="border-r border-[var(--color-border)] px-3 py-2.5 font-semibold last:border-r-0">{headers[index]}</th>)}
            </tr>
          </thead>
          <tbody>
            {sizeChart.map((row, rowIndex) => (
              <tr key={row.size} className="border-b border-[var(--color-border)] last:border-0">
                {activeColumns.map((index) => <td key={headers[index]} className={`border-r border-[var(--color-border)] px-3 py-2.5 text-[var(--color-text)] last:border-r-0 ${rowIndex % 2 ? 'bg-[var(--color-surface-soft)]/45' : ''}`}>{valueFor(row, index) ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
