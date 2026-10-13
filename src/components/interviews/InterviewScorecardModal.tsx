import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { InterviewScorecard, ScorecardRecommendation } from '../../types';
import { Award, CheckCircle2, Star, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';

interface InterviewScorecardModalProps {
  interviewId: string;
  candidateName?: string;
  jobTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onScorecardSaved?: (scorecard: InterviewScorecard) => void;
}

export const InterviewScorecardModal: React.FC<InterviewScorecardModalProps> = ({
  interviewId,
  candidateName,
  jobTitle,
  isOpen,
  onClose,
  onScorecardSaved,
}) => {
  const { showToast } = useToast();
  const [technicalDepth, setTechnicalDepth] = useState<number>(4);
  const [problemSolving, setProblemSolving] = useState<number>(4);
  const [communication, setCommunication] = useState<number>(4);
  const [culturalFit, setCulturalFit] = useState<number>(4);
  const [recommendation, setRecommendation] = useState<ScorecardRecommendation>('Hire');
  const [strengthInput, setStrengthInput] = useState('');
  const [strengths, setStrengths] = useState<string[]>(['Strong fundamentals in modern architecture']);
  const [weaknessInput, setWeaknessInput] = useState('');
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [evaluatorNotes, setEvaluatorNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && interviewId) {
      loadScorecard();
    }
  }, [isOpen, interviewId]);

  const loadScorecard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getInterviewScorecard(interviewId);
      if (res && res.scorecard) {
        const sc = res.scorecard;
        setTechnicalDepth(sc.technicalDepth || 4);
        setProblemSolving(sc.problemSolving || 4);
        setCommunication(sc.communication || 4);
        setCulturalFit(sc.culturalFit || 4);
        setRecommendation(sc.recommendation || 'Hire');
        setStrengths(sc.strengths || []);
        setWeaknesses(sc.weaknesses || []);
        setEvaluatorNotes(sc.evaluatorNotes || '');
      }
    } catch {
      // Default initial values
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStrength = () => {
    if (!strengthInput.trim()) return;
    setStrengths((prev) => [...prev, strengthInput.trim()]);
    setStrengthInput('');
  };

  const handleRemoveStrength = (index: number) => {
    setStrengths((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddWeakness = () => {
    if (!weaknessInput.trim()) return;
    setWeaknesses((prev) => [...prev, weaknessInput.trim()]);
    setWeaknessInput('');
  };

  const handleRemoveWeakness = (index: number) => {
    setWeaknesses((prev) => prev.filter((_, i) => i !== index));
  };

  const overallScore = Math.round(((technicalDepth + problemSolving + communication + culturalFit) / 4) * 100) / 100;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.submitInterviewScorecard(interviewId, {
        technicalDepth,
        problemSolving,
        communication,
        culturalFit,
        recommendation,
        strengths,
        weaknesses,
        evaluatorNotes,
      });

      if (res && res.success) {
        showToast('success', 'Scorecard Submitted', `Saved evaluation: ${overallScore}/5 (${recommendation})`);
        if (onScorecardSaved) onScorecardSaved(res.scorecard);
        onClose();
      }
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message || 'Unable to save scorecard.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderRatingButtons = (
    label: string,
    description: string,
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="p-3 rounded-lg border border-slate-200 dark:border-surface-dark-border bg-slate-50/60 dark:bg-surface-dark-bg/40 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</label>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300">
          {value} / 5
        </span>
      </div>
      <p className="text-[11px] text-slate-400">{description}</p>
      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
              value >= star
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-surface-dark-card text-slate-500 hover:bg-slate-300'
            }`}
          >
            {star}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-600" />
          <span>Interview Evaluation Scorecard</span>
        </div>
      }
      description={`Structured 5-point grading rubric for ${candidateName || 'Candidate'}${jobTitle ? ` (${jobTitle})` : ''}.`}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Composite Score:</span>
            <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
              {overallScore} / 5.0
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Submit Scorecard
            </Button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* 4 Grading Rubrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {renderRatingButtons(
              'Technical Depth',
              'Engineering mastery, code comprehension, and architectural choices',
              technicalDepth,
              setTechnicalDepth
            )}
            {renderRatingButtons(
              'Problem Solving',
              'Analytical decomposition, algorithmic reasoning, edge cases',
              problemSolving,
              setProblemSolving
            )}
            {renderRatingButtons(
              'Communication',
              'Clarity, conciseness, structured explanations, listening skills',
              communication,
              setCommunication
            )}
            {renderRatingButtons(
              'Cultural & Values Fit',
              'Ownership, collaborative spirit, growth mindset, accountability',
              culturalFit,
              setCulturalFit
            )}
          </div>

          {/* Recommendation Selector */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Hiring Recommendation
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['Strong Hire', 'Hire', 'Undecided', 'No Hire', 'Strong No Hire'] as const).map((rec) => (
                <button
                  key={rec}
                  type="button"
                  onClick={() => setRecommendation(rec)}
                  className={`py-2 text-[11px] font-bold rounded-control border transition-colors ${
                    recommendation === rec
                      ? rec.includes('Hire') && !rec.includes('No')
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : rec === 'Undecided'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white dark:bg-surface-dark-card border-slate-200 dark:border-surface-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>

          {/* Key Strengths */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Demonstrated Strengths
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={strengthInput}
                onChange={(e) => setStrengthInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStrength())}
                placeholder="e.g. Articulated distributed locking algorithms smoothly"
                className="flex-1 px-3 py-1.5 text-xs rounded-control border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-input text-slate-900 dark:text-white"
              />
              <Button variant="secondary" size="sm" onClick={handleAddStrength} className="text-xs">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {strengths.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <ThumbsUp className="w-3 h-3 text-emerald-600" />
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveStrength(idx)}
                    className="ml-1 hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Observed Areas for Improvement */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Growth Areas / Concerns
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={weaknessInput}
                onChange={(e) => setWeaknessInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWeakness())}
                placeholder="e.g. Hesitated when asked about database sharding strategies"
                className="flex-1 px-3 py-1.5 text-xs rounded-control border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-input text-slate-900 dark:text-white"
              />
              <Button variant="secondary" size="sm" onClick={handleAddWeakness} className="text-xs">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {weaknesses.map((w, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                >
                  <ThumbsDown className="w-3 h-3 text-rose-600" />
                  {w}
                  <button
                    type="button"
                    onClick={() => handleRemoveWeakness(idx)}
                    className="ml-1 hover:text-rose-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Evaluator Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Executive Evaluation Notes
            </label>
            <textarea
              rows={3}
              value={evaluatorNotes}
              onChange={(e) => setEvaluatorNotes(e.target.value)}
              placeholder="Candidate demonstrated deep technical acumen, proactive ownership, and answered all scenario-based questions with high precision."
              className="w-full p-2.5 text-xs rounded-control border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-input text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};
