'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  closeLabel: string;
  children: React.ReactNode;
  id?: string;
  maxWidth?: string;
  fullscreenOnMobile?: boolean;
  hideHeader?: boolean;
  rootClassName?: string;
  overlayClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  ariaBusy?: boolean;
  zIndexClassName?: string;
  onContentClick?: React.MouseEventHandler<HTMLDivElement>;
  animateExit?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  closeLabel,
  children,
  id,
  maxWidth = 'max-w-md',
  fullscreenOnMobile = false,
  hideHeader = false,
  rootClassName = '',
  overlayClassName = '',
  panelClassName = '',
  contentClassName = '',
  ariaBusy,
  zIndexClassName = 'z-[60]',
  onContentClick,
  animateExit = true,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const generatedId = useId();
  const dialogId = id ?? generatedId;
  const titleId = `${dialogId}-title`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'a[href]:not([tabindex="-1"]), button:not(:disabled):not([tabindex="-1"]), input:not(:disabled):not([type="hidden"]):not([tabindex="-1"]), select:not(:disabled):not([tabindex="-1"]), textarea:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
      );
      (firstFocusable ?? dialogRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href]:not([tabindex="-1"]), button:not(:disabled):not([tabindex="-1"]), input:not(:disabled):not([type="hidden"]):not([tabindex="-1"]), select:not(:disabled):not([tabindex="-1"]), textarea:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
    ));
    if (!focusable.length) {
      event.preventDefault();
      dialogRef.current.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  };

  const panelSize = fullscreenOnMobile
    ? `h-dvh max-h-dvh rounded-none sm:h-auto sm:max-h-[90vh] sm:rounded-theme ${maxWidth}`
    : `max-h-[90vh] rounded-theme ${maxWidth}`;
  const defaultContentSpacing = fullscreenOnMobile
    ? 'px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:p-5'
    : 'p-4 sm:p-6';
  const defaultRootSpacing = fullscreenOnMobile ? 'p-0 sm:p-4' : 'p-4';

  const modalContent = isOpen && (
        <div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center ${rootClassName ? '' : defaultRootSpacing} ${rootClassName}`}>
          <motion.div
            className={`fixed inset-0 bg-black/60 ${overlayClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-busy={ariaBusy}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={`relative z-10 flex min-h-0 w-full flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-xl outline-none ${panelSize} ${panelClassName}`}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 8, transition: { duration: prefersReducedMotion ? 0 : 0.18 } }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            {hideHeader ? <h2 id={titleId} className="sr-only">{title}</h2> : (
              <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5">
                <h2 id={titleId} className="min-w-0 text-lg font-semibold">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
            )}
            <div onClick={onContentClick} className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${contentClassName ? '' : defaultContentSpacing} ${contentClassName}`}>
              {children}
            </div>
          </motion.div>
        </div>
  );

  return animateExit ? <AnimatePresence>{modalContent}</AnimatePresence> : modalContent;
};
