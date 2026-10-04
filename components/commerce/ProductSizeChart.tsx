type SizeChartType = 'CLOTHING' | 'SHOES' | 'KIDS_CLOTHING';

const content = {
  ru: {
    disclaimer: 'Значения ориентировочные: посадка и мерки могут отличаться у разных брендов.',
    headers: ['Размер', 'Грудь / рост', 'Талия', 'Бёдра'],
    clothing: [
      ['XS', '80–84 см', '62–66 см', '86–90 см'],
      ['S', '84–88 см', '66–70 см', '90–94 см'],
      ['M', '88–94 см', '70–76 см', '94–100 см'],
      ['L', '94–100 см', '76–82 см', '100–106 см'],
      ['XL', '100–108 см', '82–90 см', '106–114 см'],
    ],
    shoesHeaders: ['EU', 'US', 'UK', 'Стопа'],
    shoes: [
      ['36', '5.5', '3.5', '22.5 см'],
      ['37', '6.5', '4.5', '23.5 см'],
      ['38', '7.5', '5.5', '24 см'],
      ['39', '8.5', '6.5', '25 см'],
      ['40', '9', '7', '25.5 см'],
      ['41', '10', '8', '26 см'],
      ['42', '10.5', '8.5', '27 см'],
      ['43', '11.5', '9.5', '27.5 см'],
      ['44', '12', '10', '28 см'],
      ['45', '13', '11', '29 см'],
    ],
    kidsHeaders: ['Возраст', 'Рост', 'Грудь', 'Талия'],
    kids: [
      ['2–3 года', '92–98 см', '52–54 см', '50–52 см'],
      ['3–4 года', '98–104 см', '54–56 см', '52–54 см'],
      ['4–5 лет', '104–110 см', '56–58 см', '54–55 см'],
      ['5–6 лет', '110–116 см', '58–60 см', '55–56 см'],
      ['7–8 лет', '122–128 см', '62–66 см', '57–59 см'],
      ['9–10 лет', '134–140 см', '68–72 см', '60–62 см'],
      ['11–12 лет', '146–152 см', '74–78 см', '63–66 см'],
    ],
  },
  en: {
    disclaimer: 'Measurements are approximate; fit and sizing can vary by brand.',
    headers: ['Size', 'Chest / height', 'Waist', 'Hips'],
    clothing: [
      ['XS', '80–84 cm', '62–66 cm', '86–90 cm'],
      ['S', '84–88 cm', '66–70 cm', '90–94 cm'],
      ['M', '88–94 cm', '70–76 cm', '94–100 cm'],
      ['L', '94–100 cm', '76–82 cm', '100–106 cm'],
      ['XL', '100–108 cm', '82–90 cm', '106–114 cm'],
    ],
    shoesHeaders: ['EU', 'US', 'UK', 'Foot length'],
    shoes: [
      ['36', '5.5', '3.5', '22.5 cm'],
      ['37', '6.5', '4.5', '23.5 cm'],
      ['38', '7.5', '5.5', '24 cm'],
      ['39', '8.5', '6.5', '25 cm'],
      ['40', '9', '7', '25.5 cm'],
      ['41', '10', '8', '26 cm'],
      ['42', '10.5', '8.5', '27 cm'],
      ['43', '11.5', '9.5', '27.5 cm'],
      ['44', '12', '10', '28 cm'],
      ['45', '13', '11', '29 cm'],
    ],
    kidsHeaders: ['Age', 'Height', 'Chest', 'Waist'],
    kids: [
      ['2–3 years', '92–98 cm', '52–54 cm', '50–52 cm'],
      ['3–4 years', '98–104 cm', '54–56 cm', '52–54 cm'],
      ['4–5 years', '104–110 cm', '56–58 cm', '54–55 cm'],
      ['5–6 years', '110–116 cm', '58–60 cm', '55–56 cm'],
      ['7–8 years', '122–128 cm', '62–66 cm', '57–59 cm'],
      ['9–10 years', '134–140 cm', '68–72 cm', '60–62 cm'],
      ['11–12 years', '146–152 cm', '74–78 cm', '63–66 cm'],
    ],
  },
  uz: {
    disclaimer: 'O‘lchamlar taxminiy; kiyim turishi va o‘lchamlar brendga qarab farq qiladi.',
    headers: ['O‘lcham', 'Ko‘krak / bo‘y', 'Bel', 'Son'],
    clothing: [
      ['XS', '80–84 sm', '62–66 sm', '86–90 sm'],
      ['S', '84–88 sm', '66–70 sm', '90–94 sm'],
      ['M', '88–94 sm', '70–76 sm', '94–100 sm'],
      ['L', '94–100 sm', '76–82 sm', '100–106 sm'],
      ['XL', '100–108 sm', '82–90 sm', '106–114 sm'],
    ],
    shoesHeaders: ['EU', 'US', 'UK', 'Oyoq uzunligi'],
    shoes: [
      ['36', '5.5', '3.5', '22.5 sm'],
      ['37', '6.5', '4.5', '23.5 sm'],
      ['38', '7.5', '5.5', '24 sm'],
      ['39', '8.5', '6.5', '25 sm'],
      ['40', '9', '7', '25.5 sm'],
      ['41', '10', '8', '26 sm'],
      ['42', '10.5', '8.5', '27 sm'],
      ['43', '11.5', '9.5', '27.5 sm'],
      ['44', '12', '10', '28 sm'],
      ['45', '13', '11', '29 sm'],
    ],
    kidsHeaders: ['Yosh', 'Bo‘y', 'Ko‘krak', 'Bel'],
    kids: [
      ['2–3 yosh', '92–98 sm', '52–54 sm', '50–52 sm'],
      ['3–4 yosh', '98–104 sm', '54–56 sm', '52–54 sm'],
      ['4–5 yosh', '104–110 sm', '56–58 sm', '54–55 sm'],
      ['5–6 yosh', '110–116 sm', '58–60 sm', '55–56 sm'],
      ['7–8 yosh', '122–128 sm', '62–66 sm', '57–59 sm'],
      ['9–10 yosh', '134–140 sm', '68–72 sm', '60–62 sm'],
      ['11–12 yosh', '146–152 sm', '74–78 sm', '63–66 sm'],
    ],
  },
} as const;

export function ProductSizeChart({
  sizeChartType,
  locale,
  title,
}: {
  sizeChartType?: SizeChartType | null;
  locale: string;
  title: string;
}) {
  if (!sizeChartType) return null;
  const copy = content[locale === 'en' || locale === 'uz' ? locale : 'ru'];
  const isShoes = sizeChartType === 'SHOES';
  const headers = isShoes ? copy.shoesHeaders : sizeChartType === 'KIDS_CLOTHING' ? copy.kidsHeaders : copy.headers;
  const rows = isShoes ? copy.shoes : sizeChartType === 'KIDS_CLOTHING' ? copy.kids : copy.clothing;

  return (
    <section aria-labelledby="product-size-chart-title" className="mt-6">
      <h2 id="product-size-chart-title" className="text-xl font-semibold tracking-tight text-[var(--color-text)]">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-[var(--radius-control)] border border-[var(--color-border)]">
        <table className="w-full min-w-[420px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]">
              {headers.map((header) => <th key={header} scope="col" className="border-r border-[var(--color-border)] px-3 py-2.5 font-semibold last:border-r-0">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row[0]} className="border-b border-[var(--color-border)] last:border-0">
                {row.map((value, index) => <td key={index} className={`border-r border-[var(--color-border)] px-3 py-2.5 text-[var(--color-text)] last:border-r-0 ${rowIndex % 2 ? 'bg-[var(--color-surface-soft)]/45' : ''}`}>{value}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{copy.disclaimer}</p>
    </section>
  );
}
