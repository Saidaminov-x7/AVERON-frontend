import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CatalogLoading from './loading';

describe('catalog loading state', () => {
  it('announces loading while the catalog skeleton is displayed', () => {
    const { container } = render(<CatalogLoading />);

    expect(container.querySelector('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка каталога');
  });

  it('reserves the same mobile and desktop grid and image ratio as product cards', () => {
    const { container } = render(<CatalogLoading />);
    const grid = container.querySelector('.grid');
    const hasProductImageRatio = Array.from(container.querySelectorAll('[class]'))
      .some((element) => element.className.toString().includes('aspect-[3/4]'));

    expect(grid).toHaveClass('grid-cols-2', 'lg:grid-cols-3', 'min-[1400px]:grid-cols-4');
    expect(hasProductImageRatio).toBe(true);
  });
});
