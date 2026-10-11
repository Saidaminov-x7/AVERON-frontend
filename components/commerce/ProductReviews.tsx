'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, ImagePlus, Star, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import api from '@/lib/axios';
import { trackCommerceEvent } from '@/lib/commerceAnalytics';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

type Locale = 'ru' | 'uz' | 'en';
type Fit = 'RUNS_SMALL' | 'TRUE_TO_SIZE' | 'RUNS_LARGE';
type Purchase = {
  orderItemId: string;
  orderNumber: string;
  reviewId: string | null;
  reviewStatus: 'PENDING' | 'PUBLISHED' | 'REJECTED' | null;
  purchasedVariant: { size?: string; color?: string } | null;
};
type Review = {
  id?: string;
  status?: 'PENDING' | 'PUBLISHED' | 'REJECTED';
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  fitFeedback: Fit | null;
  createdAt: string;
  author: { name: string; avatar: string | null };
  purchasedVariant: { size?: string; color?: string } | null;
  media: Array<{ url: string; mimeType: string }>;
};
type ReviewPage = {
  summary: {
    averageRating: number | null;
    reviewCount: number;
    distribution: Record<string, number>;
    fitDistribution: Record<string, number>;
  };
  items: Review[];
  pagination: { page: number; pages: number };
};
type OwnReview = Review & { id: string; status: 'PENDING' | 'PUBLISHED' | 'REJECTED' };

const fitValues: Fit[] = ['RUNS_SMALL', 'TRUE_TO_SIZE', 'RUNS_LARGE'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isReview(value: unknown): value is Review {
  if (!isRecord(value) || !isRecord(value.author) || !Array.isArray(value.media)) return false;
  if (
    typeof value.rating !== 'number' || !Number.isFinite(value.rating) || value.rating < 1 || value.rating > 5
    || (value.title !== null && typeof value.title !== 'string')
    || typeof value.comment !== 'string'
    || typeof value.verifiedPurchase !== 'boolean'
    || (value.fitFeedback !== null && !fitValues.includes(value.fitFeedback as Fit))
    || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.author.name !== 'string'
    || (value.author.avatar !== null && typeof value.author.avatar !== 'string')
  ) return false;

  if (value.id !== undefined && typeof value.id !== 'string') return false;
  if (value.status !== undefined && !['PENDING', 'PUBLISHED', 'REJECTED'].includes(String(value.status))) return false;
  if (value.purchasedVariant !== null) {
    if (!isRecord(value.purchasedVariant)) return false;
    if (value.purchasedVariant.size !== undefined && typeof value.purchasedVariant.size !== 'string') return false;
    if (value.purchasedVariant.color !== undefined && typeof value.purchasedVariant.color !== 'string') return false;
  }
  return value.media.every((media) => isRecord(media) && typeof media.url === 'string' && typeof media.mimeType === 'string');
}

function parseReviewPage(value: unknown): ReviewPage {
  if (!isRecord(value) || !isRecord(value.summary) || !isRecord(value.pagination) || !Array.isArray(value.items)) {
    throw new Error('Invalid product reviews response');
  }

  const { summary, pagination, items } = value;
  const validDistribution = (distribution: unknown) => isRecord(distribution)
    && Object.values(distribution).every((count) => typeof count === 'number' && Number.isFinite(count) && count >= 0);
  if (
    (summary.averageRating !== null && (typeof summary.averageRating !== 'number' || !Number.isFinite(summary.averageRating)))
    || !isNonNegativeCount(summary.reviewCount)
    || !validDistribution(summary.distribution)
    || !validDistribution(summary.fitDistribution)
    || !isNonNegativeCount(pagination.page) || pagination.page < 1
    || !isNonNegativeCount(pagination.pages)
    || !items.every(isReview)
  ) throw new Error('Invalid product reviews response');

  return value as unknown as ReviewPage;
}

function safeAuthorName(name: string, anonymous: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return anonymous;
  return parts.length > 1 ? `${parts[0]} ${Array.from(parts[parts.length - 1])[0]}.` : parts[0];
}

function controlledError(error: unknown, t: ReturnType<typeof useTranslations>) {
  const code = error && typeof error === 'object' && 'response' in error
    ? (error as { response?: { data?: { code?: unknown } } }).response?.data?.code
    : null;
  if (typeof code === 'string' && t.has(`errors.${code}`)) return t(`errors.${code}`);
  return t('errors.generic');
}

export function ProductReviews({ slug, routeId = slug, locale, initialOrderNumber }: {
  slug: string;
  routeId?: string;
  locale: string;
  initialOrderNumber?: string;
}) {
  const t = useTranslations('productReviews');
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [page, setPage] = useState(1);
  const [purchaseId, setPurchaseId] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [fit, setFit] = useState<Fit | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState('');
  const normalizedLocale: Locale = locale === 'uz' || locale === 'en' ? locale : 'ru';
  const ratingLocale = normalizedLocale === 'en' ? 'en-US' : normalizedLocale === 'uz' ? 'uz-UZ' : 'ru-RU';

  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', slug, page],
    queryFn: async () => parseReviewPage((await api.get<unknown>(`/api/v1/products/${encodeURIComponent(slug)}/reviews`, { params: { page, limit: 10 } })).data),
  });
  const eligibilityQuery = useQuery({
    queryKey: ['product-review-eligibility', slug],
    enabled: isAuthenticated,
    queryFn: async () => (await api.get<Purchase[]>(`/api/v1/products/${encodeURIComponent(slug)}/reviews/eligibility`)).data,
  });
  const purchases = eligibilityQuery.data ?? [];
  const selectedPurchase = purchases.find((item) => item.orderItemId === purchaseId) ?? purchases.find((item) => item.orderNumber === initialOrderNumber && !item.reviewId) ?? purchases.find((item) => !item.reviewId);
  const ownReviewIds = useMemo(
    () => [...new Set((eligibilityQuery.data ?? []).flatMap((purchase) => purchase.reviewId ? [purchase.reviewId] : []))],
    [eligibilityQuery.data],
  );
  const ownReviewQueries = useQuery({
    queryKey: ['product-own-reviews', slug, ownReviewIds],
    enabled: isAuthenticated && ownReviewIds.length > 0,
    queryFn: async () => Promise.all(ownReviewIds.map(async (id) =>
      (await api.get<OwnReview>(`/api/v1/reviews/me/${encodeURIComponent(id)}`)).data,
    )),
  });
  const ownReviews = ownReviewQueries.data ?? [];
  const ownReview = activeReviewId
    ? ownReviews.find((review) => review.id === activeReviewId)
    : selectedPurchase?.reviewId
      ? ownReviews.find((review) => review.id === selectedPurchase.reviewId)
      : undefined;

  const refreshReviews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['product-reviews', slug] }),
      queryClient.invalidateQueries({ queryKey: ['product-review-eligibility', slug] }),
      queryClient.invalidateQueries({ queryKey: ['product-own-reviews', slug] }),
    ]);
  };

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!rating || comment.trim().length < 3) throw new Error('INVALID_REVIEW_INPUT');
      const mediaIds: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        const { data } = await api.post<{ id: string }>('/api/v1/media/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mediaIds.push(data.id);
      }
      const payload = {
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
        fitFeedback: fit || null,
        ...(files.length ? { mediaIds } : {}),
      };
      if (ownReview) {
        await api.patch(`/api/v1/reviews/me/${encodeURIComponent(ownReview.id)}`, payload);
      } else if (selectedPurchase) {
        await api.post(`/api/v1/products/${encodeURIComponent(slug)}/reviews`, {
          ...payload,
          orderItemId: selectedPurchase.orderItemId,
          orderNumber: selectedPurchase.orderNumber,
        });
      } else {
        throw new Error('PURCHASE_NOT_FOUND');
      }
    },
    onSuccess: async () => {
      trackCommerceEvent({ eventName: 'review_submit' });
      setFormError('');
      setFormNotice(t('form.success'));
      setActiveReviewId(null);
      setPurchaseId('');
      setFiles([]);
      await refreshReviews();
    },
    onError: (error) => {
      setFormNotice('');
      setFormError(controlledError(error, t));
    },
  });
  const deleteReview = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/reviews/me/${encodeURIComponent(id)}`),
    onSuccess: async () => {
      setFormNotice(t('form.deleted'));
      setActiveReviewId(null);
      setPurchaseId('');
      await refreshReviews();
    },
    onError: (error) => setFormError(controlledError(error, t)),
  });

  const startReview = (purchase?: Purchase, existing?: OwnReview) => {
    setPurchaseId(purchase?.orderItemId ?? '');
    setActiveReviewId(existing?.id ?? null);
    setRating(existing?.rating ?? 0);
    setTitle(existing?.title ?? '');
    setComment(existing?.comment ?? '');
    setFit(existing?.fitFeedback ?? '');
    setFiles([]);
    setFormError('');
    setFormNotice('');
  };

  const onFilesSelected = (selection: FileList | null) => {
    if (!selection) return;
    const next = Array.from(selection);
    if (files.length + next.length > 5) {
      setFormError(t('form.imageLimit'));
      return;
    }
    if (next.some((file) => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      setFormError(t('form.invalidImage'));
      return;
    }
    setFiles((current) => [...current, ...next]);
    setFormError('');
  };

  const reviewStatusLabel = (status: OwnReview['status']) => t(`status.${status}`);
  const formatDate = (value: string) => new Date(value).toLocaleDateString(ratingLocale, { year: 'numeric', month: 'long', day: 'numeric' });
  const summary = reviewsQuery.data?.summary;

  return (
    <section id="reviews" className="mt-12 scroll-mt-24" aria-labelledby="product-reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-4 dark:border-white/10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary-700 dark:text-primary-300">{t('eyebrow')}</p>
          <h2 id="product-reviews-title" className="mt-1 text-2xl font-extrabold">{t('title')}</h2>
        </div>
        <div className="flex items-center gap-2" aria-label={t('summary.label', { average: summary?.averageRating ?? '—', count: summary?.reviewCount ?? 0 })}>
          <Star className="fill-cyan-500 text-cyan-600" size={22} aria-hidden="true" />
          <span className="text-xl font-extrabold">{summary?.averageRating ?? '—'}</span>
          <span className="text-sm text-[var(--color-text-secondary)]">{t('summary.count', { count: summary?.reviewCount ?? 0 })}</span>
        </div>
      </div>

      {reviewsQuery.isLoading ? <p role="status" className="py-6 text-sm text-[var(--color-text-secondary)]">{t('loading')}</p>
        : reviewsQuery.isError ? <p role="alert" className="py-6 text-sm text-[var(--color-error)]">{t('errors.generic')}</p>
          : summary && (
            <div className="grid gap-5 border-b border-stone-200 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] dark:border-white/10">
              <div>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = summary.distribution[String(stars)] ?? 0;
                  const width = summary.reviewCount ? `${count / summary.reviewCount * 100}%` : '0%';
                  return <div key={stars} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 py-1 text-xs">
                    <span>{stars} <span aria-hidden="true">★</span></span>
                    <span className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"><span className="block h-full rounded-full bg-cyan-600" style={{ width }} /></span>
                    <span className="text-right text-[var(--color-text-secondary)]">{count}</span>
                  </div>;
                })}
              </div>
              <div className="flex flex-wrap content-center gap-2">
                {fitValues.map((value) => summary.fitDistribution[value] > 0 && (
                  <span key={value} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs dark:border-white/15">
                    {t(`fit.${value}`)} · {summary.fitDistribution[value]}%
                  </span>
                ))}
              </div>
            </div>
          )}

      {formNotice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">{formNotice}</p>}
      {isAuthenticated && eligibilityQuery.isError && <p role="alert" className="mt-4 text-sm text-[var(--color-error)]">{t('errors.generic')}</p>}
      {isAuthenticated && purchases.length > 0 && (
        <div className="mt-5 space-y-3">
          {purchases.map((purchase) => {
            const relatedReview = ownReviews.find((review) => review.id === purchase.reviewId);
            return <div key={purchase.orderItemId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-white/10 dark:bg-stone-900">
              <div className="text-sm">
                <p className="font-semibold">{purchase.purchasedVariant?.size ? `${t('purchasedSize')}: ${purchase.purchasedVariant.size}` : t('purchaseOrder', { number: purchase.orderNumber })}</p>
                {purchase.reviewStatus && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t('yourReview')}: {reviewStatusLabel(purchase.reviewStatus)}</p>}
              </div>
              <button type="button" onClick={() => startReview(purchase, relatedReview)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-700 px-4 text-sm font-bold text-white hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                {purchase.reviewId ? t('editReview') : t('leaveReview')}
              </button>
            </div>;
          })}
        </div>
      )}

      {isAuthenticated && purchases.length === 0 && !eligibilityQuery.isLoading && (
        <p className="mt-5 text-sm text-[var(--color-text-secondary)]">{t('eligibility')}</p>
      )}
      {!isAuthenticated && <div className="mt-5 flex flex-wrap items-center gap-3">
        <p className="text-sm text-[var(--color-text-secondary)]">{t('signIn')}</p>
        <Link href={`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/catalog/${routeId}#reviews`)}`} className="inline-flex min-h-10 items-center rounded-lg border border-stone-300 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 dark:border-white/20">{t('signInAction')}</Link>
      </div>}

      {activeReviewId !== null || (activeReviewId === null && purchaseId) ? (
        <form className="mt-5 space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 dark:border-white/10 dark:bg-stone-900" onSubmit={(event) => { event.preventDefault(); submitReview.mutate(); }}>
          <h3 className="text-lg font-bold">{ownReview ? t('editReview') : t('leaveReview')}</h3>
          {!ownReview && purchases.filter((purchase) => !purchase.reviewId).length > 1 && (
            <div className="block text-sm font-semibold">
              <span>{t('purchase')}</span>
              <Select value={selectedPurchase?.orderItemId ?? ''} onValueChange={setPurchaseId}>
                <SelectTrigger aria-label={t('purchase')} className="mt-1 min-h-11 rounded-lg">
                  <SelectValue placeholder={t('purchase')} />
                </SelectTrigger>
                <SelectContent>
                  {purchases.filter((purchase) => !purchase.reviewId).map((purchase) => (
                    <SelectItem key={purchase.orderItemId} value={purchase.orderItemId}>
                      {t('purchaseOrder', { number: purchase.orderNumber })}{purchase.purchasedVariant?.size ? ` · ${purchase.purchasedVariant.size}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t('form.rating')}</legend>
            <div role="radiogroup" aria-label={t('form.rating')} className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => <label key={value} className="cursor-pointer rounded focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-600">
                <input className="peer sr-only" type="radio" name="product-review-rating" value={value} checked={rating === value} onChange={() => setRating(value)} required aria-label={t('form.ratingOption', { value })} />
                <span className={`inline-flex min-h-11 min-w-10 items-center justify-center text-2xl ${rating >= value ? 'text-cyan-600' : 'text-stone-300 dark:text-stone-600'}`} aria-hidden="true">★</span>
              </label>)}
              <span className="ml-2 text-sm font-semibold" aria-live="polite">{rating ? `${rating}/5` : t('form.notRated')}</span>
            </div>
          </fieldset>
          <label className="block text-sm font-semibold">{t('form.title')}
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-transparent px-3 font-normal dark:border-white/20" />
          </label>
          <label className="block text-sm font-semibold">{t('form.comment')}
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} required minLength={3} maxLength={3000} rows={5} className="mt-1 w-full rounded-lg border border-stone-300 bg-transparent p-3 font-normal dark:border-white/20" />
            <span className="mt-1 block text-right text-xs font-normal text-[var(--color-text-secondary)]">{comment.length}/3000</span>
          </label>
          <div className="block text-sm font-semibold">
            <span>{t('form.fit')}</span>
            <Select value={fit} onValueChange={(value) => setFit(value as Fit | '')}>
              <SelectTrigger aria-label={t('form.fit')} className="mt-1 min-h-11 rounded-lg font-normal">
                <SelectValue placeholder={t('form.optional')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('form.optional')}</SelectItem>
                {fitValues.map((value) => <SelectItem key={value} value={value}>{t(`fit.${value}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-cyan-600 dark:border-white/20">
              <ImagePlus size={18} aria-hidden="true" />{t('form.addImages')}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(event) => { onFilesSelected(event.target.files); event.currentTarget.value = ''; }} />
            </label>
            <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-2">
              <span className="truncate">{file.name}</span>
              <button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded p-1 text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" aria-label={t('form.removeImage', { name: file.name })}><Trash2 size={16} /></button>
            </li>)}</ul>
          </div>
          {formError && <p role="alert" className="text-sm font-medium text-[var(--color-error)]">{formError}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submitReview.isPending || !rating || comment.trim().length < 3 || (!ownReview && !selectedPurchase)} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-700 px-5 text-sm font-bold text-white hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">
              {submitReview.isPending ? t('form.submitting') : t('form.submit')}
            </button>
            {ownReview && <button type="button" disabled={deleteReview.isPending} onClick={() => deleteReview.mutate(ownReview.id)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"><Trash2 size={16} />{t('form.delete')}</button>}
            <button type="button" onClick={() => { setPurchaseId(''); setActiveReviewId(null); }} className="min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 dark:border-white/20">{t('form.close')}</button>
          </div>
          {ownReview?.status === 'PUBLISHED' && <p className="text-xs text-[var(--color-text-secondary)]">{t('form.reModeration')}</p>}
        </form>
      ) : null}

      <div className="mt-6 divide-y divide-stone-200 dark:divide-white/10">
        {reviewsQuery.data?.items.map((review) => (
          <article key={`${review.createdAt}-${review.rating}-${review.comment.slice(0, 12)}`} className="py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {review.author.avatar && <Image src={review.author.avatar} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" />}
                <div>
                  <h3 className="font-bold">{safeAuthorName(review.author.name, t('anonymous'))}</h3>
                  <time className="text-xs text-[var(--color-text-secondary)]" dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                </div>
              </div>
              <div className="flex items-center gap-2" aria-label={t('reviewRating', { value: review.rating })}>
                <span className="text-amber-600" aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                <span className="text-sm font-semibold">{review.rating}/5</span>
                {review.verifiedPurchase && <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-100"><BadgeCheck size={14} aria-hidden="true" />{t('verified')}</span>}
              </div>
            </div>
            {review.title && <h4 className="mt-3 font-bold">{review.title}</h4>}
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700 dark:text-stone-200">{review.comment}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {review.fitFeedback && <span className="rounded-full border border-stone-200 px-3 py-1 dark:border-white/15">{t('fitLabel')}: {t(`fit.${review.fitFeedback}`)}</span>}
              {review.purchasedVariant?.size && <span className="rounded-full border border-stone-200 px-3 py-1 dark:border-white/15">{t('purchasedSize')}: {review.purchasedVariant.size}</span>}
            </div>
            {review.media.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{review.media.map((media, index) => <li key={`${media.url}-${index}`}><Image src={media.url} alt={t('reviewImageAlt', { index: index + 1 })} width={160} height={160} unoptimized className="h-24 w-24 rounded-lg border border-stone-200 object-cover sm:h-32 sm:w-32 dark:border-white/10" /></li>)}</ul>}
          </article>
        ))}
        {!reviewsQuery.isLoading && !reviewsQuery.isError && reviewsQuery.data?.items.length === 0 && <p className="py-6 text-sm text-[var(--color-text-secondary)]">{t('empty')}</p>}
      </div>
      {(reviewsQuery.data?.pagination.pages ?? 0) > 1 && <nav className="mt-5 flex items-center justify-center gap-3" aria-label={t('pagination.label')}>
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-semibold disabled:opacity-40 dark:border-white/20">{t('pagination.previous')}</button>
        <span className="text-sm">{t('pagination.page', { current: page, total: reviewsQuery.data?.pagination.pages ?? 1 })}</span>
        <button type="button" disabled={page >= (reviewsQuery.data?.pagination.pages ?? 1)} onClick={() => setPage((current) => current + 1)} className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-semibold disabled:opacity-40 dark:border-white/20">{t('pagination.next')}</button>
      </nav>}
    </section>
  );
}
