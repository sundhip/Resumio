import React from 'react';
import {
  X,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  FolderGit2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { ParsedResumeData, ParsingStatus } from '../../types';

interface ParsedResumeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: ParsedResumeData | null;
  status: ParsingStatus;
  errorMessage?: string;
  filename?: string;
  onReparse?: () => void;
  isReparsing?: boolean;
}

export const ParsedResumeViewModal: React.FC<ParsedResumeViewModalProps> = ({
  isOpen,
  onClose,
  parsedData,
  status,
  errorMessage,
  filename,
  onReparse,
  isReparsing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Extracted Resume Data
                </h3>
                {status === 'Processed' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Structured Extract
                  </span>
                )}
                {status === 'Processing' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    Processing
                  </span>
                )}
                {status === 'Failed' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Extraction Issue
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {filename || 'Uploaded Resume Document'} • Automated structural extraction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReparse && (
              <button
                onClick={onReparse}
                disabled={isReparsing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Re-run text parsing on this resume"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReparsing ? 'animate-spin' : ''}`} />
                {isReparsing ? 'Parsing...' : 'Re-parse'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Transparency / Non-destructive Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200">
              <span className="font-semibold">Independent Extracted Data:</span> This view shows the structured information extracted directly from your resume file. Your manual profile settings remain separate and untouched.
            </div>
          </div>

          {/* Processing / Failed state alerts */}
          {status === 'Failed' && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                  Document Parsing Notice
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  {errorMessage || 'Unable to parse standard resume text from this file. Please verify that your document contains readable text and is not an image-only scan or password protected.'}
                </p>
                {onReparse && (
                  <button
                    onClick={onReparse}
                    disabled={isReparsing}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReparsing ? 'animate-spin' : ''}`} />
                    Retry Parsing
                  </button>
                )}
              </div>
            </div>
          )}

          {status === 'Processing' && (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Parsing Resume Document...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Extracting contact information, skills, work experience, and educational background without modifying your profile.
              </p>
            </div>
          )}

          {parsedData && (
            <div className="space-y-6">
              {/* 1. Contact / Header Info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  Contact & Personal Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Extracted Name</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {parsedData.personal?.candidateName || 'Not specified in header'}
                    </p>
                  </div>
                  {parsedData.personal?.headline && (
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Headline</span>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {parsedData.personal.headline}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      {parsedData.personal?.email || <span className="italic text-slate-400">Not detected</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone
                    </span>
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      {parsedData.personal?.phone || <span className="italic text-slate-400">Not detected</span>}
                    </p>
                  </div>
                  {parsedData.personal?.location && (
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Location
                      </span>
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        {parsedData.personal.location}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Professional Summary */}
              {parsedData.summary && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                    Summary Statement
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {parsedData.summary}
                  </p>
                </div>
              )}

              {/* 3. Extracted Skills */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                    Standardized Skills ({parsedData.skills?.length || 0})
                  </div>
                  {parsedData.confidence?.skills && (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Confidence: <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{parsedData.confidence.skills}</span>
                    </span>
                  )}
                </div>
                {parsedData.skills && parsedData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {parsedData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No standardized technical skills identified.</p>
                )}
              </div>

              {/* 4. Work Experience */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  Work Experience ({parsedData.experience?.length || 0})
                </div>
                {parsedData.experience && parsedData.experience.length > 0 ? (
                  <div className="space-y-4">
                    {parsedData.experience.map((exp, idx) => (
                      <div key={idx} className="pb-3 border-b border-slate-200/60 dark:border-slate-800 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                              {exp.jobTitle}
                            </h5>
                            <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                              {exp.company}
                            </p>
                          </div>
                          {(exp.startDate || exp.endDate) && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {exp.startDate || ''} {exp.endDate ? `— ${exp.endDate}` : ''}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No work experience sections detected.</p>
                )}
              </div>

              {/* 5. Education */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Education ({parsedData.education?.length || 0})
                </div>
                {parsedData.education && parsedData.education.length > 0 ? (
                  <div className="space-y-3">
                    {parsedData.education.map((edu, idx) => (
                      <div key={idx} className="flex items-start justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800 last:border-b-0 last:pb-0">
                        <div>
                          <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                          </h5>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {edu.institution} {edu.grade ? `• Grade: ${edu.grade}` : ''}
                          </p>
                        </div>
                        {(edu.startDate || edu.endDate) && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ''}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No formal education records detected.</p>
                )}
              </div>

              {/* 6. Projects & Certifications (if detected) */}
              {(parsedData.projects?.length > 0 || parsedData.certifications?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedData.projects?.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <FolderGit2 className="w-3.5 h-3.5" />
                        Projects ({parsedData.projects.length})
                      </div>
                      <div className="space-y-2">
                        {parsedData.projects.map((p, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                            {p.description && <p className="text-slate-500 line-clamp-2 mt-0.5">{p.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedData.certifications?.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <Award className="w-3.5 h-3.5" />
                        Certifications ({parsedData.certifications.length})
                      </div>
                      <div className="space-y-2">
                        {parsedData.certifications.map((c, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                            <p className="text-slate-500">{c.issuingOrg}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 7. Spoken Languages */}
              {parsedData.languages && parsedData.languages.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                    Languages ({parsedData.languages.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        {lang.language} {lang.proficiency ? `(${lang.proficiency})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
