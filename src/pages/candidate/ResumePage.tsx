import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ResumePreviewModal } from '../../components/candidate/ResumePreviewModal';
import { ParsedResumeViewModal } from '../../components/resume/ParsedResumeViewModal';
import { ApplicationScreeningCard } from '../../components/screening/ApplicationScreeningCard';
import { DuplicateResumeBadge } from '../../components/resume/DuplicateResumeBadge';
import { ResumeImprovementModal } from '../../components/resume/ResumeImprovementModal';
import type { CandidateResume, ParsedResumeData, ResumeScreeningResult, ParsingStatus, ScreeningStatus } from '../../types';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
  Info,
  Layers,
  Search,
} from 'lucide-react';

interface ResumePageProps {
  onNavigate?: (path: string) => void;
}

export const ResumePage: React.FC<ResumePageProps> = ({ onNavigate }) => {
  const { profile, updateProfileContext } = useAuth();
  const { showToast } = useToast();

  const [resume, setResume] = useState<CandidateResume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phase 5 Parsed Data & Screening States
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [screening, setScreening] = useState<ResumeScreeningResult | null>(null);
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus>('Not Processed');
  const [screeningStatus, setScreeningStatus] = useState<ScreeningStatus>('Not Screened');
  const [isParsedModalOpen, setIsParsedModalOpen] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);

  // Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImprovementModalOpen, setIsImprovementModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active resume & parsed data from API
  const loadResumeData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getFullCandidateProfile();
      if (res.data) {
        setResume(res.data.resume);
        if (res.data.profile) {
          updateProfileContext(res.data.profile);
        }
      }

      if (res.data?.resume) {
        // Fetch parsed resume and screening data
        try {
          const parseRes = await api.getCandidateParsedResume();
          if (parseRes.success) {
            setParsedData(parseRes.parsed);
            setScreening(parseRes.screening || null);
            setParsingStatus(parseRes.status || 'Not Processed');
            setScreeningStatus(parseRes.screening ? 'Screened' : 'Not Screened');
          }
        } catch (parseErr) {
          console.warn('Parsed resume fetch warning:', parseErr);
        }
      } else {
        setParsedData(null);
        setScreening(null);
        setParsingStatus('Not Processed');
      }
    } catch (err: any) {
      showToast('error', 'Unable to load resume data', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReparse = async () => {
    setIsReparsing(true);
    try {
      const res = await api.reparseCandidateResume();
      if (res.success && res.parsed) {
        setParsedData(res.parsed);
        setScreening(res.screening || null);
        setParsingStatus('Processed');
        setScreeningStatus('Screened');
        showToast('success', 'Resume parsed successfully', 'Extracted structured data has been refreshed.');
      } else {
        setParsingStatus('Failed');
        showToast('error', 'Parsing issue', res.errorMessage || 'Could not parse text from this resume.');
      }
    } catch (err: any) {
      showToast('error', 'Reparse failed', err.message || 'Error executing document parser.');
    } finally {
      setIsReparsing(false);
    }
  };

  useEffect(() => {
    loadResumeData();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const handleFileValidationAndUpload = async (file: File) => {
    setErrorMessage(null);

    // Validate type: PDF or DOCX only
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    const isValidMime =
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword';

    if (!isValidExt && !isValidMime) {
      setErrorMessage('Invalid file format. Please upload a PDF (.pdf) or Word document (.docx).');
      showToast('error', 'Invalid file type', 'Only PDF and DOCX files are supported.');
      return;
    }

    // Validate size: max 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setErrorMessage('File size exceeds the 10MB maximum limit.');
      showToast('error', 'File too large', 'Please upload a resume under 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await api.uploadResumeWithProgress(file, (progress) => {
        setUploadProgress(progress);
      });

      if (res.success && res.resume) {
        setResume(res.resume);
        if (res.completion !== undefined && profile) {
          updateProfileContext({
            ...profile,
            profile_completion: res.completion,
          });
        }
        showToast(
          'success',
          'Resume uploaded successfully!',
          `${file.name} is now your active application document.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload resume. Please try again.');
      showToast('error', 'Upload failed', err.message || 'Error saving resume to server.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileValidationAndUpload(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleFileValidationAndUpload(selectedFile);
    }
  };

  const handleDownload = async () => {
    if (!resume) return;
    try {
      await api.downloadResume();
      showToast('success', 'Download started', resume.original_filename);
    } catch (err: any) {
      showToast('error', 'Download failed', err.message || 'Could not download resume file.');
    }
  };

  const handleDeleteResume = async () => {
    if (!resume) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteResume();
      if (res.success) {
        setResume(null);
        if (res.completion !== undefined && profile) {
          updateProfileContext({
            ...profile,
            profile_completion: res.completion,
          });
        }
        setIsDeleteModalOpen(false);
        showToast('success', 'Resume deleted', 'Your active resume document was removed.');
      }
    } catch (err: any) {
      showToast('error', 'Deletion failed', err.message || 'Could not remove resume file.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Resume Management
            </h1>
            <Badge variant="brand" size="sm">
              Phase 2 Active
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload, preview, download, and manage your official PDF or DOCX candidate resume.
          </p>
        </div>

        {onNavigate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('profile')}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            View Full Profile
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-control bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Upload Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Active Resume Card (if resume exists) */}
      {isLoading ? (
        <Card padding="lg" className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-slate-200 dark:bg-surface-dark-border rounded" />
          <div className="h-20 bg-slate-100 dark:bg-surface-dark-input rounded-control" />
        </Card>
      ) : resume ? (
        <Card padding="lg" className="space-y-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Active Application Resume</CardTitle>
                <CardDescription>
                  This file is attached to your candidate profile and visible to recruiters
                </CardDescription>
              </div>
            </div>

            <Badge variant="success" size="md">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Verified Active
            </Badge>
          </CardHeader>

          {/* Phase 8 Duplicate Resume Detection Warning (if applicable) */}
          <DuplicateResumeBadge resumeId={resume.id} variant="banner" />

          {/* Resume File Details Container */}
          <div className="p-4 sm:p-5 rounded-card border border-slate-200/80 dark:border-surface-dark-border bg-slate-50/70 dark:bg-surface-dark-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-surface-dark-input border border-slate-200 dark:border-surface-dark-border flex items-center justify-center text-rose-500 shadow-xs shrink-0">
                <FileText className="w-6 h-6" />
              </div>

              <div className="min-w-0 space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {resume.original_filename}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatFileSize(resume.file_size)}
                  </span>
                  <span>•</span>
                  <span className="uppercase font-semibold text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-surface-dark-input text-slate-700 dark:text-slate-300">
                    {resume.file_type === 'PDF' ? 'PDF Document' : 'DOCX Document'}
                  </span>
                  <span>•</span>
                  <span>Uploaded {new Date(resume.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImprovementModalOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
              >
                AI Suggestions
              </Button>

              {parsedData && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsParsedModalOpen(true)}
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  View Parsed Data
                </Button>
              )}

              {parsingStatus === 'Failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReparse}
                  disabled={isReparsing}
                  leftIcon={<RefreshCw className={`w-4 h-4 ${isReparsing ? 'animate-spin' : ''}`} />}
                >
                  {isReparsing ? 'Parsing...' : 'Retry Parse'}
                </Button>
              )}

              {resume.file_type === 'PDF' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPreviewOpen(true)}
                  leftIcon={<Eye className="w-4 h-4" />}
                >
                  Preview PDF
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Phase 5 AI Screening Breakdown Card */}
          {screening && (
            <div className="pt-2">
              <ApplicationScreeningCard
                screening={screening}
                status={screeningStatus}
                onViewParsedResume={() => setIsParsedModalOpen(true)}
                onRetryScreening={handleReparse}
                isRetrying={isReparsing}
              />
            </div>
          )}

          {/* Replacement Dropzone */}
          <div className="pt-4 border-t border-slate-100 dark:border-surface-dark-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Replace with New Version
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uploading a new resume will safely and atomically replace the active version.
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 rounded-card border-2 border-dashed transition-all text-center cursor-pointer ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                  : 'border-slate-200 dark:border-surface-dark-border hover:border-brand-400/80 bg-slate-50/30 dark:bg-surface-dark-bg/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {isUploading ? (
                <div className="max-w-xs mx-auto space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Uploading replacement...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-surface-dark-border overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Drag and drop a new PDF or DOCX file here, or{' '}
                    <span className="text-brand-600 dark:text-brand-400 underline">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-400">PDF, DOCX up to 10MB</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        /* Empty State: Initial Upload Zone */
        <Card padding="lg" className="space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-sm">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Upload Your Candidate Resume
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload your official resume to showcase your background to hiring teams and unlock +10% profile completion.
            </p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-10 rounded-modal border-2 border-dashed transition-all cursor-pointer ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-4 ring-brand-500/10'
                : 'border-slate-300 dark:border-surface-dark-border hover:border-brand-500 bg-slate-50/50 dark:bg-surface-dark-bg/40'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {isUploading ? (
              <div className="max-w-sm mx-auto space-y-3 py-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Uploading resume...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-surface-dark-border overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Verifying format and securing storage...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <FileText className="w-8 h-8 text-rose-500/80" />
                  <FileCheck className="w-8 h-8 text-indigo-500/80" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Click to browse or drop your resume here
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports Adobe PDF (.pdf) and Microsoft Word (.docx) documents
                  </p>
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-200/60 dark:bg-surface-dark-card text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Maximum file size: 10 MB
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Guidelines & Privacy Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-card bg-brand-50/40 dark:bg-brand-950/20 border border-brand-100/60 dark:border-brand-900/40 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-slate-900 dark:text-white">Profile Score Integration</h5>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              An active resume contributes a 10% weight directly toward your overall profile completion score.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-card bg-slate-50/60 dark:bg-surface-dark-card/40 border border-slate-200/60 dark:border-surface-dark-border flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-slate-900 dark:text-white">Secure Storage</h5>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Files are sanitized, assigned unique UUID identifiers, and accessible only through authorized requests.
            </p>
          </div>
        </div>
      </div>

      {/* PDF In-Browser Preview Modal */}
      {resume && (
        <ResumePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          filename={resume.original_filename}
          onDownload={handleDownload}
        />
      )}

      {/* Phase 5 Parsed Resume View Modal */}
      <ParsedResumeViewModal
        isOpen={isParsedModalOpen}
        onClose={() => setIsParsedModalOpen(false)}
        parsedData={parsedData}
        status={parsingStatus}
        errorMessage={errorMessage || undefined}
        filename={resume?.original_filename}
        onReparse={handleReparse}
        isReparsing={isReparsing}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Active Resume?"
        description="Are you sure you want to remove your resume file? This action will reduce your profile completion by 10%."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteResume}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Resume
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {resume?.original_filename} will be deleted from secure storage. You can upload a new resume file at any time.
        </p>
      </Modal>

      {/* Phase 8 AI Resume Improvement Suggestions Modal */}
      {resume && (
        <ResumeImprovementModal
          isOpen={isImprovementModalOpen}
          onClose={() => setIsImprovementModalOpen(false)}
          resumeId={resume.id}
        />
      )}
    </div>
  );
};
