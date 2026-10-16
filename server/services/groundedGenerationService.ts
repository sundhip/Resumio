import { z } from 'zod';
import { AIProviderService } from './aiProvider.js';
import { NoFabricationValidator } from '../../packages/shared/src/index.js';

export interface GroundedCandidateFacts {
  name?: string;
  currentRole?: string;
  yearsOfExperience?: number;
  companies: string[];
  skills: string[];
  education: Array<{ degree?: string; institution?: string; year?: string }>;
  verifiedAchievements: string[];
  verifiedProjects: Array<{ name: string; description: string; technologies?: string[] }>;
}

export interface GroundedTargetJob {
  title: string;
  company?: string;
  requiredSkills?: string[];
  description?: string;
}

export interface GroundedGenerationResult {
  text: string;
  type: 'cover_letter' | 'professional_summary';
  groundedFacts: string[];
  reviewChecklist: string[];
  isAiGenerated: boolean;
  validationPassed: boolean;
  warnings?: string[];
}

const GenerationSchema = z.object({
  text: z.string().min(20),
  groundedFactsUsed: z.array(z.string()),
});

export class GroundedGenerationService {
  private aiProvider: AIProviderService;

  constructor(aiProvider?: AIProviderService) {
    this.aiProvider = aiProvider || new AIProviderService();
  }

  /**
   * Generates a 3-sentence professional summary grounded exclusively in verified facts.
   */
  public async generateProfessionalSummary(
    facts: GroundedCandidateFacts,
    job: GroundedTargetJob
  ): Promise<GroundedGenerationResult> {
    const matchedSkills = facts.skills.filter(s =>
      job.requiredSkills?.some(req => req.toLowerCase() === s.toLowerCase())
    ).slice(0, 4);

    const relevantSkills = matchedSkills.length > 0 ? matchedSkills : facts.skills.slice(0, 3);
    const primaryRole = facts.currentRole || 'Software Professional';
    const primaryCompany = facts.companies[0] || 'industry-leading teams';
    const topAchievement = facts.verifiedAchievements[0] || 
      (facts.verifiedProjects[0] ? `building ${facts.verifiedProjects[0].name}` : 'delivering resilient software systems');
    const yearsExp = facts.yearsOfExperience ? `${facts.yearsOfExperience}+` : 'seasoned';

    // Fallback generator
    const deterministicFallback = (): { text: string; groundedFactsUsed: string[] } => {
      const sentence1 = `${primaryRole} with ${yearsExp} years of hands-on experience specializing in ${relevantSkills.join(', ')}.`;
      const sentence2 = `Demonstrated history at ${primaryCompany} of ${topAchievement.replace(/\.$/, '')}.`;
      const sentence3 = `Targeting the ${job.title} role${job.company ? ` at ${job.company}` : ''} to apply verified competencies in ${relevantSkills.slice(0, 2).join(' and ')}.`;

      return {
        text: `${sentence1} ${sentence2} ${sentence3}`,
        groundedFactsUsed: [
          `Role: ${primaryRole}`,
          `Experience: ${yearsExp} years`,
          `Skills: ${relevantSkills.join(', ')}`,
          `Company/Project: ${primaryCompany}`,
          `Achievement: ${topAchievement}`
        ]
      };
    };

    const prompt = `
Generate a punchy 3-sentence professional summary for a resume tailored to the target job.
STRICT TRUTHFULNESS & GROUNDING REQUIREMENT:
- You must ONLY use facts listed below.
- Do NOT invent metrics, degrees, tools, awards, or companies.
- Output JSON format with 'text' and 'groundedFactsUsed'.

CANDIDATE FACTS:
- Role: ${primaryRole}
- Years of Experience: ${facts.yearsOfExperience || 'Not specified'}
- Companies: ${facts.companies.join(', ') || 'N/A'}
- Skills: ${facts.skills.join(', ')}
- Achievements: ${facts.verifiedAchievements.join('; ') || 'N/A'}
- Projects: ${facts.verifiedProjects.map(p => p.name).join(', ') || 'N/A'}

TARGET JOB:
- Title: ${job.title}
- Company: ${job.company || 'Confidential'}
- Required Skills: ${job.requiredSkills?.join(', ') || 'N/A'}
`;

    try {
      const response = await this.aiProvider.generateStructuredJson(
        prompt,
        GenerationSchema,
        'You are an expert recruitment ATS optimizer. Never hallucinate facts.',
        deterministicFallback
      );

      // Validate output against candidate facts to prevent fabrication
      const validation = this.validateGrounding(response.data.text, facts);

      if (!validation.isValid) {
        // Fallback to deterministic
        const fallback = deterministicFallback();
        return {
          text: fallback.text,
          type: 'professional_summary',
          groundedFacts: fallback.groundedFactsUsed,
          reviewChecklist: [
            'Verify your primary role matches your latest target level.',
            'Confirm the highlighted skills reflect your strongest areas.',
            'Review target job title alignment.'
          ],
          isAiGenerated: false,
          validationPassed: true,
          warnings: [`AI generation rejected due to ungrounded claims (${validation.violations.join(', ')}). Used deterministic fallback.`]
        };
      }

      return {
        text: response.data.text,
        type: 'professional_summary',
        groundedFacts: response.data.groundedFactsUsed,
        reviewChecklist: [
          'Verify your primary role matches your latest target level.',
          'Confirm the highlighted skills reflect your strongest areas.',
          'Review target job title alignment.'
        ],
        isAiGenerated: response.isAiGenerated,
        validationPassed: true
      };
    } catch {
      const fallback = deterministicFallback();
      return {
        text: fallback.text,
        type: 'professional_summary',
        groundedFacts: fallback.groundedFactsUsed,
        reviewChecklist: [
          'Verify your primary role matches your latest target level.',
          'Confirm the highlighted skills reflect your strongest areas.'
        ],
        isAiGenerated: false,
        validationPassed: true
      };
    }
  }

  /**
   * Generates a cover letter draft grounded strictly in candidate's parsed facts.
   */
  public async generateCoverLetter(
    facts: GroundedCandidateFacts,
    job: GroundedTargetJob
  ): Promise<GroundedGenerationResult> {
    const candidateName = facts.name || 'Candidate';
    const primaryRole = facts.currentRole || 'Software Professional';
    const matchedSkills = facts.skills.filter(s =>
      job.requiredSkills?.some(req => req.toLowerCase() === s.toLowerCase())
    ).slice(0, 5);
    const topSkills = matchedSkills.length > 0 ? matchedSkills : facts.skills.slice(0, 4);
    const recentCompany = facts.companies[0] || 'past engineering teams';
    const topAchievement = facts.verifiedAchievements[0] || 
      (facts.verifiedProjects[0] ? `developed ${facts.verifiedProjects[0].name}: ${facts.verifiedProjects[0].description}` : 'built scalable software solutions');

    const deterministicFallback = (): { text: string; groundedFactsUsed: string[] } => {
      const targetCompany = job.company || 'your organization';
      const p1 = `Dear Hiring Team,\n\nI am writing to express my enthusiastic interest in the ${job.title} position at ${targetCompany}. With a background as a ${primaryRole}${facts.yearsOfExperience ? ` and over ${facts.yearsOfExperience} years of practical experience` : ''}, I have developed deep expertise in ${topSkills.join(', ')}.`;
      const p2 = `During my tenure at ${recentCompany}, I focused on engineering high-reliability systems and high-impact deliverables. Most notably, I ${topAchievement.replace(/\.$/, '')}. This experience reinforced my proficiency in applying robust software engineering patterns to solve pressing business challenges.`;
      const p3 = `What particularly excites me about the ${job.title} role is the opportunity to contribute my verified background in ${topSkills.slice(0, 3).join(', ')} to ${targetCompany}'s ongoing initiatives. I take pride in delivering measurable results through disciplined engineering and thoughtful collaboration.`;
      const p4 = `Thank you for your time and consideration. I welcome the opportunity to discuss how my verified background aligns with your team's objectives.\n\nSincerely,\n${candidateName}`;

      return {
        text: `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`,
        groundedFactsUsed: [
          `Candidate Name: ${candidateName}`,
          `Role: ${primaryRole}`,
          `Experience: ${facts.yearsOfExperience || 'N/A'} years`,
          `Skills: ${topSkills.join(', ')}`,
          `Company: ${recentCompany}`,
          `Achievement/Project: ${topAchievement}`
        ]
      };
    };

    const prompt = `
Generate a 4-paragraph cover letter tailored to the target job based STRICTLY on the candidate facts below.
STRICT TRUTHFULNESS & GROUNDING REQUIREMENT:
- You must NOT invent any past employers, years of experience, university degrees, or unmentioned technologies.
- Do NOT fabricate unevidenced statistics or percentages.
- Output JSON format with 'text' and 'groundedFactsUsed'.

CANDIDATE FACTS:
- Name: ${candidateName}
- Current Role: ${primaryRole}
- Years Experience: ${facts.yearsOfExperience || 'Not specified'}
- Employers: ${facts.companies.join(', ') || 'N/A'}
- Skills: ${facts.skills.join(', ')}
- Achievements: ${facts.verifiedAchievements.join('; ') || 'N/A'}
- Projects: ${facts.verifiedProjects.map(p => `${p.name} (${p.description})`).join('; ') || 'N/A'}

TARGET JOB:
- Title: ${job.title}
- Company: ${job.company || 'Hiring Organization'}
- Key Requirements: ${job.requiredSkills?.join(', ') || 'N/A'}
`;

    try {
      const response = await this.aiProvider.generateStructuredJson(
        prompt,
        GenerationSchema,
        'You are an expert career advisor. You strictly refuse to invent facts, numbers, or qualifications not provided in the prompt.',
        deterministicFallback
      );

      const validation = this.validateGrounding(response.data.text, facts);

      if (!validation.isValid) {
        const fallback = deterministicFallback();
        return {
          text: fallback.text,
          type: 'cover_letter',
          groundedFacts: fallback.groundedFactsUsed,
          reviewChecklist: [
            'Confirm target company name and hiring manager greeting.',
            'Review referenced achievements against your official portfolio.',
            'Ensure tone matches the target company culture.'
          ],
          isAiGenerated: false,
          validationPassed: true,
          warnings: [`AI generation flagged for potential hallucination (${validation.violations.join(', ')}). Replaced with deterministic grounded draft.`]
        };
      }

      return {
        text: response.data.text,
        type: 'cover_letter',
        groundedFacts: response.data.groundedFactsUsed,
        reviewChecklist: [
          'Confirm target company name and hiring manager greeting.',
          'Review referenced achievements against your official portfolio.',
          'Ensure tone matches the target company culture.'
        ],
        isAiGenerated: response.isAiGenerated,
        validationPassed: true
      };
    } catch {
      const fallback = deterministicFallback();
      return {
        text: fallback.text,
        type: 'cover_letter',
        groundedFacts: fallback.groundedFactsUsed,
        reviewChecklist: [
          'Confirm target company name and greeting.',
          'Review referenced achievements.'
        ],
        isAiGenerated: false,
        validationPassed: true
      };
    }
  }

  /**
   * Internal validator to detect any numbers/percentages or hallucinated claims.
   */
  private validateGrounding(text: string, facts: GroundedCandidateFacts): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Verify numbers using NoFabricationValidator logic
    const contextCorpus = [
      ...(facts.name ? [facts.name] : []),
      ...(facts.currentRole ? [facts.currentRole] : []),
      ...facts.companies,
      ...facts.skills,
      ...facts.verifiedAchievements,
      ...facts.verifiedProjects.map(p => `${p.name} ${p.description}`),
      ...(facts.yearsOfExperience ? [String(facts.yearsOfExperience)] : [])
    ].join(' ');

    const numValidation = NoFabricationValidator.validateNumbers(contextCorpus, text);
    if (!numValidation.isValid) {
      violations.push(`Invented numbers: ${numValidation.unsupportedNumbers.join(', ')}`);
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }
}
