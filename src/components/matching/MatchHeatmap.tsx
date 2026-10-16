import React, { useState, useMemo } from 'react';
import { generateResumeMatchHeatmap, type HeatmapSpan, type HeatmapMatchedSkill } from '../../../packages/shared/src/matchHeatmap';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Info, CheckCircle2, AlertTriangle, Filter, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n';

interface MatchHeatmapProps {
  resumeText: string;
  matchedSkills?: HeatmapMatchedSkill[];
  requiredKeywords?: string[];
  className?: string;
}

export const MatchHeatmap: React.FC<MatchHeatmapProps> = ({
  resumeText,
  matchedSkills = [],
  requiredKeywords = [],
  className = '',
}) => {
  const { t } = useI18n();
  const [highlightStrong, setHighlightStrong] = useState(true);
  const [highlightWeak, setHighlightWeak] = useState(true);
  const [activeTooltipSpan, setActiveTooltipSpan] = useState<HeatmapSpan | null>(null);

  const heatmapResult = useMemo(() => {
    return generateResumeMatchHeatmap(resumeText, matchedSkills, requiredKeywords);
  }, [resumeText, matchedSkills, requiredKeywords]);

  return (
    <Card className={`p-5 bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('match.heatmapTitle')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual overlay tracing lines that directly contributed to job fit scores.
          </p>
        </div>

        {/* Evidence Metrics & Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-surface-dark-hover px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t('match.heatRatio')}:
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {heatmapResult.overallHeatRatio}%
            </span>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={highlightStrong}
              onChange={(e) => setHighlightStrong(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Strong ({heatmapResult.strongEvidenceCount})</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={highlightWeak}
              onChange={(e) => setHighlightWeak(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Weak ({heatmapResult.weakEvidenceCount})</span>
          </label>
        </div>
      </div>

      {/* Heatmap Text Content Container */}
      <div className="mt-4 relative">
        {/* Floating Tooltip Callout */}
        {activeTooltipSpan && (
          <div className="mb-4 p-3 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold flex items-center gap-1.5">
                {activeTooltipSpan.category === 'strong_evidence' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
                Requirement: {activeTooltipSpan.relatedRequirement || 'Keyword'}
              </span>
              {activeTooltipSpan.scoreContributionWeight && (
                <Badge variant="success" size="sm">
                  +{Math.round(activeTooltipSpan.scoreContributionWeight * 100)}% Weight
                </Badge>
              )}
            </div>
            <p className="text-slate-300">{activeTooltipSpan.explanation}</p>
          </div>
        )}

        <div className="font-mono text-xs leading-relaxed max-h-96 overflow-y-auto p-4 rounded-lg bg-slate-50 dark:bg-surface-dark-bg border border-slate-200 dark:border-slate-800 space-y-1">
          {heatmapResult.spans.map((span) => {
            const isStrongActive = span.category === 'strong_evidence' && highlightStrong;
            const isWeakActive = span.category === 'weak_evidence' && highlightWeak;

            let spanStyle = 'text-slate-700 dark:text-slate-300 py-0.5 px-2 rounded block transition-colors duration-150';
            if (isStrongActive) {
              spanStyle += ' bg-emerald-500/15 border-l-4 border-emerald-500 text-slate-900 dark:text-emerald-200 cursor-pointer hover:bg-emerald-500/25';
            } else if (isWeakActive) {
              spanStyle += ' bg-amber-500/15 border-l-4 border-amber-500 text-slate-900 dark:text-amber-200 cursor-pointer hover:bg-amber-500/25';
            }

            return (
              <div
                key={span.id}
                className={spanStyle}
                onMouseEnter={() => {
                  if (span.category !== 'neutral') {
                    setActiveTooltipSpan(span);
                  }
                }}
                onClick={() => {
                  if (span.category !== 'neutral') {
                    setActiveTooltipSpan(span);
                  }
                }}
              >
                {span.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
        {heatmapResult.legend.map((item) => (
          <div key={item.category} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.hexColor }} />
            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}:</span>
            <span className="text-slate-500 dark:text-slate-400">{item.description}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
