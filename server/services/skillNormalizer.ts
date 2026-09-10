/**
 * Resumio Phase 6: Skill Normalization Service
 * Provides conservative, canonical normalization and comparison for technical & soft skills.
 */

export interface CanonicalSkillDefinition {
  canonical: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'Cloud/DevOps' | 'Architecture' | 'Languages' | 'General';
  aliases: string[];
}

export const CANONICAL_SKILL_CATALOG: CanonicalSkillDefinition[] = [
  // Languages
  { canonical: 'JavaScript', category: 'Languages', aliases: ['javascript', 'js', 'vanilla js', 'ecmascript', 'es6', 'es2020'] },
  { canonical: 'TypeScript', category: 'Languages', aliases: ['typescript', 'ts'] },
  { canonical: 'Python', category: 'Languages', aliases: ['python', 'python3', 'py'] },
  { canonical: 'Java', category: 'Languages', aliases: ['java', 'core java', 'java 8', 'java 11', 'java 17', 'java 21'] },
  { canonical: 'C#', category: 'Languages', aliases: ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'asp.net core', '.net core'] },
  { canonical: 'C++', category: 'Languages', aliases: ['c++', 'cpp'] },
  { canonical: 'Go', category: 'Languages', aliases: ['go', 'golang', 'go lang'] },
  { canonical: 'Rust', category: 'Languages', aliases: ['rust', 'rustlang'] },
  { canonical: 'PHP', category: 'Languages', aliases: ['php', 'php8', 'php7'] },
  { canonical: 'Ruby', category: 'Languages', aliases: ['ruby', 'ruby on rails', 'rails'] },
  { canonical: 'SQL', category: 'Languages', aliases: ['sql', 'ansi sql', 't-sql', 'pl/sql'] },
  { canonical: 'HTML5', category: 'Languages', aliases: ['html', 'html5'] },
  { canonical: 'CSS3', category: 'Languages', aliases: ['css', 'css3', 'scss', 'sass', 'less'] },

  // Frontend Frameworks
  { canonical: 'React', category: 'Frontend', aliases: ['react', 'react.js', 'reactjs', 'react framework'] },
  { canonical: 'React Native', category: 'Frontend', aliases: ['react native', 'react-native'] },
  { canonical: 'Next.js', category: 'Frontend', aliases: ['next.js', 'nextjs', 'next js', 'next'] },
  { canonical: 'Vue.js', category: 'Frontend', aliases: ['vue', 'vue.js', 'vuejs', 'vue 3', 'nuxt', 'nuxtjs'] },
  { canonical: 'Angular', category: 'Frontend', aliases: ['angular', 'angular.js', 'angularjs', 'angular 2+'] },
  { canonical: 'Tailwind CSS', category: 'Frontend', aliases: ['tailwind', 'tailwindcss', 'tailwind css'] },
  { canonical: 'Redux', category: 'Frontend', aliases: ['redux', 'redux toolkit', 'rtk'] },

  // Backend Frameworks & Runtimes
  { canonical: 'Node.js', category: 'Backend', aliases: ['node', 'node.js', 'nodejs', 'node js'] },
  { canonical: 'Express.js', category: 'Backend', aliases: ['express', 'express.js', 'expressjs', 'express js'] },
  { canonical: 'Django', category: 'Backend', aliases: ['django', 'python django', 'django rest framework', 'drf'] },
  { canonical: 'FastAPI', category: 'Backend', aliases: ['fastapi', 'fast api', 'python fastapi'] },
  { canonical: 'Flask', category: 'Backend', aliases: ['flask', 'python flask'] },
  { canonical: 'Spring Boot', category: 'Backend', aliases: ['spring boot', 'springboot', 'spring framework', 'spring'] },
  { canonical: 'NestJS', category: 'Backend', aliases: ['nestjs', 'nest.js', 'nest js'] },
  { canonical: 'GraphQL', category: 'Backend', aliases: ['graphql', 'apollo graphql', 'relay'] },
  { canonical: 'REST APIs', category: 'Backend', aliases: ['rest', 'rest api', 'rest apis', 'restful api', 'restful apis', 'restful web services', 'rest api development', 'web apis'] },

  // Databases & Stores
  { canonical: 'PostgreSQL', category: 'Database', aliases: ['postgresql', 'postgres', 'psql'] },
  { canonical: 'MySQL', category: 'Database', aliases: ['mysql', 'mariadb'] },
  { canonical: 'MongoDB', category: 'Database', aliases: ['mongodb', 'mongo', 'nosql mongodb'] },
  { canonical: 'Redis', category: 'Database', aliases: ['redis', 'redis cache'] },
  { canonical: 'SQLite', category: 'Database', aliases: ['sqlite', 'sqlite3'] },
  { canonical: 'Elasticsearch', category: 'Database', aliases: ['elasticsearch', 'elastic search', 'elk stack'] },
  { canonical: 'DynamoDB', category: 'Database', aliases: ['dynamodb', 'dynamo db', 'aws dynamodb'] },
  { canonical: 'Prisma', category: 'Database', aliases: ['prisma', 'prisma orm'] },

  // Cloud & DevOps
  { canonical: 'AWS Cloud', category: 'Cloud/DevOps', aliases: ['aws', 'amazon web services', 'aws cloud', 'amazon aws'] },
  { canonical: 'Docker', category: 'Cloud/DevOps', aliases: ['docker', 'docker container', 'dockerfile', 'docker compose'] },
  { canonical: 'Kubernetes', category: 'Cloud/DevOps', aliases: ['kubernetes', 'k8s'] },
  { canonical: 'Google Cloud Platform (GCP)', category: 'Cloud/DevOps', aliases: ['gcp', 'google cloud', 'google cloud platform'] },
  { canonical: 'Microsoft Azure', category: 'Cloud/DevOps', aliases: ['azure', 'microsoft azure', 'azure cloud'] },
  { canonical: 'CI/CD', category: 'Cloud/DevOps', aliases: ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment', 'github actions', 'gitlab ci', 'jenkins'] },
  { canonical: 'Terraform', category: 'Cloud/DevOps', aliases: ['terraform', 'tf', 'infrastructure as code', 'iac'] },
  { canonical: 'Linux', category: 'Cloud/DevOps', aliases: ['linux', 'unix', 'ubuntu', 'debian', 'centos', 'bash', 'shell scripting'] },
  { canonical: 'Git', category: 'Cloud/DevOps', aliases: ['git', 'github', 'gitlab', 'version control'] },

  // Architecture & Concepts
  { canonical: 'Microservices', category: 'Architecture', aliases: ['microservices', 'microservice', 'microservice architecture'] },
  { canonical: 'System Design', category: 'Architecture', aliases: ['system design', 'distributed systems', 'high availability', 'scalability'] },
  { canonical: 'Unit Testing', category: 'Architecture', aliases: ['unit testing', 'test driven development', 'tdd', 'jest', 'vitest', 'pytest', 'mocha', 'cypress'] },
  { canonical: 'Agile / Scrum', category: 'General', aliases: ['agile', 'scrum', 'kanban', 'sprint planning'] },
  { canonical: 'Problem Solving', category: 'General', aliases: ['problem solving', 'analytical thinking', 'algorithmic problem solving'] },
  { canonical: 'Team Leadership', category: 'General', aliases: ['team leadership', 'technical leadership', 'mentorship', 'team lead'] },
];

/**
 * Normalizes raw skill text by lowercasing and stripping non-alphanumeric punctuation
 */
function cleanSkillText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s+#.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reusable Skill Normalization Service
 */
export class SkillNormalizationService {
  private static aliasMap: Map<string, string> = new Map();

  static {
    for (const def of CANONICAL_SKILL_CATALOG) {
      this.aliasMap.set(cleanSkillText(def.canonical), def.canonical);
      for (const alias of def.aliases) {
        this.aliasMap.set(cleanSkillText(alias), def.canonical);
      }
    }
  }

  /**
   * Returns canonical skill name if recognized in catalog, otherwise returns trimmed original
   */
  public static normalize(rawSkill: string): string {
    if (!rawSkill || typeof rawSkill !== 'string') return '';
    const cleaned = cleanSkillText(rawSkill);
    if (this.aliasMap.has(cleaned)) {
      return this.aliasMap.get(cleaned)!;
    }
    return rawSkill.trim();
  }

  /**
   * Conservative check if two skill strings represent the same technology.
   * Explicitly avoids false equivalences like Java vs JavaScript, Python vs PyTorch, React vs React Native.
   */
  public static areSkillsEquivalent(skillA: string, skillB: string): boolean {
    if (!skillA || !skillB) return false;
    const normA = this.normalize(skillA);
    const normB = this.normalize(skillB);

    if (normA.toLowerCase() === normB.toLowerCase()) {
      return true;
    }

    const cleanA = cleanSkillText(skillA);
    const cleanB = cleanSkillText(skillB);

    if (cleanA === cleanB) return true;

    // Strict false-equivalence guard
    if (this.isStrictlyIncompatible(cleanA, cleanB)) {
      return false;
    }

    return false;
  }

  /**
   * Guards against dangerous partial matches
   */
  private static isStrictlyIncompatible(a: string, b: string): boolean {
    const pair = `${a}|${b}`;
    const reverse = `${b}|${a}`;

    const forbiddenPairs = [
      'java|javascript',
      'java|js',
      'python|pytorch',
      'react|react native',
      'reactjs|react native',
      'node|javascript',
      'nodejs|javascript',
      'c|c++',
      'c|c#',
      'sql|nosql',
    ];

    return forbiddenPairs.includes(pair) || forbiddenPairs.includes(reverse);
  }

  /**
   * Matches a single job requirement against a candidate's skill list and resume text.
   */
  public static matchSingleSkill(
    jobSkill: string,
    candidateSkills: string[],
    rawResumeText: string = ''
  ): { matched: boolean; canonical: string; matchedName?: string } {
    const canonicalJobSkill = this.normalize(jobSkill);

    // 1. Direct candidate skill list match
    for (const candSkill of candidateSkills) {
      if (this.areSkillsEquivalent(jobSkill, candSkill)) {
        return { matched: true, canonical: canonicalJobSkill, matchedName: candSkill };
      }
    }

    // 2. Check if canonical definition alias appears as distinct token in candidate skill list
    const catalogDef = CANONICAL_SKILL_CATALOG.find(
      (def) => def.canonical.toLowerCase() === canonicalJobSkill.toLowerCase()
    );

    if (catalogDef) {
      for (const candSkill of candidateSkills) {
        const cleanCand = cleanSkillText(candSkill);
        if (catalogDef.aliases.some((alias) => cleanSkillText(alias) === cleanCand)) {
          return { matched: true, canonical: canonicalJobSkill, matchedName: candSkill };
        }
      }
    }

    // 3. Conservative search in raw resume text (only whole word matches for high-confidence canonical skills)
    if (rawResumeText && rawResumeText.length > 20) {
      const lowerText = rawResumeText.toLowerCase();

      const searchTerms = catalogDef
        ? [catalogDef.canonical, ...catalogDef.aliases]
        : [jobSkill];

      for (const term of searchTerms) {
        const cleanTerm = cleanSkillText(term);
        if (cleanTerm.length < 2) continue;
        if (cleanTerm === 'c' || cleanTerm === 'r' || cleanTerm === 'go' || cleanTerm === 'js' || cleanTerm === 'ts') {
          const regex = new RegExp(`\\b${escapeRegExp(cleanTerm)}\\b`, 'i');
          if (regex.test(lowerText) && (lowerText.includes('developer') || lowerText.includes('engineer') || lowerText.includes('programming'))) {
            return { matched: true, canonical: canonicalJobSkill, matchedName: term };
          }
          continue;
        }

        const regex = new RegExp(`\\b${escapeRegExp(term.toLowerCase())}\\b`, 'i');
        if (regex.test(lowerText)) {
          return { matched: true, canonical: canonicalJobSkill, matchedName: term };
        }
      }
    }

    return { matched: false, canonical: canonicalJobSkill };
  }

  /**
   * Compares an array of job skills against candidate skills and resume text, returning matched & missing arrays.
   */
  public static compareSkillSets(
    jobSkills: string[],
    candidateSkills: string[],
    rawResumeText: string = ''
  ): { matched: string[]; missing: string[] } {
    const matched: string[] = [];
    const missing: string[] = [];
    const seenMatched = new Set<string>();

    for (const jobSkill of jobSkills) {
      if (!jobSkill || !jobSkill.trim()) continue;
      const result = this.matchSingleSkill(jobSkill, candidateSkills, rawResumeText);
      const displaySkill = result.canonical || jobSkill.trim();

      if (result.matched) {
        if (!seenMatched.has(displaySkill.toLowerCase())) {
          matched.push(displaySkill);
          seenMatched.add(displaySkill.toLowerCase());
        }
      } else {
        if (!missing.some((m) => m.toLowerCase() === displaySkill.toLowerCase())) {
          missing.push(displaySkill);
        }
      }
    }

    return { matched, missing };
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
