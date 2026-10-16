import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ScoreRingProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 110,
  strokeWidth = 9,
  label = 'Match Fit',
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  // Color selection
  const getColor = (s: number) => {
    if (s >= 85) return '#06b6d4'; // Glowing cyan
    if (s >= 70) return '#10b981'; // Emerald
    if (s >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const strokeColor = getColor(clamped);

  return (
    <div className={twMerge('relative flex flex-col items-center justify-center shrink-0', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[#DCDCD7] dark:text-[#C5D0D3] dark:text-[#111312] dark:text-[#F2F6F7]/80"
          fill="none"
        />
        {/* Animated score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-numeral text-2xl font-black text-[#111312] dark:text-[#F2F6F7] tracking-tight">
          {clamped}%
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A928D] dark:text-[#657378] dark:text-[#8A928D] dark:text-[#657378]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
