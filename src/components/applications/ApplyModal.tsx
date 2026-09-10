import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { JobPosting, CandidateResume } from '../../types';
import {
  FileText,
  Send,
  AlertCircle,
  Building2,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowRight,
  UploadCloud,
} from 'lucide-react';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosting;
  onSuccess: (applicationId: string) => void;
  onNavigateToResumeManager?: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  isOpen,
  onClose,
  job,
  onSuccess,
  onNavigateToResumeManager,
}) => {
  const { showToast } = useToast();

  const [resumes, setResumes] = useState<CandidateResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState<'details' | 'review'>('details');

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setStep('details');
      setCoverLetter('');
      loadResumes();
    }
  }, [isOpen]);

  const loadResumes = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await api.getFullCandidateProfile();
      if (res.success && res.data) {
        // The API returns resume object or we can check if there are resumes
        const primaryResume = res.data.resume;
        if (primaryResume) {
          setResumes([primaryResume]);
          setSelectedResumeId(primaryResume.id);
        } else {
          setResumes([]);
        }
      }
    } catch (err: any) {
      showToast('error', 'Unable to load profile resumes', err.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleApply = async () => {
    if (!selectedResumeId) {
      showToast('warning', 'Resume required', 'Please select or upload a resume to submit your application.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.applyToJob({
        jobId: job.id,
        resumeId: selectedResumeId,
        coverLetter: coverLetter.trim(),
      });

      if (res.success) {
        setIsSubmitted(true);
        showToast('success', 'Application Submitted!', `Your application for ${job.title} at ${job.company_name || 'the hiring company'} was submitted successfully.`);
        onSuccess(res.applicationId);
      }
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        isSubmitted ? (
          'Application Submitted'
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Apply for {job.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {job.company_name} • {job.location || 'Remote'}
              </p>
            </div>
          </div>
        )
      }
      footer={
        isSubmitted ? (
          <Button variant="primary" size="md" onClick={onClose} className="w-full">
            Done
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            {step === 'review' ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setStep('details')} disabled={isSubmitting}>
                  Back to Edit
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  isLoading={isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Confirm & Submit
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!selectedResumeId) {
                      showToast('warning', 'Resume required', 'Please select a resume before continuing.');
                      return;
                    }
                    setStep('review');
                  }}
                  disabled={isLoadingProfile || resumes.length === 0}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Review Application
                </Button>
              </>
            )}
          </div>
        )
      }
    >
      {isSubmitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Application Successfully Sent!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              The hiring team at <strong>{job.company_name}</strong> has received your profile and resume snapshot.
              You can track your application status in real-time under My Applications.
            </p>
          </div>
        </div>
      ) : step === 'review' ? (
        /* Step 2: Application Review */
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Applying Position
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{job.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {job.company_name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Submitted Resume Snapshot
            </span>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-control bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-200 dark:border-rose-900/60">
                PDF
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {selectedResume?.original_filename || 'Candidate Resume'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatFileSize(selectedResume?.file_size || 0)} • Snapshot attached
                </p>
              </div>
            </div>
          </div>

          {coverLetter.trim() ? (
            <div className="p-3.5 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cover Letter Note
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {coverLetter.trim()}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-control bg-slate-50 dark:bg-surface-dark-bg/40 text-[11px] text-slate-400 italic">
              No additional note attached.
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            By submitting, your candidate profile and the selected resume file will be shared with the recruiter.
          </p>
        </div>
      ) : (
        /* Step 1: Selection & Note */
        <div className="space-y-4">
          {/* Resume Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Resume <span className="text-rose-500">*</span>
              </label>
              {onNavigateToResumeManager && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToResumeManager();
                  }}
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Manage Resumes
                </button>
              )}
            </div>

            {isLoadingProfile ? (
              <div className="h-16 rounded-card bg-slate-100 dark:bg-surface-dark-bg animate-pulse" />
            ) : resumes.length === 0 ? (
              <div className="p-4 rounded-card border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No Active Resume Found</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Please upload a PDF or DOCX resume in your Resume Manager before applying.
                </p>
                {onNavigateToResumeManager && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onNavigateToResumeManager();
                    }}
                    leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                  >
                    Go to Resume Manager
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {resumes.map((resume) => {
                  const isSelected = selectedResumeId === resume.id;
                  return (
                    <div
                      key={resume.id}
                      onClick={() => setSelectedResumeId(resume.id)}
                      className={`p-3.5 rounded-card border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-500/20'
                          : 'border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-control flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 dark:bg-surface-dark-input text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {resume.original_filename}
                            </p>
                            {Boolean(resume.is_active) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Active Profile
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {formatFileSize(resume.file_size)} • {resume.file_type}
                          </p>
                        </div>
                      </div>

                      <input
                        type="radio"
                        name="resume-selection"
                        checked={isSelected}
                        onChange={() => setSelectedResumeId(resume.id)}
                        className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Cover Letter / Pitch */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Cover Letter / Pitch Note <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">{coverLetter.length}/1000</span>
            </div>
            <textarea
              rows={4}
              maxLength={1000}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself, highlight relevant achievements, or explain why you are a great fit for this position..."
              className="w-full p-3 rounded-control text-xs sm:text-sm bg-white dark:bg-surface-dark-input text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-surface-dark-border focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};
