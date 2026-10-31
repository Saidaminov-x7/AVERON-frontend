import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enMessages from '@/messages/en.json';
import { Header } from './Header';

const mocks = vi.hoisted(() => ({ push: vi.fn(), get: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('@/lib/axios', () => ({ default: { get: mocks.get } }));
vi.mock('@/hooks/useSiteSettings', () => ({ useSiteSettings: () => ({ data: null }) }));
vi.mock('@/hooks/useCommerceCart', () => ({ useCommerceCart: () => ({ data: { items: [] } }) }));
vi.mock('@/store/useFavoritesStore', () => ({ useFavoritesStore: (select: (state: { ids: string[] }) => unknown) => select({ ids: [] }) }));
vi.mock('@/store/useCompareStore', () => ({ useCompareStore: (select: (state: { ids: string[] }) => unknown) => select({ ids: [] }) }));
vi.mock('@/store/useAuthStore', () => ({ useAuthStore: (select?: (state: Record<string, unknown>) => unknown) => {
  const state = { user: null, isAuthenticated: false, logout: vi.fn() };
  return select ? select(state) : state;
} }));
vi.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => <button type="button" aria-label="Theme" /> }));
vi.mock('@/components/privacy/CookieSettingsLink', () => ({ CookieSettingsLink: () => null }));
vi.mock('framer-motion', () => ({ motion: { span: 'span' }, useReducedMotion: () => false }));

function renderHeader() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <QueryClientProvider client={client}>
        <Header locale="en" />
        <button type="button" data-testid="outside">Outside</button>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

function productList(items: unknown[]) {
  return { items, pagination: { page: 1, limit: 5, total: items.length, pages: items.length ? 1 : 0 } };
}

describe('Header catalog search', () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.get.mockReset();
    mocks.get.mockImplementation(async (url: string, config?: { params?: { q?: string } }) => {
      if (url.endsWith('/categories')) return { data: [] };
      if (config?.params?.q) return { data: productList([{ id: 'product-1', slug: 'winter-coat', translations: { en: { title: 'Winter coat' } } }]) };
      return { data: productList([]) };
    });
  });

  it('fetches real product suggestions with the supported catalog q parameter and opens the product', async () => {
    const user = userEvent.setup();
    renderHeader();
    const input = screen.getByRole('combobox', { name: 'Search' });
    await user.type(input, 'winter');

    const suggestion = await screen.findByRole('option', { name: /Winter coat/ });
    expect(mocks.get).toHaveBeenCalledWith('/api/v1/products', expect.objectContaining({ params: { q: 'winter', page: 1, limit: 5 }, signal: expect.any(AbortSignal) }));
    await user.click(suggestion);
    expect(mocks.push).toHaveBeenCalledWith('/en/catalog/winter-coat');
  });

  it('keeps an exact-query catalog action when the product request has no matches', async () => {
    const user = userEvent.setup();
    mocks.get.mockImplementation(async (url: string, config?: { params?: { q?: string } }) => ({
      data: url.endsWith('/categories') ? [] : productList(config?.params?.q ? [] : []),
    }));
    renderHeader();
    const input = screen.getByRole('combobox', { name: 'Search' });
    await user.type(input, 'unknown');

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No matching products found'));
    expect(screen.getByRole('option', { name: /Search “unknown”/ })).toBeInTheDocument();
  });

  it('clears the query with the custom control, restores focus and does not fetch one-character input', async () => {
    const user = userEvent.setup();
    renderHeader();
    const input = screen.getByRole('combobox', { name: 'Search' });
    await user.type(input, 'w');
    expect(mocks.get).not.toHaveBeenCalledWith('/api/v1/products', expect.anything());
    await user.type(input, 'i');
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/api/v1/products', expect.objectContaining({ params: { q: 'wi', page: 1, limit: 5 }, signal: expect.any(AbortSignal) })));

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes suggestions on Escape while preserving the query and reopens them on focus', async () => {
    const user = userEvent.setup();
    renderHeader();
    const input = screen.getByRole('combobox', { name: 'Search' });
    await user.type(input, 'winter');
    await screen.findByRole('option', { name: /Winter coat/ });

    await user.keyboard('{Escape}');
    expect(input).toHaveValue('winter');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.blur(input);
    fireEvent.focus(input);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('closes on outside pointer without discarding the typed query', async () => {
    const user = userEvent.setup();
    renderHeader();
    const input = screen.getByRole('combobox', { name: 'Search' });
    await user.type(input, 'winter');
    await screen.findByRole('listbox');

    fireEvent.pointerDown(screen.getByTestId('outside'));
    expect(input).toHaveValue('winter');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(input);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('submits the query with Enter and updates mobile search suggestions too', async () => {
    const user = userEvent.setup();
    renderHeader();
    const searchToggle = screen.getByRole('button', { name: 'Search' });
    await user.click(searchToggle);
    const input = screen.getAllByRole('combobox', { name: 'Search' }).find((element) => element.closest('#mobile-header-search'))!;
    await user.type(input, 'boots{Enter}');
    expect(mocks.push).toHaveBeenCalledWith('/en/catalog?q=boots');
  });

  it('clears mobile search and opens a real product suggestion from the mobile list', async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    const input = screen.getAllByRole('combobox', { name: 'Search' }).find((element) => element.closest('#mobile-header-search'))!;
    await user.type(input, 'winter');
    await waitFor(() => expect(document.getElementById('mobile-header-search-suggestions')?.textContent).toContain('Winter coat'));

    const clear = input.closest('form')?.querySelector<HTMLButtonElement>('button[aria-label="Clear search"]');
    await user.click(clear!);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();

    await user.type(input, 'winter');
    const option = await waitFor(() => {
      const result = document.getElementById('mobile-header-search-suggestions')?.querySelector<HTMLButtonElement>('[role="option"]');
      if (!result?.textContent?.includes('Winter coat')) throw new Error('Mobile product result not ready');
      return result;
    });
    await user.click(option);
    expect(mocks.push).toHaveBeenLastCalledWith('/en/catalog/winter-coat');
  });

  it('selects the first desktop suggestion with ArrowDown and Enter', async () => {
    const user = userEvent.setup();
    renderHeader();
    const input = screen.getByRole('combobox', { name: 'Search' });
    await user.type(input, 'winter');
    await screen.findByRole('option', { name: /Winter coat/ });
    await user.keyboard('{ArrowDown}{Enter}');

    expect(mocks.push).toHaveBeenCalledWith('/en/catalog/winter-coat');
  });

  it('shows a localized non-sensitive fallback when the suggestions request fails', async () => {
    const user = userEvent.setup();
    mocks.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/categories')) return { data: [] };
      throw new Error('network unavailable');
    });
    renderHeader();
    const input = screen.getByRole('combobox', { name: 'Search' });
    await user.type(input, 'winter');

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Suggestions are unavailable right now'), { timeout: 6000 });
    expect(screen.getByRole('option', { name: /Search “winter”/ })).toBeInTheDocument();
    expect(screen.queryByText('network unavailable')).not.toBeInTheDocument();
  });

  it('keeps locale and theme controls in the mobile drawer footer and uses local flags', async () => {
    const user = userEvent.setup();
    renderHeader();
    const menuTrigger = screen.getByRole('button', { name: 'Menu' });
    await user.click(menuTrigger);

    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    const languageButton = within(drawer).getByRole('button', { name: 'Language' });
    const drawerFooter = drawer.querySelector('div.shrink-0.border-t');
    expect(drawerFooter).toContainElement(languageButton);
    expect(within(drawer).getByRole('button', { name: 'Theme' })).toBeInTheDocument();

    await user.click(languageButton);
    const menu = within(drawer).getByRole('menu');
    expect(within(menu).getByRole('menuitemradio', { name: /Русский/ })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitemradio', { name: /O'zbekcha/ })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitemradio', { name: /English/ })).toBeInTheDocument();
    expect(Array.from(menu.querySelectorAll('img')).map((image) => image.getAttribute('src')))
      .toEqual(['/flags/ru.svg', '/flags/uz.svg', '/flags/us.svg']);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument());
    expect(menuTrigger).toHaveFocus();
  });
});
