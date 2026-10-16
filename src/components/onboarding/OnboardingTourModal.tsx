import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  CheckCircle,
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
} from 'lucide-react';

export interface TourStep {
  title: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  keyHighlights: string[];
}

const ROLE_TOURS: Record<string, TourStep[]> = {
  candidate: [
    {
      title: 'Welcome to Your Career Command Hub',
      description: 'Resumio empowers your job search with transparent AI evaluation, verified skill badges, and personalized career roadmaps.',
      badge: 'Step 1 of 4: Getting Started',
      icon: Compass,
      keyHighlights: [
        'Live application timeline tracking every review stage',
        'Profile strength & ATS resume health indicator (0-100%)',
        'Direct 1-click application with version choice',
      ],
    },
    {
      title: 'Explainable Job Match Fit',
      description: 'Every job recommendation includes transparent evidence-based explanations showing exactly why you match.',
      badge: 'Step 2 of 4: Match Fit',
      icon: Sparkles,
      keyHighlights: [
        'Matched required and preferred skills with evidence spans',
        'Zero demographic inputs used in match scoring',
        'Interactive What-If simulator to test future skill gains',
      ],
    },
    {
      title: 'GitHub & Portfolio Verification',
      description: 'Link your public GitHub profile or portfolio to verify technical skills with cryptographic proof.',
      badge: 'Step 3 of 4: Evidence Badging',
      icon: Award,
      keyHighlights: [
        'Automatic code repository language analysis',
        '"Verified by Evidence" badges on matching skills',
        'SSRF-hardened portfolio content extraction',
      ],
    },
    {
      title: 'Your Data Sovereignty & Rights',
      description: 'Under GDPR, CCPA, and DPDP, you retain full ownership of your data at all times.',
      badge: 'Step 4 of 4: Data Rights',
      icon: ShieldCheck,
      keyHighlights: [
        'Export all your data in standard JSON format in 1 click',
        'Permanent cascading account deletion with zero trace',
        'Audit log of every recruiter who viewed your profile',
      ],
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
      badge: 'Step 2 of 4: Smart Search',
      icon: Search,
      keyHighlights: [
        'Semantic search across consented candidates',
        'Strict anti-bias guardrails blocking protected characteristic queries',
        'Saved searches with automated email/in-app match alerts',
      ],
    },
    {
      title: 'Side-by-Side Candidate Matrix & Heatmap',
      description: 'Compare 2 to 5 candidates side-by-side with interactive evidence heatmaps.',
      badge: 'Step 3 of 4: Comparison Matrix',
      icon: Sliders,
      keyHighlights: [
        'Color-coded resume heatmap (green = strong, amber = partial)',
        'Evidence-linked interview kit generator with scoring rubrics',
        'Blind screening mode concealing identifying candidate details',
      ],
    },
    {
      title: 'Integrations & ModelOps Governance',
      description: 'Connect with existing ATS workflows and monitor scoring model performance in real time.',
      badge: 'Step 4 of 4: Platform & Ops',
      icon: BarChart3,
      keyHighlights: [
        'Greenhouse Harvest API v1 sync verified against recorded fixtures',
        'Public REST API & HMAC-SHA256 outbound webhook streaming',
        'Zero-interference shadow mode & metric gate promotion',
      ],
    },
  ],
  admin: [
    {
      title: 'System Administration & Model Governance',
      description: 'Oversee multi-tenant organizations, security sessions, and ModelOps deployment gates.',
      badge: 'Admin Overview',
      icon: ShieldCheck,
      keyHighlights: [
        'ModelOps shadow evaluation telemetry and one-click rollback',
        'Active learning review queue for low-confidence parses (<0.65)',
        'Argon2id password hashing, TOTP MFA, and session revocation',
        'Disaster recovery restore drills with 100% cryptographic parity',
      ],
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
      title: 'Explainable Resume Evidence Heatmap',
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
      title: 'Decision Support & Governance',
      description: 'Make confident, bias-free hiring decisions backed by audit trails.',
      badge: 'Step 3 of 3: Ethical Hiring',
      icon: ShieldCheck,
      keyHighlights: [
        'Strict human-in-the-loop guarantee: zero automated rejections',
        'Anti-bias safeguards stripping demographic indicators from scoring',
        'Side-by-side matrix comparison for shortlisted candidates',
      ],
    },
  ],
};

export const OnboardingTourModal: React.FC<{
  role: 'candidate' | 'recruiter' | 'admin' | string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ role, isOpen, onClose }) => {
  const steps = ROLE_TOURS[role] || ROLE_TOURS.candidate;
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    setCurrentStepIdx(0);
  }, [role, isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-xl bg-card border-border shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-indigo-500" />

        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
          aria-label="Close Tour"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader className="pt-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <Badge variant="outline" className="text-xs uppercase font-semibold tracking-wider text-primary border-primary/30">
                {currentStep.badge}
              </Badge>
              <CardTitle className="text-xl font-bold text-foreground mt-1">
                {currentStep.title}
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-sm text-muted-foreground leading-relaxed mt-1">
            {currentStep.description}
          </CardDescription>
        </CardHeader>

        <div className="px-6 py-4 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Key Platform Capabilities:
          </div>
          <ul className="space-y-2.5">
            {currentStep.keyHighlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer controls & step dots */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStepIdx ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIdx > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
              Skip Tour
            </Button>
            <Button size="sm" onClick={handleNext}>
              {currentStepIdx === steps.length - 1 ? 'Finish Tour' : 'Next'}
              {currentStepIdx < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
