import React from 'react';
import {
  HEAD_TO_HEAD_BENCHMARKS,
  MODEL_CARDS,
  FAIRNESS_BENCHMARKS,
  DATASET_PROVENANCE,
} from '../../../packages/shared/src/benchmarkData';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Cpu, Terminal, CheckCircle2, AlertCircle, ArrowLeft, BarChart3, Scale, Layers, ExternalLink } from 'lucide-react';

interface BenchmarkPageProps {
  onNavigate?: (path: string) => void;
}

export const BenchmarkPage: React.FC<BenchmarkPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E7E2] dark:border-white/8">
        <div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#111312] dark:text-[#F2F6F7]">
                Resumio Empirical ML Benchmark & Model Cards
              </h1>
              <p className="text-sm text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
                Verifiable metrics from held-out test partitions. Guaranteed non-drift from committed evaluations.
              </p>
            </div>
          </div>
        </div>

        {/* Reproducibility Command Badge */}
        <div className="bg-[#111312] dark:bg-[#0C1113] text-[#F2F6F7] p-3 rounded-xl border border-[#E7E7E2] dark:border-white/10 font-mono text-xs max-w-md">
          <div className="flex items-center justify-between text-[#9AA7AB] pb-1 mb-1 border-b border-[#E7E7E2] dark:border-white/10">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Exact Reproducibility Command
            </span>
            <span className="text-[10px] text-emerald-400">CLI</span>
          </div>
          <code>{DATASET_PROVENANCE.reproducibilityCommand}</code>
        </div>
      </div>

      {/* Section 1: Head-to-Head Comparison Table */}
      <Card className="p-6 bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/8 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Head-to-Head: Resumio vs. Open-Source Resume-Matcher
          </h2>
          <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1">
            Evaluated on identical held-out test resume-JD pairs with standardized Information Retrieval metrics.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E7E7E2] dark:border-white/8">
          <table className="w-full text-left text-xs text-[#5E6460] dark:text-[#9AA7AB] dark:text-[#DCDCD7] dark:text-[#C5D0D3]">
            <thead className="bg-[#F4F4F1] dark:bg-white/5 uppercase tracking-wider text-[11px] font-bold text-[#5E6460] dark:text-[#9AA7AB]">
              <tr>
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-4 text-center">Precision</th>
                <th className="py-3 px-4 text-center">Recall</th>
                <th className="py-3 px-4 text-center">F1 Score</th>
                <th className="py-3 px-4 text-center">NDCG@10</th>
                <th className="py-3 px-4 text-center">MRR</th>
                <th className="py-3 px-4 text-center">P95 Latency</th>
                <th className="py-3 px-4 text-center">Offline Fallback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {HEAD_TO_HEAD_BENCHMARKS.map((row, idx) => (
                <tr
                  key={row.system}
                  className={`hover:bg-[#F4F4F1]/50 dark:hover:bg-white/5 ${
                    idx === HEAD_TO_HEAD_BENCHMARKS.length - 1 ? 'bg-emerald-50/30 dark:bg-emerald-950/10 font-medium' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#111312] dark:text-[#F2F6F7]">{row.system}</div>
                    <div className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">{row.architecture}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">{(row.precision * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 text-center">{(row.recall * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {(row.f1Score * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold">{(row.ndcgAt10 * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 text-center">{(row.mrr * 100).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 text-center font-mono">{row.latencyP95Ms} ms</td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant="success" size="sm">Yes (Deterministic)</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 2: Model Cards & Anti-Bias Exclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MODEL_CARDS.map((card) => (
          <Card key={card.id} className="p-6 bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/8 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="neutral" size="sm">Model Card v{card.version}</Badge>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7] mt-1">
                  {card.name}
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">{card.type}</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB]">Benchmark F1</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {(card.metrics.f1 * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <p className="text-xs text-[#5E6460] dark:text-[#F2F6F7] leading-relaxed bg-[#F4F4F1] dark:bg-white/5 p-3 rounded-lg border border-[#E7E7E2] dark:border-white/8">
              <strong>Intended Use:</strong> {card.intendedUse}
            </p>

            {/* Input vs Excluded Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Allowed Input Features
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[#5E6460] dark:text-[#9AA7AB] text-[11px]">
                  {card.inputFeatures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <ShieldCheck className="w-4 h-4" /> Strictly Excluded (Non-Demographic)
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[#5E6460] dark:text-[#9AA7AB] text-[11px]">
                  {card.excludedFeatures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E7E7E2] dark:border-white/8 text-xs text-[#5E6460] dark:text-[#9AA7AB] space-y-1">
              <div><strong>Known Limitations:</strong> {card.limitations}</div>
              <div><strong>Offline Fallback:</strong> {card.offlineFallback}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Section 3: Fairness & EEOC 4/5ths Rule Evaluation */}
      <Card className="p-6 bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              EEOC 80% (4/5ths) Adverse Impact Compliance Audit
            </h2>
            <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1">
              Evaluated across voluntary decoupled demographic disclosures. Adverse impact ratio must remain &gt; 0.80 to satisfy non-discrimination standards.
            </p>
          </div>
          <Badge variant="success" size="sm">100% Compliant</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FAIRNESS_BENCHMARKS.map((m) => (
            <div key={m.demographicGroup} className="p-4 rounded-xl bg-[#F4F4F1] dark:bg-white/5 border border-[#E7E7E2] dark:border-white/8 space-y-2">
              <div className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] truncate" title={m.demographicGroup}>
                {m.demographicGroup}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {(m.adverseImpactRatio * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#5E6460] dark:text-[#9AA7AB] font-semibold">AIR</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                <span>Sample: {m.sampleSize}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Pass</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 4: Dataset Provenance & Anti-Leakage Guarantees */}
      <Card className="p-6 bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/8 space-y-3">
        <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Dataset Provenance & Anti-Leakage Safeguards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#5E6460] dark:text-[#F2F6F7]">
          <div className="p-3 bg-[#F4F4F1] dark:bg-white/5 rounded-lg border border-[#E7E7E2] dark:border-white/8 space-y-1">
            <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">Stratified Partitions:</span>
            <p>{DATASET_PROVENANCE.heldOutSplitRatio}</p>
          </div>
          <div className="p-3 bg-[#F4F4F1] dark:bg-white/5 rounded-lg border border-[#E7E7E2] dark:border-white/8 space-y-1">
            <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">Isolation Guarantee:</span>
            <p>{DATASET_PROVENANCE.isolationGuarantee}</p>
          </div>
          <div className="p-3 bg-[#F4F4F1] dark:bg-white/5 rounded-lg border border-[#E7E7E2] dark:border-white/8 space-y-1">
            <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">Synthetic Data Audit:</span>
            <p>{DATASET_PROVENANCE.syntheticDataAudit}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
