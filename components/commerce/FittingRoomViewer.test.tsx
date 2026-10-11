import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatmullRomCurve3, Vector3 } from 'three';
import type { FittingAsset } from '@/lib/fitting-room';
import { createProfileGeometry, createTaperedLimbGeometry, FittingRoomViewer, hasWebGLContext } from './FittingRoomViewer';

const asset: FittingAsset = {
  id: 'fixture-shirt',
  variantId: null,
  garmentLayer: 'BASE_TOP',
  mannequinVersion: 'averon-neutral-v1',
  positionX: 0,
  positionY: 0.8,
  positionZ: 0,
  scale: 1,
  url: 'http://127.0.0.1/fixture-shirt.glb',
};

const labels = {
  loading: 'Loading model',
  unavailable: 'Model unavailable',
  webgl: '3D viewing is unavailable. Use product photos.',
  front: 'Front view',
  left: 'Turn left',
  right: 'Turn right',
};

describe('FittingRoomViewer fallback', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows a contained photo fallback without loading text or non-functional rotation controls when WebGL is unavailable', () => {
    vi.stubGlobal('WebGLRenderingContext', undefined);

    const { container } = render(
      <FittingRoomViewer assets={[asset]} fallbackImageUrl="/fixture-front.svg" labels={labels} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(labels.webgl);
    expect(screen.queryByText(labels.loading)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: labels.left })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: labels.right })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: labels.front })).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveClass('max-h-[min(36vh,300px)]', 'max-w-full');
    expect(screen.getByRole('status')).toHaveClass('pb-20', 'pt-10', 'overflow-hidden');
  });

  it('does not treat a WebGL API constructor as proof that the browser can create a context', () => {
    vi.stubGlobal('WebGLRenderingContext', class WebGLRenderingContext {});
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    expect(hasWebGLContext()).toBe(false);
  });
});

describe('mannequin profile geometry', () => {
  it('connects every interpolated torso ring from the waist through the shoulders and neck', () => {
    const geometry = createProfileGeometry([
      { y: 0.68, centerX: 0, radiusX: 0.12, radiusZ: 0.095 },
      { y: 0.88, centerX: 0, radiusX: 0.205, radiusZ: 0.13 },
      { y: 1.12, centerX: 0, radiusX: 0.145, radiusZ: 0.105 },
      { y: 1.4, centerX: 0, radiusX: 0.22, radiusZ: 0.12 },
      { y: 1.64, centerX: 0, radiusX: 0.065, radiusZ: 0.065 },
    ]);

    expect(geometry.getAttribute('position').count).toBe(25 * 48);
    expect(geometry.index?.count).toBe(24 * 48 * 6);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.min.y).toBeCloseTo(0.68);
    expect(geometry.boundingBox?.max.y).toBeCloseTo(1.64);
    geometry.dispose();
  });

  it('builds a tapered, smoothly-normaled limb that stays continuous along the shoulder-to-wrist curve', () => {
    const curve = new CatmullRomCurve3([
      new Vector3(-0.13, 1.48, 0),
      new Vector3(-0.27, 1.43, 0),
      new Vector3(-0.36, 1.25, 0),
      new Vector3(-0.405, 1.04, 0),
    ]);
    const geometry = createTaperedLimbGeometry(curve, 0.078, 0.038);
    geometry.computeBoundingBox();

    expect(geometry.getAttribute('position').count).toBe(41 * 24);
    expect(geometry.index?.count).toBe(40 * 24 * 6);
    expect(geometry.boundingBox?.min.x).toBeLessThan(-0.44);
    expect(geometry.boundingBox?.max.x).toBeGreaterThan(-0.13);
    expect(Array.from(geometry.getAttribute('normal').array).every(Number.isFinite)).toBe(true);
    const firstPosition = new Vector3().fromBufferAttribute(geometry.getAttribute('position'), 0);
    const firstNormal = new Vector3().fromBufferAttribute(geometry.getAttribute('normal'), 0);
    const radial = firstPosition.sub(curve.getPointAt(0)).normalize();
    expect(firstNormal.dot(radial)).toBeGreaterThan(0.9);
    geometry.dispose();
  });
});
