import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Search,
  Briefcase,
  User,
  LayoutDashboard,
  Moon,
  Sun,
  Palette,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onOpenUploadModal?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Command items strictly within Phase 1 scope
  const baseActions = [
    {
      id: 'dash',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-brand-500" />,
      action: () => onNavigate('dashboard'),
    },
    {
      id: 'profile',
      title: role === 'recruiter' ? 'View Company Profile' : role === 'admin' ? 'User Accounts' : 'View Candidate Profile',
      category: 'Navigation',
      icon: role === 'recruiter' ? <Briefcase className="w-4 h-4 text-brand-500" /> : <User className="w-4 h-4 text-emerald-500" />,
      action: () => onNavigate(role === 'recruiter' ? 'company-profile' : role === 'admin' ? 'admin-users' : 'profile'),
    },
    {
      id: 'settings',
      title: 'Account Settings & Security',
      category: 'Navigation',
      icon: <User className="w-4 h-4 text-slate-500" />,
      action: () => onNavigate('settings'),
    },
    {
      id: 'theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => toggleTheme(),
    },
    {
      id: 'design-sys',
      title: 'Open Design System Showcase',
      category: 'Design System',
      icon: <Palette className="w-4 h-4 text-purple-500" />,
      action: () => onNavigate('design-system'),
    },
  ];

  const allItems = baseActions;

  const filteredItems = query
    ? allItems.filter(
        (it) =>
          it.title.toLowerCase().includes(query.toLowerCase()) ||
          it.category.toLowerCase().includes(query.toLowerCase())
      )
    : baseActions;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        selected.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-xl rounded-card bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-dropdown-dark z-10 overflow-hidden animate-fade-in">
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-surface-dark-border gap-3">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search candidates, skills, jobs..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-surface-dark-bg rounded border border-slate-200 dark:border-surface-dark-border">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2.5 rounded-control cursor-pointer text-xs sm:text-sm transition-colors select-none',
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-hover'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-surface-dark-bg text-slate-500 dark:text-slate-400 font-medium">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-brand-500" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-surface-dark-bg/60 border-t border-slate-100 dark:border-surface-dark-border flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>esc Close</span>
          </div>
          <span className="text-brand-600 dark:text-brand-400 font-medium">Resumio AI Core</span>
        </div>
      </div>
    </div>
  );
};
