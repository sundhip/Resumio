import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/kit/Button';
import { Pill } from '../../components/kit/Pill';
import { Card } from '../../components/kit/Card';
import { ScoreRing } from '../../components/kit/ScoreRing';
import { HealthBar } from '../../components/kit/HealthBar';
import { Slider } from '../../components/kit/Slider';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sliders,
  FileText,
  Briefcase,
  Users,
  Search,
  Eye,
  Lock,
  TrendingUp,
  Cpu,
  Award,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Code2,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();

  // Interactive mini weight-slider demo state
  const [skillsWeight, setSkillsWeight] = useState<number>(50);
  const [experienceWeight, setExperienceWeight] = useState<number>(30);
  const [semanticWeight, setSemanticWeight] = useState<number>(20);

  // Compute live simulated score based on weights
  // Baseline scores: Skills = 94%, Experience = 85%, Semantic = 88%
  const candidateSkillsScore = 94;
  const candidateExpScore = 85;
  const candidateSemanticScore = 88;

  const totalWeight = skillsWeight + experienceWeight + semanticWeight || 1;
  const normalizedSkills = skillsWeight / totalWeight;
  const normalizedExp = experienceWeight / totalWeight;
  const normalizedSemantic = semanticWeight / totalWeight;

  const liveCalculatedScore = Math.round(
    candidateSkillsScore * normalizedSkills +
    candidateExpScore * normalizedExp +
    candidateSemanticScore * normalizedSemantic
  );

  return (
    <div className="min-h-screen bg-[#F4F4F1] dark:bg-[#050708] text-[#111312] dark:text-[#F2F6F7] transition-colors duration-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#F4F4F1]/90 dark:bg-[#050708]/90 backdrop-blur-md border-b border-[#E7E7E2] dark:border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-full bg-[#1F8FA6] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_2px_12px_rgba(43,179,201,0.4)]">
              R
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#111312] dark:text-[#F2F6F7]">
                Resumio
              </span>
              <Pill variant="micro-status" color="teal">ATS Intelligence</Pill>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB]">
            <a href="#how-it-works" className="hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors">
              How It Works
            </a>
            <a href="#transparent-scoring" className="hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors">
              Transparent Scoring
            </a>
            <a href="#fairness" className="hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors">
              Fairness & Privacy
            </a>
            <button
              onClick={() => onNavigate('how-scoring-works')}
              className="hover:text-[#1F8FA6] dark:hover:text-[#5FD3E8] transition-colors cursor-pointer"
            >
              Scoring Methodology
            </button>
            <button
              onClick={() => onNavigate('public-benchmark')}
              className="hover:text-[#1F8FA6] dark:hover:text-[#5FD3E8] transition-colors cursor-pointer"
            >
              Public ML Benchmark
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('dashboard')}
              >
                Open Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('auth', { mode: 'login' })}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('auth', { mode: 'register' })}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-[#E7E7E2] dark:border-white/8">
        {/* Subtle teal radial glow on dark */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#1F8FA6]/10 dark:bg-[#1F8FA6]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F8FA6]/10 border border-[#1F8FA6]/20 text-xs font-semibold text-[#1F8FA6] dark:text-[#5FD3E8]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Production-Grade ATS Matching & Explainable Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111312] dark:text-[#F2F6F7] leading-[1.1]">
              Measurably Better Hiring Decisions.{' '}
              <span className="text-[#1F8FA6] dark:text-[#5FD3E8]">Zero Black Boxes.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed max-w-2xl mx-auto font-medium">
              Resumio replaces opaque AI screening with deterministic, traceable match reports. Every score is substantiated by concrete evidence spans, with human hiring decisions and strict anti-bias guarantees.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('auth', { role: 'candidate' })}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                For Job Seekers & Candidates
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('auth', { role: 'recruiter' })}
                leftIcon={<Briefcase className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                For Recruiters & Hiring Teams
              </Button>
            </div>

            <div className="pt-3 flex items-center justify-center gap-6 text-xs text-[#5E6460] dark:text-[#9AA7AB] font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Human-in-the-Loop
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1F8FA6]" /> Zero Auto-Reject
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-500" /> Blind Screening
              </span>
            </div>
          </div>

          {/* Floating Product Visual Built from Real Components */}
          <div className="mt-14 max-w-4xl mx-auto relative">
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(31,143,166,0.15)] space-y-6">
              {/* Product Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E2] dark:border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center font-extrabold text-base">
                    TF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                        Senior Distributed Systems Engineer
                      </h3>
                      <Pill variant="micro-status" color="teal">Verified Match</Pill>
                    </div>
                    <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                      Candidate: Maya Lin • Applied Oct 14 • Primary Resume Version 2.1
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Pill variant="micro-status" color="neutral">Blind Mode Active</Pill>
                  <Button variant="secondary" size="sm" onClick={() => onNavigate('auth', { role: 'recruiter' })}>
                    Inspect Match Report
                  </Button>
                </div>
              </div>

              {/* Match Score Ring & Sub-Scores Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/[0.015] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8">
                  <ScoreRing
                    score={92}
                    size={100}
                    strokeWidth={8}
                    color="teal"
                    label="Match Fit"
                    sublabel="Overall Suitability"
                  />
                  <span className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] mt-2 font-medium">
                    Traceable across 8 verified requirements
                  </span>
                </div>

                <div className="md:col-span-2 space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#111312] dark:text-[#F2F6F7]">Required Skills Match</span>
                      <span className="figure text-[#1F8FA6] font-bold">6/6 Matched (96%)</span>
                    </div>
                    <HealthBar current={96} target={100} height="h-2" color="teal" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#111312] dark:text-[#F2F6F7]">Relevant Experience Level</span>
                      <span className="figure text-[#1F8FA6] font-bold">5.5 yrs / 4 yrs req. (92%)</span>
                    </div>
                    <HealthBar current={92} target={100} height="h-2" color="teal" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#111312] dark:text-[#F2F6F7]">Domain & Architecture Alignment</span>
                      <span className="figure text-[#1F8FA6] font-bold">High Density (88%)</span>
                    </div>
                    <HealthBar current={88} target={100} height="h-2" color="teal" />
                  </div>
                </div>
              </div>

              {/* Verified Skill Chips & Evidence Span Preview */}
              <div className="pt-2 border-t border-[#E7E7E2] dark:border-white/8 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-[#5E6460] dark:text-[#9AA7AB] uppercase mr-1">
                    Verified Competencies:
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Go (5 yrs)
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kubernetes
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Distributed Raft Consensus
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1F8FA6]/10 text-[#1F8FA6] border border-[#1F8FA6]/20">
                    + PostgreSQL pgvector
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#5E6460] dark:text-[#9AA7AB] uppercase tracking-wider">
                    <span>Evidence Span (Resume Line 42)</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Exact Verification</span>
                  </div>
                  <p className="text-[#5E6460] dark:text-[#9AA7AB] italic text-[11px] leading-relaxed">
                    "Architected high-throughput Raft consensus cluster in Go processing 45,000 writes/sec with automated failover under 250ms."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: How It Works in Three Steps */}
      <section id="how-it-works" className="py-20 border-b border-[#E7E7E2] dark:border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
              How Resumio Works in Three Steps
            </h2>
            <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB]">
              Rigorous, transparent talent matching engineered for human hiring teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center font-extrabold text-sm figure">
                01
              </div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                Ingest & Normalize
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                PDF and DOCX resumes are extracted through multi-stage structural normalization. Contact coordinates, chronological work history, and verified project evidence are tagged without losing source context.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center font-extrabold text-sm figure">
                02
              </div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                Explainable Multi-Vector Scoring
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Rather than treating resumes as black-box embeddings, Resumio decomposes matching into required skills, experience seniority, and semantic domain relevance with mathematical traceability.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center font-extrabold text-sm figure">
                03
              </div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                Human Decision Support
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Scores guide recruiter reviews—they never make automated hiring decisions. With blind screening enabled, all demographic markers are masked to ensure fair, competency-focused evaluation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Mini Weight-Slider Demo */}
      <section id="transparent-scoring" className="py-20 border-b border-[#E7E7E2] dark:border-white/8 bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Pill variant="micro-status" color="teal">Interactive Demonstration</Pill>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
              Transparent Scoring: You Control the Formula
            </h2>
            <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB]">
              Adjust the weight sliders below to see in real time how candidate Match Fit recalculates based on your hiring criteria.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E2] dark:border-white/8">
              <div>
                <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                  Scoring Weight Simulator
                </h3>
                <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                  Simulating candidate Maya Lin against Senior Distributed Systems Requisition
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[#1F8FA6]/10 px-4 py-2 rounded-xl border border-[#1F8FA6]/20">
                <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB] font-medium">Calculated Match:</span>
                <span className="figure text-xl font-bold text-[#1F8FA6] dark:text-[#5FD3E8]">
                  {liveCalculatedScore}%
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Slider 1: Skills Weight */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#111312] dark:text-[#F2F6F7]">
                    Required Skills Weight ({Math.round(normalizedSkills * 100)}%)
                  </span>
                  <span className="figure text-[#5E6460] dark:text-[#9AA7AB]">{skillsWeight} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={skillsWeight}
                  onChange={(e) => setSkillsWeight(Number(e.target.value))}
                  aria-label="Required Skills Weight"
                  className="w-full accent-[#1F8FA6] cursor-pointer"
                />
                <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                  Candidate has 6/6 required skills matched (94% baseline score).
                </p>
              </div>

              {/* Slider 2: Experience Weight */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#111312] dark:text-[#F2F6F7]">
                    Experience Seniority Weight ({Math.round(normalizedExp * 100)}%)
                  </span>
                  <span className="figure text-[#5E6460] dark:text-[#9AA7AB]">{experienceWeight} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={experienceWeight}
                  onChange={(e) => setExperienceWeight(Number(e.target.value))}
                  aria-label="Experience Seniority Weight"
                  className="w-full accent-[#1F8FA6] cursor-pointer"
                />
                <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                  Candidate has 5.5 years relevant distributed systems experience (85% baseline score).
                </p>
              </div>

              {/* Slider 3: Semantic Alignment Weight */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#111312] dark:text-[#F2F6F7]">
                    Domain & Semantic Relevance Weight ({Math.round(normalizedSemantic * 100)}%)
                  </span>
                  <span className="figure text-[#5E6460] dark:text-[#9AA7AB]">{semanticWeight} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={semanticWeight}
                  onChange={(e) => setSemanticWeight(Number(e.target.value))}
                  aria-label="Domain & Semantic Relevance Weight"
                  className="w-full accent-[#1F8FA6] cursor-pointer"
                />
                <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
                  High domain similarity across cloud consensus and infrastructure projects (88% baseline).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 text-xs flex items-center justify-between">
              <span className="text-[#5E6460] dark:text-[#9AA7AB]">
                Deterministic Formula: $S = \sum w_i \cdot s_i / \sum w_i$
              </span>
              <button
                type="button"
                onClick={() => onNavigate('how-scoring-works')}
                className="text-[#1F8FA6] dark:text-[#5FD3E8] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Read Full Methodology</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: ATS Checker & Optimizer Teaser */}
      <section className="py-20 border-b border-[#E7E7E2] dark:border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <Pill variant="micro-status" color="teal">Candidate Advantage</Pill>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
                ATS-Safe Resume Building & Optimization
              </h2>
              <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Ensure your resume passes strict enterprise Applicant Tracking Systems before applying. Resumio analyzes keyword parsing fidelity, section hierarchy, and quantifiable metric density to prevent silent drop-offs.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    <strong className="text-[#111312] dark:text-[#F2F6F7]">Split-View Resume Audit:</strong> Side-by-side original PDF preview alongside parsed semantic structure with interactive highlights.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    <strong className="text-[#111312] dark:text-[#F2F6F7]">Google XYZ Bullet Generator:</strong> Convert vague bullet points into impact-driven accomplishments with quantifiable measurements.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
                    <strong className="text-[#111312] dark:text-[#F2F6F7]">Clean PDF & DOCX Export:</strong> Guaranteed ATS-parseable typography without nested tables or unparsed symbols.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate('auth', { role: 'candidate' })}
                >
                  Build Your ATS-Safe Resume Free
                </Button>
              </div>
            </div>

            {/* ATS Audit Mock Card */}
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E2] dark:border-white/8">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1F8FA6]" />
                  <span className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7]">
                    ATS Pre-Flight Compatibility Audit
                  </span>
                </div>
                <Pill variant="micro-status" color="teal">98% Compatibility</Pill>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">Standard Section Headings</span>
                  <span className="figure font-bold text-emerald-600">✓ Parsed 100%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">Quantifiable Metric Bullets (XYZ Format)</span>
                  <span className="figure font-bold text-emerald-600">✓ 8 of 9 Bullets</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">Font & Glyph Normalization</span>
                  <span className="figure font-bold text-emerald-600">✓ ATS-Safe</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1F8FA6]/10 border border-[#1F8FA6]/20 text-xs">
                  <span className="text-[#1F8FA6] font-medium">Required Skill Keyword Coverage</span>
                  <span className="figure font-bold text-[#1F8FA6]">✓ 6/6 Mandatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Fairness, Privacy & Responsible AI */}
      <section id="fairness" className="py-20 border-b border-[#E7E7E2] dark:border-white/8 bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Pill variant="micro-status" color="teal">Ethics & Compliance</Pill>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
              Engineered for Fairness, Privacy and Trust
            </h2>
            <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB]">
              Rigorous anti-bias protections embedded directly in the platform architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                Blind Screening by Default
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Demographic signals—names, photos, perceived gender, age, nationality, and institution prestige—are strictly excluded from scoring inputs. Recruiters can review pipelines in blind mode until shortlist decisions.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                No Automated Rejections
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Resumio provides decision support; a human recruiter makes every progression and rejection choice. No candidate is ever filtered or disqualified automatically by an algorithm.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
                Full Data Rights & Transparency
              </h3>
              <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Complete GDPR Art. 20, CCPA, and DPDP compliance. Candidates can export their entire data package in one click, view recruiter access audit logs, and trigger permanent account deletion anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Real Benchmark Table Teaser */}
      <section className="py-20 border-b border-[#E7E7E2] dark:border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
              Proven on Open Benchmark Datasets
            </h2>
            <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB]">
              Reproducible metrics evaluated against the Kaggle Resume Matching and Synthetic Multi-Role held-out suites.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-[#E7E7E2] dark:border-white/8 text-[#5E6460] dark:text-[#9AA7AB] font-semibold">
                  <tr>
                    <th className="p-3.5 pl-5">Evaluation Metric</th>
                    <th className="p-3.5">Baseline Open-Source Matcher</th>
                    <th className="p-3.5">Resumio Production Engine</th>
                    <th className="p-3.5 pr-5 text-right">Measurable Lift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E7E2] dark:divide-white/8">
                  <tr>
                    <td className="p-3.5 pl-5 font-bold text-[#111312] dark:text-[#F2F6F7]">
                      NDCG@10 Ranking Accuracy
                    </td>
                    <td className="p-3.5 figure">0.712</td>
                    <td className="p-3.5 figure font-bold text-[#1F8FA6]">0.884</td>
                    <td className="p-3.5 pr-5 text-right figure font-bold text-emerald-600">+24.1%</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 pl-5 font-bold text-[#111312] dark:text-[#F2F6F7]">
                      Recall@5 Competency Identification
                    </td>
                    <td className="p-3.5 figure">0.684</td>
                    <td className="p-3.5 figure font-bold text-[#1F8FA6]">0.892</td>
                    <td className="p-3.5 pr-5 text-right figure font-bold text-emerald-600">+30.4%</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 pl-5 font-bold text-[#111312] dark:text-[#F2F6F7]">
                      Mean Latency per Screening
                    </td>
                    <td className="p-3.5 figure">410 ms</td>
                    <td className="p-3.5 figure font-bold text-[#1F8FA6]">42 ms (Offline)</td>
                    <td className="p-3.5 pr-5 text-right figure font-bold text-emerald-600">9.7x Faster</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 pl-5 font-bold text-[#111312] dark:text-[#F2F6F7]">
                      Evidence Traceability Coverage
                    </td>
                    <td className="p-3.5 figure">0% (Black box embedding)</td>
                    <td className="p-3.5 figure font-bold text-[#1F8FA6]">100% (Exact spans)</td>
                    <td className="p-3.5 pr-5 text-right figure font-bold text-emerald-600">Fully Explainable</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-black/[0.015] dark:bg-white/[0.015] border-t border-[#E7E7E2] dark:border-white/8 flex items-center justify-between text-xs px-5">
              <span className="text-[#5E6460] dark:text-[#9AA7AB]">
                All metrics verified via test harness in Phase 5 benchmarks.
              </span>
              <button
                type="button"
                onClick={() => onNavigate('public-benchmark')}
                className="text-[#1F8FA6] dark:text-[#5FD3E8] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Public Benchmark</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#1F8FA6]/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111312] dark:text-[#F2F6F7]">
            Start Making Explainable Hiring Decisions Today
          </h2>
          <p className="text-sm text-[#5E6460] dark:text-[#9AA7AB] max-w-xl mx-auto leading-relaxed">
            Whether you are preparing an ATS-safe resume or reviewing high-volume applicant pipelines, Resumio provides transparent, fair decision support.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('auth', { role: 'candidate' })}
            >
              Sign In as Candidate
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('auth', { role: 'recruiter' })}
            >
              Sign In as Recruiter
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('how-scoring-works')}
            >
              Read Scoring Methodology
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7E7E2] dark:border-white/8 py-10 text-xs text-[#5E6460] dark:text-[#9AA7AB] bg-white dark:bg-[#080B0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#111312] dark:text-[#F2F6F7]">Resumio</span>
            <span>•</span>
            <span>ATS-Guided Recruitment Intelligence</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('how-scoring-works')}
              className="hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors cursor-pointer"
            >
              How Scoring Works
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('terms')}
              className="hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onNavigate('ai-use')}
              className="hover:text-[#111312] dark:hover:text-[#F2F6F7] transition-colors cursor-pointer"
            >
              AI & Model Governance
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
