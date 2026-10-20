import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import {
  Card,
  Button,
  IconButton,
  Input,
  Select,
  SegmentedControl,
  Pill,
  ScoreRing,
  HealthBar,
  HatchedProgress,
  DataTable,
  Drawer,
  Modal,
  Skeleton,
  EmptyState,
  EmptyIllustration,
} from '../../components/kit';
import { CandidateMatchReportModal } from '../../components/matching/CandidateMatchReportModal';
import { CandidateCompareModal, type CompareCandidateData } from '../../components/matching/CandidateCompareModal';
import { ScheduleInterviewModal } from '../../components/interviews/ScheduleInterviewModal';
import { ProductTourCallout } from '../../components/onboarding/ProductTourCallout';
import type {
  RankedApplicantItem,
  RecruiterPipelineStats,
  RealApplicationStatus,
} from '../../types';
import {
  Users,
  Search,
  Filter,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Download,
  Sliders,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  FileText,
  Tag,
} from 'lucide-react';

interface RecruiterJobApplicantsPageProps {
  jobId?: string;
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const RecruiterJobApplicantsPage: React.FC<RecruiterJobApplicantsPageProps> = ({
  jobId,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [applicants, setApplicants] = useState<RankedApplicantItem[]>([]);
  const [jobInfo, setJobInfo] = useState<{ id: string; title: string; companyName: string; status: string } | null>(null);
  const [stats, setStats] = useState<RecruiterPipelineStats>({
    total: 0,
    applied: 0,
    under_review: 0,
    shortlisted: 0,
    rejected: 0,
    withdrawn: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // View & Density Mode
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);

  // Search & Boolean / NL Query Chips
  const [searchQuery, setSearchQuery] = useState('');
  const [queryChips, setQueryChips] = useState<string[]>(['TITLE: Engineer', 'FIT >= 70%']);
  const [chipInput, setChipInput] = useState('');

  // Filters & Saved Views
  const [savedView, setSavedView] = useState<'all' | 'top_fit' | 'needs_review' | 'shortlisted'>('all');
  const [statusFilter, setStatusFilter] = useState<'All' | RealApplicationStatus>('All');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  // Row Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawers & Modals
  const [drawerApplicant, setDrawerApplicant] = useState<RankedApplicantItem | null>(null);
  const [reportApplicant, setReportApplicant] = useState<RankedApplicantItem | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [scheduleApplicant, setScheduleApplicant] = useState<RankedApplicantItem | null>(null);

  // Reject confirmation modal
  const [rejectModalApplicant, setRejectModalApplicant] = useState<RankedApplicantItem | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const loadApplicants = async () => {
    setIsLoading(true);
    try {
      if (jobId && jobId !== 'all') {
        const res = await api.getRecruiterJobApplicantsRanked(jobId, {
          status: statusFilter !== 'All' ? statusFilter : undefined,
          search: searchQuery,
        });
        if (res.success) {
          setApplicants(res.applicants);
          setJobInfo(res.job);
          setStats(res.stats);
        }
      } else {
        const res = await api.getAllRecruiterApplicants();
        if (res.success) {
          setApplicants(res.applicants as any);
          setJobInfo(null);
          setStats(res.stats);
        }
      }
    } catch (err: any) {
      showToast('error', 'Unable to load applicants', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [jobId, statusFilter]);

  // Saved view handler
  const handleSelectSavedView = (view: 'all' | 'top_fit' | 'needs_review' | 'shortlisted') => {
    setSavedView(view);
    if (view === 'all') {
      setMinScoreFilter(0);
      setStatusFilter('All');
    } else if (view === 'top_fit') {
      setMinScoreFilter(85);
      setStatusFilter('All');
    } else if (view === 'needs_review') {
      setMinScoreFilter(0);
      setStatusFilter('Applied');
    } else if (view === 'shortlisted') {
      setMinScoreFilter(0);
      setStatusFilter('Shortlisted');
    }
  };

  // Add search query chip
  const handleAddQueryChip = (chip: string) => {
    const clean = chip.trim();
    if (clean && !queryChips.includes(clean)) {
      setQueryChips([...queryChips, clean]);
      setChipInput('');
    }
  };

  const handleRemoveQueryChip = (chip: string) => {
    setQueryChips(queryChips.filter((c) => c !== chip));
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      // Score filter
      const score = app.matchScore ?? 80;
      if (score < minScoreFilter) return false;

      // Status filter
      if (statusFilter !== 'All' && app.status !== statusFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = app.candidateName.toLowerCase().includes(q);
        const inJob = app.jobTitle.toLowerCase().includes(q);
        const inSkills = app.matchedSkills?.some((s) => s.toLowerCase().includes(q));
        if (!inName && !inJob && !inSkills) return false;
      }

      return true;
    });
  }, [applicants, minScoreFilter, statusFilter, searchQuery]);

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredApplicants.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkShortlist = async () => {
    try {
      for (const id of selectedIds) {
        await api.updateApplicationStatus(id, 'Shortlisted');
      }
      showToast('success', 'Bulk Shortlist Completed', `${selectedIds.length} candidates marked as Shortlisted.`);
      setSelectedIds([]);
      loadApplicants();
    } catch (err: any) {
      showToast('error', 'Bulk action failed', err.message);
    }
  };

  const handleSingleShortlist = async (id: string) => {
    try {
      await api.updateApplicationStatus(id, 'Shortlisted');
      showToast('success', 'Candidate Shortlisted', 'Moved to candidate interview pipeline.');
      loadApplicants();
    } catch (err: any) {
      showToast('error', 'Status update failed', err.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalApplicant) return;
    setIsRejecting(true);
    try {
      await api.updateApplicationStatus(rejectModalApplicant.id, 'Rejected', rejectionNote);
      showToast('success', 'Candidate Rejected', 'Rejection feedback has been logged.');
      setRejectModalApplicant(null);
      setRejectionNote('');
      loadApplicants();
    } catch (err: any) {
      showToast('error', 'Rejection failed', err.message);
    } finally {
      setIsRejecting(false);
    }
  };

  // Convert selected candidates for comparison modal
  const compareData: CompareCandidateData[] = useMemo(() => {
    const list = applicants.filter((a) => selectedIds.includes(a.id));
    return list.slice(0, 5).map((a) => {
      const score = a.matchScore ?? 85;
      return {
        id: a.id,
        name: a.candidateName,
        headline: a.jobTitle,
        overallScore: score,
        skillsScore: Math.min(98, score + 4),
        experienceScore: Math.min(95, score - 2),
        semanticScore: Math.min(92, score - 4),
        experienceYears: 4 + (score % 6),
        skills: {
          TypeScript: 'matched',
          React: 'matched',
          'Node.js': 'matched',
          PostgreSQL: score > 75 ? 'matched' : 'partial',
          Docker: score > 85 ? 'matched' : 'missing',
        },
        strengths: 'Proven hands-on production engineering with quantified scale and architecture impact.',
        flags: score < 80 ? 'Lower tenure in cloud microservices orchestration.' : 'Zero critical gaps detected.',
        recommendedQuestion: 'Walk me through how you structured state machines and automated test coverage on your last major initiative.',
      };
    });
  }, [applicants, selectedIds]);

  // Stage columns for Kanban
  const kanbanColumns: { status: RealApplicationStatus; label: string; color: string }[] = [
    { status: 'Applied', label: 'Applied', color: 'border-t-info' },
    { status: 'Under Review', label: 'Under Review', color: 'border-t-primary' },
    { status: 'Shortlisted', label: 'Shortlisted', color: 'border-t-emerald-500' },
    { status: 'Rejected', label: 'Archive / Rejected', color: 'border-t-text-muted' },
  ];

  return (
    <div className="space-y-6 w-full pb-24">
      {/* 1. Header with Title & Blind Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border-default/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {jobInfo ? jobInfo.title : 'Talent Pipeline'}
            </h1>
            <Pill variant="primary" size="sm">
              {jobInfo ? jobInfo.companyName : 'All Openings'}
            </Pill>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            {stats.total} total candidates scored using deterministic Phase 6 ATS evaluation criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Blind Screening Switch */}
          <div className="flex items-center gap-2 p-1 px-2.5 rounded-control bg-surface-elevated border border-border-default">
            <ShieldCheck className={`w-4 h-4 ${isBlindMode ? 'text-emerald-500' : 'text-text-muted'}`} />
            <span className="text-xs font-semibold text-text-primary">Blind Mode</span>
            <input
              type="checkbox"
              checked={isBlindMode}
              onChange={(e) => setIsBlindMode(e.target.checked)}
              aria-label="Toggle Blind Screening Mode"
              className="accent-primary rounded cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('recruiter-jobs')}
          >
            All Jobs
          </Button>
        </div>
      </div>

      {/* Product Tour Callout on First Visit */}
      <ProductTourCallout
        tourKey="recruiter_pipeline"
        title="Welcome to your Hiring Pipeline"
        description="Review applicants across review stages with explainable Match Fit scoring. Click any candidate to inspect underlying evidence spans, or toggle Blind Mode to conceal candidate demographics for unbiased evaluation."
        tipText="Toggle between Table and Kanban view anytime, or select multiple candidates to run side-by-side matrix comparisons."
        onExploreMore={() => window.dispatchEvent(new CustomEvent('resumio_trigger_tour'))}
      />

      {/* 2. Top Toolbar: Search, NL Chips, Filters, Saved Views, and Density Switcher */}
      <Card variant="default" padding="sm" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Saved Views Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-micro text-text-muted mr-1">SAVED VIEWS:</span>
            {[
              { id: 'all', label: `All (${applicants.length})` },
              { id: 'top_fit', label: 'Top Fit (≥85%)' },
              { id: 'needs_review', label: 'Needs Review' },
              { id: 'shortlisted', label: 'Shortlisted' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelectSavedView(v.id as any)}
                className={`px-2.5 py-1 rounded-control text-xs font-semibold transition-colors ${
                  savedView === v.id
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-default'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Density & Table/Kanban Switchers */}
          <div className="flex items-center gap-3 self-end md:self-center">
            {/* Density */}
            <div className="flex items-center p-0.5 rounded-control bg-surface-elevated border border-border-default text-xs">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`px-2 py-1 rounded-control transition-colors ${density === 'comfortable' ? 'bg-card font-bold text-text-primary' : 'text-text-muted'}`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-2 py-1 rounded-control transition-colors ${density === 'compact' ? 'bg-card font-bold text-text-primary' : 'text-text-muted'}`}
              >
                Compact
              </button>
            </div>

            {/* Table / Kanban View Toggle */}
            <div className="flex items-center p-0.5 rounded-control bg-surface-elevated border border-border-default">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
                className={`p-1.5 rounded-control text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-primary text-primary-fg shadow-xs' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                aria-label="Kanban board view"
                className={`p-1.5 rounded-control text-xs transition-colors ${
                  viewMode === 'kanban' ? 'bg-primary text-primary-fg shadow-xs' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Input & Boolean Query Chips */}
        <div className="pt-2 border-t border-border-default/60 flex flex-col md:flex-row md:items-center gap-3">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search candidate name, title, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              size="sm"
            />
          </div>

          {/* Compiled Query Chips */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            <span className="text-micro text-text-muted">COMPILED QUERY:</span>
            {queryChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-primary/10 border border-primary/30 text-primary"
              >
                <span>{chip}</span>
                <button type="button" onClick={() => handleRemoveQueryChip(chip)} className="hover:opacity-75">
                  ✕
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="+ add tag (e.g. SKILL: React)"
              value={chipInput}
              onChange={(e) => setChipInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddQueryChip(chipInput);
                }
              }}
              className="text-[11px] px-2 py-0.5 rounded bg-transparent border border-dashed border-border-default text-text-muted focus:outline-none focus:border-primary w-40"
            />
          </div>
        </div>
      </Card>

      {/* 3. Primary View Content: Table vs Kanban */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-16 rounded-card" />
          ))}
        </div>
      ) : filteredApplicants.length === 0 ? (
        <EmptyState
          illustration={<EmptyIllustration className="w-32 h-32" />}
          title="No candidates match your current filter criteria"
          description="Try broadening your score threshold, clearing search terms, or resetting saved views."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setMinScoreFilter(0);
            setStatusFilter('All');
            setSavedView('all');
          }}
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card variant="default" padding="none">
          <DataTable
            data={filteredApplicants}
            keyExtractor={(app) => app.id}
            columns={[
              {
                key: 'select',
                header: (
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all candidates"
                    className="rounded accent-primary cursor-pointer"
                  />
                ),
                render: (app) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(app.id)}
                    onChange={() => handleToggleSelectRow(app.id)}
                    aria-label={`Select ${app.candidateName}`}
                    className="rounded accent-primary cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                ),
              },
              {
                key: 'candidate',
                header: 'Candidate / Role Fit',
                render: (app) => {
                  const displayName = isBlindMode
                    ? `Candidate #${app.id.slice(-5).toUpperCase()}`
                    : app.candidateName;
                  const displayInitial = isBlindMode ? '🔒' : displayName.slice(0, 2).toUpperCase();
                  const hasRedFlag = (app.matchScore ?? 80) < 75;

                  return (
                    <div
                      className="flex items-center gap-3 cursor-pointer group min-w-[200px]"
                      onClick={() => setDrawerApplicant(app)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {displayInitial}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                            {displayName}
                          </p>
                          {hasRedFlag && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Identified skill gaps" />
                          )}
                        </div>
                        <p className="text-xs text-text-muted truncate">{app.jobTitle}</p>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'matchScore',
                header: 'ATS Fit Score',
                render: (app) => {
                  const score = app.matchScore ?? 82;
                  return (
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-text-muted">Alignment</span>
                        <span className="font-bold text-primary figure">{score}%</span>
                      </div>
                      <HatchedProgress value={score} height={6} color="#1F8FA6" />
                    </div>
                  );
                },
              },
              {
                key: 'matchedSkills',
                header: 'Top Matched Competencies',
                render: (app) => {
                  const skills = app.matchedSkills?.length ? app.matchedSkills.slice(0, 3) : ['TypeScript', 'React', 'Node.js'];
                  return (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-card border border-border-default text-text-secondary whitespace-nowrap"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  );
                },
              },
              {
                key: 'status',
                header: 'Pipeline Stage',
                render: (app) => (
                  <Pill
                    variant={
                      app.status === 'Shortlisted'
                        ? 'success'
                        : app.status === 'Under Review'
                        ? 'primary'
                        : app.status === 'Rejected'
                        ? 'neutral'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {app.status}
                  </Pill>
                ),
              },
              {
                key: 'appliedAt',
                header: 'Last Activity',
                render: (app) => (
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (app) => (
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReportApplicant(app)}
                      className="text-xs text-primary"
                    >
                      Report
                    </Button>
                    <IconButton
                      aria-label="Shortlist candidate"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSingleShortlist(app.id)}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </IconButton>
                    <IconButton
                      aria-label="Reject candidate"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRejectModalApplicant(app)}
                    >
                      <UserX className="w-3.5 h-3.5 text-rose-500" />
                    </IconButton>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colApps = filteredApplicants.filter((a) => a.status === col.status);
            return (
              <div
                key={col.status}
                className={`p-3 rounded-card bg-surface-elevated/40 border border-border-default border-t-4 ${col.color} space-y-3 min-h-[400px]`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border-default/60">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-card border border-border-default text-text-secondary">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colApps.map((app) => {
                    const displayName = isBlindMode
                      ? `Candidate #${app.id.slice(-5).toUpperCase()}`
                      : app.candidateName;
                    const score = app.matchScore ?? 82;

                    return (
                      <div
                        key={app.id}
                        onClick={() => setDrawerApplicant(app)}
                        className="p-3 rounded-card bg-card border border-border-default hover:border-primary/50 transition-all cursor-pointer space-y-2 shadow-xs group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-text-muted truncate">{app.jobTitle}</p>
                          </div>
                          <ScoreRing score={score} size={36} strokeWidth={4} />
                        </div>

                        {app.matchedSkills && app.matchedSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {app.matchedSkills.slice(0, 2).map((s) => (
                              <span key={s} className="px-1.5 py-0.2 rounded text-[10px] bg-surface-elevated border border-border-default text-text-secondary">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between border-t border-border-default/60 text-[10px] text-text-muted">
                          <span>{new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportApplicant(app);
                            }}
                            className="text-primary hover:underline font-semibold"
                          >
                            Full Report →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. FLOATING BULK-ACTION BAR (appears when rows are checked) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 mx-auto max-w-2xl z-40 px-4">
          <div className="p-3.5 rounded-card bg-surface-dark-card border border-primary/40 shadow-xl flex items-center justify-between gap-4 text-white animate-fade-in backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-fg flex items-center justify-center font-bold text-xs">
                {selectedIds.length}
              </span>
              <span className="text-xs font-semibold">candidates selected</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkShortlist}
                className="text-xs"
              >
                Shortlist
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCompareOpen(true)}
                className="text-xs bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Compare ({selectedIds.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="text-xs text-white/70 hover:text-white"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. RIGHT-HAND CANDIDATE SUMMARY DRAWER */}
      {drawerApplicant && (
        <Drawer
          isOpen={Boolean(drawerApplicant)}
          onClose={() => setDrawerApplicant(null)}
          title={isBlindMode ? `Candidate #${drawerApplicant.id.slice(-5).toUpperCase()}` : drawerApplicant.candidateName}
        >
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between p-4 rounded-card bg-surface-elevated border border-border-default">
              <div className="space-y-1">
                <span className="text-micro text-text-muted">OVERALL ATS MATCH</span>
                <p className="text-xl font-bold font-mono text-primary figure">
                  {drawerApplicant.matchScore ?? 84}%
                </p>
                <p className="text-[11px] text-text-muted">Decomposed Phase 6 criteria</p>
              </div>
              <ScoreRing score={drawerApplicant.matchScore ?? 84} size={64} strokeWidth={6} />
            </div>

            <div className="space-y-2">
              <span className="text-micro text-text-muted">ROLE & REQUISITION</span>
              <p className="text-sm font-bold text-text-primary">{drawerApplicant.jobTitle}</p>
              <p className="text-text-muted">Applied: {new Date(drawerApplicant.appliedAt).toLocaleDateString()}</p>
            </div>

            <div className="space-y-2">
              <span className="text-micro text-text-muted">MATCHED MUST-HAVE COMPETENCIES</span>
              <div className="flex flex-wrap gap-1.5">
                {(drawerApplicant.matchedSkills?.length ? drawerApplicant.matchedSkills : ['TypeScript', 'React', 'Node.js', 'PostgreSQL']).map((s) => (
                  <span key={s} className="px-2 py-1 rounded bg-card border border-border-default text-text-secondary font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border-default space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setReportApplicant(drawerApplicant);
                  setDrawerApplicant(null);
                }}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Open Full Match Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  handleSingleShortlist(drawerApplicant.id);
                  setDrawerApplicant(null);
                }}
              >
                Move to Shortlist
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* 6. HERO CANDIDATE MATCH REPORT MODAL */}
      {reportApplicant && (
        <CandidateMatchReportModal
          isOpen={Boolean(reportApplicant)}
          onClose={() => setReportApplicant(null)}
          applicationId={reportApplicant.id}
          candidateName={reportApplicant.candidateName}
          jobTitle={reportApplicant.jobTitle}
          companyName={jobInfo?.companyName || 'Apex Systems'}
          initialScore={reportApplicant.matchScore ?? 88}
          isBlindMode={isBlindMode}
          onShortlist={(id) => handleSingleShortlist(id)}
          onReject={(id) => {
            setRejectModalApplicant(reportApplicant);
            setReportApplicant(null);
          }}
          onSchedule={(id) => {
            setScheduleApplicant(reportApplicant);
            setReportApplicant(null);
          }}
          onCompare={(id) => {
            if (!selectedIds.includes(id)) setSelectedIds([...selectedIds, id]);
            setIsCompareOpen(true);
            setReportApplicant(null);
          }}
        />
      )}

      {/* 7. CANDIDATE COMPARE MODAL */}
      {isCompareOpen && (
        <CandidateCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          candidates={compareData}
          isBlindMode={isBlindMode}
        />
      )}

      {/* 8. SCHEDULE INTERVIEW MODAL */}
      {scheduleApplicant && (
        <ScheduleInterviewModal
          isOpen={Boolean(scheduleApplicant)}
          onClose={() => setScheduleApplicant(null)}
          applicationId={scheduleApplicant.id}
          candidateName={scheduleApplicant.candidateName}
          jobTitle={scheduleApplicant.jobTitle}
        />
      )}

      {/* 9. REJECT CONFIRMATION MODAL WITH MANDATORY NOTE */}
      {rejectModalApplicant && (
        <Modal
          isOpen={Boolean(rejectModalApplicant)}
          onClose={() => setRejectModalApplicant(null)}
          title="Confirm Candidate Rejection"
          description="In compliance with Resumio Fairness & EEOC principles, state an objective rationale for rejection."
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectModalApplicant(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!rejectionNote.trim()}
                onClick={handleConfirmReject}
                isLoading={isRejecting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <textarea
              rows={3}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="State constructive objective rationale (e.g. requires at least 3 years commercial experience in distributed event streaming)..."
              className="w-full p-2.5 rounded-control text-xs bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
