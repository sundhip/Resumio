import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
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
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Scrollable Center Wrapper */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 md:p-6 text-center">
        {/* Modal Card */}
        <div
          className={twMerge(
            clsx(
              'relative w-full max-h-[85vh] sm:max-h-[88vh] my-auto text-left rounded-modal bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-dropdown-dark z-10 flex flex-col overflow-hidden animate-fade-in',
              sizeStyles[size],
              className
            )
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-surface-dark-border shrink-0 bg-white dark:bg-surface-dark-card">
              <div className="space-y-1 pr-6">
                {typeof title === 'string' ? (
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {description && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-control hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">{children}</div>

          {/* Footer Actions */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-100 dark:border-surface-dark-border bg-slate-50/50 dark:bg-surface-dark-bg/40 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
