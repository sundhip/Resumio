import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: 'ghost' | 'secondary' | 'primary' | 'teal';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  disabled,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 [&>svg]:w-4 [&>svg]:h-4',
    md: 'w-10 h-10 [&>svg]:w-5 [&>svg]:h-5',
    lg: 'w-12 h-12 [&>svg]:w-6 [&>svg]:h-6',
  }[size];

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
    default:
      variantClasses =
        'bg-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5';
      break;
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={`rounded-full inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8FA6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#050708] disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
