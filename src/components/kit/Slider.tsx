import React from 'react';

export interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (val: number) => string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue = (v) => `${v}%`,
  className = '',
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {(label || formatValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB]">
              {label}
            </label>
          )}
          <span className="figure text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">
            {formatValue(value)}
          </span>
        </div>
      )}

      <div className="relative flex items-center w-full h-6">
        {/* Track Background */}
        <div className="w-full h-2 rounded-full bg-[#E7E7E2] dark:bg-white/10 relative overflow-hidden pointer-events-none">
          {/* Active Fill */}
          <div
            className="h-full bg-[#1F8FA6] rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Real Range Input Overlay */}
        <input
          type="range"
          aria-label={label || 'Slider control'}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
        />

        {/* Visual Thumb Pin */}
        <div
          className="absolute pointer-events-none -translate-x-1/2 transition-all duration-75"
          style={{ left: `${percentage}%` }}
        >
          <div className="w-4 h-4 rounded-full bg-white dark:bg-[#111719] border-2 border-[#1F8FA6] shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
        </div>
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-[#8C928E] dark:text-[#5F6C70]">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};
