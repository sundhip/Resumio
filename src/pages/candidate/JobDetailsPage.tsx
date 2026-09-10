import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { ApplyModal } from '../../components/applications/ApplyModal';
import { CandidateJobFitCard } from '../../components/matching/CandidateJobFitCard';
import { SkillGapAnalysisModal } from '../../components/matching/SkillGapAnalysisModal';
import type {
  JobPosting,
  RealApplicationStatus,
  ResumeJobMatch,
  CandidateJobSummary,
  SkillGapAnalysis,
} from '../../types';
import {
  Briefcase,
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Share2,
  Globe,
  ShieldAlert,
  Layers,
  Send,
  ExternalLink,
} from 'lucide-react';

interface JobDetailsPageProps {
  jobId: string;
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ jobId, onNavigate }) => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Application state
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationData, setApplicationData] = useState<{ id: string; status: RealApplicationStatus; applied_at: string } | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Phase 6 AI Matching & Skill Gap state
  const [matchData, setMatchData] = useState<ResumeJobMatch | null>(null);
  const [summaryData, setSummaryData] = useState<CandidateJobSummary | null>(null);
  const [skillGapData, setSkillGapData] = useState<SkillGapAnalysis | null>(null);
  const [hasResume, setHasResume] = useState(true);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState('');
  const [isSkillGapModalOpen, setIsSkillGapModalOpen] = useState(false);

  const fetchFitAnalysis = async (targetJobId: string) => {
    if (role !== 'candidate') return;
    setIsMatchingLoading(true);
    setMatchingError('');
    try {
      const fitRes = await api.getCandidateJobFit(targetJobId);
      if (fitRes.success) {
        setHasResume(fitRes.hasResume);
        setMatchData(fitRes.match);
        setSummaryData(fitRes.summary);
        setSkillGapData(fitRes.skillGap);
      } else {
        setMatchingError(fitRes.message || 'Unable to compute fit analysis');
      }
    } catch (err: any) {
      setMatchingError(err.message || 'Fit analysis unavailable');
    } finally {
      setIsMatchingLoading(false);
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) {
        showToast('error', 'Job not found', 'Invalid Job ID provided');
        onNavigate('jobs');
        return;
      }
      setIsLoading(true);
      try {
        const res = await api.getJobById(jobId);
        if (res.success && res.job) {
          setJob(res.job);
          setCompanyProfile(res.companyProfile || null);
        }

        // Check if candidate already applied
        if (role === 'candidate') {
          const checkRes = await api.checkJobApplication(jobId);
          if (checkRes.success && checkRes.hasApplied) {
            setHasApplied(true);
            setApplicationData(checkRes.application || null);
          }

          // Fetch candidate fit and match score
          fetchFitAnalysis(jobId);
        }
      } catch (err: any) {
        showToast('error', 'Unable to load role', err.message);
        onNavigate('jobs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, role]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('success', 'Link Copied', 'Job link copied to your clipboard!');
    }
  };

  const handleApplySuccess = (applicationId: string) => {
    setHasApplied(true);
    setApplicationData({
      id: applicationId,
      status: 'Applied',
      applied_at: new Date().toISOString(),
    });
  };

  const formatSalary = (j: JobPosting) => {
    if (!j.salary_disclosed || (!j.salary_min && !j.salary_max)) {
      return 'Competitive / Undisclosed';
    }
    const curr = j.currency === 'INR' ? '₹' : j.currency === 'USD' ? '$' : `${j.currency} `;
    const period = j.salary_period ? `/${j.salary_period.toLowerCase()}` : '';
    if (j.salary_min && j.salary_max) {
      return `${curr}${j.salary_min.toLocaleString()} - ${curr}${j.salary_max.toLocaleString()} ${period}`;
    }
    if (j.salary_min) {
      return `From ${curr}${j.salary_min.toLocaleString()} ${period}`;
    }
    return `Up to ${curr}${j.salary_max?.toLocaleString()} ${period}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-surface-dark-border rounded mb-4" />
        <Card className="p-8 space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-surface-dark-border rounded w-1/2" />
          <div className="h-5 bg-slate-100 dark:bg-surface-dark-border/60 rounded w-1/4" />
          <div className="h-20 bg-slate-100 dark:bg-surface-dark-border/40 rounded w-full" />
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="max-w-2xl mx-auto p-12 text-center mt-12">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Job Posting Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          This role may have been closed or removed by the hiring company.
        </p>
        <Button variant="primary" onClick={() => onNavigate('jobs')}>
          Back to Browse Jobs
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Back Button */}
      <div>
        <button
          onClick={() => onNavigate('jobs')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Explore Jobs
        </button>
      </div>

      {/* Main Role Header Card */}
      <Card className="p-6 sm:p-8 bg-white dark:bg-surface-dark-card border-slate-200/80 dark:border-surface-dark-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {job.title}
              </h1>
              <Badge variant="primary">{job.work_mode}</Badge>
              <Badge variant="default">{job.employment_type}</Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 flex-wrap pt-1">
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                {job.company_name}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {job.location || 'Remote'}
              </span>
              {job.published_at && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  Posted on {new Date(job.published_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>

            {role === 'candidate' && (
              hasApplied ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('applications')}
                  className="gap-1.5"
                >
                  View in Applications
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsApplyModalOpen(true)}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Apply Now
                </Button>
              )
            )}
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-surface-dark-border text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Experience Range</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {job.min_experience ?? 0}
              {job.max_experience ? ` - ${job.max_experience} Years` : '+ Years'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Education / Degree</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {job.qualification || 'Not Specified'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Compensation</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatSalary(job)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Application Deadline</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Rolling Basis'}
            </span>
          </div>
        </div>
      </Card>

      {/* Phase 4 Live Application Action Banner */}
      {role === 'candidate' && (
        hasApplied ? (
          <div className="p-4 sm:p-5 rounded-card bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    You have applied for this position
                  </h3>
                  {applicationData && (
                    <ApplicationStatusBadge status={applicationData.status} size="sm" showDot />
                  )}
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                  Your profile and resume were submitted {applicationData?.applied_at ? `on ${new Date(applicationData.applied_at).toLocaleDateString()}` : 'successfully'}. You can track the status in your applications dashboard.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('applications')}
              className="shrink-0 text-xs font-semibold gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View My Applications
            </Button>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-card bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand-600 text-white shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-950 dark:text-brand-100">
                  Ready to apply for this position?
                </h3>
                <p className="text-xs text-brand-800 dark:text-brand-300/90 mt-0.5 leading-relaxed">
                  Select your uploaded resume, add an optional pitch note, and submit directly to {job.company_name}.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsApplyModalOpen(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="shrink-0 font-semibold"
            >
              Apply Now
            </Button>
          </div>
        )
      )}

      {/* Phase 6: Candidate AI Job Fit Card */}
      {role === 'candidate' && (
        <CandidateJobFitCard
          match={matchData}
          summary={summaryData}
          hasResume={hasResume}
          isLoading={isMatchingLoading}
          errorMessage={matchingError}
          onOpenSkillGap={() => setIsSkillGapModalOpen(true)}
          onNavigateToResume={() => onNavigate('resume')}
          onRetry={() => fetchFitAnalysis(jobId)}
        />
      )}

      {/* Main Grid: Description / Skills & Company Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Description, Responsibilities, Skills */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card className="p-6 bg-white dark:bg-surface-dark-card">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              About the Role
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-3">
              {job.description}
            </div>
          </Card>

          {/* Key Responsibilities */}
          {job.responsibilities && (
            <Card className="p-6 bg-white dark:bg-surface-dark-card">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                Key Responsibilities & Deliverables
              </h2>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-2 font-mono text-xs">
                {job.responsibilities}
              </div>
            </Card>
          )}

          {/* Required & Preferred Skills */}
          <Card className="p-6 bg-white dark:bg-surface-dark-card space-y-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Required Qualifications & Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills && job.required_skills.length > 0 ? (
                  job.required_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None specified</span>
                )}
              </div>
            </div>

            {job.preferred_skills && job.preferred_skills.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-surface-dark-border">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                  Nice-to-Have / Preferred Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.preferred_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Company Overview Sidebar Card */}
        <div className="space-y-6">
          <Card className="p-5 bg-white dark:bg-surface-dark-card space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-surface-dark-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hiring Organization
              </h3>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {companyProfile?.company_name || job.company_name}
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {companyProfile?.industry && (
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Industry: <strong className="text-slate-800 dark:text-slate-200">{companyProfile.industry}</strong></span>
                </div>
              )}

              {companyProfile?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>HQ Location: <strong className="text-slate-800 dark:text-slate-200">{companyProfile.location}</strong></span>
                </div>
              )}

              {companyProfile?.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a
                    href={companyProfile.website.startsWith('http') ? companyProfile.website : `https://${companyProfile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 dark:text-brand-400 hover:underline truncate"
                  >
                    {companyProfile.website}
                  </a>
                </div>
              )}

              {companyProfile?.description && (
                <div className="pt-2 border-t border-slate-100 dark:border-surface-dark-border text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {companyProfile.description}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-slate-50 dark:bg-surface-dark-bg/60 border-slate-200/80 dark:border-surface-dark-border text-xs space-y-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-600" />
              Verified Employer Post
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              This job posting has been created directly by an authenticated recruiter organization on Resumio.
            </p>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      {isApplyModalOpen && job && (
        <ApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          job={job}
          onSuccess={handleApplySuccess}
          onNavigateToResumeManager={() => onNavigate('resume')}
        />
      )}

      {/* Phase 6: Skill Gap Analysis Modal */}
      {isSkillGapModalOpen && job && (
        <SkillGapAnalysisModal
          isOpen={isSkillGapModalOpen}
          onClose={() => setIsSkillGapModalOpen(false)}
          jobTitle={job.title}
          companyName={companyProfile?.company_name || job.company_name}
          skillGap={skillGapData}
          match={matchData}
          isLoading={isMatchingLoading}
        />
      )}
    </div>
  );
};
