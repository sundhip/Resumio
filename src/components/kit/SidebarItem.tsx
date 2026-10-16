import React from 'react';

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
  badgeColor?: 'teal' | 'pink' | 'yellow' | 'green' | 'aqua' | 'orange';
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active = false,
  badge,
  badgeColor = 'teal',
  collapsed = false,
  onClick,
  className = '',
}) => {
  const activeClasses = active
    ? 'bg-[#1F8FA6] text-white font-medium shadow-[0_4px_16px_rgba(43,179,201,0.35)]'
    : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5';

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[14px] transition-all duration-150 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 ${
        collapsed ? 'justify-center px-0 w-11 h-11 mx-auto' : ''
      } ${activeClasses} ${className}`}
    >
      <span className="flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>

      {!collapsed && (
        <span className="truncate flex-1 font-medium">{label}</span>
      )}

      {!collapsed && badge !== undefined && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            active
              ? 'bg-white/20 text-white'
              : 'bg-[#1F8FA6]/15 text-[#1F8FA6] dark:bg-[#1F8FA6]/30 dark:text-[#5FD3E8]'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
