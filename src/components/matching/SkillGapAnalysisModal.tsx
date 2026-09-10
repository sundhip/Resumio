import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MatchScore } from '../ui/MatchScore';
import type { SkillGapAnalysis, ResumeJobMatch } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building2,
  TrendingUp,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

interface SkillGapAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  skillGap: SkillGapAnalysis | null;
  match: ResumeJobMatch | null;
  isLoading?: boolean;
}

export const SkillGapAnalysisModal: React.FC<SkillGapAnalysisModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  skillGap,
  match,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="">
      <div className="space-y-6 pb-2">
        {/* Header Strip */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-surface-dark-border">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              AI SKILL GAP ANALYSIS
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Skill Alignment & Development Gaps
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                {jobTitle}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {companyName}
              </span>
            </div>
          </div>

          {match && (
            <div className="shrink-0">
              <MatchScore score={match.matchScore} variant="compact" size="md" />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3 animate-pulse">
            <Sparkles className="w-8 h-8 text-brand-600 animate-spin mx-auto text-brand-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Synthesizing skill gap analysis...
            </p>
          </div>
        ) : !skillGap ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No skill gap data available for this position.
          </div>
        ) : (
          <div className="space-y-5">
            {/* AI Strategic Overview Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50/70 via-indigo-50/50 to-transparent dark:from-brand-950/40 dark:via-indigo-950/20 dark:to-transparent border border-brand-200/80 dark:border-brand-900/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-1.5">
              <span className="font-bold text-brand-800 dark:text-brand-300 flex items-center gap-1.5 text-sm">
                <Lightbulb className="w-4 h-4 text-brand-600" />
                Executive Summary
              </span>
              <p>{skillGap.overview}</p>
            </div>

            {/* Matched Strengths */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Your Verified Strengths ({skillGap.matchedAreas.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillGap.matchedAreas.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {skill}
                  </span>
                ))}
                {skillGap.matchedAreas.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No direct matches recorded</span>
                )}
              </div>
            </div>

            {/* Priority Required Gaps */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Priority Required Skills to Bridge ({skillGap.priorityGaps.length})
              </h3>
              {skillGap.priorityGaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillGap.priorityGaps.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                    >
                      <span className="w-4 h-4 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 flex items-center justify-center text-[10px] font-extrabold">
                        {idx + 1}
                      </span>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  All mandatory required skills are met by your background!
                </div>
              )}
            </div>

            {/* Preferred / Nice-to-Have Gaps */}
            {skillGap.preferredGaps && skillGap.preferredGaps.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Nice-to-Have / Preferred Skill Opportunities ({skillGap.preferredGaps.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGap.preferredGaps.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Overview */}
            {skillGap.recommendationsOverview && (
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  Preparation Advice:
                </span>
                {skillGap.recommendationsOverview}
              </div>
            )}

            {/* Privacy Note */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-dark-bg/40 border border-slate-200/60 dark:border-surface-dark-border text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                This skill gap analysis is generated privately for your personal development and candidate preparation.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-surface-dark-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
