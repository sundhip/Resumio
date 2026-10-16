import React from 'react';
import { Button } from './Button';

// ==========================================
// 1. Skeleton
// ==========================================

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded-[6px]',
    circular: 'rounded-full',
    rectangular: 'rounded-[12px]',
  }[variant];

  return (
    <div
      className={`animate-pulse bg-[#E7E7E2] dark:bg-white/10 ${variantStyles} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

// ==========================================
// 2. EmptyState
// ==========================================

export interface EmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto ${className}`}>
      {illustration && <div className="mb-4 flex items-center justify-center">{illustration}</div>}

      <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">{title}</h3>
      <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1.5 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. ErrorState
// ==========================================

export interface ErrorStateProps {
  title?: string;
  message: string;
  reason?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  reason,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 rounded-[20px] bg-[#FEE2E2]/30 dark:bg-[#F2677A]/10 border border-[#F2677A]/20 flex flex-col sm:flex-row items-start gap-4 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-[#F2677A]/15 text-[#F2677A] flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <div className="flex-1">
        <h4 className="text-sm font-bold text-[#B91C1C] dark:text-[#F2677A]">{title}</h4>
        <p className="text-xs text-[#111312] dark:text-[#F2F6F7] mt-1 font-medium">{message}</p>
        {reason && (
          <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
            Details: {reason}
          </p>
        )}

        {onRetry && (
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
