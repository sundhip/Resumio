/**
 * Resumio Phase 8: Candidate Comparison Matrix V2
 * Multi-candidate evaluation (2-5 candidates) with component breakdown,
 * unified skill matrix, experience timeline alignment, red-flag chips,
 * blind-mode redaction, and CSV / printable HTML export.
 */

export interface CandidateComparisonItem {
  id: string; // application id
  candidateId: string;
  fullName: string;
  isRedacted?: boolean;
  location: string;
  headline?: string;
  currentRole?: string;
  experienceYears: number;
  highestEducation: string;
  matchScore: number;
  components: {
    skills: number;
    experience: number;
    projects: number;
    achievements: number;
    education: number;
    semantic: number;
  };
  skillsMatched: { name: string; proficiency: number; evidence?: string }[];
  skillsMissing: string[];
  skillsBonus: string[];
  experienceTimeline: {
    role: string;
    company: string;
    durationYears: number;
    startDate: string;
    endDate: string;
  }[];
  redFlags: { type: string; severity: 'low' | 'medium' | 'high'; message: string }[];
  summary: string;
}

export interface CandidateComparisonMatrix {
  jobId: string;
  jobTitle: string;
  comparedAt: string;
  isBlindMode: boolean;
  candidates: CandidateComparisonItem[];
  allRequiredSkills: string[];
  allPreferredSkills: string[];
  bestSkillCandidateId: string;
  bestExpCandidateId: string;
  bestOverallCandidateId: string;
}

/**
 * Normalizes and redacts candidates when blind screening mode is active
 */
export function applyBlindModeToComparison(
  candidates: CandidateComparisonItem[],
  isBlindMode: boolean
): CandidateComparisonItem[] {
  if (!isBlindMode) return candidates;

  return candidates.map((cand, idx) => ({
    ...cand,
    isRedacted: true,
    fullName: `Candidate ${String.fromCharCode(65 + idx)} [Redacted]`,
    location: 'Location Redacted (EEOC Compliant)',
    headline: cand.headline ? cand.headline.replace(/\b(at|for)\s+[A-Za-z0-9\s]+/gi, 'at [Tier-1 Enterprise]') : undefined,
    experienceTimeline: cand.experienceTimeline.map((item, itemIdx) => ({
      ...item,
      company: `Enterprise Organization #${itemIdx + 1} [Redacted]`,
    })),
  }));
}

/**
 * Builds the comprehensive comparison matrix for 2-5 candidates
 */
export function buildComparisonMatrix(
  job: { id: string; title: string; requiredSkills: string[]; preferredSkills: string[] },
  candidates: CandidateComparisonItem[],
  isBlindMode: boolean = false
): CandidateComparisonMatrix {
  if (candidates.length < 2 || candidates.length > 5) {
    throw new Error('Comparison requires between 2 and 5 candidates.');
  }

  const processed = applyBlindModeToComparison(candidates, isBlindMode);

  // Identify top performers in each dimension
  let bestOverallId = processed[0].id;
  let maxOverall = processed[0].matchScore;

  let bestSkillId = processed[0].id;
  let maxSkill = processed[0].components.skills;

  let bestExpId = processed[0].id;
  let maxExp = processed[0].components.experience;

  for (const cand of processed) {
    if (cand.matchScore > maxOverall) {
      maxOverall = cand.matchScore;
      bestOverallId = cand.id;
    }
    if (cand.components.skills > maxSkill) {
      maxSkill = cand.components.skills;
      bestSkillId = cand.id;
    }
    if (cand.components.experience > maxExp) {
      maxExp = cand.components.experience;
      bestExpId = cand.id;
    }
  }

  return {
    jobId: job.id,
    jobTitle: job.title,
    comparedAt: new Date().toISOString(),
    isBlindMode,
    candidates: processed,
    allRequiredSkills: job.requiredSkills || [],
    allPreferredSkills: job.preferredSkills || [],
    bestSkillCandidateId: bestSkillId,
    bestExpCandidateId: bestExpId,
    bestOverallCandidateId: bestOverallId,
  };
}

/**
 * Exports comparison matrix to CSV format
 */
export function exportComparisonToCsv(matrix: CandidateComparisonMatrix): string {
  const rows: string[][] = [];

  // Header row
  const header = ['Metric / Dimension', ...matrix.candidates.map((c) => c.fullName)];
  rows.push(header);

  // Core metrics
  rows.push(['Match Score', ...matrix.candidates.map((c) => `${c.matchScore}%`)]);
  rows.push(['Skills Score', ...matrix.candidates.map((c) => `${c.components.skills}%`)]);
  rows.push(['Experience Score', ...matrix.candidates.map((c) => `${c.components.experience}%`)]);
  rows.push(['Projects Score', ...matrix.candidates.map((c) => `${c.components.projects}%`)]);
  rows.push(['Education Score', ...matrix.candidates.map((c) => `${c.components.education}%`)]);
  rows.push(['Semantic Score', ...matrix.candidates.map((c) => `${c.components.semantic}%`)]);
  rows.push(['Total Experience', ...matrix.candidates.map((c) => `${c.experienceYears} Years`)]);
  rows.push(['Highest Education', ...matrix.candidates.map((c) => c.highestEducation)]);
  rows.push(['Red Flags Count', ...matrix.candidates.map((c) => `${c.redFlags.length}`)]);

  // Skills Coverage Rows
  rows.push(['--- REQUIRED SKILLS ---', ...matrix.candidates.map(() => '')]);
  for (const skill of matrix.allRequiredSkills) {
    const skillRow = [
      skill,
      ...matrix.candidates.map((c) => {
        const matched = c.skillsMatched.find((s) => s.name.toLowerCase() === skill.toLowerCase());
        return matched ? `Matched (${Math.round(matched.proficiency * 100)}%)` : 'MISSING';
      }),
    ];
    rows.push(skillRow);
  }

  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Generates self-contained printable HTML report for the candidate comparison matrix
 */
export function exportComparisonToHtml(matrix: CandidateComparisonMatrix): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Candidate Comparison Matrix - ${matrix.jobTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #1e293b; padding: 32px; background: #fff; }
    h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
    .subtitle { font-size: 14px; color: #64748b; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; font-size: 13px; }
    th { background: #f8fafc; font-weight: 600; color: #334155; }
    .score-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 700; background: #dbeafe; color: #1e40af; }
    .best-badge { background: #dcfce7; color: #15803d; border-radius: 4px; padding: 2px 6px; font-size: 11px; margin-left: 6px; }
    .flag-chip { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .footer { font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>Resumio Candidate Comparison Matrix</h1>
  <div class="subtitle">Target Job: <strong>${matrix.jobTitle}</strong> | Generated: ${new Date(matrix.comparedAt).toLocaleString()} ${matrix.isBlindMode ? '| [EEOC Blind Mode Active]' : ''}</div>

  <table>
    <thead>
      <tr>
        <th>Evaluation Dimension</th>
        ${matrix.candidates.map((c) => `<th>${c.fullName} ${c.id === matrix.bestOverallCandidateId ? '<span class="best-badge">Top Fit</span>' : ''}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Composite Fit Score</strong></td>
        ${matrix.candidates.map((c) => `<td><span class="score-badge">${c.matchScore}%</span></td>`).join('')}
      </tr>
      <tr>
        <td>Skills Contribution</td>
        ${matrix.candidates.map((c) => `<td>${c.components.skills} pts</td>`).join('')}
      </tr>
      <tr>
        <td>Experience Contribution</td>
        ${matrix.candidates.map((c) => `<td>${c.components.experience} pts</td>`).join('')}
      </tr>
      <tr>
        <td>Project Depth Contribution</td>
        ${matrix.candidates.map((c) => `<td>${c.components.projects} pts</td>`).join('')}
      </tr>
      <tr>
        <td>Education Contribution</td>
        ${matrix.candidates.map((c) => `<td>${c.components.education} pts</td>`).join('')}
      </tr>
      <tr>
        <td>Experience Duration</td>
        ${matrix.candidates.map((c) => `<td>${c.experienceYears} Years</td>`).join('')}
      </tr>
      <tr>
        <td>Red Flags Detected</td>
        ${matrix.candidates.map((c) => `<td>${c.redFlags.length > 0 ? `<span class="flag-chip">${c.redFlags.length} flags</span>` : 'None'}</td>`).join('')}
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Audited by Resumio Decision-Support Engine V2. Human makes every hiring decision. No automated rejection.
  </div>
</body>
</html>`;
}
