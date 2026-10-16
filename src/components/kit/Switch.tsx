import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const switchSize = size === 'sm' ? 'w-8 h-4.5' : 'w-11 h-6';
  const knobSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const knobTranslate = size === 'sm' ? 'translate-x-3.5' : 'translate-x-5';

  return (
    <label
      className={`inline-flex items-center gap-3 select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 ${switchSize} ${
          checked
            ? 'bg-[#1F8FA6] shadow-[0_2px_10px_rgba(31,143,166,0.35)]'
            : 'bg-[#E7E7E2] dark:bg-white/15'
        }`}
      >
        <span
          className={`pointer-events-none inline-block rounded-full bg-white shadow-sm transform ring-0 transition duration-200 ease-in-out my-auto ml-0.5 ${knobSize} ${
            checked ? knobTranslate : 'translate-x-0'
          }`}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-[#111312] dark:text-[#F2F6F7]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
