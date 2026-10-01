"use client";

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ImagePlus, LoaderCircle, Search, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProductCard, type StoreProduct } from "@/components/commerce/ProductCard";
import { CommerceApiError, searchProductsByImage } from "@/lib/visual-search";
import { useCommerceCapabilities } from "./useCommerceCapabilities";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Props = {
  locale: string;
  country?: string;
  category?: string;
};

export function VisualSearch({ locale, country, category }: Props) {
  const t = useTranslations("catalog");
  const capabilities = useCommerceCapabilities();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<StoreProduct[]>([]);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setItems([]);
    setError("");
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const close = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setOpen(false);
    window.requestAnimationFrame(() => openButtonRef.current?.focus());
  };

  const validateAndSetFile = (candidate?: File) => {
    if (!candidate) return;
    setError("");
    if (!ALLOWED_IMAGE_TYPES.has(candidate.type)) {
      setError(t("visualSearchTypeError"));
      return;
    }
    if (candidate.size > MAX_IMAGE_BYTES) {
      setError(t("visualSearchSizeError"));
      return;
    }
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
    setItems([]);
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    validateAndSetFile(event.dataTransfer.files?.[0]);
  };

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const submit = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setItems([]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await searchProductsByImage(
        file,
        { country, category, limit: 24 },
        (input, init) => fetch(input, { ...init, signal: controller.signal }),
      );
      setItems(result.items);
      if (!result.items.length) setError(t("visualSearchNoResults"));
    } catch (reason) {
      if (controller.signal.aborted) return;
      const code = reason instanceof CommerceApiError ? reason.code : "";
      setError(
        code === "EMBEDDING_NOT_AVAILABLE"
          ? t("visualSearchUnavailable")
          : t("visualSearchError"),
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  };

  if (!capabilities.visualSearch || !capabilities.imageEmbeddings) return null;

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary-700 px-4 py-2 text-sm font-bold text-primary-800 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/40"
      >
        <ImagePlus size={18} aria-hidden="true" />
        {t("visualSearchOpen")}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="visual-search-title"
            aria-busy={loading}
            onKeyDown={onDialogKeyDown}
            className="max-h-[95dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 text-stone-950 shadow-2xl dark:bg-stone-900 dark:text-white sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="visual-search-title" className="text-xl font-extrabold sm:text-2xl">
                  {t("visualSearchTitle")}
                </h2>
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-300">
                  {t("visualSearchHelp")}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label={t("visualSearchClose")}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-stone-200 hover:bg-stone-100 dark:border-white/15 dark:hover:bg-white/10"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileInput}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={onFileInput}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />

            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) setDragging(false);
              }}
              onDrop={onDrop}
              className={`mt-5 grid gap-5 rounded-2xl border-2 border-dashed p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5 ${dragging ? "border-primary-600 bg-primary-50 dark:bg-primary-950/30" : "border-stone-300 dark:border-white/20"}`}
            >
              <div className="flex min-h-44 flex-col items-center justify-center text-center">
                {preview ? (
                  // Native images are required for local blob: previews.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt={t("visualSearchPreviewAlt")}
                    className="max-h-52 max-w-full rounded-xl object-contain"
                  />
                ) : (
                  <>
                    <ImagePlus size={34} className="text-primary-700 dark:text-primary-300" aria-hidden="true" />
                    <p className="mt-3 font-semibold">{t("visualSearchDrop")}</p>
                    <p className="mt-1 text-xs text-stone-500">{t("visualSearchFormats")}</p>
                  </>
                )}
              </div>
              <div className="flex flex-col justify-center gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm font-semibold hover:bg-stone-50 dark:border-white/20 dark:hover:bg-white/5"
                >
                  {file ? t("visualSearchChange") : t("visualSearchGallery")}
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm font-semibold hover:bg-stone-50 dark:border-white/20 dark:hover:bg-white/5"
                >
                  {t("visualSearchCamera")}
                </button>
                {file ? (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    {t("visualSearchRemove")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={submit}
                  disabled={!file || loading}
                  className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-bold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
                      {t("visualSearchLoading")}
                    </>
                  ) : (
                    <>
                      <Search size={17} aria-hidden="true" />
                      {t("visualSearchSubmit")}
                    </>
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
                {error}
              </p>
            ) : null}
            {items.length ? (
              <section className="mt-6" aria-live="polite">
                <h3 className="mb-3 font-bold">{t("visualSearchResults")}</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} locale={locale} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
