'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { NavLink } from '@/lib/siteSettings';
import {
  Search, X, Heart, ChevronRight, LogIn, LogOut, Menu, User, Scale, ShoppingCart,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCompareStore } from '@/store/useCompareStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCommerceCart } from '@/hooks/useCommerceCart';
import { getSearchSuggestions } from '@/lib/data';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { LanguageFlag, type LocaleFlagCode } from '@/components/ui/LanguageFlag';
import { localizeHrefPreservingSafeQuery } from '@/lib/safe-navigation';

const LOCALES = [
  { code: 'ru', short: 'RU', label: 'Русский' },
  { code: 'uz', short: 'UZ', label: 'O‘zbekcha' },
  { code: 'en', short: 'EN', label: 'English' },
] as const;

const BTN_CLASS =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ' +
  'border-stone-200 bg-white text-stone-600 transition-all duration-200 ' +
  'hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 ' +
  'dark:border-white/10 dark:bg-stone-900 dark:text-stone-300 ' +
  'dark:hover:border-white/20 dark:hover:bg-stone-800 dark:hover:text-white ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50';

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
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const search = searchParams.toString();

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

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
        type="button"
        onClick={handleToggle}
        className={BTN_CLASS + ' gap-2 !w-auto px-3 text-sm font-semibold ' + (open ? '!border-primary-500 !text-primary-600 dark:!text-primary-400' : '')}
        aria-label={t('language')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <LanguageFlag locale={current.code as LocaleFlagCode} className="h-4 w-6" />
        {current.short}
      </button>
      <div
        role="menu"
        className={
          'absolute right-0 z-50 w-40 overflow-hidden rounded-xl border border-stone-200/80 bg-white py-1 shadow-lg ' +
          'dark:border-white/10 dark:bg-stone-900 ' +
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
                'flex min-h-11 w-full items-center px-3 py-2 text-xs font-medium text-left ' +
                (prefersReducedMotion ? '' : 'transition-colors ') +
                (active
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
                  : 'text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-white/5')
              }
            >
              <LanguageFlag locale={code as LocaleFlagCode} className="h-4 w-6" />
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

  const navLinks = [
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
    const source = saved.length > 0 ? saved : navLinks;
    const unique = source.filter((item: { href: string }, index: number, items: Array<{ href: string }>) =>
      items.findIndex((candidate) => candidate.href === item.href) === index,
    );
    if (!unique.some((item: { href: string }) => item.href === '/ai')) {
      const catalogIndex = unique.findIndex((item: { href: string }) => item.href === '/catalog');
      unique.splice(catalogIndex >= 0 ? catalogIndex + 1 : 0, 0, navLinks[1]);
    }
    return unique;
  })();

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
            <div className="h-2 w-2 rounded-full bg-primary-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" />
            <span className="text-primary-400 font-semibold tracking-tight">{settings?.siteName || 'AVERON'}</span>
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
          'sticky top-0 z-40 flex h-[calc(5rem+env(safe-area-inset-top))] w-full items-center pt-[env(safe-area-inset-top)] transition-[background-color,backdrop-filter] duration-300 sm:h-20 sm:pt-0',
          scrolled
            ? 'bg-white/90 backdrop-blur-2xl after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary-500/60 after:to-transparent dark:bg-[#111111]/90'
            : 'bg-white/95 dark:bg-[#111111]/95'
        )}
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-8">
            <Link
              href={to('/')}
              className="flex items-center shrink-0 hover:opacity-80 transition-opacity"
            >
              <span className="max-w-40 truncate text-xl font-black tracking-[0.18em] text-stone-950 dark:text-white">{settings?.siteName || 'AVERON'}</span>
            </Link>

            <nav
              className={
                'hidden items-center gap-1.5 overflow-hidden transition-all duration-300 ease-out lg:flex ' +
                (searchOpen ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-xl opacity-100')
              }
            >
              {configuredNavLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href.startsWith('http') ? href : to(href)}
                    className={
                      'whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors duration-250 ' +
                      (isActive(href)
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-white')
                    }
                  >
                    {label}
                  </Link>
                ))}
            </nav>
          </div>

          {/* Right Desktop items */}
          <div className="hidden items-center gap-2 lg:flex">
            <div className="relative flex items-center">
              {searchOpen ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); doSearch(query); }}
                  className="relative flex items-center animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-stone-400">
                    <Search size={16} />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="h-10 w-72 rounded-xl border border-stone-300 bg-stone-50 pl-10 pr-9 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder:text-stone-500"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setQuery(''); setSuggestions([]); }}
                    className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    <X size={14} />
                  </button>
                  {suggestions.length > 0 && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-850 dark:bg-stone-900">
                      {suggestions.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => navTo(item.href)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors"
                        >
                          <span className="text-sm">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-stone-900 dark:text-stone-100">{item.text}</p>
                            <p className="truncate text-[11px] text-stone-500">{item.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              ) : (
                <button type="button" onClick={() => setSearchOpen(true)} aria-label={t('search')} className={BTN_CLASS}>
                  <Search size={20} strokeWidth={2.2} />
                </button>
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

            <Link href={to('/compare')} aria-label={t('compare')} title={t('compare')} className={`${BTN_CLASS} relative`}>
              <Scale size={17} />
              {compareCount > 0 && (
                <motion.span
                  key={compareCount}
                  initial={{ scale: prefersReducedMotion ? 1 : 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white shadow"
                >
                  {compareCount}
                </motion.span>
              )}
            </Link>

            <LanguagePicker />
            <ThemeToggle />

            <div className="mx-1.5 h-6 w-px bg-stone-200 dark:bg-white/10" />

            <a
              href="https://t.me/averon_fashion_admin"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:brightness-110 xl:inline-flex"
            >
              {t('support')}
            </a>

            {isAuthenticated ? (
              <Link
                href={to('/profile')}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary-50 px-3.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-950/50 dark:text-primary-300 dark:hover:bg-primary-900/50"
              >
                <User size={16} />
                <span className="max-w-[120px] truncate">{user?.name || t('profile')}</span>
              </Link>
            ) : (
              <>
                <Link
                  href={to('/login')}
                  className="border border-stone-200 dark:border-white/10 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {t('login')}
                </Link>
                <Link
                  href={to('/register')}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {t('register')}
                </Link>
              </>
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
          <div id="mobile-header-search" className="absolute inset-x-4 top-full z-50 rounded-xl border border-stone-200 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-stone-900 lg:hidden">
            <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="relative flex items-center">
              <Search size={16} className="pointer-events-none absolute left-3 text-stone-400" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => handleQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('search')}
                className="h-11 w-full rounded-lg border border-stone-300 bg-stone-50 pl-10 pr-3 text-sm text-stone-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              />
            </form>
            {suggestions.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-stone-200 dark:border-white/10">
                {suggestions.map((item, i) => (
                  <button
                    key={`${item.href}-${i}`}
                    type="button"
                    onClick={() => navTo(item.href)}
                    className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm hover:bg-stone-50 dark:hover:bg-white/5"
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
          `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity ${prefersReducedMotion ? 'duration-0' : 'duration-300'} lg:hidden ` +
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
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={
          `fixed inset-y-0 left-0 z-50 flex h-dvh w-full max-w-none flex-col bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform ${prefersReducedMotion ? 'duration-0' : 'duration-300'} dark:bg-[#1A1A1A] lg:hidden ` +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-stone-200 px-5 dark:border-white/10">
          <Link href={to('/')} onClick={() => setMobileOpen(false)} className="flex items-center text-xl font-black text-stone-900 dark:text-white">
            <span className="max-w-52 truncate tracking-[0.2em]">{settings?.siteName || 'AVERON'}</span>
          </Link>
          <button ref={mobileCloseButtonRef} type="button" aria-label={t('close')} onClick={closeMobileMenu} className={BTN_CLASS}>
            <X size={18} />
          </button>
        </div>

        {/* Поиск внутри бургера ТОЛЬКО для мобильной версии (скрыт на планшетах через block sm:hidden) */}
        <div className="block sm:hidden border-b border-stone-200 p-4 dark:border-white/10">
          <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center pointer-events-none text-stone-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => handleMobileQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('search')}
              className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-8 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-primary-500 focus:bg-white dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder:text-stone-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setMobileSuggestions([]); }}
                className="absolute right-3 text-stone-400 hover:text-stone-600"
              >
                <X size={14} />
              </button>
            )}
          </form>
          {mobileSuggestions.length > 0 && (
            <div className="mt-1.5 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-md dark:border-stone-700 dark:bg-stone-800">
              {mobileSuggestions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navTo(item.href)}
                  className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-stone-50 dark:hover:bg-stone-750"
                >
                  <span>{item.icon}</span>
                  <span className="truncate text-stone-800 dark:text-stone-200">{item.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Навигационные ссылки */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {[...configuredNavLinks, ...[
            { href: '/favorites', label: t('favorites') },
            { href: '/compare', label: t('compare') },
            { href: '/cart', label: t('cart') },
            { href: '/support', label: t('support') },
          ].filter(({ href }) => !configuredNavLinks.some((item) => item.href === href))].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href.startsWith('http') ? href : to(href)}
                  onClick={closeMobileMenu}
                  className={
                    'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ' +
                    (isActive(href)
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 font-semibold'
                      : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5')
                  }
                >
                  <span>{label}</span>
                  <ChevronRight size={15} className="text-stone-400 opacity-50" />
                </Link>
              ))}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-stone-200 p-4 dark:border-white/10 bg-stone-50/60 dark:bg-[#1C1C1C]">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-stone-500">{t('langAndTheme')}</span>
            <div className="flex items-center gap-2">
              <LanguagePicker onSelect={closeMobileMenu} />
              <ThemeToggle />
            </div>
          </div>
          {isAuthenticated ? (
            <>
              <Link
                href={to('/profile')}
                onClick={closeMobileMenu}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 text-sm font-semibold text-white"
              >
                <User size={16} />
                <span>{user?.name || t('profile')}</span>
              </Link>
              <Link
                href={to('/orders')}
                onClick={closeMobileMenu}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                {t('orders')}
              </Link>
              <button
                type="button"
                onClick={() => { void handleLogout(); }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-300 text-sm font-semibold dark:border-stone-700"
              >
                <LogOut size={16} />
                {t('logout')}
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={to('/login')}
                onClick={() => setMobileOpen(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-750 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                <LogIn size={15} />
                {t('login')}
              </Link>
              <Link
                href={to('/register')}
                onClick={() => setMobileOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl bg-primary-600 text-sm font-semibold text-white"
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
