import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  rightBadge?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items?: DropdownItem[];
  children?: React.ReactNode;
  align?: 'left' | 'right';
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  menuClassName?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  children,
  align = 'right',
  width = 'md',
  className,
  menuClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const widthStyles = {
    auto: 'min-w-[180px]',
    sm: 'w-48',
    md: 'w-60',
    lg: 'w-72',
    full: 'w-full',
  };

  return (
    <div className={twMerge(clsx('relative inline-block text-left', className))} ref={containerRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={twMerge(
            clsx(
              'absolute z-50 mt-1.5 rounded-card p-1.5',
              'bg-white dark:bg-surface-dark-card',
              'border border-slate-200 dark:border-surface-dark-border',
              'shadow-dropdown dark:shadow-dropdown-dark',
              'animate-fade-in focus:outline-none',
              align === 'right' ? 'right-0' : 'left-0',
              widthStyles[width],
              menuClassName
            )
          )}
        >
          {children ? (
            <div onClick={() => setIsOpen(false)}>{children}</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {items?.map((item, index) => {
                if (item.divider) {
                  return (
                    <div
                      key={`div-${index}`}
                      className="my-1 border-t border-slate-100 dark:border-surface-dark-border"
                    />
                  );
                }

                return (
                  <button
                    key={item.id || index}
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick?.();
                        setIsOpen(false);
                      }
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 rounded-control text-xs sm:text-sm font-medium transition-colors text-left select-none',
                      item.disabled
                        ? 'opacity-50 cursor-not-allowed text-slate-400'
                        : item.destructive
                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : item.active
                        ? 'bg-brand-50/80 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-dark-hover'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.icon && <span className="shrink-0 text-current">{item.icon}</span>}
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.rightBadge && <span className="shrink-0 ml-2">{item.rightBadge}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
