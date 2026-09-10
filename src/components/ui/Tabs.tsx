import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'boxed';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className,
}) => {
  if (variant === 'underline') {
    return (
      <div className={twMerge(clsx('flex items-center gap-6 border-b border-slate-200 dark:border-surface-dark-border', className))}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px select-none',
                isActive
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'px-1.5 py-0.5 text-xs rounded-full',
                    isActive
                      ? 'bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300'
                      : 'bg-slate-100 dark:bg-surface-dark-border text-slate-600 dark:text-slate-400'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'boxed') {
    return (
      <div className={twMerge(clsx('inline-flex p-1 rounded-control bg-slate-100/80 dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border', className))}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-control text-xs sm:text-sm font-medium transition-all select-none',
                isActive
                  ? 'bg-white dark:bg-surface-dark-card text-slate-900 dark:text-white shadow-subtle border border-slate-200/60 dark:border-surface-dark-border'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'px-1.5 py-0.2 text-[11px] rounded-full',
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: pills
  return (
    <div className={twMerge(clsx('flex items-center gap-2 flex-wrap', className))}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all select-none border',
              isActive
                ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-hover'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 text-[10px] rounded-full font-semibold',
                  isActive
                    ? 'bg-brand-700 text-white'
                    : 'bg-slate-100 dark:bg-surface-dark-border text-slate-600 dark:text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
