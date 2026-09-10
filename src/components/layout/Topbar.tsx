import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Dropdown } from '../ui/Dropdown';
import { SearchInput } from '../ui/Input';
import { NotificationsMenu } from '../shared/NotificationsMenu';
import {
  Menu,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Palette,
} from 'lucide-react';

interface TopbarProps {
  currentSection: string;
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentSection,
  onOpenMobileSidebar,
  onOpenSearch,
  onNavigate,
}) => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getSectionTitle = (id: string) => {
    switch (id) {
      case 'dashboard':
        return role === 'recruiter' ? 'Recruiter Dashboard' : role === 'admin' ? 'Admin Platform Center' : 'Candidate Dashboard';
      case 'profile':
        return 'Candidate Profile Management';
      case 'resume':
        return 'Candidate Resume Manager';
      case 'jobs':
        return 'Explore Job Opportunities';
      case 'recommendations':
        return 'Job Recommendations';
      case 'applications':
        return 'My Applications';
      case 'interviews':
        return 'My Scheduled Interviews';
      case 'recruiter-jobs':
        return 'Job Postings Management';
      case 'create-job':
        return 'Create New Job Posting';
      case 'edit-job':
        return 'Edit Job Posting';
      case 'applicants':
      case 'job-applicants':
        return 'Applicant Pipeline & Ranking';
      case 'recruiter-interviews':
        return 'Recruitment Interviews Hub';
      case 'recruiter-analytics':
        return 'Recruitment Analytics & Insights';
      case 'company-profile':
        return 'Company & Recruiter Profile';
      case 'admin-users':
        return 'User Accounts Management';
      case 'settings':
        return 'Account & Security Settings';
      case 'design-system':
        return 'Design System & Component Showcase';
      default:
        return 'Dashboard';
    }
  };

  const userMenuItems = [
    {
      id: 'profile-nav',
      label: role === 'recruiter' ? 'Company Profile' : role === 'admin' ? 'User Accounts' : 'My Profile',
      icon: <User className="w-4 h-4 text-slate-400" />,
      onClick: () => onNavigate(role === 'recruiter' ? 'company-profile' : role === 'admin' ? 'admin-users' : 'profile'),
    },
    {
      id: 'settings',
      label: 'Account Settings',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      onClick: () => onNavigate('settings'),
    },
    {
      id: 'design-system',
      label: 'Design System Library',
      icon: <Palette className="w-4 h-4 text-brand-500" />,
      rightBadge: (
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold">
          UI Kit
        </span>
      ),
      onClick: () => onNavigate('design-system'),
    },
    {
      id: 'logout-div',
      label: '',
      divider: true,
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: <LogOut className="w-4 h-4 text-rose-500" />,
      destructive: true,
      onClick: () => logout(),
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-surface-dark-bg/90 backdrop-blur-md border-b border-slate-200/80 dark:border-surface-dark-border px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left Area: Mobile menu trigger & Breadcrumb / Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-control text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark-hover"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>Resumio</span>
            <span>/</span>
            <span className="capitalize">{role}</span>
            <span>/</span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
            {getSectionTitle(currentSection)}
          </h1>
        </div>
      </div>

      {/* Right Area: Search, Theme, Notifications, User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search trigger button for Command Palette */}
        <div className="w-44 sm:w-64 md:w-80 cursor-pointer" onClick={onOpenSearch}>
          <SearchInput
            readOnly
            placeholder={
              role === 'recruiter'
                ? 'Search candidates, skills, jobs...'
                : 'Search jobs, companies...'
            }
            className="cursor-pointer pointer-events-none"
          />
        </div>

        {/* Design System Quick Access */}
        <button
          onClick={() => onNavigate('design-system')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 text-brand-700 dark:text-brand-300 border border-brand-200/70 dark:border-brand-800/60 transition-colors"
          title="Explore Resumio Design System Showcase"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>UI Showcase</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-control text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <NotificationsMenu onNavigate={onNavigate} />

        {/* User Profile Dropdown Menu */}
        <Dropdown
          align="right"
          width="md"
          items={userMenuItems}
          trigger={
            <div className="flex items-center gap-2.5 p-1 pl-1.5 rounded-control hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors select-none group">
              <div className="relative">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={user?.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-surface-dark-border group-hover:ring-brand-500 transition-all"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-surface-dark-sidebar" />
              </div>

              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[110px]">
                  {user?.name || 'Rahul Kumar'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                  {role}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
            </div>
          }
        />
      </div>
    </header>
  );
};
