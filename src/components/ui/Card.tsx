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
      'bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/6 text-[#111312] dark:text-[#F2F6F7] shadow-card dark:shadow-none',
    elevated:
      'bg-white dark:bg-[#111719] border-[#E7E7E2] dark:border-white/10 text-[#111312] dark:text-[#F2F6F7] shadow-dropdown dark:shadow-none',
    glass:
      'bg-white/80 dark:bg-[#0C1113]/80 backdrop-blur-md border-[#E7E7E2]/80 dark:border-white/10 text-[#111312] dark:text-[#F2F6F7]',
    interactive:
      'bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/6 hover:border-brand-300 dark:hover:border-white/15 hover:shadow-card dark:hover:shadow-glow-purple cursor-pointer',
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
    <div className={twMerge(clsx('flex items-center justify-between pb-4 mb-4 border-b border-[#EFEFEA] dark:border-white/6', className))} {...props}>
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
    <h3 className={twMerge(clsx('text-base sm:text-lg font-semibold text-[#111312] dark:text-[#F2F6F7] tracking-tight', className))} {...props}>
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
    <p className={twMerge(clsx('text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] mt-1', className))} {...props}>
      {children}
    </p>
  );
};
