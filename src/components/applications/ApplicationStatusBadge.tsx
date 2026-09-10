import React from 'react';
import type { RealApplicationStatus } from '../../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
} from 'lucide-react';

interface ApplicationStatusBadgeProps {
  status: RealApplicationStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = false,
  showIcon = true,
  className = '',
}) => {
  const getStatusConfig = (st: string) => {
    switch (st) {
      case 'Applied':
        return {
          label: 'Applied',
          bg: 'bg-blue-50 dark:bg-blue-950/60',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200/80 dark:border-blue-900/60',
          dot: 'bg-blue-500',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'Under Review':
        return {
          label: 'Under Review',
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200/80 dark:border-amber-900/60',
          dot: 'bg-amber-500',
          icon: <Search className="w-3 h-3" />,
        };
      case 'Shortlisted':
        return {
          label: 'Shortlisted',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200/80 dark:border-emerald-900/60',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3 h-3" />,
        };
      case 'Rejected':
        return {
          label: 'Rejected',
          bg: 'bg-rose-50 dark:bg-rose-950/60',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200/80 dark:border-rose-900/60',
          dot: 'bg-rose-500',
          icon: <XCircle className="w-3 h-3" />,
        };
      case 'Withdrawn':
        return {
          label: 'Withdrawn',
          bg: 'bg-slate-100 dark:bg-surface-dark-input',
          text: 'text-slate-600 dark:text-slate-400',
          border: 'border-slate-200 dark:border-surface-dark-border',
          dot: 'bg-slate-400',
          icon: <RotateCcw className="w-3 h-3" />,
        };
      default:
        return {
          label: st || 'Active',
          bg: 'bg-slate-100 dark:bg-surface-dark-input',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-surface-dark-border',
          dot: 'bg-slate-400',
          icon: <Clock className="w-3 h-3" />,
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeStyles} ${className} select-none shrink-0 transition-colors`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />}
      {showIcon && !showDot && <span className="shrink-0">{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};
