import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from '../shared/CommandPalette';
import {
  LayoutDashboard,
  Briefcase,
  Send,
  Compass,
  Layers,
  Search,
  Users,
  Database,
  Menu,
} from 'lucide-react';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl/Cmd + K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mobile Bottom Tab Bar items per role
  const getMobileTabs = () => {
    switch (role) {
      case 'recruiter':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'recruiter-workspace', label: 'Pipeline', icon: <Layers className="w-5 h-5" /> },
          { id: 'recruiter-jobs', label: 'Jobs', icon: <Briefcase className="w-5 h-5" /> },
          { id: 'recruiter-ai-search', label: 'Search', icon: <Search className="w-5 h-5" /> },
        ];
      case 'candidate':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-5 h-5" /> },
          { id: 'applications', label: 'Applied', icon: <Send className="w-5 h-5" /> },
          { id: 'candidate-experience', label: 'Career', icon: <Compass className="w-5 h-5" /> },
        ];
      case 'admin':
      default:
        return [
          { id: 'dashboard', label: 'System', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'admin-users', label: 'Users', icon: <Users className="w-5 h-5" /> },
          { id: 'research-pipeline', label: 'AI ModelOps', icon: <Database className="w-5 h-5" /> },
        ];
    }
  };

  const mobileTabs = getMobileTabs();

  return (
    <div className="w-screen min-h-screen bg-[#F4F4F1] dark:bg-[#050708] text-[#111312] dark:text-[#F2F6F7] flex transition-colors overflow-x-hidden relative">
      {/* Sidebar (248px expanded, 72px collapsed) */}
      <Sidebar
        activePath={currentPath}
        onNavigate={onNavigate}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[248px] w-full min-h-screen pb-16 lg:pb-0 transition-all duration-300">
        {/* Topbar */}
        <Topbar
          currentSection={currentPath}
          onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Content Area */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in box-border">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (390px responsive) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-30 lg:hidden h-16 bg-white/95 dark:bg-[#080B0C]/95 backdrop-blur-md border-t border-[#E7E7E2] dark:border-white/10 flex items-center justify-around px-2"
      >
        {mobileTabs.map((tab) => {
          const isActive = currentPath === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer select-none ${
                isActive
                  ? 'text-[#1F8FA6] dark:text-[#5FD3E8] font-bold'
                  : 'text-[#8C928E] dark:text-[#5F6C70] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-[#1F8FA6]/15 text-[#1F8FA6] dark:text-[#5FD3E8]' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{tab.label}</span>
            </button>
          );
        })}

        {/* Mobile More / Menu Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 text-[#8C928E] dark:text-[#5F6C70] hover:text-[#111312] dark:hover:text-[#F2F6F7] cursor-pointer"
        >
          <div className="p-1">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Menu</span>
        </button>
      </nav>

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
