import React from 'react';
import { Button } from '../../components/kit/Button';
import { ArrowLeft, AlertTriangle, Cpu, BrainCircuit, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LegalPageProps {
  onNavigate: (route: string) => void;
}

export const AIUsePage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F4F4F1] dark:bg-[#050708] text-[#111312] dark:text-[#F2F6F7] transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('landing')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Home
        </Button>

        {/* Legal Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block uppercase tracking-wider">
              Legal & Model Governance Template Disclaimer
            </span>
            <p className="leading-relaxed">
              This document outlines Resumio's technical AI governance, model evaluation standards, and data usage policies. Prior to enterprise deployment, qualified legal counsel must formalize these disclosures.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-[#111312] dark:text-[#F2F6F7]">
            Responsible AI & Model Governance Policy
          </h1>
          <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
            Last updated: October 16, 2026 • Version 1.0 (Template)
          </p>
        </div>

        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6 text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              1. Principles of Responsible AI Use
            </h2>
            <p>
              Resumio deploys artificial intelligence exclusively to assist and accelerate human decision-making, never to automate human hiring choices. We adhere to five core tenets:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Explainability:</strong> Every score is traceable to specific evidence spans in candidate submissions.</li>
              <li><strong>Fairness:</strong> Demographic traits are never used as model inputs.</li>
              <li><strong>Human Primacy:</strong> Humans make all progression, interview, and rejection choices.</li>
              <li><strong>Deterministic Fallback:</strong> The system maintains full operational integrity without GPU or external AI dependency.</li>
              <li><strong>Candidate Agency:</strong> Opt-in consent required for any anonymized model training participation.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              2. Model Cards & Data Cards
            </h2>
            <p>
              Resumio uses Google Gemini models for deep semantic embedding and synthesis, complemented by a local, deterministic BM25 lexical matcher. Model evaluation metrics, training dataset disclosures, and drift bounds are recorded in our ModelOps AI Registry.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              3. Opt-In Anonymized Training Data
            </h2>
            <p>
              Candidate resumes and evaluation records are never fed to public LLM training datasets. Candidates have explicit opt-in controls for internal model tuning, where all personal identifying information (PII) is cryptographically stripped beforehand.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              4. Algorithmic Impact & EEOC Auditing
            </h2>
            <p>
              Resumio provides four-fifths (80%) rule disparate impact analytics to monitor stage progression distributions and ensure equitable hiring pipelines across demographics without collecting prohibited data at screening time.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
