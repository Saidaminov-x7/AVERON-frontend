import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductGallery } from './ProductGallery';

describe('ProductGallery', () => {
  it('lets shoppers select an image using labeled, keyboard-focusable controls', () => {
    render(
      <ProductGallery
        images={[
          { id: 'front', url: '/front.jpg', alt: { en: 'Front view' } },
          { id: 'back', url: '/back.jpg', alt: { en: 'Back view' } },
        ]}
        productTitle="Coat"
        locale="en"
        label="Product images"
        imageLabels={['Show image 1', 'Show image 2']}
      />,
    );

    expect(screen.getByRole('img', { name: 'Front view' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show image 2' }));
    expect(screen.getByRole('button', { name: 'Show image 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'Back view' })).toBeInTheDocument();
  });
});
