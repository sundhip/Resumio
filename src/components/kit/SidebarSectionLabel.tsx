import React from 'react';

export interface SidebarSectionLabelProps {
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
}

export const SidebarSectionLabel: React.FC<SidebarSectionLabelProps> = ({
  children,
  className = '',
  collapsed = false,
}) => {
  if (collapsed) {
    return <div className="h-px my-3 bg-[#E7E7E2] dark:bg-white/10" />;
  }

  return (
    <div
      className={`px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8C928E] dark:text-[#5F6C70] select-none ${className}`}
    >
      {children}
    </div>
  );
};
