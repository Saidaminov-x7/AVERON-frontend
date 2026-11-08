import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container } from './Container';

describe('Container', () => {
  it('provides a 1440px responsive page container by default', () => {
    render(<Container data-testid="container">Content</Container>);
    const container = screen.getByTestId('container');
    expect(container).toHaveStyle({ maxWidth: '1440px' });
    expect(container).toHaveClass('w-full', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
  });
  it('allows an explicit width and forwards element attributes', () => {
    render(<Container maxWidth={960} id="content">Content</Container>);
    expect(screen.getByText('Content')).toHaveStyle({ maxWidth: '960px' });
    expect(screen.getByText('Content')).toHaveAttribute('id', 'content');
  });
});
