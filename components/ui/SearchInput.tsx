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
        <Search className="h-4.5 w-4.5 text-ink-soft" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        // Установлена сбалансированная высота h-12 и удобный отступ слева pl-12
        className={`w-full h-12 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-12 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-shadow duration-200 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${isMobile ? 'pr-10' : ''}`}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-muted dark:text-ink-soft"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
