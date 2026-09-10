import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const baseStyles =
    'rounded-card border transition-all duration-200';

  const variantStyles = {
    default:
      'bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border text-slate-900 dark:text-slate-100 shadow-card dark:shadow-card-dark',
    elevated:
      'bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border/80 text-slate-900 dark:text-slate-100 shadow-dropdown dark:shadow-dropdown-dark',
    glass:
      'bg-white/80 dark:bg-surface-dark-card/80 backdrop-blur-md border-slate-200/80 dark:border-surface-dark-border/80 text-slate-900 dark:text-slate-100',
    interactive:
      'bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border hover:border-brand-300 dark:hover:border-brand-600/50 hover:shadow-card dark:hover:shadow-glow-purple cursor-pointer',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], paddingStyles[padding], className))}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={twMerge(clsx('flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-surface-dark-border', className))} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3 className={twMerge(clsx('text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight', className))} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={twMerge(clsx('text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1', className))} {...props}>
      {children}
    </p>
  );
};
