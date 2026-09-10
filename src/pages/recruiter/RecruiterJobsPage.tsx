import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { InterviewQuestionsModal } from '../../components/interviews/InterviewQuestionsModal';
import type { JobPosting, JobStats, JobStatus } from '../../types';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Calendar,
  Clock,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  DollarSign,
  Users,
  Sparkles,
} from 'lucide-react';

interface RecruiterJobsPageProps {
  onNavigate: (path: string, params?: { jobId?: string }) => void;
}

export const RecruiterJobsPage: React.FC<RecruiterJobsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [stats, setStats] = useState<JobStats>({ total: 0, active: 0, draft: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | JobStatus>('All');

  // Modals
  const [closingJobId, setClosingJobId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  const [viewingJob, setViewingJob] = useState<JobPosting | null>(null);
  const [questionsJob, setQuestionsJob] = useState<{ id: string; title: string } | null>(null);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getRecruiterJobs();
      if (res.success) {
        setJobs(res.jobs);
        setStats(res.stats);
      }
    } catch (err: any) {
      showToast('error', 'Unable to load jobs', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handlePublish = async (id: string) => {
    try {
      const res = await api.publishJob(id);
      if (res.success) {
        showToast('success', 'Job published successfully!', 'It is now active and discoverable by candidates.');
        loadJobs();
      }
    } catch (err: any) {
      showToast('error', 'Publish failed', err.message);
    }
  };

  const handleConfirmClose = async () => {
    if (!closingJobId) return;
    setIsClosing(true);
    try {
      const res = await api.closeJob(closingJobId);
      if (res.success) {
        showToast('success', 'Job closed', 'This role has been closed and removed from active search.');
        setClosingJobId(null);
        loadJobs();
      }
    } catch (err: any) {
      showToast('error', 'Close failed', err.message);
    } finally {
      setIsClosing(false);
    }
  };

  const handleConfirmDeleteDraft = async () => {
    if (!deletingDraftId) return;
    setIsDeletingDraft(true);
    try {
      const res = await api.deleteDraftJob(deletingDraftId);
      if (res.success) {
        showToast('success', 'Draft deleted', 'The draft job posting was removed.');
        setDeletingDraftId(null);
        loadJobs();
      }
    } catch (err: any) {
      showToast('error', 'Delete failed', err.message);
    } finally {
      setIsDeletingDraft(false);
    }
  };

  const formatSalary = (job: JobPosting) => {
    if (!job.salary_disclosed || (!job.salary_min && !job.salary_max)) {
      return 'Salary Not Disclosed';
    }
    const cur = job.currency === 'INR' ? '₹' : job.currency === 'USD' ? '$' : `${job.currency} `;
    if (job.salary_min && job.salary_max) {
      return `${cur}${job.salary_min.toLocaleString()} — ${cur}${job.salary_max.toLocaleString()} / ${job.salary_period || 'year'}`;
    }
    if (job.salary_min) {
      return `From ${cur}${job.salary_min.toLocaleString()} / ${job.salary_period || 'year'}`;
    }
    return `Up to ${cur}${job.salary_max?.toLocaleString()} / ${job.salary_period || 'year'}`;
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'Published':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Published
          </Badge>
        );
      case 'Draft':
        return (
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case 'Closed':
        return (
          <Badge variant="neutral" size="sm">
            <XCircle className="w-3 h-3 mr-1" />
            Closed
          </Badge>
        );
    }
  };

  // Filtered jobs list
  const filteredJobs = jobs.filter((job) => {
    const matchesTab = activeTab === 'All' || job.status === activeTab;
    const query = searchQuery.trim().toLowerCase();
    const empType = (job.employment_type || job.employmentType || '').toLowerCase();
    const mode = (job.work_mode || job.workMode || '').toLowerCase();
    const reqSkills = job.requiredSkills || job.required_skills || [];
    const matchesSearch =
      !query ||
      job.title.toLowerCase().includes(query) ||
      (job.location || '').toLowerCase().includes(query) ||
      empType.includes(query) ||
      mode.includes(query) ||
      reqSkills.some((s) => s.toLowerCase().includes(query));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Job Postings
            </h1>
            <Badge variant="purple" size="sm">
              Phase 3 Active
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, publish, and manage hiring requirements for your organization.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('create-job')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Job
        </Button>
      </div>

      {/* Stats Cards (Real database counts only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Postings
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">All created roles</p>
        </Card>

        <Card padding="sm" className="space-y-1.5 border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Active Published
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.active}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Discoverable by candidates</p>
        </Card>

        <Card padding="sm" className="space-y-1.5">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Drafts
          </span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.draft}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Unpublished postings</p>
        </Card>

        <Card padding="sm" className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Closed
          </span>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {stats.closed}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Completed or archived</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm" className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Published', 'Draft', 'Closed'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? stats.total
                : tab === 'Published'
                ? stats.active
                : tab === 'Draft'
                ? stats.draft
                : stats.closed;

            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
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

        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Filter by title, skill, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {/* Job Listings */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 rounded-card bg-slate-100 dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-xs">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchQuery || activeTab !== 'All' ? 'No matching jobs found' : 'No jobs posted yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchQuery || activeTab !== 'All'
                ? 'Try adjusting your search criteria or resetting filters to see available job postings.'
                : 'Create your first job posting with structured requirements to start discovering top talent.'}
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
              Clear Filters
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('create-job')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Job
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              padding="md"
              className="transition-all hover:border-brand-300 dark:hover:border-brand-700/60 hover:shadow-subtle"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Job Info Left */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {job.title}
                    </h3>
                    {getStatusBadge(job.status)}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {job.company_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location || 'Location Not Specified'}
                    </span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-surface-dark-input text-slate-700 dark:text-slate-300">
                      {job.work_mode}
                    </span>
                    <span>•</span>
                    <span>{job.employment_type}</span>
                    <span>•</span>
                    <span>
                      {job.min_experience} {job.max_experience ? `– ${job.max_experience}` : '+'} yrs exp
                    </span>
                  </div>

                  {/* Compensation & Deadline */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs">
                    <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatSalary(job)}
                    </span>
                    {job.deadline && (
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Deadline: {job.deadline}
                      </span>
                    )}
                  </div>

                  {/* Skills Chips */}
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Required:
                    </span>
                    {(job.requiredSkills || job.required_skills || []).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/70 dark:border-brand-900/60"
                      >
                        {skill}
                      </span>
                    ))}
                    {(job.preferredSkills || job.preferred_skills || []).length > 0 && (
                      <>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">
                          Preferred:
                        </span>
                        {(job.preferredSkills || job.preferred_skills || []).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-surface-dark-border"
                          >
                            {skill}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Actions Right */}
                <div className="flex items-center lg:flex-col lg:items-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-surface-dark-border flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate('applicants', { jobId: job.id })}
                    leftIcon={<Users className="w-3.5 h-3.5" />}
                  >
                    Applicants
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionsJob({ id: job.id, title: job.title })}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                  >
                    AI Questions
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewingJob(job)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('edit-job', { jobId: job.id })}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>

                  {job.status === 'Draft' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePublish(job.id)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Publish
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeletingDraftId(job.id)}
                        title="Delete draft"
                        className="p-2 rounded-control text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-surface-dark-hover transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {job.status === 'Published' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setClosingJobId(job.id)}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Close Job
                    </Button>
                  )}

                  {job.status === 'Closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePublish(job.id)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Re-publish
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recruiter Job View Modal */}
      {viewingJob && (
        <Modal
          isOpen={Boolean(viewingJob)}
          onClose={() => setViewingJob(null)}
          size="lg"
          title={
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {viewingJob.title}
                </h3>
                {getStatusBadge(viewingJob.status)}
              </div>
              <p className="text-xs text-slate-400 font-normal">
                {viewingJob.company_name} • {viewingJob.location || 'Remote'}
              </p>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">
                Created on {new Date(viewingJob.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const id = viewingJob.id;
                    setViewingJob(null);
                    onNavigate('edit-job', { jobId: id });
                  }}
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit Job
                </Button>
                <Button variant="primary" size="sm" onClick={() => setViewingJob(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {/* Overview Chips */}
            <div className="p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg border border-slate-200 dark:border-surface-dark-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employment</span>
                <span className="font-semibold text-slate-900 dark:text-white">{viewingJob.employment_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Work Mode</span>
                <span className="font-semibold text-slate-900 dark:text-white">{viewingJob.work_mode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience</span>
                <span className="font-semibold text-slate-900 dark:text-white">{viewingJob.min_experience}+ Years</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Compensation</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">{formatSalary(viewingJob)}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Job Description
              </h4>
              <p className="leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">
                {viewingJob.description}
              </p>
            </div>

            {/* Responsibilities */}
            {viewingJob.responsibilities && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Key Responsibilities
                </h4>
                <p className="leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">
                  {viewingJob.responsibilities}
                </p>
              </div>
            )}

            {/* Skills */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-surface-dark-border">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block mb-1.5">
                  Required Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingJob.requiredSkills || viewingJob.required_skills || []).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900/60"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {((viewingJob.preferredSkills || viewingJob.preferred_skills || []).length > 0) && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block mb-1.5">
                    Preferred Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewingJob.preferredSkills || viewingJob.preferred_skills || []).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-surface-dark-border"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Close Job Modal */}
      <Modal
        isOpen={Boolean(closingJobId)}
        onClose={() => setClosingJobId(null)}
        title="Close this job posting?"
        description="Candidates will no longer see this job as open. You can re-open it at any time."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setClosingJobId(null)} disabled={isClosing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmClose}
              isLoading={isClosing}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Close Job
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Closing preserves recruitment data for future analytics and prevents new candidate discovery.
        </p>
      </Modal>

      {/* Delete Draft Modal */}
      <Modal
        isOpen={Boolean(deletingDraftId)}
        onClose={() => setDeletingDraftId(null)}
        title="Delete draft posting?"
        description="Are you sure you want to delete this draft? This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingDraftId(null)} disabled={isDeletingDraft}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteDraft}
              isLoading={isDeletingDraft}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Draft
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          The unpublished draft will be permanently removed from your organization account.
        </p>
      </Modal>

      {/* Phase 8 AI Interview Questions Modal */}
      {questionsJob && (
        <InterviewQuestionsModal
          jobId={questionsJob.id}
          isOpen={Boolean(questionsJob)}
          onClose={() => setQuestionsJob(null)}
        />
      )}
    </div>
  );
};
