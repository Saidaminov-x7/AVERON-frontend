export function getSearchSuggestions(q: string, locale = 'ru') {
  const query = q.trim();
  const lower = query.toLowerCase();
  if (!lower) return [];

  const suggestions: { icon: string; text: string; sub: string; href: string }[] = [];
  const categorySuggestions = [
    { pattern: /(куртк|пальто|пуховик|jacket|coat)/i, text: { ru: 'Верхняя одежда', uz: 'Ustki kiyim', en: 'Outerwear' }, category: 'women' },
    { pattern: /(плать|юбк|dress|skirt)/i, text: { ru: 'Женская одежда', uz: 'Ayollar kiyimi', en: 'Women’s clothing' }, category: 'women' },
    { pattern: /(кроссов|ботин|туфл|обув|shoes|sneaker)/i, text: { ru: 'Обувь', uz: 'Oyoq kiyim', en: 'Shoes' }, category: 'shoes' },
    { pattern: /(сумк|ремн|очк|аксессуар|bag|accessor)/i, text: { ru: 'Аксессуары', uz: 'Aksessuarlar', en: 'Accessories' }, category: 'accessories' },
    { pattern: /(мужск|рубаш|брюк|men)/i, text: { ru: 'Мужская одежда', uz: 'Erkaklar kiyimi', en: 'Men’s clothing' }, category: 'men' },
  ];

  for (const item of categorySuggestions) {
    if (item.pattern.test(lower)) {
      const text = item.text[locale as keyof typeof item.text] ?? item.text.ru;
      const sub = locale === 'uz' ? 'Mos mahsulotlarni ko‘rish' : locale === 'en' ? 'View matching products' : 'Открыть подходящие товары';
      suggestions.push({ icon: 'sparkles', text, sub, href: `/catalog?category=${item.category}` });
    }
  }

  const text = locale === 'uz' ? `“${query}” bo‘yicha qidirish` : locale === 'en' ? `Search “${query}”` : `Искать «${query}»`;
  const sub = locale === 'uz' ? 'AVERON katalogidan qidirish' : locale === 'en' ? 'Search the AVERON catalog' : 'Поиск по каталогу AVERON';
  suggestions.push({ icon: 'search', text, sub, href: `/catalog?q=${encodeURIComponent(query)}` });
  return suggestions.slice(0, 5);
}
