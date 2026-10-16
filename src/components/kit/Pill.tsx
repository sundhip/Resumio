import React from 'react';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'micro-status' | 'delta-positive' | 'delta-negative' | 'info' | 'category' | 'filter';
  color?: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange' | 'neutral';
  dot?: boolean;
  selected?: boolean;
  onRemove?: () => void;
  className?: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  teal: 'bg-[#1F8FA6]/15 text-[#1F8FA6] border-[#1F8FA6]/25 dark:text-[#5FD3E8] dark:bg-[#1F8FA6]/20',
  pink: 'bg-[#D98BE8]/15 text-[#B857CD] border-[#D98BE8]/30 dark:text-[#D98BE8] dark:bg-[#D98BE8]/20',
  yellow: 'bg-[#F2C94C]/15 text-[#B48505] border-[#F2C94C]/30 dark:text-[#F2C94C] dark:bg-[#F2C94C]/20',
  green: 'bg-[#7ED957]/15 text-[#2E7D16] border-[#7ED957]/30 dark:text-[#7ED957] dark:bg-[#7ED957]/20',
  aqua: 'bg-[#5FD3E8]/15 text-[#0F869B] border-[#5FD3E8]/30 dark:text-[#5FD3E8] dark:bg-[#5FD3E8]/20',
  orange: 'bg-[#F29B4B]/15 text-[#B95505] border-[#F29B4B]/30 dark:text-[#F29B4B] dark:bg-[#F29B4B]/20',
  neutral: 'bg-black/5 text-[#5E6460] border-[#E7E7E2] dark:bg-white/5 dark:text-[#9AA7AB] dark:border-white/10',
};

const DOT_COLORS: Record<string, string> = {
  teal: 'bg-[#1F8FA6]',
  pink: 'bg-[#D98BE8]',
  yellow: 'bg-[#F2C94C]',
  green: 'bg-[#7ED957]',
  aqua: 'bg-[#5FD3E8]',
  orange: 'bg-[#F29B4B]',
  neutral: 'bg-[#8C928E]',
};

export const Pill: React.FC<PillProps> = ({
  variant = 'default',
  color = 'teal',
  dot = false,
  selected = false,
  onRemove,
  className = '',
  children,
  ...props
}) => {
  let styleClasses = '';

  switch (variant) {
    case 'micro-status':
      styleClasses = `text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[color] || CATEGORY_STYLES.neutral}`;
      break;

    case 'delta-positive':
      styleClasses = 'bg-[#E3F5EA] text-[#166534] dark:bg-[#7ED957]/15 dark:text-[#7ED957] text-xs font-medium px-2 py-0.5 rounded-full border border-[#166534]/15';
      break;

    case 'delta-negative':
      styleClasses = 'bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#F2677A]/15 dark:text-[#F2677A] text-xs font-medium px-2 py-0.5 rounded-full border border-[#B91C1C]/10';
      break;

    case 'info':
      styleClasses = 'bg-[#E6EEFF] text-[#2F5BEA] dark:bg-[#5FD3E8]/15 dark:text-[#5FD3E8] text-xs font-medium px-2.5 py-0.5 rounded-full border border-[#2F5BEA]/10';
      break;

    case 'category':
      styleClasses = `text-xs font-medium px-2.5 py-0.5 rounded-full border ${CATEGORY_STYLES[color] || CATEGORY_STYLES.teal}`;
      break;

    case 'filter':
      styleClasses = selected
        ? 'bg-[#111312] text-white dark:bg-[#1F8FA6] dark:text-white border-[#111312] dark:border-[#1F8FA6] shadow-sm text-xs font-medium px-3 py-1 rounded-full cursor-pointer transition-all'
        : 'bg-white dark:bg-[#0C1113] text-[#5E6460] dark:text-[#9AA7AB] border-[#E7E7E2] dark:border-white/10 hover:border-[#1F8FA6] text-xs font-medium px-3 py-1 rounded-full cursor-pointer transition-all';
      break;

    case 'default':
    default:
      styleClasses = 'bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] border border-[#E7E7E2] dark:border-white/10 text-xs font-medium px-2.5 py-0.5 rounded-full';
      break;
  }

  const dotColorClass = DOT_COLORS[color] || DOT_COLORS.teal;

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors duration-150 ${styleClasses} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`} />}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 -mr-1 hover:opacity-75 focus:outline-none"
          aria-label="Remove tag"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};
