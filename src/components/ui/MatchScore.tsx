import React from 'react';
import { clsx } from 'clsx';
import { Sparkles } from 'lucide-react';

export interface MatchScoreProps {
  score: number;
  variant?: 'card' | 'circle' | 'bar' | 'pill' | 'compact';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MatchScore: React.FC<MatchScoreProps> = ({
  score,
  variant = 'pill',
  showLabel = true,
  size = 'md',
  className,
}) => {
  const getRating = (val: number) => {
    if (val >= 90) return { label: 'Excellent Match', color: 'text-brand-600 dark:text-brand-400', stroke: '#8B5CF6' };
    if (val >= 80) return { label: 'Strong Match', color: 'text-indigo-600 dark:text-indigo-400', stroke: '#6366F1' };
    if (val >= 70) return { label: 'Good Match', color: 'text-emerald-600 dark:text-emerald-400', stroke: '#10B981' };
    return { label: 'Moderate Match', color: 'text-amber-600 dark:text-amber-400', stroke: '#F59E0B' };
  };

  const rating = getRating(score);

  if (variant === 'pill') {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 font-medium rounded-full bg-brand-50/90 dark:bg-brand-950/70 border border-brand-200/80 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 select-none shadow-sm',
          size === 'sm' && 'text-[11px] px-2 py-0.5',
          size === 'md' && 'text-xs px-2.5 py-1',
          size === 'lg' && 'text-sm px-3.5 py-1.5 font-semibold',
          className
        )}
      >
        <Sparkles className={clsx('text-brand-500 animate-pulse-subtle', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        <span>{score}% Match</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <span className={clsx('font-bold text-sm text-slate-900 dark:text-white')}>{score}%</span>
        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div className={clsx('w-full', className)}>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            AI Match Score
          </span>
          <span className="font-bold text-brand-600 dark:text-brand-400">{score}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${score}%` }}
          />
        </div>
        {showLabel && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {rating.label} based on resume & job requirements
          </p>
        )}
      </div>
    );
  }

  if (variant === 'circle') {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className={clsx('flex items-center gap-3', className)}>
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-slate-200 dark:text-slate-800"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={rating.stroke}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">{score}%</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Match</span>
          </div>
        </div>
        {showLabel && (
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{rating.label}</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">AI semantic alignment</p>
          </div>
        )}
      </div>
    );
  }

  // Card Variant
  return (
    <div
      className={clsx(
        'p-4 rounded-card border border-brand-200/70 dark:border-brand-900/50 bg-gradient-to-b from-brand-50/40 to-transparent dark:from-brand-950/20 dark:to-transparent text-center relative overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
        AI Match
      </div>
      <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
        {score}%
      </div>
      <div className={clsx('text-xs font-medium', rating.color)}>
        {rating.label}
      </div>
    </div>
  );
};
