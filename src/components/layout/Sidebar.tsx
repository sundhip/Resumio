import React from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';
import {
  LayoutDashboard,
  User,
  Settings,
  Users,
  Building2,
  X,
  LogOut,
  FileText,
  Briefcase,
  Sparkles,
  Send,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePath,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, role, logout } = useAuth();

  const getNavGroups = (currentRole: Role | null): NavGroup[] => {
    switch (currentRole) {
      case 'candidate':
        return [
          {
            groupTitle: 'Overview',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
            ],
          },
          {
            groupTitle: 'Opportunities',
            items: [
              { id: 'jobs', label: 'Explore Jobs', icon: <Briefcase className="w-4 h-4" /> },
              { id: 'recommendations', label: 'Recommendations', icon: <Sparkles className="w-4 h-4" /> },
              { id: 'applications', label: 'My Applications', icon: <Send className="w-4 h-4" /> },
              { id: 'interviews', label: 'My Interviews', icon: <Calendar className="w-4 h-4" /> },
            ],
          },
          {
            groupTitle: 'Profile & Resume',
            items: [
              { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
              { id: 'resume', label: 'Resume Manager', icon: <FileText className="w-4 h-4" /> },
            ],
          },
          {
            groupTitle: 'System',
            items: [
              { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
            ],
          },
        ];

      case 'recruiter':
        return [
          {
            groupTitle: 'Overview',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
            ],
          },
          {
            groupTitle: 'Recruitment',
            items: [
              { id: 'recruiter-jobs', label: 'Job Postings', icon: <Briefcase className="w-4 h-4" /> },
              { id: 'applicants', label: 'Applicant Pipeline', icon: <Users className="w-4 h-4" /> },
              { id: 'recruiter-ai-search', label: 'AI Candidate Search', icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
              { id: 'recruiter-interviews', label: 'Interviews', icon: <Calendar className="w-4 h-4" /> },
              { id: 'recruiter-analytics', label: 'Analytics & Reports', icon: <TrendingUp className="w-4 h-4" /> },
            ],
          },
          {
            groupTitle: 'Organization',
            items: [
              { id: 'company-profile', label: 'Company Profile', icon: <Building2 className="w-4 h-4" /> },
            ],
          },
          {
            groupTitle: 'System',
            items: [
              { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
            ],
          },
        ];

      case 'admin':
        return [
          {
            groupTitle: 'Overview',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
            ],
          },
          {
            groupTitle: 'Platform',
            items: [
              { id: 'admin-users', label: 'User Accounts', icon: <Users className="w-4 h-4" /> },
            ],
          },
          {
            groupTitle: 'System',
            items: [
              { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const navGroups = getNavGroups(role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-40 w-60 flex flex-col',
          'bg-surface-light-sidebar dark:bg-surface-dark-sidebar',
          'border-r border-slate-200/80 dark:border-surface-dark-border',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Logo / Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-surface-dark-border shrink-0">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-control bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:shadow-glow-purple transition-all">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  Resumio
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5 font-medium">
                AI Screening Platform
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-control text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                {group.groupTitle}
              </p>
              {group.items.map((item) => {
                const isActive = activePath === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile?.();
                    }}
                    className={clsx(
                      'w-full h-10 px-3 rounded-control flex items-center justify-between text-xs sm:text-sm font-medium transition-all duration-150 text-left select-none relative group',
                      isActive
                        ? 'bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold shadow-xs active-pill-indicator'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-surface-dark-hover'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={clsx(
                          'transition-colors shrink-0',
                          isActive
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={clsx(
                          'text-[10px] px-1.5 py-0.2 rounded-full font-semibold shrink-0',
                          isActive
                            ? 'bg-brand-200/70 dark:bg-brand-900 text-brand-800 dark:text-brand-200'
                            : 'bg-slate-100 dark:bg-surface-dark-border text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Session Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-surface-dark-border bg-slate-50/50 dark:bg-surface-dark-bg/50 shrink-0">
          <div className="p-2.5 rounded-control bg-white dark:bg-surface-dark-card border border-slate-200/80 dark:border-surface-dark-border/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Logged in as
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                {role}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-control text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
