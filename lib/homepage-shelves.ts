type ProductWithId = { id: string };

type HomepageShelfInput<T extends ProductWithId> = {
  newest: T[];
  discounted: T[];
  popular: T[];
};

/**
 * Keep homepage shelves useful without repeating the same product card in
 * multiple sections. Sale products have first claim so the dedicated sale
 * shelf stays semantically accurate; all products remain reachable in catalog.
 */
export function allocateHomepageShelves<T extends ProductWithId>(
  input: HomepageShelfInput<T>,
  maxPerShelf = 8,
) {
  const seen = new Set<string>();

  const takeUnique = (products: T[]) => {
    const selected: T[] = [];
    for (const product of products) {
      if (!product.id || seen.has(product.id)) continue;
      seen.add(product.id);
      selected.push(product);
      if (selected.length === maxPerShelf) break;
    }
    return selected;
  };

  const discounted = takeUnique(input.discounted);
  const newest = takeUnique(input.newest);
  const popular = takeUnique(input.popular);

  return { newest, discounted, popular };
}
