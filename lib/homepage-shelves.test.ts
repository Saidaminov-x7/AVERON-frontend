import { describe, expect, it } from 'vitest';
import { allocateHomepageShelves } from './homepage-shelves';

const product = (id: string) => ({ id, title: id });

describe('allocateHomepageShelves', () => {
  it('shows a shared discounted/new product once in the sale shelf', () => {
    const result = allocateHomepageShelves({
      newest: [product('new-sale'), product('new-only')],
      discounted: [product('new-sale'), product('sale-only')],
      popular: [product('new-sale'), product('new-only'), product('sale-only'), product('popular-only')],
    });

    expect(result.discounted.map(({ id }) => id)).toEqual(['new-sale', 'sale-only']);
    expect(result.newest.map(({ id }) => id)).toEqual(['new-only']);
    expect(result.popular.map(({ id }) => id)).toEqual(['popular-only']);
    expect(new Set(Object.values(result).flat().map(({ id }) => id)).size).toBe(4);
  });

  it('removes repeated IDs within a shelf and respects the per-shelf limit', () => {
    const result = allocateHomepageShelves({
      discounted: [],
      newest: [product('a'), product('a'), ...Array.from({ length: 10 }, (_, index) => product(`n${index}`))],
      popular: [product('a'), ...Array.from({ length: 10 }, (_, index) => product(`p${index}`))],
    });

    expect(result.newest).toHaveLength(8);
    expect(result.newest[0].id).toBe('a');
    expect(result.popular).toHaveLength(8);
    expect(result.popular.some(({ id }) => id === 'a')).toBe(false);
  });

  it('does not mutate the source lists and preserves empty shelves', () => {
    const input = { newest: [product('a')], discounted: [], popular: [product('b')] };
    const before = structuredClone(input);

    expect(allocateHomepageShelves(input)).toEqual({ newest: [product('a')], discounted: [], popular: [product('b')] });
    expect(input).toEqual(before);
  });
});
