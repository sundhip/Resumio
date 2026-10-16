/**
 * Resumio Red-Flag and Gap Detection Engine
 * Shared between client and server.
 *
 * Fairness-First Design Principles:
 * 1. Employment gaps are detected purely neutrally for conversational context.
 *    STRICT RULE: Score penalty is ALWAYS 0. Zero point deduction, zero ranking impact.
 * 2. Red flags highlight verifiable discrepancies (dates, overlapping full-time roles,
 *    seniority mismatches, unevidenced skills, duplicate bullets).
 * 3. Every flag provides an objective evidence snippet and a professional,
 *    constructive, suggested recruiter interview question.
 */

import { CandidateScoringInputV2 } from './scoringV2.js';

export type RedFlagSeverity = 'info' | 'warning' | 'discrepancy';

export type RedFlagCategory =
  | 'chronology'
  | 'overlap'
  | 'seniority_inflation'
  | 'unevidenced_skill'
  | 'keyword_stuffing'
  | 'duplicate_content'
  | 'employment_gap';

export interface RedFlagItem {
  id: string;
  category: RedFlagCategory;
  severity: RedFlagSeverity;
  title: string;
  description: string;
  evidenceSnippet?: string;
  suggestedRecruiterQuestion: string;
  scorePenalty: 0; // Strictly 0 - Red flags inform human review; they do NOT deduct algorithmic score points!
}

export interface WorkExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startDate: string; // YYYY-MM or YYYY
  endDate: string;   // YYYY-MM, YYYY, or "present"
  isRemote?: boolean;
  isFullTime?: boolean;
  bulletPoints?: string[];
}

export interface EmploymentGapInfo {
  gapMonths: number;
  startDate: string;
  endDate: string;
  priorCompany: string;
  nextCompany: string;
  suggestedRecruiterQuestion: string;
  scorePenalty: 0; // Strictly zero points deduction
}

export interface RedFlagAnalysisResult {
  candidateId: string;
  flags: RedFlagItem[];
  employmentGaps: EmploymentGapInfo[];
  discrepancyCount: number;
  warningCount: number;
  infoCount: number;
  summary: string;
  fairnessGuarantee: string;
}

// ==========================================
// Date Parsing Utilities
// ==========================================

function parseDateToMonths(dateStr: string): number | null {
  if (!dateStr) return null;
  const s = dateStr.trim().toLowerCase();
  if (s === 'present' || s === 'current' || s === 'now') {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }

  // Check formats: YYYY-MM or YYYY
  const ymMatch = s.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (ymMatch) {
    const yr = parseInt(ymMatch[1], 10);
    const mo = parseInt(ymMatch[2], 10) - 1;
    return yr * 12 + mo;
  }

  const yMatch = s.match(/^(\d{4})$/);
  if (yMatch) {
    const yr = parseInt(yMatch[1], 10);
    return yr * 12; // Jan of year
  }

  return null;
}

// ==========================================
// Core Red Flag & Gap Detection
// ==========================================

export function detectRedFlagsAndGaps(
  candidate: CandidateScoringInputV2,
  workExperiences?: WorkExperienceEntry[],
  hiddenTextDetected?: boolean
): RedFlagAnalysisResult {
  const flags: RedFlagItem[] = [];
  const employmentGaps: EmploymentGapInfo[] = [];

  // 1. Keyword-stuffing / Hidden-text flags (from Phase 3 parser)
  if (hiddenTextDetected) {
    flags.push({
      id: 'rf_hidden_text',
      category: 'keyword_stuffing',
      severity: 'discrepancy',
      title: 'Hidden or Microscopic Text Detected',
      description: 'The document parser detected off-canvas, transparent, or sub-point text often used to manipulate keyword search.',
      evidenceSnippet: 'Microscopic or zero-alpha font blocks identified in page stream.',
      suggestedRecruiterQuestion: 'Could you walk us through the specific tools and libraries you used most hands-on in your last position?',
      scorePenalty: 0,
    });
  }

  // 2. Seniority Claim vs Duration
  const totalYears = candidate.experienceYears || 0;
  const claimedSeniority = (candidate.seniorityLevel || '').toLowerCase();
  if (claimedSeniority === 'lead' || claimedSeniority === 'principal' || claimedSeniority === 'director' || claimedSeniority === 'vp') {
    if (totalYears < 3) {
      flags.push({
        id: 'rf_seniority_mismatch',
        category: 'seniority_inflation',
        severity: 'warning',
        title: `Rapid Seniority Trajectory (${candidate.seniorityLevel} with ${totalYears}y experience)`,
        description: `Candidate lists a ${candidate.seniorityLevel} title with less than 3 years of total recorded career duration.`,
        evidenceSnippet: `Seniority: ${candidate.seniorityLevel}, Total Experience: ${totalYears} year(s).`,
        suggestedRecruiterQuestion: `You quickly stepped into a ${candidate.seniorityLevel} role early in your career. What was the scope of your team and technical ownership there?`,
        scorePenalty: 0,
      });
    }
  }

  // 3. Unevidenced Skill Claims
  // Check if candidate listed skills that have 0 evidence and 0 mentions in projects or experience
  const rawTextLower = (candidate.rawText || '').toLowerCase();
  for (const s of candidate.skills) {
    const sLower = s.name.trim().toLowerCase();
    const inProjects = candidate.projects.some(
      (p) =>
        p.name.toLowerCase().includes(sLower) ||
        p.description.toLowerCase().includes(sLower) ||
        (p.technologies || []).some((t) => t.toLowerCase().includes(sLower))
    );
    const inRaw = rawTextLower.includes(sLower);

    if (!inProjects && !inRaw && (s.evidenceCount ?? 0) === 0) {
      flags.push({
        id: `rf_unevidenced_${s.name}`,
        category: 'unevidenced_skill',
        severity: 'info',
        title: `Unevidenced Skill: ${s.name}`,
        description: `"${s.name}" is listed as a skill claim but does not appear in referenced project milestones or work achievements.`,
        evidenceSnippet: `Claim: ${s.name} (no contextual experience anchors).`,
        suggestedRecruiterQuestion: `You have ${s.name} listed in your skills; could you tell us about a project where you used it and what challenges you solved?`,
        scorePenalty: 0,
      });
    }
  }

  // 4. Duplicate Bullet Content
  const seenBullets = new Map<string, string>();
  for (const p of candidate.projects) {
    const normalizedDesc = p.description.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
    if (normalizedDesc.length > 30) {
      if (seenBullets.has(normalizedDesc)) {
        flags.push({
          id: `rf_duplicate_project_${p.name}`,
          category: 'duplicate_content',
          severity: 'warning',
          title: 'Duplicate Project Description Content',
          description: `Identical bullet point content was used in multiple distinct projects ("${p.name}" and "${seenBullets.get(normalizedDesc)}").`,
          evidenceSnippet: p.description.slice(0, 100) + '...',
          suggestedRecruiterQuestion: `Could you clarify how your role in "${p.name}" differed from "${seenBullets.get(normalizedDesc)}"?`,
          scorePenalty: 0,
        });
      } else {
        seenBullets.set(normalizedDesc, p.name);
      }
    }
  }

  // 5. Work Experience Chronology, Overlaps, and Neutral Gaps
  if (workExperiences && workExperiences.length > 0) {
    // Sort experiences by startDate descending
    const parsedExp = workExperiences
      .map((w, idx) => ({
        ...w,
        idx,
        startMonths: parseDateToMonths(w.startDate),
        endMonths: parseDateToMonths(w.endDate),
      }))
      .filter((w) => w.startMonths !== null && w.endMonths !== null);

    const nowMonths = new Date().getFullYear() * 12 + new Date().getMonth();

    for (const exp of parsedExp) {
      // Inconsistency: end date before start date
      if (exp.endMonths! < exp.startMonths!) {
        flags.push({
          id: `rf_chrono_inverted_${exp.company}`,
          category: 'chronology',
          severity: 'discrepancy',
          title: `Chronological Inversion at ${exp.company}`,
          description: `End date (${exp.endDate}) is recorded before start date (${exp.startDate}).`,
          evidenceSnippet: `${exp.title} at ${exp.company}: ${exp.startDate} – ${exp.endDate}`,
          suggestedRecruiterQuestion: `There appears to be a date typo in your tenure at ${exp.company}. Could you verify the start and end dates?`,
          scorePenalty: 0,
        });
      }

      // Inconsistency: start date in the future
      if (exp.startMonths! > nowMonths + 1) {
        flags.push({
          id: `rf_future_date_${exp.company}`,
          category: 'chronology',
          severity: 'warning',
          title: `Future Date Recorded for ${exp.company}`,
          description: `The start date (${exp.startDate}) is in the future.`,
          evidenceSnippet: `${exp.title} at ${exp.company}: ${exp.startDate}`,
          suggestedRecruiterQuestion: `The tenure at ${exp.company} lists a future date. What was the intended timeline?`,
          scorePenalty: 0,
        });
      }
    }

    // Overlapping full-time roles in different physical locations
    for (let i = 0; i < parsedExp.length; i++) {
      for (let j = i + 1; j < parsedExp.length; j++) {
        const a = parsedExp[i];
        const b = parsedExp[j];

        // Check date overlap
        const overlapStart = Math.max(a.startMonths!, b.startMonths!);
        const overlapEnd = Math.min(a.endMonths!, b.endMonths!);
        const overlapMonths = overlapEnd - overlapStart;

        if (overlapMonths >= 4) { // 4+ months overlap
          const aFullTime = a.isFullTime ?? true;
          const bFullTime = b.isFullTime ?? true;
          const neitherRemote = !(a.isRemote || b.isRemote);
          const differentLocations = a.location && b.location && a.location.toLowerCase() !== b.location.toLowerCase();

          if (aFullTime && bFullTime && neitherRemote && differentLocations) {
            flags.push({
              id: `rf_overlap_${a.company}_${b.company}`,
              category: 'overlap',
              severity: 'discrepancy',
              title: `Simultaneous Full-Time Roles (${a.company} and ${b.company})`,
              description: `Overlapping tenure of ~${overlapMonths} months across different physical locations (${a.location} vs ${b.location}).`,
              evidenceSnippet: `${a.company} (${a.startDate} - ${a.endDate}, ${a.location}) overlaps with ${b.company} (${b.startDate} - ${b.endDate}, ${b.location})`,
              suggestedRecruiterQuestion: `I noticed your resume lists full-time tenures at both ${a.company} and ${b.company} during the same period. Could you share how you balanced those roles?`,
              scorePenalty: 0,
            });
          }
        }
      }
    }

    // Neutral Employment Gaps (>= 6 months)
    // Sort ascending by startMonths to find gaps between consecutive tenures
    const sortedAsc = [...parsedExp].sort((a, b) => a.startMonths! - b.startMonths!);
    for (let i = 0; i < sortedAsc.length - 1; i++) {
      const current = sortedAsc[i];
      const next = sortedAsc[i + 1];

      const gapMonths = next.startMonths! - current.endMonths!;
      if (gapMonths >= 6) {
        employmentGaps.push({
          gapMonths,
          startDate: current.endDate,
          endDate: next.startDate,
          priorCompany: current.company,
          nextCompany: next.company,
          suggestedRecruiterQuestion: `Between your time at ${current.company} and ${next.company}, what projects or personal learning did you pursue?`,
          scorePenalty: 0,
        });

        flags.push({
          id: `rf_gap_${current.company}_${next.company}`,
          category: 'employment_gap',
          severity: 'info',
          title: `Career Interval (${gapMonths} months)`,
          description: `A ${gapMonths}-month gap between ${current.company} (${current.endDate}) and ${next.company} (${next.startDate}). Note: Never penalized in candidate scoring.`,
          evidenceSnippet: `${current.endDate} to ${next.startDate}`,
          suggestedRecruiterQuestion: `Between your work at ${current.company} and ${next.company}, what projects, upskilling, or endeavors were you engaged in?`,
          scorePenalty: 0,
        });
      }
    }
  }

  const discrepancyCount = flags.filter((f) => f.severity === 'discrepancy').length;
  const warningCount = flags.filter((f) => f.severity === 'warning').length;
  const infoCount = flags.filter((f) => f.severity === 'info').length;

  const summary = discrepancyCount > 0
    ? `${discrepancyCount} discrepancy item(s) found that require recruiter clarification.`
    : warningCount > 0
    ? `${warningCount} warning item(s) flagged for review during interviews.`
    : 'No critical discrepancies or unevidenced claims identified.';

  const fairnessGuarantee = 'Resumio Fairness Guarantee: Red-flag items and employment gaps are informational tools for human recruiters. Zero algorithmic score penalties are applied.';

  return {
    candidateId: candidate.candidateId,
    flags,
    employmentGaps,
    discrepancyCount,
    warningCount,
    infoCount,
    summary,
    fairnessGuarantee,
  };
}
