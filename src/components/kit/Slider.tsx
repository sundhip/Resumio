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
        <input
          type="range"
          aria-label={label || 'Slider control'}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#E7E7E2] dark:bg-white/10 accent-[#1F8FA6] focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 transition-all [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-[#0C1113] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#1F8FA6] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.3)] [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white dark:[&::-moz-range-thumb]:bg-[#0C1113] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#1F8FA6]"
          style={{
            background: `linear-gradient(to right, #1F8FA6 0%, #1F8FA6 ${percentage}%, rgba(120,130,135,0.2) ${percentage}%, rgba(120,130,135,0.2) 100%)`
          }}
        />
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-[#8C928E] dark:text-[#5F6C70]">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};
