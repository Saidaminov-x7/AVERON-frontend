import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Gallery } from './Gallery';

vi.mock('embla-carousel-react', () => ({
  default: () => [() => null, null],
}));

describe('Gallery fullscreen modal', () => {
  const renderGallery = () => render(<Gallery images={['/front.jpg', '/back.jpg']} alt="Coat" />);

  it('closes from the overlay and restores focus to the opener', () => {
    renderGallery();
    const opener = screen.getByRole('button', { name: 'Открыть во весь экран' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Coat' });
    const overlay = dialog.parentElement?.querySelector('[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);

    expect(screen.queryByRole('dialog', { name: 'Coat' })).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the fullscreen viewer', () => {
    renderGallery();
    fireEvent.click(screen.getByRole('button', { name: 'Открыть во весь экран' }));
    const dialog = screen.getByRole('dialog', { name: 'Coat' });
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const first = buttons[0];
    const last = buttons.at(-1)!;

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });
});
