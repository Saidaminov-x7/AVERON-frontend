import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import enMessages from '@/messages/en.json';
import { ProductVariantSelector } from './ProductVariantSelector';

describe('ProductVariantSelector', () => {
  it('starts with no option selected and applies only an explicitly selected variant', () => {
    const onChange = vi.fn();
    const variants = [
      { id: 'blue-m', size: 'M', color: 'Blue', stock: 3, available: true },
      { id: 'navy-m', size: 'M', color: 'dark blue', stock: 2, available: true },
    ];
    const Harness = () => {
      const [selection, setSelection] = useState({ id: '', size: '', color: '' });
      return (
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <ProductVariantSelector
          variants={variants}
          sizeValue={selection.size}
          colorValue={selection.color}
          label="Choose variant"
          sizeLabel="Size"
          colorLabel="Color"
          availabilityLabel={(available) => available ? 'Available to order' : 'Unavailable'}
          onChange={(id, size, color) => { onChange(id, size, color); setSelection({ id, size, color }); }}
          />
        </NextIntlClientProvider>
      );
    };

    render(<Harness />);
    expect(screen.getByRole('group', { name: 'Size' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Color' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Choose variant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'M, Available to order' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Color: blue/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Color: dark blue/ })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: /Color: dark blue/ }));
    expect(onChange).toHaveBeenLastCalledWith('', '', 'dark blue');
    expect(screen.getByRole('button', { name: /Color: dark blue/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'M, Available to order' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'M, Available to order' }));
    expect(onChange).toHaveBeenLastCalledWith('navy-m', 'M', 'dark blue');
    expect(screen.getByRole('group', { name: /Size\s*:\s*M/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Color\s*:\s*dark blue/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Color: dark blue/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Color: blue/ })).toHaveAttribute('aria-pressed', 'false');
  });
});
