/**
 * Match Heatmap Engine
 * Highlights resume spans that drove match scores:
 * - Green (strong_evidence): Directly fulfills a job requirement with strong evidence/metrics
 * - Amber (weak_evidence): Fulfills or mentions a requirement with weak or unquantified evidence
 * - Neutral: Contextual text not directly mapped to core requirements
 */

export interface HeatmapSpan {
  id: string;
  text: string;
  category: 'strong_evidence' | 'weak_evidence' | 'neutral';
  relatedRequirement?: string;
  scoreContributionWeight?: number;
  explanation?: string;
  startIndex: number;
  endIndex: number;
}

export interface MatchHeatmapResult {
  overallHeatRatio: number; // percentage of resume text that provides evidence (0 - 100)
  strongEvidenceCount: number;
  weakEvidenceCount: number;
  neutralSpansCount: number;
  spans: HeatmapSpan[];
  legend: {
    category: 'strong_evidence' | 'weak_evidence' | 'neutral';
    label: string;
    hexColor: string;
    description: string;
  }[];
}

export interface HeatmapMatchedSkill {
  name: string;
  proficiency: number;
  evidenceSnippet?: string;
  isRequired?: boolean;
  scoreWeight?: number;
}

/**
 * Computes resume heatmap spans by analyzing text against job requirements,
 * matched skills, and verified evidence snippets.
 */
export function generateResumeMatchHeatmap(
  rawResumeText: string,
  matchedSkills: HeatmapMatchedSkill[] = [],
  requiredKeywords: string[] = []
): MatchHeatmapResult {
  if (!rawResumeText || rawResumeText.trim().length === 0) {
    return {
      overallHeatRatio: 0,
      strongEvidenceCount: 0,
      weakEvidenceCount: 0,
      neutralSpansCount: 0,
      spans: [],
      legend: getHeatmapLegend(),
    };
  }

  // Split resume text by paragraphs or lines for granular span targeting
  const lines = rawResumeText.split('\n');
  const rawSpans: HeatmapSpan[] = [];
  let currentOffset = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineStart = currentOffset;
    const lineEnd = currentOffset + line.length;

    currentOffset = lineEnd + 1; // +1 for the newline character

    if (trimmed.length < 3) {
      continue;
    }

    // Check if line matches any required skills or evidence
    const matchingSkill = matchedSkills.find(s =>
      new RegExp(`\\b${escapeRegExp(s.name)}\\b`, 'i').test(trimmed) ||
      (s.evidenceSnippet && trimmed.toLowerCase().includes(s.evidenceSnippet.toLowerCase().slice(0, 30)))
    );

    const hasMetric = /\b(?:\d+[%kKmM]?|\$\d+|\d+\s*(?:years?|months?|x|X))\b/.test(trimmed);
    const hasRequiredKeyword = requiredKeywords.some(req =>
      new RegExp(`\\b${escapeRegExp(req)}\\b`, 'i').test(trimmed)
    );

    if (matchingSkill) {
      const isStrong = (matchingSkill.proficiency >= 0.75 || hasMetric) && (matchingSkill.isRequired || hasRequiredKeyword);
      rawSpans.push({
        id: `span_${idx}_${matchingSkill.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        text: line,
        category: isStrong ? 'strong_evidence' : 'weak_evidence',
        relatedRequirement: matchingSkill.name,
        scoreContributionWeight: matchingSkill.scoreWeight || (isStrong ? 0.85 : 0.45),
        explanation: isStrong
          ? `Strongly supports requirement "${matchingSkill.name}" with evidenced proficiency and impact.`
          : `Mentions "${matchingSkill.name}" with partial or unquantified evidence.`,
        startIndex: lineStart,
        endIndex: lineEnd,
      });
    } else if (hasRequiredKeyword) {
      rawSpans.push({
        id: `span_${idx}_req`,
        text: line,
        category: 'weak_evidence',
        relatedRequirement: 'Required Keyword',
        scoreContributionWeight: 0.35,
        explanation: 'Mentions a targeted job keyword without deep verified implementation detail.',
        startIndex: lineStart,
        endIndex: lineEnd,
      });
    } else {
      rawSpans.push({
        id: `span_${idx}_neutral`,
        text: line,
        category: 'neutral',
        startIndex: lineStart,
        endIndex: lineEnd,
      });
    }
  }

  const strongCount = rawSpans.filter(s => s.category === 'strong_evidence').length;
  const weakCount = rawSpans.filter(s => s.category === 'weak_evidence').length;
  const neutralCount = rawSpans.filter(s => s.category === 'neutral').length;

  const totalEvidencedLines = strongCount + weakCount;
  const overallHeatRatio = rawSpans.length > 0
    ? Number(((totalEvidencedLines / rawSpans.length) * 100).toFixed(1))
    : 0;

  return {
    overallHeatRatio,
    strongEvidenceCount: strongCount,
    weakEvidenceCount: weakCount,
    neutralSpansCount: neutralCount,
    spans: rawSpans,
    legend: getHeatmapLegend(),
  };
}

export function getHeatmapLegend() {
  return [
    {
      category: 'strong_evidence' as const,
      label: 'Strong Requirement Evidence',
      hexColor: '#10b981', // Emerald 500
      description: 'Evidenced skill directly matching job prerequisites with quantified outcomes or high proficiency.',
    },
    {
      category: 'weak_evidence' as const,
      label: 'Weak / Partial Evidence',
      hexColor: '#f59e0b', // Amber 500
      description: 'Skill or preferred keyword mentioned without sufficient depth, metrics, or recent project context.',
    },
    {
      category: 'neutral' as const,
      label: 'General Background',
      hexColor: '#94a3b8', // Slate 400
      description: 'Supporting background, educational history, or narrative text not contributing to core technical match.',
    },
  ];
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
