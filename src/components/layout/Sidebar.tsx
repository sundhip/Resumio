import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { Role } from '../../types';
import {
  SidebarItem,
  SidebarSectionLabel,
  Pill,
} from '../kit';
import {
  LayoutDashboard,
  Briefcase,
  Send,
  Calendar,
  Compass,
  Sparkles,
  Settings,
  Users,
  Layers,
  Search,
  TrendingUp,
  Building2,
  Database,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Eye,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePath,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Streamlined Information Architecture (R0 Flow Audit: max 6-7 items per role)
  const getNavItems = (currentRole: Role | null) => {
    switch (currentRole) {
      case 'candidate':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
          { id: 'jobs', label: 'Explore Jobs', icon: <Briefcase /> },
          { id: 'candidate-experience', label: 'Career Hub & Evidence', icon: <Compass />, badge: 'New' },
          { id: 'applications', label: 'My Applications', icon: <Send /> },
          { id: 'resume-builder', label: 'Resume Studio', icon: <Sparkles /> },
          { id: 'interviews', label: 'Interview Hub', icon: <Calendar /> },
        ];

      case 'recruiter':
        return [
          { id: 'dashboard', label: 'Command Center', icon: <LayoutDashboard /> },
          { id: 'recruiter-workspace', label: 'Talent Pipeline', icon: <Layers />, badge: 'Active' },
          { id: 'recruiter-jobs', label: 'Job Postings', icon: <Briefcase /> },
          { id: 'recruiter-ai-search', label: 'Talent Search', icon: <Search /> },
          { id: 'recruiter-interviews', label: 'Interview Hub', icon: <Calendar /> },
          { id: 'recruiter-analytics', label: 'Analytics & EEOC', icon: <TrendingUp /> },
        ];

      case 'admin':
      default:
        return [
          { id: 'dashboard', label: 'System Overview', icon: <LayoutDashboard /> },
          { id: 'admin-users', label: 'Organizations & Users', icon: <Users /> },
          { id: 'research-pipeline', label: 'ModelOps AI Registry', icon: <Database /> },
          { id: 'skills-ontology', label: 'Skill Taxonomy & KB', icon: <BookOpen /> },
          { id: 'platform-integrations', label: 'Platform & Webhooks', icon: <Layers /> },
          { id: 'public-benchmark', label: 'Public Benchmark', icon: <TrendingUp /> },
        ];
    }
  };

  const navItems = getNavItems(role);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white dark:bg-[#080B0C] border-r border-[#E7E7E2] dark:border-white/6 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[248px]'
        } ${
          isOpenMobile ? 'translate-x-0 !w-[248px]' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E7E7E2] dark:border-white/6 shrink-0">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-full bg-[#1F8FA6] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_2px_12px_rgba(43,179,201,0.4)] flex-shrink-0">
              R
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-[#111312] dark:text-[#F2F6F7]">
                    Resumio
                  </span>
                  <Pill variant="micro-status" color="teal">ATS</Pill>
                </div>
                <span className="text-[10px] text-[#5E6460] dark:text-[#9AA7AB] -mt-0.5">
                  Production Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Collapse/Expand Toggle (Desktop only) */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-full items-center justify-center text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
          {/* NAVIGATION SECTION */}
          <div>
            <SidebarSectionLabel collapsed={isCollapsed}>Navigation</SidebarSectionLabel>
            <div className="space-y-1">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activePath === item.id}
                  badge={item.badge}
                  collapsed={isCollapsed}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile?.();
                  }}
                />
              ))}
            </div>
          </div>

          {/* ACCOUNT & TOOLS SECTION */}
          <div>
            <SidebarSectionLabel collapsed={isCollapsed}>Account</SidebarSectionLabel>
            <div className="space-y-1">
              <SidebarItem
                icon={<Settings />}
                label={role === 'recruiter' ? 'Organization Settings' : 'Settings & Privacy'}
                active={activePath === 'settings' || activePath === 'company-profile'}
                collapsed={isCollapsed}
                onClick={() => {
                  onNavigate(role === 'recruiter' ? 'company-profile' : 'settings');
                  onCloseMobile?.();
                }}
              />
              <SidebarItem
                icon={<Sliders />}
                label="Design System Showcase"
                active={activePath === 'dev-design-system'}
                collapsed={isCollapsed}
                onClick={() => {
                  onNavigate('dev-design-system');
                  onCloseMobile?.();
                }}
              />
              <SidebarItem
                icon={<Eye />}
                label="Fidelity Verification"
                active={activePath === 'dev-reference-match'}
                collapsed={isCollapsed}
                onClick={() => {
                  onNavigate('dev-reference-match');
                  onCloseMobile?.();
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Panel: Theme Switcher & User Profile */}
        <div className="p-3 border-t border-[#E7E7E2] dark:border-white/6 bg-[#FAFAF8] dark:bg-[#050708] shrink-0 space-y-3">
          {/* 3-Mode Theme Control */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-1 rounded-full bg-[#E9E9E5] dark:bg-[#080B0C] border border-[#E7E7E2] dark:border-white/10">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-[#111312] shadow-sm'
                    : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312]'
                }`}
                title="Light Theme (Paper)"
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#1F8FA6] text-white shadow-[0_2px_8px_rgba(43,179,201,0.35)]'
                    : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312]'
                }`}
                title="Dark Theme (Obsidian)"
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] shadow-sm'
                    : 'text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312]'
                }`}
                title="System OS Theme"
              >
                <Laptop className="w-3.5 h-3.5" /> Auto
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] bg-[#E9E9E5] dark:bg-white/10"
                title={`Toggle theme (Current: ${theme})`}
              >
                {theme === 'dark' ? <Moon className="w-4 h-4 text-[#5FD3E8]" /> : <Sun className="w-4 h-4 text-[#F29B4B]" />}
              </button>
            </div>
          )}

          {/* User Session Row */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-[12px] bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/6">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1F8FA6] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                {(user?.name || 'User')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              {!isCollapsed && (
                <div className="truncate">
                  <div className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] truncate">
                    {user?.name || 'Alex Chen'}
                  </div>
                  <div className="text-[10px] text-[#5E6460] dark:text-[#9AA7AB] capitalize">
                    {role || 'candidate'}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-full text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#F2677A] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
