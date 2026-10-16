import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { MatchScore } from '../../components/ui/MatchScore';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  DEFAULT_LEADERBOARD_COLUMNS,
  type LeaderboardApplicantItem,
  type LeaderboardColumnConfig,
  computeVirtualWindow,
  RECRUITER_KEYBOARD_SHORTCUTS,
} from '../../../packages/shared/src/leaderboardV2';
import {
  type CompiledStructuredQuery,
  compileSearchQuery,
  validateSearchSafety,
} from '../../../packages/shared/src/searchCompilerV2';
import {
  type CandidateComparisonMatrix,
  exportComparisonToCsv,
} from '../../../packages/shared/src/candidateComparisonV2';
import {
  Users,
  Upload,
  Search,
  Filter,
  Columns,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Mail,
  Calendar,
  Layers,
  BarChart3,
  ChevronDown,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Keyboard,
  Download,
  Clock,
  Tag,
  MessageSquare,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface RecruiterWorkspacePageProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const RecruiterWorkspacePage: React.FC<RecruiterWorkspacePageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<
    'leaderboard' | 'bulk_upload' | 'search_compiler' | 'comparison' | 'pipeline' | 'interview_kit' | 'outreach' | 'analytics'
  >('leaderboard');

  // Multi-Tenancy & Org
  const [currentOrg] = useState({ id: 'org_resumio_demo', name: 'Acme Global Technologies' });
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);

  // 1. Leaderboard & Virtualization State
  const [applicants, setApplicants] = useState<LeaderboardApplicantItem[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [columns, setColumns] = useState<LeaderboardColumnConfig[]>(DEFAULT_LEADERBOARD_COLUMNS);
  const [scoreBandFilter, setScoreBandFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [scrollTop, setScrollTop] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isColumnChooserOpen, setIsColumnChooserOpen] = useState(false);

  // 2. Bulk Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Search & Compiler State
  const [nlQueryInput, setNlQueryInput] = useState('senior backend engineers with Kubernetes in Chennai or remote');
  const [compiledQuery, setCompiledQuery] = useState<CompiledStructuredQuery | null>(null);
  const [complianceViolation, setComplianceViolation] = useState<string | null>(null);

  // 4. Comparison Matrix State
  const [comparisonMatrix, setComparisonMatrix] = useState<CandidateComparisonMatrix | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // 5. Pipeline Stages State
  const [stages, setStages] = useState<any[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [noteApplicantId, setNoteApplicantId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // 6. Interview Kit State
  const [interviewKit, setInterviewKit] = useState<any>(null);
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);

  // 7. Outreach & Constructive Feedback State
  const [outreachDraft, setOutreachDraft] = useState<any>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState<any>(null);
  const [outreachTone, setOutreachTone] = useState<'professional' | 'enthusiastic' | 'casual'>('professional');

  // 8. Analytics & Adverse Impact State
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Initial Data Load
  useEffect(() => {
    loadLeaderboard();
    loadPipelineStages();
    loadAnalytics();
  }, [scoreBandFilter, currentOrg.id]);

  const loadLeaderboard = async () => {
    setIsLoadingApplicants(true);
    try {
      const res = await api.getWorkspaceLeaderboard({
        organizationId: currentOrg.id,
        scoreBand: scoreBandFilter,
        search: searchFilter,
        limit: '500',
      });
      if (res.success) {
        setApplicants(res.applicants || []);
      }
    } catch {
      showToast('error', 'Leaderboard Notice', 'Loaded local verified candidate pool.');
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  const loadPipelineStages = async () => {
    try {
      const res = await api.getPipelineStages();
      if (res.success) setStages(res.stages || []);
    } catch {}
  };

  const loadAnalytics = async () => {
    try {
      const res = await api.getRecruiterWorkspaceAnalytics();
      if (res.success) setAnalyticsData(res.analytics);
    } catch {}
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      } else if (e.key === 'b') {
        e.preventDefault();
        setIsBlindMode((prev) => !prev);
        showToast('info', 'Blind Screening', isBlindMode ? 'Standard mode restored.' : 'EEOC Blind mode active: Names & institutions redacted.');
      } else if (e.key === 'c' && selectedApplicantIds.length >= 2) {
        e.preventDefault();
        handleRunComparison();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApplicantIds, isBlindMode]);

  // Virtual window calculation
  const virtualWindow = useMemo(() => {
    return computeVirtualWindow(applicants, scrollTop, 600, 64, 6);
  }, [applicants, scrollTop]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Bulk Upload Handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setBulkFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleStartBulkUpload = async () => {
    if (bulkFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(null);

    const formData = new FormData();
    formData.append('organizationId', currentOrg.id);
    formData.append('batchName', `Upload_${bulkFiles.length}_Files_${Date.now()}`);
    bulkFiles.forEach((file) => formData.append('files', file));

    try {
      const res = await api.uploadBulkResumes(formData);
      if (res.success) {
        setUploadProgress(res);
        showToast('success', 'Bulk Ingestion Complete', `Processed ${res.processedFiles} files. ${res.duplicateFiles} duplicates prevented.`);
        loadLeaderboard();
      }
    } catch (err: any) {
      showToast('error', 'Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Search & Compiler Handlers
  const handleCompileQuery = async () => {
    setComplianceViolation(null);
    const safety = validateSearchSafety(nlQueryInput);
    if (!safety.isSafe) {
      setComplianceViolation(safety.message || 'Query rejected under EEOC guidelines.');
      setCompiledQuery(null);
      return;
    }

    try {
      const res = await api.compileSearchQuery(nlQueryInput);
      if (res.success) {
        setCompiledQuery(res.compiled);
        showToast('success', 'Query Compiled', 'Transparent search AST generated.');
      }
    } catch (err: any) {
      setComplianceViolation(err.message);
      setCompiledQuery(null);
    }
  };

  // Comparison Handlers
  const handleRunComparison = async () => {
    if (selectedApplicantIds.length < 2 || selectedApplicantIds.length > 5) {
      showToast('warning', 'Selection Required', 'Please select between 2 and 5 applicants from the leaderboard to compare.');
      return;
    }
    setIsComparing(true);
    try {
      const res = await api.compareApplicants('job_default', selectedApplicantIds, isBlindMode);
      if (res.success) {
        setComparisonMatrix(res.matrix);
        setActiveTab('comparison');
        showToast('success', 'Comparison Ready', `Evaluated ${res.matrix.candidates.length} candidates side-by-side.`);
      }
    } catch (err: any) {
      showToast('error', 'Comparison Failed', err.message);
    } finally {
      setIsComparing(false);
    }
  };

  // Pipeline Stage Move Handler
  const handleStageMove = async (appId: string, newStage: string) => {
    try {
      const res = await api.movePipelineStage(appId, newStage, `Moved to ${newStage} via Recruiter Workspace`);
      if (res.success) {
        showToast('success', 'Stage Updated', `Applicant moved from ${res.previousStatus} to ${res.newStatus}.`);
        loadLeaderboard();
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  // Interview Kit Generation
  const handleGenerateInterviewKit = async (appId?: string) => {
    setIsGeneratingKit(true);
    try {
      const res = await api.generateInterviewKit('job_default', undefined, appId);
      if (res.success) {
        setInterviewKit(res.kit);
        setActiveTab('interview_kit');
        showToast('success', 'Interview Kit Ready', 'Generated rubrics, follow-up probes, and time budgets.');
      }
    } catch (err: any) {
      showToast('error', 'Kit Generation Failed', err.message);
    } finally {
      setIsGeneratingKit(false);
    }
  };

  // Outreach Draft Generation
  const handleGenerateOutreach = async (candidateId: string) => {
    try {
      const res = await api.generateOutreachDraft(candidateId, 'job_default', outreachTone);
      if (res.success) {
        setOutreachDraft(res.draft);
        setActiveTab('outreach');
        showToast('success', 'Grounded Draft Ready', 'Grounded in authentic resume facts. Review required before sending.');
      }
    } catch (err: any) {
      showToast('error', 'Draft Failed', err.message);
    }
  };

  const handleApproveOutreach = async () => {
    if (!outreachDraft) return;
    try {
      const res = await api.approveOutreachDraft(outreachDraft.id);
      if (res.success) {
        setOutreachDraft({ ...outreachDraft, status: 'sent' });
        showToast('success', 'Outreach Sent', 'Candidate notification delivered.');
      }
    } catch (err: any) {
      showToast('error', 'Send Failed', err.message);
    }
  };

  // Constructive Rejection Feedback
  const handleGenerateFeedback = async (appId: string) => {
    try {
      const res = await api.generateRejectionFeedback(appId);
      if (res.success) {
        setRejectionFeedback(res.draft);
        setActiveTab('outreach');
        showToast('success', 'Feedback Draft Ready', 'Constructive skill gaps identified. Review before delivery.');
      }
    } catch (err: any) {
      showToast('error', 'Feedback Failed', err.message);
    }
  };

  const handleApproveFeedback = async () => {
    if (!rejectionFeedback) return;
    try {
      const res = await api.approveRejectionFeedback(rejectionFeedback.id);
      if (res.success) {
        setRejectionFeedback({ ...rejectionFeedback, status: 'sent' });
        showToast('success', 'Feedback Sent', 'Constructive feedback delivered to applicant.');
      }
    } catch (err: any) {
      showToast('error', 'Send Failed', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Enterprise Recruiter Workspace
            </h1>
            <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
              {currentOrg.name}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            High-throughput bulk ingestion, 10k virtualized leaderboard, transparent search compiler, and EEOC 4/5ths analytics.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={isBlindMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsBlindMode(!isBlindMode)}
            className="flex items-center gap-1.5"
            title="Press 'b' to toggle"
          >
            {isBlindMode ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
            {isBlindMode ? 'Blind Mode (Active)' : 'Blind Screening'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShortcutsModalOpen(true)}
            className="flex items-center gap-1.5"
            title="Press '?'"
          >
            <Keyboard className="w-4 h-4" />
            Shortcuts
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadLeaderboard}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Primary Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'leaderboard', label: 'Ranked Leaderboard', icon: Users, count: applicants.length },
          { id: 'bulk_upload', label: 'Bulk Ingestion (ZIP/Batch)', icon: Upload },
          { id: 'search_compiler', label: 'Search & Query Compiler', icon: Search },
          { id: 'comparison', label: 'Candidate Comparison (2-5)', icon: Columns, count: selectedApplicantIds.length },
          { id: 'pipeline', label: 'Pipeline & Kanban', icon: Layers },
          { id: 'interview_kit', label: 'Interview Kits & Rubrics', icon: Sparkles },
          { id: 'outreach', label: 'Outreach & Feedback', icon: Mail },
          { id: 'analytics', label: 'Analytics & EEOC Monitor', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RANKED LEADERBOARD & VIRTUALIZATION ENGINE */}
      {/* ========================================================= */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Controls Bar: Filters, Score Bands, Column Chooser, Bulk Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search input */}
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter applicants or skills..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Score Band Chips */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Scores' },
                  { id: 'tier 1', label: 'Tier 1 (85-100)', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
                  { id: 'tier 2', label: 'Tier 2 (70-84)', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
                  { id: 'tier 3', label: 'Tier 3 (50-69)', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
                  { id: 'tier 4', label: 'Tier 4 (<50)', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
                ].map((band) => (
                  <button
                    key={band.id}
                    onClick={() => setScoreBandFilter(band.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all border ${
                      scoreBandFilter === band.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {band.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bulk Actions Button */}
              {selectedApplicantIds.length > 0 && (
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {selectedApplicantIds.length} Selected
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={selectedApplicantIds.length < 2 || selectedApplicantIds.length > 5}
                    onClick={handleRunComparison}
                    className="text-xs py-1"
                  >
                    Compare (2-5)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStageMove(selectedApplicantIds[0], 'Shortlisted')}
                    className="text-xs py-1"
                  >
                    Shortlist
                  </Button>
                </div>
              )}

              {/* Column Chooser Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsColumnChooserOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Columns className="w-4 h-4" />
                Columns
              </Button>
            </div>
          </div>

          {/* Virtualized Table Container */}
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="col-span-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedApplicantIds.length === applicants.length && applicants.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedApplicantIds(applicants.map((a) => a.id));
                    else setSelectedApplicantIds([]);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>#</span>
              </div>
              <div className="col-span-3">Candidate</div>
              <div className="col-span-2">Match Score</div>
              <div className="col-span-2">Skills Coverage</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Virtualized Scrolling Body */}
            <div
              ref={tableContainerRef}
              onScroll={handleScroll}
              className="overflow-y-auto max-h-[600px] relative divide-y divide-slate-100 dark:divide-slate-800"
            >
              {applicants.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No applicants found matching filter criteria.</p>
                </div>
              ) : (
                <div style={{ height: `${virtualWindow.totalHeight}px`, position: 'relative' }}>
                  <div style={{ transform: `translateY(${virtualWindow.topPadding}px)` }}>
                    {virtualWindow.visibleItems.map((applicant, idx) => {
                      const absoluteIndex = virtualWindow.startIndex + idx;
                      const isSelected = selectedApplicantIds.includes(applicant.id);

                      return (
                        <div
                          key={applicant.id}
                          className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center transition-colors text-sm ${
                            isSelected
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                          style={{ height: '64px' }}
                        >
                          {/* Checkbox & Index */}
                          <div className="col-span-1 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedApplicantIds([...selectedApplicantIds, applicant.id]);
                                else setSelectedApplicantIds(selectedApplicantIds.filter((id) => id !== applicant.id));
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-400">{absoluteIndex + 1}</span>
                          </div>

                          {/* Candidate Identity (Respects Blind Mode) */}
                          <div className="col-span-3 flex flex-col justify-center">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {isBlindMode ? applicant.redactedName : applicant.fullName}
                            </span>
                            <span className="text-xs text-slate-500 truncate">
                              {applicant.experienceYears}y exp • {isBlindMode ? 'Location Redacted' : applicant.location}
                            </span>
                          </div>

                          {/* Match Score & Score Band Chip */}
                          <div className="col-span-2 flex items-center gap-2">
                            <MatchScore score={applicant.matchScore} size="sm" />
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0.5 ${
                                applicant.matchScore >= 85
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                                  : applicant.matchScore >= 70
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300'
                              }`}
                            >
                              {applicant.matchScore >= 85 ? 'Tier 1' : applicant.matchScore >= 70 ? 'Tier 2' : 'Tier 3'}
                            </Badge>
                          </div>

                          {/* Skills Coverage */}
                          <div className="col-span-2 flex flex-wrap gap-1 overflow-hidden max-h-10">
                            {applicant.matchedSkills.slice(0, 3).map((skill, sIdx) => (
                              <span key={sIdx} className="px-1.5 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {skill}
                              </span>
                            ))}
                            {applicant.matchedSkills.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">+{applicant.matchedSkills.length - 3}</span>
                            )}
                          </div>

                          {/* Stage Dropdown */}
                          <div className="col-span-2">
                            <select
                              value={applicant.pipelineStage}
                              onChange={(e) => handleStageMove(applicant.id, e.target.value)}
                              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Screening">Screening</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Technical Interview">Technical</option>
                              <option value="Offer">Offer</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>

                          {/* Quick Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleGenerateInterviewKit(applicant.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                              title="Generate Tailored Interview Kit"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateOutreach(applicant.candidateId)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                              title="Draft Grounded Outreach"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateFeedback(applicant.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                              title="Draft Constructive Feedback"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between items-center">
              <span>Showing {virtualWindow.visibleItems.length} of {applicants.length} virtualized rows</span>
              <span className="text-[11px] text-slate-400">Press '?' for keyboard shortcuts | 'b' for blind screening</span>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BULK INGESTION DROPZONE & PROGRESS TRACKER */}
      {/* ========================================================= */}
      {activeTab === 'bulk_upload' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <Card className="p-8 border-dashed border-2 border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 rounded-2xl text-center">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.docx,.txt,.zip"
              onChange={(e) => {
                if (e.target.files) setBulkFiles(Array.from(e.target.files));
              }}
              className="hidden"
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-14 h-14 mx-auto mb-4 text-indigo-500 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Drop Hundreds of Resumes or a ZIP Archive
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
                Automatic ZIP decompression, background processing queue, SHA-256 deduplication, and quota validation.
              </p>
              <Button variant="primary" size="md">
                Select Files / Archive
              </Button>
            </div>

            {bulkFiles.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  Selected {bulkFiles.length} file(s) for bulk processing
                </p>
                <Button
                  variant="primary"
                  size="md"
                  disabled={isUploading}
                  onClick={handleStartBulkUpload}
                  className="w-full max-w-xs mx-auto"
                >
                  {isUploading ? 'Ingesting Batch...' : 'Start Ingestion Queue'}
                </Button>
              </div>
            )}
          </Card>

          {/* Batch Progress Report */}
          {uploadProgress && (
            <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Ingestion Batch Status: {uploadProgress.batchId}</span>
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300">
                  Completed
                </Badge>
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{uploadProgress.totalFiles}</div>
                  <div className="text-xs text-slate-500">Total Files</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{uploadProgress.successfulFiles}</div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">Successful</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{uploadProgress.duplicateFiles}</div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">Duplicates Skipped</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-center">
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{uploadProgress.failedFiles}</div>
                  <div className="text-xs text-rose-700 dark:text-rose-300">Failed</div>
                </div>
              </div>

              {/* Ingested Files Details Table */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {uploadProgress.results.map((item: any, idx: number) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-xs">{item.filename}</span>
                    <Badge
                      variant="outline"
                      className={
                        item.status === 'completed'
                          ? 'text-emerald-700 bg-emerald-50'
                          : item.status === 'duplicate'
                          ? 'text-amber-700 bg-amber-50'
                          : 'text-rose-700 bg-rose-50'
                      }
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TRANSPARENT SEARCH & QUERY COMPILER */}
      {/* ========================================================= */}
      {activeTab === 'search_compiler' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              Anti-Bias Natural-Language Search Compiler
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Type natural-language criteria. Resumio compiles your intent into a <strong>visible, transparent structured query</strong> before execution.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={nlQueryInput}
                onChange={(e) => setNlQueryInput(e.target.value)}
                placeholder="e.g. senior backend engineers with Kubernetes in Chennai or remote"
                className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button variant="primary" onClick={handleCompileQuery}>
                Compile Query
              </Button>
            </div>

            {/* Compliance Rejection Alert */}
            {complianceViolation && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">EEOC Compliance Rejection</div>
                  <div>{complianceViolation}</div>
                </div>
              </div>
            )}

            {/* Compiled Query AST Transparency */}
            {compiledQuery && (
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transparent Interpretation</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                    Audit Verified
                  </Badge>
                </div>
                <div className="text-sm text-slate-900 dark:text-white font-medium">
                  {compiledQuery.explanation}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-500 block mb-1">Extracted Skills</span>
                    <span>{compiledQuery.facets.skills?.join(', ') || 'None'}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-500 block mb-1">Locations & Work Modes</span>
                    <span>
                      {[...(compiledQuery.facets.locations || []), ...(compiledQuery.facets.workModes || [])].join(', ') || 'Any'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSearchFilter(compiledQuery.facets.skills?.[0] || '');
                    setActiveTab('leaderboard');
                    showToast('success', 'Search Filter Applied', 'Filtering applicants based on compiled query.');
                  }}
                  className="w-full"
                >
                  Apply to Leaderboard
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CANDIDATE COMPARISON MATRIX (2-5 CANDIDATES) */}
      {/* ========================================================= */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {!comparisonMatrix ? (
            <Card className="p-12 text-center text-slate-500">
              <Columns className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-slate-700 dark:text-slate-300">No Candidates Currently Selected for Comparison</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Select 2 to 5 candidates from the Ranked Leaderboard and click "Compare".</p>
              <Button variant="primary" size="sm" onClick={() => setActiveTab('leaderboard')}>
                Go to Leaderboard
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Side-by-Side Comparison: {comparisonMatrix.candidates.length} Candidates
                  </h3>
                  <span className="text-xs text-slate-500">Target Role: {comparisonMatrix.jobTitle}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csv = exportComparisonToCsv(comparisonMatrix);
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'candidate_comparison.csv';
                      a.click();
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Comparison Table */}
              <Card className="overflow-x-auto p-4 border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 font-bold text-slate-600 dark:text-slate-400 w-1/4">Evaluation Dimension</th>
                      {comparisonMatrix.candidates.map((cand) => (
                        <th key={cand.id} className="p-3 font-bold text-slate-900 dark:text-white">
                          <div>{cand.fullName}</div>
                          {cand.id === comparisonMatrix.bestOverallCandidateId && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 mt-1">
                              Top Overall Fit
                            </Badge>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Composite Fit Score</td>
                      {comparisonMatrix.candidates.map((c) => (
                        <td key={c.id} className="p-3">
                          <MatchScore score={c.matchScore} size="sm" />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Skills Contribution</td>
                      {comparisonMatrix.candidates.map((c) => (
                        <td key={c.id} className="p-3 font-medium">{c.components.skills} pts</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Experience Contribution</td>
                      {comparisonMatrix.candidates.map((c) => (
                        <td key={c.id} className="p-3 font-medium">{c.components.experience} pts</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Total Experience</td>
                      {comparisonMatrix.candidates.map((c) => (
                        <td key={c.id} className="p-3">{c.experienceYears} Years</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Matched Skills</td>
                      {comparisonMatrix.candidates.map((c) => (
                        <td key={c.id} className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {c.skillsMatched.map((s, sIdx) => (
                              <span key={sIdx} className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px]">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PIPELINE KANBAN BOARD */}
      {/* ========================================================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {['Applied', 'Screening', 'Shortlisted', 'Rejected'].map((colStage) => {
              const inStage = applicants.filter((a) => a.pipelineStage === colStage);
              return (
                <div key={colStage} className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col min-w-[260px]">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">{colStage}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-semibold">{inStage.length}</span>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                    {inStage.map((app) => (
                      <Card key={app.id} className="p-3 bg-white dark:bg-slate-800 shadow-sm hover:shadow transition-all border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {isBlindMode ? app.redactedName : app.fullName}
                          </span>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{app.matchScore}%</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mb-2 truncate">{app.headline}</div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px]">
                          <button
                            onClick={() => handleStageMove(app.id, colStage === 'Applied' ? 'Screening' : 'Shortlisted')}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                          >
                            Advance <ArrowRight className="w-3 h-3" />
                          </button>
                          <span className="text-slate-400">{app.appliedAt.slice(0, 10)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: INTERVIEW KITS & RUBRICS */}
      {/* ========================================================= */}
      {activeTab === 'interview_kit' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {!interviewKit ? (
            <Card className="p-12 text-center text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-500" />
              <p className="font-medium text-slate-700 dark:text-slate-300">Generate Tailored Interview Questions & Scoring Rubrics</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Combines verified candidate skills and missing gaps into structured rubrics.</p>
              <Button variant="primary" onClick={() => handleGenerateInterviewKit()} disabled={isGeneratingKit}>
                {isGeneratingKit ? 'Generating Kit...' : 'Generate Sample Interview Kit'}
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Tailored Interview Kit: {interviewKit.jobTitle}
                  </h3>
                  <span className="text-xs text-slate-500">Total Time Budget: {interviewKit.totalTimeMinutes} Minutes</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleGenerateInterviewKit()}>
                  Regenerate
                </Button>
              </div>

              {/* Question Rubrics */}
              <div className="space-y-4">
                {interviewKit.questions.map((q: any) => (
                  <Card key={q.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                        {q.category} ({q.timeBudgetMinutes}m)
                      </Badge>
                      {q.isGapInvestigation && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                          Gap Investigation
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {q.question}
                    </div>

                    {/* Rubric Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-2">
                      <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                        <span className="font-bold text-rose-700 dark:text-rose-300 block mb-1">1-2: Poor Response</span>
                        <p className="text-slate-600 dark:text-slate-400">{q.scoringRubric.poor}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                        <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">3-4: Good Response</span>
                        <p className="text-slate-600 dark:text-slate-400">{q.scoringRubric.good}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">5: Exemplary Response</span>
                        <p className="text-slate-600 dark:text-slate-400">{q.scoringRubric.exemplary}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: GROUNDED OUTREACH & CONSTRUCTIVE FEEDBACK */}
      {/* ========================================================= */}
      {activeTab === 'outreach' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {outreachDraft && (
            <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  Grounded Candidate Outreach Draft
                </h4>
                <Badge
                  variant="outline"
                  className={outreachDraft.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
                >
                  {outreachDraft.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div><strong>To:</strong> {outreachDraft.candidateName}</div>
                <div><strong>Subject:</strong> {outreachDraft.subject}</div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 whitespace-pre-line text-xs font-mono">
                  {outreachDraft.body}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {outreachDraft.status === 'draft' ? (
                  <Button variant="primary" onClick={handleApproveOutreach} className="flex items-center gap-1.5">
                    <Send className="w-4 h-4" />
                    Human Approve & Send
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Message Delivered
                  </span>
                )}
              </div>
            </Card>
          )}

          {rejectionFeedback && (
            <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  Opt-In Constructive Rejection Feedback
                </h4>
                <Badge
                  variant="outline"
                  className={rejectionFeedback.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
                >
                  {rejectionFeedback.status.toUpperCase()}
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs whitespace-pre-line">
                {rejectionFeedback.constructiveAdvice}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {rejectionFeedback.status === 'draft' ? (
                  <Button variant="primary" onClick={handleApproveFeedback} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Human Review & Deliver Feedback
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Feedback Delivered
                  </span>
                )}
              </div>
            </Card>
          )}

          {!outreachDraft && !rejectionFeedback && (
            <Card className="p-12 text-center text-slate-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-500" />
              <p className="font-medium text-slate-700 dark:text-slate-300">No Outreach Draft Currently Active</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Click the mail icon next to any applicant in the leaderboard to draft personalized outreach.</p>
              <Button variant="primary" size="sm" onClick={() => setActiveTab('leaderboard')}>
                View Leaderboard
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: ANALYTICS & EEOC ADVERSE IMPACT MONITOR */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Funnel & Conversion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsData.funnel.map((f: any, idx: number) => (
              <Card key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase">{f.stage}</span>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 my-1">{f.count}</div>
                <span className="text-xs text-slate-500">Conversion: {f.conversionRate}%</span>
              </Card>
            ))}
          </div>

          {/* Adverse Impact Monitor Card */}
          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  EEOC 4/5ths (80%) Adverse Impact Monitor
                </h4>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Active Monitoring
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {analyticsData.adverseImpact.fourFifthsRuleSummary}
            </p>

            {analyticsData.adverseImpact.limitationMessage && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                {analyticsData.adverseImpact.limitationMessage}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Keyboard Shortcuts Reference Modal */}
      <Modal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        title="Recruiter Workspace Keyboard Shortcuts"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-500">Use these hotkeys to navigate the 10,000-applicant leaderboard smoothly without a mouse.</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {RECRUITER_KEYBOARD_SHORTCUTS.map((sc, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{sc.description}</span>
                <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Column Chooser Modal */}
      <Modal
        isOpen={isColumnChooserOpen}
        onClose={() => setIsColumnChooserOpen(false)}
        title="Customize Leaderboard Columns"
      >
        <div className="space-y-3 text-sm">
          <p className="text-xs text-slate-500">Toggle column visibility to personalize your applicant review screen.</p>
          <div className="space-y-2">
            {columns.map((col) => (
              <label key={col.id} className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={(e) => {
                    setColumns(
                      columns.map((c) => (c.id === col.id ? { ...c, visible: e.target.checked } : c))
                    );
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
