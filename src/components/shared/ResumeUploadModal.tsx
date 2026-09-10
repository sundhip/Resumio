import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MatchScore } from '../ui/MatchScore';
import { useToast } from '../../context/ToastContext';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsingStage, setParsingStage] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const { showToast } = useToast();

  const stages = [
    'Parsing document layout & typography...',
    'Extracting work history & education entities...',
    'Semantic vector analysis & skill taxonomy matching...',
    'Generating AI fit breakdown & job alignment score...',
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.name.endsWith('.pdf') || selected.name.endsWith('.docx') || selected.name.endsWith('.doc')) {
        setFile(selected);
      } else {
        showToast('error', 'Invalid file type', 'Please upload a PDF or DOCX file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startAnalysis = () => {
    if (!file) return;
    setIsProcessing(true);
    setParsingStage(0);

    const interval = setInterval(() => {
      setParsingStage((prev) => {
        if (prev < 3) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsProcessing(false);
          setResultReady(true);
          showToast('success', 'Resume analyzed successfully!', 'AI extracted 14 core skills & calculated a 94% match.');
          return prev;
        }
      });
    }, 700);
  };

  const reset = () => {
    setFile(null);
    setParsingStage(0);
    setIsProcessing(false);
    setResultReady(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={reset}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-control bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              AI Resume Screener & Parser
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload candidate resume for deep neural qualification scoring
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        resultReady ? (
          <>
            <Button variant="secondary" onClick={reset}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                reset();
                onSuccess?.();
              }}
              rightIcon={<Check className="w-4 h-4" />}
            >
              Apply to Profile
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={reset} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={startAnalysis}
              disabled={!file || isProcessing}
              isLoading={isProcessing}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {isProcessing ? 'Screening with AI...' : 'Run AI Screening'}
            </Button>
          </>
        )
      }
    >
      {!resultReady ? (
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-card p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20'
                : 'border-slate-200 dark:border-surface-dark-border bg-slate-50/50 dark:bg-surface-dark-bg/40 hover:bg-slate-100/50 dark:hover:bg-surface-dark-hover/40'
            }`}
          >
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="resume-file-input" className="cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-subtle">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {file ? file.name : 'Click to upload or drag & drop resume'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports PDF, DOCX, DOC up to 15MB
              </p>
            </label>
          </div>

          {/* Selected File Card */}
          {file && (
            <div className="p-3.5 rounded-control bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-surface-dark-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI screening
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid
              </span>
            </div>
          )}

          {/* Processing Stages */}
          {isProcessing && (
            <div className="p-4 rounded-control bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-brand-700 dark:text-brand-300">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-brand-500" />
                  Neural Screening in progress
                </span>
                <span>{((parsingStage + 1) / 4) * 100}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-brand-100 dark:bg-brand-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-500"
                  style={{ width: `${((parsingStage + 1) / 4) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 animate-pulse">
                {stages[parsingStage]}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Result Breakdown */
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MatchScore score={94} variant="card" />
            <div className="sm:col-span-2 p-4 rounded-card border border-slate-200 dark:border-surface-dark-border bg-slate-50/50 dark:bg-surface-dark-bg/50 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" /> Passed High-Confidence Threshold
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Strong fit for Senior Full Stack & Lead Frontend roles
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Extracted 6.5+ years verifiable commercial experience with React, TypeScript, Node.js & cloud infrastructure.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-card border border-slate-200 dark:border-surface-dark-border space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Extracted Skills & Match Alignment
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {['React (98%)', 'TypeScript (95%)', 'Node.js (92%)', 'Tailwind CSS (96%)', 'PostgreSQL (88%)', 'Docker (82%)', 'GraphQL (85%)'].map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-control bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>AI Recommendation:</strong> Advance candidate directly to Technical Interview round. High probability of offer acceptance based on compensation and remote preference alignment.
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};
