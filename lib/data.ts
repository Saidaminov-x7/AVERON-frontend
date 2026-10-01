export type Audience = 'all' | 'students' | 'families' | 'girls' | 'boys';

export interface Listing {
  id: number;
  title: string;
  description?: string;
  price: number;
  city: string;
  district: string;
  type: 'apartment' | 'room' | 'daily';
  rooms: number;
  area: number;
  floor: number;
  totalFloors: number;
  furnished: boolean;
  image: string;
  images?: string[];
  coordinates?: { lat: number; lng: number };
  features: string[];
  forStudents: boolean;
  audience?: Audience;
  phone?: string;
  rating: number;
  reviews?: number;
  verified?: boolean;
  isVerified?: boolean;
  isPromoted?: boolean;
  promotionTier?: 'BASIC' | 'TOP' | 'URGENT';
  author?: { id?: string; name?: string; phone?: string; avatar?: string; createdAt?: string };
  owner?: { id?: string; name?: string; phone?: string; avatar?: string; createdAt?: string };
  createdAt?: string;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Tashkent: { lat: 41.2995, lng: 69.2401 },
  Самарканд: { lat: 39.627, lng: 66.975 },
  Бухара: { lat: 39.7747, lng: 64.4286 },
  Фергана: { lat: 40.3834, lng: 71.7842 },
};

export function getListingCoordinates(listing: Listing) {
  return listing.coordinates ?? CITY_COORDINATES[listing.city] ?? CITY_COORDINATES.Tashkent;
}

export type FilterType = 'all' | 'apartment' | 'room' | 'daily';

export interface GetListingsOptions {
  type?: FilterType;
  forStudents?: boolean;
  region?: string;
  district?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  furnished?: boolean;
  limit?: number;
}

/** Legacy callers receive no local fixtures; listings are loaded from the API. */
export function getListings(_opts?: GetListingsOptions): Listing[] {
  void _opts;
  return [];
}

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
