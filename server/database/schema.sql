-- Resumio Database Schema (Phase 1)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  headline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  profile_completion INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  company_name TEXT NOT NULL,
  company_logo TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  description TEXT DEFAULT '',
  profile_completion INTEGER NOT NULL DEFAULT 40,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Phase 1
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);

-- ============================================================
-- Phase 2 Tables: Candidate Profile Deep Data & Resume Management
-- ============================================================

-- 1. Candidate Education
CREATE TABLE IF NOT EXISTS candidate_education (
  id TEXT PRIMARY KEY,
  candidate_profile_id TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  institution TEXT NOT NULL,
  location TEXT DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT DEFAULT '',
  currently_studying INTEGER NOT NULL DEFAULT 0,
  grade_or_gpa TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_education_profile_id ON candidate_education(candidate_profile_id);

-- 2. Candidate Skills
CREATE TABLE IF NOT EXISTS candidate_skills (
  id TEXT PRIMARY KEY,
  candidate_profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  proficiency TEXT NOT NULL CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON candidate_skills(candidate_profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_candidate_skill ON candidate_skills(candidate_profile_id, lower(name));

-- 3. Candidate Experience
CREATE TABLE IF NOT EXISTS candidate_experience (
  id TEXT PRIMARY KEY,
  candidate_profile_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Other')),
  location TEXT DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT DEFAULT '',
  currently_working INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_experience_profile_id ON candidate_experience(candidate_profile_id);

-- 4. Candidate Projects
CREATE TABLE IF NOT EXISTS candidate_projects (
  id TEXT PRIMARY KEY,
  candidate_profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  technologies TEXT DEFAULT '',
  description TEXT DEFAULT '',
  project_url TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_profile_id ON candidate_projects(candidate_profile_id);

-- 5. Candidate Certifications
CREATE TABLE IF NOT EXISTS candidate_certifications (
  id TEXT PRIMARY KEY,
  candidate_profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  expiration_date TEXT DEFAULT '',
  does_not_expire INTEGER NOT NULL DEFAULT 0,
  credential_id TEXT DEFAULT '',
  credential_url TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_certifications_profile_id ON candidate_certifications(candidate_profile_id);

-- 6. Candidate Resumes
CREATE TABLE IF NOT EXISTS candidate_resumes (
  id TEXT PRIMARY KEY,
  candidate_profile_id TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resumes_profile_id ON candidate_resumes(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_resumes_active ON candidate_resumes(candidate_profile_id, is_active);

-- ============================================================
-- Phase 3 Tables: Job Management & Discovery
-- ============================================================

-- 1. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  recruiter_id TEXT NOT NULL,
  recruiter_profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  responsibilities TEXT DEFAULT '',
  company_name TEXT NOT NULL,
  location TEXT DEFAULT '',
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance')),
  work_mode TEXT NOT NULL CHECK (work_mode IN ('On-site', 'Hybrid', 'Remote')),
  salary_min INTEGER DEFAULT NULL,
  salary_max INTEGER DEFAULT NULL,
  currency TEXT DEFAULT 'INR',
  salary_period TEXT DEFAULT 'year' CHECK (salary_period IN ('year', 'month', 'hour')),
  salary_disclosed INTEGER NOT NULL DEFAULT 1,
  min_experience INTEGER NOT NULL DEFAULT 0,
  max_experience INTEGER DEFAULT NULL,
  qualification TEXT DEFAULT '',
  deadline TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT DEFAULT NULL,
  closed_at TEXT DEFAULT NULL,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recruiter_profile_id) REFERENCES recruiter_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON jobs(published_at);
CREATE INDEX IF NOT EXISTS idx_jobs_work_mode ON jobs(work_mode);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);

-- 2. Job Required Skills Table
CREATE TABLE IF NOT EXISTS job_required_skills (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_required_skills_job_id ON job_required_skills(job_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_job_required_skill ON job_required_skills(job_id, lower(name));

-- 3. Job Preferred Skills Table
CREATE TABLE IF NOT EXISTS job_preferred_skills (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_preferred_skills_job_id ON job_preferred_skills(job_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_job_preferred_skill ON job_preferred_skills(job_id, lower(name));

-- ============================================================
-- Phase 4 Tables: Job Applications & Recruitment Workflow
-- ============================================================

-- 1. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  candidate_profile_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  resume_id TEXT NOT NULL,
  cover_letter TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Withdrawn')),
  rejection_reason TEXT DEFAULT '',
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id),
  UNIQUE (candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);

-- 2. Application Status History / Audit Trail Table
CREATE TABLE IF NOT EXISTS application_status_history (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  old_status TEXT DEFAULT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_by_role TEXT NOT NULL CHECK (changed_by_role IN ('candidate', 'recruiter', 'admin')),
  note TEXT DEFAULT '',
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_app_history_app_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_app_history_changed_at ON application_status_history(changed_at);

-- ============================================================
-- Phase 5 Tables: Resume Parsing & AI Resume Screening
-- ============================================================

-- 1. Resume Parsed Data Table
CREATE TABLE IF NOT EXISTS resume_parsed_data (
  id TEXT PRIMARY KEY,
  resume_id TEXT UNIQUE NOT NULL,
  candidate_id TEXT NOT NULL,
  candidate_profile_id TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  parser_version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'Not Processed' CHECK (status IN ('Not Processed', 'Processing', 'Processed', 'Failed')),
  error_message TEXT DEFAULT '',
  raw_text TEXT DEFAULT '',
  candidate_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  headline TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  skills_json TEXT DEFAULT '[]',
  education_json TEXT DEFAULT '[]',
  experience_json TEXT DEFAULT '[]',
  projects_json TEXT DEFAULT '[]',
  certifications_json TEXT DEFAULT '[]',
  languages_json TEXT DEFAULT '[]',
  achievements_json TEXT DEFAULT '[]',
  confidence_json TEXT DEFAULT '{}',
  sections_detected_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT DEFAULT NULL,
  completed_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parsed_resume_id ON resume_parsed_data(resume_id);
CREATE INDEX IF NOT EXISTS idx_parsed_candidate_id ON resume_parsed_data(candidate_id);
CREATE INDEX IF NOT EXISTS idx_parsed_status ON resume_parsed_data(status);
CREATE INDEX IF NOT EXISTS idx_parsed_file_hash ON resume_parsed_data(file_hash);

-- 2. Resume Screening Table
CREATE TABLE IF NOT EXISTS resume_screenings (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL,
  application_id TEXT DEFAULT NULL,
  job_id TEXT DEFAULT NULL,
  screening_version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'Not Screened' CHECK (status IN ('Not Screened', 'Screening', 'Screened', 'Failed')),
  error_message TEXT DEFAULT '',
  completeness_score INTEGER NOT NULL DEFAULT 0,
  sections_present_json TEXT DEFAULT '[]',
  sections_missing_json TEXT DEFAULT '[]',
  skills_detected_count INTEGER NOT NULL DEFAULT 0,
  experience_years_detected REAL DEFAULT NULL,
  education_level_detected TEXT DEFAULT '',
  screening_observations_json TEXT DEFAULT '[]',
  screening_flags_json TEXT DEFAULT '[]',
  overall_notes TEXT DEFAULT '',
  started_at TEXT DEFAULT NULL,
  completed_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_screenings_resume_id ON resume_screenings(resume_id);
CREATE INDEX IF NOT EXISTS idx_screenings_app_id ON resume_screenings(application_id);
CREATE INDEX IF NOT EXISTS idx_screenings_job_id ON resume_screenings(job_id);
CREATE INDEX IF NOT EXISTS idx_screenings_status ON resume_screenings(status);

-- ============================================================
-- Phase 6 Tables: AI Resume–Job Matching, Ranking & Skill Gap
-- ============================================================

-- 1. Resume-Job Matches Table
CREATE TABLE IF NOT EXISTS resume_job_matches (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  application_id TEXT DEFAULT NULL,
  candidate_id TEXT NOT NULL,
  candidate_profile_id TEXT NOT NULL,
  algorithm_version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'Not Processed' CHECK (status IN ('Not Processed', 'Processing', 'Completed', 'Failed')),
  error_message TEXT DEFAULT '',
  match_score INTEGER NOT NULL DEFAULT 0,
  required_skills_matched_json TEXT DEFAULT '[]',
  required_skills_missing_json TEXT DEFAULT '[]',
  preferred_skills_matched_json TEXT DEFAULT '[]',
  preferred_skills_missing_json TEXT DEFAULT '[]',
  required_skills_score REAL NOT NULL DEFAULT 0,
  preferred_skills_score REAL NOT NULL DEFAULT 0,
  experience_score REAL NOT NULL DEFAULT 0,
  qualification_score REAL NOT NULL DEFAULT 0,
  relevance_score REAL NOT NULL DEFAULT 0,
  experience_assessment TEXT DEFAULT '',
  qualification_assessment TEXT DEFAULT '',
  matching_details_json TEXT DEFAULT '{}',
  started_at TEXT DEFAULT NULL,
  completed_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_matches_resume_id ON resume_job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_matches_job_id ON resume_job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_matches_candidate_id ON resume_job_matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_matches_app_id ON resume_job_matches(application_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON resume_job_matches(job_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON resume_job_matches(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_resume_job_match ON resume_job_matches(resume_id, job_id, algorithm_version);

-- 2. Candidate-Job AI Summaries Table
CREATE TABLE IF NOT EXISTS candidate_job_summaries (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  resume_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  application_id TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'Not Generated' CHECK (status IN ('Not Generated', 'Generating', 'Completed', 'Failed')),
  error_message TEXT DEFAULT '',
  summary_text TEXT DEFAULT '',
  strengths_json TEXT DEFAULT '[]',
  gaps_json TEXT DEFAULT '[]',
  model_version TEXT NOT NULL DEFAULT 'resumio-ai-v1',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (match_id) REFERENCES resume_job_matches(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_summaries_match_id ON candidate_job_summaries(match_id);
CREATE INDEX IF NOT EXISTS idx_summaries_candidate_id ON candidate_job_summaries(candidate_id);
CREATE INDEX IF NOT EXISTS idx_summaries_job_id ON candidate_job_summaries(job_id);
CREATE INDEX IF NOT EXISTS idx_summaries_app_id ON candidate_job_summaries(application_id);

-- 3. Skill Gap Analyses Table
CREATE TABLE IF NOT EXISTS skill_gap_analyses (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  resume_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  application_id TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'Not Generated' CHECK (status IN ('Not Generated', 'Generating', 'Completed', 'Failed')),
  error_message TEXT DEFAULT '',
  overview TEXT DEFAULT '',
  priority_gaps_json TEXT DEFAULT '[]',
  matched_areas_json TEXT DEFAULT '[]',
  recommendations_overview TEXT DEFAULT '',
  model_version TEXT NOT NULL DEFAULT 'resumio-ai-v1',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (match_id) REFERENCES resume_job_matches(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skill_gap_match_id ON skill_gap_analyses(match_id);
CREATE INDEX IF NOT EXISTS idx_skill_gap_candidate_id ON skill_gap_analyses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_skill_gap_job_id ON skill_gap_analyses(job_id);
CREATE INDEX IF NOT EXISTS idx_skill_gap_app_id ON skill_gap_analyses(application_id);

-- ============================================================
-- Phase 7 Tables: Interviews, Notifications, Dashboards & Analytics
-- ============================================================

-- 1. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  recruiter_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('Video', 'Phone', 'In Person')),
  scheduled_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  location TEXT DEFAULT '',
  meeting_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show')),
  cancellation_reason TEXT DEFAULT '',
  reschedule_reason TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interviews_cand_sched ON interviews(candidate_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_rec_sched ON interviews(recruiter_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_app_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- 2. Interview Status History Table
CREATE TABLE IF NOT EXISTS interview_status_history (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,
  old_status TEXT DEFAULT NULL,
  new_status TEXT NOT NULL,
  old_scheduled_at TEXT DEFAULT NULL,
  new_scheduled_at TEXT DEFAULT NULL,
  changed_by TEXT NOT NULL,
  changed_by_role TEXT NOT NULL CHECK (changed_by_role IN ('candidate', 'recruiter', 'admin')),
  note TEXT DEFAULT '',
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_interview_hist_id ON interview_status_history(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_hist_changed ON interview_status_history(changed_at);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('application_status', 'interview_scheduled', 'interview_rescheduled', 'interview_cancelled', 'interview_completed', 'interview_noshow', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT DEFAULT NULL CHECK (related_entity_type IN ('application', 'interview', 'job', 'system') OR related_entity_type IS NULL),
  related_entity_id TEXT DEFAULT NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ============================================================
-- Phase 8 Tables: Advanced AI Recruitment Intelligence
-- ============================================================

-- 1. Natural-Language Candidate Searches
CREATE TABLE IF NOT EXISTS natural_language_searches (
  id TEXT PRIMARY KEY,
  recruiter_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  interpreted_filters_json TEXT NOT NULL DEFAULT '{}',
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nl_search_recruiter ON natural_language_searches(recruiter_id, created_at DESC);

-- 2. AI-Generated Interview Question Sets
CREATE TABLE IF NOT EXISTS interview_question_sets (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  candidate_id TEXT DEFAULT NULL,
  application_id TEXT DEFAULT NULL,
  recruiter_id TEXT NOT NULL,
  questions_json TEXT NOT NULL DEFAULT '{}',
  model_version TEXT NOT NULL DEFAULT 'resumio-ai-v1',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_iq_job_id ON interview_question_sets(job_id);
CREATE INDEX IF NOT EXISTS idx_iq_candidate_id ON interview_question_sets(candidate_id);
CREATE INDEX IF NOT EXISTS idx_iq_application_id ON interview_question_sets(application_id);
CREATE INDEX IF NOT EXISTS idx_iq_recruiter_id ON interview_question_sets(recruiter_id);

-- 3. Resume Improvement Analyses
CREATE TABLE IF NOT EXISTS resume_improvement_analyses (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  job_id TEXT DEFAULT NULL,
  overall_feedback TEXT NOT NULL DEFAULT '',
  sections_json TEXT NOT NULL DEFAULT '[]',
  target_job_comparison_json TEXT DEFAULT NULL,
  model_version TEXT NOT NULL DEFAULT 'resumio-ai-v1',
  status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Processing', 'Completed', 'Failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ria_resume_id ON resume_improvement_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_ria_candidate_id ON resume_improvement_analyses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ria_job_id ON resume_improvement_analyses(job_id);

-- 4. Resume Duplicate Matches
CREATE TABLE IF NOT EXISTS resume_duplicate_matches (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL,
  matched_resume_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  matched_candidate_id TEXT NOT NULL,
  similarity_type TEXT NOT NULL CHECK (similarity_type IN ('Exact Duplicate', 'Likely Duplicate', 'Not Duplicate')),
  similarity_score REAL DEFAULT NULL,
  detection_method TEXT NOT NULL CHECK (detection_method IN ('SHA-256 Hash', 'Content Text Cosine/Jaccard', 'Hybrid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (matched_resume_id) REFERENCES candidate_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (matched_candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rdm_resume_id ON resume_duplicate_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_rdm_matched_resume_id ON resume_duplicate_matches(matched_resume_id);
CREATE INDEX IF NOT EXISTS idx_rdm_candidate_id ON resume_duplicate_matches(candidate_id);




