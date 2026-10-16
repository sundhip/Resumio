import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, disabled, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB] mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full h-10 appearance-none rounded-[12px] text-sm bg-white dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7] border pl-3.5 pr-10 transition-all duration-150 focus:outline-none focus:ring-2 cursor-pointer ${
              error
                ? 'border-[#F2677A] focus:ring-[#F2677A]/30 focus:border-[#F2677A]'
                : 'border-[#E7E7E2] dark:border-white/10 focus:ring-[#1F8FA6]/30 focus:border-[#1F8FA6]'
            } disabled:opacity-50 disabled:bg-[#F6F6F3] dark:disabled:bg-white/5 disabled:cursor-not-allowed ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-white dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7]"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3.5 pointer-events-none text-[#8C928E] dark:text-[#5F6C70]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error ? (
          <p className="mt-1.5 text-xs text-[#F2677A] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[#8C928E] dark:text-[#5F6C70]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
