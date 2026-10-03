// lib/sectionTypes.ts
// ЕДИНЫЙ источник правды по структуре content для всех типов секций.
// Импортируется и фронтендом, и админкой, и бэкендом (через shared-types).

export type SectionType =
  | 'HERO_SEARCH'
  | 'BENEFITS'
  | 'POPULAR_LISTINGS'
  | 'CTA_BANNER'
  | 'CATEGORIES'
  | 'TEXT_BLOCK'
  | 'CUSTOM_HTML'
  | 'TEAM_MEMBERS'
  | 'FAQ_ACCORDION'
  | 'CONTACT_INFO'
  | 'PLATFORM_STATS';

export interface QuickFilter {
  label: string;
  href: string;
}

export interface HeroSearchContent {
  title: string;
  subtitle: string;
  showSearch: boolean;
  searchPlaceholder: string;
  badgeText?: string;
  quickFilters?: QuickFilter[];
}

export interface BenefitItem {
  icon?: string; // имя иконки lucide-react, например "ShieldCheck"
  title: string;
  text: string;
}
export interface BenefitsContent {
  title: string;
  items: BenefitItem[];
}

export interface PopularProductsContent {
  title: string;
  subtitle?: string;
  viewAllText: string;
  limit: number;
}

export interface CtaBannerContent {
  title: string;
  text: string;
  buttonText: string;
  buttonLink: string;
}

export interface CategoryItem {
  name: string;
  icon: string; // имя иконки lucide-react
  href: string;
}
export interface CategoriesContent {
  title: string;
  categories: CategoryItem[];
}

export interface TextBlockContent {
  title?: string;
  subtitle?: string;
  text: string;
  align?: 'left' | 'center' | 'right';
}

export interface TeamMember {
  name: string;
  role: string;
  photoUrl?: string;
}
export interface TeamMembersContent {
  title: string;
  members: TeamMember[];
}

export interface FaqItem {
  question: string;
  answer: string;
}
export interface FaqAccordionContent {
  title: string;
  items: FaqItem[];
}

export interface ContactInfoContent {
  title: string;
  email?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
  socials?: { telegram?: string; instagram?: string };
}

export interface PlatformStatsContent {
  title: string;
}

export type SectionContentMap = {
  HERO_SEARCH: HeroSearchContent;
  BENEFITS: BenefitsContent;
  POPULAR_LISTINGS: PopularProductsContent;
  CTA_BANNER: CtaBannerContent;
  CATEGORIES: CategoriesContent;
  TEXT_BLOCK: TextBlockContent;
  CUSTOM_HTML: TextBlockContent;
  TEAM_MEMBERS: TeamMembersContent;
  FAQ_ACCORDION: FaqAccordionContent;
  CONTACT_INFO: ContactInfoContent;
  PLATFORM_STATS: PlatformStatsContent;
};

export interface LocalizedContent<T> {
  ru: T;
  uz: T;
  en: T;
}

// Метаданные для UI конструктора (лейблы, иконки, дефолты) — используются только в админке,
// но лежат тут же, чтобы фронт и админка не расходились по списку типов.
export const SECTION_META: Record<
  SectionType,
  { label: string; icon: string; desc: string; defaultTitle: string }
> = {
  HERO_SEARCH: {
    label: 'Поисковая строка / Главный баннер',
    icon: 'Search',
    desc: 'Главный заголовок, подзаголовок, поле поиска и быстрые фильтры',
    defaultTitle: 'Главный баннер с поиском',
  },
  BENEFITS: {
    label: 'Преимущества / Особенности',
    icon: 'Sparkles',
    desc: 'Карточки с иконками, заголовками и описанием преимуществ',
    defaultTitle: 'Преимущества',
  },
  POPULAR_LISTINGS: {
    label: 'Популярные товары',
    icon: 'Flame',
    desc: 'Сетка популярных или рекомендованных товаров из каталога',
    defaultTitle: 'Популярные товары',
  },
  CTA_BANNER: {
    label: 'Призыв к действию (CTA Баннер)',
    icon: 'Megaphone',
    desc: 'Баннер с заголовком, текстом и кнопкой перехода',
    defaultTitle: 'Баннер размещения',
  },
  CATEGORIES: {
    label: 'Категории товаров',
    icon: 'Tag',
    desc: 'Подборка категорий товаров',
    defaultTitle: 'Категории товаров',
  },
  TEXT_BLOCK: {
    label: 'Текстовый блок / Описание',
    icon: 'FileText',
    desc: 'Свободный текстовый контент с заголовком, подзаголовком и форматированным текстом',
    defaultTitle: 'Информация',
  },
  TEAM_MEMBERS: {
    label: 'Наша команда / Эксперты',
    icon: 'Users',
    desc: 'Список членов команды с именами, ролями и фото',
    defaultTitle: 'Наша команда',
  },
  FAQ_ACCORDION: {
    label: 'Часто задаваемые вопросы (FAQ)',
    icon: 'HelpCircle',
    desc: 'Список вопросов и раскрывающихся ответов',
    defaultTitle: 'Вопросы и ответы',
  },
  CONTACT_INFO: {
    label: 'Контакты и обратная связь',
    icon: 'Phone',
    desc: 'Email, телефон, адрес, время работы и ссылки',
    defaultTitle: 'Контакты',
  },
  CUSTOM_HTML: {
    label: 'Произвольный контент / Markdown',
    icon: 'FileCode',
    desc: 'Универсальный блок с форматированным текстом или Markdown',
    defaultTitle: 'Дополнительный блок',
  },
  PLATFORM_STATS: {
    label: 'Статистика платформы',
    icon: 'BarChart3',
    desc: 'Проверенные показатели каталога, пользователей, городов и просмотров',
    defaultTitle: 'Статистика',
  },
};

// Дефолтный контент для каждого типа — используется и при создании секции в админке,
// и как fallback на фронтенде, если content пустой.
export const SECTION_DEFAULTS: SectionContentMap = {
  HERO_SEARCH: {
    title: 'Товары для вашего стиля в AVERON',
    subtitle: 'Откройте одежду, обувь и аксессуары в каталоге AVERON',
    showSearch: true,
    searchPlaceholder: 'Название товара, бренд или категория',
    badgeText: 'Товары со всего мира',
    quickFilters: [
      { label: 'Одежда', href: '/catalog?category=women' },
      { label: 'Обувь', href: '/catalog?category=shoes' },
    ],
  },
  BENEFITS: {
    title: 'Почему выбирают AVERON',
    items: [
      { icon: 'ShieldCheck', title: 'Проверенная информация', text: 'Находите важные сведения о товаре перед покупкой.' },
      { icon: 'Search', title: 'Удобный поиск', text: 'Подбирайте товары по названию, категории и стране.' },
      { icon: 'PackageCheck', title: 'Покупки с AVERON', text: 'Следите за заказом и его статусом в личном кабинете.' },
    ],
  },
  POPULAR_LISTINGS: {
    title: 'Популярные товары',
    subtitle: 'Товары, которые выбирают покупатели AVERON',
    viewAllText: 'Смотреть все',
    limit: 6,
  },
  CTA_BANNER: {
    title: 'Найдите товары для своего стиля',
    text: 'Откройте каталог AVERON и выберите то, что подходит именно вам.',
    buttonText: 'Перейти в каталог',
    buttonLink: '/catalog',
  },
  CATEGORIES: {
    title: 'Категории товаров',
    categories: [
      { name: 'Женская одежда', icon: 'Shirt', href: '/catalog?category=women' },
      { name: 'Мужская одежда', icon: 'Shirt', href: '/catalog?category=men' },
      { name: 'Обувь', icon: 'Footprints', href: '/catalog?category=shoes' },
      { name: 'Аксессуары', icon: 'Watch', href: '/catalog?category=accessories' },
    ],
  },
  TEXT_BLOCK: {
    title: 'О нашем сервисе',
    text: 'AVERON — онлайн-платформа для поиска и покупки товаров с удобным каталогом и сопровождением заказов.',
    align: 'left',
  },
  CUSTOM_HTML: {
    title: 'Дополнительный блок',
    text: 'Текст блока.',
    align: 'left',
  },
  TEAM_MEMBERS: {
    title: 'Наша команда',
    members: [{ name: 'Иван Иванов', role: 'Основатель' }],
  },
  FAQ_ACCORDION: {
    title: 'Часто задаваемые вопросы',
    items: [
      { question: 'Как оформить заказ?', answer: 'Выберите товар, добавьте его в корзину и следуйте шагам оформления заказа.' },
      { question: 'Где посмотреть статус заказа?', answer: 'Статус и детали заказа доступны в личном кабинете AVERON.' },
      { question: 'Как связаться с поддержкой?', answer: 'Напишите нам через Telegram или на email support@averon.uz.' },
    ],
  },
  CONTACT_INFO: {
    title: 'Контакты',
    email: 'support@averon.uz',
    phone: '+998 71 200-00-00',
    address: 'г. Ташкент, Узбекистан',
    workingHours: 'Пн–Пт, 9:00–18:00',
  },
  PLATFORM_STATS: {
    title: 'AVERON в цифрах',
  },
};
