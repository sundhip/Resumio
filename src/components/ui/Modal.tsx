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
    md: 'max-w-xl',
    lg: 'max-w-[720px]',
    xl: 'max-w-4xl',
    full: 'max-w-[96vw]',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dark semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 dark:bg-black/85 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Wrapper for Centering & Responsive Layout */}
      <div className="relative min-h-screen w-full p-3 sm:p-6 flex items-center justify-center pointer-events-none">
        {/* Modal Card */}
        <div
          className={twMerge(
            clsx(
              'pointer-events-auto relative w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] rounded-xl bg-white dark:bg-[#121624] border border-[#E7E7E2] dark:border-white/8 shadow-2xl z-10 flex flex-col overflow-hidden animate-fade-in text-left my-auto shrink-0',
              sizeStyles[size],
              className
            )
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#EFEFEA] dark:border-white/8/80 shrink-0 bg-white dark:bg-[#121624] sticky top-0 z-10">
              <div className="space-y-1 pr-6">
                {typeof title === 'string' ? (
                  <h3 className="text-lg sm:text-xl font-bold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {description && (
                  <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-[#8A928D] dark:text-[#657378] hover:text-[#5E6460] dark:text-[#9AA7AB] dark:hover:text-[#DCDCD7] dark:text-[#C5D0D3] p-1.5 rounded-lg hover:bg-[#E9E9E5] dark:hover:bg-white/5 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain space-y-4">
            {children}
          </div>

          {/* Footer Actions */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-[#EFEFEA] dark:border-white/8/80 bg-[#F4F4F1]/70 dark:bg-[#0d101a]/80 shrink-0 sticky bottom-0 z-10">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
