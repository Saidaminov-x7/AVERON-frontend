import { describe, expect, it } from 'vitest';
import { Box3 } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { createSyntheticFittingRoomGlb, NOT_A_GARMENT_NOTICE } from './test-fixtures/synthetic-fitting-room-glb';
import { clampFittingRotation, getFittingFallbackImageUrl, getVariantFittingAsset, MAX_FITTING_ROTATION, MIN_FITTING_ROTATION, rotateFittingWithArrow, shouldFallbackToFittingPhoto } from './fitting-room';

describe('fitting-room asset fallback', () => {
  it('uses product photos when no 3D garment is available', () => {
    expect(shouldFallbackToFittingPhoto([])).toBe(true);
  });

  it('refuses incompatible or mixed mannequin assets instead of showing an empty 3D look', () => {
    expect(shouldFallbackToFittingPhoto([{ mannequinVersion: 'unknown-version' }])).toBe(true);
    expect(shouldFallbackToFittingPhoto([
      { mannequinVersion: 'averon-neutral-v1' },
      { mannequinVersion: 'unknown-version' },
    ])).toBe(true);
  });

  it('allows supported garments to enter the 3D viewer', () => {
    expect(shouldFallbackToFittingPhoto([{ mannequinVersion: 'averon-neutral-v1' }])).toBe(false);
  });

  it('shows a photo when any selected garment lacks a compatible variant model', () => {
    expect(shouldFallbackToFittingPhoto([{ mannequinVersion: 'averon-neutral-v1' }], true)).toBe(true);
  });

  it('prefers the photo belonging to an incompatible garment', () => {
    expect(getFittingFallbackImageUrl([
      { asset: { mannequinVersion: 'averon-neutral-v1' }, imageUrl: '/initial.jpg' },
      { asset: { mannequinVersion: 'unsupported' }, imageUrl: '/incompatible.jpg' },
    ], '/fallback.jpg')).toBe('/incompatible.jpg');
  });

  it('requires an exact variant asset instead of retaining a previous or generic garment', () => {
    const assets = [{ variantId: 'blue' }, { variantId: null }];
    expect(getVariantFittingAsset(assets, 'red')).toBeUndefined();
    expect(getVariantFittingAsset(assets, 'blue')).toBe(assets[0]);
    expect(getVariantFittingAsset(assets, null)).toBe(assets[1]);
  });
});

describe('fitting-room rotation', () => {
  it('clamps the mannequin to +/- 60 degrees', () => {
    expect(clampFittingRotation(-Math.PI)).toBe(MIN_FITTING_ROTATION);
    expect(clampFittingRotation(Math.PI)).toBe(MAX_FITTING_ROTATION);
  });

  it('preserves rotations inside the allowed range', () => {
    expect(clampFittingRotation(0)).toBe(0);
    expect(clampFittingRotation(Math.PI / 6)).toBe(Math.PI / 6);
  });

  it('rotates with arrow keys while enforcing the same limits', () => {
    expect(rotateFittingWithArrow(0, 'ArrowLeft')).toBe(-0.16);
    expect(rotateFittingWithArrow(0, 'ArrowRight')).toBe(0.16);
    expect(rotateFittingWithArrow(MAX_FITTING_ROTATION, 'ArrowRight')).toBe(MAX_FITTING_ROTATION);
    expect(rotateFittingWithArrow(MIN_FITTING_ROTATION, 'ArrowLeft')).toBe(MIN_FITTING_ROTATION);
    expect(rotateFittingWithArrow(0, 'Escape')).toBe(0);
  });
});

describe('synthetic GLB pipeline fixture', () => {
  it('parses a labeled non-product mesh with finite bounds and authored transform', async () => {
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      new GLTFLoader().parse(createSyntheticFittingRoomGlb(), '', resolve, reject);
    });
    const root = gltf.scene;
    const mesh = root.children[0];
    root.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(root);

    expect(gltf.parser.json.asset.extras?.notice).toBe(NOT_A_GARMENT_NOTICE);
    expect(mesh.position.toArray()).toEqual([0.25, 0.5, 0]);
    expect(mesh.scale.toArray()).toEqual([1.5, 1.5, 1.5]);
    expect([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)).toBe(true);
    expect(bounds.min.toArray()).toEqual([-0.5, 0.5, 0]);
    expect(bounds.max.toArray()).toEqual([1, 2, 0]);
  });
});
