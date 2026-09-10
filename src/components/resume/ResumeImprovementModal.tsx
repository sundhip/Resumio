import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { ResumeImprovementResult, JobPosting } from '../../types';
import {
  Sparkles,
  RefreshCw,
  Briefcase,
} from 'lucide-react';

interface ResumeImprovementModalProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeImprovementModal: React.FC<ResumeImprovementModalProps> = ({
  resumeId,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<ResumeImprovementResult | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (isOpen && resumeId) {
      loadJobs();
      loadAnalysis();
    }
  }, [isOpen, resumeId, selectedJobId]);

  const loadJobs = async () => {
    try {
      const res = await api.getPublicJobs({ limit: 20 });
      if (res.success && res.jobs) {
        setJobs(res.jobs);
      }
    } catch {
      // Handled silently
    }
  };

  const loadAnalysis = async (forceRegenerate: boolean = false) => {
    if (forceRegenerate) {
      setIsRegenerating(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await api.generateResumeImprovementAnalysis(
        resumeId,
        selectedJobId || undefined,
        forceRegenerate
      );
      if (res.success) {
        setData(res.data);
        if (forceRegenerate) {
          showToast('success', 'Analysis Refreshed', 'Generated fresh resume suggestions.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Analysis Failed', err.message || 'Unable to analyze resume.');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="AI Resume Review & Suggestions"
      description="Actionable, truthful guidance to strengthen your professional resume presentation and optimize ATS keyword discovery."
    >
      <div className="space-y-5 pt-1 text-xs sm:text-sm">
        {/* Target Job Selector Strip */}
        <div className="p-3 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-brand-600" /> Target Job Alignment (Optional)
            </span>
            <p className="text-[11px] text-slate-500">
              Select a position to analyze targeted skill gaps and tailoring tips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="h-8 px-2.5 text-xs font-semibold rounded-control bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">General Resume Review</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.company_name || (j as any).companyName}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAnalysis(true)}
              isLoading={isRegenerating}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Analyzing parsed resume sections and phrasing...</p>
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No resume review data available.
          </div>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {/* Overall Feedback Card */}
            <div className="p-3.5 rounded-card bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200/80 dark:border-brand-900/50 space-y-1">
              <span className="text-xs font-bold text-brand-800 dark:text-brand-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Overall Assessment
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {data.overallFeedback}
              </p>
            </div>

            {/* Target Job Specific Feedback (if selected) */}
            {data.targetJobComparison && (
              <div className="p-3.5 rounded-card bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Target Role: {data.targetJobComparison.jobTitle}
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {data.targetJobComparison.companyName}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {data.targetJobComparison.alignmentAdvice.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section-by-Section Recommendations */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Section-by-Section Guidance
              </h4>

              {data.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-card bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {sec.section}
                      </span>
                    </div>

                    <Badge
                      variant={
                        sec.status === 'Strong'
                          ? 'success'
                          : sec.status === 'Needs Improvement'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {sec.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    {sec.suggestions.map((sug, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-brand-600 font-bold shrink-0 mt-0.5">•</span>
                        <span className="leading-relaxed">{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-surface-dark-border">
          <span className="text-[11px] text-slate-400">
            Resumio assists with presentation clarity; never fabricate unevidenced credentials.
          </span>
          <Button variant="secondary" size="md" onClick={onClose}>
            Close Review
          </Button>
        </div>
      </div>
    </Modal>
  );
};
