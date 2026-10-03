export function getSearchSuggestions(q: string) {
  const lower = q.toLowerCase().trim();
  if (!lower) return [];

  const suggestions: { icon: string; text: string; sub: string; href: string }[] = [];
  const categorySuggestions = [
    { pattern: /(куртк|пальто|пуховик|jacket|coat)/i, text: 'Верхняя одежда', category: 'women' },
    { pattern: /(плать|юбк|dress|skirt)/i, text: 'Женская одежда', category: 'women' },
    { pattern: /(кроссов|ботин|туфл|обув|shoes|sneaker)/i, text: 'Обувь', category: 'shoes' },
    { pattern: /(сумк|ремн|очк|аксессуар|bag|accessor)/i, text: 'Аксессуары', category: 'accessories' },
    { pattern: /(мужск|рубаш|брюк|men)/i, text: 'Мужская одежда', category: 'men' },
  ];

  for (const item of categorySuggestions) {
    if (item.pattern.test(lower)) {
      suggestions.push({ icon: 'sparkles', text: item.text, sub: 'Открыть подходящие товары', href: `/catalog?category=${item.category}` });
    }
  }

  suggestions.push({ icon: 'search', text: `Искать «${q}»`, sub: 'Поиск по каталогу AVERON', href: `/catalog?q=${encodeURIComponent(q)}` });
  return suggestions.slice(0, 5);
}
