import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';

export interface HealthBarProps {
  value: number; // 0 to 100
  startLabel?: string;
  endLabel?: string;
  showValueLabel?: boolean;
  height?: number; // default 8px
  animate?: boolean;
  className?: string;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  value,
  startLabel,
  endLabel,
  showValueLabel = true,
  height = 8,
  animate = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const animatedValue = useCountUp(clampedValue, animate ? 280 : 0);

  return (
    <div className={`w-full ${className}`}>
      {/* Track & Gradient */}
      <div
        className="relative w-full rounded-full bg-[#E7E7E2] dark:bg-white/10"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full rounded-full bg-gradient-health"
          style={{ width: '100%' }}
        />

        {/* Marker pin with smooth glide */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{
            left: `${clampedValue}%`,
            transition: 'left 280ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="w-4 h-4 rounded-full border-2 border-white dark:border-[#0C1113] bg-[#111312] dark:bg-white shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-150 hover:scale-110" />
        </div>
      </div>

      {/* End labels & Value readout */}
      {(startLabel || endLabel || showValueLabel) && (
        <div className="mt-2 flex items-center justify-between text-xs text-[#5E6460] dark:text-[#9AA7AB]">
          <span>{startLabel}</span>
          {showValueLabel && (
            <span className="figure font-semibold text-[#111312] dark:text-[#F2F6F7]">
              {animatedValue}%
            </span>
          )}
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  );
};
