import React from 'react';

export interface HatchedProgressProps {
  value: number; // 0 to 100
  color?: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange';
  height?: number; // default 10px
  animated?: boolean;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  teal: 'bg-[#1F8FA6]',
  pink: 'bg-[#D98BE8]',
  yellow: 'bg-[#F2C94C]',
  green: 'bg-[#7ED957]',
  aqua: 'bg-[#5FD3E8]',
  orange: 'bg-[#F29B4B]',
};

export const HatchedProgress: React.FC<HatchedProgressProps> = ({
  value,
  color = 'teal',
  height = 10,
  animated = false,
  label,
  showPercentage = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const fillColor = COLOR_MAP[color] || COLOR_MAP.teal;

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && (
            <span className="font-medium text-[#5E6460] dark:text-[#9AA7AB]">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="figure font-semibold text-[#111312] dark:text-[#F2F6F7]">
              {clampedValue}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className="w-full overflow-hidden rounded-full bg-[#E7E7E2] dark:bg-white/10"
        style={{ height: `${height}px` }}
      >
        {/* Filled Hatched Bar */}
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillColor} progress-hatched ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
