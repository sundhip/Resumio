import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';
import type { ExplainableMatchScoreResult } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  Info,
} from 'lucide-react';

interface ExplainableScoreModalProps {
  applicationId?: string;
  matchId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainableScoreModal: React.FC<ExplainableScoreModalProps> = ({
  applicationId,
  matchId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<ExplainableMatchScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && (applicationId || matchId)) {
      loadExplanation();
    }
  }, [isOpen, applicationId, matchId]);

  const loadExplanation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let res;
      if (applicationId) {
        res = await api.getApplicationMatchExplanation(applicationId);
      } else if (matchId) {
        res = await api.getMatchExplanation(matchId);
      }
      if (res && res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load score explanation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Why This Match Score? (Explainable AI)"
      description="Transparent, mathematical breakdown of the candidate's alignment score based on deterministic Phase 6 scoring criteria."
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Computing deterministic factor breakdown...</p>
        </div>
      ) : error || !data ? (
        <div className="p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error || 'Score breakdown unavailable.'}</p>
          <Button variant="secondary" size="sm" onClick={loadExplanation}>
            Retry Calculation
          </Button>
        </div>
      ) : (
        <div className="space-y-6 pt-1 text-xs sm:text-sm">
          {/* Header Score Banner */}
          <div className="p-4 rounded-card bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-indigo-500/10 border border-brand-200 dark:border-brand-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Target Candidate Alignment
                </span>
                <Badge
                  variant={
                    data.finalScore >= 80
                      ? 'success'
                      : data.finalScore >= 60
                      ? 'info'
                      : data.finalScore >= 40
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {data.categoryLabel}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {data.candidateName} for {data.jobTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Company: <span className="font-semibold text-slate-700 dark:text-slate-300">{data.companyName}</span> • Algorithm v{data.algorithmVersion}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
                  {data.finalScore}%
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Final Overall Score</span>
              </div>
            </div>
          </div>

          {/* 5-Factor Mathematical Score Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-600" /> Scoring Component Breakdown (Sum: 100 pts)
              </h4>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {data.isConsistent ? '✓ 100% Mathematically Verified' : 'Standard Formula'}
              </span>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-surface-dark-bg/60 p-4 rounded-card border border-slate-200/70 dark:border-surface-dark-border">
              {/* 1. Required Skills */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    1. Required Skills Match (Weight: 50%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data.components.requiredSkills.score} / {data.components.requiredSkills.maxScore} pts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${(data.components.requiredSkills.score / 50) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {data.components.requiredSkills.summary}
                </p>
              </div>

              {/* 2. Preferred Skills */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    2. Preferred Skills (Weight: 15%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data.components.preferredSkills.score} / {data.components.preferredSkills.maxScore} pts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(data.components.preferredSkills.score / 15) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {data.components.preferredSkills.summary}
                </p>
              </div>

              {/* 3. Experience */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    3. Experience Length Alignment (Weight: 20%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data.components.experience.score} / {data.components.experience.maxScore} pts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(data.components.experience.score / 20) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {data.components.experience.summary}
                </p>
              </div>

              {/* 4. Qualification */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    4. Educational Qualification (Weight: 10%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data.components.qualification.score} / {data.components.qualification.maxScore} pts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(data.components.qualification.score / 10) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {data.components.qualification.summary}
                </p>
              </div>

              {/* 5. Relevance / Portfolio */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    5. Profile Completeness & Project Depth (Weight: 5%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data.components.relevance.score} / {data.components.relevance.maxScore} pts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${(data.components.relevance.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Matched vs Missing Skills Fact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-card bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified Matched Skills ({data.matchedSkills.required.length + data.matchedSkills.preferred.length})
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {data.matchedSkills.required.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                  >
                    ✓ {skill} (Required)
                  </span>
                ))}
                {data.matchedSkills.preferred.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    ✓ {skill} (Preferred)
                  </span>
                ))}
                {data.matchedSkills.required.length === 0 && data.matchedSkills.preferred.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No skills verified yet</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-card bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Unevidenced / Missing Skills ({data.missingSkills.required.length + data.missingSkills.preferred.length})
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {data.missingSkills.required.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
                  >
                    ! {skill} (Mandatory)
                  </span>
                ))}
                {data.missingSkills.preferred.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
                  >
                    {skill} (Preferred)
                  </span>
                ))}
                {data.missingSkills.required.length === 0 && data.missingSkills.preferred.length === 0 && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    All job skills completely matched!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Natural Language Verified Explanation */}
          <div className="p-3.5 rounded-card bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Explainable Synthesis
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {data.naturalLanguageExplanation}
            </p>
            <p className="text-[11px] text-slate-400 italic">
              {data.factualSummary}
            </p>
          </div>

          {/* Footer Close */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-surface-dark-border">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3" /> Deterministic scoring eliminates black-box bias.
            </span>
            <Button variant="secondary" size="md" onClick={onClose}>
              Close Explanation
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
