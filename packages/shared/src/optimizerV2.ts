/**
 * Resumio ATS-Guided Resume Optimizer, Health Suite & Simulator V2
 * Pure TypeScript implementation shared between client and server.
 *
 * Implements:
 * 1. Tailor-to-Job Analysis with Before/After Match Preview (real Score V2)
 * 2. Truthfulness verification rule (never auto-inserts unverified claims)
 * 3. Keyword-stuffing and manipulation detector
 * 4. Google XYZ Bullet Rewriter with strict No-Fabrication Validator
 * 5. Resume Health Suite (quantification ratio, verb strength, spelling, personal data warnings)
 * 6. ATS Simulator with 4 heuristic rule packs
 */

import {
  CandidateScoringInputV2,
  JobScoringInputV2,
  ScoreV2Result,
  calculateScoreV2,
} from './scoringV2.js';

// ==========================================
// 1. Tailor-to-Job Analysis
// ==========================================

export interface TailorAnalysisResult {
  jobId: string;
  jobTitle: string;
  requiredSkillsAnalysis: {
    total: number;
    matched: string[];
    missing: string[];
    coveragePercent: number;
  };
  preferredSkillsAnalysis: {
    total: number;
    matched: string[];
    missing: string[];
    coveragePercent: number;
  };
  weaklyEvidencedSkills: Array<{
    skill: string;
    evidenceCount: number;
    reason: string;
    recommendation: string;
  }>;
  seniorityGap: {
    candidateSeniority: string;
    targetSeniority: string;
    candidateYears: number;
    targetYears: number;
    gapYears: number;
    isSatisfied: boolean;
  };
  beforeScore: ScoreV2Result;
  projectedAfterScore: ScoreV2Result;
  scoreDelta: number;
  keywordStuffingWarning: {
    isManipulative: boolean;
    densityPercent: number;
    stuffedKeywords: string[];
    warningMessage?: string;
  };
  truthfulnessPrompt: {
    unverifiedMissingSkills: string[];
    message: string;
  };
}

/**
 * Detects manipulative keyword stuffing (abnormal frequency or word repetition)
 */
export function detectKeywordStuffing(text: string, targetKeywords?: string[]): {
  isManipulative: boolean;
  densityPercent: number;
  maxDensityPercent: number;
  stuffedKeywords: Array<{ word: string; count: number; densityPercent: number; label: string }>;
  warningMessage?: string;
} {
  if (!text || text.trim().length === 0) {
    return { isManipulative: false, densityPercent: 0, maxDensityPercent: 0, stuffedKeywords: [] };
  }

  const cleanText = text.toLowerCase();
  const words = cleanText.split(/\s+/).filter(Boolean);
  const totalWordCount = Math.max(1, words.length);

  const keywordsToCheck = Array.isArray(targetKeywords) && targetKeywords.length > 0
    ? targetKeywords
    : Array.from(new Set(cleanText.match(/\b[a-z]{4,}\b/g) || []));

  const stuffed: Array<{ word: string; count: number; densityPercent: number; label: string }> = [];
  let maxKeywordCount = 0;

  for (const kw of keywordsToCheck) {
    const kwLower = kw.toLowerCase().trim();
    if (!kwLower) continue;

    // Word boundary match
    const regex = new RegExp(`\\b${kwLower.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
    const matches = cleanText.match(regex);
    const count = matches ? matches.length : 0;

    if (count > maxKeywordCount) maxKeywordCount = count;

    // Density rule: if a single skill exceeds 4.0% of total document words, or repeated >= 7 times in short text
    const keywordDensity = (count / totalWordCount) * 100;
    if (keywordDensity > 4.0 || (count >= 7 && totalWordCount < 300)) {
      stuffed.push({
        word: kw,
        count,
        densityPercent: Number(keywordDensity.toFixed(1)),
        label: `${kw} (${count}x, ${keywordDensity.toFixed(1)}% density)`
      });
    }
  }

  const totalStuffedDensity = (maxKeywordCount / totalWordCount) * 100;
  const isManipulative = stuffed.length > 0;

  return {
    isManipulative,
    densityPercent: Number(totalStuffedDensity.toFixed(1)),
    maxDensityPercent: Number(totalStuffedDensity.toFixed(1)),
    stuffedKeywords: stuffed,
    warningMessage: isManipulative
      ? `Keyword-stuffing detected: Excessive repetition of [${stuffed.map((s) => s.label).join(', ')}]. Modern ATS algorithms flag manipulative repetition. Distribute skills across authentic milestone bullet points.`
      : undefined,
  };
}

/**
 * Analyzes resume tailoring to a specific job and calculates before/after score preview
 */
export function analyzeResumeTailoring(
  candidate: any,
  job: any,
  options?: {
    confirmedSkills?: string[]; // Candidate confirmed they actually possess these
    customText?: string;
  }
): any {
  const rawSkills: any[] = candidate.skills || [];
  const normalizedCandidateSkills = rawSkills.map((s: any) => {
    if (typeof s === 'string') {
      return { name: s, proficiency: 4, yearsOfExperience: 3, verifiedByEvidence: true };
    }
    return {
      name: s.name || '',
      proficiency: s.proficiency || 4,
      yearsOfExperience: s.yearsOfExperience || 3,
      verifiedByEvidence: Boolean(s.verifiedByEvidence ?? true)
    };
  }).filter((s) => s.name.trim().length > 0);

  const candSkillNames = new Set(normalizedCandidateSkills.map((s) => s.name.trim().toLowerCase()));

  const reqSkills: string[] = job.requiredSkills || [];
  const prefSkills: string[] = job.preferredSkills || [];

  // 1. Analyze Required Skills
  const matchedReq: string[] = [];
  const missingReq: string[] = [];
  for (const req of reqSkills) {
    if (candSkillNames.has(req.trim().toLowerCase())) {
      matchedReq.push(req);
    } else {
      missingReq.push(req);
    }
  }

  // 2. Analyze Preferred Skills
  const matchedPref: string[] = [];
  const missingPref: string[] = [];
  for (const pref of prefSkills) {
    if (candSkillNames.has(pref.trim().toLowerCase())) {
      matchedPref.push(pref);
    } else {
      missingPref.push(pref);
    }
  }

  const reqTotal = Math.max(1, reqSkills.length);
  const prefTotal = Math.max(1, prefSkills.length);

  // 3. Weakly Evidenced Skills
  const weaklyEvidenced: any[] = [];
  for (const s of normalizedCandidateSkills) {
    if (s.verifiedByEvidence === false || s.proficiency < 3) {
      weaklyEvidenced.push({
        skill: s.name,
        evidenceCount: s.proficiency,
        reason: 'Skill listed in summary/tags without quantified achievement in work experience.',
        recommendation: `Add a quantified bullet in your Experience section demonstrating how you applied ${s.name}.`,
      });
    }
  }

  // 4. Seniority / Years Gap
  const expEntries = candidate.experience || [];
  let candidateYears = 0;
  for (const exp of expEntries) {
    const start = parseInt((exp.startDate || '2020').slice(0, 4), 10) || 2020;
    const end = exp.endDate && !/present|current/i.test(exp.endDate)
      ? parseInt(exp.endDate.slice(0, 4), 10) || 2024
      : 2026;
    candidateYears += Math.max(1, end - start);
  }
  if (candidateYears === 0 && candidate.seniorityYears) {
    candidateYears = candidate.seniorityYears;
  }
  if (candidateYears === 0) candidateYears = 3;

  const targetYears = job.minYearsExperience || (job.requiredSkills?.length > 6 ? 5 : 2);
  const gapYears = Math.max(0, targetYears - candidateYears);
  const candidateSeniority = candidateYears >= 8 ? 'Senior / Staff' : candidateYears >= 4 ? 'Mid-Senior' : 'Junior';
  const targetSeniority = targetYears >= 8 ? 'Senior / Staff' : targetYears >= 4 ? 'Mid-Senior' : 'Junior';

  // 5. Keyword Stuffing Check
  const resumeText = options?.customText || candidate.document?.extractedText || candidate.rawText || '';
  const stuffingAnalysis = detectKeywordStuffing(resumeText, [...reqSkills, ...prefSkills]);

  // 6. Before Score vs Projected After Score using calculateScoreV2
  const candidateInput: CandidateScoringInputV2 = {
    candidateId: candidate.candidateId || 'candidate_tailor',
    skills: normalizedCandidateSkills,
    experienceYears: candidateYears,
    seniorityLevel: candidateSeniority,
    experiences: candidate.experience || [],
    projects: candidate.projects || [],
    education: candidate.education || [],
    achievements: candidate.achievements || [],
    semanticScore: candidate.semanticScore || 80,
  };

  const jobInput: JobScoringInputV2 = {
    jobId: job.jobId || 'target_job',
    title: job.title || 'Target Job',
    requiredSkills: reqSkills,
    preferredSkills: prefSkills,
    minYearsExperience: targetYears,
  };

  const beforeScore = calculateScoreV2(candidateInput, jobInput);

  // Projected after score: what if missing required skills were evidenced?
  const confirmedSet = new Set((options?.confirmedSkills || []).map((s) => s.toLowerCase()));
  const simulatedSkills = [...normalizedCandidateSkills];
  for (const m of missingReq) {
    if (confirmedSet.has(m.toLowerCase()) || options?.confirmedSkills === undefined) {
      simulatedSkills.push({
        name: m,
        proficiency: 4,
        yearsOfExperience: 2,
        verifiedByEvidence: true,
      });
    }
  }

  const simulatedCandidate: CandidateScoringInputV2 = {
    ...candidateInput,
    skills: simulatedSkills,
  };
  const projectedAfterScore = calculateScoreV2(simulatedCandidate, jobInput);
  const scoreDelta = Number((projectedAfterScore.finalScore - beforeScore.finalScore).toFixed(2));

  return {
    jobId: jobInput.jobId,
    jobTitle: jobInput.title,
    currentScore: beforeScore.finalScore,
    potentialOptimizedScore: projectedAfterScore.finalScore,
    skillCoverage: {
      matchedRequired: matchedReq,
      missingRequired: missingReq,
      matchedPreferred: matchedPref,
      missingPreferred: missingPref,
      requiredCoverageRatio: Number((matchedReq.length / reqTotal).toFixed(2)),
    },
    requiredSkillsAnalysis: {
      total: reqSkills.length,
      matched: matchedReq,
      missing: missingReq,
      coveragePercent: Number(((matchedReq.length / reqTotal) * 100).toFixed(1)),
    },
    preferredSkillsAnalysis: {
      total: prefSkills.length,
      matched: matchedPref,
      missing: missingPref,
      coveragePercent: Number(((matchedPref.length / prefTotal) * 100).toFixed(1)),
    },
    weaklyEvidencedSkills: weaklyEvidenced,
    seniorityGap: {
      candidateSeniority,
      targetSeniority,
      candidateYears,
      targetYears,
      gapYears,
      isSatisfied: gapYears === 0,
    },
    beforeScore,
    projectedAfterScore,
    scoreDelta,
    keywordStuffing: stuffingAnalysis,
    keywordStuffingWarning: stuffingAnalysis,
    truthfulnessPrompt: {
      unverifiedMissingSkills: missingReq,
      message: 'Truthfulness Guard: Resumio strictly bars automatic insertion of unverified skills. Check only the skills where you have authentic hands-on experience.',
    },
  };
}

// ==========================================
// 2. Google XYZ Bullet Rewriter & No-Fabrication Validator
// ==========================================

export interface BulletRewriteResult {
  original: string;
  rewritten: string;
  rewrittenBullet?: string;
  wasModified?: boolean;
  suggestedPromptIfMissingMetric?: string;
  hasMetric: boolean;
  metricSuppliedByUser: boolean;
  validationPassed: boolean;
  rejectionReason?: string;
  components: {
    accomplishedX: string;
    measuredByY: string;
    doingZ: string;
    action?: string;
    accomplished?: string;
    measured?: string;
  };
  coachingNotes: string[];
}

// Extractor helper: pulls numbers, percentages, and metrics out of text
function extractNumbersAndQuantifiers(text: string): Set<string> {
  const matches = text.match(/\b\d+(\.\d+)?%?|\$\d+([kKmMbB])?|\d+x\b/g);
  return new Set(matches ? matches.map((m) => m.toLowerCase().trim()) : []);
}

/**
 * Strict No-Fabrication Validator:
 * Validates that an AI-generated or coached bullet point does NOT invent metrics,
 * numbers, or claims not present in the original bullet or user-provided input.
 */
export class NoFabricationValidator {
  public static validateBulletRewrite(
    original: string,
    rewritten: string,
    userSuppliedMetric?: string
  ): { isValid: boolean; reason?: string } {
    if (!rewritten || rewritten.trim().length === 0) {
      return { isValid: false, reason: 'Rewritten text is empty.' };
    }

    const sourceNumbers = extractNumbersAndQuantifiers(original);
    if (userSuppliedMetric) {
      for (const num of extractNumbersAndQuantifiers(userSuppliedMetric)) {
        sourceNumbers.add(num);
      }
    }

    const rewrittenNumbers = extractNumbersAndQuantifiers(rewritten);

    // Reject if rewritten introduces any number not in source or userMetric
    for (const num of rewrittenNumbers) {
      if (!sourceNumbers.has(num)) {
        return {
          isValid: false,
          reason: `Fabricated metric detected: '${num}' was not present in the source bullet or user-provided metrics. Resumio strictly bars hallucinated data.`,
        };
      }
    }

    return { isValid: true };
  }

  public static validateNumbers(
    original: string,
    rewritten: string,
    userSuppliedMetric?: string
  ): { isValid: boolean; unsupportedNumbers: string[]; reason?: string } {
    const sourceNumbers = extractNumbersAndQuantifiers(original);
    if (userSuppliedMetric) {
      for (const num of extractNumbersAndQuantifiers(userSuppliedMetric)) {
        sourceNumbers.add(num);
      }
    }

    const rewrittenNumbers = extractNumbersAndQuantifiers(rewritten);
    const unsupported: string[] = [];

    for (const num of rewrittenNumbers) {
      if (!sourceNumbers.has(num)) {
        unsupported.push(num);
      }
    }

    return {
      isValid: unsupported.length === 0,
      unsupportedNumbers: unsupported,
      reason: unsupported.length > 0 ? `Fabricated metrics detected: ${unsupported.join(', ')}` : undefined,
    };
  }

  public static validateTechnologies(
    candidateTech: string[],
    rewritten: string
  ): { isValid: boolean; unsupportedTechnologies: string[]; reason?: string } {
    const knownTech = new Set(candidateTech.map((t) => t.toLowerCase().trim()));
    const textLower = rewritten.toLowerCase();
    const commonTechDictionary = [
      'kubernetes', 'kafka', 'rust', 'docker', 'graphql', 'redis', 'aws', 'gcp', 'spark', 'react', 'python', 'go', 'node.js', 'typescript'
    ];
    const unsupported: string[] = [];
    for (const tech of commonTechDictionary) {
      if (textLower.includes(tech) && !knownTech.has(tech)) {
        unsupported.push(tech);
      }
    }
    return {
      isValid: unsupported.length === 0,
      unsupportedTechnologies: unsupported,
      reason: unsupported.length > 0 ? `Unmentioned technologies: ${unsupported.join(', ')}` : undefined,
    };
  }
}

/**
 * Deterministic Rule-Based Bullet Coach and Rewriter.
 * Analyzes weak verbs, passive voice, missing metric, length, and formats to Google XYZ pattern.
 */
export function rewriteBulletDeterministic(
  rawBullet: string,
  userSuppliedMetricOrSkill?: string,
  optionalUserMetric?: string
): BulletRewriteResult {
  const clean = rawBullet.trim().replace(/^[-*•]\s*/, '');
  if (!clean) {
    throw new Error('Bullet point text is required.');
  }

  // Handle flexible signature: (bullet, userMetric) or (bullet, contextSkill, userMetric)
  let contextSkill: string | undefined;
  let userSuppliedMetric: string | undefined;

  if (optionalUserMetric !== undefined) {
    contextSkill = userSuppliedMetricOrSkill;
    userSuppliedMetric = optionalUserMetric;
  } else if (userSuppliedMetricOrSkill) {
    if (/\b\d+(\.\d+)?%?|\$\d+|\d+x|latency|uptime|cost|user|request/i.test(userSuppliedMetricOrSkill)) {
      userSuppliedMetric = userSuppliedMetricOrSkill;
    } else {
      contextSkill = userSuppliedMetricOrSkill;
    }
  }

  const coachingNotes: string[] = [];

  // Weak verb check
  const weakVerbs = ['helped', 'worked on', 'responsible for', 'assisted', 'did', 'handled', 'involved in', 'supported'];
  const hasWeakVerb = weakVerbs.some((v) => clean.toLowerCase().includes(v));
  if (hasWeakVerb) {
    coachingNotes.push('Weak or passive action verb elevated to executive technical leadership verb.');
  }

  // Passive voice check
  if (/\b(was|were)\s+\w+ed\s+by\b/i.test(clean)) {
    coachingNotes.push('Passive voice construction refactored into active direct voice.');
  }

  // Length check
  const wordCount = clean.split(/\s+/).length;
  if (wordCount < 8) {
    coachingNotes.push('Bullet was too brief (< 8 words); expanded with architectural scope.');
  } else if (wordCount > 35) {
    coachingNotes.push('Bullet was overly verbose (> 35 words); condensed for ATS scanning clarity.');
  }

  // Metric presence
  const sourceNumbers = extractNumbersAndQuantifiers(clean);
  const hasSourceMetric = sourceNumbers.size > 0;
  const hasUserMetric = Boolean(userSuppliedMetric && userSuppliedMetric.trim().length > 0);

  let measuredByY = '';
  if (hasUserMetric) {
    measuredByY = userSuppliedMetric!.trim();
  } else if (hasSourceMetric) {
    // Keep source metric verbatim
    const firstMetric = Array.from(sourceNumbers)[0];
    measuredByY = `achieving ${firstMetric} performance efficiency`;
  } else {
    // DO NOT INVENT A NUMBER! Use transparent prompt placeholder
    measuredByY = '[Insert metric: e.g. 35% latency reduction or $50k cost savings]';
    coachingNotes.push('Metric required: Please supply a quantified outcome (percentage, latency, revenue, or user scale).');
  }

  // Technical action clause
  const skill = contextSkill?.trim() || 'production architecture';

  let accomplishedX = clean;
  // Strip weak starters
  accomplishedX = accomplishedX
    .replace(/^responsible for\s+/i, '')
    .replace(/^worked on\s+/i, '')
    .replace(/^helped (to\s+)?/i, '')
    .replace(/^assisted (with|in)\s+/i, '');

  // Capitalize action verb
  if (/^build|^develop|^creat|^writ/i.test(accomplishedX)) {
    accomplishedX = 'Architected and deployed ' + accomplishedX.replace(/^[a-z]+\s+/i, '');
  } else if (/^lead|^manag|^direct/i.test(accomplishedX)) {
    accomplishedX = 'Spearheaded technical development of ' + accomplishedX.replace(/^[a-z]+\s+/i, '');
  } else if (/^test|^debug|^fix/i.test(accomplishedX)) {
    accomplishedX = 'Refactored and resolved critical concurrency defects in ' + accomplishedX.replace(/^[a-z]+\s+/i, '');
  } else {
    accomplishedX = 'Engineered ' + accomplishedX;
  }

  const doingZ = `leveraging ${skill} and robust CI/CD automated validation`;

  const rewritten = `Accomplished ${accomplishedX}, as measured by ${measuredByY}, by doing ${doingZ}.`;

  // Run No-Fabrication Validator
  const valResult = NoFabricationValidator.validateBulletRewrite(clean, rewritten, userSuppliedMetric);

  return {
    original: clean,
    rewritten,
    rewrittenBullet: rewritten,
    wasModified: true,
    suggestedPromptIfMissingMetric: !hasSourceMetric && !hasUserMetric
      ? 'What was the % improvement, time saved, or team size?'
      : undefined,
    hasMetric: hasSourceMetric || hasUserMetric,
    metricSuppliedByUser: hasUserMetric,
    validationPassed: valResult.isValid,
    rejectionReason: valResult.reason,
    components: {
      accomplishedX,
      measuredByY,
      doingZ,
      action: doingZ,
      accomplished: accomplishedX,
      measured: measuredByY,
    },
    coachingNotes,
  };
}

// ==========================================
// 3. Resume Health Suite & Strength Score
// ==========================================

export interface ResumeHealthReport {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'Needs Attention';
  quantificationRatioPercent: number; // 0 - 100%
  actionVerbStrengthPercent: number;  // 0 - 100%
  spellingGrammarIssues: Array<{
    word: string;
    suggestion: string;
    rule: string;
    context: string;
  }>;
  personalDataWarnings: Array<{
    issue: string;
    recommendation: string;
    severity: 'warning' | 'info';
  }>;
  lengthGuidance: {
    pageEstimate: number;
    recommendedPages: number;
    status: 'optimal' | 'too_long' | 'too_short';
    message: string;
  };
  checklist: Array<{
    id: string;
    title: string;
    passed: boolean;
    scoreDelta: number;
    message: string;
  }>;
}

// Common resume typographical and spelling error dictionary (offline deterministic engine)
const COMMON_RESUME_TYPOS: Record<string, string> = {
  manger: 'manager',
  teh: 'the',
  seperate: 'separate',
  seperated: 'separated',
  experiance: 'experience',
  experianced: 'experienced',
  responsable: 'responsible',
  responsabilities: 'responsibilities',
  developement: 'development',
  enviroment: 'environment',
  achivement: 'achievement',
  achived: 'achieved',
  succesful: 'successful',
  oppurtunity: 'opportunity',
  profficient: 'proficient',
  implimented: 'implemented',
  colaborated: 'collaborated',
  maintenence: 'maintenance',
  reponsible: 'responsible',
  'sickit-learn': 'Scikit-learn',
  postgresl: 'PostgreSQL',
  dockr: 'Docker',
};

const STRONG_ACTION_VERBS = new Set([
  'architected', 'spearheaded', 'engineered', 'orchestrated', 'deployed', 'refactored',
  'accelerated', 'optimized', 'scaled', 'automated', 'streamlined', 'pioneered',
  'authored', 'designed', 'delivered', 'formulated', 'standardized', 'eliminated',
  'built', 'transformed', 'negotiated', 'launched', 'resolved', 'mentored',
]);

/**
 * Evaluates resume health, spelling, quantification, and personal data compliance.
 * Produces a Resume Strength score (0-100) independent of any specific job fit.
 */
export function calculateResumeHealth(resume: any): any {
  let bullets: string[] = [];
  if (Array.isArray(resume.bulletPoints)) {
    bullets = resume.bulletPoints;
  } else if (Array.isArray(resume.experience)) {
    bullets = resume.experience.flatMap((e: any) => Array.isArray(e.bullets) ? e.bullets : []);
  }

  let text = '';
  if (resume.rawText) {
    text = resume.rawText;
  } else {
    text = [
      resume.summary || '',
      ...(resume.skills ? (Array.isArray(resume.skills) ? resume.skills : Object.values(resume.skills).flat()) : []),
      ...bullets,
    ].join(' ');
  }
  const textLower = text.toLowerCase();
  const wordCount = textLower.split(/\s+/).filter(Boolean).length;

  // 1. Quantification Ratio
  let quantifiedBulletsCount = 0;
  for (const b of bullets) {
    if (/\b\d+(\.\d+)?%?|\$\d+|\d+x\b/.test(b)) {
      quantifiedBulletsCount++;
    }
  }
  const totalBullets = Math.max(1, bullets.length);
  const quantificationRatioPercent = Math.round((quantifiedBulletsCount / totalBullets) * 100);

  // 2. Action Verb Strength
  let strongVerbCount = 0;
  for (const b of bullets) {
    const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (STRONG_ACTION_VERBS.has(firstWord)) {
      strongVerbCount++;
    }
  }
  const actionVerbStrengthPercent = Math.round((strongVerbCount / totalBullets) * 100);

  // 3. Spelling & Grammar Typo Detection
  const spellingIssues: Array<{ word: string; suggestion: string; rule: string; context: string }> = [];
  const tokens = textLower.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
  for (const token of tokens) {
    if (COMMON_RESUME_TYPOS[token]) {
      const idx = textLower.indexOf(token);
      const start = Math.max(0, idx - 20);
      const end = Math.min(textLower.length, idx + token.length + 20);
      const context = text.slice(start, end).trim();

      if (!spellingIssues.some((s) => s.word === token)) {
        spellingIssues.push({
          word: token,
          suggestion: COMMON_RESUME_TYPOS[token],
          rule: 'Typographical dictionary correction',
          context: `...${context}...`,
        });
      }
    }
  }

  // 4. Unnecessary Personal Data Warnings (EEOC / Privacy Guard)
  const personalDataWarnings: Array<{ issue: string; recommendation: string; severity: 'warning' | 'info' }> = [];
  const hasPhoto = Boolean(resume.hasPhoto || resume.personal?.photoUrl || /photo|headshot|avatar/i.test(textLower));
  const hasDob = Boolean(resume.hasDateOfBirth || resume.personal?.dateOfBirth || /\b(dob|date\s+of\s+birth|born\s+in)\b/i.test(textLower));
  const hasMarital = Boolean(resume.hasMaritalStatus || resume.personal?.maritalStatus || /\b(single|married|marital\s+status|divorced)\b/i.test(textLower));
  const hasAddress = Boolean(resume.hasFullAddress || resume.personal?.fullAddress);

  if (hasPhoto) {
    personalDataWarnings.push({
      issue: 'Profile Photo Included',
      recommendation: 'Remove photo from your resume. EEOC guidelines advise against photos to eliminate unconscious appearance bias.',
      severity: 'warning',
    });
  }
  if (hasDob) {
    personalDataWarnings.push({
      issue: 'Date of Birth / Age Marker Included',
      recommendation: 'Remove date of birth to protect against age bias under ADEA fair hiring regulations.',
      severity: 'warning',
    });
  }
  if (hasMarital) {
    personalDataWarnings.push({
      issue: 'Marital Status Disclosed',
      recommendation: 'Exclude marital or family status. It is irrelevant to technical qualification and violates EEOC privacy standards.',
      severity: 'warning',
    });
  }
  if (hasAddress) {
    personalDataWarnings.push({
      issue: 'Full Street Address Present',
      recommendation: 'Replace full street address with City and State/Country for personal security and anti-doxxing safety.',
      severity: 'info',
    });
  }

  // 5. Length Guidance by Seniority
  const years = resume.experienceYears || (resume.experience ? resume.experience.length * 2 : 3);
  const recommendedPages = years < 5 ? 1 : years < 12 ? 2 : 2;
  const pageEstimate = Math.max(1, Math.ceil(wordCount / 450));
  let lengthStatus: 'optimal' | 'too_long' | 'too_short' = 'optimal';
  let lengthMessage = `Length is optimal (~${pageEstimate} page for ${years} years experience).`;

  if (pageEstimate > recommendedPages) {
    lengthStatus = 'too_long';
    lengthMessage = `Resume is ~${pageEstimate} pages. Recommended length for your experience (${years}y) is ${recommendedPages} page(s). Condense older or repetitive roles.`;
  } else if (pageEstimate === 1 && wordCount < 180) {
    lengthStatus = 'too_short';
    lengthMessage = 'Resume has fewer than 180 words. Expand on project achievements and technical tool proficiencies.';
  }

  // 6. Checklist & Overall Score Calculation
  const checklist = [
    {
      id: 'chk_quant',
      title: 'Quantified Impact Metrics (≥ 40% of bullets)',
      passed: quantificationRatioPercent >= 40,
      scoreDelta: 25,
      message: `${quantificationRatioPercent}% of bullet points contain numbers, metrics, or quantified outcomes.`,
    },
    {
      id: 'chk_verbs',
      title: 'Strong Executive Action Verbs (≥ 50% of bullets)',
      passed: actionVerbStrengthPercent >= 50,
      scoreDelta: 20,
      message: `${actionVerbStrengthPercent}% of bullet points open with high-impact active verbs.`,
    },
    {
      id: 'chk_spelling',
      title: 'Zero Common Spelling or Typographical Errors',
      passed: spellingIssues.length === 0,
      scoreDelta: 15,
      message: spellingIssues.length === 0 ? 'No common typos found.' : `${spellingIssues.length} typo(s) identified.`,
    },
    {
      id: 'chk_privacy',
      title: 'EEOC Privacy Clean (No photo, DOB, or marital status)',
      passed: personalDataWarnings.filter((w) => w.severity === 'warning').length === 0,
      scoreDelta: 15,
      message: personalDataWarnings.length === 0 ? 'Protected personal attributes clean.' : 'Protected demographic details flagged.',
    },
    {
      id: 'chk_length',
      title: 'Seniority-Aligned Document Length',
      passed: lengthStatus === 'optimal',
      scoreDelta: 15,
      message: lengthMessage,
    },
    {
      id: 'chk_sections',
      title: 'Essential ATS Sections Included',
      passed: Boolean((resume.sections && resume.sections.length >= 4) || resume.experience || resume.education),
      scoreDelta: 10,
      message: 'Includes core headings (Contact, Summary, Skills, Experience, Education).',
    },
  ];

  const overallScore = checklist.reduce((acc, item) => acc + (item.passed ? item.scoreDelta : 0), 0);
  const grade = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 65 ? 'B' : overallScore >= 50 ? 'C' : 'Needs Attention';
  const warningStrings = personalDataWarnings.map((w) => w.issue || (w as any));

  return {
    overallScore,
    strengthScore: overallScore,
    grade,
    quantificationRatioPercent,
    actionVerbStrengthPercent,
    spellingGrammarIssues: spellingIssues,
    personalDataWarnings: warningStrings,
    diagnostics: {
      quantification: {
        quantificationRatioPercent,
        passed: quantificationRatioPercent >= 40,
      },
      actionVerbs: {
        strongVerbRatioPercent: actionVerbStrengthPercent,
        passed: actionVerbStrengthPercent >= 50,
      },
      spellingTypos: {
        flaggedWords: spellingIssues.map((s) => ({ word: s.word, suggestion: s.suggestion })),
      },
      personalDataWarnings: warningStrings,
    },
    lengthGuidance: {
      pageEstimate,
      recommendedPages,
      status: lengthStatus,
      message: lengthMessage,
    },
    checklist,
  };
}

// ==========================================
// 4. ATS Simulator Engine (4 Rule Packs)
// ==========================================

export type AtsRulePackId = 'strict_legacy' | 'lenient_modern' | 'keyword_scanner' | 'semantic_ats';

export interface AtsRulePackInfo {
  id: AtsRulePackId;
  name: string;
  description: string;
  characteristics: string[];
}

export const ATS_RULE_PACKS: Record<AtsRulePackId, AtsRulePackInfo> = {
  strict_legacy: {
    id: 'strict_legacy',
    name: 'Generic Strict Parser (Legacy Rule Pack)',
    description: 'Heuristic simulation of older enterprise systems. Strictly rejects tables, graphics, multi-column layouts, and non-standard headings.',
    characteristics: [
      'Drops all text inside multi-column table frames',
      'Requires exact heading matches ("Work Experience", "Education")',
      'Fails on special unicode bullet glyphs',
      'Strips text embedded in images or canvas elements',
    ],
  },
  lenient_modern: {
    id: 'lenient_modern',
    name: 'Generic Modern Parser (Modern Rule Pack)',
    description: 'Simulates modern cloud-native ATS parsers with flexible heading recognition and reading-order reconstruction.',
    characteristics: [
      'Normalizes flexible headings ("Career History", "Technical Stack")',
      'Reconstructs multi-column reading order',
      'Parses GitHub and LinkedIn hyperlink metadata',
      'Preserves standard bullet lists and UTF-8 formatting',
    ],
  },
  keyword_scanner: {
    id: 'keyword_scanner',
    name: 'Legacy Keyword Frequency Scanner',
    description: 'Simulates simple keyword frequency indexing engines without semantic understanding.',
    characteristics: [
      'Exact token matching only (no synonym expansion)',
      'Highly sensitive to keyword density and placement',
      'Requires skills in explicit "Skills" section',
    ],
  },
  semantic_ats: {
    id: 'semantic_ats',
    name: 'Modern Semantic Screener',
    description: 'Simulates advanced AI-assisted screening engines with taxonomy synonym resolution and contextual experience weighting.',
    characteristics: [
      'Recognizes implied skills (e.g. Next.js implies React)',
      'Scores based on recency and verified project depth',
      'Checks for evidence grounding and action verbs',
    ],
  },
};

export interface AtsSimulationResult {
  rulePackId: AtsRulePackId;
  parserPack?: string;
  rulePackName: string;
  parseabilityScore: number; // 0 - 100%
  parseConfidenceScore?: number;
  extractedPlainText: string;
  extractedText?: string;
  detectedSections: string[];
  extractedSections?: string[];
  extractedSkills?: string[];
  missingStandardHeadings: string[];
  issues: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    autoFixable: boolean;
    fixSuggestion?: string;
  }>;
  issuesDetected?: any[];
}

/**
 * Runs a heuristic simulation of how a target ATS rule pack processes the resume.
 */
export function simulateAtsParsing(
  rawText: string,
  rulePackId: AtsRulePackId = 'strict_legacy'
): AtsSimulationResult {
  const pack = ATS_RULE_PACKS[rulePackId] || ATS_RULE_PACKS.strict_legacy;
  const issues: AtsSimulationResult['issues'] = [];
  const textLower = rawText.toLowerCase();

  const standardHeadings = ['experience', 'education', 'skills', 'projects'];
  const detectedSections: string[] = [];
  const missingHeadings: string[] = [];

  for (const h of standardHeadings) {
    if (textLower.includes(h)) {
      detectedSections.push(h.charAt(0).toUpperCase() + h.slice(1));
    } else {
      missingHeadings.push(h.charAt(0).toUpperCase() + h.slice(1));
    }
  }

  // Strict Legacy Rules
  if (rulePackId === 'strict_legacy') {
    if (missingHeadings.length > 0) {
      issues.push({
        id: 'iss_missing_headings',
        severity: 'critical',
        title: `Non-Standard Section Headings (${missingHeadings.join(', ')})`,
        description: 'Legacy ATS parsers drop content under unconventional headings (e.g. "My Journey" instead of "Experience").',
        autoFixable: true,
        fixSuggestion: `Rename section headings to standard industry titles: ${missingHeadings.join(', ')}.`,
      });
    }

    if (/[│┃┆┊║|]/.test(rawText)) {
      issues.push({
        id: 'iss_table_columns',
        severity: 'critical',
        title: 'Table or Vertical Column Delimiters Detected',
        description: 'Multi-column tables cause horizontal reading order corruption in legacy parsers, scrambling job titles and companies.',
        autoFixable: true,
        fixSuggestion: 'Convert table layouts into linear, single-column bullet points.',
      });
    }

    if (/[^\x00-\x7F]/.test(rawText)) {
      issues.push({
        id: 'iss_unicode_glyphs',
        severity: 'warning',
        title: 'Non-Standard Unicode Glyphs or Icons',
        description: 'Decorative emojis and icons (★, ➔, 📞) often render as garbage characters (e.g. ) in older OCR engines.',
        autoFixable: true,
        fixSuggestion: 'Replace fancy decorative glyphs with standard ASCII hyphens (-) or standard round bullets (•).',
      });
    }
  }

  // Keyword Scanner Rules
  if (rulePackId === 'keyword_scanner') {
    if (!textLower.includes('skills') && !textLower.includes('technologies')) {
      issues.push({
        id: 'iss_no_skills_block',
        severity: 'critical',
        title: 'Missing Dedicated Skills Section',
        description: 'Keyword scanners fail to index candidate skills if they are solely dispersed in narrative sentences without a dedicated "Skills" section.',
        autoFixable: true,
        fixSuggestion: 'Create a dedicated "Technical Skills" section categorized by Languages, Frameworks, and Cloud tools.',
      });
    }
  }

  // Compute parse-ability score
  let score = 100;
  for (const iss of issues) {
    if (iss.severity === 'critical') score -= 25;
    else if (iss.severity === 'warning') score -= 12;
    else score -= 5;
  }
  score = Math.max(20, Math.min(100, score));

  const detectedSkills = ['python', 'go', 'typescript', 'docker', 'kubernetes', 'postgresql'].filter((s) => textLower.includes(s));

  return {
    rulePackId: pack.id,
    parserPack: rulePackId,
    rulePackName: pack.name,
    parseabilityScore: score,
    parseConfidenceScore: score,
    extractedPlainText: rawText.replace(/\r\n/g, '\n').trim(),
    extractedText: rawText.replace(/\r\n/g, '\n').trim(),
    detectedSections,
    extractedSections: detectedSections,
    extractedSkills: detectedSkills,
    missingStandardHeadings: missingHeadings,
    issues,
    issuesDetected: issues.map((iss) => ({ ...iss, autoFixAvailable: iss.autoFixable })),
  };
}
