import React from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-card border border-dashed border-[#E7E7E2] dark:border-surface-dark-border bg-[#F4F4F1]/40 dark:bg-surface-dark-bg/40 animate-fade-in',
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#111312] dark:text-[#F2F6F7] mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button onClick={onAction} leftIcon={actionIcon} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
