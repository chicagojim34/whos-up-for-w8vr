import React, { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import cx from 'classnames';

import { ToastContext, type Toast, type ToastTone } from './toast-context';

const ICONS = { success: CheckCircle2, info: Info, warning: AlertTriangle };
const TONE_CLASS = {
  success: 'bg-secondary-container text-on-secondary-container',
  info: 'bg-text-dark text-white',
  warning: 'bg-error-container text-error',
};

let nextId = 1;

/**
 * Replaces window.alert() for "that worked" feedback. Announced politely so a
 * screen reader hears the confirmation without losing the user's place.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId++;
      setToasts(prev => [...prev, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed left-1/2 -translate-x-1/2 bottom-28 z-200 flex flex-col items-center gap-2 pointer-events-none w-[min(92vw,26rem)]"
        role="status"
        aria-live="polite"
      >
        {toasts.map(toast => {
          const Icon = ICONS[toast.tone];
          return (
            <div
              key={toast.id}
              className={cx(
                'pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl animate-slide-up',
                TONE_CLASS[toast.tone]
              )}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold flex-1">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
