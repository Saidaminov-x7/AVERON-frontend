'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { NavLink } from '@/lib/siteSettings';
import {
  Search, X, Heart, ChevronRight, LogIn, LogOut, Menu, User, Scale, ShoppingCart,
  Headphones,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCompareStore } from '@/store/useCompareStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCommerceCart } from '@/hooks/useCommerceCart';
import { getSearchSuggestions } from '@/lib/data';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { localizeHrefPreservingSafeQuery } from '@/lib/safe-navigation';

const LOCALES = [
  { code: 'ru', short: 'RU', label: 'Русский' },
  { code: 'uz', short: 'UZ', label: 'O‘zbekcha' },
  { code: 'en', short: 'EN', label: 'English' },
] as const;

const BTN_CLASS =
  'averon-control-button averon-icon-button h-11 shrink-0';

const MARKET_COPY = {
  ru: {
    catalog: 'Каталог', china: 'Из Китая', usa: 'Из США', turkey: 'Из Турции',
    europe: 'Европа', orders: 'Мои заказы', markets: 'Магазины мира',
  },
  uz: {
    catalog: 'Katalog', china: 'Xitoydan', usa: 'AQShdan', turkey: 'Turkiyadan',
    europe: 'Yevropa', orders: 'Buyurtmalarim', markets: 'Dunyo do‘konlari',
  },
  en: {
    catalog: 'Catalog', china: 'From China', usa: 'From USA', turkey: 'From Turkey',
    europe: 'Europe', orders: 'My orders', markets: 'Shop by country',
  },
} as const;

function localeHref(pathname: string, code: string, search: string) {
  return localizeHrefPreservingSafeQuery(pathname, search ? `?${search}` : '', code);
}

function LanguagePicker({ onSelect }: { onSelect?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('nav');
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const search = searchParams.toString();

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 150);
    }
    setOpen((v) => !v);
  };

  const handleSelectLocale = (code: string) => {
    setOpen(false);
    onSelect?.();
    const targetUrl = localeHref(pathname, code, search);
    router.push(targetUrl, { scroll: false });
  };

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => {
            menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
          });
        }}
        className={BTN_CLASS + ' gap-2 !w-auto px-3 text-sm font-semibold ' + (open ? '!border-primary-500 !text-primary-600 dark:!text-primary-400' : '')}
        aria-label={t('language')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="font-semibold tracking-wide">{current.short}</span>
      </button>
      <div
        ref={menuRef}
        role="menu"
        aria-hidden={!open}
        inert={!open}
        onKeyDown={(event) => {
          const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
          const index = items.indexOf(document.activeElement as HTMLButtonElement);
          const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : event.key === 'ArrowDown'
                ? (index + 1) % items.length
                : event.key === 'ArrowUp'
                  ? (index <= 0 ? items.length - 1 : index - 1)
                  : -1;
          if (nextIndex < 0 || items.length === 0) return;
          event.preventDefault();
          items[nextIndex]?.focus();
        }}
        className={
          'averon-menu-surface absolute right-0 z-50 w-40 overflow-hidden py-1 ' +
          (prefersReducedMotion ? 'transition-none ' : 'transition-all duration-200 ') +
          (openUpward ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right') + ' ' +
          (open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0')
        }
      >
        {LOCALES.map(({ code, short, label }) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              onClick={() => handleSelectLocale(code)}
              className={
                'averon-menu-item text-xs font-medium ' +
                (prefersReducedMotion ? '' : 'transition-colors ') +
                (active
                  ? '!bg-[var(--color-surface-soft)] !text-[var(--color-text)]'
                  : '')
              }
            >
              <span className="ml-2 flex-1">{label}</span>
              <span className="text-[10px] text-stone-400">{short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Header({ locale: localeProp }: { locale?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() || localeProp || 'ru';
  const t = useTranslations('nav');
  const { data: settings } = useSiteSettings();
  const marketCopy = MARKET_COPY[locale as keyof typeof MARKET_COPY] ?? MARKET_COPY.ru;
  const countryLinks = [
    { href: '/catalog?country=CN', label: marketCopy.china },
    { href: '/catalog?country=US', label: marketCopy.usa },
    { href: '/catalog?country=TR', label: marketCopy.turkey },
    { href: '/catalog?country=IT', label: marketCopy.europe },
  ];
  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/catalog', label: t('catalog') },
    { href: '/ai', label: 'AI' },
    { href: '/about', label: t('about') },
  ];
  const labelForHref = (href: string, fallback: unknown) => navLinks.find((item) => item.href === href)?.label || String(fallback || '');
  const configuredNavLinks = (() => {
    const saved = Array.isArray(settings?.navLinks)
      ? settings.navLinks
          .filter((item: NavLink) => item && item.position !== 'footer')
          .map((item: NavLink) => {
            const rawHref = String(item.url || item.href || '/');
            const href = rawHref === '/chat' ? '/support' : rawHref;
            const rawLabel = typeof item.label === 'object'
              ? item.label[locale] || item.label.en || item.label.uz || item.label.ru
              : item.label;
            return { href, label: labelForHref(href, rawLabel) };
          })
          .filter((item: { href: string }) => !item.href.includes('/add-listing'))
      : [];
    const source = [...navLinks, ...saved];
    const unique = source.filter((item: { href: string }, index: number, items: Array<{ href: string }>) =>
      items.findIndex((candidate) => candidate.href === item.href) === index,
    );
    if (!unique.some((item: { href: string }) => item.href === '/ai')) {
      const catalogIndex = unique.findIndex((item: { href: string }) => item.href === '/catalog');
      unique.splice(catalogIndex >= 0 ? catalogIndex + 1 : 0, 0, navLinks[1]);
    }
    return unique;
  })();
  const visibleNavLinks = [
    navLinks[0],
    ...configuredNavLinks.filter((item: { href: string }) => item.href !== '/'),
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ReturnType<typeof getSearchSuggestions>>([]);
  const [mobileSuggestions, setMobileSuggestions] = useState<ReturnType<typeof getSearchSuggestions>>([]);
  const [scrolled, setScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const favCount = useFavoritesStore((s) => s.ids.length);
  const compareCount = useCompareStore((s) => s.ids.length);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { data: cart } = useCommerceCart();
  const cartCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const cartLabel = t('cart');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const wasMobileOpen = useRef(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mobileCloseButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !mobileDrawerRef.current) return;
      const focusable = Array.from(mobileDrawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', closeOnDesktop);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      wasMobileOpen.current = true;
    } else if (wasMobileOpen.current) {
      wasMobileOpen.current = false;
      mobileMenuButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const to = (p: string) => (p === '/' ? `/${locale}` : `/${locale}${p}`);
  const isActive = (p: string) => pathname === to(p) || (p !== '/' && pathname.startsWith(to(p)));

  const handleQuery = (val: string) => {
    setQuery(val);
    setSuggestions(getSearchSuggestions(val));
  };

  const handleMobileQuery = (val: string) => {
    setQuery(val);
    setMobileSuggestions(getSearchSuggestions(val));
  };

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(`/${locale}/catalog?q=${encodeURIComponent(q.trim())}`);
  };

  const navTo = (href: string) => {
    setSearchOpen(false);
    setMobileOpen(false);
    setQuery('');
    router.push(`/${locale}${href}`);
  };
  const closeMobileMenu = () => setMobileOpen(false);
  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
    router.push(to('/login'));
  };

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
    (r) => pathname === `/${locale}${r}` || pathname.startsWith(`/${locale}${r}/`)
  );

  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-40 flex h-[calc(5rem+env(safe-area-inset-top))] w-full items-center border-b border-stone-200/80 bg-white/95 pt-[env(safe-area-inset-top)] dark:border-white/10 dark:bg-[#1A1A1A]/95 sm:h-20 sm:pt-0">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={to('/')}
            className="flex items-center gap-1.5 rounded-sm text-sm text-stone-400 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
            <span className="font-semibold tracking-tight text-[var(--color-text)]">{settings?.siteName || 'AVERON'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguagePicker />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        ref={searchRef}
        className={cn(
          'sticky top-0 z-40 flex h-[calc(4.5rem+env(safe-area-inset-top))] w-full items-center border-b border-[var(--color-border)] pt-[env(safe-area-inset-top)] transition-[background-color,backdrop-filter] duration-300 sm:h-[72px] sm:pt-0',
          scrolled
            ? 'bg-[color-mix(in_srgb,var(--color-surface)_90%,transparent)] backdrop-blur-2xl'
            : 'bg-[var(--color-surface)]'
        )}
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Left: Logo & Nav */}
          <div className="flex min-w-0 items-center gap-7">
            <Link
              href={to('/')}
              className="flex items-center shrink-0 hover:opacity-80 transition-opacity"
            >
              <span className="max-w-40 truncate text-xl font-black tracking-[0.18em] text-stone-950 dark:text-white">{settings?.siteName || 'AVERON'}</span>
            </Link>

            <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t('menu')}>
              {visibleNavLinks.filter(({ href }) => href !== '/').map(({ href, label }) => (
                  <Link
                    key={href}
                    href={to(href)}
                    className={
                      'whitespace-nowrap border-b-2 border-transparent px-2.5 py-2 text-[13px] font-semibold transition-colors ' +
                      (isActive(href)
                        ? 'border-[var(--color-text)] text-[var(--color-text)]'
                        : 'text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white')
                    }
                  >
                    {label}
                  </Link>
                ))}
            </nav>
          </div>

          {/* Right Desktop items */}
          <div className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 lg:flex">
            <div className="relative mx-2 w-full max-w-[300px]">
              <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="relative flex items-center">
                <Search size={17} className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => handleQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('search')}
                  className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none transition focus:border-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
                />
              </form>
              {suggestions.length > 0 && (
                <div className="averon-menu-surface absolute inset-x-0 top-full z-50 mt-2 overflow-hidden">
                  {suggestions.map((item, i) => (
                    <button key={i} type="button" onClick={() => navTo(item.href)} className="averon-menu-item gap-3 text-xs">
                      <span className="text-sm">{item.icon}</span>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate font-semibold text-[var(--color-text)]">{item.text}</p>
                        <p className="truncate text-[11px] text-[var(--color-muted)]">{item.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href={to('/favorites')} aria-label={t('favorites')} className={`${BTN_CLASS} relative`}>
              <Heart size={17} />
              {favCount > 0 && (
                <motion.span
                  key={favCount}
                  initial={{ scale: prefersReducedMotion ? 1 : 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white shadow"
                >
                  {favCount}
                </motion.span>
              )}
            </Link>

            <Link href={to('/cart')} aria-label={`${cartLabel}${cartCount ? `, ${cartCount}` : ''}`} className={`${BTN_CLASS} relative`}>
              <ShoppingCart size={17} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: prefersReducedMotion ? 1 : 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white shadow"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            <LanguagePicker />

            {isAuthenticated ? (
              <Link
                href={to('/profile')}
                className="averon-secondary-button h-10 gap-2 px-3.5 text-sm"
              >
                <User size={16} />
                <span className="max-w-[120px] truncate">{user?.name || t('profile')}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-1">
                <Link href={to('/login')} className="averon-secondary-button h-10 whitespace-nowrap px-4 text-sm font-semibold">
                  {t('login')}
                </Link>
                <Link href={to('/register')} className="averon-primary-button h-10 whitespace-nowrap px-4 text-sm">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile & Tablet primary actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={t('search')}
              aria-expanded={searchOpen}
              aria-controls="mobile-header-search"
              className={BTN_CLASS}
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            <Link href={to('/cart')} aria-label={`${cartLabel}${cartCount ? `, ${cartCount}` : ''}`} className={`${BTN_CLASS} relative`}>
              <ShoppingCart size={17} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: prefersReducedMotion ? 1 : 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white shadow"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            {/* Бургер */}
            <button
              type="button"
              aria-label={t('menu')}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              ref={mobileMenuButtonRef}
              onClick={() => { setSearchOpen(false); setMobileOpen(true); }}
              className={BTN_CLASS}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
        {searchOpen && (
          <div id="mobile-header-search" className="averon-menu-surface absolute inset-x-4 top-full z-50 p-3 lg:hidden">
            <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="relative flex items-center">
              <Search size={16} className="pointer-events-none absolute left-3 text-stone-400" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => handleQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('search')}
                className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] pl-10 pr-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </form>
            {suggestions.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-stone-200 dark:border-white/10">
                {suggestions.map((item, i) => (
                  <button
                    key={`${item.href}-${i}`}
                    type="button"
                    onClick={() => navTo(item.href)}
                    className="averon-menu-item gap-3 text-sm"
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      <button
        type="button"
        aria-label={t('close')}
        tabIndex={mobileOpen ? 0 : -1}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        onClick={closeMobileMenu}
        className={
          `fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] transition-opacity ${prefersReducedMotion ? 'duration-0' : 'duration-300'} lg:hidden ` +
          (mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')
        }
      />

      <div
        id="mobile-navigation"
        ref={mobileDrawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        style={{
          transitionTimingFunction: 'var(--ease-drawer)',
        }}
        className={
          `fixed inset-0 z-[61] flex h-dvh w-full flex-col overflow-y-auto bg-[var(--color-surface)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-[var(--color-text)] transition-transform ${prefersReducedMotion ? 'duration-0' : 'duration-300'} lg:hidden ` +
          (mobileOpen ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <div className="flex min-w-0 items-baseline gap-2 min-[360px]:gap-3">
            <Link href={to('/')} onClick={closeMobileMenu} className="truncate text-base font-black tracking-[0.16em] text-[var(--color-text)] min-[360px]:text-lg min-[360px]:tracking-[0.2em]">
              {settings?.siteName || 'AVERON'}
            </Link>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] min-[280px]:inline">{t('menu')}</span>
          </div>
          <button
            ref={mobileCloseButtonRef}
            type="button"
            aria-label={t('close')}
            onClick={closeMobileMenu}
            className={`${BTN_CLASS} ml-3`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-auto w-full max-w-xl flex-none px-5 pb-8 pt-6">
          <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => handleMobileQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('search')}
              autoComplete="off"
              enterKeyHint="search"
              className="h-12 w-full border-0 border-b border-[var(--color-border)] bg-transparent pl-9 pr-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
            />
          </form>
          {mobileSuggestions.length > 0 && (
            <div className="averon-menu-surface mt-2 overflow-hidden">
              {mobileSuggestions.map((item, i) => (
                <button
                  key={`${item.href}-${i}`}
                  type="button"
                  onClick={() => navTo(item.href)}
                  className="averon-menu-item gap-3 text-sm"
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="truncate">{item.text}</span>
                </button>
              ))}
            </div>
          )}

          <section className="mt-5" aria-labelledby="mobile-markets-title">
            <p id="mobile-markets-title" className="px-1 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--color-muted)]">
              {marketCopy.markets}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-0">
              {countryLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={to(href)}
                  onClick={closeMobileMenu}
                  className="flex min-h-12 items-center justify-between border-b border-[var(--color-border)] px-0 text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-muted)]"
                >
                  <span>{label}</span>
                  <ChevronRight size={15} className="text-[var(--color-muted)]" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

          <nav aria-label={t('menu')} className="mt-8 border-t border-[var(--color-border)]">
            <div>
              {visibleNavLinks.map(({ href, label }, index) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href.startsWith('http') ? href : to(href)}
                    onClick={closeMobileMenu}
                    aria-current={active ? 'page' : undefined}
                    className={
                      'group flex min-h-[64px] items-center gap-4 border-b border-[var(--color-border)] px-0 transition-colors ' +
                      (active
                        ? 'text-[var(--color-text)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]')
                    }
                  >
                    <span className="w-6 shrink-0 text-[10px] font-semibold tabular-nums tracking-[.12em] text-[var(--color-muted)]" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">{label}</span>
                    <ChevronRight size={16} className="shrink-0 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </nav>

          {(() => {
            const utilityLinks = [
              { href: '/favorites', label: t('favorites'), icon: <Heart size={17} />, count: favCount },
              { href: '/compare', label: t('compare'), icon: <Scale size={17} />, count: compareCount },
              { href: '/cart', label: t('cart'), icon: <ShoppingCart size={17} />, count: cartCount },
              { href: '/support', label: t('support'), icon: <Headphones size={17} />, count: 0 },
            ].filter(({ href }) => !visibleNavLinks.some((item) => item.href === href));

            if (utilityLinks.length === 0) return null;

            return (
              <div className="mt-8">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--color-muted)]">{t('menu')}</p>
                <div className="grid grid-cols-2 gap-x-6">
                  {utilityLinks.map(({ href, label, icon, count }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={href}
                        href={to(href)}
                        onClick={closeMobileMenu}
                        aria-current={active ? 'page' : undefined}
                        aria-label={count > 0 ? `${label}, ${count}` : label}
                        className={
                          'flex min-h-12 items-center gap-2 border-b px-0 transition-colors ' +
                          (active
                            ? 'border-[var(--color-text)] text-[var(--color-text)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]')
                        }
                      >
                        <span className="relative flex h-8 w-8 shrink-0 items-center justify-start text-[var(--color-text)]" aria-hidden="true">
                          {icon}
                          {count > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-text)] px-1 text-[9px] font-bold leading-none text-[var(--color-surface)]">
                              {count > 99 ? '99+' : count}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 truncate text-xs font-semibold">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="mx-auto w-full max-w-xl shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] px-5 pb-5 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">{t('langAndTheme')}</span>
            <div className="flex items-center gap-2">
              <LanguagePicker onSelect={closeMobileMenu} />
              <ThemeToggle />
            </div>
          </div>
          {isAuthenticated ? (
            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              <Link
                href={to('/profile')}
                onClick={closeMobileMenu}
                className="averon-primary-button h-11 min-w-0 gap-2"
              >
                <User size={16} className="shrink-0" />
                <span className="truncate">{user?.name || t('profile')}</span>
              </Link>
              <Link
                href={to('/orders')}
                onClick={closeMobileMenu}
                className="averon-secondary-button h-11"
              >
                {t('orders')}
              </Link>
              <button
                type="button"
                onClick={() => { void handleLogout(); }}
                className="averon-secondary-button col-span-2 h-10 gap-2 text-xs"
              >
                <LogOut size={15} />
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              <Link
                href={to('/login')}
                onClick={closeMobileMenu}
                className="averon-secondary-button h-11 gap-2"
              >
                <LogIn size={15} />
                {t('login')}
              </Link>
              <Link
                href={to('/register')}
                onClick={closeMobileMenu}
                className="averon-primary-button h-11"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
