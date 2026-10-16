import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps<T>) {
  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1.5 p-1 rounded-full bg-[#E9E9E5] dark:bg-[#080B0C] border border-[#E7E7E2] dark:border-white/10 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#1F8FA6]/40 ${
                isActive
                  ? 'bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] shadow-sm'
                  : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
              }`}
            >
              {tab.icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex border-b border-[#E7E7E2] dark:border-white/10 gap-6 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`group inline-flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 transition-all cursor-pointer select-none whitespace-nowrap focus:outline-none ${
              isActive
                ? 'border-[#1F8FA6] text-[#1F8FA6] dark:text-[#5FD3E8] font-semibold'
                : 'border-transparent text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] hover:border-[#8C928E]'
            }`}
          >
            {tab.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-[#1F8FA6]/15 text-[#1F8FA6] dark:bg-[#1F8FA6]/30 dark:text-[#5FD3E8]'
                    : 'bg-[#F4F4F1] dark:bg-white/10 text-[#5E6460] dark:text-[#9AA7AB]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
