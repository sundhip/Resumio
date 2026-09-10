import { ParsedResumeResult } from './resumeParser.js';

export interface ScreeningResult {
  completenessScore: number; // 0 to 100
  sectionsPresent: string[];
  sectionsMissing: string[];
  totalExperienceYears: number;
  highestEducation: string;
  totalSkillsCount: number;
  observations: string[];
  screeningFlags: {
    type: 'info' | 'warning' | 'positive';
    message: string;
  }[];
  screeningDate: string;
}

/**
 * Performs neutral initial AI resume screening on parsed resume data.
 * Adheres strictly to Phase 5 boundaries: Quality, completeness, and structure analysis.
 * (No job matching scores or candidate rankings).
 */
export function screenParsedResume(parsed: ParsedResumeResult): ScreeningResult {
  const sectionsPresent: string[] = [];
  const sectionsMissing: string[] = [];
  const observations: string[] = [];
  const screeningFlags: { type: 'info' | 'warning' | 'positive'; message: string }[] = [];

  let score = 0;

  // 1. Contact / Personal Info Evaluation
  if (parsed.personal && (parsed.personal.email || parsed.personal.phone)) {
    sectionsPresent.push('Contact Information');
    score += 15;
    if (parsed.personal.email && parsed.personal.phone) {
      observations.push('Complete contact information with verified email and telephone.');
    } else {
      observations.push('Basic contact details present.');
      screeningFlags.push({
        type: 'warning',
        message: !parsed.personal.email ? 'No email address detected.' : 'No phone number detected.',
      });
    }
  } else {
    sectionsMissing.push('Contact Information');
    screeningFlags.push({
      type: 'warning',
      message: 'Direct contact information (email or phone) is missing.',
    });
  }

  // 2. Summary
  if (parsed.summary && parsed.summary.length > 20) {
    sectionsPresent.push('Professional Summary');
    score += 10;
    observations.push('Professional summary / profile statement provided.');
  } else {
    sectionsMissing.push('Professional Summary');
    screeningFlags.push({
      type: 'info',
      message: 'No executive or professional summary section found.',
    });
  }

  // 3. Skills
  const skillsCount = parsed.skills ? parsed.skills.length : 0;
  if (skillsCount >= 5) {
    sectionsPresent.push('Skills');
    score += 20;
    observations.push(`Strong skills portfolio identified with ${skillsCount} verified technical competencies.`);
  } else if (skillsCount > 0) {
    sectionsPresent.push('Skills');
    score += 12;
    observations.push(`${skillsCount} technical skills extracted.`);
  } else {
    sectionsMissing.push('Skills');
    screeningFlags.push({
      type: 'warning',
      message: 'No standardized technical skills identified in the document.',
    });
  }

  // 4. Experience & Total Years Estimate
  let totalExperienceYears = 0;
  if (parsed.experience && parsed.experience.length > 0) {
    sectionsPresent.push('Work Experience');
    const expCount = parsed.experience.length;
    score += expCount >= 2 ? 25 : 15;
    observations.push(`${expCount} professional role${expCount > 1 ? 's' : ''} documented.`);

    // Calculate approximate experience years from date ranges
    let calculatedYears = 0;
    for (const exp of parsed.experience) {
      if (exp.startDate) {
        const startYearMatch = exp.startDate.match(/\b(19\d\d|20\d\d)\b/);
        const endYearMatch = exp.endDate ? exp.endDate.match(/\b(19\d\d|20\d\d)\b/) : null;
        const startY = startYearMatch ? parseInt(startYearMatch[1], 10) : null;
        const currentYear = new Date().getFullYear();
        const endY = endYearMatch ? parseInt(endYearMatch[1], 10) : (exp.endDate && /present/i.test(exp.endDate) ? currentYear : currentYear);
        
        if (startY && endY && endY >= startY) {
          calculatedYears += Math.max(1, endY - startY);
        } else {
          calculatedYears += 1;
        }
      } else {
        calculatedYears += 1;
      }
    }
    totalExperienceYears = Math.min(30, Math.max(1, calculatedYears));
  } else {
    sectionsMissing.push('Work Experience');
    screeningFlags.push({
      type: 'info',
      message: 'No previous employment or work history records detected (entry-level candidate).',
    });
  }

  // 5. Education & Highest Level
  let highestEducation = 'None Detected';
  if (parsed.education && parsed.education.length > 0) {
    sectionsPresent.push('Education');
    score += 15;
    const degrees = parsed.education.map((e) => e.degree.toLowerCase());
    if (degrees.some((d) => d.includes('ph') || d.includes('doctor'))) {
      highestEducation = 'Doctorate / Ph.D';
    } else if (degrees.some((d) => d.includes('m.') || d.includes('master') || d.includes('mba'))) {
      highestEducation = "Master's Degree";
    } else if (degrees.some((d) => d.includes('b.') || d.includes('bachelor') || d.includes('btech') || d.includes('degree'))) {
      highestEducation = "Bachelor's Degree";
    } else {
      highestEducation = parsed.education[0].degree || 'Higher Education';
    }
    observations.push(`Academic credentials verified: ${highestEducation} (${parsed.education[0].institution}).`);
  } else {
    sectionsMissing.push('Education');
    screeningFlags.push({
      type: 'info',
      message: 'No formal educational degrees identified.',
    });
  }

  // 6. Projects & Certifications & Languages (Bonus Structure)
  let additionalPoints = 0;
  if (parsed.projects && parsed.projects.length > 0) {
    sectionsPresent.push('Projects');
    additionalPoints += 5;
    observations.push(`${parsed.projects.length} project portfolio item${parsed.projects.length > 1 ? 's' : ''} detailed.`);
  } else {
    sectionsMissing.push('Projects');
  }

  if (parsed.certifications && parsed.certifications.length > 0) {
    sectionsPresent.push('Certifications');
    additionalPoints += 5;
    observations.push(`${parsed.certifications.length} verified industry certification${parsed.certifications.length > 1 ? 's' : ''} listed.`);
  } else {
    sectionsMissing.push('Certifications');
  }

  if (parsed.languages && parsed.languages.length > 0) {
    sectionsPresent.push('Languages');
    additionalPoints += 5;
  } else {
    sectionsMissing.push('Languages');
  }

  score = Math.min(100, Math.max(10, score + additionalPoints));

  // Overall screening health flag
  if (score >= 80) {
    screeningFlags.unshift({
      type: 'positive',
      message: 'High document quality: comprehensive structured sections and details.',
    });
  } else if (score >= 50) {
    screeningFlags.unshift({
      type: 'info',
      message: 'Standard resume profile: essential qualifications provided.',
    });
  } else {
    screeningFlags.unshift({
      type: 'warning',
      message: 'Incomplete resume profile: key sections require candidate enrichment.',
    });
  }

  return {
    completenessScore: score,
    sectionsPresent,
    sectionsMissing,
    totalExperienceYears,
    highestEducation,
    totalSkillsCount: skillsCount,
    observations,
    screeningFlags,
    screeningDate: new Date().toISOString(),
  };
}
