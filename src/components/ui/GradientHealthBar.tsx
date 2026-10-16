import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GradientHealthBarProps {
  score: number; // 0 - 100
  label?: string;
  showIndicator?: boolean;
  className?: string;
}

export const GradientHealthBar: React.FC<GradientHealthBarProps> = ({
  score,
  label = 'Candidate Match Health',
  showIndicator = true,
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, score));

  return (
    <div className={twMerge('w-full space-y-2', className)}>
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-[#5E6460] dark:text-[#9AA7AB]">{label}</span>
        <span className="font-numeral font-bold text-[#111312] dark:text-[#F2F6F7]">{clamped}%</span>
      </div>

      <div className="relative h-2.5 w-full rounded-full bg-[#DCDCD7] dark:bg-[#111719] overflow-hidden">
        {/* Continuous Multi-Color Health Gradient (Red -> Amber -> Emerald -> Cyan) */}
        <div
          className="h-full bg-gradient-health rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>

      {showIndicator && (
        <div className="flex items-center justify-between text-[10px] text-[#8A928D] dark:text-[#657378] dark:text-[#5E6460] dark:text-[#9AA7AB] uppercase tracking-wider font-semibold pt-0.5">
          <span>Low Fit (0%)</span>
          <span>Moderate (50%)</span>
          <span>High Fit (80%)</span>
          <span>Optimal (100%)</span>
        </div>
      )}
    </div>
  );
};
