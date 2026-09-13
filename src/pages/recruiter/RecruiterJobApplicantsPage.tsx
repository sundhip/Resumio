import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Modal } from '../../components/ui/Modal';
import { MatchScore } from '../../components/ui/MatchScore';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { ApplicationTimeline } from '../../components/applications/ApplicationTimeline';
import { ApplicationScreeningCard } from '../../components/screening/ApplicationScreeningCard';
import { ParsedResumeViewModal } from '../../components/resume/ParsedResumeViewModal';
import { RecruiterMatchAnalysisCard } from '../../components/matching/RecruiterMatchAnalysisCard';
import { ScheduleInterviewModal } from '../../components/interviews/ScheduleInterviewModal';
import { ExplainableScoreModal } from '../../components/matching/ExplainableScoreModal';
import { InterviewQuestionsModal } from '../../components/interviews/InterviewQuestionsModal';
import { DuplicateResumeBadge } from '../../components/resume/DuplicateResumeBadge';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type {
  RecruiterApplicantItem,
  RankedApplicantItem,
  RecruiterPipelineStats,
  RecruiterApplicantDetail,
  StatusTimelineItem,
  RealApplicationStatus,
  ResumeScreeningResult,
  ParsedResumeData,
  ScreeningStatus,
  ResumeJobMatch,
  CandidateJobSummary,
} from '../../types';
import {
  MoreHorizontal,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  FolderGit2,
  Calendar,
  Layers,
  Clock,
  Briefcase,
  Users,
  Trophy,
  AlertCircle,
  Sparkles,
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

  // Phase 6 Sort & Filters
  const [sortBy, setSortBy] = useState<'match_score_desc' | 'match_score_asc' | 'applied_at_desc' | 'applied_at_asc' | 'name_asc'>('match_score_desc');
  const [minScoreFilter, setMinScoreFilter] = useState<'All' | '80' | '60' | '40'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | RealApplicationStatus>('All');

  // Modals & Drawers
  const [selectedApplicantDetail, setSelectedApplicantDetail] = useState<RecruiterApplicantDetail | null>(null);
  const [selectedApplicantTimeline, setSelectedApplicantTimeline] = useState<StatusTimelineItem[]>([]);

  // Phase 6 AI Matching Analysis & Summary
  const [applicantMatch, setApplicantMatch] = useState<ResumeJobMatch | null>(null);
  const [applicantSummary, setApplicantSummary] = useState<CandidateJobSummary | null>(null);
  const [isMatchLoading, setIsMatchLoading] = useState(false);

  // Phase 5 AI Screening & Parsed Resume Data
  const [applicantScreening, setApplicantScreening] = useState<ResumeScreeningResult | null>(null);
  const [applicantParsedData, setApplicantParsedData] = useState<ParsedResumeData | null>(null);
  const [screeningStatus, setScreeningStatus] = useState<ScreeningStatus>('Not Screened');
  const [isParsedModalOpen, setIsParsedModalOpen] = useState(false);

  // Reject Modal
  const [rejectModalApplicant, setRejectModalApplicant] = useState<RecruiterApplicantItem | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Phase 7 Schedule Interview Modal
  const [schedulingApplicant, setSchedulingApplicant] = useState<{ id: string; name: string; jobTitle: string } | null>(null);

  // Phase 8 Explainable AI Score & AI Interview Questions
  const [explainScoreAppId, setExplainScoreAppId] = useState<string | null>(null);
  const [interviewQuestionsConfig, setInterviewQuestionsConfig] = useState<{
    jobId?: string;
    applicationId?: string;
    candidateName?: string;
  } | null>(null);

  const loadApplicants = async () => {
    setIsLoading(true);
    try {
      if (jobId && jobId !== 'all') {
        const res = await api.getRecruiterJobApplicantsRanked(jobId, {
          sortBy,
          minScore: minScoreFilter !== 'All' ? Number(minScoreFilter) : undefined,
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
  }, [jobId, sortBy, minScoreFilter, statusFilter]);

  const handleStatusChange = async (
    applicantId: string,
    newStatus: 'Under Review' | 'Shortlisted' | 'Rejected',
    note?: string,
    reason?: string
  ) => {
    setIsUpdatingStatus(true);
    try {
      const res = await api.updateApplicantStatus(applicantId, {
        status: newStatus,
        note,
        rejectionReason: reason,
      });

      if (res.success) {
        showToast('success', 'Status Updated', `Applicant marked as "${newStatus}"`);
        loadApplicants();

        if (selectedApplicantDetail && selectedApplicantDetail.id === applicantId) {
          handleViewFullProfile(applicantId);
        }
      }
    } catch (err: any) {
      showToast('error', 'Status update failed', err.message);
    } finally {
      setIsUpdatingStatus(false);
      setRejectModalApplicant(null);
      setRejectionNote('');
    }
  };

  const handleViewFullProfile = async (appId: string) => {
    try {
      const res = await api.getRecruiterApplicationDetail(appId);
      if (res.success) {
        setSelectedApplicantDetail(res.application);
        setSelectedApplicantTimeline(res.timeline || []);
      }

      // Fetch Phase 6 AI Matching & Summary
      try {
        setIsMatchLoading(true);
        const matchRes = await api.getRecruiterApplicationMatching(appId);
        if (matchRes.success) {
          setApplicantMatch(matchRes.match);
          setApplicantSummary(matchRes.summary);
        }
      } catch (mErr) {
        console.warn('Match fetch notice:', mErr);
      } finally {
        setIsMatchLoading(false);
      }

      // Fetch AI Screening Analysis
      try {
        setScreeningStatus('Screening');
        const screeningRes = await api.getRecruiterApplicationScreening(appId);
        if (screeningRes.success) {
          setApplicantScreening(screeningRes.screening);
          setScreeningStatus('Screened');
        } else {
          setScreeningStatus('Failed');
        }
      } catch (screenErr) {
        setScreeningStatus('Failed');
      }

      // Fetch Parsed Resume Data
      try {
        const parseRes = await api.getRecruiterApplicationParsedResume(appId);
        if (parseRes.success) {
          setApplicantParsedData(parseRes.parsed);
        }
      } catch (parseErr) {
        console.warn('Parsed resume fetch warning:', parseErr);
      }
    } catch (err: any) {
      showToast('error', 'Unable to load full candidate profile', err.message);
    }
  };

  const handleRecomputeMatch = async () => {
    if (!selectedApplicantDetail) return;
    try {
      const res = await api.recomputeApplicationMatching(selectedApplicantDetail.id);
      if (res.success) {
        setApplicantMatch(res.match);
        setApplicantSummary(res.summary);
        showToast('success', 'Match Recomputed', 'Algorithm recalculated match score successfully.');
        loadApplicants();
      }
    } catch (err: any) {
      showToast('error', 'Recomputation failed', err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filtered applicants
  const filteredApplicants = applicants.filter((app) => {
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      app.candidateName.toLowerCase().includes(query) ||
      app.candidateEmail.toLowerCase().includes(query) ||
      (app.candidateHeadline || '').toLowerCase().includes(query) ||
      (app.jobTitle || '').toLowerCase().includes(query) ||
      app.skills.some((s) => s.name.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          {jobId && (
            <button
              onClick={() => onNavigate('recruiter-jobs')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Postings
            </button>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {jobInfo ? `${jobInfo.title} — Applicants` : 'Applicant Pipeline'}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {stats.total} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {jobInfo
              ? `Review candidates, view submitted resumes, and advance applicants for ${jobInfo.companyName}.`
              : 'Review submitted candidate resumes, manage pipeline progression, and shortlist top talent.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {jobId && jobId !== 'all' && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setInterviewQuestionsConfig({ jobId })}
              leftIcon={<Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            >
              AI Questions
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            onClick={() => onNavigate('recruiter-jobs')}
            leftIcon={<Briefcase className="w-4 h-4" />}
          >
            Manage Jobs
          </Button>
        </div>
      </div>

      {/* Real Pipeline Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Applicants
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400">All submissions</p>
        </Card>

        <Card padding="sm" className="space-y-1 border-blue-200/50 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            New Applied
          </span>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {stats.applied}
          </div>
          <p className="text-[11px] text-slate-400">Awaiting review</p>
        </Card>

        <Card padding="sm" className="space-y-1 border-amber-200/50 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Under Review
          </span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.under_review}
          </div>
          <p className="text-[11px] text-slate-400">In evaluation</p>
        </Card>

        <Card padding="sm" className="space-y-1 border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Shortlisted
          </span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.shortlisted}
          </div>
          <p className="text-[11px] text-slate-400">Selected for next round</p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Rejected
          </span>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {stats.rejected}
          </div>
          <p className="text-[11px] text-slate-400">{stats.withdrawn} withdrawn</p>
        </Card>
      </div>

      {/* Filter, Sort and Search Bar */}
      <Card padding="sm" className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {(['All', 'Applied', 'Under Review', 'Shortlisted', 'Rejected'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? stats.total
                : tab === 'Applied'
                ? stats.applied
                : tab === 'Under Review'
                ? stats.under_review
                : tab === 'Shortlisted'
                ? stats.shortlisted
                : stats.rejected;

            const isSelected = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-surface-dark-border text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort & Min Score Filter & Search */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Min Score Filter */}
          <select
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-control border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-input text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="All">All Match Scores</option>
            <option value="80">Strong Match (80%+)</option>
            <option value="60">Good Match (60%+)</option>
            <option value="40">Moderate Match (40%+)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-control border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-input text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="match_score_desc">Rank / Match: High to Low</option>
            <option value="match_score_asc">Match: Low to High</option>
            <option value="applied_at_desc">Applied: Newest First</option>
            <option value="applied_at_asc">Applied: Oldest First</option>
            <option value="name_asc">Candidate Name (A-Z)</option>
          </select>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search name, skill, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Applicants List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-card bg-slate-100 dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border" />
          ))}
        </div>
      ) : filteredApplicants.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchQuery || statusFilter !== 'All' || minScoreFilter !== 'All' ? 'No applicants match selected filters' : 'No applications received yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchQuery || statusFilter !== 'All' || minScoreFilter !== 'All'
                ? 'Try adjusting your match score threshold, search keywords, or resetting filters.'
                : 'Candidates will appear here as soon as they submit applications to your published job postings.'}
            </p>
          </div>
          {searchQuery || statusFilter !== 'All' || minScoreFilter !== 'All' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setMinScoreFilter('All');
                setSortBy('match_score_desc');
              }}
            >
              Reset Filters
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApplicants.map((applicant, idx) => (
            <Card
              key={applicant.id}
              padding="md"
              className="hover:border-brand-300 dark:hover:border-brand-800/60 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Rank Badge */}
                <div className="shrink-0 flex flex-col items-center justify-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shadow-xs ${
                    applicant.rank === 1
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                      : applicant.rank === 2
                      ? 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                      : applicant.rank === 3
                      ? 'bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-surface-dark-input dark:text-slate-400 dark:border-surface-dark-border'
                  }`}>
                    {applicant.rank === 1 ? <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : `#${applicant.rank || idx + 1}`}
                  </div>
                </div>

                {/* Candidate Avatar */}
                <div className="relative shrink-0">
                  {applicant.candidatePhoto ? (
                    <img
                      src={applicant.candidatePhoto}
                      alt={applicant.candidateName}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200 dark:ring-surface-dark-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-base flex items-center justify-center shadow-xs">
                      {applicant.candidateName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3
                      onClick={() => handleViewFullProfile(applicant.id)}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition-colors"
                    >
                      {applicant.candidateName}
                    </h3>

                    {/* Match Score Badge with Explainable Score Trigger */}
                    {applicant.matchScore !== undefined && applicant.matchScore > 0 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExplainScoreAppId(applicant.id);
                          }}
                          className="hover:opacity-85 transition-opacity cursor-pointer"
                          title="Click to view transparent explainable score breakdown"
                        >
                          <MatchScore score={applicant.matchScore} variant="pill" size="sm" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExplainScoreAppId(applicant.id);
                          }}
                          className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                          title="Explain score calculation"
                        >
                          Why?
                        </button>
                      </div>
                    )}

                    <ApplicationStatusBadge status={applicant.status} size="sm" showDot />
                    {applicant.jobTitle && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-dark-input text-slate-700 dark:text-slate-300">
                        {applicant.jobTitle}
                      </span>
                    )}
                  </div>

                  {applicant.candidateHeadline && (
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {applicant.candidateHeadline}
                    </p>
                  )}

                  {/* Contact details */}
                  <div className="flex items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {applicant.candidateEmail}
                    </span>
                    {applicant.candidatePhone && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {applicant.candidatePhone}
                        </span>
                      </>
                    )}
                    {applicant.candidateLocation && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {applicant.candidateLocation}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Applied {new Date(applicant.appliedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Skills, Resume Chip, Duplicate Badge & Match Highlights */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {/* Resume download/preview link */}
                    <a
                      href={applicant.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-900/60 hover:underline"
                    >
                      <FileText className="w-3 h-3 text-rose-500" />
                      {applicant.resumeFilename} ({formatFileSize(applicant.resumeFileSize)})
                    </a>

                    {/* Duplicate Resume Badge */}
                    {applicant.resumeId && (
                      <DuplicateResumeBadge resumeId={applicant.resumeId} />
                    )}

                    {/* Matched Required Skills Chip */}
                    {applicant.requiredSkillsMatched && applicant.requiredSkillsMatched.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {applicant.requiredSkillsMatched.length} Required Matched
                      </span>
                    )}

                    {/* Missing Required Skills Chip */}
                    {applicant.requiredSkillsMissing && applicant.requiredSkillsMissing.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        {applicant.requiredSkillsMissing.length} Missing Req
                      </span>
                    )}

                    {/* Candidate Skills */}
                    {applicant.skills.slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-surface-dark-border"
                      >
                        {s.name}
                      </span>
                    ))}
                    {applicant.skills.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{applicant.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Right */}
              <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-surface-dark-border flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleViewFullProfile(applicant.id)}
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                >
                  Full Profile
                </Button>

                {applicant.status === 'Applied' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange(applicant.id, 'Under Review')}
                    leftIcon={<Search className="w-3.5 h-3.5 text-amber-500" />}
                  >
                    Mark In Review
                  </Button>
                )}

                {applicant.status !== 'Shortlisted' && applicant.status !== 'Rejected' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(applicant.id, 'Shortlisted')}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Shortlist
                  </Button>
                )}

                {/* Dropdown Menu for more actions */}
                <Dropdown
                  align="right"
                  width="sm"
                  trigger={
                    <button className="p-2 rounded-control text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  }
                  items={[
                    {
                      id: 'review',
                      label: 'Move to Under Review',
                      icon: <Search className="w-4 h-4 text-amber-500" />,
                      onClick: () => handleStatusChange(applicant.id, 'Under Review'),
                    },
                    {
                      id: 'shortlist',
                      label: 'Mark Shortlisted',
                      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                      onClick: () => handleStatusChange(applicant.id, 'Shortlisted'),
                    },
                    {
                      id: 'ai-questions',
                      label: 'AI Interview Questions',
                      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
                      onClick: () =>
                        setInterviewQuestionsConfig({
                          applicationId: applicant.id,
                          candidateName: applicant.candidateName,
                        }),
                    },
                    {
                      id: 'div',
                      label: '',
                      divider: true,
                    },
                    {
                      id: 'reject',
                      label: 'Reject Applicant',
                      icon: <XCircle className="w-4 h-4 text-rose-500" />,
                      destructive: true,
                      onClick: () => setRejectModalApplicant(applicant),
                    },
                  ]}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full Candidate Profile Modal */}
      {selectedApplicantDetail && (
        <Modal
          isOpen={Boolean(selectedApplicantDetail)}
          onClose={() => setSelectedApplicantDetail(null)}
          size="lg"
          title={
            <div className="flex items-center gap-3">
              {selectedApplicantDetail.candidate.photoUrl ? (
                <img
                  src={selectedApplicantDetail.candidate.photoUrl}
                  alt={selectedApplicantDetail.candidate.name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center">
                  {selectedApplicantDetail.candidate.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedApplicantDetail.candidate.name}
                  </h3>
                  <ApplicationStatusBadge status={selectedApplicantDetail.status} size="sm" showDot />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Applied for {selectedApplicantDetail.jobTitle} • {selectedApplicantDetail.candidate.location || 'Location Not Specified'}
                </p>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const app = applicants.find((a) => a.id === selectedApplicantDetail.id);
                    if (app) setRejectModalApplicant(app);
                  }}
                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusChange(selectedApplicantDetail.id, 'Under Review')}
                  leftIcon={<Search className="w-3.5 h-3.5 text-amber-500" />}
                >
                  Under Review
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusChange(selectedApplicantDetail.id, 'Shortlisted')}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Shortlist
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setSchedulingApplicant({
                      id: selectedApplicantDetail.id,
                      name: selectedApplicantDetail.candidate.name,
                      jobTitle: selectedApplicantDetail.jobTitle,
                    })
                  }
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  Schedule Interview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setInterviewQuestionsConfig({
                      applicationId: selectedApplicantDetail.id,
                      candidateName: selectedApplicantDetail.candidate.name,
                    })
                  }
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                >
                  AI Interview Questions
                </Button>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedApplicantDetail(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-6 text-xs sm:text-sm">
            {/* Candidate Summary Box */}
            <div className="p-4 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-surface-dark-border text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Contact & Communication
                  </span>
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold">
                      <Mail className="w-3.5 h-3.5 text-brand-600" />
                      {selectedApplicantDetail.candidate.email}
                    </span>
                    {selectedApplicantDetail.candidate.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-brand-600" />
                        {selectedApplicantDetail.candidate.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Profile Strength
                  </span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">
                    {selectedApplicantDetail.candidate.profileCompletion}% Complete
                  </span>
                </div>
              </div>

              {selectedApplicantDetail.candidate.bio && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Candidate Summary / Bio
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedApplicantDetail.candidate.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Submitted Resume Attachment */}
            <div className="p-3.5 rounded-card border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-control bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-200 dark:border-rose-900/60">
                  PDF
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {selectedApplicantDetail.resume.originalFilename}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatFileSize(selectedApplicantDetail.resume.fileSize)} • Submitted snapshot
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {applicantParsedData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsParsedModalOpen(true)}
                    leftIcon={<FileText className="w-3.5 h-3.5 text-brand-600" />}
                  >
                    View Parsed Data
                  </Button>
                )}

                {selectedApplicantDetail.resume.previewUrl && (
                  <a
                    href={selectedApplicantDetail.resume.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-control bg-brand-600 hover:bg-brand-700 text-white transition-colors shrink-0 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Resume
                  </a>
                )}
              </div>
            </div>

            {/* Phase 6 AI Match Analysis Card & Phase 8 Explainable AI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  AI Fit Analysis & Mathematical Scoring
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExplainScoreAppId(selectedApplicantDetail.id)}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                >
                  Why this score? (Explainable AI)
                </Button>
              </div>
              <RecruiterMatchAnalysisCard
                match={applicantMatch}
                summary={applicantSummary}
                isLoading={isMatchLoading}
                onRecompute={handleRecomputeMatch}
              />
            </div>

            {/* Phase 5 Initial AI Resume Screening Card */}
            {applicantScreening && (
              <div className="space-y-1">
                <ApplicationScreeningCard
                  screening={applicantScreening}
                  status={screeningStatus}
                  onViewParsedResume={applicantParsedData ? () => setIsParsedModalOpen(true) : undefined}
                />
              </div>
            )}

            {/* Cover Letter Note (if attached) */}
            {selectedApplicantDetail.coverLetter && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  Applicant Note / Cover Pitch
                </h4>
                <div className="p-3.5 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedApplicantDetail.coverLetter}
                </div>
              </div>
            )}

            {/* Candidate Experience */}
            {selectedApplicantDetail.candidate.experience.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                  Work Experience ({selectedApplicantDetail.candidate.experience.length})
                </h4>
                <div className="space-y-2">
                  {selectedApplicantDetail.candidate.experience.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 rounded-control border border-slate-200/80 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {exp.job_title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {exp.start_date} – {exp.currently_working ? 'Present' : exp.end_date || ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {exp.company} • {exp.employment_type} {exp.location ? `• ${exp.location}` : ''}
                      </p>
                      {exp.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Skills */}
            {selectedApplicantDetail.candidate.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-600" />
                  Profile Skills ({selectedApplicantDetail.candidate.skills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApplicantDetail.candidate.skills.map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 text-xs rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 font-medium"
                    >
                      {s.name} ({s.proficiency})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Education */}
            {selectedApplicantDetail.candidate.education.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                  Education
                </h4>
                <div className="space-y-2">
                  {selectedApplicantDetail.candidate.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-3 rounded-control border border-slate-200/80 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card space-y-0.5 text-xs"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">
                        {edu.degree} in {edu.field_of_study}
                      </p>
                      <p className="text-slate-500">
                        {edu.institution} {edu.grade_or_gpa ? `• ${edu.grade_or_gpa}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Projects */}
            {selectedApplicantDetail.candidate.projects.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-brand-600" />
                  Key Projects
                </h4>
                <div className="space-y-2">
                  {selectedApplicantDetail.candidate.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3 rounded-control border border-slate-200/80 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card space-y-1 text-xs"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">
                        {proj.name} {proj.role ? `(${proj.role})` : ''}
                      </p>
                      {proj.technologies && (
                        <p className="text-[11px] text-brand-600 dark:text-brand-400">
                          {proj.technologies}
                        </p>
                      )}
                      {proj.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Status History Timeline */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-surface-dark-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                Applicant Pipeline Audit History
              </h4>
              <div className="p-4 rounded-card bg-slate-50 dark:bg-surface-dark-bg/50 border border-slate-200/80 dark:border-surface-dark-border">
                <ApplicationTimeline timeline={selectedApplicantTimeline} />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Rejection with Note */}
      {rejectModalApplicant && (
        <Modal
          isOpen={Boolean(rejectModalApplicant)}
          onClose={() => setRejectModalApplicant(null)}
          size="sm"
          title="Reject Applicant?"
          description={`Are you sure you want to reject ${rejectModalApplicant.candidateName}?`}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectModalApplicant(null)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  handleStatusChange(
                    rejectModalApplicant.id,
                    'Rejected',
                    rejectionNote.trim() || 'Candidate rejected by hiring team.',
                    rejectionNote.trim()
                  )
                }
                isLoading={isUpdatingStatus}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Confirm Rejection
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The applicant will be moved to <strong>Rejected</strong> and this decision will be logged in their status audit timeline.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Internal Reason / Note <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="e.g. Position filled, missing specialized skills, etc."
                className="w-full p-2.5 rounded-control text-xs bg-white dark:bg-surface-dark-input text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Phase 5 Parsed Resume View Modal for Recruiter */}
      <ParsedResumeViewModal
        isOpen={isParsedModalOpen}
        onClose={() => setIsParsedModalOpen(false)}
        parsedData={applicantParsedData}
        status={applicantParsedData ? 'Processed' : 'Failed'}
        filename={selectedApplicantDetail?.resume.originalFilename}
      />

      {/* Phase 7 Schedule Interview Modal */}
      {schedulingApplicant && (
        <ScheduleInterviewModal
          applicationId={schedulingApplicant.id}
          candidateName={schedulingApplicant.name}
          jobTitle={schedulingApplicant.jobTitle}
          isOpen={Boolean(schedulingApplicant)}
          onClose={() => setSchedulingApplicant(null)}
          onSuccess={() => {
            loadApplicants();
            showToast('success', 'Interview Scheduled', `Interview scheduled for ${schedulingApplicant.name}.`);
          }}
        />
      )}

      {/* Phase 8 Explainable AI Score Modal */}
      {explainScoreAppId && (
        <ExplainableScoreModal
          applicationId={explainScoreAppId}
          isOpen={Boolean(explainScoreAppId)}
          onClose={() => setExplainScoreAppId(null)}
        />
      )}

      {/* Phase 8 AI Interview Questions Modal */}
      {interviewQuestionsConfig && (
        <InterviewQuestionsModal
          jobId={interviewQuestionsConfig.jobId}
          applicationId={interviewQuestionsConfig.applicationId}
          candidateName={interviewQuestionsConfig.candidateName}
          isOpen={Boolean(interviewQuestionsConfig)}
          onClose={() => setInterviewQuestionsConfig(null)}
        />
      )}
    </div>
  );
};
