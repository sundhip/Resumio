/**
 * Job Description Intelligence
 * 1. JD Quality Analyzer: detects unrealistic tech experience requirements, contradictory seniority, vague wording.
 * 2. Inclusive-Language Checker: identifies gender-coded, ageist, or exclusionary phrasing with neutral alternatives.
 */

export interface JdQualityReport {
  overallScore: number; // 0 - 100
  qualityTier: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical Issues';
  unrealisticRequirements: {
    technology: string;
    claimedYearsRequired: number;
    technologyReleaseYear: number;
    maxPossibleYears: number;
    issue: string;
    recommendation: string;
  }[];
  seniorityContradictions: {
    statedSeniority: string;
    statedYears: number;
    issue: string;
    recommendation: string;
  }[];
  vaguePhrasingFlags: {
    phrase: string;
    issue: string;
    suggestion: string;
  }[];
  hasMustHaveNiceToHaveSplit: boolean;
  recommendations: string[];
}

export interface InclusiveLanguageReport {
  inclusivityScore: number; // 0 - 100
  disclaimer: string;
  findings: {
    category: 'gender_bias' | 'age_bias' | 'ableism' | 'elitism';
    matchedPhrase: string;
    tone: 'masculine_coded' | 'feminine_coded' | 'ageist' | 'ableist' | 'exclusionary';
    contextSnippet: string;
    suggestedAlternative: string;
    rationale: string;
  }[];
  genderBalanceRatio: {
    masculineTermsCount: number;
    feminineTermsCount: number;
    status: 'Neutral / Balanced' | 'Masculine Skewed' | 'Feminine Skewed';
  };
}

// Canonical release years of modern technologies (relative to 2026)
export const TECH_RELEASE_YEARS: Record<string, number> = {
  kubernetes: 2014,
  k8s: 2014,
  react: 2013,
  'react.js': 2013,
  swift: 2014,
  rust: 2015,
  'next.js': 2016,
  nextjs: 2016,
  flutter: 2017,
  pytorch: 2016,
  tensorflow: 2015,
  docker: 2013,
  typescript: 2012,
  vue: 2014,
  'vue.js': 2014,
  golang: 2009,
  go: 2009,
  graphql: 2015,
  fastapi: 2018,
  tailwindcss: 2017,
  tailwind: 2017,
  svelte: 2016,
};

const VAGUE_BUZZWORDS: { pattern: RegExp; issue: string; suggestion: string }[] = [
  {
    pattern: /\b(?:rockstar|rock\s*star|ninja|guru|wizard)\b/i,
    issue: 'Superficial jargon that alienates qualified candidates and obscures actual job expectations.',
    suggestion: 'Use precise technical titles such as "Accomplished Senior Engineer" or "Subject Matter Expert".',
  },
  {
    pattern: /\b(?:wear\s+many\s+hats)\b/i,
    issue: 'Often signals unmanaged scope creep, lack of defined responsibilities, and poor organizational structure.',
    suggestion: 'Specify cross-functional collaboration areas clearly, e.g. "Collaborate across frontend, backend, and DevOps".',
  },
  {
    pattern: /\b(?:fast[- ]paced\s+environment\s+with\s+no\s+hand[- ]holding)\b/i,
    issue: 'Can imply an unsupportive workplace culture with lack of onboarding and high burnout risk.',
    suggestion: 'State "Autonomous environment with structured peer mentorship and clear engineering ownership".',
  },
  {
    pattern: /\b(?:work\s+hard[,\s]+play\s+hard)\b/i,
    issue: 'Often signals expectations of excessive unpaid overtime and boundary violations.',
    suggestion: 'Highlight team values such as "High-impact execution with strong commitment to sustainable work-life balance".',
  },
];

const INCLUSIVE_LANGUAGE_RULES: {
  category: 'gender_bias' | 'age_bias' | 'ableism' | 'elitism';
  pattern: RegExp;
  tone: 'masculine_coded' | 'feminine_coded' | 'ageist' | 'ableist' | 'exclusionary';
  suggestedAlternative: string;
  rationale: string;
}[] = [
  // Masculine coded
  {
    category: 'gender_bias',
    pattern: /\b(?:aggressive|aggressively)\b/i,
    tone: 'masculine_coded',
    suggestedAlternative: 'proactive / determined / goal-oriented',
    rationale: 'Research shows "aggressive" discourages diverse applicants and conveys combative internal culture.',
  },
  {
    category: 'gender_bias',
    pattern: /\b(?:dominant|dominate\s+the\s+market)\b/i,
    tone: 'masculine_coded',
    suggestedAlternative: 'lead / establish industry excellence',
    rationale: 'Hyper-competitive phrasing reduces application rates from underrepresented groups.',
  },
  {
    category: 'gender_bias',
    pattern: /\b(?:manpower|man[- ]hours)\b/i,
    tone: 'masculine_coded',
    suggestedAlternative: 'workforce / team capacity / personnel hours',
    rationale: 'Gendered noun where neutral professional equivalents are standard.',
  },
  {
    category: 'gender_bias',
    pattern: /\b(?:crush\s+it|killer\s+instinct)\b/i,
    tone: 'masculine_coded',
    suggestedAlternative: 'excel / high-achieving execution',
    rationale: 'Hyper-masculine idioms correlate with lower female application rates.',
  },

  // Feminine coded (over-indexing on supportive roles without technical agency)
  {
    category: 'gender_bias',
    pattern: /\b(?:nurturing|supportive\s+caregiver)\b/i,
    tone: 'feminine_coded',
    suggestedAlternative: 'collaborative / empathetic mentor',
    rationale: 'Can inadvertently gender expectations around administrative or emotional labor.',
  },

  // Ageist
  {
    category: 'age_bias',
    pattern: /\b(?:young\s+and\s+energetic|youthful\s+vibe)\b/i,
    tone: 'ageist',
    suggestedAlternative: 'dynamic and motivated / innovative team',
    rationale: 'Violates age-discrimination best practices by implying older candidates are unwelcome.',
  },
  {
    category: 'age_bias',
    pattern: /\b(?:digital\s+native|digital\s+natives)\b/i,
    tone: 'ageist',
    suggestedAlternative: 'tech-savvy / proficient in modern web technologies',
    rationale: 'Proxy for generational age that discriminates against experienced workers.',
  },
  {
    category: 'age_bias',
    pattern: /\b(?:recent\s+college\s+graduates?\s+only)\b/i,
    tone: 'ageist',
    suggestedAlternative: 'candidates seeking early-career opportunities',
    rationale: 'Artificially restricts roles by graduation year rather than capability.',
  },

  // Ableist
  {
    category: 'ableism',
    pattern: /\b(?:must\s+be\s+physically\s+fit|stand\s+for\s+extended\s+periods)\b/i,
    tone: 'ableist',
    suggestedAlternative: 'perform core desk tasks with reasonable accommodation if needed',
    rationale: 'Physical fitness requirements for knowledge-worker software roles are exclusionary.',
  },
];

/**
 * Analyzes a job description for unrealistic tech experience, seniority mismatches, and structural clarity.
 */
export function analyzeJobDescriptionQuality(
  jdText: string,
  statedTitle = '',
  minExpYears = 0
): JdQualityReport {
  const currentYear = 2026;
  const unrealisticRequirements: JdQualityReport['unrealisticRequirements'] = [];
  const seniorityContradictions: JdQualityReport['seniorityContradictions'] = [];
  const vaguePhrasingFlags: JdQualityReport['vaguePhrasingFlags'] = [];

  // 1. Detect unrealistic tech experience (e.g., "12+ years of Kubernetes")
  for (const [tech, launchYear] of Object.entries(TECH_RELEASE_YEARS)) {
    const maxYears = currentYear - launchYear;
    // Regex matching "X+? years (of)? [tech]" or "[tech] (with)? X+? years"
    const regex1 = new RegExp(`(\\d{1,2})\\+?\\s*(?:years?|yrs?)(?:\\s+of)?\\s+(?:experience\\s+in\\s+)?${tech}\\b`, 'i');
    const regex2 = new RegExp(`\\b${tech}\\b[^.\\n]{0,30}?(\\d{1,2})\\+?\\s*(?:years?|yrs?)`, 'i');

    const m1 = jdText.match(regex1);
    const m2 = jdText.match(regex2);
    const matchedYears = m1 ? parseInt(m1[1], 10) : m2 ? parseInt(m2[1], 10) : null;

    if (matchedYears !== null && matchedYears > maxYears) {
      unrealisticRequirements.push({
        technology: tech.charAt(0).toUpperCase() + tech.slice(1),
        claimedYearsRequired: matchedYears,
        technologyReleaseYear: launchYear,
        maxPossibleYears: maxYears,
        issue: `Requires ${matchedYears} years of ${tech}, but ${tech} was first released in ${launchYear} (${maxYears} years ago).`,
        recommendation: `Reduce requirement to at most ${Math.min(5, maxYears)} years of ${tech} or state "solid hands-on production experience".`,
      });
    }
  }

  // 2. Check for seniority contradictions
  const titleAndText = `${statedTitle} ${jdText}`.toLowerCase();
  const isJunior = /\b(?:junior|entry[- ]level|associate|intern)\b/i.test(titleAndText);
  const isSenior = /\b(?:senior|lead|principal|staff|director|head\s+of)\b/i.test(titleAndText);

  if (isJunior && minExpYears > 3) {
    seniorityContradictions.push({
      statedSeniority: 'Junior / Entry-Level',
      statedYears: minExpYears,
      issue: `Role is designated as Junior/Entry-level but mandates ${minExpYears} years of professional experience.`,
      recommendation: 'Align entry-level roles with 0 - 2 years of experience or reclassify role seniority to Mid/Senior.',
    });
  } else if (isSenior && minExpYears > 0 && minExpYears < 2) {
    seniorityContradictions.push({
      statedSeniority: 'Senior / Lead',
      statedYears: minExpYears,
      issue: `Role is designated as Senior/Lead but specifies only ${minExpYears} year(s) of minimum experience.`,
      recommendation: 'Senior roles typically require 4+ years of evidenced architecture and delivery experience.',
    });
  }

  // 3. Check for vague phrasing & buzzwords
  for (const rule of VAGUE_BUZZWORDS) {
    const match = jdText.match(rule.pattern);
    if (match) {
      vaguePhrasingFlags.push({
        phrase: match[0],
        issue: rule.issue,
        suggestion: rule.suggestion,
      });
    }
  }

  // 4. Must-have vs nice-to-have separation check
  const hasRequiredHeading = /(?:required|requirements|must[- ]have|qualifications|what\s+you(?:'ll)?\s+need)/i.test(jdText);
  const hasPreferredHeading = /(?:preferred|nice[- ]to[- ]have|bonus|plus|good\s+to\s+have|desired)/i.test(jdText);
  const hasMustHaveNiceToHaveSplit = hasRequiredHeading && hasPreferredHeading;

  // Compute Overall Score
  let score = 100;
  score -= unrealisticRequirements.length * 25;
  score -= seniorityContradictions.length * 20;
  score -= vaguePhrasingFlags.length * 10;
  if (!hasMustHaveNiceToHaveSplit) score -= 15;
  score = Math.max(10, Math.min(100, score));

  let qualityTier: JdQualityReport['qualityTier'] = 'Excellent';
  if (score < 50) qualityTier = 'Critical Issues';
  else if (score < 75) qualityTier = 'Needs Improvement';
  else if (score < 90) qualityTier = 'Good';

  const recommendations: string[] = [];
  if (unrealisticRequirements.length > 0) {
    recommendations.push('Fix impossible technology release year constraints.');
  }
  if (seniorityContradictions.length > 0) {
    recommendations.push('Align stated role seniority title with experience prerequisites.');
  }
  if (!hasMustHaveNiceToHaveSplit) {
    recommendations.push('Segment requirements into separate "Must-Have" and "Nice-to-Have" sections to avoid filtering out qualified candidates.');
  }
  if (vaguePhrasingFlags.length > 0) {
    recommendations.push('Replace generic buzzwords with concrete day-to-day responsibilities and outcomes.');
  }

  return {
    overallScore: score,
    qualityTier,
    unrealisticRequirements,
    seniorityContradictions,
    vaguePhrasingFlags,
    hasMustHaveNiceToHaveSplit,
    recommendations,
  };
}

/**
 * Evaluates job description text for inclusive language, bias, and non-exclusionary alternatives.
 */
export function checkInclusiveLanguage(jdText: string): InclusiveLanguageReport {
  const findings: InclusiveLanguageReport['findings'] = [];
  let masculineCount = 0;
  let feminineCount = 0;

  for (const rule of INCLUSIVE_LANGUAGE_RULES) {
    const match = jdText.match(rule.pattern);
    if (match) {
      if (rule.tone === 'masculine_coded') masculineCount++;
      if (rule.tone === 'feminine_coded') feminineCount++;

      const index = match.index || 0;
      const start = Math.max(0, index - 20);
      const end = Math.min(jdText.length, index + match[0].length + 20);
      const snippet = `...${jdText.substring(start, end).replace(/\s+/g, ' ')}...`;

      findings.push({
        category: rule.category,
        matchedPhrase: match[0],
        tone: rule.tone,
        contextSnippet: snippet,
        suggestedAlternative: rule.suggestedAlternative,
        rationale: rule.rationale,
      });
    }
  }

  let status: InclusiveLanguageReport['genderBalanceRatio']['status'] = 'Neutral / Balanced';
  if (masculineCount > feminineCount + 1) {
    status = 'Masculine Skewed';
  } else if (feminineCount > masculineCount + 1) {
    status = 'Feminine Skewed';
  }

  let score = 100 - findings.length * 12;
  score = Math.max(20, Math.min(100, score));

  return {
    inclusivityScore: score,
    disclaimer: 'Guidance only. Resumio inclusive language checks provide evidence-based suggestions and do not constitute legal compliance certification.',
    findings,
    genderBalanceRatio: {
      masculineTermsCount: masculineCount,
      feminineTermsCount: feminineCount,
      status,
    },
  };
}
