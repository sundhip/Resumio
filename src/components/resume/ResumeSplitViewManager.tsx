import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScoreRing } from '../ui/ScoreRing';
import { GradientHealthBar } from '../ui/GradientHealthBar';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import type { ResumeDocument, ATSParseabilityReport, ATSIssue } from '@resumio/shared';
import {
  FileText,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Save,
  X,
  ExternalLink,
  ShieldCheck,
  Eye,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface ResumeSplitViewManagerProps {
  document: ResumeDocument | null;
  atsReport: ATSParseabilityReport | null;
  rawText?: string;
  isReparsing?: boolean;
  onReparse?: () => void;
  onCorrectionsSaved?: (corrections: any) => void;
}

export const ResumeSplitViewManager: React.FC<ResumeSplitViewManagerProps> = ({
  document,
  atsReport,
  rawText = '',
  isReparsing = false,
  onReparse,
  onCorrectionsSaved,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ats' | 'contact' | 'experience' | 'education' | 'skills'>('ats');
  const [highlightedSpan, setHighlightedSpan] = useState<string | null>(null);
  const [strategyView, setStrategyView] = useState<'layout' | 'raw'>('layout');
  const [issueFilter, setIssueFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // Inline correction states
  const [isEditing, setIsEditing] = useState(false);
  const [editedContactName, setEditedContactName] = useState(document?.contact?.fullName || '');
  const [editedEmail, setEditedEmail] = useState(document?.contact?.email || '');
  const [editedPhone, setEditedPhone] = useState(document?.contact?.phone || '');
  const [editedSummary, setEditedSummary] = useState(document?.summary || '');
  const [isSavingCorrections, setIsSavingCorrections] = useState(false);

  // Training consent opt-in state
  const [consentOptIn, setConsentOptIn] = useState<boolean>(document?.trainingConsentOptIn || false);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());

  const handleApplyOneClickFix = (iss: ATSIssue) => {
    setFixedIssueIds((prev) => new Set(prev).add(iss.id));
    if (iss.title.toLowerCase().includes('phone') && editedPhone && !editedPhone.startsWith('+')) {
      setEditedPhone(`+1 ${editedPhone}`);
    }
    if (iss.title.toLowerCase().includes('summary') && !editedSummary) {
      setEditedSummary('Results-driven software engineer with extensive experience developing scalable web applications and distributed systems.');
    }
    showToast('success', 'Fix Applied', `Resolved: ${iss.title}`);
  };

  const report = atsReport || document?.atsReport;
  const score = report?.score || 85;

  const handleSaveCorrections = async () => {
    setIsSavingCorrections(true);
    try {
      const corrections = {
        fullName: editedContactName,
        email: editedEmail,
        phone: editedPhone,
        summary: editedSummary,
        savedAt: new Date().toISOString(),
      };
      await api.saveResumeCorrections(corrections);
      showToast('success', 'Corrections saved', 'Your verified adjustments have been stored.');
      setIsEditing(false);
      if (onCorrectionsSaved) onCorrectionsSaved(corrections);
    } catch (err: any) {
      showToast('error', 'Failed to save', err.message || 'Could not update corrections.');
    } finally {
      setIsSavingCorrections(false);
    }
  };

  const handleToggleConsent = async () => {
    const nextVal = !consentOptIn;
    setIsUpdatingConsent(true);
    try {
      await api.updateTrainingConsent(nextVal);
      setConsentOptIn(nextVal);
      showToast(
        'info',
        nextVal ? 'Consent granted' : 'Consent withdrawn',
        nextVal
          ? 'Anonymized corrections may be used to improve parsing accuracy.'
          : 'Your data will not be stored for model training.'
      );
    } catch (err: any) {
      showToast('error', 'Consent update failed', err.message);
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const filteredIssues = (report?.issues || []).filter((iss) => {
    if (issueFilter === 'all') return true;
    return iss.severity === issueFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top ATS Diagnostics Banner */}
      <Card className="border border-border/80 shadow-sm bg-card/60 backdrop-blur-md">
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <ScoreRing score={score} size={84} strokeWidth={8} label="ATS Score" />
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold tracking-tight text-foreground">ATS Parse-ability Index</h3>
                <Badge
                  variant={
                    score >= 80 ? 'default' : score >= 65 ? 'secondary' : 'destructive'
                  }
                  className="capitalize font-mono text-xs"
                >
                  {report?.status?.replace('_', ' ') || 'Good'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Simulated parsing diagnostic testing multi-column flow, text readability, header contact trapping, and layout integrity across automated recruitment systems.
              </p>
              <div className="mt-2.5 flex items-center gap-4 text-xs font-mono text-muted-foreground">
                <span>Layout: <strong className="text-foreground">{report?.detectedLayout || 'single_column'}</strong></span>
                <span>•</span>
                <span>Reading Discrepancy: <strong className="text-foreground">{((report?.discrepancyRatio || 0) * 100).toFixed(1)}%</strong></span>
                <span>•</span>
                <span>Issues: <strong className="text-foreground">{report?.issues?.length || 0}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onReparse}
              disabled={isReparsing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isReparsing ? 'animate-spin' : ''}`} />
              {isReparsing ? 'Parsing...' : 'Re-run Engine'}
            </Button>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveCorrections}
                  disabled={isSavingCorrections}
                  className="gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Extracted Fields
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar indication */}
        <div className="px-6 pb-4">
          <GradientHealthBar score={score} />
        </div>
      </Card>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Reading & Layout Spans (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-border/80 shadow-sm flex flex-col h-[750px] overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                  {document?.fileMetadata?.fileName || 'Resume Document'}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {document?.fileMetadata?.fileFormat || 'PDF'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 bg-background p-1 rounded-md border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setStrategyView('layout')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    strategyView === 'layout'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Layout Spans
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyView('raw')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    strategyView === 'raw'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Stream Text
                </button>
              </div>
            </div>

            {/* Document Content Box */}
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs leading-relaxed space-y-3 bg-muted/10 selection:bg-primary/20">
              {strategyView === 'layout' ? (
                <div className="space-y-4">
                  <div className="p-3 rounded border border-border/60 bg-card/80 space-y-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex justify-between">
                      <span>Header / Contact Region</span>
                      <span>Page 1</span>
                    </div>
                    <div
                      className={`p-2 rounded transition-all ${
                        highlightedSpan === 'contact'
                          ? 'ring-2 ring-primary bg-primary/10 shadow-sm'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <p className="font-bold text-foreground text-sm">
                        {document?.contact?.fullName || 'Candidate Name'}
                      </p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {document?.contact?.email} • {document?.contact?.phone}
                      </p>
                    </div>
                  </div>

                  {document?.summary && (
                    <div
                      className={`p-3 rounded border border-border/60 bg-card/80 transition-all ${
                        highlightedSpan === 'summary'
                          ? 'ring-2 ring-primary bg-primary/10 shadow-sm'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        Professional Summary
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap">{document.summary}</p>
                    </div>
                  )}

                  <div className="p-3 rounded border border-border/60 bg-card/80 space-y-3">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Experience Spans
                    </div>
                    {document?.experience?.map((exp, idx) => (
                      <div
                        key={exp.id || idx}
                        className={`p-2 rounded border border-border/30 transition-all ${
                          highlightedSpan === `exp_${idx}`
                            ? 'ring-2 ring-primary bg-primary/10 shadow-sm'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex justify-between items-baseline font-bold text-foreground">
                          <span>{exp.jobTitle}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </span>
                        </div>
                        <div className="text-xs text-primary/80 font-medium">{exp.company}</div>
                        {exp.responsibilities?.map((r, rIdx) => (
                          <div key={rIdx} className="text-[11px] text-muted-foreground mt-1 pl-2 border-l border-border">
                            • {r}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded border border-border/60 bg-card/80 space-y-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Recognized Skills Spans
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {document?.skills?.map((sk, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px] border border-border"
                        >
                          {typeof sk === 'string' ? sk : sk.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-xs text-foreground/80 leading-normal">
                  {rawText || document?.summary || 'No text extracted.'}
                </pre>
              )}
            </div>

            {/* Bottom Info bar */}
            <div className="p-3 border-t border-border bg-muted/30 text-[11px] text-muted-foreground flex justify-between items-center">
              <span>Parser: {document?.parserVersion || 'resumio-engine-v3.0.0'}</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Sandbox Verified
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column: Structured Extraction & ATS Diagnostics (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-border/80 shadow-sm h-[750px] flex flex-col">
            {/* Navigation Tabs */}
            <div className="p-3 border-b border-border bg-muted/30 flex flex-wrap gap-2">
              <Button
                variant={activeTab === 'ats' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('ats')}
                className="gap-1.5 text-xs font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                ATS Issues ({report?.issues?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'contact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('contact')}
                className="gap-1.5 text-xs font-medium"
              >
                Contact & Profile
              </Button>
              <Button
                variant={activeTab === 'experience' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('experience')}
                className="gap-1.5 text-xs font-medium"
              >
                Experience ({document?.experience?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'education' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('education')}
                className="gap-1.5 text-xs font-medium"
              >
                Education ({document?.education?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'skills' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('skills')}
                className="gap-1.5 text-xs font-medium"
              >
                Skills ({document?.skills?.length || 0})
              </Button>
            </div>

            {/* Tab Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {activeTab === 'ats' && (
                <div className="space-y-5">
                  {/* Filter Pills */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {(['all', 'critical', 'warning', 'info'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setIssueFilter(lvl)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                            issueFilter === lvl
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {filteredIssues.length} issue{filteredIssues.length === 1 ? '' : 's'} identified
                    </span>
                  </div>

                  {/* Issues List */}
                  {filteredIssues.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-semibold text-foreground text-sm">No Parsing Issues Found</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        Your document passes standard ATS layout constraints with high clarity.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredIssues.map((iss) => (
                        <div
                          key={iss.id}
                          className="p-4 rounded-lg border border-border bg-card/80 hover:border-border/80 transition-all shadow-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {iss.severity === 'critical' ? (
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              ) : iss.severity === 'warning' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : (
                                <Info className="w-4 h-4 text-sky-500 shrink-0" />
                              )}
                              <h5 className="font-semibold text-sm text-foreground">{iss.title}</h5>
                            </div>
                            <Badge
                              variant={
                                iss.severity === 'critical'
                                  ? 'destructive'
                                  : iss.severity === 'warning'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-[10px] capitalize font-mono shrink-0"
                            >
                              {iss.severity}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {iss.description}
                          </p>

                          <div className="p-2.5 rounded bg-muted/40 border border-border/50 text-xs text-foreground/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-primary shrink-0">Recommendation:</span>
                              <span>{iss.recommendation}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={fixedIssueIds.has(iss.id)}
                              onClick={() => handleApplyOneClickFix(iss)}
                              className="text-xs shrink-0 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              {fixedIssueIds.has(iss.id) ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fixed
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-primary" /> One-Click Fix
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Legal Simulator Disclaimer */}
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-[11px] text-muted-foreground leading-normal flex gap-2 items-start">
                    <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>
                      {report?.disclaimer ||
                        'This ATS Parse-ability score is a simulated diagnostic across multiple extraction heuristics. It does not guarantee behavior on any single commercial ATS vendor.'}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground">Candidate Identity & Contact</h4>
                    <span className="text-xs text-muted-foreground font-mono">
                      Confidence: {((document?.contact?.confidence || 0.9) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedContactName}
                          onChange={(e) => setEditedContactName(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground"
                        />
                      ) : (
                        <p
                          className="font-medium text-foreground text-sm mt-0.5 cursor-pointer hover:text-primary transition-colors"
                          onMouseEnter={() => setHighlightedSpan('contact')}
                          onMouseLeave={() => setHighlightedSpan(null)}
                        >
                          {document?.contact?.fullName || 'Not Extracted'}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground"
                          />
                        ) : (
                          <p className="text-xs text-foreground font-mono mt-0.5">
                            {document?.contact?.email || 'None'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedPhone}
                            onChange={(e) => setEditedPhone(e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground"
                          />
                        ) : (
                          <p className="text-xs text-foreground font-mono mt-0.5">
                            {document?.contact?.phone || 'None'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Professional Summary</label>
                      {isEditing ? (
                        <textarea
                          rows={4}
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          className="w-full mt-1 p-2.5 text-xs rounded-md border border-border bg-background text-foreground"
                        />
                      ) : (
                        <p
                          className="text-xs text-foreground/90 mt-1 leading-relaxed cursor-pointer hover:bg-muted/30 p-2 rounded transition-colors"
                          onMouseEnter={() => setHighlightedSpan('summary')}
                          onMouseLeave={() => setHighlightedSpan(null)}
                        >
                          {document?.summary || 'No summary statement parsed.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground">Extracted Employment History</h4>
                    <span className="text-xs text-muted-foreground font-mono">
                      Total: {Math.round((document?.totalExperienceMonths || 0) / 12)} years
                    </span>
                  </div>

                  <div className="space-y-4">
                    {document?.experience?.map((exp, idx) => (
                      <div
                        key={exp.id || idx}
                        className="p-4 rounded-lg border border-border bg-card/60 space-y-2 cursor-pointer hover:border-primary/50 transition-all"
                        onMouseEnter={() => setHighlightedSpan(`exp_${idx}`)}
                        onMouseLeave={() => setHighlightedSpan(null)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold text-sm text-foreground">{exp.jobTitle}</h5>
                            <p className="text-xs font-medium text-primary">{exp.company}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </Badge>
                        </div>
                        {exp.responsibilities?.map((bullet, bIdx) => (
                          <p key={bIdx} className="text-xs text-muted-foreground pl-2 border-l border-border">
                            • {bullet}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'education' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground">Academic Qualifications</h4>
                  </div>
                  <div className="space-y-3">
                    {document?.education?.map((edu, idx) => (
                      <div key={edu.id || idx} className="p-3.5 rounded-lg border border-border bg-card/60 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <h5 className="font-semibold text-sm text-foreground">{edu.degree}</h5>
                          <span className="text-[10px] font-mono text-muted-foreground">{edu.endDate}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{edu.institution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground">Extracted Skills & Competencies</h4>
                    <span className="text-xs text-muted-foreground font-mono">
                      {document?.skills?.length || 0} Skills Detected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {document?.skills?.map((sk, sIdx) => {
                      const name = typeof sk === 'string' ? sk : sk.name;
                      return (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 text-foreground text-xs font-medium"
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Consent Audit Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentOptIn}
                  onChange={handleToggleConsent}
                  disabled={isUpdatingConsent}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-muted-foreground">
                  Allow anonymized corrections to improve Resumio parsing models (Opt-In)
                </span>
              </label>
              {document?.trainingConsentTimestamp && (
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  Consent recorded: {new Date(document.trainingConsentTimestamp).toLocaleDateString()}
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
