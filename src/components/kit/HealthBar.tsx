import React from 'react';

export interface HealthBarProps {
  value: number; // 0 to 100
  startLabel?: string;
  endLabel?: string;
  showValueLabel?: boolean;
  height?: number; // default 8px
  className?: string;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  value,
  startLabel,
  endLabel,
  showValueLabel = true,
  height = 8,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {/* Track & Gradient */}
      <div
        className="relative w-full rounded-full bg-[#E7E7E2] dark:bg-white/10"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full rounded-full bg-gradient-health transition-all duration-300"
          style={{ width: '100%' }}
        />

        {/* Marker pin */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
          style={{ left: `${clampedValue}%` }}
        >
          <div className="w-4 h-4 rounded-full border-2 border-white dark:border-[#0C1113] bg-[#111312] dark:bg-white shadow-[0_2px_6px_rgba(0,0,0,0.3)]" />
        </div>
      </div>

      {/* End labels & Value readout */}
      {(startLabel || endLabel || showValueLabel) && (
        <div className="mt-2 flex items-center justify-between text-xs text-[#5E6460] dark:text-[#9AA7AB]">
          <span>{startLabel}</span>
          {showValueLabel && (
            <span className="figure font-semibold text-[#111312] dark:text-[#F2F6F7]">
              {clampedValue}%
            </span>
          )}
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  );
};
