import { describe, expect, it } from 'vitest';
import { resolveProductAssetUrl } from './product-images';

describe('resolveProductAssetUrl', () => {
  it('resolves backend-relative media paths against the API origin', () => {
    expect(resolveProductAssetUrl('/uploads/shirt-front.jpg', 'https://api.averon.test'))
      .toBe('https://api.averon.test/uploads/shirt-front.jpg');
  });

  it('preserves absolute CDN URLs and protocol-relative URLs', () => {
    expect(resolveProductAssetUrl('https://cdn.averon.test/shirt.jpg', 'https://api.averon.test'))
      .toBe('https://cdn.averon.test/shirt.jpg');
    expect(resolveProductAssetUrl('//cdn.averon.test/shirt.jpg', 'https://api.averon.test'))
      .toBe('//cdn.averon.test/shirt.jpg');
  });
});
