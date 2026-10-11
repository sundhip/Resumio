import { JobRequirementsOutput, JobRequirementsSchema } from './aiValidation.js';
import { aiProvider, AIResponse } from './aiProvider.js';
import { wrapInUntrustedBoundary } from './promptSecurity.js';
import { normalizeSkillList } from './skillNormalizer.js';

/**
 * Service to parse job description text into structured requirements,
 * required/preferred skills, experience years, and qualifications.
 */
export class JobDescriptionParser {
  /**
   * Deterministic extractor for job descriptions using rule-based parsing and skill catalogs.
   */
  public static parseJobDescriptionDeterministic(text: string, titleHint?: string): JobRequirementsOutput {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const lowerText = text.toLowerCase();

    // 1. Title inference
    let jobTitle = titleHint || '';
    if (!jobTitle) {
      const titleLine = lines.find((l) =>
        /engineer|developer|architect|manager|lead|analyst|designer|specialist/i.test(l) && l.length < 50
      );
      jobTitle = titleLine || 'Software Professional';
    }

    // 2. Minimum experience inference
    let minExperienceYears = 0;
    const expMatch = text.match(/(?:experience\s*:\s*)?(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years?|yrs?)(?:[^\n.]*experience)?/i);
    if (expMatch) {
      minExperienceYears = parseInt(expMatch[1], 10);
    }

    // 3. Experience level
    let experienceLevel: JobRequirementsOutput['experienceLevel'] = 'Mid-level';
    if (/entry[- ]level|junior|intern|graduate/i.test(text)) {
      experienceLevel = 'Entry-level';
    } else if (/senior|sr\.|lead|principal|staff/i.test(text)) {
      experienceLevel = 'Senior-level';
    } else if (/architect|director|vp|executive|head\s+of/i.test(text)) {
      experienceLevel = 'Executive';
    }

    // 4. Employment type
    let employmentType: JobRequirementsOutput['employmentType'] = 'Full-time';
    if (/part[- ]time/i.test(text)) employmentType = 'Part-time';
    else if (/contract|contractor/i.test(text)) employmentType = 'Contract';
    else if (/internship|intern/i.test(text)) employmentType = 'Internship';
    else if (/freelance/i.test(text)) employmentType = 'Freelance';

    // 5. Skills extraction
    const rawSkills = normalizeSkillList(text);
    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    // Split based on required vs preferred sections
    const preferredSectionIndex = text.search(/preferred|nice\s+to\s+have|bonus|plus/i);
    if (preferredSectionIndex !== -1) {
      const reqPart = text.slice(0, preferredSectionIndex);
      const prefPart = text.slice(preferredSectionIndex);

      const reqFound = normalizeSkillList(reqPart);
      const prefFound = normalizeSkillList(prefPart);

      requiredSkills.push(...reqFound);
      for (const s of prefFound) {
        if (!requiredSkills.includes(s)) {
          preferredSkills.push(s);
        }
      }
    } else {
      // Divide arbitrarily if no section found: first 70% required, rest preferred
      const splitIdx = Math.ceil(rawSkills.length * 0.7);
      requiredSkills.push(...rawSkills.slice(0, splitIdx));
      preferredSkills.push(...rawSkills.slice(splitIdx));
    }

    // 6. Minimum education
    let minimumEducation = "Bachelor's Degree";
    if (/master|m\.s\.|msc|postgraduate/i.test(text)) minimumEducation = "Master's Degree";
    else if (/phd|doctorate/i.test(text)) minimumEducation = 'PhD / Doctorate';
    else if (/high\s+school|diploma/i.test(text)) minimumEducation = 'High School / Diploma';

    // 7. Responsibilities and qualifications
    const responsibilities: string[] = [];
    const qualifications: string[] = [];

    for (const l of lines) {
      if (/^[-*•]/.test(l) && l.length > 15) {
        const clean = l.replace(/^[-*•]\s*/, '');
        if (/responsible|lead|build|design|develop|manage|maintain|test|collaborate/i.test(clean)) {
          responsibilities.push(clean);
        } else {
          qualifications.push(clean);
        }
      }
    }

    return {
      jobTitle,
      department: 'Engineering',
      employmentType,
      experienceLevel,
      minExperienceYears,
      requiredSkills: Array.from(new Set(requiredSkills)),
      preferredSkills: Array.from(new Set(preferredSkills)),
      minimumEducation,
      responsibilities: responsibilities.slice(0, 8),
      qualifications: qualifications.slice(0, 8),
      summary: lines.slice(0, 3).join(' ').slice(0, 250),
    };
  }

  /**
   * Main entrypoint: Parses job description using AI provider with deterministic fallback.
   */
  public static async parseJobDescription(
    rawText: string,
    titleHint?: string
  ): Promise<AIResponse<JobRequirementsOutput>> {
    const wrappedContent = wrapInUntrustedBoundary('job_description', rawText);

    const prompt = `
Please extract the structured job requirements from the following job description.
Output strictly JSON conforming to this schema:
{
  "jobTitle": string,
  "department": string,
  "employmentType": "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance",
  "experienceLevel": "Entry-level" | "Mid-level" | "Senior-level" | "Lead" | "Executive",
  "minExperienceYears": number,
  "requiredSkills": string[],
  "preferredSkills": string[],
  "minimumEducation": string,
  "responsibilities": string[],
  "qualifications": string[],
  "summary": string
}

${titleHint ? `Title Hint: "${titleHint}"` : ''}

${wrappedContent}
`;

    return aiProvider.generateStructuredJson(
      prompt,
      JobRequirementsSchema,
      'You are a technical recruiting specialist. Extract precise requirements and normalize skill names. Never invent requirements absent from the text.',
      () => this.parseJobDescriptionDeterministic(rawText, titleHint)
    );
  }
}
