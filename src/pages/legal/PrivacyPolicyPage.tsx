import React from 'react';
import { Button } from '../../components/kit/Button';
import { Pill } from '../../components/kit/Pill';
import { ArrowLeft, AlertTriangle, ShieldCheck, Download, Trash2, Eye } from 'lucide-react';

interface LegalPageProps {
  onNavigate: (route: string) => void;
}

export const PrivacyPolicyPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
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
              Legal Template Disclaimer
            </span>
            <p className="leading-relaxed">
              This document is a functional compliance template reflecting Resumio's technical data handling practices (GDPR, CCPA, DPDP). Prior to commercial deployment in specific jurisdictions, qualified legal counsel must review and adapt this policy.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-[#111312] dark:text-[#F2F6F7]">
            Privacy & Data Protection Notice
          </h1>
          <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
            Last updated: October 16, 2026 • Version 1.0 (Template)
          </p>
        </div>

        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6 text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              1. Information We Collect & Ingest
            </h2>
            <p>
              Resumio collects personal data submitted directly by candidates (resumes, work histories, project URLs, and portfolio links) and employers (job requisitions, competencies, and interview feedback). We collect only data strictly necessary to facilitate verified candidate-job matching.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              2. Anti-Bias & Data Minimization
            </h2>
            <p>
              In accordance with our strict fairness architecture, demographic markers—including candidate names, photos, gender, age, nationality, marital status, and institution prestige—are stripped or masked from matching algorithms. All evaluation scores reflect solely verified technical competencies and substantiated professional experience.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              3. Data Portability & Machine-Readable Export (GDPR Art. 20)
            </h2>
            <p>
              Candidates maintain full ownership of their data. At any time, you can navigate to the Candidate Profile or Career Hub to download a complete, machine-readable JSON archive containing all profiles, uploaded resumes, parsed vectors, applications, and verification histories.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              4. Recruiter Access Transparency Audit Log
            </h2>
            <p>
              Resumio maintains an immutable audit log of every external recruiter or hiring organization who views a candidate's profile. Candidates can inspect this audit log in real time from their profile settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              5. Permanent Erasure ("Right to be Forgotten")
            </h2>
            <p>
              Candidates can trigger an immediate, cascading, and permanent deletion of their account. This purges all database records (SQLite, PostgreSQL, MongoDB), disk files, and S3-compatible resume blobs permanently without retention.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              6. Contact & Data Protection Officer
            </h2>
            <p>
              For privacy inquiries, audit requests, or regulatory filings, contact our Data Protection Office at <code className="text-[#1F8FA6]">privacy@resumio.local</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
