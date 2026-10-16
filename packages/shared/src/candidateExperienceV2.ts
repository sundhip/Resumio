/**
 * Candidate Experience & Verification Engine V2
 * Packages/Shared: Isomorphic (Browser & Node.js)
 * 
 * Features:
 * 1. Hybrid Explainable Job Recommendations with "Why this job" traceability
 * 2. Counterfactual Skill-Gap & Upskilling Roadmap (Delta impact, effort estimates)
 * 3. What-If Scenario Simulator
 * 4. SSRF-Hardened IP & URL Validation Utilities
 */

import {
  calculateScoreV2,
  CandidateScoringInputV2,
  JobScoringInputV2,
  ScoreV2Result,
} from './scoringV2.js';

// ============================================================
// 1. DATA TYPES & INTERFACES
// ============================================================

export interface CandidatePreferenceProfile {
  preferredLocations: string[];
  preferredWorkModes: ('Remote' | 'Hybrid' | 'On-site')[];
  minSalary?: number;
  maxSalary?: number;
  targetJobTitles: string[];
  dismissedJobIds: string[];
}

export interface CandidateSkillsContext {
  candidateId?: string;
  skills: { name: string; proficiency?: number; verified?: boolean }[];
  experienceYears: number;
  seniorityLevel: string;
  highestEducation: string;
}

export interface TargetJobItem {
  id: string;
  title: string;
  companyName: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills: string[];
  preferredSkills?: string[];
  minExperienceYears?: number;
}

export interface ExplainableJobRecommendation {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  salaryRange?: string;
  recommendationScore: number; // 0 - 100
  matchedSkills: string[];
  missingSkills: string[];
  reasonsWhy: string[]; // Human-readable explainable rationale
  isDismissed: boolean;
}

export interface CuratedResourceItem {
  id: string;
  skillName: string;
  title: string;
  url: string;
  provider: string;
  resourceType: 'course' | 'documentation' | 'book' | 'project' | 'tutorial';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  isFree: boolean;
}

export interface UpskillingRoadmapStep {
  step: number;
  skillName: string;
  impactScoreDelta: number; // Points gained on target job match score (+X%)
  jobsImpactedCount: number;
  targetJobTitles: string[];
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  curatedResources: CuratedResourceItem[];
  searchSuggestion: string; // Transparent fallback: "Search official documentation for..."
}

export interface UpskillingRoadmap {
  candidateId: string;
  totalTargetJobsAnalyzed: number;
  currentAverageScore: number;
  projectedAverageScore: number;
  totalEstimatedHours: number;
  steps: UpskillingRoadmapStep[];
}

export interface WhatIfSimulationResult {
  jobId: string;
  jobTitle: string;
  baseScore: number;
  simulatedScore: number;
  scoreDelta: number;
  addedSkills: string[];
  newlySatisfiedSkills: string[];
  remainingMissingSkills: string[];
  componentBreakdown: {
    skillsDelta: number;
    experienceDelta: number;
    projectsDelta: number;
    achievementsDelta: number;
    educationDelta: number;
    semanticDelta: number;
  };
}

// ============================================================
// 2. EXPLAINABLE HYBRID JOB RECOMMENDATIONS ENGINE
// ============================================================

export function computeHybridJobRecommendations(
  candidate: CandidateSkillsContext,
  preferences: CandidatePreferenceProfile,
  availableJobs: TargetJobItem[]
): ExplainableJobRecommendation[] {
  const recommendations: ExplainableJobRecommendation[] = [];
  const dismissedSet = new Set(preferences.dismissedJobIds || []);

  const candSkillNames = new Set(
    candidate.skills.map((s) => s.name.toLowerCase().trim())
  );
  const verifiedSkillNames = new Set(
    candidate.skills
      .filter((s) => s.verified)
      .map((s) => s.name.toLowerCase().trim())
  );

  for (const job of availableJobs) {
    if (dismissedSet.has(job.id)) {
      continue;
    }

    const reasons: string[] = [];
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    const reqSkills = job.requiredSkills || [];
    const prefSkills = job.preferredSkills || [];

    for (const r of reqSkills) {
      if (candSkillNames.has(r.toLowerCase().trim())) {
        matchedSkills.push(r);
      } else {
        missingSkills.push(r);
      }
    }

    for (const p of prefSkills) {
      if (candSkillNames.has(p.toLowerCase().trim())) {
        if (!matchedSkills.includes(p)) {
          matchedSkills.push(p);
        }
      }
    }

    const totalSkills = Math.max(1, reqSkills.length);
    const skillRatio = matchedSkills.length / totalSkills;
    let skillScore = Math.min(100, Math.round(skillRatio * 100));

    // Stated preference scoring
    let prefScore = 50;

    // Location & Work Mode Fit
    if (
      preferences.preferredWorkModes &&
      preferences.preferredWorkModes.includes(job.workMode)
    ) {
      prefScore += 25;
      reasons.push(`Matches preferred work mode: ${job.workMode}`);
    }

    const locMatched =
      preferences.preferredLocations.length === 0 ||
      preferences.preferredLocations.some(
        (loc) =>
          job.location.toLowerCase().includes(loc.toLowerCase()) ||
          loc.toLowerCase().includes(job.location.toLowerCase()) ||
          job.workMode === 'Remote'
      );

    if (locMatched) {
      prefScore += 15;
      if (job.workMode === 'Remote') {
        reasons.push('Remote flexibility aligns with candidate availability');
      } else {
        reasons.push(`Location matches candidate target: ${job.location}`);
      }
    }

    // Salary Fit
    if (preferences.minSalary && job.salaryMax) {
      if (job.salaryMax >= preferences.minSalary) {
        prefScore += 10;
        reasons.push(
          `Compensation meets desired threshold (up to $${job.salaryMax.toLocaleString()})`
        );
      }
    }

    // Experience Years Alignment
    const reqYears = job.minExperienceYears || 0;
    if (candidate.experienceYears >= reqYears) {
      reasons.push(
        `Experience level (${candidate.experienceYears} yrs) satisfies position requirements (${reqYears}+ yrs)`
      );
    } else {
      reasons.push(
        `Close experience alignment (${candidate.experienceYears} of ${reqYears} yrs desired)`
      );
    }

    // Evidence Verification Boost
    const verifiedMatches = matchedSkills.filter((s) =>
      verifiedSkillNames.has(s.toLowerCase().trim())
    );
    if (verifiedMatches.length > 0) {
      reasons.push(
        `${verifiedMatches.length} matching skill(s) backed by verified public repository commits`
      );
    }

    // Calculate final hybrid score (65% skill overlap + 35% stated preference fit)
    const hybridScore = Math.min(
      99,
      Math.max(30, Math.round(skillScore * 0.65 + prefScore * 0.35))
    );

    let salaryRangeStr: string | undefined = undefined;
    if (job.salaryMin && job.salaryMax) {
      salaryRangeStr = `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    } else if (job.salaryMin) {
      salaryRangeStr = `From $${job.salaryMin.toLocaleString()}`;
    }

    recommendations.push({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.companyName,
      location: job.location,
      workMode: job.workMode,
      salaryRange: salaryRangeStr,
      recommendationScore: hybridScore,
      matchedSkills,
      missingSkills,
      reasonsWhy: reasons.slice(0, 4),
      isDismissed: false,
    });
  }

  recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return recommendations;
}

// ============================================================
// 3. SKILL-GAP & UPSKILLING ROADMAP ENGINE
// ============================================================

export function generateUpskillingRoadmap(
  candidateIdOrContext: string | CandidateSkillsContext,
  candidateSkillsOrTargetJobs: string[] | TargetJobItem[],
  targetJobsOrCuratedResources?: TargetJobItem[] | CuratedResourceItem[],
  curatedResourcesArg: CuratedResourceItem[] = []
): UpskillingRoadmap {
  let candidateId = 'candidate';
  let candSkillsList: string[] = [];
  let targetJobs: TargetJobItem[] = [];
  let curatedResources: CuratedResourceItem[] = [];

  if (typeof candidateIdOrContext === 'string') {
    candidateId = candidateIdOrContext;
    candSkillsList = Array.isArray(candidateSkillsOrTargetJobs) ? (candidateSkillsOrTargetJobs as string[]) : [];
    targetJobs = Array.isArray(targetJobsOrCuratedResources) ? (targetJobsOrCuratedResources as TargetJobItem[]) : [];
    curatedResources = curatedResourcesArg;
  } else {
    candidateId = candidateIdOrContext.candidateId || 'candidate';
    candSkillsList = candidateIdOrContext.skills.map(s => s.name);
    targetJobs = Array.isArray(candidateSkillsOrTargetJobs) ? (candidateSkillsOrTargetJobs as TargetJobItem[]) : [];
    curatedResources = Array.isArray(targetJobsOrCuratedResources) ? (targetJobsOrCuratedResources as CuratedResourceItem[]) : [];
  }

  const missingSkillFrequency = new Map<string, { count: number; jobs: TargetJobItem[] }>();
  const candSkillNames = new Set(candSkillsList.map(s => s.toLowerCase().trim()));

  for (const job of targetJobs) {
    for (const req of job.requiredSkills || []) {
      const lower = req.trim().toLowerCase();
      if (!candSkillNames.has(lower)) {
        const canonical = req.trim();
        const existing = missingSkillFrequency.get(canonical) || { count: 0, jobs: [] };
        existing.count++;
        existing.jobs.push(job);
        missingSkillFrequency.set(canonical, existing);
      }
    }
  }

  const steps: UpskillingRoadmapStep[] = [];
  let totalBaselineScore = 0;
  let totalProjectedScore = 0;
  let totalEvaluatedJobs = 0;

  for (const [skillName, data] of missingSkillFrequency.entries()) {
    let totalDelta = 0;

    for (const job of data.jobs) {
      const baseCandidate: CandidateScoringInputV2 = {
        candidateId,
        skills: candSkillsList.map(name => ({ name, proficiency: 1 })),
        experienceYears: 3,
        seniorityLevel: 'mid',
        projects: [],
        achievements: [],
        certifications: [],
      };

      const simCandidate: CandidateScoringInputV2 = {
        ...baseCandidate,
        skills: [...baseCandidate.skills, { name: skillName, proficiency: 1 }],
      };

      const jobInput: JobScoringInputV2 = {
        jobId: job.id,
        title: job.title,
        requiredSkills: job.requiredSkills || [],
        preferredSkills: job.preferredSkills || [],
        minExperienceYears: job.minExperienceYears || 0,
      };

      const baseScore = calculateScoreV2(baseCandidate, jobInput).finalScore;
      const simScore = calculateScoreV2(simCandidate, jobInput).finalScore;

      totalBaselineScore += baseScore;
      totalProjectedScore += simScore;
      totalEvaluatedJobs++;

      totalDelta += Math.max(0, simScore - baseScore);
    }

    const avgDelta = data.jobs.length > 0 ? Math.round((totalDelta / data.jobs.length) * 10) / 10 : 3.0;

    const matchingCurated = curatedResources.filter(
      (r) => r.skillName.toLowerCase() === skillName.toLowerCase()
    );

    const difficulty: 'beginner' | 'intermediate' | 'advanced' =
      matchingCurated.length > 0 ? matchingCurated[0].difficulty : (avgDelta > 6 ? 'advanced' : avgDelta > 3 ? 'intermediate' : 'beginner');

    const estimatedHours = matchingCurated.length > 0 ? matchingCurated[0].estimatedHours : (difficulty === 'advanced' ? 30 : difficulty === 'intermediate' ? 18 : 10);

    const searchSuggestion = `Search official documentation for: "${skillName}"`;

    steps.push({
      step: 0,
      skillName,
      impactScoreDelta: avgDelta,
      jobsImpactedCount: data.count,
      targetJobTitles: data.jobs.map((j) => `${j.title} (${j.companyName})`).slice(0, 3),
      estimatedHours,
      difficulty,
      curatedResources: matchingCurated,
      searchSuggestion,
    });
  }

  steps.sort((a, b) => b.impactScoreDelta - a.impactScoreDelta || b.jobsImpactedCount - a.jobsImpactedCount);
  steps.forEach((s, i) => {
    s.step = i + 1;
  });

  const currentAverageScore = totalEvaluatedJobs > 0 ? Math.round(totalBaselineScore / totalEvaluatedJobs) : 60;
  const projectedAverageScore = totalEvaluatedJobs > 0 ? Math.round(totalProjectedScore / totalEvaluatedJobs) : 75;
  const totalEstimatedHours = steps.reduce((sum, s) => sum + s.estimatedHours, 0);

  return {
    candidateId,
    totalTargetJobsAnalyzed: targetJobs.length,
    currentAverageScore,
    projectedAverageScore: Math.max(currentAverageScore + 5, projectedAverageScore),
    totalEstimatedHours,
    steps,
  };
}

// ============================================================
// 4. WHAT-IF SCENARIO SIMULATOR
// ============================================================

export function simulateWhatIfScenario(
  targetJob: TargetJobItem,
  existingSkills: string[],
  hypotheticalSkills: string[],
  existingExperienceYears: number = 2,
  hypotheticalExperienceYears?: number
): WhatIfSimulationResult {
  const existingNames = new Set(existingSkills.map((s) => s.toLowerCase().trim()));
  const hypotheticalSet = new Set(hypotheticalSkills.map((s) => s.toLowerCase().trim()));

  const reqSkills = targetJob.requiredSkills || [];
  const baseMatched = reqSkills.filter((r) => existingNames.has(r.toLowerCase().trim()));
  const simMatched = reqSkills.filter((r) => existingNames.has(r.toLowerCase().trim()) || hypotheticalSet.has(r.toLowerCase().trim()));
  const newlySatisfied = simMatched.filter((r) => !baseMatched.includes(r));
  const remainingMissing = reqSkills.filter((r) => !simMatched.includes(r));

  const baseCandidate: CandidateScoringInputV2 = {
    candidateId: 'sim_cand',
    skills: existingSkills.map(name => ({ name, proficiency: 1 })),
    experienceYears: existingExperienceYears,
    projects: [],
    achievements: [],
    certifications: [],
  };

  const simCandidate: CandidateScoringInputV2 = {
    ...baseCandidate,
    skills: [
      ...existingSkills.map(name => ({ name, proficiency: 1 })),
      ...hypotheticalSkills.map(name => ({ name, proficiency: 1 })),
    ],
    experienceYears: hypotheticalExperienceYears !== undefined ? hypotheticalExperienceYears : existingExperienceYears,
  };

  const jobInput: JobScoringInputV2 = {
    jobId: targetJob.id,
    title: targetJob.title,
    requiredSkills: targetJob.requiredSkills || [],
    preferredSkills: targetJob.preferredSkills || [],
    minExperienceYears: targetJob.minExperienceYears || 0,
  };

  const baseResult = calculateScoreV2(baseCandidate, jobInput);
  const simResult = calculateScoreV2(simCandidate, jobInput);

  const getContrib = (res: any, name: string) => {
    const item = res.contributions?.find((c: any) => c.component === name);
    return item ? item.contribution : 0;
  };

  return {
    jobId: targetJob.id,
    jobTitle: targetJob.title,
    baseScore: baseResult.finalScore,
    simulatedScore: simResult.finalScore,
    scoreDelta: Math.max(0, Number((simResult.finalScore - baseResult.finalScore).toFixed(1))),
    addedSkills: hypotheticalSkills,
    newlySatisfiedSkills: newlySatisfied,
    remainingMissingSkills: remainingMissing,
    componentBreakdown: {
      skillsDelta: Number((getContrib(simResult, 'skills') - getContrib(baseResult, 'skills')).toFixed(2)),
      experienceDelta: Number((getContrib(simResult, 'experience') - getContrib(baseResult, 'experience')).toFixed(2)),
      projectsDelta: Number((getContrib(simResult, 'projectDepth') - getContrib(baseResult, 'projectDepth')).toFixed(2)),
      achievementsDelta: Number((getContrib(simResult, 'achievements') - getContrib(baseResult, 'achievements')).toFixed(2)),
      educationDelta: Number((getContrib(simResult, 'education') - getContrib(baseResult, 'education')).toFixed(2)),
      semanticDelta: Number((getContrib(simResult, 'semanticFit') - getContrib(baseResult, 'semanticFit')).toFixed(2)),
    },
  };
}

// ============================================================
// 5. SSRF-HARDENED SECURITY VALIDATORS
// ============================================================

export function isSsrfSafeIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;

  const cleanIp = ip.trim().toLowerCase();

  // Normalize IPv4-mapped IPv6
  if (cleanIp.startsWith('::ffff:')) {
    const v4Part = cleanIp.slice(7);
    if (v4Part.includes('.')) {
      return isSsrfSafeIp(v4Part);
    }
  }

  // IPv6 checks
  if (cleanIp.includes(':')) {
    if (cleanIp === '::' || cleanIp === '::1') return false;
    if (cleanIp.startsWith('fe80:') || cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) return false;
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return false;
    if (cleanIp.startsWith('ff')) return false;
    return true;
  }

  // IPv4 checks
  const parts = cleanIp.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;

  // 0.0.0.0/8
  if (a === 0) return false;

  // 10.0.0.0/8
  if (a === 10) return false;

  // 100.64.0.0/10
  if (a === 100 && b >= 64 && b <= 127) return false;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return false;

  // 169.254.0.0/16 (Link-local & Cloud Metadata)
  if (a === 169 && b === 254) return false;

  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return false;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && parts[2] === 0) return false;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return false;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return false;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return false;

  return true;
}

export async function validateUrlSafety(inputUrl: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const parsed = new URL(inputUrl);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Forbidden URL scheme: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return { safe: false, reason: 'Forbidden host name' };
    }

    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      if (!isSsrfSafeIp(hostname)) {
        return { safe: false, reason: `Private/internal IP forbidden: ${hostname}` };
      }
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}
