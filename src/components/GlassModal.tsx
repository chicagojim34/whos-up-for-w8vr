import React, { useEffect } from 'react';
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

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md animate-fade-in transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cx(
          'relative w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl z-10 animate-slide-up border border-white/60 max-h-[90vh] overflow-y-auto',
          maxWidthClass
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-headline font-extrabold text-xl text-text-dark">{title}</h2>
            {subtitle && <p className="text-xs text-text-medium mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-text-dark transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
