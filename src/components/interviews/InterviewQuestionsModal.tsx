import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { InterviewQuestionSetResult, QuestionItem, QuestionSetStructure } from '../../types';
import {
  Sparkles,
  Copy,
  Check,
  Edit2,
  RefreshCw,
  Code2,
  Users,
  Briefcase,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface InterviewQuestionsModalProps {
  jobId?: string;
  applicationId?: string;
  candidateName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InterviewQuestionsModal: React.FC<InterviewQuestionsModalProps> = ({
  jobId,
  applicationId,
  candidateName,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<InterviewQuestionSetResult | null>(null);
  const [activeTab, setActiveTab] = useState<'technical' | 'behavioral' | 'experience' | 'roleSpecific'>('technical');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (isOpen && (jobId || applicationId)) {
      loadQuestions();
    }
  }, [isOpen, jobId, applicationId]);

  const loadQuestions = async (forceRegenerate: boolean = false) => {
    if (forceRegenerate) {
      setIsRegenerating(true);
    } else {
      setIsLoading(true);
    }

    try {
      let res;
      if (applicationId) {
        res = await api.generateCandidateInterviewQuestions(applicationId, forceRegenerate);
      } else if (jobId) {
        res = await api.generateJobInterviewQuestions(jobId, forceRegenerate);
      }

      if (res && res.success) {
        setData(res.data);
        if (forceRegenerate) {
          showToast('success', 'Questions Regenerated', 'Generated a fresh tailored question set.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Generation Failed', err.message || 'Unable to generate interview questions.');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleCopyQuestion = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('success', 'Copied to Clipboard', 'Question text copied.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (item: QuestionItem) => {
    setEditingId(item.id);
    setEditText(item.question);
  };

  const handleSaveEdit = async () => {
    if (!data || !editingId || !editText.trim()) return;

    const updatedQuestions: QuestionSetStructure = {
      technical: data.questions.technical.map((q) => (q.id === editingId ? { ...q, question: editText.trim() } : q)),
      behavioral: data.questions.behavioral.map((q) => (q.id === editingId ? { ...q, question: editText.trim() } : q)),
      experience: data.questions.experience.map((q) => (q.id === editingId ? { ...q, question: editText.trim() } : q)),
      roleSpecific: data.questions.roleSpecific.map((q) => (q.id === editingId ? { ...q, question: editText.trim() } : q)),
    };

    try {
      const res = await api.updateInterviewQuestionSet(data.id, updatedQuestions);
      if (res.success) {
        setData(res.data);
        setEditingId(null);
        showToast('success', 'Question Updated', 'Your custom question edits were saved.');
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const currentQuestions = data ? data.questions[activeTab] || [] : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        candidateName
          ? `AI Interview Questions for ${candidateName}`
          : `AI Interview Questions: ${data?.jobTitle || 'Job Role'}`
      }
      description="Evidence-based technical, behavioral, and experiential questions tailored to job requirements and candidate profile facts."
    >
      <div className="space-y-4 pt-1 text-xs sm:text-sm">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-surface-dark-border">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'technical', label: 'Technical', icon: <Code2 className="w-3.5 h-3.5" />, count: data?.questions.technical.length || 0 },
                { id: 'behavioral', label: 'Behavioral', icon: <Users className="w-3.5 h-3.5" />, count: data?.questions.behavioral.length || 0 },
                { id: 'experience', label: 'Experience', icon: <Briefcase className="w-3.5 h-3.5" />, count: data?.questions.experience.length || 0 },
                { id: 'roleSpecific', label: 'Role-Specific', icon: <Layers className="w-3.5 h-3.5" />, count: data?.questions.roleSpecific.length || 0 },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-surface-dark-card text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-surface-dark-hover'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Regenerate Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadQuestions(true)}
            isLoading={isRegenerating}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs shrink-0"
          >
            Regenerate Questions
          </Button>
        </div>

        {/* Question Cards List */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Synthesizing interview questions from job requirements...</p>
          </div>
        ) : currentQuestions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No questions available in this category.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {currentQuestions.map((q, idx) => {
              const isEditing = editingId === q.id;

              return (
                <div
                  key={q.id}
                  className="p-3.5 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>

                      <div className="flex-1 space-y-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                              className="w-full p-2 text-xs rounded-control border border-brand-500 bg-white dark:bg-surface-dark-card text-slate-900 dark:text-white focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <Button variant="primary" size="sm" onClick={handleSaveEdit} className="text-xs">
                                Save
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => setEditingId(null)} className="text-xs">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {q.question}
                          </p>
                        )}

                        {q.targetSkill && (
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Target Skill: {q.targetSkill}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyQuestion(q.id, q.question)}
                          title="Copy Question"
                          className="p-1.5 rounded-control text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-surface-dark-card transition-colors"
                        >
                          {copiedId === q.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleStartEdit(q)}
                          title="Edit Question"
                          className="p-1.5 rounded-control text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-surface-dark-card transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {q.evaluationCriteria && (
                    <div className="p-2 rounded-control bg-white dark:bg-surface-dark-card/60 border border-slate-100 dark:border-surface-dark-border text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300">Evaluation Tip: </strong>
                        {q.evaluationCriteria}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-surface-dark-border">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-600" /> Questions are advisory suggestions for interviewers.
          </span>
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
