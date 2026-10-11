import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// ============================================================
// 1. USER MODEL
// ============================================================
export interface IUser extends Document {
  _id: string;
  id: string;
  email: string;
  password_hash: string;
  google_id?: string | null;
  role: 'candidate' | 'recruiter' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password_hash: { type: String, default: '' },
    google_id: { type: String, default: null, sparse: true },
    role: { type: String, required: true, enum: ['candidate', 'recruiter', 'admin'], index: true },
    status: { type: String, required: true, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual('id').get(function () {
  return this._id;
});

// ============================================================
// 2. CANDIDATE PROFILE MODEL (WITH EMBEDDED SUB-DOCUMENTS)
// ============================================================
export interface ICandidateEducation {
  _id: string;
  id?: string;
  institution: string;
  degree: string;
  field_of_study: string;
  location?: string;
  start_date: string;
  end_date?: string;
  currently_studying?: number;
  grade_or_gpa?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ICandidateSkill {
  _id: string;
  id?: string;
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  created_at?: string;
  updated_at?: string;
}

export interface ICandidateExperience {
  _id: string;
  id?: string;
  job_title: string;
  company: string;
  employment_type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Freelance' | 'Other';
  location?: string;
  start_date: string;
  end_date?: string;
  currently_working?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ICandidateProject {
  _id: string;
  id?: string;
  name: string;
  role?: string;
  technologies?: string;
  description?: string;
  project_url?: string;
  github_url?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ICandidateCertification {
  _id: string;
  id?: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  does_not_expire?: number;
  credential_id?: string;
  credential_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ICandidateResume {
  _id: string;
  id?: string;
  original_filename: string;
  stored_filename: string;
  file_type: string;
  file_size: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface ICandidateProfile extends Document {
  _id: string;
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  photo_url?: string;
  profile_completion: number;
  created_at: string;
  updated_at: string;
  education: ICandidateEducation[];
  skills: ICandidateSkill[];
  experience: ICandidateExperience[];
  projects: ICandidateProject[];
  certifications: ICandidateCertification[];
  resumes: ICandidateResume[];
}

export const CandidateEducationSchema = new Schema<ICandidateEducation>({
  _id: { type: String, default: () => crypto.randomUUID() },
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field_of_study: { type: String, required: true },
  location: { type: String, default: '' },
  start_date: { type: String, required: true },
  end_date: { type: String, default: '' },
  currently_studying: { type: Number, default: 0 },
  grade_or_gpa: { type: String, default: '' },
  description: { type: String, default: '' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
CandidateEducationSchema.virtual('id').get(function() { return this._id; });

export const CandidateSkillSchema = new Schema<ICandidateSkill>({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true, trim: true },
  proficiency: { type: String, required: true, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
CandidateSkillSchema.virtual('id').get(function() { return this._id; });

export const CandidateExperienceSchema = new Schema<ICandidateExperience>({
  _id: { type: String, default: () => crypto.randomUUID() },
  job_title: { type: String, required: true },
  company: { type: String, required: true },
  employment_type: { type: String, required: true, enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Other'] },
  location: { type: String, default: '' },
  start_date: { type: String, required: true },
  end_date: { type: String, default: '' },
  currently_working: { type: Number, default: 0 },
  description: { type: String, default: '' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
CandidateExperienceSchema.virtual('id').get(function() { return this._id; });

export const CandidateProjectSchema = new Schema<ICandidateProject>({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  role: { type: String, default: '' },
  technologies: { type: String, default: '' },
  description: { type: String, default: '' },
  project_url: { type: String, default: '' },
  github_url: { type: String, default: '' },
  start_date: { type: String, default: '' },
  end_date: { type: String, default: '' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
CandidateProjectSchema.virtual('id').get(function() { return this._id; });

export const CandidateCertificationSchema = new Schema<ICandidateCertification>({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  issuing_organization: { type: String, required: true },
  issue_date: { type: String, required: true },
  expiration_date: { type: String, default: '' },
  does_not_expire: { type: Number, default: 0 },
  credential_id: { type: String, default: '' },
  credential_url: { type: String, default: '' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
CandidateCertificationSchema.virtual('id').get(function() { return this._id; });

export const CandidateResumeSchema = new Schema<ICandidateResume>({
  _id: { type: String, default: () => crypto.randomUUID() },
  original_filename: { type: String, required: true },
  stored_filename: { type: String, required: true },
  file_type: { type: String, required: true },
  file_size: { type: Number, required: true },
  is_active: { type: Number, default: 1 },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
CandidateResumeSchema.virtual('id').get(function() { return this._id; });

export const CandidateProfileSchema = new Schema<ICandidateProfile>({
  _id: { type: String, default: () => crypto.randomUUID() },
  user_id: { type: String, required: true, unique: true, ref: 'User', index: true },
  full_name: { type: String, required: true },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  headline: { type: String, default: '' },
  bio: { type: String, default: '' },
  photo_url: { type: String, default: '' },
  profile_completion: { type: Number, default: 30 },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
  education: { type: [CandidateEducationSchema], default: [] },
  skills: { type: [CandidateSkillSchema], default: [] },
  experience: { type: [CandidateExperienceSchema], default: [] },
  projects: { type: [CandidateProjectSchema], default: [] },
  certifications: { type: [CandidateCertificationSchema], default: [] },
  resumes: { type: [CandidateResumeSchema], default: [] },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

CandidateProfileSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 3. RECRUITER PROFILE MODEL
// ============================================================
export interface IRecruiterProfile extends Document {
  _id: string;
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  company_name: string;
  company_logo?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export const RecruiterProfileSchema = new Schema<IRecruiterProfile>({
  _id: { type: String, default: () => crypto.randomUUID() },
  user_id: { type: String, required: true, unique: true, ref: 'User', index: true },
  full_name: { type: String, required: true },
  phone: { type: String, default: '' },
  company_name: { type: String, required: true, index: true },
  company_logo: { type: String, default: '' },
  industry: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  description: { type: String, default: '' },
  profile_completion: { type: Number, default: 40 },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

RecruiterProfileSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 4. JOB MODEL (WITH EMBEDDED REQUIRED & PREFERRED SKILLS)
// ============================================================
export interface IJobSkill {
  _id: string;
  id?: string;
  name: string;
  minimum_years?: number;
  created_at?: string;
}

export interface IJob extends Document {
  _id: string;
  id: string;
  recruiter_id: string;
  recruiter_profile_id: string;
  title: string;
  description: string;
  responsibilities?: string;
  company_name: string;
  location?: string;
  employment_type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Freelance';
  work_mode: 'On-site' | 'Hybrid' | 'Remote';
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  salary_period?: 'year' | 'month' | 'hour';
  salary_disclosed: number;
  min_experience: number;
  max_experience?: number | null;
  qualification?: string;
  deadline?: string;
  status: 'Draft' | 'Published' | 'Closed';
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  closed_at?: string | null;
  required_skills: IJobSkill[];
  preferred_skills: IJobSkill[];
}

export const JobSkillSchema = new Schema<IJobSkill>({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true, trim: true },
  minimum_years: { type: Number, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
JobSkillSchema.virtual('id').get(function() { return this._id; });

export const JobSchema = new Schema<IJob>({
  _id: { type: String, default: () => crypto.randomUUID() },
  recruiter_id: { type: String, required: true, ref: 'User', index: true },
  recruiter_profile_id: { type: String, required: true, ref: 'RecruiterProfile' },
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  responsibilities: { type: String, default: '' },
  company_name: { type: String, required: true, index: true },
  location: { type: String, default: '', index: true },
  employment_type: { type: String, required: true, enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'], index: true },
  work_mode: { type: String, required: true, enum: ['On-site', 'Hybrid', 'Remote'], index: true },
  salary_min: { type: Number, default: null },
  salary_max: { type: Number, default: null },
  currency: { type: String, default: 'INR' },
  salary_period: { type: String, enum: ['year', 'month', 'hour'], default: 'year' },
  salary_disclosed: { type: Number, default: 1 },
  min_experience: { type: Number, default: 0 },
  max_experience: { type: Number, default: null },
  qualification: { type: String, default: '' },
  deadline: { type: String, default: '' },
  status: { type: String, required: true, enum: ['Draft', 'Published', 'Closed'], default: 'Draft', index: true },
  created_at: { type: String, default: () => new Date().toISOString(), index: true },
  updated_at: { type: String, default: () => new Date().toISOString() },
  published_at: { type: String, default: null, index: true },
  closed_at: { type: String, default: null },
  required_skills: { type: [JobSkillSchema], default: [] },
  preferred_skills: { type: [JobSkillSchema], default: [] },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

JobSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 5. APPLICATION MODEL (WITH EMBEDDED STATUS HISTORY)
// ============================================================
export interface IApplicationStatusHistory {
  _id: string;
  id?: string;
  old_status?: string | null;
  new_status: string;
  changed_by: string;
  changed_by_role: 'candidate' | 'recruiter' | 'admin';
  note?: string;
  changed_at: string;
}

export interface IApplication extends Document {
  _id: string;
  id: string;
  candidate_id: string;
  candidate_profile_id: string;
  job_id: string;
  resume_id: string;
  cover_letter?: string;
  status: 'Applied' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Withdrawn';
  rejection_reason?: string;
  applied_at: string;
  updated_at: string;
  status_history: IApplicationStatusHistory[];
}

export const ApplicationStatusHistorySchema = new Schema<IApplicationStatusHistory>({
  _id: { type: String, default: () => crypto.randomUUID() },
  old_status: { type: String, default: null },
  new_status: { type: String, required: true },
  changed_by: { type: String, required: true, ref: 'User' },
  changed_by_role: { type: String, required: true, enum: ['candidate', 'recruiter', 'admin'] },
  note: { type: String, default: '' },
  changed_at: { type: String, default: () => new Date().toISOString(), index: true },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
ApplicationStatusHistorySchema.virtual('id').get(function() { return this._id; });

export const ApplicationSchema = new Schema<IApplication>({
  _id: { type: String, default: () => crypto.randomUUID() },
  candidate_id: { type: String, required: true, ref: 'User', index: true },
  candidate_profile_id: { type: String, required: true, ref: 'CandidateProfile' },
  job_id: { type: String, required: true, ref: 'Job', index: true },
  resume_id: { type: String, required: true },
  cover_letter: { type: String, default: '' },
  status: { type: String, required: true, enum: ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Withdrawn'], default: 'Applied', index: true },
  rejection_reason: { type: String, default: '' },
  applied_at: { type: String, default: () => new Date().toISOString(), index: true },
  updated_at: { type: String, default: () => new Date().toISOString() },
  status_history: { type: [ApplicationStatusHistorySchema], default: [] },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

ApplicationSchema.index({ candidate_id: 1, job_id: 1 }, { unique: true });
ApplicationSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 6. RESUME PARSED DATA MODEL
// ============================================================
export interface IResumeParsedData extends Document {
  _id: string;
  id: string;
  resume_id: string;
  candidate_id: string;
  candidate_profile_id: string;
  file_hash: string;
  parser_version: string;
  status: 'Not Processed' | 'Processing' | 'Processed' | 'Failed';
  error_message?: string;
  raw_text?: string;
  candidate_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills_json?: string;
  education_json?: string;
  experience_json?: string;
  projects_json?: string;
  certifications_json?: string;
  languages_json?: string;
  achievements_json?: string;
  confidence_json?: string;
  sections_detected_count: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const ResumeParsedDataSchema = new Schema<IResumeParsedData>({
  _id: { type: String, default: () => crypto.randomUUID() },
  resume_id: { type: String, required: true, unique: true, index: true },
  candidate_id: { type: String, required: true, ref: 'User', index: true },
  candidate_profile_id: { type: String, required: true, ref: 'CandidateProfile' },
  file_hash: { type: String, required: true, index: true },
  parser_version: { type: String, default: '1.0.0' },
  status: { type: String, required: true, enum: ['Not Processed', 'Processing', 'Processed', 'Failed'], default: 'Not Processed', index: true },
  error_message: { type: String, default: '' },
  raw_text: { type: String, default: '' },
  candidate_name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  headline: { type: String, default: '' },
  summary: { type: String, default: '' },
  skills_json: { type: String, default: '[]' },
  education_json: { type: String, default: '[]' },
  experience_json: { type: String, default: '[]' },
  projects_json: { type: String, default: '[]' },
  certifications_json: { type: String, default: '[]' },
  languages_json: { type: String, default: '[]' },
  achievements_json: { type: String, default: '[]' },
  confidence_json: { type: String, default: '{}' },
  sections_detected_count: { type: Number, default: 0 },
  started_at: { type: String, default: null },
  completed_at: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

ResumeParsedDataSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 7. RESUME SCREENING MODEL
// ============================================================
export interface IResumeScreening extends Document {
  _id: string;
  id: string;
  resume_id: string;
  application_id?: string | null;
  job_id?: string | null;
  screening_version: string;
  status: 'Not Screened' | 'Screening' | 'Screened' | 'Failed';
  error_message?: string;
  completeness_score: number;
  sections_present_json?: string;
  sections_missing_json?: string;
  skills_detected_count: number;
  experience_years_detected?: number | null;
  education_level_detected?: string;
  screening_observations_json?: string;
  screening_flags_json?: string;
  overall_notes?: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const ResumeScreeningSchema = new Schema<IResumeScreening>({
  _id: { type: String, default: () => crypto.randomUUID() },
  resume_id: { type: String, required: true, index: true },
  application_id: { type: String, default: null, index: true },
  job_id: { type: String, default: null, index: true },
  screening_version: { type: String, default: '1.0.0' },
  status: { type: String, required: true, enum: ['Not Screened', 'Screening', 'Screened', 'Failed'], default: 'Not Screened', index: true },
  error_message: { type: String, default: '' },
  completeness_score: { type: Number, default: 0 },
  sections_present_json: { type: String, default: '[]' },
  sections_missing_json: { type: String, default: '[]' },
  skills_detected_count: { type: Number, default: 0 },
  experience_years_detected: { type: Number, default: null },
  education_level_detected: { type: String, default: '' },
  screening_observations_json: { type: String, default: '[]' },
  screening_flags_json: { type: String, default: '[]' },
  overall_notes: { type: String, default: '' },
  started_at: { type: String, default: null },
  completed_at: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

ResumeScreeningSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 8. RESUME JOB MATCH MODEL
// ============================================================
export interface IResumeJobMatch extends Document {
  _id: string;
  id: string;
  resume_id: string;
  job_id: string;
  application_id?: string | null;
  candidate_id: string;
  candidate_profile_id: string;
  algorithm_version: string;
  status: 'Not Processed' | 'Processing' | 'Completed' | 'Failed';
  error_message?: string;
  match_score: number;
  required_skills_matched_json?: string;
  required_skills_missing_json?: string;
  preferred_skills_matched_json?: string;
  preferred_skills_missing_json?: string;
  required_skills_score: number;
  preferred_skills_score: number;
  experience_score: number;
  qualification_score: number;
  relevance_score: number;
  experience_assessment?: string;
  qualification_assessment?: string;
  matching_details_json?: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const ResumeJobMatchSchema = new Schema<IResumeJobMatch>({
  _id: { type: String, default: () => crypto.randomUUID() },
  resume_id: { type: String, required: true, index: true },
  job_id: { type: String, required: true, index: true },
  application_id: { type: String, default: null, index: true },
  candidate_id: { type: String, required: true, ref: 'User', index: true },
  candidate_profile_id: { type: String, required: true, ref: 'CandidateProfile' },
  algorithm_version: { type: String, default: '1.0.0' },
  status: { type: String, required: true, enum: ['Not Processed', 'Processing', 'Completed', 'Failed'], default: 'Not Processed', index: true },
  error_message: { type: String, default: '' },
  match_score: { type: Number, default: 0 },
  required_skills_matched_json: { type: String, default: '[]' },
  required_skills_missing_json: { type: String, default: '[]' },
  preferred_skills_matched_json: { type: String, default: '[]' },
  preferred_skills_missing_json: { type: String, default: '[]' },
  required_skills_score: { type: Number, default: 0 },
  preferred_skills_score: { type: Number, default: 0 },
  experience_score: { type: Number, default: 0 },
  qualification_score: { type: Number, default: 0 },
  relevance_score: { type: Number, default: 0 },
  experience_assessment: { type: String, default: '' },
  qualification_assessment: { type: String, default: '' },
  matching_details_json: { type: String, default: '{}' },
  started_at: { type: String, default: null },
  completed_at: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

ResumeJobMatchSchema.index({ resume_id: 1, job_id: 1, algorithm_version: 1 }, { unique: true });
ResumeJobMatchSchema.index({ job_id: 1, match_score: -1 });
ResumeJobMatchSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 9. CANDIDATE JOB SUMMARY MODEL
// ============================================================
export interface ICandidateJobSummary extends Document {
  _id: string;
  id: string;
  match_id: string;
  candidate_id: string;
  resume_id: string;
  job_id: string;
  application_id?: string | null;
  status: 'Not Generated' | 'Generating' | 'Completed' | 'Failed';
  error_message?: string;
  summary_text?: string;
  strengths_json?: string;
  gaps_json?: string;
  model_version: string;
  created_at: string;
  updated_at: string;
}

export const CandidateJobSummarySchema = new Schema<ICandidateJobSummary>({
  _id: { type: String, default: () => crypto.randomUUID() },
  match_id: { type: String, required: true, ref: 'ResumeJobMatch', index: true },
  candidate_id: { type: String, required: true, ref: 'User', index: true },
  resume_id: { type: String, required: true },
  job_id: { type: String, required: true, ref: 'Job', index: true },
  application_id: { type: String, default: null, index: true },
  status: { type: String, required: true, enum: ['Not Generated', 'Generating', 'Completed', 'Failed'], default: 'Not Generated' },
  error_message: { type: String, default: '' },
  summary_text: { type: String, default: '' },
  strengths_json: { type: String, default: '[]' },
  gaps_json: { type: String, default: '[]' },
  model_version: { type: String, default: 'resumio-ai-v1' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

CandidateJobSummarySchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 10. SKILL GAP ANALYSIS MODEL
// ============================================================
export interface ISkillGapAnalysis extends Document {
  _id: string;
  id: string;
  match_id: string;
  candidate_id: string;
  resume_id: string;
  job_id: string;
  application_id?: string | null;
  status: 'Not Generated' | 'Generating' | 'Completed' | 'Failed';
  error_message?: string;
  overview?: string;
  priority_gaps_json?: string;
  matched_areas_json?: string;
  recommendations_overview?: string;
  model_version: string;
  created_at: string;
  updated_at: string;
}

export const SkillGapAnalysisSchema = new Schema<ISkillGapAnalysis>({
  _id: { type: String, default: () => crypto.randomUUID() },
  match_id: { type: String, required: true, ref: 'ResumeJobMatch', index: true },
  candidate_id: { type: String, required: true, ref: 'User', index: true },
  resume_id: { type: String, required: true },
  job_id: { type: String, required: true, ref: 'Job', index: true },
  application_id: { type: String, default: null, index: true },
  status: { type: String, required: true, enum: ['Not Generated', 'Generating', 'Completed', 'Failed'], default: 'Not Generated' },
  error_message: { type: String, default: '' },
  overview: { type: String, default: '' },
  priority_gaps_json: { type: String, default: '[]' },
  matched_areas_json: { type: String, default: '[]' },
  recommendations_overview: { type: String, default: '' },
  model_version: { type: String, default: 'resumio-ai-v1' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

SkillGapAnalysisSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 11. INTERVIEW MODEL (WITH EMBEDDED STATUS HISTORY)
// ============================================================
export interface IInterviewStatusHistory {
  _id: string;
  id?: string;
  old_status?: string | null;
  new_status: string;
  old_scheduled_at?: string | null;
  new_scheduled_at?: string | null;
  changed_by: string;
  changed_by_role: 'candidate' | 'recruiter' | 'admin';
  note?: string;
  changed_at: string;
}

export interface IInterview extends Document {
  _id: string;
  id: string;
  application_id: string;
  candidate_id: string;
  recruiter_id: string;
  job_id: string;
  title: string;
  interview_type: 'Video' | 'Phone' | 'In Person';
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  meeting_url?: string;
  description?: string;
  status: 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled' | 'No Show';
  cancellation_reason?: string;
  reschedule_reason?: string;
  created_at: string;
  updated_at: string;
  status_history: IInterviewStatusHistory[];
}

export const InterviewStatusHistorySchema = new Schema<IInterviewStatusHistory>({
  _id: { type: String, default: () => crypto.randomUUID() },
  old_status: { type: String, default: null },
  new_status: { type: String, required: true },
  old_scheduled_at: { type: String, default: null },
  new_scheduled_at: { type: String, default: null },
  changed_by: { type: String, required: true, ref: 'User' },
  changed_by_role: { type: String, required: true, enum: ['candidate', 'recruiter', 'admin'] },
  note: { type: String, default: '' },
  changed_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
InterviewStatusHistorySchema.virtual('id').get(function() { return this._id; });

export const InterviewSchema = new Schema<IInterview>({
  _id: { type: String, default: () => crypto.randomUUID() },
  application_id: { type: String, required: true, ref: 'Application', index: true },
  candidate_id: { type: String, required: true, ref: 'User', index: true },
  recruiter_id: { type: String, required: true, ref: 'User', index: true },
  job_id: { type: String, required: true, ref: 'Job', index: true },
  title: { type: String, required: true },
  interview_type: { type: String, required: true, enum: ['Video', 'Phone', 'In Person'] },
  scheduled_at: { type: String, required: true, index: true },
  duration_minutes: { type: Number, default: 45 },
  location: { type: String, default: '' },
  meeting_url: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, required: true, enum: ['Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'], default: 'Scheduled', index: true },
  cancellation_reason: { type: String, default: '' },
  reschedule_reason: { type: String, default: '' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
  status_history: { type: [InterviewStatusHistorySchema], default: [] },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

InterviewSchema.index({ candidate_id: 1, scheduled_at: 1 });
InterviewSchema.index({ recruiter_id: 1, scheduled_at: 1 });
InterviewSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 12. NOTIFICATION MODEL
// ============================================================
export interface INotification extends Document {
  _id: string;
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  is_read: number;
  created_at: string;
}

export const NotificationSchema = new Schema<INotification>({
  _id: { type: String, default: () => crypto.randomUUID() },
  user_id: { type: String, required: true, ref: 'User', index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  related_entity_type: { type: String, default: null },
  related_entity_id: { type: String, default: null },
  is_read: { type: Number, required: true, enum: [0, 1], default: 0, index: true },
  created_at: { type: String, default: () => new Date().toISOString(), index: true },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

NotificationSchema.index({ user_id: 1, is_read: 1 });
NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 13. AUDIT LOG MODEL
// ============================================================
export interface IAuditLog extends Document {
  _id: string;
  id: string;
  user_id?: string | null;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  details?: any;
  created_at: string;
}

export const AuditLogSchema = new Schema<IAuditLog>({
  _id: { type: String, default: () => crypto.randomUUID() },
  user_id: { type: String, default: null, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  resource_type: { type: String, default: '' },
  resource_id: { type: String, default: '' },
  ip_address: { type: String, default: '' },
  details: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: String, default: () => new Date().toISOString(), index: true },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

AuditLogSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// 14. ADVANCED AI RECRUITMENT INTELLIGENCE MODELS
// ============================================================
export interface INaturalLanguageSearch extends Document {
  _id: string;
  id: string;
  recruiter_id: string;
  query_text: string;
  interpreted_filters_json: string;
  results_count: number;
  created_at: string;
}

export const NaturalLanguageSearchSchema = new Schema<INaturalLanguageSearch>({
  _id: { type: String, default: () => crypto.randomUUID() },
  recruiter_id: { type: String, required: true, ref: 'User', index: true },
  query_text: { type: String, required: true },
  interpreted_filters_json: { type: String, default: '{}' },
  results_count: { type: Number, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString(), index: true },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
NaturalLanguageSearchSchema.virtual('id').get(function () { return this._id; });

export interface IInterviewQuestionSet extends Document {
  _id: string;
  id: string;
  job_id: string;
  candidate_id?: string | null;
  application_id?: string | null;
  recruiter_id: string;
  questions_json: string;
  model_version: string;
  created_at: string;
  updated_at: string;
}

export const InterviewQuestionSetSchema = new Schema<IInterviewQuestionSet>({
  _id: { type: String, default: () => crypto.randomUUID() },
  job_id: { type: String, required: true, ref: 'Job', index: true },
  candidate_id: { type: String, default: null, ref: 'User', index: true },
  application_id: { type: String, default: null, ref: 'Application', index: true },
  recruiter_id: { type: String, required: true, ref: 'User', index: true },
  questions_json: { type: String, default: '{}' },
  model_version: { type: String, default: 'resumio-ai-v1' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
InterviewQuestionSetSchema.virtual('id').get(function () { return this._id; });

export interface IResumeImprovementAnalysis extends Document {
  _id: string;
  id: string;
  resume_id: string;
  candidate_id: string;
  job_id?: string | null;
  overall_feedback: string;
  sections_json: string;
  target_job_comparison_json?: string | null;
  model_version: string;
  status: 'Processing' | 'Completed' | 'Failed';
  created_at: string;
  updated_at: string;
}

export const ResumeImprovementAnalysisSchema = new Schema<IResumeImprovementAnalysis>({
  _id: { type: String, default: () => crypto.randomUUID() },
  resume_id: { type: String, required: true, index: true },
  candidate_id: { type: String, required: true, ref: 'User', index: true },
  job_id: { type: String, default: null, index: true },
  overall_feedback: { type: String, default: '' },
  sections_json: { type: String, default: '[]' },
  target_job_comparison_json: { type: String, default: null },
  model_version: { type: String, default: 'resumio-ai-v1' },
  status: { type: String, required: true, enum: ['Processing', 'Completed', 'Failed'], default: 'Completed' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
ResumeImprovementAnalysisSchema.virtual('id').get(function () { return this._id; });

export interface IResumeDuplicateMatch extends Document {
  _id: string;
  id: string;
  resume_id: string;
  matched_resume_id: string;
  candidate_id: string;
  matched_candidate_id: string;
  similarity_type: 'Exact Duplicate' | 'Likely Duplicate' | 'Not Duplicate';
  similarity_score?: number | null;
  detection_method: 'SHA-256 Hash' | 'Content Text Cosine/Jaccard' | 'Hybrid';
  created_at: string;
}

export const ResumeDuplicateMatchSchema = new Schema<IResumeDuplicateMatch>({
  _id: { type: String, default: () => crypto.randomUUID() },
  resume_id: { type: String, required: true, index: true },
  matched_resume_id: { type: String, required: true, index: true },
  candidate_id: { type: String, required: true, ref: 'User', index: true },
  matched_candidate_id: { type: String, required: true, ref: 'User' },
  similarity_type: { type: String, required: true, enum: ['Exact Duplicate', 'Likely Duplicate', 'Not Duplicate'] },
  similarity_score: { type: Number, default: null },
  detection_method: { type: String, required: true, enum: ['SHA-256 Hash', 'Content Text Cosine/Jaccard', 'Hybrid'] },
  created_at: { type: String, default: () => new Date().toISOString() },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
ResumeDuplicateMatchSchema.virtual('id').get(function () { return this._id; });

// ============================================================
// MODEL EXPORTS
// ============================================================
export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const CandidateProfileModel: Model<ICandidateProfile> = mongoose.models.CandidateProfile || mongoose.model<ICandidateProfile>('CandidateProfile', CandidateProfileSchema);
export const RecruiterProfileModel: Model<IRecruiterProfile> = mongoose.models.RecruiterProfile || mongoose.model<IRecruiterProfile>('RecruiterProfile', RecruiterProfileSchema);
export const JobModel: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
export const ApplicationModel: Model<IApplication> = mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
export const ResumeParsedDataModel: Model<IResumeParsedData> = mongoose.models.ResumeParsedData || mongoose.model<IResumeParsedData>('ResumeParsedData', ResumeParsedDataSchema);
export const ResumeScreeningModel: Model<IResumeScreening> = mongoose.models.ResumeScreening || mongoose.model<IResumeScreening>('ResumeScreening', ResumeScreeningSchema);
export const ResumeJobMatchModel: Model<IResumeJobMatch> = mongoose.models.ResumeJobMatch || mongoose.model<IResumeJobMatch>('ResumeJobMatch', ResumeJobMatchSchema);
export const CandidateJobSummaryModel: Model<ICandidateJobSummary> = mongoose.models.CandidateJobSummary || mongoose.model<ICandidateJobSummary>('CandidateJobSummary', CandidateJobSummarySchema);
export const SkillGapAnalysisModel: Model<ISkillGapAnalysis> = mongoose.models.SkillGapAnalysis || mongoose.model<ISkillGapAnalysis>('SkillGapAnalysis', SkillGapAnalysisSchema);
export const InterviewModel: Model<IInterview> = mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
export const NotificationModel: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLogModel: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const NaturalLanguageSearchModel: Model<INaturalLanguageSearch> = mongoose.models.NaturalLanguageSearch || mongoose.model<INaturalLanguageSearch>('NaturalLanguageSearch', NaturalLanguageSearchSchema);
export const InterviewQuestionSetModel: Model<IInterviewQuestionSet> = mongoose.models.InterviewQuestionSet || mongoose.model<IInterviewQuestionSet>('InterviewQuestionSet', InterviewQuestionSetSchema);
export const ResumeImprovementAnalysisModel: Model<IResumeImprovementAnalysis> = mongoose.models.ResumeImprovementAnalysis || mongoose.model<IResumeImprovementAnalysis>('ResumeImprovementAnalysis', ResumeImprovementAnalysisSchema);
export const ResumeDuplicateMatchModel: Model<IResumeDuplicateMatch> = mongoose.models.ResumeDuplicateMatch || mongoose.model<IResumeDuplicateMatch>('ResumeDuplicateMatch', ResumeDuplicateMatchSchema);
