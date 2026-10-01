import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CatalogLoading from './loading';

describe('catalog loading state', () => {
  it('announces loading while the catalog skeleton is displayed', () => {
    const { container } = render(<CatalogLoading />);

    expect(container.querySelector('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка каталога');
  });
});
