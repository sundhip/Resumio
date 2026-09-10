import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { ApplicationTimeline } from '../../components/applications/ApplicationTimeline';
import { ExplainableScoreModal } from '../../components/matching/ExplainableScoreModal';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { CandidateApplicationDetail, StatusTimelineItem } from '../../types';
import {
  MapPin,
  FileText,
  DollarSign,
  Briefcase,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Clock,
} from 'lucide-react';

interface CandidateApplicationDetailsModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onWithdrawSuccess: () => void;
}

export const CandidateApplicationDetailsModal: React.FC<CandidateApplicationDetailsModalProps> = ({
  applicationId,
  isOpen,
  onClose,
  onWithdrawSuccess,
}) => {
  const { showToast } = useToast();

  const [application, setApplication] = useState<CandidateApplicationDetail | null>(null);
  const [timeline, setTimeline] = useState<StatusTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isConfirmingWithdraw, setIsConfirmingWithdraw] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isExplainScoreOpen, setIsExplainScoreOpen] = useState(false);

  useEffect(() => {
    if (isOpen && applicationId) {
      loadApplicationDetails(applicationId);
    } else {
      setApplication(null);
      setTimeline([]);
      setIsConfirmingWithdraw(false);
    }
  }, [isOpen, applicationId]);

  const loadApplicationDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await api.getCandidateApplicationById(id);
      if (res.success && res.application) {
        setApplication(res.application);
        setTimeline(res.timeline || []);
      }
    } catch (err: any) {
      showToast('error', 'Unable to load application details', err.message);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!applicationId) return;
    setIsWithdrawing(true);
    try {
      const res = await api.withdrawApplication(applicationId);
      if (res.success) {
        showToast('success', 'Application Withdrawn', 'Your application has been safely withdrawn.');
        setIsConfirmingWithdraw(false);
        onWithdrawSuccess();
        loadApplicationDetails(applicationId);
      }
    } catch (err: any) {
      showToast('error', 'Withdrawal failed', err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatSalary = (app: CandidateApplicationDetail) => {
    if (!app.salaryDisclosed || (!app.salaryMin && !app.salaryMax)) {
      return 'Salary Not Disclosed';
    }
    const curr = app.currency === 'INR' ? '₹' : app.currency === 'USD' ? '$' : `${app.currency} `;
    if (app.salaryMin && app.salaryMax) {
      return `${curr}${app.salaryMin.toLocaleString()} – ${curr}${app.salaryMax.toLocaleString()} / ${app.salaryPeriod || 'year'}`;
    }
    if (app.salaryMin) {
      return `From ${curr}${app.salaryMin.toLocaleString()} / ${app.salaryPeriod || 'year'}`;
    }
    return `Up to ${curr}${app.salaryMax?.toLocaleString()} / ${app.salaryPeriod || 'year'}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const canWithdraw = application && application.status !== 'Withdrawn' && application.status !== 'Rejected';

  return (
    <>
      <Modal
        isOpen={isOpen && !isConfirmingWithdraw}
        onClose={onClose}
        size="lg"
        title={
          isLoading ? (
            <div className="h-6 w-48 bg-slate-200 dark:bg-surface-dark-border rounded animate-pulse" />
          ) : application ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {application.jobTitle}
                </h3>
                <ApplicationStatusBadge status={application.status} size="sm" showDot />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {application.company} • Applied on {new Date(application.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          ) : (
            'Application Details'
          )
        }
        footer={
          application ? (
            <div className="flex items-center justify-between w-full">
              <div>
                {canWithdraw && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsConfirmingWithdraw(true)}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Withdraw Application
                  </Button>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : undefined
        }
      >
        {isLoading ? (
          <div className="space-y-4 py-4 animate-pulse">
            <div className="h-16 rounded-card bg-slate-100 dark:bg-surface-dark-bg" />
            <div className="h-28 rounded-card bg-slate-100 dark:bg-surface-dark-bg" />
            <div className="h-32 rounded-card bg-slate-100 dark:bg-surface-dark-bg" />
          </div>
        ) : application ? (
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Top Snapshot Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Location & Mode</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {application.location || 'Remote'} ({application.workMode})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employment</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  {application.employmentType}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Compensation</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 mt-0.5">
                  <DollarSign className="w-3 h-3" />
                  {formatSalary(application)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {application.status}
                </span>
              </div>
            </div>

            {/* Submitted Resume Card */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-600" />
                Submitted Resume Snapshot
              </h4>
              <div className="p-3.5 rounded-card border border-slate-200 dark:border-surface-dark-border bg-white dark:bg-surface-dark-card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-control bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-200 dark:border-rose-900/60">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {application.resumeFilename}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatFileSize(application.resumeFileSize)} • Attached snapshot at time of application
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExplainScoreOpen(true)}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                  >
                    AI Score Breakdown
                  </Button>

                  {application.resumeUrl && (
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-control bg-slate-100 hover:bg-slate-200 dark:bg-surface-dark-input dark:hover:bg-surface-dark-hover text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview Resume
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Letter (if attached) */}
            {application.coverLetter && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Your Cover Letter / Note
                </h4>
                <div className="p-3.5 rounded-card bg-slate-50 dark:bg-surface-dark-bg/60 border border-slate-200/80 dark:border-surface-dark-border text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {application.coverLetter}
                </div>
              </div>
            )}

            {/* Rejection Note (if rejected) */}
            {application.status === 'Rejected' && application.rejectionReason && (
              <div className="p-3.5 rounded-card bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-1">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  Employer Update Note
                </span>
                <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                  {application.rejectionReason}
                </p>
              </div>
            )}

            {/* Application Status Timeline */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-surface-dark-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                Application Progression Timeline
              </h4>
              <div className="p-4 rounded-card bg-slate-50 dark:bg-surface-dark-bg/50 border border-slate-200/80 dark:border-surface-dark-border">
                <ApplicationTimeline timeline={timeline} />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Confirmation Modal for Withdrawal */}
      {isConfirmingWithdraw && (
        <Modal
          isOpen={isConfirmingWithdraw}
          onClose={() => setIsConfirmingWithdraw(false)}
          size="sm"
          title="Withdraw Application?"
          description={`Are you sure you want to withdraw your application for ${application?.jobTitle} at ${application?.company}?`}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsConfirmingWithdraw(false)}
                disabled={isWithdrawing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleWithdraw}
                isLoading={isWithdrawing}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Confirm Withdrawal
              </Button>
            </>
          }
        >
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Withdrawing will mark your application as <strong>Withdrawn</strong> and notify the recruiter. You cannot undo this action.
          </p>
        </Modal>
      )}

      {/* Phase 8 Explainable AI Score Breakdown Modal for Candidate */}
      {application && (
        <ExplainableScoreModal
          applicationId={application.id}
          isOpen={isExplainScoreOpen}
          onClose={() => setIsExplainScoreOpen(false)}
        />
      )}
    </>
  );
};
