/**
 * Matching Architecture Configuration & Model Versioning
 * Formula Version: 2.0.0 (Explainable Multi-Component Model with TF-IDF Semantic Relevance)
 */

export interface ScoringWeights {
  requiredSkills: number;  // Default: 45
  preferredSkills: number; // Default: 15
  experience: number;      // Default: 20
  qualification: number;   // Default: 10
  semanticRelevance: number; // Default: 10
}

export interface MatchingModelConfig {
  version: string;
  weights: ScoringWeights;
  maxScore: number;
}

export const MATCHING_MODEL_CONFIG: MatchingModelConfig = {
  version: '2.0.0',
  weights: {
    requiredSkills: 45,
    preferredSkills: 15,
    experience: 20,
    qualification: 10,
    semanticRelevance: 10,
  },
  maxScore: 100,
};

/**
 * Validates that scoring weights are non-negative and sum to 100.
 */
export function validateScoringWeights(weights: ScoringWeights): boolean {
  if (!weights || typeof weights !== 'object') return false;
  const values = Object.values(weights);
  if (values.some((v) => typeof v !== 'number' || v < 0 || isNaN(v))) return false;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.01;
}

/**
 * Computes deterministic cosine similarity between two text snippets using TF-IDF token frequency vectors.
 * Returns normalized score between 0 and 100.
 */
export function computeLexicalCosineSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 50; // Neutral baseline when one text is empty

  const tokenize = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s+#]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length === 0 || tokensB.length === 0) return 50;

  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();
  const allVocab = new Set<string>();

  for (const t of tokensA) {
    freqA.set(t, (freqA.get(t) || 0) + 1);
    allVocab.add(t);
  }
  for (const t of tokensB) {
    freqB.set(t, (freqB.get(t) || 0) + 1);
    allVocab.add(t);
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const term of allVocab) {
    const valA = freqA.get(term) || 0;
    const valB = freqB.get(term) || 0;
    dotProduct += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  if (denominator === 0) return 50;

  const cosine = dotProduct / denominator;
  // Scale [0, 1] to [0, 100], bounded
  return Math.min(100, Math.max(0, Math.round(cosine * 100 * 10) / 10));
}

/**
 * Computes BM25 Okapi lexical term score between document text and query terms
 * BM25 is the industry standard for exact matching of acronyms, tools, and technical terms.
 */
export function computeBM25Score(docText: string, queryTokens: string[], avgDocLength: number = 250): number {
  if (!docText || !queryTokens || queryTokens.length === 0) return 50;

  const cleanDoc = docText.toLowerCase();
  const k1 = 1.2;
  const b = 0.75;
  const docTokens = cleanDoc.split(/\s+/).filter((t) => t.length > 1);
  const docLength = docTokens.length;

  const docFreq = new Map<string, number>();
  for (const t of docTokens) {
    docFreq.set(t, (docFreq.get(t) || 0) + 1);
  }

  let totalScore = 0;
  for (const query of queryTokens) {
    const qTerm = query.toLowerCase().trim();
    if (!qTerm) continue;

    const count = docFreq.get(qTerm) || 0;
    if (count > 0) {
      // Simplified IDF approximation for document matching
      const idf = Math.log(1 + 10 / (1 + count));
      const numerator = count * (k1 + 1);
      const denominator = count + k1 * (1 - b + b * (docLength / avgDocLength));
      totalScore += idf * (numerator / denominator);
    }
  }

  // Normalized to [0, 100]
  return Math.min(100, Math.max(0, Math.round(totalScore * 15 * 10) / 10));
}

/**
 * Enterprise Reciprocal Rank Fusion (RRF)
 * Blends lexical BM25 exact match rank with semantic vector similarity rank:
 * RRF(d) = 1 / (60 + r_BM25) + 1 / (60 + r_Vector)
 */
export function computeReciprocalRankFusion(bm25Score: number, vectorScore: number): number {
  // Normalize both 0-100 scores into 0-1 range
  const bm25Norm = Math.max(0, Math.min(100, bm25Score)) / 100;
  const vectorNorm = Math.max(0, Math.min(100, vectorScore)) / 100;

  // Approximate relative rank: higher score => lower rank number
  const rBM25 = Math.max(1, Math.round((1 - bm25Norm) * 50) + 1);
  const rVec = Math.max(1, Math.round((1 - vectorNorm) * 50) + 1);

  const rrf = (1 / (60 + rBM25)) + (1 / (60 + rVec));
  const maxPossibleRRF = 2 / 61; // when both ranks are 1

  return Math.min(100, Math.max(0, Math.round((rrf / maxPossibleRRF) * 100 * 10) / 10));
}

/**
 * Zero-Trust Prompt Injection & Invisible Text Shield
 * Scans resume text for adversarial override attempts (e.g., hidden instructions or system overrides).
 */
export function sanitizeAndInspectPromptSecurity(resumeText: string): {
  isSafe: boolean;
  sanitizedText: string;
  threatsDetected: string[];
} {
  if (!resumeText) return { isSafe: true, sanitizedText: '', threatsDetected: [] };

  const threatsDetected: string[] = [];
  const adversarialPatterns = [
    { pattern: /ignore\s+(?:all\s+)?previous\s+instructions/i, name: 'instruction_override' },
    { pattern: /system\s*:\s*you\s+are/i, name: 'system_prompt_impersonation' },
    { pattern: /score\s*(?:this|me)\s*(?:a\s*)?100(?:%|\s*percent)?/i, name: 'artificial_score_injection' },
    { pattern: /give\s+(?:this\s+candidate|me)\s+(?:a\s+)?perfect\s+match/i, name: 'match_score_tampering' },
    { pattern: /classify\s+as\s+(?:a\s+)?strong\s+match/i, name: 'category_tampering' },
  ];

  let sanitized = resumeText;
  for (const { pattern, name } of adversarialPatterns) {
    if (pattern.test(sanitized)) {
      threatsDetected.push(name);
      sanitized = sanitized.replace(pattern, '[DEFANGED_ADVERSARIAL_INPUT]');
    }
  }

  return {
    isSafe: threatsDetected.length === 0,
    sanitizedText: sanitized,
    threatsDetected,
  };
}
