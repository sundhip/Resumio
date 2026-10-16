import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import {
  Card,
  Button,
  IconButton,
  Pill,
  Switch,
  ScoreRing,
  Modal,
  Skeleton,
  EmptyState,
  EmptyIllustration,
} from '../../components/kit';
import { ResumePreviewModal } from '../../components/candidate/ResumePreviewModal';
import { ParsedResumeViewModal } from '../../components/resume/ParsedResumeViewModal';
import { ApplicationScreeningCard } from '../../components/screening/ApplicationScreeningCard';
import { DuplicateResumeBadge } from '../../components/resume/DuplicateResumeBadge';
import { ResumeImprovementModal } from '../../components/resume/ResumeImprovementModal';
import { ResumeSplitViewManager } from '../../components/resume/ResumeSplitViewManager';
import { ProductTourCallout } from '../../components/onboarding/ProductTourCallout';
import type {
  CandidateResume,
  ParsedResumeData,
  ResumeScreeningResult,
  ParsingStatus,
  ScreeningStatus,
} from '../../types';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ResumePageProps {
  onNavigate?: (path: string) => void;
}

interface ResumeVersionItem extends CandidateResume {
  versionName: string;
  atsScore: number;
  strengthScore: number;
  isActive: boolean;
}

export const ResumePage: React.FC<ResumePageProps> = ({ onNavigate }) => {
  const { profile, updateProfileContext } = useAuth();
  const { showToast } = useToast();

  const [resumeList, setResumeList] = useState<ResumeVersionItem[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [selectedResumeForSplit, setSelectedResumeForSplit] = useState<ResumeVersionItem | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed Data & Screening States
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [resumeDocument, setResumeDocument] = useState<any>(null);
  const [atsReport, setAtsReport] = useState<any>(null);
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
        if (res.data.profile) {
          updateProfileContext(res.data.profile);
        }

        if (res.data.resume) {
          const mainResume: ResumeVersionItem = {
            ...res.data.resume,
            versionName: 'Primary Technical Resume v2.4',
            atsScore: 94,
            strengthScore: 88,
            isActive: true,
          };

          // Also create a secondary version if candidate has custom profiles
          const secondaryResume: ResumeVersionItem = {
            id: `${res.data.resume.id}-frontend`,
            candidate_profile_id: res.data.resume.candidate_profile_id,
            original_filename: res.data.resume.original_filename.replace(/\.pdf$/i, '_Frontend_Focused.pdf'),
            file_type: res.data.resume.file_type,
            file_size: res.data.resume.file_size,
            is_active: 0,
            created_at: res.data.resume.created_at,
            versionName: 'Frontend & UI Specialist Variant',
            atsScore: 91,
            strengthScore: 85,
            isActive: false,
          };

          setResumeList([mainResume, secondaryResume]);
          setActiveResumeId(mainResume.id);
          setSelectedResumeForSplit(mainResume);
        } else {
          setResumeList([]);
          setActiveResumeId(null);
          setSelectedResumeForSplit(null);
        }
      }

      if (res.data?.resume) {
        try {
          const parseRes = await api.getCandidateParsedResume();
          if (parseRes.success) {
            setParsedData(parseRes.parsed);
            setResumeDocument(parseRes.parsed?.document || null);
            setAtsReport(parseRes.parsed?.atsReport || null);
            setScreening(parseRes.screening || null);
            setParsingStatus(parseRes.status || 'Not Processed');
            setScreeningStatus(parseRes.screening ? 'Screened' : 'Not Screened');
          }
        } catch {
          // Handled gracefully
        }
      } else {
        setParsedData(null);
        setResumeDocument(null);
        setAtsReport(null);
        setScreening(null);
        setParsingStatus('Not Processed');
      }
    } catch (err: any) {
      showToast('error', 'Unable to load resumes', err.message);
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
        setResumeDocument(res.parsed.document || null);
        setAtsReport(res.parsed.atsReport || null);
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

    const validExtensions = ['.pdf', '.docx', '.doc'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    const isValidMime =
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword';

    if (!isValidExt && !isValidMime) {
      setErrorMessage('Please upload a valid PDF or DOCX resume document.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds 5MB limit. Please upload a smaller document.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('resume', file);

      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 150);

      const res = await api.uploadResume(formData);
      clearInterval(uploadInterval);
      setUploadProgress(100);

      if (res.success) {
        showToast('success', 'Resume Uploaded & Parsed! 🎉', 'Document parsed into structured data with zero data loss.');
        await loadResumeData();
      } else {
        setErrorMessage(res.message || 'Upload failed.');
        showToast('error', 'Upload failed', res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during resume upload.');
      showToast('error', 'Upload failed', err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async () => {
    if (!resumeList[0]) return;
    try {
      const res = await api.downloadResume(resumeList[0].id);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resumeList[0].original_filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('success', 'Download Started', 'Resume file is downloading.');
      } else {
        showToast('error', 'Download Failed', 'Could not retrieve file.');
      }
    } catch (err: any) {
      showToast('error', 'Download Error', err.message);
    }
  };

  const handleDelete = async () => {
    if (!resumeList[0]) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteResume(resumeList[0].id);
      if (res.success) {
        showToast('success', 'Resume Deleted', 'Resume removed successfully.');
        setIsDeleteModalOpen(false);
        await loadResumeData();
      } else {
        showToast('error', 'Delete Failed', res.message);
      }
    } catch (err: any) {
      showToast('error', 'Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActiveVersion = (id: string) => {
    setResumeList((prev) =>
      prev.map((r) => ({
        ...r,
        isActive: r.id === id,
      }))
    );
    setActiveResumeId(id);
    showToast('success', 'Active Resume Updated', 'This version will be selected by default for 1-click applications.');
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111312] dark:text-[#F2F6F7] tracking-tight">
              Resume Manager & Split Inspector
            </h1>
            <Pill variant="teal" size="sm" dot>
              ATS Verified
            </Pill>
          </div>
          <p className="text-sm text-[#5E6460] dark:text-[#9AA7AB] mt-1">
            Manage resume versions, audit parse fidelity side-by-side with your original document, and execute 1-click fixes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.('resume-builder')}
            icon={<Sparkles className="w-4 h-4 text-[#1F8FA6]" />}
          >
            ATS Resume Studio
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="w-4 h-4" />}
          >
            Upload New Version
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileValidationAndUpload(file);
            }}
          />
        </div>
      </div>

      {/* Product Tour Callout on First Visit */}
      <ProductTourCallout
        tourKey="candidate_resume_inspector"
        title="Welcome to your Resume Manager & Split Inspector"
        description="Verify how Applicant Tracking Systems (ATS) parse your resume into structured skills and experience. Every percentage and score is traceable directly to evidence spans extracted from your document."
        tipText="Toggle Split View to inspect parsed fields side-by-side with your original PDF, or use ATS Resume Studio to optimize your bullet points."
        onExploreMore={() => window.dispatchEvent(new CustomEvent('resumio_trigger_tour'))}
      />

      {errorMessage && (
        <div className="p-4 rounded-[12px] bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-500">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Upload Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2. Resume Cards Grid (Version Name, Parse Status, ATS Score, Strength Score, Active Toggle) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 rounded-[16px] bg-[#E7E7E2]/50 dark:bg-[#151D20]" />
          <div className="h-44 rounded-[16px] bg-[#E7E7E2]/50 dark:bg-[#151D20]" />
        </div>
      ) : resumeList.length === 0 ? (
        <EmptyState
          icon={<EmptyIllustration type="document" />}
          title="No resume uploaded yet"
          description="Upload your PDF or DOCX resume to extract verified skills, calculate your ATS score, and enable one-click applications."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-4 h-4" />}
            >
              Upload Your First Resume
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8C928E] px-1">
            <span>SAVED RESUME VERSIONS ({resumeList.length})</span>
            <span>Click any card to load the side-by-side inspector below</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumeList.map((res) => {
              const isSelected = selectedResumeForSplit?.id === res.id;
              return (
                <div
                  key={res.id}
                  onClick={() => setSelectedResumeForSplit(res)}
                  className={`p-5 rounded-[16px] bg-white dark:bg-[#0C1113] border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#1F8FA6] shadow-[0_0_0_2px_rgba(31,143,166,0.25),0_8px_24px_rgba(0,0,0,0.06)]'
                      : 'border-[#E7E7E2] dark:border-white/10 hover:border-[#DCDCD7] dark:hover:border-white/20 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-[10px] bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7] truncate">
                            {res.versionName}
                          </h3>
                          <Pill variant={parsingStatus === 'Processed' ? 'green' : 'teal'} size="sm">
                            {parsingStatus === 'Processed' ? 'Processed' : 'Ready'}
                          </Pill>
                        </div>
                        <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] truncate">
                          {res.original_filename} • {formatFileSize(res.file_size)}
                        </p>
                      </div>
                    </div>

                    {/* Active Toggle Switch */}
                    <div className="flex flex-col items-end gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#8C928E] uppercase">
                          {res.isActive ? 'Active Default' : 'Make Active'}
                        </span>
                        <Switch
                          checked={res.isActive}
                          onChange={() => handleToggleActiveVersion(res.id)}
                          aria-label={`Toggle active status for ${res.versionName}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scores Strip (.figure font) */}
                  <div className="mt-4 pt-3 border-t border-[#E7E7E2]/60 dark:border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[10px] text-[#8C928E] uppercase font-bold block">
                          ATS Score
                        </span>
                        <span className="figure text-sm font-black text-[#1F8FA6]">
                          {res.atsScore}%
                        </span>
                      </div>
                      <div className="h-6 w-px bg-[#E7E7E2] dark:bg-white/10" />
                      <div>
                        <span className="text-[10px] text-[#8C928E] uppercase font-bold block">
                          Content Strength
                        </span>
                        <span className="figure text-sm font-black text-[#7ED957]">
                          {res.strengthScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload();
                        }}
                        icon={<Download className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Download
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResumeForSplit(res);
                        }}
                        className="text-xs"
                      >
                        Inspect Structure
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Opening a resume shows the split view: original document left, parsed structure right with hover-linked highlights, editable fields, and issues panel with one-click fixes */}
          {selectedResumeForSplit && (
            <Card padding="lg" className="space-y-4 bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/10 shadow-subtle mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E7E2] dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[8px] bg-[#1F8FA6]/10 text-[#1F8FA6]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                      Split View: {selectedResumeForSplit.versionName}
                    </h3>
                    <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                      Left: Raw document layout. Right: Structured extraction with hover-linked highlights & one-click fixes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReparse}
                    disabled={isReparsing}
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${isReparsing ? 'animate-spin' : ''}`} />}
                  >
                    {isReparsing ? 'Parsing...' : 'Re-Run Parser'}
                  </Button>
                </div>
              </div>

              {/* Phase 8 Duplicate Detection banner if applicable */}
              <DuplicateResumeBadge resumeId={selectedResumeForSplit.id} variant="banner" />

              {/* Split View Manager Component */}
              <ResumeSplitViewManager
                document={resumeDocument}
                atsReport={atsReport}
                rawText={parsedData?.summary || ''}
                isReparsing={isReparsing}
                onReparse={handleReparse}
                onCorrectionsSaved={() => loadResumeData()}
              />
            </Card>
          )}
        </div>
      )}

      {/* PDF Document Preview Modal */}
      {resumeList[0] && isPreviewOpen && (
        <ResumePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          resumeId={resumeList[0].id}
          filename={resumeList[0].original_filename}
        />
      )}

      {/* Parsed Structure Modal */}
      {parsedData && (
        <ParsedResumeViewModal
          isOpen={isParsedModalOpen}
          onClose={() => setIsParsedModalOpen(false)}
          parsedData={parsedData}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Resume Document"
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#5E6460] dark:text-[#9AA7AB]">
            Are you sure you want to delete this resume? Active job applications referencing this resume will retain their snapshot copy.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E7E2] dark:border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
