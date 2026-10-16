import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-[10px] gap-1.5 h-8',
    md: 'text-sm px-4 py-2.5 rounded-[12px] gap-2 h-10',
    lg: 'text-base px-6 py-3 rounded-[14px] gap-2.5 h-12',
  }[size];

  // Specific FinGlow / Vestmark styling:
  // Primary: in light theme -> Ink Black #111312; in dark theme -> Brand Teal #1F8FA6 with glow
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-[#111312] text-white hover:bg-black dark:bg-[#1F8FA6] dark:text-white dark:hover:bg-[#2BB3C9] dark:shadow-[0_4px_16px_rgba(43,179,201,0.35)] shadow-sm';
      break;
    case 'teal':
      variantClasses =
        'bg-[#1F8FA6] text-white hover:bg-[#2BB3C9] shadow-[0_4px_16px_rgba(43,179,201,0.35)]';
      break;
    case 'secondary':
      variantClasses =
        'bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] border border-[#E7E7E2] dark:border-white/10 hover:bg-[#F6F6F3] dark:hover:bg-white/5 shadow-sm';
      break;
    case 'ghost':
      variantClasses =
        'bg-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5';
      break;
    case 'danger':
      variantClasses =
        'bg-[#F2677A] text-white hover:bg-[#E05367] shadow-sm';
      break;
  }

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leadingIcon ? (
        <span className="flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">{leadingIcon}</span>
      ) : null}

      <span>{children}</span>

      {!isLoading && trailingIcon && (
        <span className="flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">{trailingIcon}</span>
      )}
    </button>
  );
};
