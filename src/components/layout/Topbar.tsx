import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NotificationsMenu } from '../shared/NotificationsMenu';
import {
  Button,
  IconButton,
  Pill,
} from '../kit';
import {
  Menu,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Sliders,
  Check,
  HelpCircle,
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstName = (user?.name || (role === 'recruiter' ? 'Sarah' : 'Alex')).split(' ')[0];

  const getSectionTitle = (id: string) => {
    switch (id) {
      case 'dashboard':
        return role === 'recruiter' ? 'Command Center' : role === 'admin' ? 'System Overview' : 'Candidate Dashboard';
      case 'recruiter-workspace':
      case 'applicants':
      case 'job-applicants':
        return 'Talent Pipeline & Kanban';
      case 'recruiter-jobs':
        return 'Job Postings & Requisitions';
      case 'create-job':
        return 'Create Requisition';
      case 'recruiter-ai-search':
        return 'AI Candidate Search';
      case 'recruiter-interviews':
      case 'interviews':
        return 'Interview Hub & Schedule';
      case 'recruiter-analytics':
        return 'Recruitment Analytics & Insights';
      case 'jobs':
        return 'Explore Opportunities';
      case 'candidate-experience':
        return 'Career Hub & Evidence Verification';
      case 'applications':
        return 'My Applications';
      case 'resume':
      case 'resume-builder':
        return 'ATS Resume Studio';
      case 'profile':
        return 'Candidate Profile';
      case 'company-profile':
        return 'Company & Organization Profile';
      case 'admin-users':
        return 'Organizations & User Management';
      case 'research-pipeline':
        return 'ModelOps AI Research Registry';
      case 'skills-ontology':
        return 'Skill Ontology & Knowledge Base';
      case 'platform-integrations':
        return 'Platform & API Hub';
      case 'public-benchmark':
        return 'Public Model Benchmark';
      case 'dev-design-system':
        return 'Design System Catalog';
      case 'dev-reference-match':
        return 'Reference Match Fidelity';
      case 'settings':
        return 'Settings & Security';
      default:
        return 'Dashboard';
    }
  };

  const handleExportClick = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      section: currentSection,
      role: role,
      status: 'verified',
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumio-${currentSection}-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-[#050708]/90 backdrop-blur-md border-b border-[#E7E7E2] dark:border-white/6 px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Greeting & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-full text-[#5E6460] dark:text-[#9AA7AB] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1F8FA6] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {firstName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#5E6460] dark:text-[#9AA7AB] tracking-wide">
                Hello, {firstName} 👋
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#111312] dark:text-[#F2F6F7] truncate leading-tight">
                {getSectionTitle(currentSection)}
              </h1>
            </div>
          </div>
        </div>

        {/* Middle: Command Palette Trigger Button (Ctrl/Cmd+K) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full h-9 px-3.5 rounded-full bg-[#F4F4F1] dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/10 text-xs text-[#8C928E] dark:text-[#5F6C70] flex items-center justify-between hover:border-[#1F8FA6]/50 dark:hover:border-[#1F8FA6]/50 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#5E6460] dark:text-[#9AA7AB]" />
              <span>Search candidates, jobs, skills...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 text-[10px] font-mono text-[#5E6460] dark:text-[#9AA7AB] border border-[#E7E7E2] dark:border-white/10 shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Quick Search on mobile */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-full text-[#5E6460] dark:text-[#9AA7AB] hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Date Range Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F4F1] dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/10 text-xs font-medium text-[#5E6460] dark:text-[#9AA7AB]">
            <Calendar className="w-3.5 h-3.5 text-[#1F8FA6]" />
            <span className="figure">Oct 1 – Oct 31, 2026</span>
          </div>

          {/* Export Report CTA */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportClick}
            leadingIcon={<Download />}
            className="hidden sm:inline-flex text-xs"
          >
            Export
          </Button>

          {/* Notifications Menu with unread dot */}
          <NotificationsMenu onNavigate={onNavigate} />

          {/* User Quick Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer focus:outline-none"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#1F8FA6] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {firstName.slice(0, 2).toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C928E] dark:text-[#5F6C70]" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-[18px] bg-white dark:bg-[#111719] border border-[#E7E7E2] dark:border-white/10 shadow-[0_12px_32px_rgba(17,19,18,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#E7E7E2] dark:border-white/10 mb-1">
                  <div className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">
                    {user?.name || 'Alex Chen'}
                  </div>
                  <div className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] truncate">
                    {user?.email || 'alex@resumio.ai'}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(role === 'recruiter' ? 'company-profile' : 'profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium text-[#111312] dark:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                  >
                    <User className="w-3.5 h-3.5 text-[#5E6460] dark:text-[#9AA7AB]" />
                    <span>{role === 'recruiter' ? 'Company Profile' : 'Candidate Profile'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('settings');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium text-[#111312] dark:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#5E6460] dark:text-[#9AA7AB]" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('resumio_trigger_tour'));
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium text-[#111312] dark:text-[#F2F6F7] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#1F8FA6]" />
                    <span>Product Tour & Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('dev-design-system');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium text-[#1F8FA6] dark:text-[#5FD3E8] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Design System</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-[#E7E7E2] dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium text-[#F2677A] hover:bg-[#F2677A]/10 cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
