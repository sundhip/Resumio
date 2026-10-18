import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/kit/Button';
import { Pill } from '../../components/kit/Pill';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Sliders,
  Scale,
  BrainCircuit,
  Lock,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

interface HowScoringWorksPageProps {
  onNavigate: (route: string) => void;
}

export const HowScoringWorksPage: React.FC<HowScoringWorksPageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F4F1] dark:bg-[#050708] text-[#111312] dark:text-[#F2F6F7] transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
          </Button>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Pill variant="micro-status" color="teal">Explainability & Algorithmic Transparency</Pill>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111312] dark:text-[#F2F6F7]">
              How Resumio Scoring Works
            </h1>
            <p className="text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
              Resumio operates on a foundational commitment: zero black-box decisions, zero auto-rejection, and complete mathematical traceability for every score shown to candidates and recruiters.
            </p>
          </div>
        </div>

        {/* 1. Core Mathematical Decomposition */}
        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#111312] dark:text-[#F2F6F7]">
              1. The Multi-Vector Scoring Formula
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
            Rather than relying on a single opaque embedding similarity score, Resumio decomposes applicant evaluation into three distinct, parameterized sub-vectors weighted by the employer:
          </p>

          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E7E7E2] dark:border-white/8 font-mono text-xs sm:text-sm text-[#111312] dark:text-[#F2F6F7]">
            Match Fit (S) = (w_skills · S_skills + w_exp · S_exp + w_semantic · S_semantic) / (w_skills + w_exp + w_semantic)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-black/[0.015] dark:bg-white/[0.015] border border-[#E7E7E2] dark:border-white/8 space-y-1.5">
              <span className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block">
                Required Skills (S_skills)
              </span>
              <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Binary and tiered overlap against mandatory qualifiers. Preferred skills provide incremental points without disqualifying candidates.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/[0.015] dark:bg-white/[0.015] border border-[#E7E7E2] dark:border-white/8 space-y-1.5">
              <span className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block">
                Experience Seniority (S_exp)
              </span>
              <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Calculated chronologically across verified employment roles. Career breaks are handled neutrally without penalty.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/[0.015] dark:bg-white/[0.015] border border-[#E7E7E2] dark:border-white/8 space-y-1.5">
              <span className="text-xs font-bold text-[#111312] dark:text-[#F2F6F7] block">
                Semantic Requisition (S_semantic)
              </span>
              <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
                Dense vector alignment evaluating domain architecture context (e.g. distributed systems, microservices) using Gemini or offline BM25.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Anti-Bias & Fairness Guarantees */}
        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#111312] dark:text-[#F2F6F7]">
              2. Strict Anti-Bias Rules (Rule 4)
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
            The following attributes are strictly barred from ever entering scoring models, embeddings, or ranking algorithms:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center font-semibold text-rose-700 dark:text-rose-300">
              Candidate Name
            </div>
            <div className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center font-semibold text-rose-700 dark:text-rose-300">
              Gender & Pronouns
            </div>
            <div className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center font-semibold text-rose-700 dark:text-rose-300">
              Age & Birth Dates
            </div>
            <div className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center font-semibold text-rose-700 dark:text-rose-300">
              Candidate Photos
            </div>
            <div className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center font-semibold text-rose-700 dark:text-rose-300">
              Nationality / Origin
            </div>
            <div className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center font-semibold text-rose-700 dark:text-rose-300">
              Religion & Beliefs
            </div>
            <div className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center font-semibold text-rose-700 dark:text-rose-300">
              Marital / Family Status
            </div>
            <div className="p-3 rounded-xl bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center font-semibold text-rose-700 dark:text-rose-300">
              Institution Prestige
            </div>
          </div>
        </div>

        {/* 3. Human-in-the-Loop & Zero Auto-Reject */}
        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#111312] dark:text-[#F2F6F7]">
              3. Human Decision Support (No Auto-Reject)
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
            Resumio is designed exclusively as an expert assistant for recruiters and hiring managers. Scores provide decision support to prioritize candidate review; every interview invitation, stage advancement, or rejection requires affirmative human review. The system includes no threshold-triggered automatic rejection anywhere in the pipeline.
          </p>
        </div>

        {/* 4. Traceable Evidence Spans */}
        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#111312] dark:text-[#F2F6F7]">
              4. Evidence Span Traceability
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
            Every score presented to candidates or hiring teams can be expanded to display the exact supporting evidence span from the resume (line numbers, project descriptions, and verified code repositories). Unsubstantiated claims are displayed neutrally without arbitrary score deductions.
          </p>
        </div>

        {/* 5. Deterministic Offline Fallback */}
        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F8FA6]/10 text-[#1F8FA6] flex items-center justify-center font-bold">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#111312] dark:text-[#F2F6F7]">
              5. Offline Deterministic Fallbacks (Rule 6)
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
            When external AI APIs are unreachable or disabled, Resumio transparently switches to its deterministic offline heuristic matcher using lexical parsing and BM25 token frequencies. The platform runs with 100% functionality without requiring external GPUs or API tokens.
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center pt-4">
          <Button variant="primary" size="md" onClick={() => onNavigate('landing')}>
            Return to Resumio Platform
          </Button>
        </div>
      </div>
    </div>
  );
};
