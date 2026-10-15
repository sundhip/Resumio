import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatTileProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  subtitle?: string;
  sparklineData?: number[];
  icon?: React.ReactNode;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  delta,
  subtitle,
  sparklineData = [12, 18, 14, 24, 20, 28, 35],
  icon,
  className,
}) => {
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 80;
  const height = 28;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      className={twMerge(
        'group relative flex flex-col justify-between p-4 sm:p-5 rounded-card bg-surface-light-card dark:bg-surface-dark-card border border-surface-light-border dark:border-surface-dark-border shadow-subtle hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-control bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="space-y-1">
          <div className="font-numeral text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subtitle}
            </div>
          )}
        </div>

        {/* Vestmark / FinGlow tiny sparkline */}
        <div className="flex flex-col items-end gap-1.5">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>

          {delta && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-numeral tracking-tight',
                delta.isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : delta.isNeutral
                  ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              )}
            >
              {delta.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : delta.isNeutral ? (
                <Minus className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {delta.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
