'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const INTERACTIVE_TARGETS = 'a[href], button, input, select, textarea, [role="button"]';
const SCROLL_BUTTON_SIZE = 44;
const SCROLL_BUTTON_INSET = 24;

function scrollButtonOverlapsAction() {
  const buttonRect = {
    left: window.innerWidth - SCROLL_BUTTON_INSET - SCROLL_BUTTON_SIZE,
    top: window.innerHeight - SCROLL_BUTTON_INSET - SCROLL_BUTTON_SIZE,
    right: window.innerWidth - SCROLL_BUTTON_INSET,
    bottom: window.innerHeight - SCROLL_BUTTON_INSET,
  };

  return [...document.querySelectorAll<HTMLElement>(INTERACTIVE_TARGETS)].some((target) => {
    if (target.hasAttribute('data-scroll-to-top')) return false;

    const rect = target.getBoundingClientRect();
    const overlapWidth = Math.min(buttonRect.right, rect.right) - Math.max(buttonRect.left, rect.left);
    const overlapHeight = Math.min(buttonRect.bottom, rect.bottom) - Math.max(buttonRect.top, rect.top);
    if (overlapWidth < 8 || overlapHeight < 8) return false;

    const style = window.getComputedStyle(target);
    return style.visibility !== 'hidden'
      && style.pointerEvents !== 'none'
      && (style.opacity === '' || Number(style.opacity) > 0);
  });
}

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const updateVisibility = () => {
      const shouldShow = window.pageYOffset > 300 && !scrollButtonOverlapsAction();
      setIsVisible((current) => current === shouldShow ? current : shouldShow);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateVisibility);
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.documentElement);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver.disconnect();
    };
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
          data-scroll-to-top
          className="flex size-11 items-center justify-center rounded-full border border-[var(--color-scroll-top-border)] bg-[var(--color-scroll-top-bg)] text-[var(--color-scroll-top-fg)] shadow-[var(--shadow-scroll-top)] transition hover:-translate-y-0.5 hover:bg-[var(--color-scroll-top-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
          aria-label="Наверх"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
