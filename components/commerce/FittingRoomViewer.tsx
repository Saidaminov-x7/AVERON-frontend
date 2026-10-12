'use client';

import { Component, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, MeshStandardMaterial, TubeGeometry, Vector3 } from 'three';
import type { Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Image from 'next/image';
import { clampFittingRotation, type FittingAsset } from '@/lib/fitting-room';

const ROTATION_SENSITIVITY = 0.006;

type Ring = { y: number; centerX: number; radiusX: number; radiusZ: number };

function createProfileGeometry(rings: Ring[], segments = 48) {
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach((ring) => {
    for (let index = 0; index < segments; index += 1) {
      const angle = index / segments * Math.PI * 2;
      positions.push(ring.centerX + Math.cos(angle) * ring.radiusX, ring.y, Math.sin(angle) * ring.radiusZ);
    }
  });
  for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex += 1) {
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

function Mannequin() {
  const geometry = useMemo(() => ({
    torso: createProfileGeometry([
      { y: 0.84, centerX: 0, radiusX: 0.13, radiusZ: 0.11 },
      { y: 0.96, centerX: 0, radiusX: 0.17, radiusZ: 0.12 },
      { y: 1.10, centerX: 0, radiusX: 0.155, radiusZ: 0.105 },
      { y: 1.28, centerX: 0, radiusX: 0.195, radiusZ: 0.115 },
      { y: 1.43, centerX: 0, radiusX: 0.225, radiusZ: 0.12 },
      { y: 1.55, centerX: 0, radiusX: 0.185, radiusZ: 0.105 },
      { y: 1.62, centerX: 0, radiusX: 0.075, radiusZ: 0.07 },
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
  }), []);
  const armCurves = useMemo(() => [
    new CatmullRomCurve3([new Vector3(-0.16, 1.5, 0), new Vector3(-0.29, 1.43, 0), new Vector3(-0.37, 1.24, 0), new Vector3(-0.4, 1.02, 0)]),
    new CatmullRomCurve3([new Vector3(0.16, 1.5, 0), new Vector3(0.29, 1.43, 0), new Vector3(0.37, 1.24, 0), new Vector3(0.4, 1.02, 0)]),
  ], []);
  const armGeometry = useMemo(() => armCurves.map((curve) => new TubeGeometry(curve, 36, 0.052, 16, false)), [armCurves]);
  const skin = useMemo(() => new MeshStandardMaterial({ color: '#d6d1c8', roughness: 0.84, metalness: 0 }), []);

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
      {armGeometry.map((item, index) => <mesh key={index} geometry={item} material={skin} castShadow receiveShadow />)}
      <mesh position={[0, 1.655, 0]} rotation={[0.12, 0, 0]} material={skin} castShadow>
        <cylinderGeometry args={[0.047, 0.055, 0.12, 32]} />
      </mesh>
      <mesh position={[0, 1.81, 0]} scale={[0.105, 0.135, 0.095]} material={skin} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 0.09, 0.035, 0.045]} material={skin} castShadow>
        <boxGeometry args={[0.105, 0.07, 0.22]} />
      </mesh>)}
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
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
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

  useEffect(() => {
    if (!canvas) return;
    const handleLost = (event: Event) => { event.preventDefault(); setWebglLost(true); };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [canvas]);

  if (webglLost || visibleAssets.length !== allAssets.length) {
    return <div role="status" className="grid min-h-[320px] place-items-center bg-[var(--color-surface-soft)] p-6 text-center text-sm text-[var(--color-text-secondary)]">{fallbackImageUrl && <Image src={fallbackImageUrl} alt="" width={640} height={800} unoptimized className="max-h-[min(48vh,420px)] object-contain" />}{webglLost ? labels.webgl : labels.unavailable}</div>;
  }

  const moveRotation = (delta: number) => setRotation((current) => clampFittingRotation(current + delta));

  return (
    <div className="relative h-[min(54vh,560px)] min-h-[320px] touch-pan-y overflow-hidden bg-[var(--color-surface-soft)] sm:min-h-[420px]">
      <ViewerErrorBoundary key={assetSignature} onError={() => setFailedSignature(assetSignature)} fallback={<div role="alert" className="grid h-full min-h-[320px] place-items-center p-6 text-center text-sm text-[var(--color-text-secondary)]">{fallbackImageUrl && <Image src={fallbackImageUrl} alt="" width={640} height={800} unoptimized className="max-h-[min(48vh,420px)] object-contain" />}{labels.unavailable}</div>}>
        <Canvas
          shadows
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.15, 4.1], fov: 31 }}
          fallback={<div role="status" className="grid h-full place-items-center p-6 text-center text-sm">{fallbackImageUrl && <Image src={fallbackImageUrl} alt="" width={640} height={800} unoptimized className="max-h-[min(48vh,420px)] object-contain" />}{labels.webgl}</div>}
          onCreated={({ gl }) => setCanvas(gl.domElement)}
          onPointerDown={(event) => {
            setPointerX(event.clientX);
            (event.nativeEvent.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId);
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
          <ambientLight intensity={1.6} />
          <directionalLight position={[3, 4, 5]} intensity={2.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <directionalLight position={[-3, 2, -4]} intensity={0.65} />
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
      </ViewerErrorBoundary>
      {!modelsLoaded && !viewerFailed && !webglLost && <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-[var(--color-text-secondary)]">{labels.loading}</div>}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-2">
        <button type="button" className="pointer-events-auto grid size-11 place-items-center border border-[var(--color-border)] bg-[var(--color-surface)] text-xl text-[var(--color-text)]" aria-label={labels.left} onClick={() => moveRotation(-0.16)}>‹</button>
        <button type="button" className="pointer-events-auto min-w-24 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text)]" onClick={() => setRotation(0)}>{labels.front}</button>
        <button type="button" className="pointer-events-auto grid size-11 place-items-center border border-[var(--color-border)] bg-[var(--color-surface)] text-xl text-[var(--color-text)]" aria-label={labels.right} onClick={() => moveRotation(0.16)}>›</button>
      </div>
      <span className="absolute left-3 top-3 bg-[var(--color-surface)] px-2 py-1 text-xs tabular-nums text-[var(--color-text-secondary)]">{Math.round(rotation * 180 / Math.PI)}°</span>
    </div>
  );
}
