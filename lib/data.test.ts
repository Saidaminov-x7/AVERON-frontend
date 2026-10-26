import { describe, expect, it } from 'vitest';
import { getSearchSuggestions } from './data';

describe('catalog search suggestions', () => {
  it('shows an exact-query search action for non-matching text', () => {
    expect(getSearchSuggestions('  unknown text  ', 'en')).toEqual([
      expect.objectContaining({
        text: 'Search “unknown text”',
        sub: 'Search the AVERON catalog',
        href: '/catalog?q=unknown%20text',
      }),
    ]);
  });

  it.each([
    ['ru', 'Обувь'],
    ['uz', 'Oyoq kiyim'],
    ['en', 'Shoes'],
  ])('localizes shoe suggestions in %s', (locale, expected) => {
    expect(getSearchSuggestions('shoes', locale)[0]).toMatchObject({ text: expected });
  });

  it('does not suggest for an empty query', () => {
    expect(getSearchSuggestions('  ', 'ru')).toEqual([]);
  });
});
