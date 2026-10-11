import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import GlobalError from './global-error';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

describe('GlobalError theme and contrast fallback', () => {
  it('restores the saved theme before paint and uses the matching primary foreground', () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error('fixture')} reset={vi.fn()} />,
    );

    expect(markup).toContain("localStorage.getItem('ijara_theme_preference')");
    expect(markup).toContain("classList.toggle('dark', isDark)");
    expect(markup).toContain('bg-[var(--color-primary)]');
    expect(markup).toContain('text-[var(--color-on-primary)]');
    expect(markup).not.toContain('text-white/75');
  });
});
