import React from 'react';
import { Button } from '../../components/kit/Button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface LegalPageProps {
  onNavigate: (route: string) => void;
}

export const TermsPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
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
              This document is a functional terms-of-service template reflecting Resumio's fair platform terms. Prior to commercial operation, qualified legal counsel must review and formalize these terms.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-[#111312] dark:text-[#F2F6F7]">
            Terms of Service
          </h1>
          <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB]">
            Last updated: October 16, 2026 • Version 1.0 (Template)
          </p>
        </div>

        <div className="bg-white dark:bg-[#0D1214] border border-[#E7E7E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6 text-xs sm:text-sm text-[#5E6460] dark:text-[#9AA7AB] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Resumio, you agree to be bound by these Terms. If you are using Resumio on behalf of an employer or organization, you represent that you possess the authority to bind that entity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              2. Candidate Ownership & Fair Use
            </h2>
            <p>
              Candidates retain full copyright and ownership of all uploaded resumes, code repositories, and profile submissions. Resumio receives only a non-exclusive license to process and display this information for job matching purposes in accordance with candidate privacy settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              3. Prohibition on Unauthorized Scraping & Data Mining
            </h2>
            <p>
              Automated extraction, bulk scraping, or unauthorized harvesting of candidate profiles or employer requisitions is strictly prohibited. API access is restricted to authenticated, rate-limited tokens governed by Resumio developer agreements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              4. Employer Obligations & Non-Discrimination
            </h2>
            <p>
              Employers using Resumio agree to abide by all applicable equal employment opportunity (EEO) laws. Employers agree that Resumio scores are decision support only, and that a designated human reviewer makes every final hiring, progression, or rejection determination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#111312] dark:text-[#F2F6F7]">
              5. Limitation of Liability
            </h2>
            <p>
              Resumio provides AI-guided matching algorithms on an "as is" and "as available" basis. Resumio makes no warranties regarding hiring success or employment outcomes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
