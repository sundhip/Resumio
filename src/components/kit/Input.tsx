import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leadingIcon,
      trailingIcon,
      onClear,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#5E6460] dark:text-[#9AA7AB] mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="absolute left-3.5 pointer-events-none text-[#8C928E] dark:text-[#5F6C70] [&>svg]:w-4 [&>svg]:h-4">
              {leadingIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full h-10 rounded-[12px] text-sm bg-white dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7] placeholder-[#8C928E] dark:placeholder-[#5F6C70] border transition-all duration-150 focus:outline-none focus:ring-2 ${
              leadingIcon ? 'pl-10' : 'pl-3.5'
            } ${trailingIcon || onClear ? 'pr-10' : 'pr-3.5'} ${
              error
                ? 'border-[#F2677A] focus:ring-[#F2677A]/30 focus:border-[#F2677A]'
                : 'border-[#E7E7E2] dark:border-white/10 focus:ring-[#1F8FA6]/30 focus:border-[#1F8FA6]'
            } disabled:opacity-50 disabled:bg-[#F6F6F3] dark:disabled:bg-white/5 disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {onClear && props.value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3.5 text-[#8C928E] hover:text-[#111312] dark:text-[#5F6C70] dark:hover:text-[#F2F6F7] cursor-pointer"
              aria-label="Clear input"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {!onClear && trailingIcon && (
            <div className="absolute right-3.5 pointer-events-none text-[#8C928E] dark:text-[#5F6C70] [&>svg]:w-4 [&>svg]:h-4">
              {trailingIcon}
            </div>
          )}
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

Input.displayName = 'Input';
