import { z } from 'zod';

// ==========================================
// Source Span for UI Evidence Highlighting
// ==========================================
export const SourceSpanSchema = z.object({
  page: z.number().int().min(1).default(1),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // [x0, y0, x1, y1]
  charStart: z.number().int().min(0).optional(),
  charEnd: z.number().int().min(0).optional(),
  text: z.string().default(''),
});
export type SourceSpan = z.infer<typeof SourceSpanSchema>;

// ==========================================
// Contact Information
// ==========================================
export const ContactInfoSchema = z.object({
  fullName: z.string().default(''),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().default(''),
  location: z.string().default(''),
  headline: z.string().default(''),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  portfolio: z.string().url().optional().or(z.literal('')),
  confidence: z.number().min(0).max(1).default(1.0),
  sourceSpan: SourceSpanSchema.optional(),
});
export type ContactInfo = z.infer<typeof ContactInfoSchema>;

// ==========================================
// Work Experience Entry
// ==========================================
export const ExperienceEntrySchema = z.object({
  id: z.string(),
  jobTitle: z.string(),
  company: z.string(),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  isCurrent: z.boolean().default(false),
  durationMonths: z.number().int().min(0).default(0),
  responsibilities: z.array(z.string()).default([]),
  technologiesUsed: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(1.0),
  sourceSpan: SourceSpanSchema.optional(),
});
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;

// ==========================================
// Education Entry
// ==========================================
export const EducationEntrySchema = z.object({
  id: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().default(''),
  institution: z.string(),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  gradeOrGpa: z.string().default(''),
  honors: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(1.0),
  sourceSpan: SourceSpanSchema.optional(),
});
export type EducationEntry = z.infer<typeof EducationEntrySchema>;

// ==========================================
// Project Entry
// ==========================================
export const ProjectEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().default(''),
  description: z.string().default(''),
  technologies: z.array(z.string()).default([]),
  url: z.string().optional().or(z.literal('')),
  highlights: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(1.0),
  sourceSpan: SourceSpanSchema.optional(),
});
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;

// ==========================================
// Certification Entry
// ==========================================
export const CertificationEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  issuingOrganization: z.string(),
  issueDate: z.string().default(''),
  expirationDate: z.string().default(''),
  credentialId: z.string().default(''),
  url: z.string().optional().or(z.literal('')),
  confidence: z.number().min(0).max(1).default(1.0),
  sourceSpan: SourceSpanSchema.optional(),
});
export type CertificationEntry = z.infer<typeof CertificationEntrySchema>;

// ==========================================
// ATS Parse-ability Issue & Report
// ==========================================
export const ATSIssueSeveritySchema = z.enum(['critical', 'warning', 'info']);
export type ATSIssueSeverity = z.infer<typeof ATSIssueSeveritySchema>;

export const ATSIssueCategorySchema = z.enum([
  'layout_multi_column',
  'layout_complex_tables',
  'header_footer_contact',
  'graphics_skill_bars',
  'non_standard_headings',
  'missing_sections',
  'inconsistent_dates',
  'hidden_or_micro_text',
  'excessive_length',
  'low_printable_character_ratio',
  'scanned_document',
  'unsupported_encoding',
]);
export type ATSIssueCategory = z.infer<typeof ATSIssueCategorySchema>;

export const ATSIssueSchema = z.object({
  id: z.string(),
  category: ATSIssueCategorySchema,
  severity: ATSIssueSeveritySchema,
  title: z.string(),
  description: z.string(),
  location: z.string().default('General'),
  recommendation: z.string(),
  sourceSpan: SourceSpanSchema.optional(),
});
export type ATSIssue = z.infer<typeof ATSIssueSchema>;

export const ATSParseabilityReportSchema = z.object({
  score: z.number().min(0).max(100),
  status: z.enum(['excellent', 'good', 'needs_improvement', 'poor']),
  discrepancyRatio: z.number().min(0).max(1).default(0.0),
  strategyAgreement: z.record(z.string(), z.number()).default({}),
  issues: z.array(ATSIssueSchema).default([]),
  strengths: z.array(z.string()).default([]),
  detectedLayout: z.enum(['single_column', 'multi_column', 'mixed', 'table_heavy']).default('single_column'),
  isScannedOrImage: z.boolean().default(false),
  hasHiddenText: z.boolean().default(false),
  disclaimer: z.string().default(
    'This ATS Parse-ability score is a simulated diagnostic across multiple extraction heuristics. It does not guarantee behavior on any single commercial ATS vendor.'
  ),
});
export type ATSParseabilityReport = z.infer<typeof ATSParseabilityReportSchema>;

// ==========================================
// Canonical Versioned ResumeDocument
// ==========================================
export const ResumeDocumentSchema = z.object({
  schemaVersion: z.literal('2.0.0').default('2.0.0'),
  parserVersion: z.string().default('resumio-engine-v3.0.0'),
  documentId: z.string(),
  candidateId: z.string().optional(),
  fileMetadata: z.object({
    fileName: z.string(),
    fileSizeBytes: z.number().int().min(0),
    fileFormat: z.enum(['PDF', 'DOCX', 'TXT', 'MD', 'RTF', 'IMAGE']),
    detectedMimeType: z.string(),
    pageCount: z.number().int().min(1).default(1),
    isEncrypted: z.boolean().default(false),
    fileHashSha256: z.string(),
  }),
  contact: ContactInfoSchema,
  summary: z.string().default(''),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.string().default('General'),
      yearsOfExperience: z.number().optional(),
      sourceSpan: SourceSpanSchema.optional(),
    })
  ).default([]),
  experience: z.array(ExperienceEntrySchema).default([]),
  education: z.array(EducationEntrySchema).default([]),
  projects: z.array(ProjectEntrySchema).default([]),
  certifications: z.array(CertificationEntrySchema).default([]),
  languages: z.array(z.object({ language: z.string(), proficiency: z.string().default('Proficient') })).default([]),
  totalExperienceMonths: z.number().int().min(0).default(0),
  sectionsDetected: z.array(z.string()).default([]),
  atsReport: ATSParseabilityReportSchema,
  extractedAt: z.string(),
  userCorrections: z.record(z.string(), z.any()).optional(),
  trainingConsentOptIn: z.boolean().default(false),
  trainingConsentTimestamp: z.string().optional(),
});
export type ResumeDocument = z.infer<typeof ResumeDocumentSchema>;
