import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import GlobalError from './global-error';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('GlobalError theme and recovery UI', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
    vi.unstubAllGlobals();
  });

  it('honors dark theme preference and keeps error text bound to theme contrast tokens', async () => {
    localStorage.setItem('ijara_theme_preference', 'dark');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));

    render(<GlobalError error={new Error('fixture server failure')} reset={vi.fn()} />);

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(screen.getByText('500')).toHaveClass('text-7xl');
    expect(screen.getByRole('heading', { name: 'Что-то пошло не так' })).toHaveClass('text-[var(--color-text)]');
    expect(screen.getByText('Произошла непредвиденная ошибка. Попробуйте повторить действие или вернитесь на главную.'))
      .toHaveClass('text-[var(--color-text-secondary)]');
    expect(screen.getByRole('button', { name: 'Попробовать снова' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/');
  });

  it('prefers explicit light mode over an operating-system dark preference', async () => {
    localStorage.setItem('ijara_theme_preference', 'light');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));

    render(<GlobalError error={new Error('fixture server failure')} reset={vi.fn()} />);

    await waitFor(() => expect(document.documentElement).toHaveClass('light'));
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
