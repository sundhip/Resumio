import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { api } from '../../services/api';

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename?: string;
  onDownload?: () => void;
}

export const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  isOpen,
  onClose,
  filename = 'Resume.pdf',
  onDownload,
}) => {
  const previewUrl = api.getResumePreviewUrl();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Resume Preview
            </h3>
            <p className="text-xs text-slate-400 font-normal">{filename}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in New Window
          </a>

          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDownload}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download PDF
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Close Preview
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full h-[72vh] rounded-control border border-slate-200 dark:border-surface-dark-border bg-slate-900/10 dark:bg-slate-900 overflow-hidden">
        <iframe
          src={`${previewUrl}#toolbar=0`}
          title="Resume Document Viewer"
          className="w-full h-full border-0"
        />
      </div>
    </Modal>
  );
};
