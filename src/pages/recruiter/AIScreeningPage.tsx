import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MatchScore } from '../../components/ui/MatchScore';
import { MOCK_CANDIDATES } from '../../mockData';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Zap,
  Layers,
} from 'lucide-react';

export const AIScreeningPage: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(85);
  const [candidateA] = useState(MOCK_CANDIDATES[0]);
  const [candidateB] = useState(MOCK_CANDIDATES[1]);
  const { showToast } = useToast();

  const handleSaveThreshold = () => {
    showToast('success', 'AI Screening criteria updated!', `Auto-shortlisting threshold set to ≥ ${threshold}% match score.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Screening & Comparison Center
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              Neural Match Engine v4.2
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep algorithmic candidate comparisons, skill vector matching, and automated qualification rules.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => showToast('info', 'Running batch neural screening across all 42 pending resumes...')}
          leftIcon={<Zap className="w-4 h-4" />}
        >
          Run Batch Neural Screen
        </Button>
      </div>

      {/* Configuration & Threshold Tuning Card */}
      <Card className="bg-gradient-to-r from-brand-50/40 via-white to-indigo-50/30 dark:from-brand-950/30 dark:via-surface-dark-card dark:to-surface-dark-card border-brand-200/70 dark:border-surface-dark-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              <Sliders className="w-4 h-4" />
              Automated Screening Threshold
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Automatically advance candidates who score above the qualification threshold
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              Candidates scoring above {threshold}% are automatically tagged as <strong>Shortlisted</strong> and queued for initial interview availability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="w-48 sm:w-64 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Min Score:</span>
                <span className="text-brand-600 dark:text-brand-400 font-bold">{threshold}% Match</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>
            <Button variant="secondary" size="md" onClick={handleSaveThreshold}>
              Apply Rule
            </Button>
          </div>
        </div>
      </Card>

      {/* Side-by-Side Candidate Deep Comparison Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            Side-by-Side Candidate Match Matrix
          </h2>
          <span className="text-xs text-slate-400">Comparing 2 top candidates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate A Card */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-dark-border">
              <div className="flex items-center gap-3">
                <img
                  src={candidateA.avatar}
                  alt={candidateA.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/30"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {candidateA.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {candidateA.title} • {candidateA.experienceYears} yrs
                  </p>
                </div>
              </div>
              <MatchScore score={candidateA.aiScore} variant="pill" size="lg" />
            </div>

            <MatchScore score={candidateA.aiScore} variant="bar" />

            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Core Strengths
              </h5>
              <ul className="text-xs space-y-1">
                {candidateA.topStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Extracted Skills Taxonomy
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {candidateA.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-surface-dark-bg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-surface-dark-border"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-surface-dark-border flex items-center justify-between text-xs">
              <span className="text-slate-400">Salary: {candidateA.salaryExpectation}</span>
              <Button variant="primary" size="sm">
                Shortlist Candidate
              </Button>
            </div>
          </Card>

          {/* Candidate B Card */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-dark-border">
              <div className="flex items-center gap-3">
                <img
                  src={candidateB.avatar}
                  alt={candidateB.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {candidateB.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {candidateB.title} • {candidateB.experienceYears} yrs
                  </p>
                </div>
              </div>
              <MatchScore score={candidateB.aiScore} variant="pill" size="lg" />
            </div>

            <MatchScore score={candidateB.aiScore} variant="bar" />

            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Core Strengths
              </h5>
              <ul className="text-xs space-y-1">
                {candidateB.topStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Extracted Skills Taxonomy
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {candidateB.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-surface-dark-bg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-surface-dark-border"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-surface-dark-border flex items-center justify-between text-xs">
              <span className="text-slate-400">Salary: {candidateB.salaryExpectation}</span>
              <Button variant="primary" size="sm">
                Shortlist Candidate
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
