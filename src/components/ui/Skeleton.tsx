import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  style,
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-800/80';

  const variantStyles = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-control',
    card: 'rounded-card h-32',
  };

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], className)}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-card border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card space-y-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton variant="circular" className="w-10 h-10" />
            <Skeleton variant="rectangular" className="w-16 h-6" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-3/4 h-5" />
            <Skeleton variant="text" className="w-1/2 h-4" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton variant="rectangular" className="w-16 h-6 rounded-full" />
            <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full rounded-card border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card p-4 space-y-3">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-surface-dark-border">
        <Skeleton variant="text" className="w-32 h-5" />
        <Skeleton variant="rectangular" className="w-24 h-8" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="text" className="w-1/3 h-4" />
              <Skeleton variant="text" className="w-1/4 h-3" />
            </div>
          </div>
          <Skeleton variant="rectangular" className="w-20 h-6 shrink-0" />
          <Skeleton variant="rectangular" className="w-16 h-6 shrink-0 rounded-full" />
          <Skeleton variant="circular" className="w-6 h-6 shrink-0" />
        </div>
      ))}
    </div>
  );
};
