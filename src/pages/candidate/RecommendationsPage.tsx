import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { RecommendedJob } from '../../types';
import {
  Sparkles,
  ArrowRight,
  Building2,
  MapPin,
  DollarSign,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

interface RecommendationsPageProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const res = await api.getRecommendedJobs();
      if (res.success) {
        setRecommendations(res.recommendations);
      }
    } catch (err: any) {
      showToast('error', 'Unable to calculate recommendations', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const formatSalary = (j: RecommendedJob) => {
    if (!j.salary_disclosed || (!j.salary_min && !j.salary_max)) {
      return null;
    }
    const curr = j.currency || 'USD';
    const period = j.salary_period ? `/${j.salary_period.toLowerCase()}` : '';
    if (j.salary_min && j.salary_max) {
      return `${curr} ${j.salary_min.toLocaleString()} - ${j.salary_max.toLocaleString()} ${period}`;
    }
    if (j.salary_min) {
      return `From ${curr} ${j.salary_min.toLocaleString()} ${period}`;
    }
    return `Up to ${curr} ${j.salary_max?.toLocaleString()} ${period}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Recommended for Your Profile
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deterministic role matching based on your profile skills, experience range, and location alignment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRecommendations}
            isLoading={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('profile')}
            className="gap-1.5"
          >
            <UserCheck className="w-4 h-4" /> Edit Profile Skills
          </Button>
        </div>
      </div>

      {/* Profile Notice Banner */}
      <Card className="p-4 bg-brand-50/50 dark:bg-brand-950/20 border-brand-200/70 dark:border-brand-800/40">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-brand-600 text-white shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-brand-950 dark:text-brand-100 uppercase tracking-wider">
              Profile-Based Relevance Matching
            </h3>
            <p className="text-xs text-brand-900 dark:text-brand-300/90 leading-relaxed">
              Resumio compares the skills, experience, and location in your candidate profile with active job criteria. Keep your profile updated to receive higher quality matches.
            </p>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse space-y-3 bg-white dark:bg-surface-dark-card">
              <div className="h-5 bg-slate-200 dark:bg-surface-dark-border rounded w-1/3" />
              <div className="h-4 bg-slate-100 dark:bg-surface-dark-border/60 rounded w-1/4" />
              <div className="h-3 bg-slate-100 dark:bg-surface-dark-border/40 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-surface-dark-card border-dashed">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-surface-dark-border flex items-center justify-center mx-auto text-slate-400 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Profile Matches Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            We couldn't find active positions matching your current profile skills or criteria. Add more technical skills and experience in your profile.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="primary" size="sm" onClick={() => onNavigate('profile')}>
              Update Profile Skills
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('jobs')}>
              Browse All Jobs
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((job) => {
            const salaryStr = formatSalary(job);
            return (
              <Card
                key={job.id}
                className="p-5 sm:p-6 bg-white dark:bg-surface-dark-card border-slate-200/80 dark:border-surface-dark-border hover:border-brand-400 dark:hover:border-brand-700 transition-all duration-200 group cursor-pointer"
                onClick={() => onNavigate('job-details', { jobId: job.id })}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Title & Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {job.title}
                      </h2>
                      <Badge variant="primary" className="text-[10px] uppercase">
                        {job.work_mode}
                      </Badge>
                      <Badge variant="default" className="text-[10px]">
                        {job.employment_type}
                      </Badge>
                    </div>

                    {/* Company & Location Info */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-brand-600" />
                        {job.company_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      {(job.min_experience !== null || job.max_experience !== null) && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {job.min_experience ?? 0}
                          {job.max_experience ? ` - ${job.max_experience} yrs` : '+ yrs'}
                        </span>
                      )}
                    </div>

                    {/* Match Reasons Bar */}
                    {job.match_reasons && job.match_reasons.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Profile Match Reasons
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.match_reasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched & Required Skills */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {job.required_skills?.map((skill, sIdx) => {
                        const isMatched = job.matched_skills?.includes(skill.toLowerCase());
                        return (
                          <span
                            key={sIdx}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              isMatched
                                ? 'bg-brand-100/70 dark:bg-brand-900/60 text-brand-800 dark:text-brand-200 border-brand-300 dark:border-brand-700 font-semibold'
                                : 'bg-slate-50 dark:bg-surface-dark-border text-slate-500 dark:text-slate-400 border-slate-200 dark:border-surface-dark-border'
                            }`}
                          >
                            {skill} {isMatched && '✓'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Action Column */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-surface-dark-border">
                    {salaryStr && (
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {salaryStr}
                      </div>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1.5 text-xs shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('job-details', { jobId: job.id });
                      }}
                    >
                      View Role <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
