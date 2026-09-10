import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { MatchScore } from '../ui/MatchScore';
import type { ResumeJobMatch, CandidateJobSummary } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  RefreshCw,
  Award,
  Clock,
  GraduationCap,
} from 'lucide-react';

interface CandidateJobFitCardProps {
  match: ResumeJobMatch | null;
  summary: CandidateJobSummary | null;
  hasResume: boolean;
  isLoading: boolean;
  errorMessage?: string;
  onOpenSkillGap: () => void;
  onNavigateToResume: () => void;
  onRetry?: () => void;
}

export const CandidateJobFitCard: React.FC<CandidateJobFitCardProps> = ({
  match,
  summary,
  hasResume,
  isLoading,
  errorMessage,
  onOpenSkillGap,
  onNavigateToResume,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-brand-50/60 to-indigo-50/60 dark:from-brand-950/30 dark:to-indigo-950/30 border-brand-200/80 dark:border-brand-900/60 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-brand-600 animate-spin text-brand-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Analyzing your resume against this job...
          </h3>
        </div>
        <div className="h-4 bg-slate-200 dark:bg-surface-dark-border rounded w-3/4 mb-2" />
        <div className="h-4 bg-slate-200 dark:bg-surface-dark-border rounded w-1/2" />
      </Card>
    );
  }

  if (!hasResume) {
    return (
      <Card className="p-6 bg-gradient-to-r from-brand-50/70 to-indigo-50/70 dark:from-brand-950/40 dark:to-indigo-950/40 border-brand-200/80 dark:border-brand-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Discover Your Fit for this Job
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                Upload your resume to instantly see your personalized AI Match Score ($0–100\%$), matched skills, and actionable skill gap recommendations.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToResume}
            leftIcon={<FileText className="w-4 h-4" />}
            className="shrink-0 font-semibold"
          >
            Upload Resume
          </Button>
        </div>
      </Card>
    );
  }

  if (errorMessage && !match) {
    return (
      <Card className="p-5 bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Match Analysis Unavailable
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {errorMessage}
              </p>
            </div>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (!match) return null;

  return (
    <Card className="p-6 bg-white dark:bg-surface-dark-card border-brand-200/80 dark:border-brand-900/60 shadow-xs relative overflow-hidden">
      {/* Top Banner with Score Gauge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-surface-dark-border">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            YOUR FIT FOR THIS JOB
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Resume Match Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Calculated by evaluating required skills, preferred skills, relevant experience duration, and academic qualification.
          </p>
        </div>

        {/* Match Score Display */}
        <div className="flex items-center gap-4 shrink-0">
          <MatchScore score={match.matchScore} variant="circle" size="lg" />
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenSkillGap}
            leftIcon={<TrendingUp className="w-4 h-4" />}
            className="font-semibold shadow-xs"
          >
            View Skill Gap Analysis
          </Button>
        </div>
      </div>

      {/* Matching Factors Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 pb-5 border-b border-slate-100 dark:border-surface-dark-border text-xs">
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border">
          <Award className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 font-medium block text-[11px]">Required Skills Match</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {match.requiredSkillsMatched.length} of {match.requiredSkillsMatched.length + match.requiredSkillsMissing.length} Matched
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border">
          <Clock className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 font-medium block text-[11px]">Experience Alignment</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {match.candidateExperienceYears > 0 ? `${match.candidateExperienceYears} yrs documented` : 'Open'}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border">
          <GraduationCap className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 font-medium block text-[11px]">Education Level</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block max-w-[170px]" title={match.candidateHighestEducation}>
              {match.candidateHighestEducation}
            </span>
          </div>
        </div>
      </div>

      {/* Matched vs Missing Skills Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
        {/* Matched Skills */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Matched Skills ({match.requiredSkillsMatched.length + match.preferredSkillsMatched.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...match.requiredSkillsMatched, ...match.preferredSkillsMatched].slice(0, 8).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {skill}
              </span>
            ))}
            {[...match.requiredSkillsMatched, ...match.preferredSkillsMatched].length === 0 && (
              <span className="text-xs text-slate-400">No direct skill matches detected yet</span>
            )}
          </div>
        </div>

        {/* Missing Required Skills */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span>Missing Required Skills ({match.requiredSkillsMissing.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {match.requiredSkillsMissing.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
              >
                <AlertCircle className="w-3 h-3 text-amber-500" />
                {skill}
              </span>
            ))}
            {match.requiredSkillsMissing.length === 0 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ All mandatory skills matched!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary Snippet */}
      {summary?.summaryText && (
        <div className="mt-5 p-3.5 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-bold text-brand-700 dark:text-brand-400 block mb-1">AI Match Summary:</span>
          {summary.summaryText}
        </div>
      )}
    </Card>
  );
};
