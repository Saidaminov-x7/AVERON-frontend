import { renderToStaticMarkup } from 'react-dom/server';
import { AlertTriangle } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { StatusPage } from './StatusPage';

vi.mock('@/components/navigation/SmartBackButton', () => ({
  SmartBackButton: ({ label }: { label: string }) => <span>{label}</span>,
}));

describe('StatusPage theme contrast', () => {
  it('uses the contrasting foreground token for its primary error panel', () => {
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

    expect(markup).toContain('bg-[var(--color-primary)]');
    expect(markup).toContain('text-[var(--color-on-primary)]');
    expect(markup).not.toContain('text-white/70');
  });
});
