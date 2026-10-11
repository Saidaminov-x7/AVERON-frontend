import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { colorSwatchLabel, isProductNew, ProductCard, type StoreProduct } from './ProductCard';
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

  it('replaces generic color indexes with accessible color values and preserves real color names', () => {
    expect(colorSwatchLabel('Цвет 1', '#000000', 'ru')).toBe('Цвет #000000');
    expect(colorSwatchLabel('Color 2', '#ffffff', 'en')).toBe('Color #ffffff');
    expect(colorSwatchLabel('Rang 3', '#ff0000', 'uz')).toBe('Rang #ff0000');
    expect(colorSwatchLabel('Navy', '#000080', 'en')).toBe('Navy');
  });

  it('renders color swatches with useful accessible names and theme-neutral borders', () => {
    render(<ProductCard product={{
      ...product,
      variants: [
        { id: 'black-m', color: 'Цвет 1::#000000', size: 'M', stock: 2 },
        { id: 'navy-l', color: 'Navy::#000080', size: 'L', stock: 1 },
      ],
    }} locale="ru" />);

    expect(screen.getByRole('img', { name: 'Цвет #000000' })).toHaveAttribute('title', 'Цвет #000000');
    expect(screen.getByRole('img', { name: 'Navy' })).toHaveAttribute('title', 'Navy');
    expect(screen.getByRole('img', { name: 'Цвет #000000' }).className).not.toContain('ring-white');
    expect(screen.queryByTitle('Цвет 1')).not.toBeInTheDocument();
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

  it('applies persisted cover crop metadata to catalog cards while using the original image URL', () => {
    render(<ProductCard product={{ ...product, images: [{ url: '/original.jpg', coverCrop: { x: 22, y: 76, zoom: 1.8 } }] }} locale="ru" />);
    const image = screen.getByRole('img', { name: 'Красное платье' });
    expect(image).toHaveAttribute('src', '/original.jpg');
    expect(image).toHaveStyle({ objectPosition: '22% 76%', transform: 'scale(1.8)', transformOrigin: '22% 76%' });
    expect(image).toHaveClass('object-cover');
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

  it('does not display a full 100% discount for a positive sale price', () => {
    render(<ProductCard product={{
      ...product,
      salePriceUzs: 99_999,
      compareAtPriceUzs: 99_999_999,
    }} locale="ru" />);

    expect(screen.getByText('−99%')).toBeInTheDocument();
    expect(screen.queryByText('−100%')).not.toBeInTheDocument();
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
