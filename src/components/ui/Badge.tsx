import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ApplicationStatus } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: ApplicationStatus;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'primary' | 'secondary' | 'default';
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  status,
  variant = 'neutral',
  size = 'sm',
  showDot = false,
  ...props
}) => {
  // Determine variant from status if status is provided
  type BaseVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  let effectiveVariant: BaseVariant = 'neutral';
  if (variant === 'primary') effectiveVariant = 'brand';
  else if (variant === 'secondary') effectiveVariant = 'purple';
  else if (variant === 'default') effectiveVariant = 'neutral';
  else if (variant) effectiveVariant = variant as BaseVariant;

  let statusText = children;

  if (status) {
    statusText = status;
    switch (status) {
      case 'Shortlisted':
        effectiveVariant = 'purple';
        break;
      case 'Interview':
        effectiveVariant = 'info';
        break;
      case 'Selected':
        effectiveVariant = 'success';
        break;
      case 'Screening':
      case 'Under Review':
        effectiveVariant = 'warning';
        break;
      case 'Applied':
        effectiveVariant = 'neutral';
        break;
      case 'Rejected':
        effectiveVariant = 'danger';
        break;
      case 'Withdrawn':
        effectiveVariant = 'neutral';
        break;
    }
  }

  const baseStyles =
    'inline-flex items-center font-medium rounded-full transition-colors select-none';

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 leading-4',
    md: 'text-xs px-3 py-1 gap-2 leading-4',
  };

  const variantStyles = {
    neutral:
      'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60',
    purple:
      'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60',
    brand:
      'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20',
    success:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    warning:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
    danger:
      'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
    info: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
  };

  const dotStyles = {
    neutral: 'bg-slate-400 dark:bg-slate-500',
    purple: 'bg-brand-500',
    brand: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-indigo-500',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[effectiveVariant], className))}
      {...props}
    >
      {showDot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotStyles[effectiveVariant])} />
      )}
      {statusText}
    </span>
  );
};
