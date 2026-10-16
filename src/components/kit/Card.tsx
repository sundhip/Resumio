import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'feature' | 'glass';
  radius?: 'control' | 'card' | 'hero';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  radius = 'card',
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const radiusMap = {
    control: 'rounded-[12px]',
    card: 'rounded-[20px]',
    hero: 'rounded-[24px]',
  };

  const paddingMap = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const variantMap = {
    default:
      'bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/6 shadow-[0_1px_2px_rgba(17,19,18,0.04),0_8px_24px_rgba(17,19,18,0.05)] dark:shadow-none card-highlight text-[#111312] dark:text-[#F2F6F7]',
    raised:
      'bg-[#F6F6F3] dark:bg-[#111719] border border-[#E7E7E2] dark:border-white/10 shadow-[0_1px_3px_rgba(17,19,18,0.06)] dark:shadow-none card-highlight text-[#111312] dark:text-[#F2F6F7]',
    feature:
      'bg-feature-teal border border-[#2BB3C9]/20 text-white shadow-[0_12px_32px_rgba(31,143,166,0.25)]',
    glass:
      'bg-white/70 dark:bg-[#0C1113]/70 backdrop-blur-md border border-[#E7E7E2]/80 dark:border-white/10 text-[#111312] dark:text-[#F2F6F7]',
  };

  const interactiveClasses = interactive
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,19,18,0.08)] dark:hover:border-white/15'
    : '';

  return (
    <div
      className={`${radiusMap[radius]} ${paddingMap[padding]} ${variantMap[variant]} ${interactiveClasses} relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
