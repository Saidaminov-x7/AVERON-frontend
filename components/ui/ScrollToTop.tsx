'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="flex size-11 items-center justify-center rounded-full border border-[var(--color-scroll-top-border)] bg-[var(--color-scroll-top-bg)] text-[var(--color-scroll-top-fg)] shadow-[var(--shadow-scroll-top)] transition hover:-translate-y-0.5 hover:bg-[var(--color-scroll-top-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
          aria-label="Наверх"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
