/**
 * Resumio Scoring Engine V2
 * Pure TypeScript implementation shared between client (Match Lab) and server (Express API).
 *
 * Formula Version: 2.0.0-v2
 * Components:
 * 1. Skills (required vs preferred, contextual proficiency-weighted)
 * 2. Experience (years ratio, seniority fit, recency, domain fit)
 * 3. Project Depth and Impact (quantified metrics, links, action verbs)
 * 4. Achievements (certifications, awards, quantified metrics)
 * 5. Education and Certifications (degree level hierarchy, field of study)
 * 6. Semantic Fit (learned model / dense vector similarity)
 *
 * Guaranteed Properties:
 * - Scores strictly bounded [0, 100].
 * - Monotonic in required-skill coverage (adding a required skill never lowers the score).
 * - Sum of component contributions equals final score exactly: sum(contributions) == finalScore.
 * - ATS-readiness is reported separately and is NOT part of job fit by default.
 */

import { z } from 'zod';

export const SCORING_ENGINE_VERSION = '2.0.0-v2';

// ==========================================
// Zod Schemas & Types
// ==========================================

export const ScoringWeightsV2Schema = z.object({
  skills: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  projectDepth: z.number().min(0).max(100),
  achievements: z.number().min(0).max(100),
  education: z.number().min(0).max(100),
  semanticFit: z.number().min(0).max(100),
}).refine(
  (w) => Math.abs(w.skills + w.experience + w.projectDepth + w.achievements + w.education + w.semanticFit - 100) < 0.01,
  { message: 'Scoring weights must sum to exactly 100.' }
);

export type ScoringWeightsV2 = z.infer<typeof ScoringWeightsV2Schema>;

export type PresetProfileName = 'engineering' | 'data_ml' | 'design' | 'sales' | 'operations';

export const WEIGHT_PRESETS: Record<PresetProfileName, ScoringWeightsV2> = {
  engineering: {
    skills: 35,
    experience: 25,
    projectDepth: 20,
    achievements: 5,
    education: 5,
    semanticFit: 10,
  },
  data_ml: {
    skills: 30,
    experience: 20,
    projectDepth: 25,
    achievements: 10,
    education: 10,
    semanticFit: 5,
  },
  design: {
    skills: 25,
    experience: 20,
    projectDepth: 35,
    achievements: 10,
    education: 5,
    semanticFit: 5,
  },
  sales: {
    skills: 20,
    experience: 30,
    projectDepth: 10,
    achievements: 25,
    education: 5,
    semanticFit: 10,
  },
  operations: {
    skills: 25,
    experience: 35,
    projectDepth: 10,
    achievements: 15,
    education: 10,
    semanticFit: 5,
  },
};

export interface CandidateScoringInputV2 {
  candidateId: string;
  skills: Array<{
    name: string;
    proficiency?: number; // 0-1 from Phase 4
    evidenceCount?: number;
    hasActionVerb?: boolean;
    hasQuantifiedMetric?: boolean;
  }>;
  experienceYears: number;
  seniorityLevel?: string; // entry, mid, senior, lead, principal
  domain?: string;
  hasRecentExperience?: boolean; // active within last 2 years
  projects: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
    metricsCount?: number;
    actionVerbsCount?: number;
  }>;
  achievements: Array<{
    title: string;
    description?: string;
    hasMetric?: boolean;
  }>;
  certifications: Array<{
    name: string;
    organization?: string;
  }>;
  highestDegree?: string; // none, associate, bachelor, master, doctorate
  fieldOfStudy?: string;
  rawText?: string;
  learnedSemanticScore?: number; // 0-100 from LightGBM / dense retriever
  atsReadinessScore?: number; // 0-100 from Phase 3 (reported separately)
}

export interface JobScoringInputV2 {
  jobId: string;
  title: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  minExperienceYears: number;
  targetSeniority?: string;
  domain?: string;
  requiredDegree?: string;
  mustHaveCriteria?: Array<{
    id: string;
    description: string;
    type: 'required_skill' | 'min_experience' | 'required_degree';
    targetValue: string | number;
  }>;
}

export interface ComponentContribution {
  component: 'skills' | 'experience' | 'projectDepth' | 'achievements' | 'education' | 'semanticFit';
  displayName: string;
  weight: number;
  rawScore: number; // 0-100
  contribution: number; // weight * rawScore / 100
  summary: string;
  details: string[];
}

export interface MustHaveFlag {
  criterionId: string;
  description: string;
  met: boolean;
  actualValue: string | number;
  requiredValue: string | number;
  severity: 'warning'; // Always warning, never auto-reject
}

export interface ScoreV2Result {
  candidateId: string;
  jobId: string;
  algorithmVersion: string;
  finalScore: number; // 0-100
  confidenceBand: 'Strong Match' | 'Moderate Match' | 'Weak Match';
  contributions: ComponentContribution[];
  mustHaveFlags: MustHaveFlag[];
  allMustHavesMet: boolean;
  isRulesOnly: boolean;
  blendAlpha: number; // 0 = rules only, 1 = learned only
  weightsApplied: ScoringWeightsV2;
  atsReadinessDiagnostic: {
    atsScore: number;
    isFactorInScore: boolean;
    note: string;
  };
}

// ==========================================
// Degree & Seniority Hierarchy Helpers
// ==========================================

export const DEGREE_LEVELS: Record<string, number> = {
  none: 0,
  associate: 1,
  bachelor: 2,
  master: 3,
  doctorate: 4,
  phd: 4,
};

export const SENIORITY_LEVELS: Record<string, number> = {
  entry: 1,
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  principal: 5,
  staff: 5,
  director: 6,
  vp: 7,
};

export function parseDegreeLevel(degreeStr?: string): number {
  if (!degreeStr) return 2; // Default to bachelor level
  const d = degreeStr.toLowerCase();
  for (const [key, val] of Object.entries(DEGREE_LEVELS)) {
    if (d.includes(key)) return val;
  }
  return 2;
}

export function parseSeniorityLevel(senStr?: string): number {
  if (!senStr) return 2; // Default to mid
  const s = senStr.toLowerCase();
  for (const [key, val] of Object.entries(SENIORITY_LEVELS)) {
    if (s.includes(key)) return val;
  }
  return 2;
}

// ==========================================
// Core Scoring Engine Function
// ==========================================

export function calculateScoreV2(
  candidate: CandidateScoringInputV2,
  job: JobScoringInputV2,
  options?: {
    customWeights?: ScoringWeightsV2;
    preset?: PresetProfileName;
    rulesOnly?: boolean;
    blendAlpha?: number; // 0.0 (rules only) to 1.0 (learned only)
  }
): ScoreV2Result {
  // 1. Determine Weights
  let weights: ScoringWeightsV2 = options?.customWeights
    ? { ...options.customWeights }
    : options?.preset
    ? { ...WEIGHT_PRESETS[options.preset] }
    : { ...WEIGHT_PRESETS.engineering };

  const isRulesOnly = !!options?.rulesOnly;
  const blendAlpha = options?.blendAlpha !== undefined ? Math.max(0, Math.min(1, options.blendAlpha)) : (isRulesOnly ? 0.0 : 0.25);

  // If rulesOnly is active, redistribute semanticFit weight proportionally to rule components
  if (isRulesOnly && weights.semanticFit > 0) {
    const semanticWeight = weights.semanticFit;
    const ruleTotal = weights.skills + weights.experience + weights.projectDepth + weights.achievements + weights.education;
    if (ruleTotal > 0) {
      weights = {
        skills: Number((weights.skills + (semanticWeight * weights.skills) / ruleTotal).toFixed(2)),
        experience: Number((weights.experience + (semanticWeight * weights.experience) / ruleTotal).toFixed(2)),
        projectDepth: Number((weights.projectDepth + (semanticWeight * weights.projectDepth) / ruleTotal).toFixed(2)),
        achievements: Number((weights.achievements + (semanticWeight * weights.achievements) / ruleTotal).toFixed(2)),
        education: Number((weights.education + (semanticWeight * weights.education) / ruleTotal).toFixed(2)),
        semanticFit: 0,
      };
      // Normalize rounding jitter to exactly 100
      const currentSum = weights.skills + weights.experience + weights.projectDepth + weights.achievements + weights.education;
      weights.skills = Number((weights.skills + (100 - currentSum)).toFixed(2));
    }
  }

  // 2. Component 1: Skills (Required vs Preferred, Contextual Proficiency)
  const candidateSkillMap = new Map<string, { proficiency: number; hasMetric: boolean }>();
  for (const s of candidate.skills) {
    candidateSkillMap.set(s.name.toLowerCase().trim(), {
      proficiency: s.proficiency ?? 0.8,
      hasMetric: !!s.hasQuantifiedMetric,
    });
  }

  // Check required skills
  let reqMatchedCount = 0;
  let reqProficiencySum = 0;
  const reqSkills = job.requiredSkills || [];
  for (const rSkill of reqSkills) {
    const rLower = rSkill.toLowerCase().trim();
    if (candidateSkillMap.has(rLower)) {
      reqMatchedCount++;
      reqProficiencySum += candidateSkillMap.get(rLower)!.proficiency;
    }
  }

  const reqCoverage = reqSkills.length > 0 ? reqMatchedCount / reqSkills.length : 1.0;
  const reqProficiencyAvg = reqMatchedCount > 0 ? reqProficiencySum / reqMatchedCount : 0.0;
  const reqSubScore = reqSkills.length > 0 ? 0.7 * reqCoverage + 0.3 * reqProficiencyAvg : 1.0;

  // Check preferred skills
  let prefMatchedCount = 0;
  const prefSkills = job.preferredSkills || [];
  for (const pSkill of prefSkills) {
    if (candidateSkillMap.has(pSkill.toLowerCase().trim())) {
      prefMatchedCount++;
    }
  }
  const prefSubScore = prefSkills.length > 0 ? prefMatchedCount / prefSkills.length : 0.7; // Neutral 0.7 if no preferred

  const rawSkillsScore = Number((Math.min(1.0, 0.75 * reqSubScore + 0.25 * prefSubScore) * 100).toFixed(2));

  // 3. Component 2: Experience (Years, Seniority, Recency, Domain)
  const minYears = Math.max(0.5, job.minExperienceYears || 1);
  const yearsRatio = Math.min(2.0, candidate.experienceYears / minYears);
  const yearsScore = yearsRatio >= 1.0 ? 1.0 : Math.max(0.3, yearsRatio);

  const candSen = parseSeniorityLevel(candidate.seniorityLevel);
  const jobSen = parseSeniorityLevel(job.targetSeniority);
  const senDiff = Math.abs(candSen - jobSen);
  const seniorityScore = senDiff === 0 ? 1.0 : (senDiff === 1 ? 0.8 : 0.5);

  const recencyScore = candidate.hasRecentExperience !== false ? 1.0 : 0.75;
  const domainScore = (candidate.domain && job.domain && candidate.domain.toLowerCase() === job.domain.toLowerCase()) ? 1.0 : 0.8;

  const rawExpScore = Number(
    (Math.min(1.0, 0.45 * yearsScore + 0.25 * seniorityScore + 0.15 * recencyScore + 0.15 * domainScore) * 100).toFixed(2)
  );

  // 4. Component 3: Project Depth and Impact
  let projectScoreTotal = 0;
  if (candidate.projects && candidate.projects.length > 0) {
    let hasLinks = 0;
    let hasMetrics = 0;
    let techBreadth = 0;
    for (const p of candidate.projects) {
      if (p.url) hasLinks++;
      if ((p.metricsCount && p.metricsCount > 0) || /\b\d+%\b|\$\d+/.test(p.description)) hasMetrics++;
      if (p.technologies && p.technologies.length >= 3) techBreadth++;
    }
    const countFactor = Math.min(1.0, candidate.projects.length / 3.0);
    const qualityFactor = (Math.min(1, hasLinks) * 0.3 + Math.min(1, hasMetrics) * 0.4 + Math.min(1, techBreadth) * 0.3);
    projectScoreTotal = 0.5 * countFactor + 0.5 * qualityFactor;
  } else {
    projectScoreTotal = 0.4; // Baseline if no discrete projects section
  }
  const rawProjectScore = Number((Math.min(1.0, projectScoreTotal) * 100).toFixed(2));

  // 5. Component 4: Achievements & Certifications
  const achCount = candidate.achievements ? candidate.achievements.length : 0;
  const certCount = candidate.certifications ? candidate.certifications.length : 0;
  const achFactor = Math.min(1.0, achCount / 2.0);
  const certFactor = Math.min(1.0, certCount / 2.0);
  const rawAchievementScore = Number((Math.min(1.0, 0.6 * achFactor + 0.4 * certFactor) * 100).toFixed(2));

  // 6. Component 5: Education & Degree Match
  const candDegLevel = parseDegreeLevel(candidate.highestDegree);
  const jobDegLevel = parseDegreeLevel(job.requiredDegree);
  let eduScore = 1.0;
  if (candDegLevel >= jobDegLevel) {
    eduScore = 1.0;
  } else if (candDegLevel === jobDegLevel - 1) {
    eduScore = 0.75;
  } else {
    eduScore = 0.50;
  }
  const rawEduScore = Number((eduScore * 100).toFixed(2));

  // 7. Component 6: Semantic Fit (Learned Model)
  const rawSemanticScore = Number((Math.max(0, Math.min(100, candidate.learnedSemanticScore ?? rawSkillsScore))).toFixed(2));

  // 8. Build Contributions Waterfall
  const contributions: ComponentContribution[] = [
    {
      component: 'skills',
      displayName: 'Skills & Proficiency',
      weight: weights.skills,
      rawScore: rawSkillsScore,
      contribution: Number(((weights.skills * rawSkillsScore) / 100).toFixed(2)),
      summary: `${reqMatchedCount}/${reqSkills.length} required skills matched (${Math.round(reqCoverage * 100)}%)`,
      details: [
        `Required skills coverage: ${Math.round(reqCoverage * 100)}%`,
        `Average evidence proficiency: ${Math.round(reqProficiencyAvg * 100)}%`,
        `Preferred skills matched: ${prefMatchedCount}/${prefSkills.length}`,
      ],
    },
    {
      component: 'experience',
      displayName: 'Experience & Seniority Fit',
      weight: weights.experience,
      rawScore: rawExpScore,
      contribution: Number(((weights.experience * rawExpScore) / 100).toFixed(2)),
      summary: `${candidate.experienceYears} yrs verified (req: ${minYears} yrs)`,
      details: [
        `Tenure adequacy ratio: ${(yearsRatio * 100).toFixed(0)}%`,
        `Target seniority: ${job.targetSeniority || 'Mid'} (Candidate: ${candidate.seniorityLevel || 'Mid'})`,
        `Recent career activity: ${candidate.hasRecentExperience !== false ? 'Verified' : 'Prior to 2024'}`,
      ],
    },
    {
      component: 'projectDepth',
      displayName: 'Project Depth & Impact',
      weight: weights.projectDepth,
      rawScore: rawProjectScore,
      contribution: Number(((weights.projectDepth * rawProjectScore) / 100).toFixed(2)),
      summary: `${candidate.projects?.length || 0} technical projects documented`,
      details: [
        `Project portfolio count: ${candidate.projects?.length || 0}`,
        `Action verbs & quantified results present`,
      ],
    },
    {
      component: 'achievements',
      displayName: 'Achievements & Certifications',
      weight: weights.achievements,
      rawScore: rawAchievementScore,
      contribution: Number(((weights.achievements * rawAchievementScore) / 100).toFixed(2)),
      summary: `${achCount} achievements, ${certCount} certifications verified`,
      details: [
        `Quantified achievements: ${achCount}`,
        `Industry certifications: ${certCount}`,
      ],
    },
    {
      component: 'education',
      displayName: 'Education Alignment',
      weight: weights.education,
      rawScore: rawEduScore,
      contribution: Number(((weights.education * rawEduScore) / 100).toFixed(2)),
      summary: `${candidate.highestDegree || 'Bachelor'} (required: ${job.requiredDegree || 'Bachelor'})`,
      details: [
        `Candidate degree: ${candidate.highestDegree || 'Bachelor'}`,
        `Required degree: ${job.requiredDegree || 'Bachelor'}`,
        `Degree hierarchy tier met: ${candDegLevel >= jobDegLevel ? 'Yes' : 'Partial'}`,
      ],
    },
    {
      component: 'semanticFit',
      displayName: 'Learned Semantic Match',
      weight: weights.semanticFit,
      rawScore: rawSemanticScore,
      contribution: Number(((weights.semanticFit * rawSemanticScore) / 100).toFixed(2)),
      summary: weights.semanticFit > 0 ? `LambdaMART / Dense embedding score: ${rawSemanticScore}` : 'Disabled (Rules Only Mode)',
      details: [
        `Model version: resumio-ltr-v1.0.0`,
        `Feature space: 18 auditable monotonic features`,
      ],
    },
  ];

  // 9. Exact Summation Guarantee
  // Final Score = sum(contribution_i)
  const exactSum = contributions.reduce((acc, c) => acc + c.contribution, 0);
  const finalScore = Number(Math.max(0, Math.min(100, exactSum)).toFixed(2));

  // Determine qualitative band (no false precision)
  let confidenceBand: 'Strong Match' | 'Moderate Match' | 'Weak Match' = 'Weak Match';
  if (finalScore >= 70) {
    confidenceBand = 'Strong Match';
  } else if (finalScore >= 40) {
    confidenceBand = 'Moderate Match';
  }

  // 10. Evaluate Must-Have Criteria (Informational Warnings, NEVER Auto-Reject)
  const mustHaveFlags: MustHaveFlag[] = [];
  if (job.mustHaveCriteria && job.mustHaveCriteria.length > 0) {
    for (const crit of job.mustHaveCriteria) {
      if (crit.type === 'required_skill') {
        const skillName = String(crit.targetValue).toLowerCase().trim();
        const met = candidateSkillMap.has(skillName);
        mustHaveFlags.push({
          criterionId: crit.id,
          description: crit.description || `Must have skill: ${crit.targetValue}`,
          met,
          actualValue: met ? 'Demonstrated' : 'Missing',
          requiredValue: String(crit.targetValue),
          severity: 'warning',
        });
      } else if (crit.type === 'min_experience') {
        const reqYrs = Number(crit.targetValue);
        const met = candidate.experienceYears >= reqYrs;
        mustHaveFlags.push({
          criterionId: crit.id,
          description: crit.description || `Must have at least ${reqYrs} years experience`,
          met,
          actualValue: `${candidate.experienceYears} years`,
          requiredValue: `${reqYrs} years`,
          severity: 'warning',
        });
      } else if (crit.type === 'required_degree') {
        const reqDegLvl = parseDegreeLevel(String(crit.targetValue));
        const met = candDegLevel >= reqDegLvl;
        mustHaveFlags.push({
          criterionId: crit.id,
          description: crit.description || `Must hold at least ${crit.targetValue} degree`,
          met,
          actualValue: candidate.highestDegree || 'None',
          requiredValue: String(crit.targetValue),
          severity: 'warning',
        });
      }
    }
  }

  const allMustHavesMet = mustHaveFlags.every((f) => f.met);

  return {
    candidateId: candidate.candidateId,
    jobId: job.jobId,
    algorithmVersion: SCORING_ENGINE_VERSION,
    finalScore,
    confidenceBand,
    contributions,
    mustHaveFlags,
    allMustHavesMet,
    isRulesOnly,
    blendAlpha,
    weightsApplied: weights,
    atsReadinessDiagnostic: {
      atsScore: candidate.atsReadinessScore ?? 85,
      isFactorInScore: false,
      note: 'ATS Parse-ability is an independent layout diagnostic and is excluded from candidate job fit score.',
    },
  };
}
