import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductSizeChart } from './ProductSizeChart';

describe('ProductSizeChart', () => {
  it('does not render when the product has no configured chart', () => {
    const { container } = render(<ProductSizeChart locale="ru" title="Size guide" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only the measurements saved for the selected product', () => {
    render(<ProductSizeChart locale="ru" sizeChartType="SHOES" sizeChart={[{ size: '36', chestCm: 90 }]} title="Size guide" />);
    expect(screen.getByRole('heading', { name: 'Size guide' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Размер')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.queryByText('22.5 cm')).not.toBeInTheDocument();
  });

  it('does not fabricate a global chart from the legacy chart type', () => {
    const { container } = render(<ProductSizeChart locale="ru" sizeChartType="CLOTHING" title="Size guide" />);
    expect(container.querySelector('table')).toBeNull();
  });
});
