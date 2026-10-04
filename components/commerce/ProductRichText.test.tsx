import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductRichText } from './ProductRichText';

describe('ProductRichText', () => {
  it('renders supported Markdown emphasis', () => {
    render(<ProductRichText content="**Bold** and *italic*" />);
    expect(screen.getByText('Bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
  });

  it('does not render raw HTML as active elements', () => {
    const { container } = render(<ProductRichText content={'<img src=x onerror="alert(1)" />safe'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('safe');
  });
});
