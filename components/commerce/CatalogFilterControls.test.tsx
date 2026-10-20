import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/ru.json';
import uzMessages from '@/messages/uz.json';
import enMessages from '@/messages/en.json';
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

function renderControls(
  locale = 'ru',
  localeMessages = messages,
  facets: { sizes: string[]; colors: string[] } = { sizes: [], colors: [] },
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={localeMessages}>
      <CatalogFilterControls
        locale={locale}
        categories={[]}
        categoriesError={false}
        facets={facets}
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

  it('keeps the user on the filter form and explains an invalid price range', () => {
    renderControls();
    fireEvent.change(screen.getByRole('textbox', { name: 'От' }), { target: { value: '200000' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'До' }), { target: { value: '100000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Показать товары' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Минимальная цена не может быть выше максимальной.');
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('enables reset for a sort-only selection and clears filter URL state', () => {
    navigation.search = 'sort=popular&page=3';
    renderControls();
    const reset = screen.getByRole('button', { name: 'Сбросить' });
    expect(reset).toBeEnabled();

    fireEvent.click(reset);
    expect(navigation.push).toHaveBeenCalledWith('/ru/catalog');
  });

  it('applies and clears the sale-only checkbox as a real URL filter', () => {
    navigation.search = 'saleOnly=true&page=3';
    renderControls();
    const checkbox = screen.getByRole('checkbox', { name: 'Только со скидкой' });
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Показать товары' }));
    expect(navigation.push).toHaveBeenCalledWith('/ru/catalog?saleOnly=true&sort=newest');

    navigation.push.mockReset();
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
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

  it('stacks narrow size and color controls, then uses columns when their container is wide enough', () => {
    const { container } = renderControls();
    const responsiveGroup = container.querySelector('[class*="@container"]');

    expect(responsiveGroup).toHaveClass('mt-5');
    expect(responsiveGroup?.firstElementChild).toHaveClass('grid-cols-1', '@[336px]:grid-cols-2');
  });

  it.each([
    ['ru', messages, 'Очень длинное название размера для теста переполнения', 'Сложный локализованный цвет для проверки полной подписи'],
    ['uz', uzMessages, 'Kiyim o‘lchamining juda uzun sinov nomi', 'Rangning to‘liq ko‘rinishini tekshiruvchi uzun nom'],
    ['en', enMessages, 'A deliberately long clothing size label for wrapping', 'A deliberately long color label for wrapping'],
  ])('keeps localized size/color placeholder and selected values available (%s)', (locale, localeMessages, longSize, longColor) => {
    renderControls(locale, localeMessages, { sizes: [longSize], colors: [longColor] });
    const size = screen.getByRole('combobox', { name: localeMessages.catalog.size });
    const color = screen.getByRole('combobox', { name: localeMessages.catalog.color });

    expect(size).toHaveDisplayValue(localeMessages.catalog.anySize);
    expect(color).toHaveDisplayValue(localeMessages.catalog.anyColor);
    fireEvent.change(size, { target: { value: longSize } });
    fireEvent.change(color, { target: { value: longColor } });
    expect(size).toHaveDisplayValue(longSize);
    expect(color).toHaveDisplayValue(longColor);
  });
});
