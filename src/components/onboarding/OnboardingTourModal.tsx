import React, { useState, useEffect } from 'react';
import { Card } from '../kit/Card';
import { Button } from '../kit/Button';
import { Pill } from '../kit/Pill';
import {
  Sparkles,
  CheckCircle2,
  FileText,
  Search,
  Sliders,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Award,
  Layers,
  BarChart3,
  CheckSquare,
  Square,
  ArrowRight,
  Upload,
  Briefcase,
  Eye,
  Lock,
} from 'lucide-react';

export interface TourStep {
  title: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  keyHighlights: string[];
  isChecklist?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  subtext: string;
  completed: boolean;
  actionRoute?: string;
}

const ROLE_TOURS: Record<string, TourStep[]> = {
  candidate: [
    {
      title: 'Welcome to Your Career Command Hub',
      description: 'Resumio empowers your job search with transparent AI evaluation, verified skill badges, and personalized career roadmaps.',
      badge: 'Step 1 of 4: Hub Overview',
      icon: Compass,
      keyHighlights: [
        'Live application timeline tracking every review stage with complete transparency',
        'Profile strength and ATS resume health indicator (0–100%)',
        'Direct 1-click application with your preferred resume version',
      ],
    },
    {
      title: 'Explainable Job Match Fit',
      description: 'Every job recommendation includes transparent evidence-based explanations showing exactly why you match.',
      badge: 'Step 2 of 4: Match Fit',
      icon: Sparkles,
      keyHighlights: [
        'Matched required and preferred skills highlighted with evidence spans',
        'Strict anti-bias safeguards: zero demographic inputs used in match scoring',
        'Interactive What-If simulator to test future skill gains before applying',
      ],
    },
    {
      title: 'GitHub & Portfolio Verification',
      description: 'Link your public GitHub profile or portfolio to verify technical skills with cryptographic proof.',
      badge: 'Step 3 of 4: Evidence Badging',
      icon: Award,
      keyHighlights: [
        'Automatic code repository language analysis and commit corroboration',
        '"Verified by Evidence" badges on matching candidate skills',
        'SSRF-hardened portfolio content extraction and project verification',
      ],
    },
    {
      title: 'Candidate Get Started Checklist',
      description: 'Complete these quick milestones to maximize your visibility to hiring teams.',
      badge: 'Step 4 of 4: Next Steps',
      icon: CheckSquare,
      keyHighlights: [],
      isChecklist: true,
    },
  ],
  recruiter: [
    {
      title: 'Welcome to Recruiter Workspace',
      description: 'Streamline your recruitment pipeline from bulk resume ingestion to final hire with production-grade AI support.',
      badge: 'Step 1 of 4: Pipeline Hub',
      icon: Layers,
      keyHighlights: [
        'Bulk drag-and-drop ingestion of hundreds of resumes or ZIP files',
        'Background job queue with retry backoff and duplicate detection',
        'Virtualised leaderboard scaling smoothly to 10,000+ applicants',
      ],
    },
    {
      title: 'Natural-Language Query Compiler',
      description: 'Search talent pools using natural language that compiles into transparent, editable structured filters.',
      badge: 'Step 2 of 4: Query Compiler',
      icon: Search,
      keyHighlights: [
        'Semantic search across consented candidates with verified evidence',
        'Strict anti-bias guardrails blocking protected characteristic queries',
        'Saved searches with automated email and in-app match alerts',
      ],
    },
    {
      title: 'Side-by-Side Matrix & Heatmaps',
      description: 'Compare 2 to 5 candidates side-by-side with interactive evidence heatmaps.',
      badge: 'Step 3 of 4: Comparison Matrix',
      icon: Sliders,
      keyHighlights: [
        'Color-coded resume heatmap (green = strong match, amber = partial)',
        'Evidence-linked interview kit generator with structured scoring rubrics',
        'Blind screening mode concealing identifying candidate details',
      ],
    },
    {
      title: 'Recruiter Get Started Checklist',
      description: 'Follow these essential steps to launch your first active hiring pipeline.',
      badge: 'Step 4 of 4: Next Steps',
      icon: CheckSquare,
      keyHighlights: [],
      isChecklist: true,
    },
  ],
  admin: [
    {
      title: 'System Administration & Model Governance',
      description: 'Oversee multi-tenant organizations, security sessions, and ModelOps deployment gates.',
      badge: 'Step 1 of 3: Governance',
      icon: ShieldCheck,
      keyHighlights: [
        'ModelOps shadow evaluation telemetry and one-click rollback',
        'Active learning review queue for low-confidence parses (<0.65)',
        'Argon2id password hashing, TOTP MFA, and session revocation',
      ],
    },
    {
      title: 'Telemetry & Disaster Recovery',
      description: 'Continuous observability, system health monitors, and verified cryptographic restore drills.',
      badge: 'Step 2 of 3: Telemetry',
      icon: BarChart3,
      keyHighlights: [
        'Zero-interference shadow mode & metric gate promotion',
        'Disaster recovery restore drills with 100% cryptographic parity',
        'Audit logs recording all recruiter profile access and scoring events',
      ],
    },
    {
      title: 'Administrator Launch Checklist',
      description: 'Confirm production readiness and system health before opening platform access.',
      badge: 'Step 3 of 3: System Checklist',
      icon: CheckSquare,
      keyHighlights: [],
      isChecklist: true,
    },
  ],
  manager: [
    {
      title: 'Welcome, Hiring Manager',
      description: 'Review shortlisted talent, calibrate interview rubrics, and collaborate seamlessly with your recruiting team.',
      badge: 'Step 1 of 3: Collaborative Review',
      icon: Layers,
      keyHighlights: [
        'Interactive Kanban pipeline with drag-and-drop applicant stages',
        'Collaborative candidate notes with @mentions and notification triggers',
        'Structured interview scorecards preventing subjective evaluator drift',
      ],
    },
    {
      title: 'Explainable Evidence Spans',
      description: 'Inspect exact phrases and evidence spans that substantiate candidate qualifications without guessing.',
      badge: 'Step 2 of 3: Evidence Inspection',
      icon: Sparkles,
      keyHighlights: [
        'Visual resume overlay highlighting driving evidence spans',
        'Granular sub-score decomposition across 5 transparent dimensions',
        'Verified GitHub technical signals for authentic coding history',
      ],
    },
    {
      title: 'Hiring Manager Quick Checklist',
      description: 'Get calibrated on team requirements and review incoming candidate submissions.',
      badge: 'Step 3 of 3: Review Checklist',
      icon: CheckSquare,
      keyHighlights: [],
      isChecklist: true,
    },
  ],
};

const INITIAL_CHECKLISTS: Record<string, ChecklistItem[]> = {
  candidate: [
    { id: 'c1', label: 'Upload your primary resume', subtext: 'PDF or DOCX format for automated ATS parsing', completed: true, actionRoute: 'resume' },
    { id: 'c2', label: 'Review ATS parse & health score', subtext: 'Ensure all contact info and skill spans are accurately mapped', completed: false, actionRoute: 'resume' },
    { id: 'c3', label: 'Explore recommended Job Openings', subtext: 'View explainable match fit percentages and skill gap analysis', completed: false, actionRoute: 'jobs' },
    { id: 'c4', label: 'Connect GitHub profile for verification', subtext: 'Earn "Verified by Evidence" badges on your technical skills', completed: false, actionRoute: 'candidate-experience' },
  ],
  recruiter: [
    { id: 'r1', label: 'Publish your first Job Opening', subtext: 'Configure required skills, preferred bonuses, and scoring weights', completed: true, actionRoute: 'create-job' },
    { id: 'r2', label: 'Review blind screening settings', subtext: 'Strip demographic attributes to ensure bias-free initial evaluation', completed: false, actionRoute: 'recruiter-jobs' },
    { id: 'r3', label: 'Ingest candidate resumes into queue', subtext: 'Batch upload candidate applications into the Hiring Pipeline', completed: false, actionRoute: 'applicants' },
    { id: 'r4', label: 'Calibrate interview scorecards', subtext: 'Generate structured interview rubrics linked to candidate evidence', completed: false, actionRoute: 'recruiter-interviews' },
  ],
  admin: [
    { id: 'a1', label: 'Verify ModelOps scoring engine health', subtext: 'Confirm NDCG@10 metrics and offline fallback operational status', completed: true, actionRoute: 'research-pipeline' },
    { id: 'a2', label: 'Review skill ontology & taxonomy', subtext: 'Verify hierarchical skill mappings and custom enterprise tags', completed: false, actionRoute: 'skills-ontology' },
    { id: 'a3', label: 'Inspect active security sessions', subtext: 'Review authenticated administrators and MFA enforcement', completed: false, actionRoute: 'settings' },
  ],
  manager: [
    { id: 'm1', label: 'Review open job requisitions', subtext: 'Calibrate required skills and seniority expectations with recruiters', completed: true, actionRoute: 'recruiter-jobs' },
    { id: 'm2', label: 'Inspect shortlisted applicant evidence', subtext: 'Review evidence spans and GitHub verification badges', completed: false, actionRoute: 'applicants' },
    { id: 'm3', label: 'Submit structured interview scorecards', subtext: 'Record objective ratings across technical and domain competencies', completed: false, actionRoute: 'recruiter-interviews' },
  ],
};

export const OnboardingTourModal: React.FC<{
  role: 'candidate' | 'recruiter' | 'admin' | string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}> = ({ role, isOpen, onClose, onNavigate }) => {
  const steps = ROLE_TOURS[role] || ROLE_TOURS.candidate;
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem(`resumio_checklist_${role}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_CHECKLISTS[role] || INITIAL_CHECKLISTS.candidate;
  });

  useEffect(() => {
    setCurrentStepIdx(0);
    const saved = localStorage.getItem(`resumio_checklist_${role}`);
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
      } catch {
        // fallback
      }
    } else {
      setChecklist(INITIAL_CHECKLISTS[role] || INITIAL_CHECKLISTS.candidate);
    }
  }, [role, isOpen]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));
      localStorage.setItem(`resumio_checklist_${role}`, JSON.stringify(next));
      return next;
    });
  };

  if (!isOpen) return null;

  const currentStep = steps[currentStepIdx] || steps[0];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      localStorage.setItem(`resumio_onboarded_${role}`, 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`resumio_onboarded_${role}`, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card
        variant="raised"
        className="w-full max-w-xl bg-white dark:bg-[#080B0C] border border-[#E7E7E2] dark:border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.35)] relative overflow-hidden"
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1F8FA6] via-teal-400 to-[#2BB3C9]" />

        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-[#8C928E] dark:text-[#5F6C70] hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          aria-label="Close Tour"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] dark:text-[#5FD3E8] flex items-center justify-center font-bold">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <Pill variant="micro-status" color="teal">
                {currentStep.badge}
              </Pill>
              <h2 className="text-xl font-bold text-[#111312] dark:text-[#F2F6F7] mt-1 tracking-tight">
                {currentStep.title}
              </h2>
            </div>
          </div>
          <p className="text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed mt-1">
            {currentStep.description}
          </p>
        </div>

        <div className="px-6 py-4 space-y-3">
          {currentStep.isChecklist ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB] uppercase tracking-wider">
                Interactive Launch Checklist:
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      item.completed
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-[#111312] dark:text-[#F2F6F7]'
                        : 'bg-[#F4F4F1] dark:bg-white/5 border-[#E7E7E2] dark:border-white/10 hover:border-[#1F8FA6]/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {item.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-[#8C928E] dark:border-white/20 shrink-0" />
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${item.completed ? 'line-through text-[#8C928E] dark:text-[#5F6C70]' : ''}`}>
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                          {item.subtext}
                        </div>
                      </div>
                    </div>

                    {item.actionRoute && onNavigate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkip();
                          onNavigate(item.actionRoute!);
                        }}
                        className="text-[11px] font-semibold text-[#1F8FA6] dark:text-[#5FD3E8] hover:underline flex items-center gap-1 shrink-0 pt-0.5"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB] uppercase tracking-wider mb-2.5">
                Key Platform Capabilities:
              </div>
              <ul className="space-y-2.5">
                {currentStep.keyHighlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#111312] dark:text-[#F2F6F7]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer controls & step dots */}
        <div className="px-6 py-4 bg-[#F4F4F1] dark:bg-[#050708] border-t border-[#E7E7E2] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStepIdx ? 'w-6 bg-[#1F8FA6]' : 'w-2 bg-[#8C928E]/30 dark:bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIdx > 0 && (
              <Button variant="secondary" size="sm" onClick={handlePrev} leadingIcon={<ChevronLeft className="w-4 h-4" />}>
                Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-[#5E6460] dark:text-[#9AA7AB]">
              Skip Tour
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              trailingIcon={currentStepIdx < steps.length - 1 ? <ChevronRight className="w-4 h-4" /> : undefined}
            >
              {currentStepIdx === steps.length - 1 ? 'Start Working' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
