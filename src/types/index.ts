export type Role = 'candidate' | 'recruiter' | 'admin';

export type Theme = 'light' | 'dark';

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview'
  | 'Offered'
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn'
  | 'Active';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  avatar?: string;
  company?: string;
  profileCompletion: number;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  photo_url: string;
  profile_completion: number;
  created_at: string;
  updated_at: string;
  email?: string;
}

export interface CandidateEducation {
  id: string;
  candidate_profile_id: string;
  degree: string;
  field_of_study: string;
  institution: string;
  location?: string;
  start_date: string;
  end_date?: string;
  currently_studying: number | boolean;
  grade_or_gpa?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface CandidateSkill {
  id: string;
  candidate_profile_id: string;
  name: string;
  proficiency: SkillProficiency;
  created_at: string;
  updated_at: string;
}

export type EmploymentType = 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Freelance' | 'Other';

export interface CandidateExperience {
  id: string;
  candidate_profile_id: string;
  job_title: string;
  company: string;
  employment_type: EmploymentType;
  location?: string;
  start_date: string;
  end_date?: string;
  currently_working: number | boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateProject {
  id: string;
  candidate_profile_id: string;
  name: string;
  role?: string;
  technologies?: string;
  description?: string;
  project_url?: string;
  github_url?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateCertification {
  id: string;
  candidate_profile_id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  does_not_expire: number | boolean;
  credential_id?: string;
  credential_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateResume {
  id: string;
  candidate_profile_id?: string;
  original_filename: string;
  stored_filename?: string;
  file_type: 'PDF' | 'DOCX' | 'DOC';
  file_size: number;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

export interface FullCandidateProfileData {
  profile: CandidateProfile;
  education: CandidateEducation[];
  skills: CandidateSkill[];
  experience: CandidateExperience[];
  projects: CandidateProject[];
  certifications: CandidateCertification[];
  resume: CandidateResume | null;
  completion: number;
}

export interface RecruiterProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  company_name: string;
  company_logo: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalUsers: number;
  candidatesCount: number;
  recruitersCount: number;
  activeUsersCount: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string;
  name: string;
  company: string | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  profile?: CandidateProfile | RecruiterProfile;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  description?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: 'match' | 'interview' | 'status' | 'system';
}

export interface SkillItem {
  name: string;
  match: boolean;
  level: 'Beginner' | 'Familiar' | 'Proficient' | 'Expert';
}

export interface Candidate {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  experienceYears: number;
  aiScore: number;
  matchTier: 'excellent' | 'strong' | 'good' | 'moderate' | 'low';
  status: ApplicationStatus;
  appliedJob: string;
  appliedDate: string;
  education: string;
  salaryExpectation: string;
  resumeFileName: string;
  summary: string;
  skills: SkillItem[];
  topStrengths: string[];
  skillGaps: string[];
}

export type JobStatus = 'Draft' | 'Published' | 'Closed';
export type WorkMode = 'On-site' | 'Hybrid' | 'Remote';
export type JobEmploymentType = 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Freelance';
export type SalaryPeriod = 'Yearly' | 'Monthly' | 'Hourly' | 'year' | 'month' | 'hour';

export interface JobPosting {
  id: string;
  recruiter_id?: string;
  recruiter_profile_id?: string;
  title: string;
  description: string;
  responsibilities?: string;
  company_name?: string;
  companyName?: string;
  company_logo?: string;
  industry?: string;
  company_website?: string;
  company_description?: string;
  recruiter_name?: string;
  location: string;
  employment_type?: JobEmploymentType;
  employmentType?: JobEmploymentType;
  work_mode?: WorkMode;
  workMode?: WorkMode;
  salary_min?: number | null;
  salaryMin?: number | null;
  salary_max?: number | null;
  salaryMax?: number | null;
  currency?: string;
  salary_period?: SalaryPeriod;
  salaryPeriod?: SalaryPeriod;
  salary_disclosed?: boolean;
  salaryDisclosed?: boolean;
  min_experience?: number | null;
  minExperience?: number | null;
  max_experience?: number | null;
  maxExperience?: number | null;
  qualification?: string;
  deadline?: string;
  status: JobStatus;
  created_at: string;
  updated_at?: string;
  published_at?: string | null;
  closed_at?: string | null;
  required_skills?: string[];
  requiredSkills?: string[];
  preferred_skills?: string[];
  preferredSkills?: string[];
}

export interface JobFormData {
  title: string;
  company_name?: string;
  companyName?: string;
  description: string;
  responsibilities?: string;
  location: string;
  employment_type?: JobEmploymentType;
  employmentType?: JobEmploymentType;
  work_mode?: WorkMode;
  workMode?: WorkMode;
  salary_min?: number | null;
  salaryMin?: number | null;
  salary_max?: number | null;
  salaryMax?: number | null;
  currency?: string;
  salary_period?: SalaryPeriod;
  salaryPeriod?: SalaryPeriod;
  salary_disclosed?: boolean;
  salaryDisclosed?: boolean;
  min_experience?: number | null;
  minExperience?: number | null;
  max_experience?: number | null;
  maxExperience?: number | null;
  qualification?: string;
  deadline?: string;
  status?: 'Draft' | 'Published' | 'Closed';
  required_skills: string[];
  requiredSkills?: string[];
  preferred_skills: string[];
  preferredSkills?: string[];
}

export interface JobStats {
  total: number;
  active: number;
  draft: number;
  closed: number;
}

export interface JobFilterParams {
  q?: string;
  search?: string;
  location?: string;
  work_mode?: string;
  workMode?: string;
  employment_type?: string;
  employmentType?: string;
  min_exp?: number | string;
  minExp?: number | string;
  max_exp?: number | string;
  maxExp?: number | string;
  skills?: string;
  skill?: string;
  sort?: 'newest' | 'oldest' | 'deadline' | 'salary_high' | 'salary_low';
  page?: number;
  limit?: number;
}

export interface RecommendedJob extends JobPosting {
  matched_skills?: string[];
  matchedRequiredSkills?: string[];
  matched_preferred_skills?: string[];
  matchedPreferredSkills?: string[];
  overlap_count?: number;
  overlapCount?: number;
  match_reasons?: string[];
  matchReasons?: string[];
  isRecommended?: boolean;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  company: string;
  location: string;
  type: string;
  workplace: 'Remote' | 'Hybrid' | 'On-site';
  experienceLevel: string;
  salaryRange: string;
  postedDate: string;
  applicantsCount: number;
  shortlistedCount: number;
  status: 'Active' | 'Closed' | 'Draft';
  matchScoreForUser: number;
  tags: string[];
  description: string;
  requiredSkills: string[];
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  appliedDate: string;
  status: ApplicationStatus;
  aiMatchScore: number;
  matchTier: 'excellent' | 'strong' | 'good' | 'moderate' | 'low';
  salary: string;
  workType: 'Remote' | 'Hybrid' | 'On-site';
  notes?: string;
}

export interface Interview {
  id: string;
  candidateName: string;
  candidateAvatar: string;
  jobTitle: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  interviewer: string;
  meetLink: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}

// ============================================================
// PHASE 4: APPLICATION & RECRUITMENT WORKFLOW TYPES
// ============================================================

export type RealApplicationStatus = 'Applied' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Withdrawn';

export interface StatusTimelineItem {
  id: string;
  oldStatus: RealApplicationStatus | null;
  newStatus: RealApplicationStatus;
  changedByRole: 'candidate' | 'recruiter' | 'admin';
  note?: string;
  changedAt: string;
}

export interface CandidateApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  workMode: WorkMode;
  employmentType: JobEmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  salaryPeriod?: SalaryPeriod;
  salaryDisclosed: boolean;
  jobStatus: JobStatus;
  resumeId: string;
  resumeFilename: string;
  resumeStoredFilename?: string;
  resumeFileType: 'PDF' | 'DOCX' | 'DOC';
  resumeFileSize: number;
  resumeUrl?: string;
  coverLetter?: string;
  status: RealApplicationStatus;
  rejectionReason?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface CandidateApplicationStats {
  total: number;
  applied: number;
  under_review: number;
  shortlisted: number;
  rejected: number;
  withdrawn: number;
}

export interface CandidateApplicationDetail extends CandidateApplicationItem {
  description: string;
  responsibilities?: string;
  minExperience: number;
  maxExperience?: number | null;
  qualification?: string;
  deadline?: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface RecruiterApplicantItem {
  id: string;
  jobId: string;
  jobTitle?: string;
  jobLocation?: string;
  candidateId: string;
  candidateProfileId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateLocation?: string;
  candidateHeadline?: string;
  candidatePhoto?: string;
  skills: { name: string; proficiency: string }[];
  experienceCount?: number;
  resumeId: string;
  resumeFilename: string;
  resumeStoredFilename?: string;
  resumeFileType: 'PDF' | 'DOCX' | 'DOC';
  resumeFileSize: number;
  resumeUrl?: string;
  coverLetter?: string;
  status: RealApplicationStatus;
  rejectionReason?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface RecruiterPipelineStats {
  total: number;
  applied: number;
  under_review: number;
  shortlisted: number;
  rejected: number;
  withdrawn: number;
}

export interface RecruiterApplicantDetail {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  jobLocation: string;
  workMode: WorkMode;
  employmentType: JobEmploymentType;
  candidateId: string;
  candidateProfileId: string;
  coverLetter?: string;
  status: RealApplicationStatus;
  rejectionReason?: string;
  appliedAt: string;
  updatedAt: string;
  resume: {
    id: string;
    originalFilename: string;
    storedFilename?: string;
    fileType: 'PDF' | 'DOCX' | 'DOC';
    fileSize: number;
    previewUrl?: string;
  };
  candidate: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    headline?: string;
    bio?: string;
    photoUrl?: string;
    profileCompletion: number;
    education: CandidateEducation[];
    skills: CandidateSkill[];
    experience: CandidateExperience[];
    projects: CandidateProject[];
    certifications: CandidateCertification[];
  };
}

// ============================================================
// PHASE 5: RESUME PARSING & AI SCREENING TYPES
// ============================================================

export type ParsingStatus = 'Not Processed' | 'Processing' | 'Processed' | 'Failed';
export type ScreeningStatus = 'Not Screened' | 'Screening' | 'Screened' | 'Failed';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ParsedPersonalInfo {
  candidateName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
}

export interface ParsedEducationItem {
  degree: string;
  field?: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
}

export interface ParsedExperienceItem {
  jobTitle: string;
  company: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ParsedProjectItem {
  name: string;
  role?: string;
  technologies?: string;
  description?: string;
  url?: string;
}

export interface ParsedCertificationItem {
  name: string;
  issuingOrg: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
}

export interface ParsedLanguageItem {
  language: string;
  proficiency?: string;
}

export interface ParsedResumeData {
  id?: string;
  resumeId: string;
  status: ParsingStatus;
  errorMessage?: string;
  personal: ParsedPersonalInfo;
  summary: string;
  skills: string[];
  education: ParsedEducationItem[];
  experience: ParsedExperienceItem[];
  projects: ParsedProjectItem[];
  certifications: ParsedCertificationItem[];
  languages: ParsedLanguageItem[];
  achievements: string[];
  confidence: Record<string, ConfidenceLevel>;
  sectionsDetectedCount: number;
  parsedAt?: string;
}

export interface ScreeningFlag {
  type: 'info' | 'warning' | 'positive';
  message: string;
}

export interface ResumeScreeningResult {
  id?: string;
  resumeId: string;
  applicationId?: string | null;
  status: ScreeningStatus;
  completenessScore: number;
  sectionsPresent: string[];
  sectionsMissing: string[];
  skillsDetectedCount: number;
  experienceYearsDetected: number | null;
  educationLevelDetected: string;
  observations: string[];
  screeningFlags: ScreeningFlag[];
  screenedAt?: string;
}

export interface ParsedResumeApiResponse {
  success: boolean;
  hasResume?: boolean;
  resumeId?: string;
  filename?: string;
  status: ParsingStatus;
  errorMessage?: string;
  parsed: ParsedResumeData | null;
  screening?: ResumeScreeningResult | null;
  parsedAt?: string;
}

export interface RecruiterScreeningApiResponse {
  success: boolean;
  applicationId: string;
  resumeId: string;
  status: ScreeningStatus;
  errorMessage?: string;
  screening: ResumeScreeningResult | null;
}

// ============================================================
// Phase 6 Types: AI Resume-Job Matching, Ranking & Skill Gap
// ============================================================

export type MatchCategory = 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match' | 'Not Screened';

export interface MatchScoreBreakdown {
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  qualificationScore: number;
  relevanceScore: number;
  total: number;
}

export interface ResumeJobMatch {
  id: string;
  resumeId: string;
  jobId: string;
  applicationId?: string | null;
  candidateId: string;
  candidateProfileId?: string;
  algorithmVersion: string;
  status: 'Not Processed' | 'Processing' | 'Completed' | 'Failed';
  errorMessage?: string;
  matchScore: number;
  category: MatchCategory;
  categoryLabel: string;
  requiredSkillsMatched: string[];
  requiredSkillsMissing: string[];
  preferredSkillsMatched: string[];
  preferredSkillsMissing: string[];
  scoreBreakdown: MatchScoreBreakdown;
  experienceAssessment: string;
  qualificationAssessment: string;
  candidateExperienceYears: number;
  jobMinExperienceYears: number;
  candidateHighestEducation: string;
  jobQualificationRequired: string;
  completedAt?: string;
}

export interface CandidateJobSummary {
  id: string;
  matchId: string;
  candidateId: string;
  resumeId: string;
  jobId: string;
  applicationId?: string | null;
  summaryText: string;
  strengths: string[];
  gaps: string[];
  status: 'Completed' | 'Failed';
  errorMessage?: string;
  modelVersion: string;
  createdAt?: string;
}

export interface SkillGapAnalysis {
  id: string;
  matchId: string;
  candidateId: string;
  resumeId: string;
  jobId: string;
  applicationId?: string | null;
  matchScore: number;
  overview: string;
  matchedAreas: string[];
  priorityGaps: string[];
  preferredGaps: string[];
  recommendationsOverview: string;
  status: 'Completed' | 'Failed';
  errorMessage?: string;
  modelVersion: string;
  createdAt?: string;
}

export interface RankedApplicantItem extends RecruiterApplicantItem {
  rank?: number;
  matchScore: number;
  category: MatchCategory;
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  qualificationScore: number;
  requiredSkillsMatched: string[];
  requiredSkillsMissing: string[];
  preferredSkillsMatched: string[];
  preferredSkillsMissing: string[];
  experienceAssessment: string;
  qualificationAssessment: string;
  summaryText?: string;
  strengths?: string[];
  gaps?: string[];
}

export interface CandidateJobFitApiResponse {
  success: boolean;
  hasResume: boolean;
  message?: string;
  match: ResumeJobMatch | null;
  summary: CandidateJobSummary | null;
  skillGap: SkillGapAnalysis | null;
}

export interface CandidateSkillGapApiResponse {
  success: boolean;
  job: { id: string; title: string; companyName: string };
  skillGap: SkillGapAnalysis | null;
  match: ResumeJobMatch | null;
}

export interface RecruiterRankedApplicantsApiResponse {
  success: boolean;
  job: {
    id: string;
    title: string;
    companyName: string;
    status: string;
  };
  applicants: RankedApplicantItem[];
  stats: RecruiterPipelineStats;
}

export interface RecruiterApplicationMatchingApiResponse {
  success: boolean;
  applicationId: string;
  jobId: string;
  resumeId: string;
  match: ResumeJobMatch;
  summary: CandidateJobSummary;
}

// ============================================================
// Phase 7 Types: Interviews, Notifications, Dashboards & Analytics
// ============================================================

export type RealInterviewType = 'Video' | 'Phone' | 'In Person';
export type RealInterviewStatus = 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled' | 'No Show';

export interface InterviewItem {
  id: string;
  applicationId: string;
  candidateId?: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobLocation?: string;
  workMode?: string;
  employmentType?: string;
  candidateName?: string;
  candidateHeadline?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidatePhoto?: string;
  recruiterName?: string;
  applicationStatus?: string;
  title: string;
  interviewType: RealInterviewType;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  description?: string;
  status: RealInterviewStatus;
  cancellationReason?: string;
  rescheduleReason?: string;
  createdAt: string;
  updatedAt: string;
  isUpcoming?: boolean;
}

export interface InterviewHistoryItem {
  id: string;
  old_status?: string | null;
  new_status: string;
  old_scheduled_at?: string | null;
  new_scheduled_at?: string | null;
  changed_by_role: string;
  note?: string;
  changed_at: string;
}

export interface ScheduleInterviewInput {
  applicationId: string;
  title: string;
  interviewType: RealInterviewType;
  scheduledAt: string;
  durationMinutes?: number;
  location?: string;
  meetingUrl?: string;
  description?: string;
}

export interface RescheduleInterviewInput {
  scheduledAt: string;
  durationMinutes?: number;
  location?: string;
  meetingUrl?: string;
  reason?: string;
}

export interface CandidateInterviewsApiResponse {
  success: boolean;
  upcoming: InterviewItem[];
  past: InterviewItem[];
  total: number;
}

export interface RecruiterInterviewsApiResponse {
  success: boolean;
  interviews: InterviewItem[];
  stats: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
}

export interface InterviewDetailApiResponse {
  success: boolean;
  interview: InterviewItem;
  history: InterviewHistoryItem[];
}

export type RealNotificationType =
  | 'application_status'
  | 'interview_scheduled'
  | 'interview_rescheduled'
  | 'interview_cancelled'
  | 'interview_completed'
  | 'interview_noshow'
  | 'system';

export interface NotificationEntity {
  id: string;
  user_id: string;
  type: RealNotificationType;
  title: string;
  message: string;
  related_entity_type: 'application' | 'interview' | 'job' | 'system' | null;
  related_entity_id: string | null;
  is_read: number;
  created_at: string;
}

export interface NotificationsApiResponse {
  success: boolean;
  notifications: NotificationEntity[];
  total: number;
  unreadCount: number;
}

export interface CandidateDashboardData {
  profile: {
    id: string;
    fullName: string;
    headline: string;
    location: string;
    photoUrl: string;
    profileCompletion: number;
    email: string;
  };
  activeResume: {
    id: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    created_at: string;
  } | null;
  applicationStats: CandidateApplicationStats;
  recentApplications: Array<{
    id: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    jobLocation: string;
    workMode: string;
    employmentType: string;
    status: RealApplicationStatus;
    appliedAt: string;
    matchScore: number | null;
    matchedSkills: string[];
    missingSkills: string[];
    interview: {
      id: string;
      title: string;
      scheduledAt: string;
      status: RealInterviewStatus;
      meetingUrl?: string;
      interviewType: RealInterviewType;
    } | null;
  }>;
  upcomingInterviews: Array<{
    id: string;
    application_id: string;
    job_id: string;
    title: string;
    interview_type: RealInterviewType;
    scheduled_at: string;
    duration_minutes: number;
    location: string;
    meeting_url: string;
    status: RealInterviewStatus;
    description: string;
    job_title: string;
    company_name: string;
    recruiter_name: string;
  }>;
  recentNotifications: NotificationEntity[];
  recommendedJobs: Array<RecommendedJob & { matchedSkills?: string[]; matchScore?: number }>;
}

export interface RecruiterDashboardData {
  profile: {
    id: string;
    fullName: string;
    companyName: string;
    companyLogo: string;
    industry: string;
    location: string;
    profileCompletion: number;
  };
  jobStats: JobStats;
  pipelineStats: RecruiterPipelineStats;
  interviewStats: {
    total: number;
    upcoming: number;
    completed: number;
  };
  topCandidates: Array<{
    applicationId: string;
    jobId: string;
    jobTitle: string;
    candidateId: string;
    candidateName: string;
    candidateHeadline: string;
    candidatePhoto: string;
    applicationStatus: RealApplicationStatus;
    matchScore: number;
    matchedSkills: string[];
  }>;
  upcomingInterviews: Array<{
    id: string;
    application_id: string;
    candidate_id: string;
    job_id: string;
    title: string;
    interview_type: RealInterviewType;
    scheduled_at: string;
    duration_minutes: number;
    location: string;
    meeting_url: string;
    status: RealInterviewStatus;
    job_title: string;
    candidate_name: string;
    candidate_photo: string;
  }>;
  recentApplicants: Array<{
    id: string;
    jobId: string;
    jobTitle: string;
    candidateName: string;
    candidateHeadline: string;
    candidatePhoto: string;
    status: RealApplicationStatus;
    appliedAt: string;
    matchScore: number | null;
  }>;
}

export interface AnalyticsOverview {
  totalJobs: number;
  activeJobs: number;
  closedJobs: number;
  draftJobs: number;
  totalApplications: number;
  shortlisted: number;
  underReview: number;
  rejected: number;
  totalInterviews: number;
  activeInterviews: number;
  completedInterviews: number;
  averageMatchScore: number;
  completionRate: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface ApplicationTrendPoint {
  date: string;
  label: string;
  count: number;
}

export interface ScoreDistributionItem {
  range: string;
  label: string;
  count: number;
  percentage: number;
}

export interface InterviewMetrics {
  total: number;
  scheduled: number;
  rescheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
}

export interface JobAnalyticsSummary {
  id: string;
  title: string;
  status: string;
  applicantsCount: number;
  shortlistedCount: number;
  averageScore: number | null;
}

export interface RecruitmentAnalyticsData {
  overview: AnalyticsOverview;
  statusDistribution: StatusDistributionItem[];
  applicationTrend: ApplicationTrendPoint[];
  scoreDistribution: ScoreDistributionItem[];
  interviewMetrics: InterviewMetrics;
  jobs: JobAnalyticsSummary[];
}

// ============================================================
// Phase 8 Types: Advanced AI Recruitment Intelligence
// ============================================================

// 1. Natural-Language Candidate Search Types
export interface InterpretedSearchFilters {
  skills: string[];
  minExperience: number | null;
  jobTitles: string[];
  locations: string[];
  education: string[];
  matchThreshold: number | null;
  querySummary: string;
}

export interface CandidateSearchResultItem {
  candidateId: string;
  candidateProfileId: string;
  fullName: string;
  headline: string;
  location: string;
  photoUrl: string | null;
  experienceYears: number;
  highestEducation: string;
  skills: string[];
  matchedQuerySkills: string[];
  matchScore: number | null;
  latestApplicationJobTitle?: string;
  latestApplicationStatus?: string;
  profileCompletion: number;
  activeResumeId?: string;
}

export interface NaturalLanguageSearchResponse {
  query: string;
  interpreted: InterpretedSearchFilters;
  isRejected: boolean;
  rejectionReason?: string;
  totalResults: number;
  candidates: CandidateSearchResultItem[];
  searchId: string;
}

// 2. AI Interview Questions Types
export interface QuestionItem {
  id: string;
  question: string;
  category: 'Technical' | 'Behavioral' | 'Experience' | 'Role-Specific';
  targetSkill?: string;
  evaluationCriteria?: string;
}

export interface QuestionSetStructure {
  technical: QuestionItem[];
  behavioral: QuestionItem[];
  experience: QuestionItem[];
  roleSpecific: QuestionItem[];
}

export interface InterviewQuestionSetResult {
  id: string;
  jobId: string;
  candidateId: string | null;
  applicationId: string | null;
  recruiterId: string;
  jobTitle: string;
  companyName: string;
  candidateName?: string;
  questions: QuestionSetStructure;
  totalQuestions: number;
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
}

// 3. Resume Improvement Suggestions Types
export interface SectionSuggestionItem {
  section: string;
  status: 'Strong' | 'Needs Improvement' | 'Missing';
  suggestions: string[];
}

export interface TargetJobAlignmentResult {
  jobId: string;
  jobTitle: string;
  companyName: string;
  matchedSkills: string[];
  missingSkillsToHighlight: string[];
  alignmentAdvice: string[];
}

export interface ResumeImprovementResult {
  id: string;
  resumeId: string;
  candidateId: string;
  candidateName: string;
  jobId?: string | null;
  overallFeedback: string;
  sections: SectionSuggestionItem[];
  targetJobComparison?: TargetJobAlignmentResult | null;
  status: 'Completed' | 'Processing' | 'Failed';
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
}

// 4. Duplicate Resume Detection Types
export interface DuplicateMatchItem {
  id: string;
  resumeId: string;
  matchedResumeId: string;
  candidateId: string;
  matchedCandidateId: string;
  similarityType: 'Exact Duplicate' | 'Likely Duplicate' | 'Not Duplicate';
  similarityScore: number | null;
  detectionMethod: 'SHA-256 Hash' | 'Content Text Cosine/Jaccard' | 'Hybrid';
  createdAt?: string;
  matchedCandidateName?: string;
  isOwnResumeDuplicate?: boolean;
}

export interface ResumeDuplicateResponse {
  hasDuplicate: boolean;
  highestSimilarityType: 'Exact Duplicate' | 'Likely Duplicate' | 'Not Duplicate';
  matchesCount: number;
  matches: DuplicateMatchItem[];
  privacySafeMessage: string;
}

// 5. Explainable AI Match Scoring Types
export interface ScoreComponentExplanation {
  name: string;
  score: number;
  maxScore: number;
  weightPercentage: number;
  summary: string;
  details: string[];
}

export interface ExplainableMatchScoreResult {
  matchId: string;
  resumeId: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  finalScore: number;
  category: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';
  categoryLabel: string;
  algorithmVersion: string;
  isConsistent: boolean;
  components: {
    requiredSkills: ScoreComponentExplanation;
    preferredSkills: ScoreComponentExplanation;
    experience: ScoreComponentExplanation;
    qualification: ScoreComponentExplanation;
    relevance: ScoreComponentExplanation;
  };
  matchedSkills: {
    required: string[];
    preferred: string[];
  };
  missingSkills: {
    required: string[];
    preferred: string[];
  };
  factualSummary: string;
  naturalLanguageExplanation: string;
}




