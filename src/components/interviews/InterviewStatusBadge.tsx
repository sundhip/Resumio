import React from 'react';
import { clsx } from 'clsx';
import { Calendar, Clock, CheckCircle2, XCircle, UserX } from 'lucide-react';
import type { RealInterviewStatus } from '../../types';

interface InterviewStatusBadgeProps {
  status: RealInterviewStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const InterviewStatusBadge: React.FC<InterviewStatusBadgeProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Scheduled':
        return {
          icon: <Calendar className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Scheduled',
          styles: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
        };
      case 'Rescheduled':
        return {
          icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Rescheduled',
          styles: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        };
      case 'Completed':
        return {
          icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Completed',
          styles: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        };
      case 'Cancelled':
        return {
          icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'Cancelled',
          styles: 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        };
      case 'No Show':
        return {
          icon: <UserX className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          label: 'No Show',
          styles: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
        };
      default:
        return {
          icon: <Calendar className="w-3.5 h-3.5" />,
          label: status,
          styles: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.styles,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
