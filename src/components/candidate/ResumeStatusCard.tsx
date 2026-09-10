import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import type { CandidateResume } from '../../types';
import { FileText, Upload, Eye, Download, ArrowRight, CheckCircle } from 'lucide-react';

interface ResumeStatusCardProps {
  resume: CandidateResume | null;
  onNavigateToResumePage: () => void;
  onPreview?: () => void;
  onDownload?: () => void;
}

export const ResumeStatusCard: React.FC<ResumeStatusCardProps> = ({
  resume,
  onNavigateToResumePage,
  onPreview,
  onDownload,
}) => {
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <Card padding="md" className="space-y-3.5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-control bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base">Resume File</CardTitle>
            <CardDescription>
              Primary document for recruiter applications
            </CardDescription>
          </div>
        </div>

        {resume && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        )}
      </CardHeader>

      {resume ? (
        <div className="space-y-3">
          <div className="p-3 rounded-control border border-slate-200 dark:border-surface-dark-border bg-slate-50/70 dark:bg-surface-dark-bg/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {resume.original_filename}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {formatFileSize(resume.file_size)} • Uploaded on {new Date(resume.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPreview && resume.file_type === 'PDF' && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={onPreview}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                Preview
              </Button>
            )}

            {onDownload && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={onDownload}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            onClick={onNavigateToResumePage}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage Resume & Replace
          </Button>
        </div>
      ) : (
        <div className="p-4 text-center rounded-control bg-slate-50/60 dark:bg-surface-dark-bg/40 border border-dashed border-slate-200 dark:border-surface-dark-border space-y-2.5">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No resume uploaded yet
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Upload your PDF or DOCX resume to enable quick applications and complete your profile.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={onNavigateToResumePage}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload Resume (+10%)
          </Button>
        </div>
      )}
    </Card>
  );
};
