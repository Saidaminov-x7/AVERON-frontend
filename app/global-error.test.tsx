import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import GlobalError from './global-error';
import { externalBaseURL } from '@/lib/axios';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

describe('GlobalError theme and contrast fallback', () => {
  it('restores the saved theme before paint and uses theme-aware error surfaces', () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error('fixture')} reset={vi.fn()} />,
    );

    expect(markup).toContain("localStorage.getItem('ijara_theme_preference')");
    expect(markup).toContain("classList.toggle('dark', isDark)");
    expect(markup).toContain('bg-[var(--color-surface-soft)]');
    expect(markup).toContain('text-[var(--color-text)]');
    expect(markup).toContain('text-[var(--color-text-secondary)]');
    expect(markup).not.toContain('text-[var(--color-on-primary)]');
  });

  it('reports client errors only to the sanitized local API origin in tests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      render(<GlobalError error={new Error('safe fixture')} reset={vi.fn()} />);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
      expect(fetchMock.mock.calls[0][0]).toBe(`${externalBaseURL}/error-reports`);
      expect(new URL(fetchMock.mock.calls[0][0]).origin).toBe('http://127.0.0.1:8080');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
