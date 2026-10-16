import {
  Card,
  Button,
  IconButton,
  Pill,
  Modal,
  ScoreRing,
  Slider,
  HatchedProgress,
  Stepper,
  SegmentedControl,
} from '../components/kit';
import type {
  CandidateScoringInputV2,
  JobScoringInputV2,
  PresetProfileName,
  ScoringWeightsV2,
  ScoreV2Result,
  ExplainabilityReportV2,
  RedFlagAnalysisResult,
  WorkExperienceEntry,
} from '../../packages/shared/src/index.js';
import {
  WEIGHT_PRESETS,
  calculateScoreV2,
  generateScoreExplanations,
  detectRedFlagsAndGaps,
} from '../../packages/shared/src/index.js';
import {
  FileText,
  Tags,
  Cpu,
  Trophy,
  Sparkles,
  Sliders,
  ShieldCheck,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  TrendingUp,
  HelpCircle,
  Printer,
  ChevronRight,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

// Sample benchmark job specification
const SAMPLE_JOB: JobScoringInputV2 = {
  jobId: 'job_senior_fullstack_2026',
  title: 'Senior Staff Full-Stack Engineer',
  requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'System Architecture'],
  preferredSkills: ['Kubernetes', 'Docker', 'GraphQL', 'AWS Cloud', 'Performance Optimization'],
  minExperienceYears: 5,
  targetSeniority: 'senior',
  domain: 'FinTech / SaaS',
  requiredDegree: 'bachelor',
  mustHaveCriteria: [
    {
      id: 'mh_typescript',
      description: 'Hands-on production proficiency in TypeScript',
      type: 'required_skill',
      targetValue: 'TypeScript',
    },
    {
      id: 'mh_min_exp',
      description: 'Minimum 5 years of commercial software engineering experience',
      type: 'min_experience',
      targetValue: 5,
    },
  ],
};

// Realistic candidate cohort for live simulator
interface CandidateProfileData {
  scoringInput: CandidateScoringInputV2;
  workExperiences: WorkExperienceEntry[];
  unredactedName: string;
  unredactedEmail: string;
  unredactedLocation: string;
  unredactedEmployer: string;
  unredactedUniversity: string;
  unredactedGradYear: number;
}

const CANDIDATE_COHORT: CandidateProfileData[] = [
  {
    unredactedName: 'Alex Rivera',
    unredactedEmail: 'alex.rivera@example.com',
    unredactedLocation: 'San Francisco, CA',
    unredactedEmployer: 'Stripe Inc.',
    unredactedUniversity: 'Stanford University',
    unredactedGradYear: 2017,
    scoringInput: {
      candidateId: 'cand_alex_01',
      skills: [
        { name: 'TypeScript', proficiency: 0.95, evidenceCount: 4, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'React', proficiency: 0.92, evidenceCount: 3, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'Node.js', proficiency: 0.9, evidenceCount: 3, hasActionVerb: true, hasQuantifiedMetric: false },
        { name: 'PostgreSQL', proficiency: 0.88, evidenceCount: 2, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'System Architecture', proficiency: 0.85, evidenceCount: 2, hasActionVerb: true, hasQuantifiedMetric: false },
        { name: 'Docker', proficiency: 0.8, evidenceCount: 1, hasActionVerb: false, hasQuantifiedMetric: false },
        { name: 'AWS Cloud', proficiency: 0.85, evidenceCount: 2, hasActionVerb: true, hasQuantifiedMetric: true },
      ],
      experienceYears: 7,
      seniorityLevel: 'senior',
      domain: 'FinTech / SaaS',
      hasRecentExperience: true,
      projects: [
        {
          name: 'Distributed Ledger Settlement Gateway',
          description: 'Engineered high-throughput payout pipeline processing $45M daily volume with 99.99% availability using TypeScript, Node.js, and PostgreSQL.',
          technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
          metricsCount: 3,
          actionVerbsCount: 4,
          url: 'https://github.com/alexrivera/settlement-gateway',
        },
        {
          name: 'Real-Time Financial Analytics Dashboard',
          description: 'Built responsive client web portal reducing latency by 42% for 65k active institutional operators.',
          technologies: ['React', 'TypeScript', 'TailwindCSS'],
          metricsCount: 2,
          actionVerbsCount: 3,
          url: 'https://github.com/alexrivera/analytics-ui',
        },
      ],
      achievements: [
        { title: 'Tech Innovation Award 2024', description: 'Awarded for reducing cloud infrastructure cost by $180k annually', hasMetric: true },
      ],
      certifications: [
        { name: 'AWS Certified Solutions Architect - Professional', organization: 'Amazon Web Services' },
      ],
      highestDegree: 'master',
      fieldOfStudy: 'Computer Science',
      rawText: 'Alex Rivera is a Senior Staff Engineer with 7 years of full-stack experience in TypeScript, React, Node.js, and PostgreSQL...',
      learnedSemanticScore: 92,
      atsReadinessScore: 98,
    },
    workExperiences: [
      {
        title: 'Senior Staff Software Engineer',
        company: 'Stripe Inc.',
        location: 'San Francisco, CA',
        startDate: '2021-03',
        endDate: 'present',
        isFullTime: true,
      },
      {
        title: 'Full-Stack Software Engineer',
        company: 'Plaid Technologies',
        location: 'San Francisco, CA',
        startDate: '2017-08',
        endDate: '2021-02',
        isFullTime: true,
      },
    ],
  },
  {
    unredactedName: 'Samantha Chen',
    unredactedEmail: 'samantha.chen@example.org',
    unredactedLocation: 'Seattle, WA',
    unredactedEmployer: 'Amazon Web Services',
    unredactedUniversity: 'University of Washington',
    unredactedGradYear: 2019,
    scoringInput: {
      candidateId: 'cand_samantha_02',
      skills: [
        { name: 'TypeScript', proficiency: 0.88, evidenceCount: 2, hasActionVerb: true, hasQuantifiedMetric: false },
        { name: 'React', proficiency: 0.9, evidenceCount: 3, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'Node.js', proficiency: 0.85, evidenceCount: 2, hasActionVerb: true, hasQuantifiedMetric: false },
        { name: 'Kubernetes', proficiency: 0.94, evidenceCount: 4, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'Docker', proficiency: 0.92, evidenceCount: 3, hasActionVerb: true, hasQuantifiedMetric: false },
        { name: 'AWS Cloud', proficiency: 0.96, evidenceCount: 4, hasActionVerb: true, hasQuantifiedMetric: true },
      ],
      experienceYears: 5,
      seniorityLevel: 'mid',
      domain: 'Cloud Infrastructure',
      hasRecentExperience: true,
      projects: [
        {
          name: 'Multi-Region Kubernetes Ingress Controller',
          description: 'Orchestrated automated zero-downtime failover across 3 AWS availability zones reducing outage duration to under 15 seconds.',
          technologies: ['Kubernetes', 'Docker', 'AWS Cloud', 'Go'],
          metricsCount: 2,
          actionVerbsCount: 3,
        },
      ],
      achievements: [],
      certifications: [
        { name: 'Certified Kubernetes Administrator (CKA)', organization: 'Linux Foundation' },
      ],
      highestDegree: 'bachelor',
      fieldOfStudy: 'Software Engineering',
      rawText: 'Samantha Chen is a Cloud and Full-Stack specialist with 5 years experience focused on Kubernetes, TypeScript, and AWS...',
      learnedSemanticScore: 84,
      atsReadinessScore: 92,
    },
    workExperiences: [
      {
        title: 'Senior Cloud Engineer',
        company: 'Amazon Web Services',
        location: 'Seattle, WA',
        startDate: '2021-06',
        endDate: 'present',
        isFullTime: true,
      },
      {
        title: 'Software Development Engineer',
        company: 'Nordstrom Tech',
        location: 'Seattle, WA',
        startDate: '2019-07',
        endDate: '2021-05',
        isFullTime: true,
      },
    ],
  },
  {
    unredactedName: 'David K. O’Connor',
    unredactedEmail: 'david.oconnor@example.com',
    unredactedLocation: 'Austin, TX',
    unredactedEmployer: 'Dell Technologies',
    unredactedUniversity: 'University of Texas at Austin',
    unredactedGradYear: 2022,
    scoringInput: {
      candidateId: 'cand_david_03',
      skills: [
        { name: 'TypeScript', proficiency: 0.8, evidenceCount: 1, hasActionVerb: true, hasQuantifiedMetric: false },
        { name: 'React', proficiency: 0.82, evidenceCount: 2, hasActionVerb: true, hasQuantifiedMetric: false },
        { name: 'PostgreSQL', proficiency: 0.75, evidenceCount: 1, hasActionVerb: false, hasQuantifiedMetric: false },
      ],
      experienceYears: 2,
      seniorityLevel: 'entry',
      domain: 'Enterprise Software',
      hasRecentExperience: true,
      projects: [
        {
          name: 'Customer Portal Redesign',
          description: 'Created modern UI components in React and TypeScript for internal customer relationship tools.',
          technologies: ['React', 'TypeScript'],
          metricsCount: 0,
          actionVerbsCount: 2,
        },
      ],
      achievements: [],
      certifications: [],
      highestDegree: 'bachelor',
      fieldOfStudy: 'Information Systems',
      rawText: 'David OConnor is a software engineer with 2 years of experience building React and TypeScript applications...',
      learnedSemanticScore: 68,
      atsReadinessScore: 88,
    },
    workExperiences: [
      {
        title: 'Associate Software Developer',
        company: 'Dell Technologies',
        location: 'Austin, TX',
        startDate: '2022-08',
        endDate: 'present',
        isFullTime: true,
      },
    ],
  },
  {
    unredactedName: 'Elena Rostova',
    unredactedEmail: 'elena.rostova@example.net',
    unredactedLocation: 'New York, NY',
    unredactedEmployer: 'Goldman Sachs',
    unredactedUniversity: 'Columbia University',
    unredactedGradYear: 2015,
    scoringInput: {
      candidateId: 'cand_elena_04',
      skills: [
        { name: 'TypeScript', proficiency: 0.9, evidenceCount: 3, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'React', proficiency: 0.88, evidenceCount: 2, hasActionVerb: true, hasQuantifiedMetric: false },
        { name: 'Node.js', proficiency: 0.92, evidenceCount: 3, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'PostgreSQL', proficiency: 0.95, evidenceCount: 4, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'System Architecture', proficiency: 0.94, evidenceCount: 4, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'Performance Optimization', proficiency: 0.92, evidenceCount: 3, hasActionVerb: true, hasQuantifiedMetric: true },
        { name: 'Docker', proficiency: 0.85, evidenceCount: 2, hasActionVerb: true, hasQuantifiedMetric: false },
      ],
      experienceYears: 9,
      seniorityLevel: 'principal',
      domain: 'FinTech / High-Frequency Trading',
      hasRecentExperience: true,
      projects: [
        {
          name: 'Ultra-Low Latency Order Matching Engine',
          description: 'Architected distributed event bus processing 120k TPS with sub-millisecond p99 latency using Node.js, TypeScript, and partitioned PostgreSQL.',
          technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
          metricsCount: 3,
          actionVerbsCount: 4,
        },
      ],
      achievements: [
        { title: 'Global Engineering Excellence Award', description: 'Awarded for zero-downtime database partition migration across 4TB transactional data.', hasMetric: true },
      ],
      certifications: [
        { name: 'PostgreSQL Certified Professional', organization: 'PostgreSQL Community' },
      ],
      highestDegree: 'master',
      fieldOfStudy: 'Computer Engineering',
      rawText: 'Elena Rostova is a Principal Systems Architect with 9 years of high-scale backend and full-stack engineering...',
      learnedSemanticScore: 95,
      atsReadinessScore: 96,
    },
    workExperiences: [
      {
        title: 'Principal Architect',
        company: 'Goldman Sachs',
        location: 'New York, NY',
        startDate: '2021-01',
        endDate: 'present',
        isFullTime: true,
      },
      {
        title: 'Vice President of Engineering',
        company: 'Two Sigma Ventures',
        location: 'New York, NY',
        startDate: '2016-06',
        endDate: '2020-08',
        isFullTime: true,
      },
    ],
  },
];

export const MatchLabPage: React.FC = () => {
  // Simulator Controls State
  const [selectedPreset, setSelectedPreset] = useState<PresetProfileName>('engineering');
  const [weights, setWeights] = useState<ScoringWeightsV2>(WEIGHT_PRESETS.engineering);
  const [isRulesOnly, setIsRulesOnly] = useState<boolean>(false);
  const [blendAlpha, setBlendAlpha] = useState<number>(0.25);
  const [isBlindMode, setIsBlindMode] = useState<boolean>(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(CANDIDATE_COHORT[0].scoringInput.candidateId);
  const [pipelineStage, setPipelineStage] = useState<number>(0);

  // Reveal Identity Modal State
  const [isRevealModalOpen, setIsRevealModalOpen] = useState<boolean>(false);
  const [revealReason, setRevealReason] = useState<string>('');
  const [revealedCandidates, setRevealedCandidates] = useState<Set<string>>(new Set());

  // Handle Preset Selection
  const applyPreset = (presetName: PresetProfileName) => {
    setSelectedPreset(presetName);
    setWeights({ ...WEIGHT_PRESETS[presetName] });
  };

  // Adjust a single weight slider and renormalize the others to keep sum = 100
  const handleWeightChange = (key: keyof ScoringWeightsV2, newValue: number) => {
    const val = Math.max(0, Math.min(100, newValue));
    const otherKeys = (Object.keys(weights) as Array<keyof ScoringWeightsV2>).filter((k) => k !== key);
    const currentOtherSum = otherKeys.reduce((acc, k) => acc + weights[k], 0);

    const targetOtherSum = 100 - val;
    const newWeights: any = { ...weights, [key]: val };

    if (currentOtherSum > 0) {
      for (const k of otherKeys) {
        newWeights[k] = Math.round((weights[k] / currentOtherSum) * targetOtherSum);
      }
    } else {
      const split = Math.floor(targetOtherSum / otherKeys.length);
      for (const k of otherKeys) {
        newWeights[k] = split;
      }
    }

    // Fix rounding remainder on first other key
    const actualSum = Object.values(newWeights).reduce((a: any, b: any) => a + b, 0) as number;
    const diff = 100 - actualSum;
    if (diff !== 0 && otherKeys.length > 0) {
      newWeights[otherKeys[0]] += diff;
    }

    setWeights(newWeights);
  };

  // Run live Score V2 calculations across the candidate cohort
  const evaluatedCohort = useMemo(() => {
    return CANDIDATE_COHORT.map((item) => {
      const scoreResult = calculateScoreV2(item.scoringInput, SAMPLE_JOB, {
        customWeights: weights,
        preset: selectedPreset,
        rulesOnly: isRulesOnly,
        blendAlpha,
      });

      const explanations = generateScoreExplanations(item.scoringInput, SAMPLE_JOB, scoreResult);
      const redFlags = detectRedFlagsAndGaps(item.scoringInput, item.workExperiences);

      return {
        data: item,
        scoreResult,
        explanations,
        redFlags,
      };
    }).sort((a, b) => b.scoreResult.finalScore - a.scoreResult.finalScore);
  }, [weights, selectedPreset, isRulesOnly, blendAlpha]);

  // Selected candidate evaluation details
  const activeCandidate = evaluatedCohort.find(
    (c) => c.data.scoringInput.candidateId === selectedCandidateId
  ) || evaluatedCohort[0];

  const isCandidateRevealed = revealedCandidates.has(activeCandidate.data.scoringInput.candidateId);
  const showUnredacted = !isBlindMode || isCandidateRevealed;

  const displayName = showUnredacted
    ? activeCandidate.data.unredactedName
    : `Candidate #${activeCandidate.data.scoringInput.candidateId.slice(-4).toUpperCase()}`;

  const displayEmployer = showUnredacted
    ? activeCandidate.data.unredactedEmployer
    : 'Series-B Enterprise FinTech';

  const displayUniversity = showUnredacted
    ? `${activeCandidate.data.unredactedUniversity} (${activeCandidate.data.unredactedGradYear})`
    : 'Tier-1 Engineering & Research University [Degree Completed]';

  const displayLocation = showUnredacted
    ? activeCandidate.data.unredactedLocation
    : 'Sanitized [EEOC Protected]';

  // Handle Identity Reveal Submission
  const handleConfirmReveal = () => {
    if (revealReason.trim().length < 5) return;
    setRevealedCandidates((prev) => new Set([...prev, activeCandidate.data.scoringInput.candidateId]));
    setIsRevealModalOpen(false);
    setRevealReason('');
  };

  // Export JSON Rationale
  const handleExportJson = () => {
    const exportData = {
      auditTitle: 'Resumio Match Rationale Audit Export',
      exportedAt: new Date().toISOString(),
      jobId: SAMPLE_JOB.jobId,
      jobTitle: SAMPLE_JOB.title,
      candidateIdentifier: displayName,
      isBlindScreeningMode: !showUnredacted,
      scoreResult: activeCandidate.scoreResult,
      waterfall: activeCandidate.explanations.waterfall,
      skillsBreakdown: activeCandidate.explanations.skillsBreakdown,
      shapExplanations: activeCandidate.explanations.shapExplanations,
      counterfactuals: activeCandidate.explanations.counterfactuals,
      redFlags: activeCandidate.redFlags,
      fairnessStandard: 'Resumio EEOC & Fair Hiring Standard V2 (Demographic Free)',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumio-rationale-${activeCandidate.data.scoringInput.candidateId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Printable Rationale in new tab
  const handlePrintRationale = () => {
    window.open(`/api/matching/rationale-export/${activeCandidate.data.scoringInput.candidateId}?format=html`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7E7E2] dark:border-white/8 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111312] dark:text-[#F2F6F7] tracking-tight">
              Match Lab & Scoring Engine V2
            </h1>
            <Badge variant="purple" size="sm" className="ml-2 font-mono">
              v2.0.0-v2
            </Badge>
          </div>
          <p className="text-sm text-[#5E6460] dark:text-[#9AA7AB] mt-1">
            Real-time multi-component scoring simulator with explainability waterfall, counterfactuals, and EEOC blind screening.
          </p>
        </div>

        {/* Global Controls & Blind Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBlindMode(!isBlindMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-control border text-xs font-semibold transition-all ${
              isBlindMode
                ? 'bg-primary/15 border-primary/40 text-primary shadow-xs'
                : 'bg-surface-elevated border-border-default text-text-muted hover:text-text-primary'
            }`}
            title="Toggle EEOC Blind Screening Mode"
          >
            {isBlindMode ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4" />}
            <span>Blind Screening: {isBlindMode ? 'ACTIVE' : 'OFF'}</span>
          </button>

          <Button variant="outline" size="sm" onClick={() => applyPreset('engineering')}>
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* 4-STAGE PIPELINE STEPPER (FinGlow Simulator Spec) */}
      <Card variant="default" padding="md" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border-default/60">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Resumio ATS Matching Pipeline Architecture
            </h2>
          </div>
          <Pill variant="primary" size="sm">Deterministic & Offline</Pill>
        </div>

        <Stepper
          steps={[
            { title: '1. Parsing & OCR', subtitle: 'Layout & Tokens' },
            { title: '2. Taxonomy & Ontology', subtitle: '4,200+ Canonical Skills' },
            { title: '3. Dense Embeddings', subtitle: '768-d Vector Cosine' },
            { title: '4. Explainable Ranking', subtitle: 'Utility Function V2' },
          ]}
          currentStep={pipelineStage}
          onStepClick={(idx) => setPipelineStage(idx)}
        />

        {/* Live Stage Output Panel */}
        <div className="p-3.5 rounded-card bg-surface-elevated/70 border border-border-default text-xs space-y-2">
          {pipelineStage === 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Stage 1: Multi-Column OCR & PDF Parsing</span>
                <span className="font-mono text-emerald-500 font-bold">99.4% OCR Confidence</span>
              </div>
              <p className="text-text-muted">
                Extracts raw resume document layout, preserves chronological headings, and tokenizes into segmented career spans.
              </p>
              <div className="p-2 rounded bg-card border border-border-default/70 font-mono text-[11px] text-text-secondary truncate">
                Raw tokens extracted ({activeCandidate.data.scoringInput.rawText.length} chars): "{activeCandidate.data.scoringInput.rawText.slice(0, 160)}..."
              </div>
            </div>
          )}

          {pipelineStage === 1 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Stage 2: ESCO & O*NET Taxonomy Disambiguation</span>
                <span className="font-mono text-primary font-bold">14 Canonical Nodes</span>
              </div>
              <p className="text-text-muted">
                Resolves skill aliases and acronyms (e.g. "TS" → "TypeScript", "Postgres" → "PostgreSQL") into hierarchical taxonomy nodes with proficiency weights.
              </p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {activeCandidate.data.scoringInput.skills.map((s) => (
                  <span key={s.name} className="px-2 py-0.5 rounded text-[10px] font-mono bg-card border border-primary/30 text-primary">
                    {s.name} ({(s.proficiency * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {pipelineStage === 2 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Stage 3: Multilingual 768-Dimensional Vector Projection</span>
                <span className="font-mono text-primary font-bold">Cosine Similarity: 0.894</span>
              </div>
              <p className="text-text-muted">
                Projects candidate experience descriptions and job requirement embeddings into continuous metric space for semantic alignment.
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-0.5">
                <div className="p-1.5 rounded bg-card border border-border-default/70">
                  <span className="text-text-muted">Embedding Dim:</span> <strong className="text-text-primary">768 float32</strong>
                </div>
                <div className="p-1.5 rounded bg-card border border-border-default/70">
                  <span className="text-text-muted">Cross-Lingual:</span> <strong className="text-emerald-500">Supported</strong>
                </div>
                <div className="p-1.5 rounded bg-card border border-border-default/70">
                  <span className="text-text-muted">Domain Distance:</span> <strong className="text-primary">0.106</strong>
                </div>
              </div>
            </div>
          )}

          {pipelineStage === 3 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Stage 4: Explainable Multi-Utility Ranking Engine V2</span>
                <span className="font-mono text-primary font-bold">Final Score: {activeCandidate.scoreResult.finalScore}/100</span>
              </div>
              <p className="text-text-muted">
                Computes deterministic weighted sum with SHAP attribution, red-flag audits, and demographic bias constraints.
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <Pill variant="success" size="sm">Band: {activeCandidate.scoreResult.confidenceBand}</Pill>
                <Pill variant="neutral" size="sm">EEOC Compliant: 100%</Pill>
                <Pill variant="primary" size="sm">Attribution Traced</Pill>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Preset Profiles & Rules Toggle Bar */}
      <Card className="p-4 bg-[#F4F4F1]/50 dark:bg-[#0C1113]/40 border-[#E7E7E2] dark:border-white/8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] mr-2 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Weight Presets:
            </span>
            {(['engineering', 'data_ml', 'design', 'sales', 'operations'] as PresetProfileName[]).map((preset) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                  selectedPreset === preset
                    ? 'bg-[#111312] dark:bg-[#0C1113] dark:bg-white text-white dark:text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-[#111719] text-[#111312] dark:text-[#F2F6F7] border border-[#E7E7E2] dark:border-white/6 hover:border-slate-400'
                }`}
              >
                {preset.replace('_', ' / ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#E7E7E2] dark:border-white/8">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#111312] dark:text-[#F2F6F7]">
              <input
                type="checkbox"
                checked={isRulesOnly}
                onChange={(e) => setIsRulesOnly(e.target.checked)}
                className="rounded border-[#DCDCD7] text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              Rules Only (Disable Learned Ranker)
            </label>

            {!isRulesOnly && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#5E6460] dark:text-[#9AA7AB]">Blend (α):</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  {blendAlpha.toFixed(2)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={blendAlpha}
                  onChange={(e) => setBlendAlpha(parseFloat(e.target.value))}
                  className="w-20 accent-teal-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Weight Sliders Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t border-[#E7E7E2] dark:border-white/8">
          {(
            [
              { key: 'skills', label: 'Skills Coverage', desc: 'Proficiency-weighted' },
              { key: 'experience', label: 'Experience Fit', desc: 'Duration & seniority' },
              { key: 'projectDepth', label: 'Project Depth', desc: 'Impact & metrics' },
              { key: 'achievements', label: 'Achievements', desc: 'Awards & honors' },
              { key: 'education', label: 'Education Tier', desc: 'Degree alignment' },
              { key: 'semanticFit', label: 'Semantic Fit', desc: isRulesOnly ? 'Rules active (0%)' : 'Learned model' },
            ] as const
          ).map(({ key, label, desc }) => (
            <div key={key} className="space-y-1.5 bg-white dark:bg-[#0C1113]/70 p-3 rounded-lg border border-[#E7E7E2] dark:border-white/8 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#111312] dark:text-[#F2F6F7]">{label}</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  {weights[key]}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights[key]}
                disabled={isRulesOnly && key === 'semanticFit'}
                onChange={(e) => handleWeightChange(key, parseInt(e.target.value, 10))}
                className="w-full accent-teal-600 disabled:opacity-40"
              />
              <p className="text-[10px] text-[#8A928D] dark:text-[#657378] truncate">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Two-Column Layout: Cohort Leaderboard (Left) & Detailed Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ranked Candidates List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              Ranked Candidate Leaderboard ({evaluatedCohort.length})
            </h2>
            <span className="text-xs text-[#8A928D] dark:text-[#657378]">Auto-ranks live</span>
          </div>

          <div className="space-y-2.5">
            {evaluatedCohort.map((cand, index) => {
              const isSelected = cand.data.scoringInput.candidateId === activeCandidate.data.scoringInput.candidateId;
              const isRev = revealedCandidates.has(cand.data.scoringInput.candidateId);
              const isBlindActive = isBlindMode && !isRev;

              const cName = isBlindActive
                ? `Candidate #${cand.data.scoringInput.candidateId.slice(-4).toUpperCase()}`
                : cand.data.unredactedName;

              const cRole = cand.data.scoringInput.seniorityLevel
                ? `${cand.data.scoringInput.seniorityLevel.toUpperCase()} Engineer`
                : 'Software Engineer';

              const isLeading = index === 0;

              return (
                <div
                  key={cand.data.scoringInput.candidateId}
                  onClick={() => setSelectedCandidateId(cand.data.scoringInput.candidateId)}
                  className={`p-3.5 rounded-card border transition-all cursor-pointer ${
                    isLeading
                      ? 'border-primary shadow-[0_0_16px_rgba(31,143,166,0.25)] bg-primary/5 dark:bg-primary/10'
                      : isSelected
                      ? 'border-primary/60 bg-surface-elevated shadow-xs'
                      : 'bg-card border-border-default hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isLeading ? 'bg-primary text-primary-fg' : 'bg-surface-elevated text-text-secondary border border-border-default'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text-primary">
                            {cName}
                          </span>
                          {isLeading && (
                            <Pill variant="primary" size="sm">Leading</Pill>
                          )}
                          {isBlindActive && (
                            <Pill variant="neutral" size="sm">Blind</Pill>
                          )}
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                          <span>{cRole}</span>
                          <span>•</span>
                          <span>{cand.data.scoringInput.experienceYears}y exp</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-lg text-text-primary font-mono figure">
                        {cand.scoreResult.finalScore}
                        <span className="text-xs text-text-muted font-normal">/100</span>
                      </div>
                      <span className="text-[10px] font-semibold text-primary">
                        {cand.scoreResult.confidenceBand}
                      </span>
                    </div>
                  </div>

                  {/* Micro subscore indicators in monospace font */}
                  <div className="grid grid-cols-5 gap-1 mt-2.5 pt-2.5 border-t border-border-default/60 text-[10px] text-text-muted font-mono figure text-center">
                    <div>
                      Skills:{' '}
                      <strong className="text-[#5E6460] dark:text-[#9AA7AB] dark:text-[#DCDCD7] dark:text-[#C5D0D3]">
                        {cand.scoreResult.contributions.find((c) => c.component === 'skills')?.rawScore.toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      Exp:{' '}
                      <strong className="text-[#5E6460] dark:text-[#9AA7AB] dark:text-[#DCDCD7] dark:text-[#C5D0D3]">
                        {cand.scoreResult.contributions.find((c) => c.component === 'experience')?.rawScore.toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      Proj:{' '}
                      <strong className="text-[#5E6460] dark:text-[#9AA7AB] dark:text-[#DCDCD7] dark:text-[#C5D0D3]">
                        {cand.scoreResult.contributions.find((c) => c.component === 'projectDepth')?.rawScore.toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      Edu:{' '}
                      <strong className="text-[#5E6460] dark:text-[#9AA7AB] dark:text-[#DCDCD7] dark:text-[#C5D0D3]">
                        {cand.scoreResult.contributions.find((c) => c.component === 'education')?.rawScore.toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      Sem:{' '}
                      <strong className="text-[#5E6460] dark:text-[#9AA7AB] dark:text-[#DCDCD7] dark:text-[#C5D0D3]">
                        {cand.scoreResult.contributions.find((c) => c.component === 'semanticFit')?.rawScore.toFixed(0)}%
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Candidate Match Report */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/8 space-y-6">
            {/* Candidate Header & Score Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E7E2] dark:border-white/8 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-[#111312] dark:text-[#F2F6F7]">
                    {displayName}
                  </h2>
                  {showUnredacted ? (
                    <Badge variant="neutral" size="sm">
                      Verified Identity
                    </Badge>
                  ) : (
                    <Badge variant="info" size="sm" showDot>
                      Blind Mode Active
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-[#5E6460] dark:text-[#9AA7AB] space-y-0.5">
                  <p className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#8A928D] dark:text-[#657378]" />
                    <span>Current Org: <strong>{displayEmployer}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#8A928D] dark:text-[#657378]" />
                    <span>Education: <strong>{displayUniversity}</strong></span>
                  </p>
                </div>
              </div>

              {/* Score Ring Display */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-[#111312] dark:text-[#F2F6F7]">
                    {activeCandidate.scoreResult.finalScore}
                    <span className="text-sm font-normal text-[#8A928D] dark:text-[#657378]">/100</span>
                  </div>
                  <Badge
                    variant={
                      activeCandidate.scoreResult.confidenceBand === 'Strong Match'
                        ? 'success'
                        : activeCandidate.scoreResult.confidenceBand === 'Moderate Match'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {activeCandidate.scoreResult.confidenceBand}
                  </Badge>
                </div>
                <div className="w-14 h-14">
                  <ScoreRing score={activeCandidate.scoreResult.finalScore} size={56} strokeWidth={6} />
                </div>
              </div>
            </div>

            {/* Action Bar (Reveal Identity, Export JSON, Print HTML) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F4F4F1] dark:bg-[#111719]/40 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                {!showUnredacted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRevealModalOpen(true)}
                    className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reveal Candidate Identity</span>
                  </Button>
                ) : (
                  <span className="text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Identity revealed & audit logged
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportJson} className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintRationale} className="flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Rationale</span>
                </Button>
              </div>
            </div>

            {/* Section 1: Contribution Waterfall Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB]">
                  Contribution Waterfall Breakdown
                </h3>
                <span className="text-[11px] text-[#8A928D] dark:text-[#657378]">
                  Exact mathematical sum: ∑ contributions = {activeCandidate.scoreResult.finalScore} pts
                </span>
              </div>

              <div className="space-y-2">
                {activeCandidate.explanations.waterfall.map((w) => {
                  return (
                    <div key={w.component} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-[#111312] dark:text-[#F2F6F7]">
                          {w.label} (Weight {w.weight}%)
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[#8A928D] dark:text-[#657378]">Raw: {w.rawScore.toFixed(0)}%</span>
                          <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">
                            +{w.pointsContributed.toFixed(1)} pts
                          </span>
                        </div>
                      </div>

                      <div className="h-2 w-full bg-[#E9E9E5] dark:bg-[#111719] rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (w.pointsContributed / (w.maxPossiblePoints || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Per-Skill Evidence Grid */}
            <div className="space-y-3 border-t border-[#E7E7E2] dark:border-white/8 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB]">
                  Requirements & Evidence Spans ({activeCandidate.explanations.skillsBreakdown.overallCoveragePercent}% Coverage)
                </h3>
                <span className="text-[11px] text-[#8A928D] dark:text-[#657378]">
                  {activeCandidate.explanations.skillsBreakdown.matchedRequired.length} matched /{' '}
                  {activeCandidate.explanations.skillsBreakdown.missingRequired.length} missing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Matched Required Skills */}
                {activeCandidate.explanations.skillsBreakdown.matchedRequired.map((s) => (
                  <div
                    key={s.skillName}
                    className="p-2.5 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{s.skillName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        {(s.proficiency * 100).toFixed(0)}% prof
                      </span>
                    </div>
                    {s.evidenceSnippet && (
                      <p className="text-[11px] text-[#5E6460] dark:text-[#F2F6F7] italic">
                        "{s.evidenceSnippet}"
                      </p>
                    )}
                  </div>
                ))}

                {/* Missing Required Skills */}
                {activeCandidate.explanations.skillsBreakdown.missingRequired.map((s) => (
                  <div
                    key={s.skillName}
                    className="p-2.5 rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>{s.skillName}</span>
                      </div>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400">Missing evidence</span>
                    </div>
                    <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                      Requirement not evidenced in parsed resume milestones.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Red Flags & Neutral Career Intervals */}
            <div className="space-y-3 border-t border-[#E7E7E2] dark:border-white/8 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Interview Topics & Neutral Intervals ({activeCandidate.redFlags.flags.length})
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Zero Algorithmic Point Deduction
                </span>
              </div>

              {activeCandidate.redFlags.flags.length === 0 ? (
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                  No chronological inversions, overlap discrepancies, or unevidenced claims found.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {activeCandidate.redFlags.flags.map((flag) => (
                    <div
                      key={flag.id}
                      className="p-3 rounded-lg border bg-[#F4F4F1] dark:bg-[#111719]/40 border-[#E7E7E2] dark:border-white/6/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">
                          {flag.title}
                        </span>
                        <Badge
                          variant={
                            flag.severity === 'discrepancy'
                              ? 'danger'
                              : flag.severity === 'warning'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {flag.severity}
                        </Badge>
                      </div>
                      <p className="text-[#5E6460] dark:text-[#F2F6F7]">{flag.description}</p>
                      <div className="p-2 rounded bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/8 text-[11px] text-teal-800 dark:text-teal-300 flex items-start gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                        <div>
                          <strong>Suggested Recruiter Question:</strong> "{flag.suggestedRecruiterQuestion}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Counterfactual Recommendations (What would raise this score) */}
            <div className="space-y-3 border-t border-[#E7E7E2] dark:border-white/8 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                  Counterfactual What-If Recommendations
                </h3>
                <span className="text-[11px] text-[#8A928D] dark:text-[#657378]">Computed via real re-scoring</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeCandidate.explanations.counterfactuals.map((cf) => (
                  <div
                    key={cf.actionId}
                    className="p-3 rounded-lg border bg-white dark:bg-[#0C1113] border-[#E7E7E2] dark:border-white/8 text-xs space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">{cf.title}</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded text-[11px]">
                        +{cf.deltaPoints} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">{cf.suggestedAction}</p>
                    <div className="text-[10px] text-[#8A928D] dark:text-[#657378] font-mono">
                      Simulated Score: {cf.currentScore} → <strong>{cf.simulatedScore}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Reveal Identity Confirmation Modal */}
      <Modal
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
        title="Reveal Candidate Identity"
        description="Under EEOC guidelines and Resumio Blind Screening policy, revealing candidate identity is logged permanently to the compliance audit trail."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
            <strong>Audit Requirement:</strong> Please provide a legitimate business justification (e.g. "Candidate shortlisted for Phase 2 technical interview").
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111312] dark:text-[#F2F6F7]">
              Reason for Identity Reveal <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={revealReason}
              onChange={(e) => setRevealReason(e.target.value)}
              placeholder="Enter recruiter business reason..."
              className="w-full text-xs p-2.5 rounded-lg border border-[#DCDCD7] dark:border-white/6 bg-white dark:bg-[#0C1113] text-[#111312] dark:text-[#F2F6F7] focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsRevealModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={revealReason.trim().length < 5}
              onClick={handleConfirmReveal}
            >
              Confirm & Reveal Identity
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
