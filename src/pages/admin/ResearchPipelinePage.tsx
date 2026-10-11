import React, { useState, useEffect } from 'react';
import {
  Database,
  Sparkles,
  TrendingUp,
  Download,
  Play,
  Layers,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Cpu,
  FileSpreadsheet
} from 'lucide-react';

export const ResearchPipelinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dataset' | 'augment' | 'experiments' | 'results'>('dataset');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dataset State
  const [datasetSummary, setDatasetSummary] = useState<any>(null);

  // Augmentation State
  const [targetClass, setTargetClass] = useState<string>('Security');
  const [requestedCount, setRequestedCount] = useState<number>(3);
  const [augmentationResult, setAugmentationResult] = useState<any>(null);

  // Experiment State
  const [experimentResult, setExperimentResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Matching & Ranking Evaluation State
  const [matchingEval, setMatchingEval] = useState<any>(null);

  const token = localStorage.getItem('token');

  // Fetch Matching Evaluation
  const fetchMatchingEvaluation = async () => {
    try {
      const res = await fetch('/api/research/evaluation/matching', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMatchingEval(data);
      }
    } catch {
      // Offline fallback / error handled cleanly
    }
  };

  // Fetch Dataset Summary
  const fetchDatasetSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/research/dataset/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch dataset summary');
      const data = await res.json();
      setDatasetSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Experiment Results & History
  const fetchResults = async () => {
    try {
      const res = await fetch('/api/research/results', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.latestResult) setExperimentResult(data.latestResult);
        if (data.history) setHistory(data.history);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDatasetSummary();
    fetchResults();
    fetchMatchingEvaluation();
  }, []);

  // Run Augmentation
  const handleRunAugmentation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/research/augment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetClass, requestedCount }),
      });
      if (!res.ok) throw new Error('Failed to run augmentation');
      const data = await res.json();
      setAugmentationResult(data.runSummary);
      setActiveTab('augment');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run Comparative Experiment
  const handleRunEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/research/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ experimentName: 'Baseline vs Synthetic Augmented Job Classification' }),
      });
      if (!res.ok) throw new Error('Failed to evaluate experiment');
      const data = await res.json();
      setExperimentResult(data);
      fetchResults();
      setActiveTab('results');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open('/api/research/export?format=csv', '_blank');
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-surface-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Faculty Research Module (Phase 5)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            LLM Data Augmentation Research Pipeline
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Controlled empirical pipeline studying whether synthetic text augmentation mitigates class imbalance in recruitment domain classification. Grounded in academic methodology with test split preservation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-surface-dark-card hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-surface-dark-border transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleRunEvaluation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm transition disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Experiment
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-surface-dark-border gap-6">
        {[
          { id: 'dataset', label: 'Dataset & Imbalance Analysis', icon: <Database className="w-4 h-4" /> },
          { id: 'augment', label: 'Synthetic Augmentation Runs', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'results', label: 'Evaluation & Metrics', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'matching', label: 'Matching & Ranking Benchmarks', icon: <TrendingUp className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DATASET MANAGEMENT & IMBALANCE */}
      {activeTab === 'dataset' && datasetSummary && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Benchmark Records
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {datasetSummary.report.finalCount}
              </p>
              <span className="text-xs text-slate-500 mt-1 block">Validated & Deduplicated</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Majority Class
              </span>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {datasetSummary.report.majorityClass.label} ({datasetSummary.report.majorityClass.count})
              </p>
              <span className="text-xs text-slate-500 mt-1 block">
                {datasetSummary.report.classPercentages[datasetSummary.report.majorityClass.label]}% of dataset
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Minority Class
              </span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {datasetSummary.report.minorityClass.label} ({datasetSummary.report.minorityClass.count})
              </p>
              <span className="text-xs text-slate-500 mt-1 block">
                {datasetSummary.report.classPercentages[datasetSummary.report.minorityClass.label]}% of dataset
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Imbalance Ratio
              </span>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {datasetSummary.report.imbalanceRatio} : 1
              </p>
              <span className="text-xs text-slate-500 mt-1 block">Significant class disparity</span>
            </div>
          </div>

          {/* Distribution Breakdown Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Class Distribution Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-surface-dark-border text-xs uppercase text-slate-500">
                    <th className="py-2.5 px-3">Role Category</th>
                    <th className="py-2.5 px-3">Count</th>
                    <th className="py-2.5 px-3">Proportion</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(datasetSummary.report.classDistribution).map(([cls, cnt]) => (
                    <tr key={cls} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{cls}</td>
                      <td className="py-2.5 px-3">{cnt as any}</td>
                      <td className="py-2.5 px-3">{datasetSummary.report.classPercentages[cls]}%</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            cls === 'Security'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {cls === 'Security' ? 'Severe Minority' : 'Sufficient Samples'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dataset Preview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Sample Benchmark Records
            </h3>
            <div className="space-y-3">
              {datasetSummary.previewRecords.map((r: any) => (
                <div key={r.id} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-slate-500">{r.id}</span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {r.class_label}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUGMENTATION RUNS */}
      {activeTab === 'augment' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Configure Synthetic Augmentation Run
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Select a minority class to augment using the server-side AI provider. Samples are generated and tested against 5 validation filters before entering the training split.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Target Class
                </label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Security">Security (Minority Class)</option>
                  <option value="DevOps">DevOps (Moderate Class)</option>
                  <option value="Backend">Backend</option>
                  <option value="Frontend">Frontend</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Requested Sample Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={requestedCount}
                  onChange={(e) => setRequestedCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleRunAugmentation}
              disabled={loading}
              className="mt-5 px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate & Filter Synthetic Samples
            </button>
          </div>

          {augmentationResult && (
            <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Augmentation Quality Filter Results
                </h3>
                <span className="text-xs font-mono text-slate-500">{augmentationResult.runId}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-xs text-slate-500">Requested</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{augmentationResult.requestedCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                  <span className="text-xs">Generated</span>
                  <p className="text-lg font-bold">{augmentationResult.generatedCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  <span className="text-xs">Accepted</span>
                  <p className="text-lg font-bold">{augmentationResult.acceptedCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                  <span className="text-xs">Rejected</span>
                  <p className="text-lg font-bold">{augmentationResult.rejectedCount}</p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Accepted Synthetic Samples (Tagged with Provenance)
                </h4>
                {augmentationResult.acceptedSamples.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-purple-600 dark:text-purple-400">{s.id}</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                        provenance: {s.provenance}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EVALUATION & RESULTS */}
      {activeTab === 'results' && experimentResult && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/10 to-indigo-900/10 border border-purple-200 dark:border-purple-800/60">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hypothesis Outcome: {experimentResult.hypothesisOutcome}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {experimentResult.summaryText}
                </p>
              </div>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Baseline vs. Augmented Performance (Held-Out Test Set)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-surface-dark-border text-xs uppercase text-slate-500">
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3">Baseline (Original Train)</th>
                    <th className="py-2.5 px-3">Augmented (Train + Synthetic)</th>
                    <th className="py-2.5 px-3">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900 dark:text-white">Overall Accuracy</td>
                    <td className="py-3 px-3">{(experimentResult.baseline.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3">{(experimentResult.augmented.accuracy * 100).toFixed(1)}%</td>
                    <td className={`py-3 px-3 font-bold ${experimentResult.delta.accuracy >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {experimentResult.delta.accuracy >= 0 ? '+' : ''}{(experimentResult.delta.accuracy * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900 dark:text-white">Macro Precision</td>
                    <td className="py-3 px-3">{(experimentResult.baseline.macroPrecision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3">{(experimentResult.augmented.macroPrecision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-slate-500">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900 dark:text-white">Macro Recall</td>
                    <td className="py-3 px-3">{(experimentResult.baseline.macroRecall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3">{(experimentResult.augmented.macroRecall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-slate-500">-</td>
                  </tr>
                  <tr className="bg-purple-50/40 dark:bg-purple-950/20">
                    <td className="py-3 px-3 font-sans font-bold text-purple-700 dark:text-purple-300">Macro F1-Score (Primary Metric)</td>
                    <td className="py-3 px-3 font-bold">{(experimentResult.baseline.macroF1 * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">{(experimentResult.augmented.macroF1 * 100).toFixed(1)}%</td>
                    <td className={`py-3 px-3 font-bold ${experimentResult.delta.macroF1 >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {experimentResult.delta.macroF1 >= 0 ? '+' : ''}{(experimentResult.delta.macroF1 * 100).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Class F1 Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Per-Class F1-Score Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(experimentResult.delta.perClassF1).map(([cls, del]) => {
                const bF1 = experimentResult.baseline.perClass[cls]?.f1Score || 0;
                const aF1 = experimentResult.augmented.perClass[cls]?.f1Score || 0;
                return (
                  <div key={cls} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{cls}</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{(aF1 * 100).toFixed(1)}%</span>
                      <span className={`text-xs font-bold ${(del as number) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {(del as number) >= 0 ? '+' : ''}{((del as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">Baseline: {(bF1 * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MATCHING & RANKING BENCHMARKS (PHASE 10) */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          {matchingEval ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill F1-Score</span>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {(matchingEval.matchingMetrics.skillF1 * 100).toFixed(1)}%
                  </p>
                  <span className="text-xs text-emerald-600 mt-1 block font-medium">Ground Truth Verified</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ranking NDCG@3</span>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {(matchingEval.rankingMetrics.ndcgAtK[3] * 100).toFixed(1)}%
                  </p>
                  <span className="text-xs text-slate-500 mt-1 block">Normalized Discounted Gain</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ranking MRR</span>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {matchingEval.rankingMetrics.mrr.toFixed(3)}
                  </p>
                  <span className="text-xs text-slate-500 mt-1 block">Mean Reciprocal Rank</span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Engine Latency</span>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {matchingEval.performance?.[0]?.meanLatencyMs || matchingEval.matchingMetrics.latencyAvgMs}ms
                  </p>
                  <span className="text-xs text-emerald-600 mt-1 block font-medium">Deterministic Fast Path</span>
                </div>
              </div>

              {/* Detailed Evaluation Table */}
              <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border shadow-xs">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Matching Accuracy & Ranking Metrics (IR & Recommendation)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Evaluated on standard benchmark collection of 5 human-annotated resume-to-job relevance scenarios.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-surface-dark-border text-slate-500 text-xs uppercase font-semibold">
                        <th className="pb-3 px-3">Information Retrieval Metric</th>
                        <th className="pb-3 px-3">Measured Value</th>
                        <th className="pb-3 px-3">Theoretical Ideal</th>
                        <th className="pb-3 px-3">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Precision@1 (Top-1 Relevance)</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600">{(matchingEval.rankingMetrics.precisionAtK[1] * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 font-mono">100.0%</td>
                        <td className="py-3 px-3 text-xs text-slate-500">First ranked candidate is genuinely relevant</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Precision@3 (Top-3 Pool)</td>
                        <td className="py-3 px-3 font-mono font-bold">{(matchingEval.rankingMetrics.precisionAtK[3] * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 font-mono">100.0%</td>
                        <td className="py-3 px-3 text-xs text-slate-500">Proportion of top 3 candidates that are qualified</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Recall@3 (Pool Coverage)</td>
                        <td className="py-3 px-3 font-mono font-bold">{(matchingEval.rankingMetrics.recallAtK[3] * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 font-mono">100.0%</td>
                        <td className="py-3 px-3 text-xs text-slate-500">Coverage of all qualified applicants in top 3</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">NDCG@3 (Ranking Order Quality)</td>
                        <td className="py-3 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">{(matchingEval.rankingMetrics.ndcgAtK[3] * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 font-mono">100.0%</td>
                        <td className="py-3 px-3 text-xs text-slate-500">Highest qualified candidates positioned first</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">Explanation Consistency Rate</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600">{(matchingEval.matchingMetrics.explanationConsistencyRate * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 font-mono">100.0%</td>
                        <td className="py-3 px-3 text-xs text-slate-500">AI explanations match source evidence with 0 hallucination</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Loading matching and ranking benchmark measurements...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
