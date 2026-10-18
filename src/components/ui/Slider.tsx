import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '%',
  onChange,
  className,
  ...props
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={twMerge('w-full space-y-1.5 select-none', className)}>
      <div className="flex items-center justify-between text-xs font-semibold">
        {label && <span className="text-[#111312] dark:text-[#F2F6F7]">{label}</span>}
        <span className="font-numeral px-2 py-0.5 rounded-full bg-[#E9E9E5] dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] dark:text-teal-300 font-bold text-xs border border-[#E7E7E2] dark:border-white/6">
          {value}{unit}
        </span>
      </div>

      <div className="relative flex items-center h-5 w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#DCDCD7] dark:bg-white/10 accent-[#1F8FA6] focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 transition-all [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-[#0C1113] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#1F8FA6] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.3)] [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white dark:[&::-moz-range-thumb]:bg-[#0C1113] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#1F8FA6]"
          style={{
            background: `linear-gradient(to right, #1F8FA6 0%, #1F8FA6 ${percentage}%, rgba(120,130,135,0.2) ${percentage}%, rgba(120,130,135,0.2) 100%)`
          }}
          {...props}
        />
      </div>
    </div>
  );
};
