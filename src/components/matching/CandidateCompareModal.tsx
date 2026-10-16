import React from 'react';
import {
  Modal,
  Button,
  ScoreRing,
  Pill,
  HatchedProgress,
} from '../kit';
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Printer,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';

export interface CompareCandidateData {
  id: string;
  name: string;
  headline?: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  semanticScore: number;
  experienceYears: number;
  skills: Record<string, 'matched' | 'partial' | 'missing'>;
  strengths: string;
  flags: string;
  recommendedQuestion: string;
}

export interface CandidateCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CompareCandidateData[];
  requiredSkills?: string[];
  isBlindMode?: boolean;
}

export const CandidateCompareModal: React.FC<CandidateCompareModalProps> = ({
  isOpen,
  onClose,
  candidates,
  requiredSkills = ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
  isBlindMode = false,
}) => {
  if (!candidates || candidates.length === 0) return null;

  // Find max overall score for subtle highlight
  const maxOverall = Math.max(...candidates.map((c) => c.overallScore));
  const maxSkills = Math.max(...candidates.map((c) => c.skillsScore));
  const maxExp = Math.max(...candidates.map((c) => c.experienceYears));

  const handleExportCsv = () => {
    const headers = ['Candidate', 'Overall Score', 'Skills Score', 'Experience Years', 'Key Strengths'];
    const rows = candidates.map((c) => [
      isBlindMode ? `Candidate #${c.id.slice(-4).toUpperCase()}` : c.name,
      `${c.overallScore}%`,
      `${c.skillsScore}%`,
      `${c.experienceYears} yrs`,
      `"${c.strengths.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Candidate_Comparison_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span className="text-base font-bold text-text-primary">
              Multi-Candidate Comparison Matrix ({candidates.length} Selected)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5 text-primary" />}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Report
            </Button>
          </div>
        </div>
      }
      description="Direct side-by-side evaluation of overall match fit, technical competency matrix, experience depth, and interview questions."
    >
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
          {/* STICKY CANDIDATE HEADERS */}
          <thead>
            <tr className="border-b-2 border-border-default bg-surface-elevated/80">
              <th className="p-3.5 font-bold text-text-muted uppercase text-micro w-48 sticky left-0 bg-surface-elevated z-10">
                Evaluation Factor
              </th>
              {candidates.map((c) => {
                const displayName = isBlindMode ? `Candidate #${c.id.slice(-4).toUpperCase()}` : c.name;
                const isTopCandidate = c.overallScore === maxOverall;
                return (
                  <th
                    key={c.id}
                    className={`p-3.5 text-center min-w-[180px] transition-colors ${
                      isTopCandidate ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full mx-auto bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        {isBlindMode ? '🔒' : displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <p className="font-bold text-sm text-text-primary truncate">{displayName}</p>
                          {isTopCandidate && (
                            <Pill variant="primary" size="sm">Top Fit</Pill>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted truncate">{c.headline || 'Software Engineer'}</p>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border-default/60">
            {/* ROW 1: OVERALL SCORE */}
            <tr className="hover:bg-surface-elevated/30">
              <td className="p-3.5 font-bold text-text-primary sticky left-0 bg-card z-10">
                Overall Match Score
              </td>
              {candidates.map((c) => {
                const isBest = c.overallScore === maxOverall;
                return (
                  <td key={c.id} className={`p-3.5 text-center ${isBest ? 'bg-primary/5' : ''}`}>
                    <div className="flex flex-col items-center gap-1">
                      <ScoreRing score={c.overallScore} size={54} strokeWidth={5} />
                      {isBest && (
                        <span className="text-[10px] font-bold text-primary uppercase">Leader</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* ROW 2: REQUIRED SKILLS SCORE */}
            <tr className="hover:bg-surface-elevated/30">
              <td className="p-3.5 font-semibold text-text-primary sticky left-0 bg-card z-10">
                Skills Match (40% Weight)
              </td>
              {candidates.map((c) => {
                const isBest = c.skillsScore === maxSkills;
                return (
                  <td key={c.id} className={`p-3.5 text-center ${isBest ? 'bg-primary/5' : ''}`}>
                    <div className="space-y-1 max-w-[130px] mx-auto">
                      <span className="font-mono font-bold text-primary figure">{c.skillsScore}%</span>
                      <HatchedProgress value={c.skillsScore} height={6} color={isBest ? '#1F8FA6' : '#9AA7AB'} />
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* ROW 3: EXPERIENCE SENIORITY */}
            <tr className="hover:bg-surface-elevated/30">
              <td className="p-3.5 font-semibold text-text-primary sticky left-0 bg-card z-10">
                Commercial Experience
              </td>
              {candidates.map((c) => {
                const isBest = c.experienceYears === maxExp;
                return (
                  <td key={c.id} className={`p-3.5 text-center font-mono font-bold ${isBest ? 'bg-primary/5 text-primary' : 'text-text-primary'}`}>
                    <span>{c.experienceYears} Years</span>
                    {isBest && <span className="block text-[10px] font-normal text-primary">Longest Tenure</span>}
                  </td>
                );
              })}
            </tr>

            {/* SKILLS MATRIX ROWS */}
            {requiredSkills.map((skill) => (
              <tr key={skill} className="hover:bg-surface-elevated/30">
                <td className="p-3 text-text-secondary pl-6 sticky left-0 bg-card z-10">
                  <span className="font-mono text-[11px]">{skill}</span>
                </td>
                {candidates.map((c) => {
                  const status = c.skills?.[skill] ?? 'matched';
                  return (
                    <td key={c.id} className="p-3 text-center">
                      {status === 'matched' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Full Match
                        </span>
                      ) : status === 'partial' ? (
                        <span className="inline-flex items-center gap-1 text-primary font-semibold text-xs">
                          <Sparkles className="w-4 h-4" /> Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-semibold text-xs">
                          <XCircle className="w-4 h-4" /> Missing
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* ROW: STRENGTHS */}
            <tr className="hover:bg-surface-elevated/30">
              <td className="p-3.5 font-semibold text-text-primary sticky left-0 bg-card z-10">
                Key Strengths
              </td>
              {candidates.map((c) => (
                <td key={c.id} className="p-3.5 text-xs text-text-secondary leading-relaxed">
                  {c.strengths}
                </td>
              ))}
            </tr>

            {/* ROW: FLAGS & GAPS */}
            <tr className="hover:bg-surface-elevated/30">
              <td className="p-3.5 font-semibold text-text-primary sticky left-0 bg-card z-10">
                Identified Gaps / Risks
              </td>
              {candidates.map((c) => (
                <td key={c.id} className="p-3.5 text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                  {c.flags}
                </td>
              ))}
            </tr>

            {/* ROW: RECOMMENDED INTERVIEW QUESTION */}
            <tr className="hover:bg-surface-elevated/30 bg-surface-elevated/20">
              <td className="p-3.5 font-semibold text-text-primary sticky left-0 bg-card z-10">
                Suggested Interview Probe
              </td>
              {candidates.map((c) => (
                <td key={c.id} className="p-3.5 text-xs text-text-muted italic leading-relaxed">
                  "{c.recommendedQuestion}"
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
