import { renderToStaticMarkup } from 'react-dom/server';
import { AlertTriangle } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { StatusPage } from './StatusPage';

vi.mock('@/components/navigation/SmartBackButton', () => ({
  SmartBackButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

describe('StatusPage theme contrast', () => {
  it('uses theme surfaces and text tokens for the error panel in both themes', () => {
    const markup = renderToStaticMarkup(
      <StatusPage
        code="500"
        eyebrow="Service unavailable"
        title="Something went wrong"
        description="Please try again."
        icon={AlertTriangle}
        homeLabel="Home"
      />,
    );

    expect(markup).toContain('bg-[var(--color-surface-soft)]');
    expect(markup).toContain('text-[var(--color-text)]');
    expect(markup).toContain('text-[var(--color-text-secondary)]');
    expect(markup).not.toContain('text-[var(--color-on-primary)]');
  });
});
