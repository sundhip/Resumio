import React, { useState, useRef, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { IconButton } from './IconButton';

// ==========================================
// 1. Tooltip
// ==========================================

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none px-2.5 py-1 text-xs font-medium text-white bg-[#111312] dark:bg-[#111719] border border-white/10 rounded-[8px] shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 ${posClasses} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. Popover
// ==========================================

export interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  title?: string;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({ trigger, content, title, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-72 p-4 rounded-[18px] bg-white dark:bg-[#111719] border border-[#E7E7E2] dark:border-white/10 shadow-[0_12px_32px_rgba(17,19,18,0.12)]">
          {title && (
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB] mb-2 border-b border-[#E7E7E2] dark:border-white/10 pb-1.5">
              {title}
            </div>
          )}
          <div className="text-sm text-[#111312] dark:text-[#F2F6F7]">{content}</div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. Toast
// ==========================================

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = 'info',
  onClose,
  className = '',
}) => {
  const BORDER_COLORS = {
    info: 'border-l-[#5FD3E8]',
    success: 'border-l-[#4ADE80]',
    warning: 'border-l-[#F5B544]',
    danger: 'border-l-[#F2677A]',
  }[variant];

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 p-4 rounded-[14px] bg-white dark:bg-[#111719] border border-[#E7E7E2] dark:border-white/10 border-l-4 ${BORDER_COLORS} shadow-[0_8px_24px_rgba(17,19,18,0.08)] max-w-sm ${className}`}
    >
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[#111312] dark:text-[#F2F6F7]">{title}</h4>
        {description && (
          <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">{description}</p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-[#8C928E] hover:text-[#111312] dark:text-[#5F6C70] dark:hover:text-[#F2F6F7] cursor-pointer"
          aria-label="Dismiss toast"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ==========================================
// 4. Dialog (Modal)
// ==========================================

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`relative w-full ${sizeClasses} rounded-[24px] bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.25)] p-6 z-10`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 id="dialog-title" className="text-lg font-bold text-[#111312] dark:text-[#F2F6F7]">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C928E] hover:text-[#111312] dark:text-[#5F6C70] dark:hover:text-[#F2F6F7] cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="py-2 text-sm text-[#111312] dark:text-[#F2F6F7]">{children}</div>

        {footer && <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[#E7E7E2] dark:border-white/10">{footer}</div>}
      </div>
    </div>
  );
};

// ==========================================
// 5. Drawer (Slide-out panel)
// ==========================================

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string; // default max-w-md
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'max-w-md',
}) => {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} h-full bg-white dark:bg-[#0C1113] border-l border-[#E7E7E2] dark:border-white/10 shadow-2xl p-6 flex flex-col z-10`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E7E2] dark:border-white/10">
          <h3 className="text-lg font-bold text-[#111312] dark:text-[#F2F6F7]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C928E] hover:text-[#111312] dark:text-[#5F6C70] dark:hover:text-[#F2F6F7] cursor-pointer"
            aria-label="Close drawer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 text-sm text-[#111312] dark:text-[#F2F6F7]">
          {children}
        </div>
      </div>
    </div>
  );
};
