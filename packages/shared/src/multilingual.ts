/**
 * Multilingual Support & Cross-Lingual Skill Normalization
 * Supports language detection, cross-lingual terminology mapping, and multilingual embeddings representation.
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de';

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  isMultilingual: boolean;
  languageDistribution: Record<SupportedLanguage, number>;
}

// Characteristic stopwords for deterministic language identification
const LANGUAGE_STOPWORDS: Record<SupportedLanguage, string[]> = {
  en: ['the', 'and', 'with', 'for', 'experience', 'skills', 'developed', 'managed', 'team', 'engineering', 'responsible', 'years'],
  es: ['el', 'la', 'los', 'las', 'con', 'para', 'experiencia', 'habilidades', 'desarrollo', 'equipo', 'ingeniería', 'responsable', 'años'],
  fr: ['le', 'la', 'les', 'des', 'avec', 'pour', 'expérience', 'compétences', 'développement', 'équipe', 'ingénierie', 'responsable', 'années'],
  de: ['der', 'die', 'das', 'und', 'mit', 'für', 'erfahrung', 'kenntnisse', 'entwicklung', 'team', 'ingenieur', 'verantwortlich', 'jahre'],
};

/**
 * Fast deterministic n-gram and stopword language detector.
 * Fallback to 'en' if confidence is low.
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      detectedLanguage: 'en',
      confidence: 1.0,
      isMultilingual: false,
      languageDistribution: { en: 1, es: 0, fr: 0, de: 0 },
    };
  }

  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  if (words.length === 0) {
    return {
      detectedLanguage: 'en',
      confidence: 1.0,
      isMultilingual: false,
      languageDistribution: { en: 1, es: 0, fr: 0, de: 0 },
    };
  }

  const scores: Record<SupportedLanguage, number> = { en: 0, es: 0, fr: 0, de: 0 };

  for (const word of words) {
    for (const lang of Object.keys(LANGUAGE_STOPWORDS) as SupportedLanguage[]) {
      if (LANGUAGE_STOPWORDS[lang].includes(word)) {
        scores[lang]++;
      }
    }
  }

  const totalHits = Object.values(scores).reduce((a, b) => a + b, 0);

  if (totalHits === 0) {
    return {
      detectedLanguage: 'en',
      confidence: 0.7,
      isMultilingual: false,
      languageDistribution: { en: 1, es: 0, fr: 0, de: 0 },
    };
  }

  const distribution: Record<SupportedLanguage, number> = {
    en: scores.en / totalHits,
    es: scores.es / totalHits,
    fr: scores.fr / totalHits,
    de: scores.de / totalHits,
  };

  let bestLang: SupportedLanguage = 'en';
  let maxScore = -1;

  for (const lang of Object.keys(scores) as SupportedLanguage[]) {
    if (scores[lang] > maxScore) {
      maxScore = scores[lang];
      bestLang = lang;
    }
  }

  const confidence = Math.min(1.0, Math.max(0.5, (maxScore / Math.max(1, totalHits))));
  const isMultilingual = Object.values(distribution).filter(d => d > 0.25).length > 1;

  return {
    detectedLanguage: bestLang,
    confidence: Number(confidence.toFixed(2)),
    isMultilingual,
    languageDistribution: distribution,
  };
}

/**
 * Cross-lingual job title & technical skill dictionary
 */
export const CROSS_LINGUAL_SKILL_MAP: Record<string, string> = {
  // Spanish
  'desarrollador de software': 'Software Engineer',
  'ingeniero de software': 'Software Engineer',
  'desarrollador frontend': 'Frontend Developer',
  'desarrollador backend': 'Backend Developer',
  'desarrollador full stack': 'Full Stack Developer',
  'aprendizaje automático': 'Machine Learning',
  'inteligencia artificial': 'Artificial Intelligence',
  'ciencia de datos': 'Data Science',
  'gestión de proyectos': 'Project Management',
  'bases de datos': 'Databases',
  'computación en la nube': 'Cloud Computing',
  'seguridad informática': 'Cybersecurity',

  // French
  'ingénieur logiciel': 'Software Engineer',
  'développeur logiciel': 'Software Engineer',
  'développeur web': 'Web Developer',
  'apprentissage automatique': 'Machine Learning',
  'intelligence artificielle': 'Artificial Intelligence',
  'gestion de projet': 'Project Management',
  'bases de données': 'Databases',
  'sécurité informatique': 'Cybersecurity',

  // German
  'softwareentwickler': 'Software Engineer',
  'software-ingenieur': 'Software Engineer',
  'frontend-entwickler': 'Frontend Developer',
  'backend-entwickler': 'Backend Developer',
  'maschinelles lernen': 'Machine Learning',
  'künstliche intelligenz': 'Artificial Intelligence',
  'datenwissenschaft': 'Data Science',
  'projektmanagement': 'Project Management',
  'datenbanken': 'Databases',
  'cloud-computing': 'Cloud Computing',
};

/**
 * Normalizes multi-lingual terms into their standard canonical English representations
 */
export function normalizeCrossLingualTerm(term: string): string {
  if (!term) return '';
  const lower = term.trim().toLowerCase();
  return CROSS_LINGUAL_SKILL_MAP[lower] || term.trim();
}

/**
 * Computes a deterministic pseudo-multilingual embedding representation
 * combining character n-grams and language-independent technical tokens.
 */
export function computeMultilingualEmbedding(text: string, dimensions = 64): number[] {
  const embedding = new Array<number>(dimensions).fill(0);
  const normalized = text.toLowerCase();
  
  for (let i = 0; i < normalized.length - 2; i++) {
    const trigram = normalized.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < trigram.length; j++) {
      hash = (hash << 5) - hash + trigram.charCodeAt(j);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % dimensions;
    embedding[bucket] += 1;
  }

  // L2 normalize
  const norm = Math.sqrt(embedding.reduce((acc, val) => acc + val * val, 0)) || 1;
  return embedding.map(val => Number((val / norm).toFixed(5)));
}
