import React from 'react';

export interface IllustrationProps {
  size?: number;
  className?: string;
}

// 1. Empty State Illustration
export const EmptyIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <defs>
      <linearGradient id="emptyGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1F8FA6" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#D98BE8" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="50" fill="url(#emptyGrad)" />
    <rect x="36" y="38" width="48" height="44" rx="8" stroke="#1F8FA6" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <path d="M48 54H72M48 64H62" stroke="#5FD3E8" strokeWidth="2" strokeLinecap="round" />
    <circle cx="78" cy="42" r="6" fill="#F2C94C" fillOpacity="0.8" />
  </svg>
);

// 2. Resume Parse Illustration
export const ResumeParseIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <defs>
      <linearGradient id="parseScan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1F8FA6" stopOpacity="0.0" />
        <stop offset="50%" stopColor="#5FD3E8" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#1F8FA6" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <rect x="32" y="24" width="56" height="72" rx="10" fill="#0C1113" stroke="#1F8FA6" strokeWidth="2" fillOpacity="0.05" />
    <rect x="42" y="38" width="22" height="4" rx="2" fill="#1F8FA6" />
    <rect x="42" y="48" width="36" height="3" rx="1.5" fill="#8C928E" />
    <rect x="42" y="56" width="32" height="3" rx="1.5" fill="#8C928E" />
    <rect x="42" y="64" width="28" height="3" rx="1.5" fill="#8C928E" />
    {/* Scan beam */}
    <rect x="28" y="52" width="64" height="12" fill="url(#parseScan)" />
    <line x1="28" y1="58" x2="92" y2="58" stroke="#2BB3C9" strokeWidth="2" />
  </svg>
);

// 3. Match Fit Illustration
export const MatchFitIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <circle cx="60" cy="60" r="44" stroke="#1F8FA6" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="4 4" />
    <circle cx="60" cy="60" r="32" stroke="#5FD3E8" strokeWidth="2" strokeOpacity="0.5" />
    <circle cx="60" cy="60" r="18" fill="#1F8FA6" fillOpacity="0.2" stroke="#1F8FA6" strokeWidth="2" />
    <path d="M52 60L57 65L68 54" stroke="#7ED957" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 4. Interview Illustration
export const InterviewIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <rect x="28" y="32" width="64" height="56" rx="12" stroke="#1F8FA6" strokeWidth="2" fill="none" />
    <line x1="28" y1="46" x2="92" y2="46" stroke="#1F8FA6" strokeWidth="2" />
    <circle cx="44" cy="28" r="3" fill="#1F8FA6" />
    <circle cx="76" cy="28" r="3" fill="#1F8FA6" />
    <circle cx="60" cy="66" r="12" stroke="#D98BE8" strokeWidth="2" fill="none" />
    <path d="M60 58V66L65 69" stroke="#D98BE8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 5. Security Illustration
export const SecurityIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <path
      d="M60 26L84 36V58C84 74 74 88 60 94C46 88 36 74 36 58V36L60 26Z"
      stroke="#1F8FA6"
      strokeWidth="2.5"
      fill="#1F8FA6"
      fillOpacity="0.08"
    />
    <circle cx="60" cy="56" r="6" fill="#7ED957" />
    <path d="M60 62V70" stroke="#7ED957" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 6. Skill Gap Illustration
export const SkillGapIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <rect x="26" y="68" width="22" height="22" rx="6" fill="#1F8FA6" />
    <rect x="72" y="68" width="22" height="22" rx="6" fill="#1F8FA6" />
    {/* Bridge connection with dashed gap */}
    <path d="M48 79H54" stroke="#5FD3E8" strokeWidth="2" strokeLinecap="round" />
    <path d="M54 79H66" stroke="#F2C94C" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M66 79H72" stroke="#5FD3E8" strokeWidth="2" strokeLinecap="round" />
    <circle cx="60" cy="52" r="10" stroke="#F2C94C" strokeWidth="2" fill="#F2C94C" fillOpacity="0.2" />
    <text x="60" y="56" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#F2C94C">?</text>
  </svg>
);

// 7. Analytics Illustration
export const AnalyticsIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <line x1="28" y1="90" x2="92" y2="90" stroke="#8C928E" strokeWidth="1.5" />
    <rect x="34" y="62" width="10" height="28" rx="3" fill="#1F8FA6" />
    <rect x="50" y="48" width="10" height="42" rx="3" fill="#5FD3E8" />
    <rect x="66" y="38" width="10" height="52" rx="3" fill="#7ED957" />
    <path d="M34 54L52 42L68 30L86 24" stroke="#D98BE8" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="86" cy="24" r="3.5" fill="#D98BE8" />
  </svg>
);

// 8. Workflow Illustration
export const WorkflowIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <circle cx="36" cy="60" r="12" stroke="#1F8FA6" strokeWidth="2" fill="#1F8FA6" fillOpacity="0.1" />
    <path d="M48 60H62" stroke="#1F8FA6" strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="74" cy="44" r="12" stroke="#5FD3E8" strokeWidth="2" fill="#5FD3E8" fillOpacity="0.1" />
    <circle cx="74" cy="76" r="12" stroke="#7ED957" strokeWidth="2" fill="#7ED957" fillOpacity="0.1" />
    <path d="M60 60L64 48" stroke="#5FD3E8" strokeWidth="2" />
    <path d="M60 60L64 72" stroke="#7ED957" strokeWidth="2" />
  </svg>
);

// 9. Upload Illustration
export const UploadIllustration: React.FC<IllustrationProps> = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <path
      d="M32 74C26 74 22 69 22 63C22 58 26 53 31 52C32 42 41 34 52 34C61 34 69 39 72 47C76 45 82 48 84 53C88 54 92 59 92 64C92 70 87 74 81 74"
      stroke="#1F8FA6"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M57 76V56M57 56L50 63M57 56L64 63" stroke="#2BB3C9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
