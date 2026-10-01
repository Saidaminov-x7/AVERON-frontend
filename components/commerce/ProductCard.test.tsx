import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProductCard, type StoreProduct } from './ProductCard';
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
        catalogQuery="q=coat&country=CN&category=outerwear&page=2"
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/ru/catalog/red-dress?q=coat&country=CN&category=outerwear&page=2',
    );
  });

  it('toggles product comparison', () => {
    render(<ProductCard product={product} locale="ru" />);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить к сравнению' }));
    expect(useCompareStore.getState().ids).toEqual(['product-1']);
  });
});
