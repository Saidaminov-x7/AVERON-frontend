import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { isProductNew, ProductCard, type StoreProduct } from './ProductCard';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCompareStore } from '@/store/useCompareStore';

const product: StoreProduct = {
  id: 'product-1', slug: 'red-dress', translations: { ru: { title: 'Красное платье' } },
  salePriceUzs: 250000, images: [], variants: [],
};

describe('ProductCard', () => {
  beforeEach(() => {
    useFavoritesStore.setState({ ids: [] });
    useCompareStore.setState({ ids: [] });
  });

  it('shows only the second image on hover without zooming the card or image', () => {
    render(
      <ProductCard
        product={{ ...product, images: [{ url: '/first.jpg' }, { url: '/second.jpg' }, { url: '/third.jpg' }] }}
        locale="ru"
      />,
    );
    const card = screen.getByRole('article');
    const image = screen.getByRole('img', { name: 'Красное платье' });

    expect(image).toHaveAttribute('src', '/first.jpg');
    fireEvent.mouseEnter(card);
    expect(image).toHaveAttribute('src', '/second.jpg');
    expect(image).not.toHaveClass('group-hover:scale-[1.03]');
    expect(card.className).not.toContain('hover:-translate');

    fireEvent.mouseLeave(card);
    expect(image).toHaveAttribute('src', '/first.jpg');
  });

  it('expires the new label after two weeks and ignores future dates', () => {
    const now = Date.UTC(2026, 0, 15);
    expect(isProductNew(new Date(now - 13 * 24 * 60 * 60 * 1000).toISOString(), now)).toBe(true);
    expect(isProductNew(new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(), now)).toBe(false);
    expect(isProductNew(new Date(now + 60_000).toISOString(), now)).toBe(false);
    expect(isProductNew('not-a-date', now)).toBe(false);
  });

  it('renders a localized product and toggles favorites', () => {
    render(<ProductCard product={product} locale="ru" />);
    expect(screen.getByText('Красное платье')).toBeInTheDocument();
    expect(screen.getByText(/250.*000 сум/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить в избранное' }));
    expect(useFavoritesStore.getState().ids).toEqual(['product-1']);
    expect(screen.getByRole('button', { name: 'Убрать из избранного' })).toBeInTheDocument();
  });

  it('preserves catalog filters when linking to a product', () => {
    render(
      <ProductCard
        product={product}
        locale="ru"
        catalogQuery={'q=coat&country=CN&category=outerwear&page=2'}
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/ru/catalog/red-dress?q=coat&country=CN&category=outerwear&page=2',
    );
  });

  it('toggles product comparison', () => {
    render(<ProductCard product={product} locale="ru" />);
    const addButton = screen.getByRole('button', { name: 'Добавить к сравнению' });
    expect(addButton).toHaveClass('ring-1', 'ring-[var(--color-border)]');
    fireEvent.click(addButton);
    expect(useCompareStore.getState().ids).toEqual(['product-1']);
    const removeButton = screen.getByRole('button', { name: 'Убрать из сравнения' });
    expect(removeButton).toHaveAttribute('aria-pressed', 'true');
    expect(removeButton).toHaveClass('ring-[var(--color-text)]');
    fireEvent.click(screen.getByRole('button', { name: 'Убрать из сравнения' }));
    expect(useCompareStore.getState().ids).toEqual([]);
  });

  it('keeps the favorite action the same size on hover as comparison', () => {
    render(<ProductCard product={product} locale="ru" />);

    const favoriteButton = screen.getByRole('button', { name: 'Добавить в избранное' });
    expect(favoriteButton).toHaveClass('size-9', 'transition-colors');
    expect(favoriteButton.className).not.toContain('hover:scale');
  });

  it('shows localized feedback when the comparison limit is reached', () => {
    useCompareStore.setState({ ids: ['one', 'two', 'three', 'four'] });
    render(<ProductCard product={product} locale="en" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add to comparison' }));
    expect(screen.getByRole('status')).toHaveTextContent('You can compare up to 4 products.');
    expect(useCompareStore.getState().ids).toEqual(['one', 'two', 'three', 'four']);
  });

  it('labels preorder and unavailable products from backend availability only', () => {
    const { rerender } = render(
      <ProductCard
        product={{
          ...product,
          availability: { inStock: false, preorderEligible: true, preorderAvailable: 2, estimatedAvailableAt: null },
          recommendationAvailability: { available: true, preorder: true },
        }}
        locale="ru"
      />,
    );
    expect(screen.getByText('Предзаказ')).toBeInTheDocument();

    rerender(
      <ProductCard
        product={{
          ...product,
          availability: { inStock: false, preorderEligible: false, preorderAvailable: 0, estimatedAvailableAt: null },
          recommendationAvailability: { available: false, preorder: false },
        }}
        locale="ru"
      />,
    );
    expect(screen.getByText('Нет в наличии')).toBeInTheDocument();
  });

  it('shows a discount badge and struck-through price only for a real discount', () => {
    render(<ProductCard product={{ ...product, compareAtPriceUzs: 300000 }} locale="ru" />);

    expect(screen.getByLabelText('Скидка 17%')).toHaveTextContent('−17%');
    expect(screen.getByText(/300.*000 сум/)).toHaveClass('line-through');
  });
});
