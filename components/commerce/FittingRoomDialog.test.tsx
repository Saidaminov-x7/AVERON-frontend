import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FittingRoomDialog } from './FittingRoomDialog';

vi.mock('next/dynamic', () => ({
  default: () => function FittingViewerStub() {
    return <div data-testid="fitting-viewer-stub" />;
  },
}));

vi.mock('@/lib/fitting-room', () => ({
  getFittingProduct: vi.fn().mockRejectedValue(new Error('fixture has no model')),
  getFittingProducts: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/hooks/useCommerceCart', () => ({
  useCommerceCart: () => ({ mutation: { mutateAsync: vi.fn() } }),
}));

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({ isAuthenticated: false }),
}));

afterEach(() => vi.clearAllMocks());

describe('FittingRoomDialog modal behavior', () => {
  const renderDialog = () => {
    const onClose = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return open ? <FittingRoomDialog productId="coat-1" locale="en" onClose={() => { onClose(); setOpen(false); }} /> : null;
    }
    render(<Harness />);
    return onClose;
  };

  it('closes with Escape and keeps keyboard focus within the panel', async () => {
    const onClose = renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Virtual fitting room' });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href]:not([tabindex="-1"]), button:not(:disabled):not([tabindex="-1"]), input:not(:disabled):not([tabindex="-1"]), select:not(:disabled):not([tabindex="-1"]), textarea:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
    ));
    const first = focusable[0];
    const last = focusable.at(-1)!;

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Virtual fitting room' })).toBeNull();
  });

  it('closes when the desktop backdrop is clicked', () => {
    const onClose = renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Virtual fitting room' });
    const backdrop = dialog.parentElement?.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Virtual fitting room' })).toBeNull();
  });
});
