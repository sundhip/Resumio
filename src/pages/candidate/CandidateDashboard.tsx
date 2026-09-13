import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { InterviewStatusBadge } from '../../components/interviews/InterviewStatusBadge';
import type { CandidateDashboardData } from '../../types';
import {
  User,
  FileText,
  Briefcase,
  ArrowRight,
  Sparkles,
  Building2,
  MapPin,
  Send,
  Clock,
  Calendar,
  Video,
  ExternalLink,
} from 'lucide-react';

interface CandidateDashboardProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<CandidateDashboardData | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await api.getCandidateDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // Handled silently
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const completion = data?.profile?.profileCompletion ?? user?.profileCompletion ?? 30;

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
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-16">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {data?.profile?.fullName || user?.name || 'Candidate'}
            </h1>
            <Badge variant="purple" size="sm">
              Candidate Portal
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover matched roles, track application status progressions, and manage upcoming interviews in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onNavigate('jobs')}
            leftIcon={<Briefcase className="w-4 h-4" />}
          >
            Explore Jobs
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('profile')}
            leftIcon={<User className="w-4 h-4" />}
          >
            View Profile
          </Button>
        </div>
      </div>

      {/* Profile Strength Card */}
      <Card className="bg-gradient-to-r from-brand-50/50 via-white to-indigo-50/30 dark:from-brand-950/30 dark:via-surface-dark-card dark:to-surface-dark-card border-brand-200/70 dark:border-surface-dark-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Profile Strength
              </span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-brand-600 text-white">
                {completion}% Complete
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {completion < 100
                ? 'Complete your sections, skills, projects, and resume to maximize recruiter matching'
                : 'Your Resumio candidate profile is 100% complete!'}
            </h3>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Education, Skills, Experience, Projects, Certifications, and Resume drive your job recommendation feed.
            </p>
          </div>

          <div className="shrink-0 flex items-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('profile')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Access Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          padding="sm"
          className="space-y-2 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
          onClick={() => onNavigate('applications')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Applications
            </span>
            <div className="w-7 h-7 rounded-control bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              {data?.applicationStats?.total ?? 0}
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>My Applications</span>
            <ArrowRight className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {data?.applicationStats?.under_review ?? 0} in review • {data?.applicationStats?.shortlisted ?? 0} shortlisted
          </p>
        </Card>

        <Card
          padding="sm"
          className="space-y-2 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          onClick={() => onNavigate('interviews')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Interviews
            </span>
            <div className="w-7 h-7 rounded-control bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              {data?.upcomingInterviews?.length ?? 0}
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>My Interviews</span>
            <ArrowRight className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {data?.upcomingInterviews?.length ? `${data.upcomingInterviews.length} upcoming scheduled` : 'No upcoming'}
          </p>
        </Card>

        <Card
          padding="sm"
          className="space-y-2 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
          onClick={() => onNavigate('jobs')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Job Discovery
            </span>
            <div className="w-7 h-7 rounded-control bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Explore Jobs</span>
            <ArrowRight className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search roles by skills & work mode
          </p>
        </Card>

        <Card
          padding="sm"
          className="space-y-2 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          onClick={() => onNavigate('resume')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Resume Manager
            </span>
            <div className="w-7 h-7 rounded-control bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Active Resume</span>
            <ArrowRight className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {data?.activeResume?.original_filename || 'Upload your resume'}
          </p>
        </Card>
      </div>

      {/* Upcoming Interviews Widget (Feature 24 & Feature 25) */}
      {data?.upcomingInterviews && data.upcomingInterviews.length > 0 && (
        <Card padding="md" className="border-l-4 border-l-indigo-600 space-y-3">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Upcoming Recruitment Interviews
                </CardTitle>
                <CardDescription>
                  Your scheduled interview sessions and meeting access links
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('interviews')}
                className="text-xs"
              >
                View All Interviews ({data.upcomingInterviews.length})
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <InterviewStatusBadge status={item.status} size="sm" />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-surface-dark-card text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-surface-dark-border">
                        {item.interview_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.company_name}</span>
                      <span>•</span>
                      <span>{item.job_title}</span>
                      <span>•</span>
                      <span className="text-brand-600 dark:text-brand-400 font-semibold">{dateStr} at {timeStr} ({item.duration_minutes} min)</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.interview_type === 'Video' && item.meeting_url && (
                      <a
                        href={item.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Video Call
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                      </a>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('interviews')}
                      className="text-xs"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Applications with Phase 6 Match Scores */}
      {data?.recentApplications && data.recentApplications.length > 0 && (
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand-600" /> Recent Applications & Match Scores
                </CardTitle>
                <CardDescription>
                  Real-time status tracking and AI job alignment evaluations
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('applications')}
                className="text-xs"
              >
                View All ({data.applicationStats?.total ?? 0})
              </Button>
            </div>
          </CardHeader>

          <div className="divide-y divide-slate-100 dark:divide-surface-dark-border">
            {data.recentApplications.map((app) => (
              <div
                key={app.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group cursor-pointer"
                onClick={() => onNavigate('applications')}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                      {app.jobTitle}
                    </h4>
                    <ApplicationStatusBadge status={app.status} size="sm" showDot />
                    {app.matchScore !== null && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {app.matchScore}% Match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Building2 className="w-3 h-3 text-brand-600" />
                      {app.companyName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Applied on {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                    {app.interview && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Interview: {app.interview.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-brand-600 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/40"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommended Jobs */}
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" /> Recommended Roles
              </CardTitle>
              <CardDescription>
                Positions matching your skills and experience criteria
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('recommendations')}
              className="text-xs"
            >
              View All Matches
            </Button>
          </div>
        </CardHeader>

        {data?.recommendedJobs && data.recommendedJobs.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-surface-dark-border">
            {data.recommendedJobs.map((j) => (
              <div
                key={j.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group cursor-pointer"
                onClick={() => onNavigate('job-details', { jobId: j.id })}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                      {j.title}
                    </h4>
                    <Badge variant="primary" className="text-[10px]">
                      {j.work_mode || (j as any).workMode}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Building2 className="w-3 h-3 text-brand-600" />
                      {j.company_name || (j as any).companyName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {j.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-brand-600 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/40"
                  >
                    View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Briefcase className="w-6 h-6" />}
            title="No profile matches currently available"
            description="Add more skills to your profile to expand your recommendation feed."
            actionLabel="Explore All Jobs"
            onAction={() => onNavigate('jobs')}
          />
        )}
      </Card>
    </div>
  );
};
