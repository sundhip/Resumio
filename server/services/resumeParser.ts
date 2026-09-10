export interface ParsedPersonal {
  candidateName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
}

export interface ParsedEducation {
  degree: string;
  field: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
}

export interface ParsedExperience {
  jobTitle: string;
  company: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  responsibilities?: string;
}

export interface ParsedProject {
  name: string;
  role?: string;
  technologies?: string;
  description?: string;
  url?: string;
}

export interface ParsedCertification {
  name: string;
  issuingOrg: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
}

export interface ParsedLanguage {
  language: string;
  proficiency?: string;
}

export interface ParsedResumeResult {
  personal: ParsedPersonal;
  summary: string;
  skills: string[];
  education: ParsedEducation[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
  certifications: ParsedCertification[];
  languages: ParsedLanguage[];
  achievements: string[];
  confidence: Record<string, 'high' | 'medium' | 'low'>;
  sectionsDetectedCount: number;
}

// Canonical skills catalog for exact normalization
const CANONICAL_SKILLS: { name: string; aliases: string[] }[] = [
  // Frontend
  { name: 'React', aliases: ['react', 'reactjs', 'react.js'] },
  { name: 'TypeScript', aliases: ['typescript', 'ts'] },
  { name: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'] },
  { name: 'HTML5', aliases: ['html', 'html5'] },
  { name: 'CSS3', aliases: ['css', 'css3'] },
  { name: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss', 'tailwind-css'] },
  { name: 'Next.js', aliases: ['nextjs', 'next.js', 'next'] },
  { name: 'Vue.js', aliases: ['vue', 'vuejs', 'vue.js'] },
  { name: 'Angular', aliases: ['angular', 'angularjs', 'angular.js'] },
  { name: 'Redux', aliases: ['redux', 'redux-toolkit', 'rtk'] },
  { name: 'Svelte', aliases: ['svelte', 'sveltekit'] },
  { name: 'Bootstrap', aliases: ['bootstrap', 'bootstrap5'] },

  // Backend
  { name: 'Node.js', aliases: ['nodejs', 'node.js', 'node'] },
  { name: 'Express.js', aliases: ['express', 'expressjs', 'express.js'] },
  { name: 'Python', aliases: ['python', 'python3', 'py'] },
  { name: 'Django', aliases: ['django'] },
  { name: 'FastAPI', aliases: ['fastapi', 'fast-api'] },
  { name: 'Flask', aliases: ['flask'] },
  { name: 'Java', aliases: ['java', 'core java'] },
  { name: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring framework', 'spring'] },
  { name: 'C#', aliases: ['c#', 'csharp', '.net', 'dotnet', 'asp.net'] },
  { name: 'C++', aliases: ['c++', 'cpp'] },
  { name: 'Go', aliases: ['golang', 'go lang'] },
  { name: 'Rust', aliases: ['rust', 'rustlang'] },
  { name: 'PHP', aliases: ['php', 'php8'] },
  { name: 'Ruby', aliases: ['ruby', 'ruby on rails', 'rails'] },
  { name: 'GraphQL', aliases: ['graphql', 'apollo graphql'] },
  { name: 'REST APIs', aliases: ['rest api', 'rest apis', 'restful api', 'restful apis', 'rest'] },

  // Databases
  { name: 'SQL', aliases: ['sql'] },
  { name: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'psql'] },
  { name: 'MySQL', aliases: ['mysql'] },
  { name: 'MongoDB', aliases: ['mongodb', 'mongo'] },
  { name: 'Redis', aliases: ['redis'] },
  { name: 'SQLite', aliases: ['sqlite', 'sqlite3'] },
  { name: 'Elasticsearch', aliases: ['elasticsearch', 'elastic search'] },
  { name: 'DynamoDB', aliases: ['dynamodb', 'dynamo db'] },
  { name: 'Prisma', aliases: ['prisma', 'prisma orm'] },

  // Cloud & DevOps
  { name: 'AWS Cloud', aliases: ['aws', 'amazon web services', 'aws cloud'] },
  { name: 'Docker', aliases: ['docker', 'docker container', 'dockerfile'] },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { name: 'Google Cloud Platform (GCP)', aliases: ['gcp', 'google cloud', 'google cloud platform'] },
  { name: 'Microsoft Azure', aliases: ['azure', 'microsoft azure'] },
  { name: 'CI/CD', aliases: ['ci/cd', 'cicd', 'github actions', 'gitlab ci', 'jenkins'] },
  { name: 'Terraform', aliases: ['terraform'] },
  { name: 'Linux', aliases: ['linux', 'unix', 'ubuntu', 'bash', 'shell scripting'] },
  { name: 'Git', aliases: ['git', 'github', 'gitlab'] },

  // Architecture & Methodologies
  { name: 'Microservices', aliases: ['microservices', 'microservice architecture'] },
  { name: 'System Design', aliases: ['system design', 'distributed systems'] },
  { name: 'Agile / Scrum', aliases: ['agile', 'scrum', 'kanban'] },
  { name: 'Unit Testing', aliases: ['unit testing', 'jest', 'vitest', 'mocha', 'cypress'] },

  // Soft Skills
  { name: 'Problem Solving', aliases: ['problem solving', 'analytical thinking'] },
  { name: 'Communication', aliases: ['communication skills', 'strong communication'] },
  { name: 'Team Leadership', aliases: ['team leadership', 'mentorship', 'technical leadership'] },
];

/**
 * Parses raw extracted resume text into structured data
 */
export function parseResumeText(rawText: string): ParsedResumeResult {
  const text = rawText.trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  // Confidence indicators
  const confidence: Record<string, 'high' | 'medium' | 'low'> = {};

  // 1. Contact Extraction
  const personal = extractPersonal(lines, text, confidence);

  // 2. Sections segmentation
  const sections = segmentSections(lines, text);

  // 3. Summary Extraction
  const summary = extractSummary(sections);

  // 4. Skills Extraction
  const skills = extractSkills(text);
  confidence.skills = skills.length >= 5 ? 'high' : skills.length > 0 ? 'medium' : 'low';

  // 5. Education Extraction
  const education = extractEducation(sections.education || text);
  confidence.education = education.length > 0 ? 'high' : 'low';

  // 6. Experience Extraction
  const experience = extractExperience(sections.experience || text);
  confidence.experience = experience.length > 0 ? 'high' : 'low';

  // 7. Projects Extraction
  const projects = extractProjects(sections.projects || '');
  confidence.projects = projects.length > 0 ? 'high' : 'low';

  // 8. Certifications Extraction
  const certifications = extractCertifications(sections.certifications || text);
  confidence.certifications = certifications.length > 0 ? 'high' : 'low';

  // 9. Languages Extraction
  const languages = extractLanguages(sections.languages || text);

  // 10. Achievements
  const achievements = extractAchievements(sections.achievements || '');

  // Calculate detected sections count
  let sectionsDetectedCount = 0;
  if (personal.candidateName || personal.email) sectionsDetectedCount++;
  if (summary) sectionsDetectedCount++;
  if (skills.length > 0) sectionsDetectedCount++;
  if (experience.length > 0) sectionsDetectedCount++;
  if (education.length > 0) sectionsDetectedCount++;
  if (projects.length > 0) sectionsDetectedCount++;
  if (certifications.length > 0) sectionsDetectedCount++;
  if (languages.length > 0) sectionsDetectedCount++;
  if (achievements.length > 0) sectionsDetectedCount++;

  return {
    personal,
    summary,
    skills,
    education,
    experience,
    projects,
    certifications,
    languages,
    achievements,
    confidence,
    sectionsDetectedCount,
  };
}

/**
 * Extracts personal contact info (Name, Email, Phone, Location, Headline)
 */
function extractPersonal(
  lines: string[],
  fullText: string,
  confidence: Record<string, 'high' | 'medium' | 'low'>
): ParsedPersonal {
  let email = '';
  let phone = '';
  let location = '';
  let candidateName = '';
  let headline = '';

  // Email Regex
  const emailMatch = fullText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) {
    email = emailMatch[0].trim();
    confidence.email = 'high';
  } else {
    confidence.email = 'low';
  }

  // Phone Regex (Handles +91, (123) 456-7890, +1-555-0192, 9876543210, etc.)
  const phoneMatch = fullText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  if (phoneMatch) {
    phone = phoneMatch[0].trim();
    confidence.phone = 'high';
  } else {
    confidence.phone = 'low';
  }

  // Candidate Name: Typically line 0 or line 1 if not a generic keyword
  const ignoreNameWords = [
    'resume', 'curriculum vitae', 'cv', 'profile', 'contact', 'email', 'phone',
    'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'startxref', '%pdf'
  ];
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (
      line.length >= 2 &&
      line.length <= 45 &&
      !ignoreNameWords.some((w) => lower.includes(w)) &&
      !line.includes('@') &&
      !/\d/.test(line) &&
      /^[A-Za-z\s.'-]+$/.test(line)
    ) {
      candidateName = line;
      confidence.name = 'high';
      // Next line might be headline
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (
          nextLine.length <= 60 &&
          !nextLine.includes('@') &&
          !/\d{5,}/.test(nextLine) &&
          (nextLine.toLowerCase().includes('developer') ||
            nextLine.toLowerCase().includes('engineer') ||
            nextLine.toLowerCase().includes('lead') ||
            nextLine.toLowerCase().includes('architect') ||
            nextLine.toLowerCase().includes('specialist') ||
            nextLine.toLowerCase().includes('manager'))
        ) {
          headline = nextLine;
        }
      }
      break;
    }
  }

  // Location pattern matching (e.g. City, Country or City, State)
  const locationMatch = fullText.match(/\b([A-Z][a-zA-Z\s]+,\s*(?:India|USA|United States|UK|Canada|Germany|Singapore|Australia|[A-Z]{2}))\b/);
  if (locationMatch) {
    location = locationMatch[1].trim();
    confidence.location = 'medium';
  }

  return { candidateName, email, phone, location, headline };
}

/**
 * Segments raw text into distinct sections
 */
function segmentSections(lines: string[], _fullText: string): Record<string, string> {
  const sections: Record<string, string[]> = {};
  let currentSection = 'header';

  const sectionHeaders: { key: string; patterns: string[] }[] = [
    { key: 'summary', patterns: ['summary', 'professional summary', 'profile', 'about me', 'executive summary', 'objective'] },
    { key: 'skills', patterns: ['skills', 'technical skills', 'core competencies', 'technologies', 'skills & tools'] },
    { key: 'experience', patterns: ['experience', 'work experience', 'employment history', 'professional experience', 'work history'] },
    { key: 'education', patterns: ['education', 'academic background', 'qualifications', 'degrees'] },
    { key: 'projects', patterns: ['projects', 'key projects', 'academic projects', 'personal projects'] },
    { key: 'certifications', patterns: ['certifications', 'certificates', 'licenses & certifications', 'credentials'] },
    { key: 'languages', patterns: ['languages', 'language skills'] },
    { key: 'achievements', patterns: ['achievements', 'awards', 'honors', 'accomplishments'] },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    const cleanHeader = trimmed.replace(/^[^a-zA-Z]+/, '').replace(/[:\-_]+$/, '').trim().toLowerCase();

    // Check if line matches a section header
    const matched = sectionHeaders.find((h) => h.patterns.includes(cleanHeader));
    if (matched && trimmed.length <= 40) {
      currentSection = matched.key;
      if (!sections[currentSection]) sections[currentSection] = [];
      continue;
    }

    if (!sections[currentSection]) sections[currentSection] = [];
    sections[currentSection].push(trimmed);
  }

  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(sections)) {
    result[key] = val.join('\n');
  }
  return result;
}

/**
 * Extracts summary text
 */
function extractSummary(sections: Record<string, string>): string {
  if (sections.summary && sections.summary.trim().length > 15) {
    return sections.summary.trim();
  }
  return '';
}

/**
 * Extracts and normalizes skills against canonical skills catalog
 */
function extractSkills(fullText: string): string[] {
  const detectedSkills = new Set<string>();
  const lowerText = fullText.toLowerCase();

  for (const skill of CANONICAL_SKILLS) {
    for (const alias of skill.aliases) {
      // Word boundary match
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');
      if (regex.test(lowerText)) {
        detectedSkills.add(skill.name);
        break;
      }
    }
  }

  return Array.from(detectedSkills);
}

/**
 * Extracts Education records
 */
function extractEducation(text: string): ParsedEducation[] {
  const records: ParsedEducation[] = [];
  const lines = text.split('\n');

  const degreePatterns = [
    { degree: 'B.Tech', field: 'Computer Science', regex: /\b(?:B\.?Tech|Bachelor of Technology)\b(?:\s+in\s+([A-Za-z\s]+))?/i },
    { degree: 'B.S.', field: 'Computer Science', regex: /\b(?:B\.?S\.?|Bachelor of Science)\b(?:\s+in\s+([A-Za-z\s]+))?/i },
    { degree: 'B.E.', field: 'Engineering', regex: /\b(?:B\.?E\.?|Bachelor of Engineering)\b(?:\s+in\s+([A-Za-z\s]+))?/i },
    { degree: 'M.S.', field: 'Computer Science', regex: /\b(?:M\.?S\.?|Master of Science)\b(?:\s+in\s+([A-Za-z\s]+))?/i },
    { degree: 'M.Tech', field: 'Technology', regex: /\b(?:M\.?Tech|Master of Technology)\b(?:\s+in\s+([A-Za-z\s]+))?/i },
    { degree: 'MBA', field: 'Business Administration', regex: /\b(?:MBA|Master of Business Administration)\b/i },
    { degree: 'Bachelor Degree', field: '', regex: /\bBachelor(?:'s)?(?:\s+Degree)?\b(?:\s+in\s+([A-Za-z\s]+))?/i },
    { degree: 'Master Degree', field: '', regex: /\bMaster(?:'s)?(?:\s+Degree)?\b(?:\s+in\s+([A-Za-z\s]+))?/i },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const dp of degreePatterns) {
      const match = line.match(dp.regex);
      if (match) {
        const field = (match[1] || dp.field || '').trim();
        let institution = '';
        let grade = '';
        let startDate = '';
        let endDate = '';

        // Check current or adjacent lines for institution (University, College, Institute)
        const instMatch = (line + ' ' + (lines[i + 1] || '')).match(/\b([A-Za-z\s]+(?:University|College|Institute|Academy|School))\b/i);
        if (instMatch) {
          institution = instMatch[1].trim();
        }

        // Check for GPA / CGPA
        const gpaMatch = (line + ' ' + (lines[i + 1] || '')).match(/\b(?:CGPA|GPA|Grade)[:\s]+([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
        if (gpaMatch) {
          grade = gpaMatch[0].trim();
        }

        // Check for years e.g. 2018 - 2022
        const yearMatch = (line + ' ' + (lines[i + 1] || '')).match(/\b(20\d{2})\s*[-–—]\s*(20\d{2}|Present)\b/i);
        if (yearMatch) {
          startDate = yearMatch[1];
          endDate = yearMatch[2];
        }

        records.push({
          degree: dp.degree,
          field: field || dp.field,
          institution: institution || 'Institution Not Specified',
          startDate,
          endDate,
          grade,
        });
        break;
      }
    }
  }

  // Deduplicate records by degree + institution
  const unique = new Map<string, ParsedEducation>();
  for (const r of records) {
    const key = `${r.degree}_${r.institution}`;
    if (!unique.has(key)) unique.set(key, r);
  }

  return Array.from(unique.values());
}

/**
 * Extracts Work Experience records
 */
function extractExperience(text: string): ParsedExperience[] {
  const records: ParsedExperience[] = [];
  const lines = text.split('\n');

  const titleKeywords = [
    'Senior Full Stack Engineer', 'Senior Software Engineer', 'Senior Frontend Developer', 'Senior Backend Developer',
    'Senior Developer', 'Software Architect', 'Cloud Architect', 'Engineering Manager', 'Tech Lead', 'Team Lead',
    'Full Stack Developer', 'Software Engineer', 'Frontend Developer', 'Backend Developer',
    'DevOps Engineer', 'QA Engineer', 'Data Scientist', 'Data Engineer', 'Intern'
  ].sort((a, b) => b.length - a.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const title of titleKeywords) {
      if (line.toLowerCase().includes(title.toLowerCase())) {
        let company = '';
        let startDate = '';
        let endDate = '';
        let description = '';

        // Extract company from "Title at Company" or "Company - Title"
        const atMatch = line.match(/(?:at|@|–|-|,)\s*([A-Za-z0-9\s.,]+)/i);
        if (atMatch) {
          company = atMatch[1].trim();
        }

        // Look for date range on this or next line
        const dateMatch = (line + ' ' + (lines[i + 1] || '')).match(
          /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*20\d{2})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*20\d{2}|Present)\b/i
        );
        if (dateMatch) {
          startDate = dateMatch[1].trim();
          endDate = dateMatch[2].trim();
        }

        // Collect description lines until next blank line or next title
        const descLines: string[] = [];
        for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
          if (titleKeywords.some((t) => lines[j].toLowerCase().includes(t.toLowerCase()))) break;
          descLines.push(lines[j]);
        }
        description = descLines.join(' ').trim();

        records.push({
          jobTitle: title,
          company: company || 'Company',
          employmentType: 'Full-time',
          startDate,
          endDate,
          description,
        });
        break;
      }
    }
  }

  // Deduplicate
  const unique = new Map<string, ParsedExperience>();
  for (const r of records) {
    const key = `${r.jobTitle}_${r.company}`;
    if (!unique.has(key)) unique.set(key, r);
  }

  return Array.from(unique.values());
}

/**
 * Extracts Projects
 */
function extractProjects(text: string): ParsedProject[] {
  if (!text || text.trim().length === 0) return [];
  const records: ParsedProject[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length >= 3 && line.length <= 150) {
      let name = '';
      let description = '';
      let url = '';

      const sepMatch = line.match(/^([-*•#\d.]*\s*)([A-Za-z0-9\s/&_]{3,40})\s*[-–—:]\s*(.*)$/);
      if (sepMatch) {
        name = sepMatch[2].trim();
        description = sepMatch[3].trim();
      } else if (!line.includes('http') && /^[A-Za-z0-9\s:_-]+$/.test(line)) {
        name = line.replace(/^[-*•#\d.]+\s*/, '').trim();
        if (i + 1 < lines.length && !lines[i + 1].includes('http')) {
          description = lines[i + 1];
        }
      }

      if (name.length >= 2) {
        const urlMatch = (description + ' ' + (lines[i + 1] || '')).match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          url = urlMatch[0];
          description = description.replace(urlMatch[0], '').trim();
        }

        records.push({
          name,
          description: description || undefined,
          url: url || undefined,
        });
      }
    }
  }

  // Deduplicate
  const unique = new Map<string, ParsedProject>();
  for (const p of records) {
    if (!unique.has(p.name.toLowerCase())) unique.set(p.name.toLowerCase(), p);
  }

  return Array.from(unique.values()).slice(0, 5);
}

/**
 * Extracts Certifications
 */
function extractCertifications(text: string): ParsedCertification[] {
  const records: ParsedCertification[] = [];
  const certKeywords = [
    { name: 'AWS Certified Solutions Architect', org: 'Amazon Web Services (AWS)' },
    { name: 'AWS Certified Developer', org: 'Amazon Web Services (AWS)' },
    { name: 'AWS Certified Cloud Practitioner', org: 'Amazon Web Services (AWS)' },
    { name: 'Google Cloud Professional Cloud Architect', org: 'Google Cloud' },
    { name: 'Google Cloud Associate Cloud Engineer', org: 'Google Cloud' },
    { name: 'Certified Kubernetes Administrator (CKA)', org: 'CNCF / Linux Foundation' },
    { name: 'Microsoft Certified: Azure Fundamentals', org: 'Microsoft' },
    { name: 'Oracle Certified Java Professional', org: 'Oracle' },
  ];

  for (const ck of certKeywords) {
    if (text.toLowerCase().includes(ck.name.toLowerCase()) || text.toLowerCase().includes(ck.name.split(' ')[0].toLowerCase() + ' certified')) {
      records.push({
        name: ck.name,
        issuingOrg: ck.org,
      });
    }
  }

  return records;
}

/**
 * Extracts spoken languages
 */
function extractLanguages(text: string): ParsedLanguage[] {
  const languages: ParsedLanguage[] = [];
  const languageList = ['English', 'Spanish', 'Hindi', 'French', 'German', 'Tamil', 'Telugu', 'Mandarin', 'Japanese'];

  for (const lang of languageList) {
    const regex = new RegExp(`\\b${lang}\\b(?:\\s*[-–—:]\\s*(Native|Fluent|Professional|Intermediate|Basic))?`, 'i');
    const match = text.match(regex);
    if (match) {
      languages.push({
        language: lang,
        proficiency: match[1] ? match[1].trim() : 'Professional',
      });
    }
  }

  return languages;
}

/**
 * Extracts achievements
 */
function extractAchievements(text: string): string[] {
  if (!text || text.trim().length === 0) return [];
  return text
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter((l) => l.length > 10)
    .slice(0, 5);
}
