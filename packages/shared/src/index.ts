import { z } from 'zod';

export * from './resumeDocument.js';

// ==========================================
// User & Auth Schemas
// ==========================================
export const UserRoleSchema = z.enum(['candidate', 'recruiter', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const CandidateRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const RecruiterRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ==========================================
// ML Service Contracts (Pydantic / TS mirrors)
// ==========================================
export const MLParseRequestSchema = z.object({
  fileBase64: z.string().optional(),
  rawText: z.string().optional(),
  fileName: z.string().optional(),
});

export const MLEmbedRequestSchema = z.object({
  texts: z.array(z.string()).min(1),
  model: z.string().default('sentence-transformers/all-MiniLM-L6-v2'),
});

export const MLMatchRequestSchema = z.object({
  resumeText: z.string(),
  jobDescription: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()).default([]),
  candidateExperienceYears: z.number().default(0),
  jobMinExperienceYears: z.number().default(0),
});

export const MLExplainRequestSchema = z.object({
  matchScore: z.number(),
  breakdown: z.record(z.string(), z.number()),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

// ==========================================
// RFC 9457 Problem Details Schema
// ==========================================
export const ProblemDetailsSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  instance: z.string().optional(),
  code: z.string().optional(),
  invalidParams: z.array(z.object({
    name: z.string(),
    reason: z.string(),
  })).optional(),
});
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
