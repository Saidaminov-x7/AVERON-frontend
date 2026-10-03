import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/ru.json';
import { CatalogFilterControls } from './CatalogFilterControls';

const navigation = vi.hoisted(() => ({
  search: '',
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/ru/catalog',
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock('./CatalogSelect', () => ({
  CatalogSelect: ({
    label,
    value,
    options,
    onValueChange,
  }: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onValueChange: (value: string) => void;
  }) => (
    <label>
      {label}
      <select aria-label={label} value={value} onChange={(event) => onValueChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  ),
}));

function renderControls() {
  return render(
    <NextIntlClientProvider locale="ru" messages={messages}>
      <CatalogFilterControls
        locale="ru"
        categories={[]}
        categoriesError={false}
        facets={{ sizes: [], colors: [] }}
        facetsError={false}
      />
    </NextIntlClientProvider>,
  );
}

describe('CatalogFilterControls', () => {
  beforeEach(() => {
    navigation.search = '';
    navigation.push.mockReset();
  });

  it('updates audience selection immediately and applies URL filters without pagination', () => {
    navigation.search = 'audience=women&page=4&sort=popular&q=coat';
    renderControls();

    fireEvent.click(screen.getByRole('button', { name: 'Мужское' }));
    expect(screen.getByRole('button', { name: 'Мужское' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Показать товары' }));
    expect(navigation.push).toHaveBeenCalledWith('/ru/catalog?q=coat&audience=men&sort=popular');
  });

  it('does not convert an empty minimum price into zero', () => {
    renderControls();
    fireEvent.change(screen.getByRole('textbox', { name: 'От' }), { target: { value: '' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'До' }), { target: { value: '120000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Показать товары' }));

    expect(navigation.push).toHaveBeenCalledWith('/ru/catalog?maxPrice=120000&sort=newest');
  });

  it('enables reset for a sort-only selection and clears filter URL state', () => {
    navigation.search = 'sort=popular&page=3';
    renderControls();
    const reset = screen.getByRole('button', { name: 'Сбросить' });
    expect(reset).toBeEnabled();

    fireEvent.click(reset);
    expect(navigation.push).toHaveBeenCalledWith('/ru/catalog');
  });

  it('resynchronizes the draft when the URL changes externally', () => {
    const view = renderControls();
    expect(screen.getByRole('button', { name: 'Мужское' })).toHaveAttribute('aria-pressed', 'false');

    navigation.search = 'audience=men';
    view.rerender(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <CatalogFilterControls
          locale="ru"
          categories={[]}
          categoriesError={false}
          facets={{ sizes: [], colors: [] }}
          facetsError={false}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('button', { name: 'Мужское' })).toHaveAttribute('aria-pressed', 'true');
  });
});
