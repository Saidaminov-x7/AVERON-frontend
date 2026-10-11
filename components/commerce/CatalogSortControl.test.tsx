import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/ru.json';
import { CatalogSortControl } from './CatalogSortControl';

const navigation = vi.hoisted(() => ({ search: '', push: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/ru/catalog',
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock('./CatalogSelect', () => ({
  CatalogSelect: ({ label, value, options, onValueChange }: {
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

describe('CatalogSortControl', () => {
  beforeEach(() => {
    navigation.search = '';
    navigation.push.mockReset();
  });

  it('changes sort while keeping filters and returning to the first page', () => {
    navigation.search = 'category=dresses&country=CN&page=4';
    render(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <CatalogSortControl />
      </NextIntlClientProvider>,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price_asc' } });
    expect(navigation.push).toHaveBeenCalledWith('/ru/catalog?category=dresses&country=CN&sort=price_asc');
  });
});
