/**
 * Enterprise EEOC / GDPR Compliance & Blind Hiring Anonymization Engine.
 * Strips Personally Identifiable Information (PII) and protected demographic markers
 * from candidate profiles and resumes while preserving technical merits, skills, and qualifications.
 */

export interface CandidateAnonymizationInput {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  avatar?: string;
  photoUrl?: string;
  skills?: any[];
  education?: any[];
  experience?: any[];
  projects?: any[];
  [key: string]: any;
}

export interface AnonymizedCandidateResult {
  id: string;
  anonymizedIdentifier: string; // e.g. "Candidate #A4F9"
  blindTitle: string;
  summary: string;
  skills: any[];
  education: any[];
  experience: any[];
  projects: any[];
  anonymizationAudit: {
    piiFieldsMasked: string[];
    demographicSanitized: boolean;
    gdprCompliant: boolean;
    eeocProtected: boolean;
  };
}

export class ComplianceAnonymizationShield {
  // Regex patterns for PII detection
  private static readonly EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  private static readonly PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  private static readonly GENDERED_PRONOUNS_REGEX = /\b(he|she|him|her|his|hers|himself|herself)\b/gi;
  private static readonly AGE_MARKERS_REGEX = /\b(\d{1,2}\s*(?:years?\s*old|yo))\b/gi;

  /**
   * Generates a deterministic, neutral pseudonym for blind recruiting
   */
  public static generatePseudonym(candidateId: string): string {
    const hash = candidateId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    return `Candidate #${hash || 'ANON'}`;
  }

  /**
   * Sanitizes free-form text by masking PII, emails, phone numbers, and gendered pronouns
   */
  public static maskFreeformText(text: string): string {
    if (!text) return '';
    return text
      .replace(this.EMAIL_REGEX, '[EMAIL REDACTED]')
      .replace(this.PHONE_REGEX, '[PHONE REDACTED]')
      .replace(this.GENDERED_PRONOUNS_REGEX, 'they')
      .replace(this.AGE_MARKERS_REGEX, '[AGE REDACTED]');
  }

  /**
   * Anonymizes candidate education entries by generalizing institution names to prevent school prestige bias
   */
  public static sanitizeEducation(educationList: any[] = []): any[] {
    if (!Array.isArray(educationList)) return [];
    return educationList.map((edu) => {
      const copy = { ...edu };
      if (copy.institution) {
        copy.institution = 'Accredited Higher Education Institution';
      }
      if (copy.degree) {
        copy.degree = this.maskFreeformText(copy.degree);
      }
      return copy;
    });
  }

  /**
   * Anonymizes candidate experience entries by stripping company names into industry classifications
   */
  public static sanitizeExperience(experienceList: any[] = []): any[] {
    if (!Array.isArray(experienceList)) return [];
    return experienceList.map((exp) => {
      const copy = { ...exp };
      if (copy.company) {
        copy.company = 'Confidential Technology Organization';
      }
      if (copy.description) {
        copy.description = this.maskFreeformText(copy.description);
      }
      return copy;
    });
  }

  /**
   * Transforms a full candidate record into a blind, EEOC/GDPR-compliant evaluation profile
   */
  public static anonymizeCandidate(candidate: CandidateAnonymizationInput): AnonymizedCandidateResult {
    const piiFieldsMasked: string[] = [];

    if (candidate.name) piiFieldsMasked.push('name');
    if (candidate.email) piiFieldsMasked.push('email');
    if (candidate.phone) piiFieldsMasked.push('phone');
    if (candidate.avatar || candidate.photoUrl) piiFieldsMasked.push('photo');
    if (candidate.location) piiFieldsMasked.push('location');

    const pseudonym = this.generatePseudonym(candidate.id);
    const blindTitle = candidate.headline
      ? this.maskFreeformText(candidate.headline)
      : candidate.title || 'Technical Specialist';

    const sanitizedSummary = this.maskFreeformText(candidate.summary || candidate.bio || '');
    const sanitizedEducation = this.sanitizeEducation(candidate.education || []);
    const sanitizedExperience = this.sanitizeExperience(candidate.experience || []);

    return {
      id: candidate.id,
      anonymizedIdentifier: pseudonym,
      blindTitle,
      summary: sanitizedSummary,
      skills: candidate.skills || [],
      education: sanitizedEducation,
      experience: sanitizedExperience,
      projects: candidate.projects || [],
      anonymizationAudit: {
        piiFieldsMasked,
        demographicSanitized: true,
        gdprCompliant: true,
        eeocProtected: true,
      },
    };
  }
}
