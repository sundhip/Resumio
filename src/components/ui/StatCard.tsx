import React from 'react';
import { clsx } from 'clsx';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  icon,
  iconBgColor = 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400',
  className,
}) => {
  return (
    <Card padding="sm" className={clsx('relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-surface-dark-border/80', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={clsx('w-9 h-9 rounded-control flex items-center justify-center shrink-0 shadow-subtle border border-slate-100 dark:border-surface-dark-border', iconBgColor)}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        {change && (
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
              trend === 'down' && 'text-rose-600 dark:text-rose-400',
              trend === 'neutral' && 'text-slate-500 dark:text-slate-400'
            )}
          >
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
