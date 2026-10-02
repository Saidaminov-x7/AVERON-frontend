import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageFlag } from './LanguageFlag';

describe('LanguageFlag', () => {
  it.each([
    ['ru', 'Русский', '/flags/ru.svg'],
    ['uz', 'O‘zbekcha', '/flags/uz.svg'],
    ['en', 'English', '/flags/us.svg'],
  ] as const)('renders the %s locale with its local SVG flag asset', (locale, label, source) => {
    render(<LanguageFlag locale={locale} />);
    const flag = screen.getByRole('img', { name: label });

    expect(flag.tagName.toLowerCase()).toBe('img');
    expect(flag).toHaveAttribute('src', source);
    expect(flag).toHaveAttribute('width', '30');
    expect(flag).toHaveAttribute('height', '20');
  });

  it('uses the correct US flag asset for English', () => {
    render(<LanguageFlag locale="en" />);
    expect(screen.getByRole('img', { name: 'English' })).toHaveAttribute('src', '/flags/us.svg');
  });
});
