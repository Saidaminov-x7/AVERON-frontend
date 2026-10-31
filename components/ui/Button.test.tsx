import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

afterEach(() => vi.restoreAllMocks());

describe('Button loading state', () => {
  it('shows localized progress text, a spinner, and disables interaction', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 240 } as DOMRect);
    const { rerender } = render(<Button>Save</Button>);
    rerender(
      <Button loading loadingLabel="Saving…">
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toHaveClass('animate-spin');
    expect(button).toHaveStyle({ minWidth: 'min(240px, 100%)' });
  });
});
