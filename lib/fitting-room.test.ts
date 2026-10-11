import { describe, expect, it } from 'vitest';
import { clampFittingRotation, MAX_FITTING_ROTATION, MIN_FITTING_ROTATION } from './fitting-room';

describe('fitting-room rotation', () => {
  it('clamps the mannequin to +/- 60 degrees', () => {
    expect(clampFittingRotation(-Math.PI)).toBe(MIN_FITTING_ROTATION);
    expect(clampFittingRotation(Math.PI)).toBe(MAX_FITTING_ROTATION);
  });

  it('preserves rotations inside the allowed range', () => {
    expect(clampFittingRotation(0)).toBe(0);
    expect(clampFittingRotation(Math.PI / 6)).toBe(Math.PI / 6);
  });
});

