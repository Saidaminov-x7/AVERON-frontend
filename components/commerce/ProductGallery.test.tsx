import { fireEvent, render, screen, within } from '@testing-library/react';
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
        previousLabel="Previous image"
        nextLabel="Next image"
        openImageLabel="Open image full screen"
        closeViewerLabel="Close image viewer"
        zoomInLabel="Zoom in"
        zoomOutLabel="Zoom out"
      />,
    );

    expect(screen.getByRole('img', { name: 'Front view' })).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Front view' })).toHaveClass('object-contain');
    expect(screen.getByRole('img', { name: 'Front view' })).not.toHaveClass('group-hover:scale-[1.03]');
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByRole('img', { name: 'Back view' })).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByRole('img', { name: 'Front view' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show image 2' }));
    expect(screen.getByRole('button', { name: 'Show image 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'Back view' })).toBeInTheDocument();
  });

  it('supports touch swiping and keeps the image counter visible', () => {
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
        previousLabel="Previous image"
        nextLabel="Next image"
        openImageLabel="Open image full screen"
        closeViewerLabel="Close image viewer"
        zoomInLabel="Zoom in"
        zoomOutLabel="Zoom out"
      />,
    );

    const image = screen.getByRole('img', { name: 'Front view' });
    fireEvent.touchStart(image, { touches: [{ clientX: 180 }] });
    fireEvent.touchEnd(image, { changedTouches: [{ clientX: 100 }] });

    expect(screen.getByRole('img', { name: 'Back view' })).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('uses clean frames for portrait, landscape, and square photos without blur', () => {
    render(
      <ProductGallery
        images={[
          { id: 'landscape', url: '/landscape.jpg', alt: { en: 'Landscape product' } },
          { id: 'portrait', url: '/portrait.jpg', alt: { en: 'Portrait product' } },
          { id: 'square', url: '/square.jpg', alt: { en: 'Square product' } },
        ]}
        productTitle="Wide product"
        locale="en"
        label="Product images"
        imageLabels={['Show image 1', 'Show image 2', 'Show image 3']}
        previousLabel="Previous image"
        nextLabel="Next image"
        openImageLabel="Open image full screen"
        closeViewerLabel="Close image viewer"
        zoomInLabel="Zoom in"
        zoomOutLabel="Zoom out"
      />,
    );

    const frame = screen.getByRole('group', { name: 'Product images' });
    const orientations = [
      { label: 'Landscape product', width: 1800, height: 1200, ratio: '4 / 3' },
      { label: 'Portrait product', width: 1200, height: 1500, ratio: '4 / 5' },
      { label: 'Square product', width: 1200, height: 1200, ratio: '1 / 1' },
    ];

    orientations.forEach(({ label, width, height, ratio }, index) => {
      const image = screen.getByRole('img', { name: label });
      Object.defineProperty(image, 'naturalWidth', { configurable: true, value: width });
      Object.defineProperty(image, 'naturalHeight', { configurable: true, value: height });
      fireEvent.load(image);

      expect(frame).toHaveStyle({ aspectRatio: ratio });
      expect(image).toHaveClass('object-contain');
      if (index < orientations.length - 1) {
        fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
      }
    });

    expect(frame.querySelectorAll('img')).toHaveLength(1);
    expect(frame.querySelector('[class*="backdrop-blur"]')).toBeNull();
  });

  it('opens a full-screen viewer with zoom controls and closes it with Escape', () => {
    render(
      <ProductGallery
        images={[{ id: 'front', url: '/front.jpg', alt: { en: 'Front view' } }]}
        productTitle="Coat"
        locale="en"
        label="Product images"
        imageLabels={['Show image 1']}
        previousLabel="Previous image"
        nextLabel="Next image"
        openImageLabel="Open image full screen"
        closeViewerLabel="Close image viewer"
        zoomInLabel="Zoom in"
        zoomOutLabel="Zoom out"
      />,
    );

    const opener = screen.getByRole('button', { name: 'Open image full screen' });
    const previousOverflow = document.body.style.overflow;
    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Product images' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Close image viewer' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('150%')).toBeInTheDocument();

    fireEvent.wheel(screen.getByRole('dialog', { name: 'Product images' }).querySelector('.touch-none')!, {
      deltaY: -100,
    });
    expect(screen.getByText('175%')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Product images' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe(previousOverflow);
    expect(opener).toHaveFocus();
  });

  it('keeps keyboard focus inside the full-screen viewer', () => {
    render(
      <ProductGallery
        images={[{ id: 'front', url: '/front.jpg' }, { id: 'back', url: '/back.jpg' }]}
        productTitle="Coat"
        locale="en"
        label="Product images"
        imageLabels={['Show image 1', 'Show image 2']}
        previousLabel="Previous image"
        nextLabel="Next image"
        openImageLabel="Open image full screen"
        closeViewerLabel="Close image viewer"
        zoomInLabel="Zoom in"
        zoomOutLabel="Zoom out"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open image full screen' }));
    const dialog = screen.getByRole('dialog', { name: 'Product images' });
    const first = within(dialog).getByRole('button', { name: 'Zoom in' });
    const last = within(dialog).getByRole('button', { name: 'Next image' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('supports pinch-to-zoom on touch screens', () => {
    render(
      <ProductGallery
        images={[{ id: 'front', url: '/front.jpg', alt: { en: 'Front view' } }]}
        productTitle="Coat"
        locale="en"
        label="Product images"
        imageLabels={['Show image 1']}
        previousLabel="Previous image"
        nextLabel="Next image"
        openImageLabel="Open image full screen"
        closeViewerLabel="Close image viewer"
        zoomInLabel="Zoom in"
        zoomOutLabel="Zoom out"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open image full screen' }));
    const viewport = screen.getByRole('dialog', { name: 'Product images' }).querySelector('.touch-none');
    expect(viewport).not.toBeNull();
    Object.defineProperty(viewport, 'setPointerCapture', { value: () => undefined });
    const dispatchPointer = (type: string, pointerId: number, clientX: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperties(event, {
        pointerId: { value: pointerId },
        clientX: { value: clientX },
        clientY: { value: 100 },
      });
      fireEvent(viewport!, event);
    };
    dispatchPointer('pointerdown', 1, 100);
    dispatchPointer('pointerdown', 2, 200);
    dispatchPointer('pointermove', 2, 300);

    expect(screen.getByText('200%')).toBeInTheDocument();
  });
});
