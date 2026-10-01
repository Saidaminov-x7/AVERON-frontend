import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageFlag } from './LanguageFlag';

describe('LanguageFlag', () => {
  it.each([
    ['ru', 'Русский', '#2455a4'],
    ['uz', 'O‘zbekcha', '#1eb7d5'],
    ['en', 'English', '#3c3b6e'],
  ] as const)('renders the %s locale with its own accessible SVG flag', (locale, label, color) => {
    const { container } = render(<LanguageFlag locale={locale} />);
    const flag = screen.getByRole('img', { name: label });

    expect(flag.tagName.toLowerCase()).toBe('svg');
    expect(flag).toHaveAttribute('viewBox', '0 0 30 20');
    expect(container.querySelector(`path[fill="${color}"]`)).not.toBeNull();
  });

  it('renders the Uzbekistan crescent and twelve stars', () => {
    const { container } = render(<LanguageFlag locale="uz" />);
    expect(container.querySelectorAll('[data-flag-star]')).toHaveLength(12);
    expect(container.querySelector('circle[fill="white"]')).not.toBeNull();
  });
});
