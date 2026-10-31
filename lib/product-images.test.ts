import { describe, expect, it } from 'vitest';
import { resolveProductAssetUrl } from './product-images';

describe('resolveProductAssetUrl', () => {
  it('keeps backend upload paths same-origin through the fixed backend rewrite', () => {
    expect(resolveProductAssetUrl('/uploads/shirt-front.jpg', 'https://api.averon.test'))
      .toBe('/api/backend/uploads/shirt-front.jpg');
    expect(resolveProductAssetUrl('https://api.averon.test/uploads/shirt-front.jpg?width=800', 'https://api.averon.test'))
      .toBe('/api/backend/uploads/shirt-front.jpg?width=800');
  });

  it('resolves other backend-relative media paths against the API origin', () => {
    expect(resolveProductAssetUrl('/media/shirt-front.jpg', 'https://api.averon.test'))
      .toBe('https://api.averon.test/media/shirt-front.jpg');
  });

  it('preserves absolute CDN URLs and protocol-relative URLs', () => {
    expect(resolveProductAssetUrl('https://cdn.averon.test/shirt.jpg', 'https://api.averon.test'))
      .toBe('https://cdn.averon.test/shirt.jpg');
    expect(resolveProductAssetUrl('//cdn.averon.test/shirt.jpg', 'https://api.averon.test'))
      .toBe('//cdn.averon.test/shirt.jpg');
  });
});
