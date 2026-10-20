'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DynamicSectionRenderer, type DynamicSectionData } from '@/components/DynamicSectionRenderer';
import { externalBaseURL } from '@/lib/axios';

interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  locale: string;
  isPublished: boolean;
  isUnderMaintenance: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
  } | null;
}

const API_BASE_URL = externalBaseURL;

export default function DynamicPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const locale = (params?.locale as string) || 'ru';

  const [page, setPage] = useState<PageData | null>(null);
  const [sections, setSections] = useState<DynamicSectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestedSlug, setRequestedSlug] = useState(slug);

  if (requestedSlug !== slug) {
    setRequestedSlug(slug);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    Promise.all([
      fetch(`${API_BASE_URL}/pages/${slug}`).then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Страница не найдена');
          throw new Error('Не удалось загрузить страницу');
        }
        return res.json();
      }),
      fetch(`${API_BASE_URL}/page-sections/public?pageKey=${encodeURIComponent(slug)}`)
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
    ])
      .then(([pageData, sectionsData]) => {
        if (isMounted) {
          setPage(pageData);
          setSections(sectionsData || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Ошибка загрузки');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-soft text-ink-soft">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Загрузка страницы...</span>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-soft text-ink-soft px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-soft text-error mx-auto flex items-center justify-center border border-line">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold">404 — Страница не найдена</h1>
          <p className="text-ink-soft text-sm">
            {error || 'Запрашиваемая страница не существует или была снята с публикации.'}
          </p>
          <div>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} /> На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (page.isUnderMaintenance) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-warning" />
        <h1 className="text-2xl font-bold text-ink dark:text-white">Страница временно недоступна</h1>
        <p className="mt-3 text-sm text-muted dark:text-ink-soft">Мы обновляем этот раздел. Попробуйте зайти немного позже.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink-soft py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-primary-400 transition-colors"
        >
          <ArrowLeft size={16} /> Назад на сайт
        </Link>

        <header className="border-b border-line pb-6 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {page.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-soft">
            {page.author?.name && (
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-primary-500" />
                {page.author.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-muted" />
              {new Date(page.updatedAt).toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        {sections.length > 0 ? (
          <DynamicSectionRenderer sections={sections} locale={locale} />
        ) : (
          <article className="prose prose-invert prose-stone max-w-none text-ink-soft leading-relaxed space-y-4">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}
