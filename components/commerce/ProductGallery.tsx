'use client';

import { useEffect, useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { ProductImage } from '@/components/commerce/ProductImage';

export interface ProductGalleryImage {
  id?: string;
  url: string;
  alt?: Record<string, string>;
}

interface ProductGalleryProps {
  images: ProductGalleryImage[];
  productTitle: string;
  locale: string;
  label: string;
  imageLabels: string[];
  previousLabel: string;
  nextLabel: string;
  openImageLabel: string;
  closeViewerLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
}

interface Point {
  x: number;
  y: number;
}

const clampZoom = (value: number) => Math.min(4, Math.max(1, value));

function distanceBetween(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function ProductGallery({
  images,
  productTitle,
  locale,
  label,
  imageLabels,
  previousLabel,
  nextLabel,
  openImageLabel,
  closeViewerLabel,
  zoomInLabel,
  zoomOutLabel,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [photoAspectRatios, setPhotoAspectRatios] = useState<Record<string, string>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [pointerActive, setPointerActive] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const dragStartRef = useRef<{ point: Point; pan: Point } | null>(null);
  const suppressClickRef = useRef(false);
  const selectedImage = images[selectedIndex];
  const selectedAlt = selectedImage?.alt?.[locale] ?? productTitle;
  const selectPrevious = () => setSelectedIndex((index) => (index - 1 + images.length) % images.length);
  const selectNext = () => setSelectedIndex((index) => (index + 1) % images.length);
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    pointersRef.current.clear();
    pinchStartRef.current = null;
    dragStartRef.current = null;
    setPointerActive(false);
  };
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0]?.clientX - touchStartX;
    if (distance <= -40) {
      suppressClickRef.current = true;
      selectNext();
    }
    if (distance >= 40) {
      suppressClickRef.current = true;
      selectPrevious();
    }
    setTouchStartX(null);
    if (Math.abs(distance) >= 40) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 500);
    }
  };
  const handleViewerWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextZoom = clampZoom(zoom + (event.deltaY < 0 ? 0.25 : -0.25));
    setZoom(nextZoom);
    if (nextZoom === 1) setPan({ x: 0, y: 0 });
  };
  const handleViewerPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, point);
    setPointerActive(true);
    if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()];
      pinchStartRef.current = { distance: Math.max(1, distanceBetween(first, second)), zoom };
      dragStartRef.current = null;
    } else if (zoom > 1) {
      dragStartRef.current = { point, pan };
    }
  };
  const handleViewerPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size > 1 && pinchStartRef.current) {
      const [first, second] = [...pointersRef.current.values()];
      const nextZoom = clampZoom(
        pinchStartRef.current.zoom * distanceBetween(first, second) / pinchStartRef.current.distance,
      );
      setZoom(nextZoom);
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
      return;
    }
    if (zoom <= 1 || !dragStartRef.current) return;
    const viewport = viewerRef.current?.getBoundingClientRect();
    if (!viewport) return;
    const maxX = (viewport.width * (zoom - 1)) / 2;
    const maxY = (viewport.height * (zoom - 1)) / 2;
    const nextX = dragStartRef.current.pan.x + event.clientX - dragStartRef.current.point.x;
    const nextY = dragStartRef.current.pan.y + event.clientY - dragStartRef.current.point.y;
    setPan({
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    });
  };
  const handleViewerPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    setPointerActive(pointersRef.current.size > 0);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    if (pointersRef.current.size === 1 && zoom > 1) {
      const [point] = pointersRef.current.values();
      dragStartRef.current = { point, pan };
    } else {
      dragStartRef.current = null;
    }
  };

  useEffect(() => {
    if (!viewerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const opener = openerRef.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setViewerOpen(false);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelectedIndex((index) => (index - 1 + images.length) % images.length);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % images.length);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      opener?.focus();
    };
  }, [viewerOpen, images.length]);

  if (images.length === 0) {
    return (
      <div
        role="img"
        aria-label={productTitle}
        className="flex aspect-[4/5] items-center justify-center bg-[var(--color-surface-soft)] text-[var(--color-muted)]"
      >
        AVERON
      </div>
    );
  }

  return (
    <section aria-label={label} className="space-y-3">
      <div
        role="group"
        aria-label={label}
        tabIndex={0}
        style={{ aspectRatio: photoAspectRatios[selectedImage.url] }}
        className="relative max-h-[min(80svh,900px)] aspect-square overflow-hidden bg-[var(--color-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] sm:aspect-[4/5]"
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            selectPrevious();
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            selectNext();
          }
        }}
      >
        <button
          ref={openerRef}
          type="button"
          aria-label={openImageLabel}
          onClick={() => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              return;
            }
            resetZoom();
            setViewerOpen(true);
          }}
          className="absolute inset-0 z-0 h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
        >
          <ProductImage
            key={selectedImage.url}
            src={selectedImage.url}
            alt={selectedAlt}
            fit="contain"
            zoomOnHover={false}
            onLoad={(width, height) => {
              const ratio = width / height;
              const normalizedRatio = ratio > 1.12 ? "4 / 3" : ratio < 0.9 ? "4 / 5" : "1 / 1";
              setPhotoAspectRatios((current) => current[selectedImage.url] === normalizedRatio
                ? current
                : { ...current, [selectedImage.url]: normalizedRatio });
            }}
          />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={previousLabel}
              onClick={selectPrevious}
              className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:left-4"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={nextLabel}
              onClick={selectNext}
              className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:right-4"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}
        <span className="absolute bottom-2 right-2 z-10 rounded-sm bg-[var(--color-surface)]/95 px-2 py-1 text-[11px] font-medium tabular-nums text-[var(--color-text)] sm:bottom-3 sm:right-3" aria-live="polite">
          {selectedIndex + 1} / {images.length}
        </span>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 sm:gap-3" aria-label={label}>
          {images.map((image, index) => (
            <button
              key={image.id ?? `${image.url}-${index}`}
              type="button"
              aria-label={imageLabels[index] ?? `${label} ${index + 1}`}
              aria-pressed={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
              className={`group relative size-16 shrink-0 overflow-hidden border bg-[var(--color-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:size-20 ${
                index === selectedIndex ? 'border-[var(--color-text)]' : 'border-transparent'
              }`}
            >
              <ProductImage
                src={image.url}
                alt=""
                fit="contain"
                zoomOnHover={false}
              />
            </button>
          ))}
        </div>
      )}
      {viewerOpen && selectedImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-[100] flex flex-col bg-neutral-950 text-white"
          onClick={(event) => {
            if (event.target === event.currentTarget) setViewerOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return;
            const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled)',
            );
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
        >
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-3 sm:p-5">
            <span className="rounded-md bg-black/60 px-3 py-2 text-sm tabular-nums" aria-live="polite">
              {selectedIndex + 1} / {images.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={zoomOutLabel}
                disabled={zoom <= 1}
                onClick={() => {
                  const nextZoom = clampZoom(zoom - 0.5);
                  setZoom(nextZoom);
                  if (nextZoom === 1) setPan({ x: 0, y: 0 });
                }}
                className="flex size-10 items-center justify-center rounded-full bg-black/60 transition hover:bg-black/80 disabled:opacity-40"
              >
                <ZoomOut size={20} aria-hidden="true" />
              </button>
              <span className="min-w-12 text-center text-sm tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                aria-label={zoomInLabel}
                disabled={zoom >= 4}
                onClick={() => setZoom((current) => clampZoom(current + 0.5))}
                className="flex size-10 items-center justify-center rounded-full bg-black/60 transition hover:bg-black/80 disabled:opacity-40"
              >
                <ZoomIn size={20} aria-hidden="true" />
              </button>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label={closeViewerLabel}
                onClick={() => setViewerOpen(false)}
                className="ml-1 flex size-10 items-center justify-center rounded-full bg-black/60 transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div
            ref={viewerRef}
            className={`relative flex min-h-0 flex-1 items-center justify-center overflow-hidden touch-none ${
              zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            }`}
            onWheel={handleViewerWheel}
            onPointerDown={handleViewerPointerDown}
            onPointerMove={handleViewerPointerMove}
            onPointerUp={handleViewerPointerUp}
            onPointerCancel={handleViewerPointerUp}
            onDoubleClick={() => {
              const nextZoom = zoom > 1 ? 1 : 2;
              setZoom(nextZoom);
              if (nextZoom === 1) setPan({ x: 0, y: 0 });
            }}
          >
            <div
              className="h-full w-full"
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transition: pointerActive ? 'none' : 'transform 140ms ease-out',
              }}
            >
              <ProductImage
                key={`viewer-${selectedImage.url}`}
                src={selectedImage.url}
                alt={selectedAlt}
                fit="contain"
                zoomOnHover={false}
              />
            </div>
          </div>
          {images.length > 1 ? (
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-3 p-4 sm:p-6">
              <button
                type="button"
                aria-label={previousLabel}
                onClick={() => {
                  selectPrevious();
                  resetZoom();
                }}
                className="flex size-11 items-center justify-center rounded-full bg-black/60 transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={nextLabel}
                onClick={() => {
                  selectNext();
                  resetZoom();
                }}
                className="flex size-11 items-center justify-center rounded-full bg-black/60 transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
