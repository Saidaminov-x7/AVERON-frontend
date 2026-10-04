import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductSizeChart } from './ProductSizeChart';

describe('ProductSizeChart', () => {
  it('does not render when the product has no configured chart', () => {
    const { container } = render(<ProductSizeChart locale="ru" title="Таблица размеров" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a localized footwear guide with foot measurements', () => {
    render(<ProductSizeChart locale="ru" sizeChartType="SHOES" title="Таблица размеров" />);
    expect(screen.getByRole('heading', { name: 'Таблица размеров' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Стопа')).toBeInTheDocument();
    expect(screen.getByText('22.5 см')).toBeInTheDocument();
  });
});
