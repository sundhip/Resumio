import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { InterviewStatusBadge } from '../../components/interviews/InterviewStatusBadge';
import type { RecruiterDashboardData } from '../../types';
import {
  ArrowRight,
  Plus,
  CheckCircle2,
  Layers,
  Users,
  Calendar,
  TrendingUp,
  Video,
  ExternalLink,
  Award,
} from 'lucide-react';

interface RecruiterDashboardProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<RecruiterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getRecruiterDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        dateStr: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
    } catch {
      return { dateStr: isoString, timeStr: '' };
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {data?.profile?.fullName || user?.name || 'Recruiter'}
            </h1>
            <Badge variant="purple" size="sm">
              Employer Portal
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hiring and job management workspace for <strong>{data?.profile?.companyName || user?.company || 'Your Company'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onNavigate('recruiter-analytics')}
            leftIcon={<TrendingUp className="w-4 h-4 text-brand-600" />}
          >
            Analytics & Reports
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('create-job')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Post a Job
          </Button>
        </div>
      </div>

      {/* Real Live Database Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          padding="sm"
          className="space-y-1 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
          onClick={() => onNavigate('recruiter-jobs')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Postings
            </span>
            <div className="w-7 h-7 rounded-control bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? '-' : data?.jobStats?.total ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">{data?.jobStats?.active ?? 0} active published</p>
        </Card>

        <Card
          padding="sm"
          className="space-y-1 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          onClick={() => onNavigate('applicants')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Total Applicants
            </span>
            <div className="w-7 h-7 rounded-control bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isLoading ? '-' : data?.pipelineStats?.total ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">{data?.pipelineStats?.under_review ?? 0} in evaluation</p>
        </Card>

        <Card
          padding="sm"
          className="space-y-1 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          onClick={() => onNavigate('applicants')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Shortlisted
            </span>
            <div className="w-7 h-7 rounded-control bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {isLoading ? '-' : data?.pipelineStats?.shortlisted ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Selected candidates</p>
        </Card>

        <Card
          padding="sm"
          className="space-y-1 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          onClick={() => onNavigate('recruiter-interviews')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Interviews
            </span>
            <div className="w-7 h-7 rounded-control bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {isLoading ? '-' : data?.interviewStats?.upcoming ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">{data?.interviewStats?.completed ?? 0} conducted</p>
        </Card>
      </div>

      {/* Top Ranked Candidates Widget (Phase 6 AI Matching Engine Integration) */}
      {data?.topCandidates && data.topCandidates.length > 0 && (
        <Card padding="md" className="space-y-3">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-600" /> Top Matched Candidates
                </CardTitle>
                <CardDescription>
                  Highest ranking applicants across your active job postings based on deterministic AI scoring
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('applicants')}
                className="text-xs"
              >
                View Pipeline ({data.pipelineStats?.total ?? 0})
              </Button>
            </div>
          </CardHeader>

          <div className="divide-y divide-slate-100 dark:divide-surface-dark-border">
            {data.topCandidates.map((cand, idx) => (
              <div
                key={cand.applicationId}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group cursor-pointer"
                onClick={() => onNavigate('applicants')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>

                  <img
                    src={
                      cand.candidatePhoto ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={cand.candidateName}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-surface-dark-border shrink-0"
                  />

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                        {cand.candidateName}
                      </h4>
                      <ApplicationStatusBadge status={cand.applicationStatus} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      Applied for: <span className="font-semibold text-slate-700 dark:text-slate-300">{cand.jobTitle}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {cand.matchScore}% Match
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {cand.matchedSkills.length} skills matched
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-brand-600 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/40"
                  >
                    Inspect <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Interviews Widget (Feature 24 & Feature 26) */}
      {data?.upcomingInterviews && data.upcomingInterviews.length > 0 && (
        <Card padding="md" className="border-l-4 border-l-indigo-600 space-y-3">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Upcoming Candidate Interviews
                </CardTitle>
                <CardDescription>
                  Sessions scheduled for evaluation and technical rounds
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('recruiter-interviews')}
                className="text-xs"
              >
                Manage All ({data.interviewStats?.upcoming ?? 0})
              </Button>
            </div>
          </CardHeader>

          <div className="space-y-3">
            {data.upcomingInterviews.map((item) => {
              const { dateStr, timeStr } = formatDateTime(item.scheduled_at);
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/70 dark:border-surface-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        item.candidate_photo ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={item.candidate_name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-surface-dark-border shrink-0 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.candidate_name}
                        </h4>
                        <InterviewStatusBadge status={item.status} size="sm" />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-surface-dark-card text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-surface-dark-border">
                          {item.interview_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.title} • Role: {item.job_title} • <span className="text-brand-600 dark:text-brand-400 font-semibold">{dateStr} at {timeStr}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.interview_type === 'Video' && item.meeting_url && (
                      <a
                        href={item.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Room
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                      </a>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('recruiter-interviews')}
                      className="text-xs"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Applicants Strip */}
      {data?.recentApplicants && data.recentApplicants.length > 0 && (
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-600" /> Recent Submissions
                </CardTitle>
                <CardDescription>
                  Latest candidate submissions for your job postings
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('applicants')}
                className="text-xs"
              >
                View Pipeline ({data.pipelineStats?.total ?? 0})
              </Button>
            </div>
          </CardHeader>

          <div className="divide-y divide-slate-100 dark:divide-surface-dark-border">
            {data.recentApplicants.map((app) => (
              <div
                key={app.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group cursor-pointer"
                onClick={() => onNavigate('applicants')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      app.candidatePhoto ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={app.candidateName}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-surface-dark-border shrink-0"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                        {app.candidateName}
                      </h4>
                      <ApplicationStatusBadge status={app.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      Applied for: <span className="font-semibold text-slate-700 dark:text-slate-300">{app.jobTitle}</span> • {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {app.matchScore !== null && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {app.matchScore}% Match
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-brand-600 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/40"
                  >
                    Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
