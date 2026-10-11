'use client';

import { Component, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, MeshStandardMaterial, Vector3, WebGLRenderer } from 'three';
import type { Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clampFittingRotation, type FittingAsset } from '@/lib/fitting-room';

const ROTATION_SENSITIVITY = 0.006;

type Ring = { y: number; centerX: number; radiusX: number; radiusZ: number };

export function hasWebGLContext() {
  if (typeof window === 'undefined' || !window.WebGLRenderingContext) return false;
  let renderer: WebGLRenderer | null = null;
  try {
    const probe = document.createElement('canvas');
    renderer = new WebGLRenderer({ canvas: probe, antialias: false, alpha: true });
    return true;
  } catch {
    return false;
  } finally {
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
}

function interpolateRing(before: Ring, start: Ring, end: Ring, after: Ring, amount: number): Ring {
  const amount2 = amount * amount;
  const amount3 = amount2 * amount;
  const sample = (a: number, b: number, c: number, d: number) => 0.5 * (
    2 * b + (-a + c) * amount + (2 * a - 5 * b + 4 * c - d) * amount2 + (-a + 3 * b - 3 * c + d) * amount3
  );
  return {
    y: sample(before.y, start.y, end.y, after.y),
    centerX: sample(before.centerX, start.centerX, end.centerX, after.centerX),
    radiusX: sample(before.radiusX, start.radiusX, end.radiusX, after.radiusX),
    radiusZ: sample(before.radiusZ, start.radiusZ, end.radiusZ, after.radiusZ),
  };
}

export function createProfileGeometry(rings: Ring[], segments = 48) {
  const positions: number[] = [];
  const indices: number[] = [];
  const smoothRings = rings.slice(0, -1).flatMap((ring, index) => {
    const before = rings[Math.max(0, index - 1)];
    const after = rings[Math.min(rings.length - 1, index + 2)];
    return Array.from({ length: 6 }, (_, step) => interpolateRing(before, ring, rings[index + 1], after, step / 6));
  });
  smoothRings.push(rings[rings.length - 1]);
  smoothRings.forEach((ring) => {
    for (let index = 0; index < segments; index += 1) {
      const angle = index / segments * Math.PI * 2;
      positions.push(ring.centerX + Math.cos(angle) * ring.radiusX, ring.y, Math.sin(angle) * ring.radiusZ);
    }
  });
  for (let ringIndex = 0; ringIndex < smoothRings.length - 1; ringIndex += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      const a = ringIndex * segments + segment;
      const b = ringIndex * segments + next;
      const c = (ringIndex + 1) * segments + next;
      const d = (ringIndex + 1) * segments + segment;
      indices.push(a, d, b, b, d, c);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createTaperedLimbGeometry(curve: CatmullRomCurve3, startRadius: number, endRadius: number, tubularSegments = 40, radialSegments = 24) {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let ring = 0; ring <= tubularSegments; ring += 1) {
    const progress = ring / tubularSegments;
    const smoothProgress = progress * progress * (3 - 2 * progress);
    const radius = startRadius + (endRadius - startRadius) * smoothProgress;
    const point = curve.getPointAt(progress);
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = segment / radialSegments * Math.PI * 2;
      const normal = frames.normals[ring];
      const binormal = frames.binormals[ring];
      positions.push(
        point.x + radius * (Math.cos(angle) * normal.x + Math.sin(angle) * binormal.x),
        point.y + radius * (Math.cos(angle) * normal.y + Math.sin(angle) * binormal.y),
        point.z + radius * (Math.cos(angle) * normal.z + Math.sin(angle) * binormal.z),
      );
    }
  }
  for (let ring = 0; ring < tubularSegments; ring += 1) {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const next = (segment + 1) % radialSegments;
      const a = ring * radialSegments + segment;
      const b = ring * radialSegments + next;
      const c = (ring + 1) * radialSegments + next;
      const d = (ring + 1) * radialSegments + segment;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Mannequin() {
  const geometry = useMemo(() => ({
    torso: createProfileGeometry([
      { y: 0.68, centerX: 0, radiusX: 0.12, radiusZ: 0.095 },
      { y: 0.76, centerX: 0, radiusX: 0.18, radiusZ: 0.12 },
      { y: 0.88, centerX: 0, radiusX: 0.205, radiusZ: 0.13 },
      { y: 0.99, centerX: 0, radiusX: 0.17, radiusZ: 0.115 },
      { y: 1.12, centerX: 0, radiusX: 0.145, radiusZ: 0.105 },
      { y: 1.27, centerX: 0, radiusX: 0.17, radiusZ: 0.11 },
      { y: 1.4, centerX: 0, radiusX: 0.22, radiusZ: 0.12 },
      { y: 1.48, centerX: 0, radiusX: 0.235, radiusZ: 0.12 },
      { y: 1.56, centerX: 0, radiusX: 0.17, radiusZ: 0.1 },
      { y: 1.64, centerX: 0, radiusX: 0.065, radiusZ: 0.065 },
    ]),
    leftLeg: createProfileGeometry([
      { y: 0.06, centerX: -0.09, radiusX: 0.047, radiusZ: 0.05 },
      { y: 0.23, centerX: -0.09, radiusX: 0.065, radiusZ: 0.07 },
      { y: 0.45, centerX: -0.095, radiusX: 0.072, radiusZ: 0.075 },
      { y: 0.68, centerX: -0.1, radiusX: 0.095, radiusZ: 0.095 },
      { y: 0.9, centerX: -0.09, radiusX: 0.09, radiusZ: 0.09 },
      { y: 1.02, centerX: -0.075, radiusX: 0.07, radiusZ: 0.075 },
    ]),
    rightLeg: createProfileGeometry([
      { y: 0.06, centerX: 0.09, radiusX: 0.047, radiusZ: 0.05 },
      { y: 0.23, centerX: 0.09, radiusX: 0.065, radiusZ: 0.07 },
      { y: 0.45, centerX: 0.095, radiusX: 0.072, radiusZ: 0.075 },
      { y: 0.68, centerX: 0.1, radiusX: 0.095, radiusZ: 0.095 },
      { y: 0.9, centerX: 0.09, radiusX: 0.09, radiusZ: 0.09 },
      { y: 1.02, centerX: 0.075, radiusX: 0.07, radiusZ: 0.075 },
    ]),
    neck: createProfileGeometry([
      { y: 1.57, centerX: 0, radiusX: 0.072, radiusZ: 0.068 },
      { y: 1.62, centerX: 0, radiusX: 0.056, radiusZ: 0.055 },
      { y: 1.7, centerX: 0, radiusX: 0.052, radiusZ: 0.052 },
      { y: 1.73, centerX: 0, radiusX: 0.068, radiusZ: 0.064 },
    ]),
  }), []);
  const armCurves = useMemo(() => [
    new CatmullRomCurve3([new Vector3(-0.13, 1.48, 0), new Vector3(-0.27, 1.43, 0), new Vector3(-0.36, 1.25, 0), new Vector3(-0.405, 1.04, 0)]),
    new CatmullRomCurve3([new Vector3(0.13, 1.48, 0), new Vector3(0.27, 1.43, 0), new Vector3(0.36, 1.25, 0), new Vector3(0.405, 1.04, 0)]),
  ], []);
  const armGeometry = useMemo(() => armCurves.map((curve) => createTaperedLimbGeometry(curve, 0.078, 0.038)), [armCurves]);
  const skin = useMemo(() => new MeshStandardMaterial({ color: '#c6c2bd', roughness: 0.78, metalness: 0 }), []);

  useEffect(() => () => {
    Object.values(geometry).forEach((item) => item.dispose());
    armGeometry.forEach((item) => item.dispose());
    skin.dispose();
  }, [armGeometry, geometry, skin]);

  return (
    <group>
      <mesh geometry={geometry.torso} material={skin} castShadow receiveShadow />
      <mesh geometry={geometry.leftLeg} material={skin} castShadow receiveShadow />
      <mesh geometry={geometry.rightLeg} material={skin} castShadow receiveShadow />
      <mesh geometry={geometry.neck} material={skin} castShadow receiveShadow />
      <mesh position={[0, 1.82, 0]} scale={[0.103, 0.135, 0.096]} material={skin} castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>
      {[-1, 1].map((side) => <group key={`limb-endpoints-${side}`}>
        <mesh position={[side * 0.412, 0.94, 0.008]} rotation={[0, 0, side * -0.12]} scale={[0.052, 0.078, 0.038]} material={skin} castShadow receiveShadow>
          <sphereGeometry args={[1, 28, 20]} />
        </mesh>
        <mesh position={[side * 0.09, 0.052, 0.075]} rotation={[0.04, 0, side * -0.025]} scale={[0.066, 0.048, 0.142]} material={skin} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 20]} />
        </mesh>
      </group>)}
      {armGeometry.map((item, index) => <mesh key={index} geometry={item} material={skin} castShadow receiveShadow />)}
    </group>
  );
}

function disposeObject(root: Object3D) {
  root.traverse((object) => {
    const mesh = object as Object3D & { geometry?: BufferGeometry; material?: unknown };
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of materials) {
      if (material && typeof material === 'object' && 'dispose' in material && typeof material.dispose === 'function') {
        for (const value of Object.values(material)) {
          if (value && typeof value === 'object' && 'isTexture' in value && value.isTexture === true && 'dispose' in value && typeof value.dispose === 'function') value.dispose();
        }
        material.dispose();
      }
    }
  });
}

function Garment({ asset, onLoaded }: { asset: FittingAsset; onLoaded: (assetId: string) => void }) {
  const gltf = useLoader(GLTFLoader, asset.url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  useEffect(() => () => {
    disposeObject(scene);
    useLoader.clear(GLTFLoader, asset.url);
  }, [asset.url, scene]);
  useEffect(() => onLoaded(asset.id), [asset.id, onLoaded]);
  return <primitive object={scene} position={[asset.positionX, asset.positionY, asset.positionZ]} scale={asset.scale} />;
}

class ViewerErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onError(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function ViewerFallback({
  imageUrl,
  message,
  role = 'status',
  onUnavailable,
}: {
  imageUrl?: string | null;
  message: string;
  role?: 'status' | 'alert';
  onUnavailable?: () => void;
}) {
  useEffect(() => onUnavailable?.(), [onUnavailable]);

  return (
    <div role={role} className="flex h-full min-h-0 flex-col items-center justify-center gap-3 overflow-hidden bg-[var(--color-surface-soft)] px-6 pb-20 pt-10 text-center text-sm leading-5 text-[var(--color-text-secondary)]">
      {imageUrl ? <img src={imageUrl} alt="" className="max-h-[min(36vh,300px)] max-w-full object-contain" /> : null}
      <p className="max-w-[32ch]">{message}</p>
    </div>
  );
}

export function FittingRoomViewer({
  assets,
  labels,
  fallbackImageUrl,
}: {
  assets: FittingAsset[];
  labels: { loading: string; unavailable: string; front: string; left: string; right: string; webgl: string };
  fallbackImageUrl?: string | null;
}) {
  const [rotation, setRotation] = useState(0);
  const [pointerX, setPointerX] = useState<number | null>(null);
  const [webglLost, setWebglLost] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [failedSignature, setFailedSignature] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const allAssets = assets;
  const visibleAssets = useMemo(() => assets.filter((asset) => asset.mannequinVersion === 'averon-neutral-v1'), [assets]);
  const assetSignature = useMemo(() => visibleAssets.map((asset) => `${asset.id}:${asset.url}`).join('|'), [visibleAssets]);
  const viewerFailed = failedSignature === assetSignature;
  const [loadedAssets, setLoadedAssets] = useState<{ signature: string; ids: Set<string> }>({ signature: '', ids: new Set() });
  const onAssetLoaded = useCallback((assetId: string) => {
    setLoadedAssets((current) => ({
      signature: assetSignature,
      ids: new Set(current.signature === assetSignature ? [...current.ids, assetId] : [assetId]),
    }));
  }, [assetSignature]);
  const modelsLoaded = visibleAssets.every((asset) => loadedAssets.signature === assetSignature && loadedAssets.ids.has(asset.id));
  const [supportsWebGL] = useState(hasWebGLContext);

  useEffect(() => {
    if (!canvas) return;
    const handleLost = (event: Event) => { event.preventDefault(); setWebglLost(true); };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [canvas]);

  useEffect(() => {
    if (!supportsWebGL || canvasReady || webglLost || viewerFailed) return;
    const timeout = window.setTimeout(() => setWebglLost(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [canvasReady, supportsWebGL, viewerFailed, webglLost]);

  if (visibleAssets.length !== allAssets.length) {
    return <div role="status" className="grid min-h-[320px] place-items-center bg-[var(--color-surface-soft)] p-6 text-center text-sm text-[var(--color-text-secondary)]">{fallbackImageUrl && <img src={fallbackImageUrl} alt="" className="max-h-[min(48vh,420px)] object-contain" />}{labels.unavailable}</div>;
  }

  const moveRotation = (delta: number) => setRotation((current) => clampFittingRotation(current + delta));
  const leftLabel = labels.left;
  const rightLabel = labels.right;
  const frontLabel = labels.front;
  const rotationLabel = `${Math.round(rotation * 180 / Math.PI)}°`;

  return (
    <div className="relative h-[min(58vh,620px)] min-h-[380px] touch-pan-y overflow-hidden bg-[var(--color-surface-soft)] sm:min-h-[460px]">
      {supportsWebGL && !webglLost && !viewerFailed ? <ViewerErrorBoundary key={assetSignature} onError={() => setFailedSignature(assetSignature)} fallback={<ViewerFallback imageUrl={fallbackImageUrl} message={labels.unavailable} role="alert" />}>
        <Canvas
          shadows
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.05, 3.65], fov: 34 }}
          onCreated={({ gl, camera }) => {
            setCanvasReady(true);
            if (gl.domElement.clientWidth < 550) camera.position.set(0, 1.05, 4.35);
            camera.lookAt(0, 0.98, 0);
            setCanvas(gl.domElement);
          }}
          onPointerDown={(event) => {
            setPointerX(event.clientX);
            const target = event.nativeEvent.currentTarget as HTMLCanvasElement;
            if (typeof target.setPointerCapture === 'function') {
              try {
                target.setPointerCapture(event.pointerId);
              } catch {
                // Pointer capture is unavailable in some browser/WebGL contexts; dragging still works while over the canvas.
              }
            }
          }}
          onPointerMove={(event) => {
            if (pointerX === null) return;
            moveRotation((event.clientX - pointerX) * ROTATION_SENSITIVITY);
            setPointerX(event.clientX);
          }}
          onPointerUp={() => setPointerX(null)}
          onPointerCancel={() => setPointerX(null)}
        >
          <color attach="background" args={['#f4f2ef']} />
          <ambientLight intensity={1.35} />
          <directionalLight position={[3, 4, 5]} intensity={2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <directionalLight position={[-3, 2, -4]} intensity={0.55} />
          <Suspense fallback={null}>
            <group rotation={[0, rotation, 0]}>
              <Mannequin />
              {visibleAssets.map((asset) => <Garment key={asset.id} asset={asset} onLoaded={onAssetLoaded} />)}
            </group>
          </Suspense>
          <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.1, 64]} />
            <meshStandardMaterial color="#e4e0da" roughness={1} />
          </mesh>
        </Canvas>
      </ViewerErrorBoundary> : <ViewerFallback imageUrl={fallbackImageUrl} message={labels.webgl} />}
      {supportsWebGL && (!canvasReady || !modelsLoaded) && !viewerFailed && !webglLost && <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-[var(--color-text-secondary)]">{labels.loading}</div>}
      {supportsWebGL && canvasReady && !viewerFailed && !webglLost && <>
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
          <button type="button" className="grid size-11 place-items-center border border-[var(--color-border)] bg-[var(--color-surface)] text-xl text-[var(--color-text)]" aria-label={leftLabel} onClick={() => moveRotation(-0.16)}>‹</button>
          <button type="button" className="min-w-24 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text)]" onClick={() => setRotation(0)}>{frontLabel}</button>
          <button type="button" className="grid size-11 place-items-center border border-[var(--color-border)] bg-[var(--color-surface)] text-xl text-[var(--color-text)]" aria-label={rightLabel} onClick={() => moveRotation(0.16)}>›</button>
        </div>
        <span role="status" aria-label={rotationLabel} className="absolute left-3 top-3 z-10 bg-[var(--color-surface)] px-2 py-1 text-xs tabular-nums text-[var(--color-text-secondary)]">{rotationLabel}</span>
      </>}
    </div>
  );
}

