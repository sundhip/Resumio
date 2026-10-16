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
          styles: 'bg-[#1F8FA6]/10 dark:bg-indigo-950/60 text-[#1F8FA6] dark:text-[#5FD3E8] border-[#1F8FA6]/30 dark:border-[#1F8FA6]/30/60',
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
          styles: 'bg-[#E9E9E5] dark:bg-[#111719]/60 text-[#5E6460] dark:text-[#9AA7AB] border-[#E7E7E2] dark:border-white/6',
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
          styles: 'bg-[#E9E9E5] dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] border-[#E7E7E2] dark:border-white/6',
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
