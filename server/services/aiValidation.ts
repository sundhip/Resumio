import { z } from 'zod';

// ============================================================
// 1. RESUME EXTRACTION & PARSING SCHEMAS
// ============================================================

export const PersonalInfoSchema = z.object({
  candidateName: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  headline: z.string().default(''),
});

export const EducationItemSchema = z.object({
  degree: z.string(),
  field: z.string().default(''),
  institution: z.string(),
  location: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  grade: z.string().optional().default(''),
});

export const ExperienceItemSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  employmentType: z.string().optional().default('Full-time'),
  location: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  description: z.string().optional().default(''),
  responsibilities: z.string().optional().default(''),
});

export const ProjectItemSchema = z.object({
  name: z.string(),
  role: z.string().optional().default(''),
  technologies: z.string().optional().default(''),
  description: z.string().optional().default(''),
  url: z.string().optional().default(''),
});

export const CertificationItemSchema = z.object({
  name: z.string(),
  issuingOrg: z.string(),
  issueDate: z.string().optional().default(''),
  expirationDate: z.string().optional().default(''),
  credentialId: z.string().optional().default(''),
  url: z.string().optional().default(''),
});

export const LanguageItemSchema = z.object({
  language: z.string(),
  proficiency: z.string().optional().default('Professional'),
});

export const StructuredResumeSchema = z.object({
  personal: PersonalInfoSchema,
  summary: z.string().default(''),
  skills: z.array(z.string()).default([]),
  education: z.array(EducationItemSchema).default([]),
  experience: z.array(ExperienceItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  languages: z.array(LanguageItemSchema).default([]),
  achievements: z.array(z.string()).default([]),
  sectionsDetectedCount: z.number().int().nonnegative().default(0),
  confidence: z.record(z.enum(['high', 'medium', 'low'])).default({}),
});

export type StructuredResumeOutput = z.infer<typeof StructuredResumeSchema>;

// ============================================================
// 2. JOB DESCRIPTION EXTRACTION SCHEMA
// ============================================================

export const JobRequirementsSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().optional().default(''),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']).default('Full-time'),
  experienceLevel: z.enum(['Entry-level', 'Mid-level', 'Senior-level', 'Lead', 'Executive']).default('Mid-level'),
  minExperienceYears: z.number().min(0).default(0),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  minimumEducation: z.string().default('Bachelor\'s Degree'),
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  summary: z.string().default(''),
});

export type JobRequirementsOutput = z.infer<typeof JobRequirementsSchema>;

// ============================================================
// 3. CANDIDATE SUMMARY SCHEMA
// ============================================================

export const CandidateSummaryOutputSchema = z.object({
  summaryText: z.string().min(10, 'Summary must be at least 10 characters'),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  recommendation: z.enum(['Strong Match', 'Potential Match', 'Underqualified', 'Review Needed']).default('Review Needed'),
  confidenceScore: z.number().min(0).max(100).default(80),
});

export type CandidateSummaryOutput = z.infer<typeof CandidateSummaryOutputSchema>;

// ============================================================
// 4. INTERVIEW QUESTION SCHEMA
// ============================================================

export const InterviewQuestionItemSchema = z.object({
  id: z.string(),
  question: z.string().min(5),
  category: z.enum(['Technical', 'Behavioral', 'Experience', 'Role-Specific']),
  targetSkill: z.string().optional(),
  evaluationCriteria: z.string().optional(),
});

export const InterviewQuestionSetOutputSchema = z.object({
  technical: z.array(InterviewQuestionItemSchema).default([]),
  behavioral: z.array(InterviewQuestionItemSchema).default([]),
  experience: z.array(InterviewQuestionItemSchema).default([]),
  roleSpecific: z.array(InterviewQuestionItemSchema).default([]),
});

export type InterviewQuestionSetOutput = z.infer<typeof InterviewQuestionSetOutputSchema>;

// ============================================================
// 5. VALIDATION HELPER FUNCTIONS
// ============================================================

/**
 * Validates and parses JSON string against a given Zod schema safely.
 */
export function validateAiJson<T>(schema: z.ZodSchema<T>, jsonString: string): { success: true; data: T } | { success: false; error: string } {
  try {
    // Strip markdown code fences if LLM enclosed them
    let cleaned = jsonString.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    const validated = schema.safeParse(parsed);

    if (validated.success) {
      return { success: true, data: validated.data };
    } else {
      return { success: false, error: validated.error.message };
    }
  } catch (err: any) {
    return { success: false, error: `Invalid JSON output: ${err.message}` };
  }
}
