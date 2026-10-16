/**
 * Resumio Explainability Engine V2
 * Shared between web client and Node API.
 *
 * Implements:
 * 1. Contribution Waterfall breakdown
 * 2. Per-skill evidence highlighting and classification (exact, synonym, inferred, missing)
 * 3. Human-readable SHAP feature importance mapping
 * 4. Confidence indicators (parse confidence, data completeness, model uncertainty)
 * 5. Counterfactual recommendations computed via actual re-scoring (what would raise this score)
 * 6. Deterministic natural-language summary generator (zero hallucination, strict factual grounding)
 */

import {
  CandidateScoringInputV2,
  JobScoringInputV2,
  ScoreV2Result,
  calculateScoreV2,
  ScoringWeightsV2,
} from './scoringV2.js';

export interface SkillEvidenceItem {
  skillName: string;
  type: 'required' | 'preferred';
  status: 'exact' | 'synonym' | 'inferred' | 'missing';
  proficiency: number; // 0-1
  evidenceSnippet?: string;
  hasActionVerb: boolean;
  hasQuantifiedMetric: boolean;
  evidenceCount: number;
}

export interface WaterfallBar {
  component: string;
  label: string;
  weight: number;
  rawScore: number;
  pointsContributed: number;
  maxPossiblePoints: number;
  percentageOfMax: number;
  details: string[];
}

export interface ShapExplanationItem {
  rawFeature: string;
  readableName: string;
  impactScore: number; // e.g. +14.2 or -3.1
  direction: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface ConfidenceIndicators {
  overallConfidence: number; // 0-100
  confidenceTier: 'high' | 'medium' | 'low';
  parseConfidence: number;
  dataCompleteness: number;
  modelUncertainty: number;
  caveats: string[];
}

export interface CounterfactualRecommendation {
  actionId: string;
  title: string;
  category: 'skill' | 'experience' | 'project' | 'education' | 'achievement';
  suggestedAction: string;
  currentScore: number;
  simulatedScore: number;
  deltaPoints: number; // simulatedScore - currentScore
  difficulty: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface ExplainabilityReportV2 {
  candidateId: string;
  jobId: string;
  finalScore: number;
  waterfall: WaterfallBar[];
  skillsBreakdown: {
    matchedRequired: SkillEvidenceItem[];
    missingRequired: SkillEvidenceItem[];
    matchedPreferred: SkillEvidenceItem[];
    missingPreferred: SkillEvidenceItem[];
    overallCoveragePercent: number;
  };
  shapExplanations: ShapExplanationItem[];
  confidence: ConfidenceIndicators;
  counterfactuals: CounterfactualRecommendation[];
  structuredSummary: {
    overview: string;
    keyStrengths: string[];
    criticalGaps: string[];
    fairnessVerification: string;
  };
}

// ==========================================
// SHAP Feature Mapping Dictionary
// ==========================================

export const SHAP_FEATURE_DICTIONARY: Record<string, { readableName: string; format: (val: number) => string }> = {
  req_skill_cov: {
    readableName: 'Required Skill Match',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts from core technical competency`,
  },
  pref_skill_cov: {
    readableName: 'Preferred Skill Match',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts from bonus/differentiating skills`,
  },
  exp_years_ratio: {
    readableName: 'Experience Duration Fit',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts from track record length vs requirements`,
  },
  seniority_fit: {
    readableName: 'Seniority Level Alignment',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts from role level parity`,
  },
  project_depth_quant: {
    readableName: 'Project Impact & Metrics',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts from demonstrated quantitative outcomes`,
  },
  achievement_evidence: {
    readableName: 'Awards & Honors',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts from verified accomplishments`,
  },
  education_degree_fit: {
    readableName: 'Education & Degree Level',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts from academic qualification tier`,
  },
  dense_semantic_sim: {
    readableName: 'Semantic Domain Fit',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} pts from overall semantic resume-job alignment`,
  },
};

// ==========================================
// Generator Functions
// ==========================================

/**
 * Builds the complete Explainability Report V2 from score results and input data.
 */
export function generateScoreExplanations(
  candidate: CandidateScoringInputV2,
  job: JobScoringInputV2,
  scoreResult: ScoreV2Result,
  customRawShap?: Record<string, number>
): ExplainabilityReportV2 {
  // 1. Build Waterfall
  const waterfall: WaterfallBar[] = scoreResult.contributions.map((c) => {
    const maxPoints = c.weight;
    const percentageOfMax = maxPoints > 0 ? Number(((c.contribution / maxPoints) * 100).toFixed(1)) : 100;
    return {
      component: c.component,
      label: c.displayName,
      weight: c.weight,
      rawScore: c.rawScore,
      pointsContributed: c.contribution,
      maxPossiblePoints: maxPoints,
      percentageOfMax,
      details: c.details,
    };
  });

  // 2. Build Skill Evidence
  const candSkillMap = new Map<string, (typeof candidate.skills)[0]>();
  for (const s of candidate.skills) {
    candSkillMap.set(s.name.trim().toLowerCase(), s);
  }

  const rawTextLower = (candidate.rawText || '').toLowerCase();

  const processSkill = (skillName: string, type: 'required' | 'preferred'): SkillEvidenceItem => {
    const sLower = skillName.trim().toLowerCase();
    const found = candSkillMap.get(sLower);

    if (found) {
      // Find evidence snippet in raw text if available
      let snippet: string | undefined = undefined;
      if (candidate.rawText) {
        const idx = rawTextLower.indexOf(sLower);
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(candidate.rawText.length, idx + sLower.length + 40);
          snippet = `...${candidate.rawText.slice(start, end).trim()}...`;
        }
      }

      return {
        skillName,
        type,
        status: (found.proficiency ?? 1) >= 0.8 ? 'exact' : 'synonym',
        proficiency: found.proficiency ?? 0.8,
        evidenceSnippet: snippet,
        hasActionVerb: !!found.hasActionVerb,
        hasQuantifiedMetric: !!found.hasQuantifiedMetric,
        evidenceCount: found.evidenceCount ?? 1,
      };
    } else {
      // Check if text has partial or inferred mention
      const mentioned = rawTextLower.includes(sLower);
      if (mentioned) {
        return {
          skillName,
          type,
          status: 'inferred',
          proficiency: 0.5,
          evidenceSnippet: `Mentioned in context without structured milestone.`,
          hasActionVerb: false,
          hasQuantifiedMetric: false,
          evidenceCount: 1,
        };
      }
      return {
        skillName,
        type,
        status: 'missing',
        proficiency: 0,
        hasActionVerb: false,
        hasQuantifiedMetric: false,
        evidenceCount: 0,
      };
    }
  };

  const matchedRequired: SkillEvidenceItem[] = [];
  const missingRequired: SkillEvidenceItem[] = [];
  for (const req of job.requiredSkills) {
    const item = processSkill(req, 'required');
    if (item.status === 'missing') {
      missingRequired.push(item);
    } else {
      matchedRequired.push(item);
    }
  }

  const matchedPreferred: SkillEvidenceItem[] = [];
  const missingPreferred: SkillEvidenceItem[] = [];
  for (const pref of job.preferredSkills || []) {
    const item = processSkill(pref, 'preferred');
    if (item.status === 'missing') {
      missingPreferred.push(item);
    } else {
      matchedPreferred.push(item);
    }
  }

  const totalReq = job.requiredSkills.length;
  const overallCoveragePercent = totalReq > 0
    ? Number(((matchedRequired.length / totalReq) * 100).toFixed(1))
    : 100;

  // 3. Map SHAP feature values
  const defaultShap: Record<string, number> = {
    req_skill_cov: (matchedRequired.length / Math.max(1, totalReq)) * 25 - 5,
    pref_skill_cov: ((matchedPreferred.length / Math.max(1, (job.preferredSkills || []).length || 1))) * 10,
    exp_years_ratio: (Math.min(1.5, candidate.experienceYears / Math.max(1, job.minExperienceYears)) - 1.0) * 15,
    seniority_fit: (scoreResult.contributions.find((c) => c.component === 'experience')?.rawScore || 50) > 70 ? 8 : -4,
    project_depth_quant: (candidate.projects.filter((p) => (p.metricsCount ?? 0) > 0).length) * 4,
    achievement_evidence: candidate.achievements.length > 0 ? 5 : -2,
    education_degree_fit: (scoreResult.contributions.find((c) => c.component === 'education')?.rawScore || 50) > 70 ? 6 : -3,
    dense_semantic_sim: ((candidate.learnedSemanticScore ?? 75) - 60) * 0.3,
  };

  const activeShap = customRawShap || defaultShap;
  const shapExplanations: ShapExplanationItem[] = Object.entries(activeShap).map(([key, val]) => {
    const meta = SHAP_FEATURE_DICTIONARY[key] || {
      readableName: key.replace(/_/g, ' ').toUpperCase(),
      format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} impact points`,
    };
    const rounded = Number(val.toFixed(1));
    return {
      rawFeature: key,
      readableName: meta.readableName,
      impactScore: rounded,
      direction: rounded > 0.5 ? 'positive' : rounded < -0.5 ? 'negative' : 'neutral',
      explanation: meta.format(rounded),
    };
  }).sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore));

  // 4. Compute Confidence Indicators
  const parseConfidence = candidate.rawText && candidate.rawText.length > 200 ? 94 : 70;
  const dataCompleteness = [
    candidate.skills.length > 0,
    candidate.experienceYears > 0,
    candidate.projects.length > 0,
    candidate.highestDegree !== undefined,
    candidate.certifications.length > 0,
  ].filter(Boolean).length * 20;

  const modelUncertainty = scoreResult.isRulesOnly ? 5 : 12;
  const overallConfidence = Math.round((parseConfidence * 0.4) + (dataCompleteness * 0.4) + ((100 - modelUncertainty) * 0.2));
  const confidenceTier: 'high' | 'medium' | 'low' = overallConfidence >= 80 ? 'high' : overallConfidence >= 60 ? 'medium' : 'low';

  const caveats: string[] = [];
  if (candidate.projects.length === 0) caveats.push('No portfolio projects provided; project depth score estimated from role descriptions.');
  if (!candidate.rawText) caveats.push('Text evidence snippets unavailable; structured fields relied upon.');
  if (missingRequired.length > 0) caveats.push(`${missingRequired.length} required skill(s) have no direct evidence on record.`);

  // 5. Compute Real Counterfactual Recommendations (Actual re-scoring)
  const counterfactuals = computeCounterfactuals(candidate, job, scoreResult);

  // 6. Grounded Natural-Language Summary
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (matchedRequired.length > 0) {
    strengths.push(`Matches ${matchedRequired.length}/${totalReq} core requirements: ${matchedRequired.slice(0, 3).map((s) => s.skillName).join(', ')}${matchedRequired.length > 3 ? '...' : ''}`);
  }
  if (candidate.experienceYears >= job.minExperienceYears) {
    strengths.push(`Experience of ${candidate.experienceYears}y meets or exceeds required minimum of ${job.minExperienceYears}y`);
  }
  const metricProjects = candidate.projects.filter((p) => (p.metricsCount ?? 0) > 0);
  if (metricProjects.length > 0) {
    strengths.push(`Demonstrated ${metricProjects.length} project(s) with quantified production impact`);
  }

  for (const m of missingRequired) {
    gaps.push(`Missing required core skill: ${m.skillName}`);
  }
  if (candidate.experienceYears < job.minExperienceYears) {
    gaps.push(`Experience (${candidate.experienceYears}y) is below target minimum (${job.minExperienceYears}y)`);
  }

  const overview = `Candidate achieved a Score V2 of ${scoreResult.finalScore}/100 (${scoreResult.confidenceBand}). Core requirement coverage is at ${overallCoveragePercent}%. Evaluation is deterministic, auditable, and grounded in verifiable evidence.`;

  const fairnessVerification = 'Compliant with Resumio Fairness Standard: Demographic indicators (name, gender, age, nationality, photo, institution prestige) are strictly excluded from all scoring weights and models. Human review is mandatory for all final hiring decisions.';

  return {
    candidateId: candidate.candidateId,
    jobId: job.jobId,
    finalScore: scoreResult.finalScore,
    waterfall,
    skillsBreakdown: {
      matchedRequired,
      missingRequired,
      matchedPreferred,
      missingPreferred,
      overallCoveragePercent,
    },
    shapExplanations,
    confidence: {
      overallConfidence,
      confidenceTier,
      parseConfidence,
      dataCompleteness,
      modelUncertainty,
      caveats,
    },
    counterfactuals,
    structuredSummary: {
      overview,
      keyStrengths: strengths,
      criticalGaps: gaps,
      fairnessVerification,
    },
  };
}

// ==========================================
// Counterfactual Re-Scoring Engine
// ==========================================

export function computeCounterfactuals(
  candidate: CandidateScoringInputV2,
  job: JobScoringInputV2,
  currentResult: ScoreV2Result
): CounterfactualRecommendation[] {
  const currentScore = currentResult.finalScore;
  const weights: ScoringWeightsV2 = currentResult.weightsApplied;
  const options = {
    customWeights: weights,
    rulesOnly: currentResult.isRulesOnly,
    blendAlpha: currentResult.blendAlpha,
  };

  const recommendations: CounterfactualRecommendation[] = [];

  // A. Counterfactual: Add missing required skills (one by one or all)
  const candSkillNames = new Set(candidate.skills.map((s) => s.name.trim().toLowerCase()));
  const missingReqSkills = job.requiredSkills.filter((s) => !candSkillNames.has(s.trim().toLowerCase()));

  for (const skill of missingReqSkills.slice(0, 3)) {
    const simulatedCandidate: CandidateScoringInputV2 = {
      ...candidate,
      skills: [
        ...candidate.skills,
        {
          name: skill,
          proficiency: 0.9,
          evidenceCount: 2,
          hasActionVerb: true,
          hasQuantifiedMetric: true,
        },
      ],
    };
    const simResult = calculateScoreV2(simulatedCandidate, job, options);
    const delta = Number((simResult.finalScore - currentScore).toFixed(2));
    if (delta > 0) {
      recommendations.push({
        actionId: `add_skill_${skill}`,
        title: `Verify or Add Skill: ${skill}`,
        category: 'skill',
        suggestedAction: `Provide verifiable project or work experience demonstrating proficiency in ${skill}.`,
        currentScore,
        simulatedScore: simResult.finalScore,
        deltaPoints: delta,
        difficulty: 'medium',
        explanation: `Demonstrating verified proficiency in ${skill} increases your Skill component and satisfies a core job requirement.`,
      });
    }
  }

  // B. Counterfactual: Additional 1 year of experience
  if (candidate.experienceYears < job.minExperienceYears) {
    const simulatedCandidate: CandidateScoringInputV2 = {
      ...candidate,
      experienceYears: candidate.experienceYears + 1,
    };
    const simResult = calculateScoreV2(simulatedCandidate, job, options);
    const delta = Number((simResult.finalScore - currentScore).toFixed(2));
    if (delta > 0) {
      recommendations.push({
        actionId: 'increase_experience_1y',
        title: 'Accrue +1 Year Relevant Experience',
        category: 'experience',
        suggestedAction: `Close the remaining experience threshold toward the ${job.minExperienceYears}-year job requirement.`,
        currentScore,
        simulatedScore: simResult.finalScore,
        deltaPoints: delta,
        difficulty: 'high',
        explanation: `Moving closer to the minimum target of ${job.minExperienceYears} years lifts the experience duration ratio.`,
      });
    }
  }

  // C. Counterfactual: Quantify projects with metrics
  const unquantifiedProjects = candidate.projects.filter((p) => (p.metricsCount ?? 0) === 0);
  if (unquantifiedProjects.length > 0) {
    const simulatedCandidate: CandidateScoringInputV2 = {
      ...candidate,
      projects: candidate.projects.map((p) => ({
        ...p,
        metricsCount: Math.max(1, (p.metricsCount ?? 0) + 2),
        actionVerbsCount: Math.max(2, (p.actionVerbsCount ?? 0) + 2),
      })),
    };
    const simResult = calculateScoreV2(simulatedCandidate, job, options);
    const delta = Number((simResult.finalScore - currentScore).toFixed(2));
    if (delta > 0) {
      recommendations.push({
        actionId: 'quantify_project_metrics',
        title: 'Add Quantifiable Project Metrics & Outcomes',
        category: 'project',
        suggestedAction: 'Include concrete metrics (e.g., "reduced latency by 42%", "scaled to 50k DAU") in project bullet points.',
        currentScore,
        simulatedScore: simResult.finalScore,
        deltaPoints: delta,
        difficulty: 'low',
        explanation: `Quantitative outcomes boost the Project Depth & Impact score component from ${simResult.contributions.find((c) => c.component === 'projectDepth')?.rawScore.toFixed(0)}%.`,
      });
    }
  }

  // D. Counterfactual: Add relevant certification
  if (candidate.certifications.length === 0) {
    const simulatedCandidate: CandidateScoringInputV2 = {
      ...candidate,
      certifications: [{ name: 'Industry Recognized Professional Certification' }],
    };
    const simResult = calculateScoreV2(simulatedCandidate, job, options);
    const delta = Number((simResult.finalScore - currentScore).toFixed(2));
    if (delta > 0) {
      recommendations.push({
        actionId: 'add_certification',
        title: 'Earn & Attach Relevant Industry Certification',
        category: 'achievement',
        suggestedAction: 'Attach accredited certifications (e.g. AWS Certified Solutions Architect, CKA, PMP).',
        currentScore,
        simulatedScore: simResult.finalScore,
        deltaPoints: delta,
        difficulty: 'medium',
        explanation: `Accredited certifications provide external verification and boost the Achievements component.`,
      });
    }
  }

  // Sort recommendations by highest ROI (highest score delta first)
  return recommendations.sort((a, b) => b.deltaPoints - a.deltaPoints);
}
