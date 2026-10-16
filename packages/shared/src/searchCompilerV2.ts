/**
 * Resumio Phase 8: Search Compiler V2
 * Boolean expression parser, Natural-Language to Structured AST Compiler,
 * and hardened anti-bias compliance guardrails.
 */

export type BooleanOperator = 'AND' | 'OR' | 'NOT';

export interface BooleanAstNode {
  type: 'TERM' | 'PHRASE' | 'FIELD_FILTER' | 'OPERATOR' | 'GROUP';
  value?: string;
  field?: string;
  operator?: BooleanOperator;
  children?: BooleanAstNode[];
}

export interface FacetedFilters {
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  locations?: string[];
  workModes?: ('On-site' | 'Hybrid' | 'Remote')[];
  minMatchScore?: number;
  educationTiers?: ('high_school' | 'associate' | 'bachelor' | 'master' | 'doctorate')[];
  seniorityLevels?: ('junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'executive')[];
  tags?: string[];
  pipelineStages?: string[];
}

export interface CompiledStructuredQuery {
  rawInput: string;
  isNaturalLanguage: boolean;
  explanation: string;
  ast: BooleanAstNode;
  facets: FacetedFilters;
  textTerms: string[];
  quotedPhrases: string[];
  excludedTerms: string[];
  sqlWhereConditions: string[];
  sqlParams: (string | number)[];
}

// Protected characteristics and bias keywords (EEOC Title VII compliance)
export const PROTECTED_BIAS_KEYWORDS: Record<string, string> = {
  male: 'gender',
  female: 'gender',
  man: 'gender',
  woman: 'gender',
  men: 'gender',
  women: 'gender',
  boy: 'gender',
  girl: 'gender',
  guy: 'gender',
  pregnant: 'pregnancy/maternity',
  pregnancy: 'pregnancy/maternity',
  maternity: 'pregnancy/maternity',
  paternity: 'pregnancy/maternity',
  married: 'marital status',
  single: 'marital status',
  divorced: 'marital status',
  black: 'race/ethnicity',
  white: 'race/ethnicity',
  asian: 'race/ethnicity',
  hispanic: 'race/ethnicity',
  latino: 'race/ethnicity',
  african: 'race/ethnicity',
  christian: 'religion',
  muslim: 'religion',
  hindu: 'religion',
  jewish: 'religion',
  sikh: 'religion',
  buddhist: 'religion',
  gay: 'sexual orientation',
  lesbian: 'sexual orientation',
  bisexual: 'sexual orientation',
  transgender: 'sexual orientation',
  queer: 'sexual orientation',
  disabled: 'disability',
  handicapped: 'disability',
  autistic: 'disability',
  caste: 'caste/tribe',
  democrat: 'political affiliation',
  republican: 'political affiliation',
  // Age circumvention
  young: 'age',
  youth: 'age',
  old: 'age',
  elderly: 'age',
  fresh: 'age',
  recent_grad: 'age',
};

// Pedigree / Institution prestige bias terms blocked under merit-first policy
export const PRESTIGE_BIAS_KEYWORDS: Record<string, string> = {
  stanford: 'institution prestige',
  harvard: 'institution prestige',
  mit: 'institution prestige',
  berkeley: 'institution prestige',
  princeton: 'institution prestige',
  yale: 'institution prestige',
  columbia: 'institution prestige',
  oxford: 'institution prestige',
  cambridge: 'institution prestige',
  'ivy league': 'institution prestige',
  iit: 'institution prestige',
  faang: 'institution prestige',
  manga: 'institution prestige',
  'top tier': 'institution prestige',
};

// Adversarial prompt injection keywords
export const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all|previous)\s+instructions/i,
  /system\s+override/i,
  /disregard\s+safety/i,
  /dan\s+mode/i,
  /bypass\s+guardrail/i,
  /reveal\s+(system|admin)\s+prompt/i,
];

/**
 * Normalizes text to detect leetspeak obfuscation (e.g. "f.e.m.a.l.e", "w0m4n", "b!ack")
 */
export function normalizeObfuscatedText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[+]/g, 't')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Validates query safety against EEOC bias, age circumvention, prestige bias, and prompt injection
 */
export function validateSearchSafety(query: string): { isSafe: boolean; violationType?: string; message?: string } {
  if (!query || !query.trim()) return { isSafe: true };

  const rawLower = query.toLowerCase();

  // 1. Adversarial prompt injection check
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(rawLower)) {
      return {
        isSafe: false,
        violationType: 'Prompt Injection / Adversarial Attempt',
        message: 'Query rejected: Resumio detected adversarial prompt-injection syntax. Searches must be recruitment-focused.',
      };
    }
  }

  // 2. Exact and tokenized protected characteristics check
  const tokens = rawLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (PROTECTED_BIAS_KEYWORDS[token]) {
      const category = PROTECTED_BIAS_KEYWORDS[token];
      return {
        isSafe: false,
        violationType: `EEOC Protected Characteristic (${category})`,
        message: `Query rejected: Searching on ${category} ("${token}") violates EEOC non-discrimination guidelines and Resumio fairness policy. All searches must focus on skills, experience, and job requirements.`,
      };
    }
    if (PRESTIGE_BIAS_KEYWORDS[token]) {
      return {
        isSafe: false,
        violationType: 'Institutional Prestige Bias',
        message: `Query rejected: Filtering by institution pedigree ("${token}") is prohibited under Resumio merit-first guidelines. Please filter on demonstrated skills and quantified project outcomes instead.`,
      };
    }
  }

  // 3. Obfuscation / leetspeak check
  const collapsed = normalizeObfuscatedText(query);
  for (const [kw, category] of Object.entries(PROTECTED_BIAS_KEYWORDS)) {
    if (kw.length >= 4 && collapsed.includes(kw)) {
      return {
        isSafe: false,
        violationType: `EEOC Protected Characteristic (${category} - Obfuscated)`,
        message: `Query rejected: Obfuscated query pattern matching protected category "${category}" detected.`,
      };
    }
  }

  // 4. Age circumvention patterns (e.g. "graduated before 2005", "under 30")
  const ageMatch = rawLower.match(/(?:under|over|below|above|age)\s+\d{2}|graduated\s+(?:before|after|in)\s+(?:19\d\d|200\d|201\d)/i);
  if (ageMatch) {
    return {
      isSafe: false,
      violationType: 'Age Discrimination Circumvention',
      message: `Query rejected: Detected age-proxy filtering ("${ageMatch[0]}"). Under the ADEA and Resumio fairness rules, age-based filtering is prohibited.`,
    };
  }

  return { isSafe: true };
}

/**
 * Tokenizes a search query string into boolean operators, quoted phrases, and words
 */
export function tokenizeQuery(query: string): string[] {
  const regex = /"([^"]+)"|(\()|(\))|\b(AND|OR|NOT)\b|([^\s()"]+)/g;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(query)) !== null) {
    if (match[1] !== undefined) {
      tokens.push(`"${match[1]}"`);
    } else if (match[2] !== undefined) {
      tokens.push('(');
    } else if (match[3] !== undefined) {
      tokens.push(')');
    } else if (match[4] !== undefined) {
      tokens.push(match[4]);
    } else if (match[5] !== undefined) {
      tokens.push(match[5]);
    }
  }
  return tokens;
}

/**
 * Compiles a boolean or natural-language query string into a transparent, editable AST and SQL clauses
 */
export function compileSearchQuery(
  rawQuery: string,
  explicitFacets: FacetedFilters = {}
): CompiledStructuredQuery {
  const safety = validateSearchSafety(rawQuery);
  if (!safety.isSafe) {
    throw new Error(safety.message);
  }

  const rawLower = rawQuery.toLowerCase();
  const tokens = tokenizeQuery(rawQuery);
  const isNaturalLanguage = /\b(with|in|who|can|engineers|developers|candidates|remote|experience|senior|lead|years)\b/i.test(rawQuery) &&
    !rawQuery.includes('(') && !rawQuery.includes(')');

  const textTerms: string[] = [];
  const quotedPhrases: string[] = [];
  const excludedTerms: string[] = [];
  const extractedSkills: string[] = [...(explicitFacets.skills || [])];
  const extractedLocations: string[] = [...(explicitFacets.locations || [])];
  const extractedWorkModes: ('On-site' | 'Hybrid' | 'Remote')[] = [...(explicitFacets.workModes || [])];
  let extractedMinExp = explicitFacets.minExperience;
  let extractedSeniority = explicitFacets.seniorityLevels?.[0];

  // Natural language pattern extraction
  if (isNaturalLanguage) {
    // 1. Seniority extraction
    if (/\b(senior|sr\.?)\b/i.test(rawLower)) {
      extractedSeniority = 'senior';
      if (extractedMinExp === undefined) extractedMinExp = 5;
    } else if (/\b(lead|principal|staff)\b/i.test(rawLower)) {
      extractedSeniority = 'lead';
      if (extractedMinExp === undefined) extractedMinExp = 7;
    } else if (/\b(junior|jr\.?|entry)\b/i.test(rawLower)) {
      extractedSeniority = 'junior';
    }

    // 2. Years extraction: "5+ years", "3-5 years", "at least 4 years"
    const expMatch = rawLower.match(/(\d+)\+?\s*(?:to|-)?\s*(\d+)?\s*years/i);
    if (expMatch) {
      extractedMinExp = parseInt(expMatch[1], 10);
    }

    // 3. Work mode extraction: remote / hybrid / on-site
    if (/\bremote\b/i.test(rawLower)) {
      if (!extractedWorkModes.includes('Remote')) extractedWorkModes.push('Remote');
    }
    if (/\bhybrid\b/i.test(rawLower)) {
      if (!extractedWorkModes.includes('Hybrid')) extractedWorkModes.push('Hybrid');
    }
    if (/\bon-?site\b/i.test(rawLower)) {
      if (!extractedWorkModes.includes('On-site')) extractedWorkModes.push('On-site');
    }

    // 4. Common tech skills & locations
    const knownSkills = [
      'kubernetes', 'docker', 'react', 'typescript', 'python', 'node', 'nodejs', 'go', 'golang',
      'rust', 'aws', 'gcp', 'azure', 'postgresql', 'postgres', 'redis', 'graphql', 'java', 'sql',
      'distributed systems', 'microservices', 'c++', 'c#', 'django', 'fastapi',
    ];
    for (const skill of knownSkills) {
      if (rawLower.includes(skill) && !extractedSkills.includes(skill)) {
        extractedSkills.push(skill);
      }
    }

    const knownLocations = ['chennai', 'bangalore', 'bengaluru', 'hyderabad', 'mumbai', 'pune', 'delhi', 'san francisco', 'london', 'remote'];
    for (const loc of knownLocations) {
      if (rawLower.includes(loc) && loc !== 'remote' && !extractedLocations.includes(loc)) {
        extractedLocations.push(loc);
      }
    }
  }

  // Parse structured / boolean tokens
  let nextIsNegated = false;
  for (const token of tokens) {
    if (token === 'NOT') {
      nextIsNegated = true;
      continue;
    }
    if (token === 'AND' || token === 'OR' || token === '(' || token === ')') {
      continue;
    }

    if (token.startsWith('"') && token.endsWith('"')) {
      const phrase = token.slice(1, -1).trim();
      if (nextIsNegated) {
        excludedTerms.push(phrase);
      } else {
        quotedPhrases.push(phrase);
      }
    } else {
      const clean = token.trim();
      if (clean) {
        if (nextIsNegated) {
          excludedTerms.push(clean);
        } else {
          textTerms.push(clean);
        }
      }
    }
    nextIsNegated = false;
  }

  // Build transparent AST representation
  const astChildren: BooleanAstNode[] = [];
  for (const phrase of quotedPhrases) {
    astChildren.push({ type: 'PHRASE', value: phrase });
  }
  for (const term of textTerms) {
    astChildren.push({ type: 'TERM', value: term });
  }
  for (const exc of excludedTerms) {
    astChildren.push({
      type: 'OPERATOR',
      operator: 'NOT',
      children: [{ type: 'TERM', value: exc }],
    });
  }
  if (extractedSkills.length > 0) {
    astChildren.push({
      type: 'FIELD_FILTER',
      field: 'skills',
      value: extractedSkills.join(', '),
    });
  }
  if (extractedLocations.length > 0) {
    astChildren.push({
      type: 'FIELD_FILTER',
      field: 'location',
      value: extractedLocations.join(', '),
    });
  }
  if (extractedMinExp !== undefined) {
    astChildren.push({
      type: 'FIELD_FILTER',
      field: 'minExperienceYears',
      value: `>= ${extractedMinExp} years`,
    });
  }

  const ast: BooleanAstNode = {
    type: 'GROUP',
    operator: 'AND',
    children: astChildren,
  };

  // Build SQL conditions
  const sqlWhereConditions: string[] = [];
  const sqlParams: (string | number)[] = [];

  for (const phrase of quotedPhrases) {
    sqlWhereConditions.push('(raw_text LIKE ? OR headline LIKE ?)');
    sqlParams.push(`%${phrase}%`, `%${phrase}%`);
  }
  for (const term of textTerms) {
    sqlWhereConditions.push('(raw_text LIKE ? OR skills_json LIKE ? OR headline LIKE ?)');
    sqlParams.push(`%${term}%`, `%${term}%`, `%${term}%`);
  }
  for (const exc of excludedTerms) {
    sqlWhereConditions.push('(raw_text NOT LIKE ? AND skills_json NOT LIKE ?)');
    sqlParams.push(`%${exc}%`, `%${exc}%`);
  }
  if (extractedMinExp !== undefined) {
    sqlWhereConditions.push('experience_years_detected >= ?');
    sqlParams.push(extractedMinExp);
  }

  // Explanation string for UI transparency
  const explanationParts: string[] = [];
  if (extractedSkills.length > 0) explanationParts.push(`Required skills: [${extractedSkills.join(', ')}]`);
  if (extractedMinExp !== undefined) explanationParts.push(`Min experience: ${extractedMinExp}+ years`);
  if (extractedLocations.length > 0) explanationParts.push(`Locations: [${extractedLocations.join(', ')}]`);
  if (extractedWorkModes.length > 0) explanationParts.push(`Work modes: [${extractedWorkModes.join(', ')}]`);
  if (quotedPhrases.length > 0) explanationParts.push(`Exact phrases: "${quotedPhrases.join('", "')}"`);
  if (excludedTerms.length > 0) explanationParts.push(`Excluded terms: NOT [${excludedTerms.join(', ')}]`);

  const explanation = explanationParts.length > 0
    ? `Compiled query into structured filters: ${explanationParts.join(' | ')}`
    : `General text search across applicant documents: "${rawQuery}"`;

  return {
    rawInput: rawQuery,
    isNaturalLanguage,
    explanation,
    ast,
    facets: {
      ...explicitFacets,
      skills: extractedSkills,
      locations: extractedLocations,
      workModes: extractedWorkModes,
      minExperience: extractedMinExp,
      seniorityLevels: extractedSeniority ? [extractedSeniority] : explicitFacets.seniorityLevels,
    },
    textTerms,
    quotedPhrases,
    excludedTerms,
    sqlWhereConditions,
    sqlParams,
  };
}
