import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Slider } from '../components/ui/Slider';
import { ScoreRing } from '../components/ui/ScoreRing';
import { GradientHealthBar } from '../components/ui/GradientHealthBar';
import {
  FileText,
  Tags,
  Cpu,
  Trophy,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Sliders,
  Layers,
  BarChart3,
  Search,
} from 'lucide-react';

interface Stage {
  id: number;
  title: string;
  shortTitle: string;
  icon: React.ReactNode;
  engine: string;
  strategy: string;
  payloadFormat: string;
  description: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: 'Stage 1: Document Parsing & OCR Extraction',
    shortTitle: 'Parsing & OCR',
    icon: <FileText className="w-4 h-4" />,
    engine: 'LayoutLMv3 + PDFPlumber / Regex Rule Engine',
    strategy: 'Segment document layout into logical nodes (Contact, Summary, Experience, Education, Skills)',
    payloadFormat: '{\n  "raw_text": "...",\n  "sections": ["Experience", "Skills", "Education"],\n  "file_hash": "sha256_e4a8..."\n}',
    description: 'Converts multi-column PDF, DOCX, and scanned documents into structured AST JSON blocks, defangs formatting noise, and strips layout artifacts.',
  },
  {
    id: 2,
    title: 'Stage 2: Skill Taxonomy Normalization',
    shortTitle: 'Taxonomy',
    icon: <Tags className="w-4 h-4" />,
    engine: 'Resumio Canonical Ontology (400+ Technical Entities)',
    strategy: 'Resolves colloquial variations and aliases (e.g. "ReactJS", "React.js" -> "react")',
    payloadFormat: '{\n  "normalized_skills": ["react", "typescript", "node.js"],\n  "canonical_categories": ["Frontend", "Backend"]\n}',
    description: 'Eliminates naming ambiguity by projecting disparate candidate skill tokens onto standardized industry ontological hierarchies.',
  },
  {
    id: 3,
    title: 'Stage 3: Dense Semantic Vector Embeddings',
    shortTitle: 'Embeddings',
    icon: <Cpu className="w-4 h-4" />,
    engine: 'sentence-transformers/all-MiniLM-L6-v2 (384-d)',
    strategy: 'Transforms narrative experience and job responsibilities into contextual dense vectors',
    payloadFormat: '{\n  "embedding_dim": 384,\n  "cosine_similarity": 0.884,\n  "semantic_density": 0.92\n}',
    description: 'Captures semantic nuances beyond exact keyword matches, recognizing that "Kubernetes container orchestration" relates directly to "cloud infrastructure".',
  },
  {
    id: 4,
    title: 'Stage 4: Explainable AI Multi-Component Ranking (XAI)',
    shortTitle: 'XAI Ranking',
    icon: <Trophy className="w-4 h-4" />,
    engine: 'Reciprocal Rank Fusion + Dynamic Weight Engine',
    strategy: 'Computes explainable composite fit score traceable to verifiable evidence spans',
    payloadFormat: '{\n  "final_score": 92.8,\n  "breakdown": {\n    "skills": 42.0,\n    "projects": 28.5,\n    "achievements": 13.5,\n    "education": 8.8\n  }\n}',
    description: 'Mathematically synthesizes technical depth, verified project scope, measurable impact, and academic pedigree with instant recruiter explainability.',
  },
];

interface CandidateSimulation {
  id: string;
  name: string;
  role: string;
  baseScores: {
    technicalSkills: number;
    projectDepth: number;
    achievements: number;
    education: number;
    experienceRecency: number;
  };
  matchedSkills: string[];
}

const CANDIDATES: CandidateSimulation[] = [
  {
    id: 'c1',
    name: 'Candidate A (Full-Stack & Distributed Systems)',
    role: 'Senior Staff Engineer',
    baseScores: {
      technicalSkills: 95,
      projectDepth: 92,
      achievements: 90,
      education: 85,
      experienceRecency: 98,
    },
    matchedSkills: ['React', 'TypeScript', 'Node.js', 'Distributed Systems', 'PostgreSQL'],
  },
  {
    id: 'c2',
    name: 'Candidate B (Cloud Architect & SRE Lead)',
    role: 'Principal Cloud Architect',
    baseScores: {
      technicalSkills: 88,
      projectDepth: 96,
      achievements: 92,
      education: 80,
      experienceRecency: 94,
    },
    matchedSkills: ['Kubernetes', 'Docker', 'Go', 'AWS', 'Terraform', 'Observability'],
  },
  {
    id: 'c3',
    name: 'Candidate C (Academic Specialist & ML Researcher)',
    role: 'Applied Research Scientist',
    baseScores: {
      technicalSkills: 82,
      projectDepth: 74,
      achievements: 68,
      education: 98,
      experienceRecency: 78,
    },
    matchedSkills: ['Python', 'PyTorch', 'Data Structures', 'Statistical Modeling'],
  },
  {
    id: 'c4',
    name: 'Candidate D (Frontend Product Engineer)',
    role: 'Lead UI/UX Engineer',
    baseScores: {
      technicalSkills: 90,
      projectDepth: 85,
      achievements: 82,
      education: 75,
      experienceRecency: 90,
    },
    matchedSkills: ['React', 'Next.js', 'TailwindCSS', 'Accessibility (WCAG)', 'Design Systems'],
  },
];

export const MatchLabPage: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<number>(1);

  // Live Rubric Sliders (default weights sum to 100%)
  const [techWeight, setTechWeight] = useState<number>(40);
  const [projWeight, setProjWeight] = useState<number>(25);
  const [achieveWeight, setAchieveWeight] = useState<number>(15);
  const [eduWeight, setEduWeight] = useState<number>(10);
  const [recencyWeight, setRecencyWeight] = useState<number>(10);

  const activeStage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];

  // Re-rank candidates live based on slider weights
  const rankedCandidates = useMemo(() => {
    const totalWeight = techWeight + projWeight + achieveWeight + eduWeight + recencyWeight || 1;

    return CANDIDATES.map((cand) => {
      const composite =
        (cand.baseScores.technicalSkills * techWeight +
          cand.baseScores.projectDepth * projWeight +
          cand.baseScores.achievements * achieveWeight +
          cand.baseScores.education * eduWeight +
          cand.baseScores.experienceRecency * recencyWeight) /
        totalWeight;

      return {
        ...cand,
        finalScore: Math.round(composite * 10) / 10,
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }, [techWeight, projWeight, achieveWeight, eduWeight, recencyWeight]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Match Lab & Pipeline Simulator
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore Resumio's 4-stage explainable pipeline. Adjust live weights to observe dynamic ATS re-ranking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTechWeight(40);
              setProjWeight(25);
              setAchieveWeight(15);
              setEduWeight(10);
              setRecencyWeight(10);
            }}
          >
            Reset Baseline
          </Button>
        </div>
      </div>

      {/* 4-Stage Stepper Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAGES.map((stage) => {
          const isActive = stage.id === activeStageId;
          const isPassed = stage.id < activeStageId;

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`flex items-center gap-3 p-3.5 rounded-card border transition-all text-left ${
                isActive
                  ? 'bg-teal-500/10 dark:bg-teal-950/40 border-teal-500 dark:border-teal-400 shadow-glow-teal text-teal-700 dark:text-teal-300'
                  : 'bg-surface-light-card dark:bg-surface-dark-card border-surface-light-border dark:border-surface-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-control font-numeral font-bold text-xs shrink-0 ${
                  isActive
                    ? 'bg-teal-500 text-white dark:bg-teal-400 dark:text-slate-950'
                    : isPassed
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                0{stage.id}
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider font-semibold opacity-70">Stage {stage.id}</div>
                <div className="text-sm font-bold truncate text-slate-900 dark:text-white">{stage.shortTitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card & Output Payload Panel */}
      <Card padding="lg" className="border-teal-500/30 dark:border-teal-500/20 shadow-glow-teal">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-light-border dark:border-surface-dark-border pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-control bg-teal-500/10 text-teal-600 dark:text-teal-400">
              {activeStage.icon}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeStage.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeStage.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={activeStageId === 1}
              onClick={() => setActiveStageId((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={activeStageId === 4}
              onClick={() => setActiveStageId((prev) => Math.min(4, prev + 1))}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engine / Strategy</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{activeStage.engine}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activeStage.strategy}</div>
            </div>

            <div className="p-3.5 rounded-control bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pipeline Verification Rule
              </div>
              <p>
                Resumio executes deterministic offline heuristics alongside neural transformers so processing is guaranteed with zero GPU dependency.
              </p>
            </div>
          </div>

          {/* JSON Payload Specimen */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Output Payload Specimen</div>
            <pre className="font-numeral text-xs p-4 rounded-card bg-slate-950 text-teal-300 overflow-x-auto border border-slate-800 shadow-inner">
              {activeStage.payloadFormat}
            </pre>
          </div>
        </div>
      </Card>

      {/* Live Scoring Rubric Sliders & Ranked Candidate Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <Card padding="md" className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between border-b border-surface-light-border dark:border-surface-dark-border pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Rubric Weights</h3>
            </div>
            <span className="font-numeral text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full">
              Sum: {techWeight + projWeight + achieveWeight + eduWeight + recencyWeight}%
            </span>
          </div>

          <div className="space-y-4">
            <Slider label="Technical Skills Fit" value={techWeight} onChange={setTechWeight} />
            <Slider label="Project Scope & Architecture" value={projWeight} onChange={setProjWeight} />
            <Slider label="Measurable Achievements" value={achieveWeight} onChange={setAchieveWeight} />
            <Slider label="Education & Credentials" value={eduWeight} onChange={setEduWeight} />
            <Slider label="Experience Recency & Seniority" value={recencyWeight} onChange={setRecencyWeight} />
          </div>
        </Card>

        {/* Leaderboard Panel */}
        <Card padding="md" className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-light-border dark:border-surface-dark-border pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Real-Time Ranked Leaderboard</h3>
            </div>
            <span className="text-xs text-slate-400">Re-calculated instantly</span>
          </div>

          <div className="space-y-3">
            {rankedCandidates.map((cand, idx) => (
              <div
                key={cand.id}
                className="p-3.5 rounded-card bg-surface-light-raised dark:bg-surface-dark-raised border border-surface-light-border dark:border-surface-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-500/50 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-numeral text-xs font-black px-2 py-0.5 rounded ${
                        idx === 0
                          ? 'bg-amber-500 text-white'
                          : idx === 1
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{cand.name}</h4>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{cand.role}</div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {cand.matchedSkills.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-32 hidden sm:block">
                    <GradientHealthBar score={cand.finalScore} showIndicator={false} label="Fit Health" />
                  </div>
                  <ScoreRing score={cand.finalScore} size={64} strokeWidth={6} label="" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
