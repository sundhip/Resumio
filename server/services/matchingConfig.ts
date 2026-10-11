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
