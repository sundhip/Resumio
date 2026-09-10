import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { MatchScore } from '../ui/MatchScore';
import type { ResumeJobMatch, CandidateJobSummary } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Clock,
  GraduationCap,
  RefreshCw,
  FileCheck,
  Zap,
} from 'lucide-react';

interface RecruiterMatchAnalysisCardProps {
  match: ResumeJobMatch | null;
  summary: CandidateJobSummary | null;
  isLoading?: boolean;
  onRecompute?: () => Promise<void>;
}

export const RecruiterMatchAnalysisCard: React.FC<RecruiterMatchAnalysisCardProps> = ({
  match,
  summary,
  isLoading = false,
  onRecompute,
}) => {
  const [isRecomputing, setIsRecomputing] = useState(false);

  const handleRecompute = async () => {
    if (!onRecompute) return;
    setIsRecomputing(true);
    try {
      await onRecompute();
    } finally {
      setIsRecomputing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-slate-50 dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border animate-pulse space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600 animate-spin" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Calculating match score and synthesizing AI summary...
          </span>
        </div>
        <div className="h-4 bg-slate-200 dark:bg-surface-dark-border rounded w-3/4" />
        <div className="h-20 bg-slate-100 dark:bg-surface-dark-border/40 rounded w-full" />
      </Card>
    );
  }

  if (!match) {
    return (
      <Card className="p-6 text-center space-y-3 bg-slate-50 dark:bg-surface-dark-card">
        <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="text-xs text-slate-500">
          Match analysis has not been generated for this applicant yet.
        </p>
        {onRecompute && (
          <Button variant="primary" size="sm" onClick={handleRecompute} leftIcon={<Zap className="w-4 h-4" />}>
            Generate Match Analysis
          </Button>
        )}
      </Card>
    );
  }

  const totalReq = match.requiredSkillsMatched.length + match.requiredSkillsMissing.length;
  const totalPref = match.preferredSkillsMatched.length + match.preferredSkillsMissing.length;

  return (
    <Card className="p-6 bg-white dark:bg-surface-dark-card border-brand-200/80 dark:border-brand-900/60 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-surface-dark-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            AI MATCH ANALYSIS
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Role Alignment & Candidate Ranking Factors
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Algorithmic evaluation of submitted resume against verified job requirements.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <MatchScore score={match.matchScore} variant="compact" size="md" />
          {onRecompute && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecompute}
              isLoading={isRecomputing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Re-evaluate
            </Button>
          )}
        </div>
      </div>

      {/* Factor Breakdown Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-[11px] uppercase">Required Skills</span>
            <Award className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {match.requiredSkillsMatched.length} / {totalReq} Matched
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Score: {match.scoreBreakdown?.requiredSkillsScore ?? 0} / 50 pts
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-[11px] uppercase">Preferred Skills</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {match.preferredSkillsMatched.length} / {totalPref || 0} Matched
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Score: {match.scoreBreakdown?.preferredSkillsScore ?? 0} / 15 pts
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-[11px] uppercase">Experience</span>
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {match.candidateExperienceYears > 0 ? `${match.candidateExperienceYears} yrs` : 'Open'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate" title={match.experienceAssessment}>
            {match.experienceAssessment}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/60 dark:border-surface-dark-border space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-[11px] uppercase">Qualification</span>
            <GraduationCap className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white truncate" title={match.candidateHighestEducation}>
            {match.candidateHighestEducation}
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate" title={match.qualificationAssessment}>
            {match.qualificationAssessment}
          </p>
        </div>
      </div>

      {/* Matched & Missing Skills Grid */}
      <div className="space-y-4 pt-2">
        {/* Matched Skills */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Matched Skills ({match.requiredSkillsMatched.length + match.preferredSkillsMatched.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {[...match.requiredSkillsMatched, ...match.preferredSkillsMatched].map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Required Skills */}
        {match.requiredSkillsMissing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Missing Required Skills ({match.requiredSkillsMissing.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {match.requiredSkillsMissing.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                >
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Preferred Skills */}
        {match.preferredSkillsMissing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Missing Preferred / Secondary Skills ({match.preferredSkillsMissing.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {match.preferredSkillsMissing.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-surface-dark-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Candidate Summary */}
      {summary && (
        <div className="pt-4 border-t border-slate-100 dark:border-surface-dark-border space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Candidate Summary
            </h4>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-3.5 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border">
            {summary.summaryText}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Strengths */}
            {summary.strengths && summary.strengths.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1.5">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-xs">
                  Candidate Strengths:
                </span>
                <ul className="space-y-1 list-disc list-inside text-emerald-800 dark:text-emerald-300/90 text-[11px]">
                  {summary.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {summary.gaps && summary.gaps.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
                <span className="font-bold text-amber-900 dark:text-amber-300 block text-xs">
                  Notable Gaps / Review Areas:
                </span>
                <ul className="space-y-1 list-disc list-inside text-amber-800 dark:text-amber-300/90 text-[11px]">
                  {summary.gaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
