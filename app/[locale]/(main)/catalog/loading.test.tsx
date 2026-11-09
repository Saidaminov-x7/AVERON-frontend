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

    expect(grid).toHaveClass('grid-cols-2', 'lg:grid-cols-3', '2xl:grid-cols-4');
    expect(hasProductImageRatio).toBe(true);
  });

  it('reserves the live card metadata, two-line title, and price geometry', () => {
    const { container } = render(<CatalogLoading />);
    const cards = Array.from(container.querySelectorAll('.grid > div'));

    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      const skeletonClasses = Array.from(card.querySelectorAll('[class]'))
        .map((element) => element.className.toString().replace(/\s+/g, ' '));
      expect(skeletonClasses.some((classes) => classes.includes('mb-1 h-4 w-1/2'))).toBe(true);
      expect(skeletonClasses.some((classes) => classes.includes('h-[17.55px] w-full sm:h-[20.25px]'))).toBe(true);
      expect(skeletonClasses.some((classes) => classes.includes('h-[17.55px] w-3/4 sm:h-[20.25px]'))).toBe(true);
      expect(skeletonClasses.some((classes) => classes.includes('mt-1 h-5 w-1/2'))).toBe(true);
    }
  });
});
