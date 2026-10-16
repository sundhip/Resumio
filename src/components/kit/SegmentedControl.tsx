import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const containerPadding = size === 'sm' ? 'p-1' : 'p-1.5';
  const itemPadding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';

  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-full bg-[#E9E9E5] dark:bg-[#080B0C] border border-[#E7E7E2] dark:border-white/10 ${containerPadding} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isSelected}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 ${itemPadding} ${
              isSelected
                ? 'bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] dark:border dark:border-white/10'
                : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
            }`}
          >
            {option.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
