import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusPage } from './StatusPage';

vi.mock('@/components/navigation/SmartBackButton', () => ({
  SmartBackButton: () => <a href="/">Home</a>,
}));

describe('StatusPage theme contrast', () => {
  it('uses theme surface and text tokens so the 500 panel stays readable in dark mode', () => {
    const markup = renderToStaticMarkup(
      <StatusPage
        code="500"
        eyebrow="Service unavailable"
        title="Something went wrong"
        description="Please try again."
        icon={() => null}
        homeLabel="Home"
      />,
    );

    expect(markup).toContain('bg-[var(--color-surface-soft)]');
    expect(markup).toContain('text-[var(--color-text)]');
    expect(markup).toContain('text-[var(--color-text-secondary)]');
    expect(markup).not.toContain('bg-[var(--color-primary)]');
    expect(markup).not.toContain('text-[var(--color-on-primary)]');
    expect(markup).not.toContain('text-stone-950');
  });
});
