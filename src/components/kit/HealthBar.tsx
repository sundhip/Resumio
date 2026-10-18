import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';

export interface HealthBarProps {
  value?: number; // 0 to 100
  current?: number; // Alias for value
  target?: number;
  color?: string;
  startLabel?: string;
  endLabel?: string;
  showValueLabel?: boolean;
  showMarker?: boolean;
  height?: number | string; // default 8px, or class like "h-2"
  animate?: boolean;
  className?: string;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  value,
  current,
  startLabel,
  endLabel,
  showValueLabel = false,
  showMarker = true,
  height = 8,
  animate = true,
  className = '',
}) => {
  const rawNum = typeof value === 'number' && !isNaN(value)
    ? value
    : typeof current === 'number' && !isNaN(current)
    ? current
    : 0;

  const clampedValue = Math.min(100, Math.max(0, rawNum));
  const animatedValue = useCountUp(clampedValue, animate ? 280 : 0);
  const displayValue = isNaN(animatedValue) ? clampedValue : animatedValue;

  const heightStyle = typeof height === 'number' ? { height: `${height}px` } : undefined;
  const heightClass = typeof height === 'string' ? height : '';

  return (
    <div className={`w-full ${className}`}>
      {/* Track & Gradient */}
      <div
        className={`relative w-full rounded-full bg-[#E7E7E2] dark:bg-white/10 ${heightClass}`}
        style={heightStyle || (heightClass ? undefined : { height: '8px' })}
      >
        <div
          className="h-full rounded-full bg-gradient-health transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />

        {/* Marker pin with smooth glide (optional) */}
        {showMarker && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{
              left: `${clampedValue}%`,
              transition: 'left 280ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0C1113] bg-[#111312] dark:bg-white shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-150 hover:scale-110" />
          </div>
        )}
      </div>

      {/* End labels & Value readout */}
      {(startLabel || endLabel || showValueLabel) && (
        <div className="mt-1.5 flex items-center justify-between text-xs text-[#5E6460] dark:text-[#9AA7AB]">
          <span>{startLabel}</span>
          {showValueLabel && (
            <span className="figure font-semibold text-[#111312] dark:text-[#F2F6F7]">
              {displayValue}%
            </span>
          )}
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  );
};
