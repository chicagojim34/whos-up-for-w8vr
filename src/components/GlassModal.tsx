import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import cx from 'classnames';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A real dialog: portalled to the body so no ancestor's overflow or stacking
 * context can trap it, labelled for screen readers, focus-trapped while open,
 * and returning focus to whatever opened it.
 */
export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      el => el.offsetParent !== null || el === document.activeElement
    );
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      trapFocus(e);
    };
    window.addEventListener('keydown', onKeyDown, true);

    // Move focus into the dialog on the next frame, once it has painted.
    const raf = requestAnimationFrame(() => {
      const target =
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current ?? null;
      target?.focus();
    });

    const opener = openerRef.current;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [isOpen, onClose, trapFocus]);

  if (!isOpen) return null;

  const maxWidthClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' }[maxWidth];

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-text-dark/50 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        className={cx(
          'relative w-full bg-surface-lowest rounded-3xl p-6 shadow-2xl z-10 animate-slide-up max-h-[90vh] overflow-y-auto outline-none',
          maxWidthClass
        )}
      >
        <div className="flex justify-between items-start gap-4 mb-5">
          <div>
            <h2 id={titleId} className="font-headline font-extrabold text-xl text-text-dark">
              {title}
            </h2>
            {subtitle && (
              <p id={subtitleId} className="text-xs text-text-medium mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 shrink-0 rounded-full bg-surface-high hover:bg-surface-highest flex items-center justify-center text-text-dark transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
};
