'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface SearchInputProps {
  locale: string;
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
}

export function SearchInput({ locale, className = '', placeholder = 'Поиск...' }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/catalog?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-4.5 w-4.5 text-stone-400" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        className={`h-12 w-full pl-11 pr-11 ${className}`}
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
          aria-label={locale === 'uz' ? 'Qidiruvni tozalash' : locale === 'en' ? 'Clear search' : 'Очистить поиск'}
          className="averon-control-button averon-icon-button absolute right-0 top-1/2 h-11 -translate-y-1/2 !min-h-0 !border-0 !bg-transparent hover:!bg-[var(--color-surface-soft)]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
