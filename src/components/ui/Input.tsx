import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle2, Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isSuccess?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, isSuccess, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-slate-700 dark:text-slate-300 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full h-11 px-3.5 text-sm rounded-control transition-all duration-150',
                'bg-white dark:bg-surface-dark-input text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
                'border border-slate-200 dark:border-surface-dark-border shadow-subtle',
                'focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                leftIcon && 'pl-10',
                (rightIcon || error || isSuccess) && 'pr-10',
                error && 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 dark:text-rose-200',
                isSuccess && 'border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20',
                className
              )
            )}
            {...props}
          />
          <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-none">
            {error && <AlertCircle className="w-4 h-4 text-rose-500" />}
            {isSuccess && !error && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {!error && !isSuccess && rightIcon && (
              <span className="text-slate-400 dark:text-slate-500">{rightIcon}</span>
            )}
          </div>
        </div>
        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcut?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className,
  value,
  onChange,
  onClear,
  shortcut = '⌘ K',
  placeholder = 'Search jobs, companies, or candidates...',
  ...props
}) => {
  return (
    <div className="relative flex items-center w-full">
      <Search className="w-4 h-4 absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={twMerge(
          clsx(
            'w-full h-10 pl-10 pr-16 text-xs sm:text-sm rounded-control transition-all duration-150',
            'bg-slate-50/80 dark:bg-surface-dark-input hover:bg-white dark:hover:bg-surface-dark-card',
            'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'border border-slate-200 dark:border-surface-dark-border',
            'focus:outline-none focus:bg-white dark:focus:bg-surface-dark-input focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            className
          )
        )}
        {...props}
      />
      <div className="absolute right-3 flex items-center gap-1">
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          shortcut && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-surface-dark-border/60 rounded border border-slate-200 dark:border-slate-700/60 shadow-xs">
              {shortcut}
            </kbd>
          )
        )}
      </div>
    </div>
  );
};
