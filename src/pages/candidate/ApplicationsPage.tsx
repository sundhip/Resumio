import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pill } from '../../components/kit/Pill';
import { StatTile } from '../../components/kit/StatTile';
import { Modal } from '../../components/kit/Overlays';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { CandidateApplicationDetailsModal } from './CandidateApplicationDetailsModal';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { CandidateApplicationItem, CandidateApplicationStats, RealApplicationStatus } from '../../types';
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Search,
  FileText,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  List,
  Video,
} from 'lucide-react';

interface ApplicationsPageProps {
  onNavigate?: (path: string, params?: Record<string, any>) => void;
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [applications, setApplications] = useState<CandidateApplicationItem[]>([]);
  const [stats, setStats] = useState<CandidateApplicationStats>({
    total: 0,
    applied: 0,
    under_review: 0,
    shortlisted: 0,
    rejected: 0,
    withdrawn: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Views
  const [activeTab, setActiveTab] = useState<'All' | RealApplicationStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'comfortable' | 'compact'>('comfortable');

  // Modals
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [withdrawAppId, setWithdrawAppId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCandidateApplications();
      if (res.success) {
        setApplications(res.applications);
        setStats(res.stats);
      }
    } catch (err: any) {
      showToast('error', 'Unable to load applications', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleConfirmWithdraw = async () => {
    if (!withdrawAppId) return;
    setIsWithdrawing(true);
    try {
      const res = await api.withdrawApplication(withdrawAppId);
      if (res.success) {
        showToast('success', 'Application Withdrawn', 'Your application has been safely withdrawn.');
        setWithdrawAppId(null);
        loadApplications();
      }
    } catch (err: any) {
      showToast('error', 'Withdrawal failed', err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatSalary = (app: CandidateApplicationItem) => {
    if (!app.salaryDisclosed || (!app.salaryMin && !app.salaryMax)) {
      return null;
    }
    const curr = app.currency === 'INR' ? '₹' : app.currency === 'USD' ? '$' : `${app.currency} `;
    if (app.salaryMin && app.salaryMax) {
      return `${curr}${app.salaryMin.toLocaleString()} – ${curr}${app.salaryMax.toLocaleString()}`;
    }
    if (app.salaryMin) {
      return `From ${curr}${app.salaryMin.toLocaleString()}`;
    }
    return `Up to ${curr}${app.salaryMax?.toLocaleString()}`;
  };

  // Helper for stage progress index
  const getStageIndex = (status: RealApplicationStatus): { current: number; isTerminal: boolean } => {
    switch (status) {
      case 'Applied':
        return { current: 0, isTerminal: false };
      case 'Under Review':
        return { current: 1, isTerminal: false };
      case 'Shortlisted':
        return { current: 2, isTerminal: false };
      case 'Rejected':
        return { current: 1, isTerminal: true };
      case 'Withdrawn':
        return { current: 0, isTerminal: true };
      default:
        return { current: 0, isTerminal: false };
    }
  };

  const getNextStepInfo = (app: CandidateApplicationItem) => {
    switch (app.status) {
      case 'Applied':
        return {
          title: 'Initial Screening in Progress',
          description: 'Your application has been delivered to the hiring team. Initial screening typically takes 2–4 business days.',
          icon: <Clock className="w-4 h-4 text-[#1F8FA6]" />,
          action: null,
        };
      case 'Under Review':
        return {
          title: 'Competency Review Underway',
          description: 'Hiring managers are evaluating your skills alignment and experience against open requisition requirements.',
          icon: <Sparkles className="w-4 h-4 text-amber-500" />,
          action: null,
        };
      case 'Shortlisted':
        return {
          title: 'Interview Stage Preparation',
          description: 'Congratulations! You have been shortlisted. Recruiter outreach and interview invitations are being scheduled.',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
          action: {
            label: 'Open Interview Hub',
            onClick: () => onNavigate?.('interviews'),
          },
        };
      case 'Rejected':
        return {
          title: 'Requisition Closed',
          description: 'The hiring team decided to proceed with other candidates. Check your Skill Gap Roadmap for suggested improvements.',
          icon: <XCircle className="w-4 h-4 text-rose-500" />,
          action: {
            label: 'View Skill Gap Roadmap',
            onClick: () => onNavigate?.('candidate-experience'),
          },
        };
      case 'Withdrawn':
        return {
          title: 'Application Withdrawn',
          description: 'You voluntarily withdrew this application. The hiring team was notified and records were archived.',
          icon: <RotateCcw className="w-4 h-4 text-slate-400" />,
          action: null,
        };
      default:
        return {
          title: 'In Progress',
          description: 'Awaiting recruiter action.',
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          action: null,
        };
    }
  };

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    const matchesTab = activeTab === 'All' || app.status === activeTab;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (app.jobTitle || '').toLowerCase().includes(query) ||
      (app.company || '').toLowerCase().includes(query) ||
      (app.location || '').toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  const stagesList = [
    { title: 'Applied', key: 'applied' },
    { title: 'Under Review', key: 'review' },
    { title: 'Shortlisted', key: 'shortlisted' },
    { title: 'Interview', key: 'interview' },
    { title: 'Decision', key: 'decision' },
  ];

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E7E2] dark:border-white/8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
              My Applications
            </h1>
            <Pill variant="micro-status" color="teal">
              <span className="figure">{stats.total}</span> Total
            </Pill>
          </div>
          <p className="text-sm text-[#5E6460] dark:text-[#9AA7AB] mt-1 font-medium">
            Real-time pipeline tracking, transparent stage progressions, and application history.
          </p>
        </div>

        {onNavigate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('jobs')}
            leftIcon={<Briefcase className="w-4 h-4" />}
          >
            Explore More Jobs
          </Button>
        )}
      </div>

      {/* FinGlow / Vestmark StatTiles Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Applications"
          value={<span className="figure">{stats.total}</span>}
          accentColor="#1F8FA6"
          hint="All submissions on platform"
        />
        <StatTile
          label="Under Review"
          value={<span className="figure">{stats.under_review}</span>}
          accentColor="#F59E0B"
          hint="Currently being evaluated"
        />
        <StatTile
          label="Shortlisted"
          value={<span className="figure">{stats.shortlisted}</span>}
          accentColor="#10B981"
          hint="Advanced to interview queue"
        />
        <StatTile
          label="Decisions & Closed"
          value={<span className="figure">{stats.rejected + stats.withdrawn}</span>}
          accentColor="#8C928E"
          hint={`${stats.rejected} closed • ${stats.withdrawn} withdrawn`}
        />
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-4 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['All', 'Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Withdrawn'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? stats.total
                : tab === 'Applied'
                ? stats.applied
                : tab === 'Under Review'
                ? stats.under_review
                : tab === 'Shortlisted'
                ? stats.shortlisted
                : tab === 'Rejected'
                ? stats.rejected
                : stats.withdrawn;

            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1F8FA6] text-white shadow-[0_2px_10px_rgba(43,179,201,0.3)]'
                    : 'bg-black/5 dark:bg-white/5 text-[#5E6460] dark:text-[#9AA7AB] hover:text-[#111312] dark:hover:text-[#F2F6F7] hover:bg-black/8 dark:hover:bg-white/8'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold figure ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-black/10 dark:bg-white/10 text-[#5E6460] dark:text-[#9AA7AB]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search by role, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-[#8C928E]" />}
            />
          </div>

          <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-[#E7E7E2] dark:border-white/8">
            <button
              type="button"
              onClick={() => setViewMode('comfortable')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'comfortable'
                  ? 'bg-white dark:bg-[#151D20] text-[#1F8FA6] shadow-2xs'
                  : 'text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
              }`}
              title="Comfortable Cards View"
              aria-label="Comfortable Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-[#151D20] text-[#1F8FA6] shadow-2xs'
                  : 'text-[#8C928E] hover:text-[#111312] dark:hover:text-[#F2F6F7]'
              }`}
              title="Compact List View"
              aria-label="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl bg-white/50 dark:bg-[#0D1214]/50 border border-[#E7E7E2] dark:border-white/8"
            />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-4 border border-[#E7E7E2] dark:border-white/8 rounded-2xl bg-white dark:bg-[#0D1214]">
          <div className="w-16 h-16 rounded-2xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center mx-auto shadow-xs">
            <Send className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              {searchQuery || activeTab !== 'All' ? 'No applications match filter criteria' : 'No applications submitted yet'}
            </h3>
            <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
              {searchQuery || activeTab !== 'All'
                ? 'Try adjusting your search query or selecting a different status tab above.'
                : 'Browse published opportunities across top companies and submit with one-click ATS verified matching.'}
            </p>
          </div>
          {searchQuery || activeTab !== 'All' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('All');
              }}
            >
              Reset Filters
            </Button>
          ) : (
            onNavigate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('jobs')}
                leftIcon={<Briefcase className="w-4 h-4" />}
              >
                Browse Job Opportunities
              </Button>
            )
          )}
        </Card>
      ) : viewMode === 'comfortable' ? (
        /* Comfortable Card View with Stage Timeline and Next Steps */
        <div className="space-y-5">
          {filteredApplications.map((app) => {
            const salary = formatSalary(app);
            const { current: currentStepIdx, isTerminal } = getStageIndex(app.status);
            const nextStep = getNextStepInfo(app);
            const canWithdraw = app.status !== 'Withdrawn' && app.status !== 'Rejected';

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 hover:border-[#1F8FA6]/40 dark:hover:border-[#1F8FA6]/30 rounded-2xl p-5 sm:p-6 shadow-2xs transition-all duration-200 space-y-5"
              >
                {/* Top Row: Monogram, Title, Company, Meta, Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1F8FA6]/10 to-[#1F8FA6]/20 border border-[#1F8FA6]/25 flex items-center justify-center text-[#1F8FA6] font-extrabold text-lg shrink-0 shadow-2xs">
                      {(app.company || 'C').charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
                          {app.jobTitle}
                        </h3>
                        <ApplicationStatusBadge status={app.status} size="sm" showDot />
                      </div>

                      <div className="flex items-center gap-x-3 gap-y-1 text-xs text-[#5E6460] dark:text-[#9AA7AB] flex-wrap font-medium">
                        <span className="flex items-center gap-1 font-semibold text-[#111312] dark:text-[#F2F6F7]">
                          <Building2 className="w-3.5 h-3.5 text-[#1F8FA6]" />
                          {app.company}
                        </span>
                        <span>•</span>
                        <span>{app.location || 'Remote'} ({app.workMode})</span>
                        <span>•</span>
                        <span>{app.employmentType}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8C928E]" />
                          Applied {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {salary && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-[#1F8FA6] dark:text-[#5FD3E8] figure">
                              {salary}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {canWithdraw && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setWithdrawAppId(app.id)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        Withdraw
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedApplicationId(app.id)}
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Horizontal Stage Timeline */}
                <div className="pt-2 pb-1">
                  <div className="text-[10px] font-bold text-[#8C928E] dark:text-[#5F6C70] uppercase tracking-wider mb-3">
                    Application Progression
                  </div>
                  <div className="relative flex items-center justify-between w-full">
                    {stagesList.map((stage, idx) => {
                      const isPassed = !isTerminal && idx < currentStepIdx;
                      const isCurrent = !isTerminal && idx === currentStepIdx;
                      const isTerminatedHere = isTerminal && idx === currentStepIdx;
                      const isFuture = !isTerminal && idx > currentStepIdx;

                      return (
                        <React.Fragment key={stage.key}>
                          <div className="flex flex-col items-center relative z-10">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                                isTerminatedHere
                                  ? app.status === 'Withdrawn'
                                    ? 'bg-slate-500 text-white shadow-xs'
                                    : 'bg-rose-500 text-white shadow-xs'
                                  : isPassed
                                  ? 'bg-[#1F8FA6] text-white shadow-[0_2px_8px_rgba(43,179,201,0.35)]'
                                  : isCurrent
                                  ? 'border-2 border-[#1F8FA6] text-[#1F8FA6] bg-transparent ring-4 ring-[#1F8FA6]/20 font-extrabold'
                                  : 'border border-[#E7E7E2] dark:border-white/15 bg-white dark:bg-[#151D20] text-[#8C928E] dark:text-[#5F6C70]'
                              }`}
                            >
                              {isPassed ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isTerminatedHere ? (
                                app.status === 'Withdrawn' ? (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <span
                              className={`text-[11px] font-semibold mt-1.5 whitespace-nowrap ${
                                isCurrent
                                  ? 'text-[#1F8FA6] dark:text-[#5FD3E8]'
                                  : isPassed
                                  ? 'text-[#111312] dark:text-[#F2F6F7]'
                                  : isTerminatedHere
                                  ? 'text-rose-500 dark:text-rose-400 font-bold'
                                  : 'text-[#8C928E] dark:text-[#5F6C70]'
                              }`}
                            >
                              {stage.title}
                            </span>
                          </div>

                          {idx < stagesList.length - 1 && (
                            <div
                              className={`flex-1 h-0.5 mx-2 transition-colors duration-200 ${
                                isPassed
                                  ? 'bg-[#1F8FA6]'
                                  : 'bg-[#E7E7E2] dark:bg-white/10'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Next Step & Resume Snapshot Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Next Step Callout */}
                  <div className="md:col-span-2 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-[#151D20] border border-[#E7E7E2] dark:border-white/10 shadow-2xs shrink-0 mt-0.5">
                      {nextStep.icon}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center justify-between gap-2">
                        <span>{nextStep.title}</span>
                        {nextStep.action && (
                          <button
                            type="button"
                            onClick={nextStep.action.onClick}
                            className="text-[11px] font-semibold text-[#1F8FA6] dark:text-[#5FD3E8] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{nextStep.action.label}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                        {nextStep.description}
                      </p>
                    </div>
                  </div>

                  {/* Submitted Resume Snapshot */}
                  <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-[10px] font-bold text-[#8C928E] dark:text-[#5F6C70] uppercase tracking-wider block">
                        Submitted Resume
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-[#111312] dark:text-[#F2F6F7] truncate">
                        <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{app.resumeFilename}</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedApplicationId(app.id)}
                      className="text-[11px] px-2 py-1 shrink-0"
                    >
                      History
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-[#E7E7E2] dark:border-white/8 text-[#5E6460] dark:text-[#9AA7AB] font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Role & Company</th>
                  <th className="p-3.5">Applied Date</th>
                  <th className="p-3.5">Pipeline Stage</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Resume</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E7E2] dark:divide-white/8">
                {filteredApplications.map((app) => {
                  const { current: currentStepIdx, isTerminal } = getStageIndex(app.status);
                  const canWithdraw = app.status !== 'Withdrawn' && app.status !== 'Rejected';

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                    >
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-[#111312] dark:text-[#F2F6F7]">
                          {app.jobTitle}
                        </div>
                        <div className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-1 font-medium">
                          <span>{app.company}</span>
                          <span>•</span>
                          <span>{app.location || 'Remote'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-[#5E6460] dark:text-[#9AA7AB]">
                        {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-1.5 w-5 rounded-full ${
                                !isTerminal && step <= currentStepIdx
                                  ? 'bg-[#1F8FA6]'
                                  : isTerminal && step <= currentStepIdx
                                  ? app.status === 'Withdrawn'
                                    ? 'bg-slate-400'
                                    : 'bg-rose-400'
                                  : 'bg-[#E7E7E2] dark:bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <ApplicationStatusBadge status={app.status} size="sm" showDot />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-[11px] text-[#5E6460] dark:text-[#9AA7AB] max-w-[140px] truncate">
                          <FileText className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{app.resumeFilename}</span>
                        </div>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canWithdraw && (
                            <button
                              type="button"
                              onClick={() => setWithdrawAppId(app.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer"
                            >
                              Withdraw
                            </button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedApplicationId(app.id)}
                            className="text-xs"
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApplicationId && (
        <CandidateApplicationDetailsModal
          applicationId={selectedApplicationId}
          isOpen={Boolean(selectedApplicationId)}
          onClose={() => setSelectedApplicationId(null)}
          onWithdrawSuccess={loadApplications}
        />
      )}

      {/* Withdraw Confirmation Modal */}
      {withdrawAppId && (
        <Modal
          isOpen={Boolean(withdrawAppId)}
          onClose={() => setWithdrawAppId(null)}
          title="Withdraw Application"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Withdrawing your application will notify the recruiter and remove your resume from the active evaluation queue. You can re-apply if the position remains open.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWithdrawAppId(null)}
                disabled={isWithdrawing}
              >
                Keep Application
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmWithdraw}
                isLoading={isWithdrawing}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Confirm Withdrawal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
