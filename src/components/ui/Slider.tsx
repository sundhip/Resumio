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
        {label && <span className="text-slate-700 dark:text-slate-300">{label}</span>}
        <span className="font-numeral px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-teal-300 font-bold text-xs border border-slate-200 dark:border-slate-700">
          {value}{unit}
        </span>
      </div>

      <div className="relative flex items-center h-5 w-full">
        {/* Track fill */}
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 pointer-events-none">
          <div
            className="h-full rounded-full bg-teal-500 dark:bg-teal-400 transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-5 opacity-0 cursor-pointer z-10"
          {...props}
        />

        {/* Custom thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-white dark:bg-teal-300 border-2 border-teal-500 dark:border-teal-400 shadow-md pointer-events-none transition-all duration-75 transform -translate-x-1/2"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
