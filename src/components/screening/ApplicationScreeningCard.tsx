import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Award,
  Briefcase,
  GraduationCap,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import type { ResumeScreeningResult, ScreeningStatus } from '../../types';

interface ApplicationScreeningCardProps {
  screening: ResumeScreeningResult | null;
  status?: ScreeningStatus;
  errorMessage?: string;
  onViewParsedResume?: () => void;
  onRetryScreening?: () => void;
  isRetrying?: boolean;
}

export const ApplicationScreeningCard: React.FC<ApplicationScreeningCardProps> = ({
  screening,
  status = 'Screened',
  errorMessage,
  onViewParsedResume,
  onRetryScreening,
  isRetrying = false,
}) => {
  if (status === 'Screening') {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/8 shadow-sm text-center">
        <Clock className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-[#111312] dark:text-[#F2F6F7]">
          Analyzing Resume Quality...
        </h4>
        <p className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-1 max-w-sm mx-auto">
          Evaluating document completeness, section structure, and extracting key credentials.
        </p>
      </div>
    );
  }

  if (status === 'Failed' || (!screening && errorMessage)) {
    return (
      <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
            Screening Analysis Unavailable
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
            {errorMessage || 'Unable to generate automated screening for this resume.'}
          </p>
          {onRetryScreening && (
            <button
              onClick={onRetryScreening}
              disabled={isRetrying}
              className="mt-2.5 px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
            >
              {isRetrying ? 'Retrying...' : 'Retry Screening'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!screening) return null;

  const score = screening.completenessScore;
  const scoreColor =
    score >= 80
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
      : score >= 50
      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 border-primary-200 dark:border-primary-800'
      : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';

  const barColor =
    score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-primary-500' : 'bg-amber-500';

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0C1113] border border-[#E7E7E2] dark:border-white/8 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#EFEFEA] dark:border-white/8/80 flex flex-wrap items-center justify-between gap-3 bg-[#F4F4F1]/40 dark:bg-[#0C1113]/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7] flex items-center gap-1.5">
              Initial AI Resume Screening
            </h4>
            <p className="text-[11px] text-[#5E6460] dark:text-[#9AA7AB]">
              Quality & Completeness Evaluation • Phase 5 Non-biased screening
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${scoreColor}`}>
            <span>Completeness:</span>
            <span className="text-sm">{score}%</span>
          </div>

          {onViewParsedResume && (
            <button
              onClick={onViewParsedResume}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111312] dark:text-[#F2F6F7] bg-white dark:bg-[#111719] border border-[#E7E7E2] dark:border-white/6 hover:bg-[#F4F4F1] dark:hover:bg-white/10/80 rounded-xl transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-primary-500" />
              View Parsed Data
            </button>
          )}
        </div>
      </div>

      {/* Completeness Bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex justify-between items-center text-xs font-medium text-[#5E6460] dark:text-[#9AA7AB] mb-1.5">
          <span>Profile Completeness Index</span>
          <span className="font-semibold text-[#111312] dark:text-[#F2F6F7]">{score} / 100</span>
        </div>
        <div className="h-2 w-full bg-[#E9E9E5] dark:bg-[#111719] rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.max(5, score)}%` }}
          />
        </div>
      </div>

      <div className="p-5 pt-3 space-y-4">
        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#F4F4F1] dark:bg-[#111719]/50 border border-[#E7E7E2]/70 dark:border-white/8">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB] mb-1">
              <Briefcase className="w-3.5 h-3.5 text-primary-500" />
              Experience Detected
            </div>
            <p className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
              {screening.experienceYearsDetected !== null && screening.experienceYearsDetected > 0
                ? `${screening.experienceYearsDetected} ${screening.experienceYearsDetected === 1 ? 'Year' : 'Years'}`
                : 'Entry Level / 0 Yrs'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F4F1] dark:bg-[#111719]/50 border border-[#E7E7E2]/70 dark:border-white/8">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB] mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-primary-500" />
              Highest Education
            </div>
            <p className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7] truncate" title={screening.educationLevelDetected}>
              {screening.educationLevelDetected || 'Not Specified'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F4F1] dark:bg-[#111719]/50 border border-[#E7E7E2]/70 dark:border-white/8">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E6460] dark:text-[#9AA7AB] mb-1">
              <Award className="w-3.5 h-3.5 text-primary-500" />
              Verified Skills
            </div>
            <p className="text-sm font-bold text-[#111312] dark:text-[#F2F6F7]">
              {screening.skillsDetectedCount} Competencies
            </p>
          </div>
        </div>

        {/* Section Coverage Checklist */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] mb-2">
            Section Coverage Breakdown
          </h5>
          <div className="flex flex-wrap gap-2">
            {screening.sectionsPresent?.map((sec, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {sec}
              </span>
            ))}
            {screening.sectionsMissing?.map((sec, idx) => (
              <span
                key={`missing-${idx}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#E9E9E5] text-[#5E6460] dark:text-[#9AA7AB] dark:bg-[#111719] dark:text-[#8A928D] dark:text-[#657378] border border-[#E7E7E2] dark:border-white/6"
              >
                <XCircle className="w-3.5 h-3.5 text-[#8A928D] dark:text-[#657378]" />
                {sec}
              </span>
            ))}
          </div>
        </div>

        {/* Observations & Flags */}
        {(screening.observations?.length > 0 || screening.screeningFlags?.length > 0) && (
          <div className="space-y-2 pt-1 border-t border-[#EFEFEA] dark:border-white/8/80">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#5E6460] dark:text-[#9AA7AB] mb-1.5">
              Screening Insights & Observations
            </h5>

            {screening.screeningFlags?.map((flag, idx) => {
              const flagStyle =
                flag.type === 'positive'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/40'
                  : flag.type === 'warning'
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900/40'
                  : 'bg-blue-50/60 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-900/40';

              const Icon =
                flag.type === 'positive'
                  ? CheckCircle2
                  : flag.type === 'warning'
                  ? AlertTriangle
                  : Info;

              return (
                <div
                  key={`flag-${idx}`}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${flagStyle}`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{flag.message}</span>
                </div>
              );
            })}

            {screening.observations?.slice(0, 3).map((obs, idx) => (
              <p
                key={`obs-${idx}`}
                className="text-xs text-[#5E6460] dark:text-[#9AA7AB] flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                {obs}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
