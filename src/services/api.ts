import type {
  AuthResponse,
  CandidateProfile,
  RecruiterProfile,
  AdminStats,
  AdminUserItem,
  AdminJobItem,
  AdminApplicationItem,
  AdminSystemHealth,
  JobPosting,
  JobFormData,
  JobStats,
  JobFilterParams,
  RecommendedJob,
  CandidateApplicationItem,
  CandidateApplicationStats,
  CandidateApplicationDetail,
  StatusTimelineItem,
  RecruiterApplicantItem,
  RecruiterPipelineStats,
  RecruiterApplicantDetail,
  RealApplicationStatus,
} from '../types';

const API_BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('resumio_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An unexpected error occurred.');
  }
  return data;
}

export const api = {
  // Auth
  async registerCandidate(data: { fullName: string; email: string; password: string; confirmPassword: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register/candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async registerRecruiter(data: { fullName: string; email: string; companyName: string; password: string; confirmPassword: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async googleAuth(data: { credential?: string; userInfo?: any; role: 'candidate' | 'recruiter'; companyName?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async adminLogin(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async getMe(): Promise<{ success: boolean; user: any; profile: any }> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Candidate Full Profile (Phase 2)
  async getFullCandidateProfile(): Promise<{ success: boolean; data: import('../types').FullCandidateProfileData }> {
    const res = await fetch(`${API_BASE_URL}/candidate/full-profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateCandidateBasicProfile(data: { fullName: string; phone?: string; location?: string; headline?: string; bio?: string; photoUrl?: string }): Promise<{ success: boolean; message: string; profile: CandidateProfile }> {
    const res = await fetch(`${API_BASE_URL}/candidate/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async uploadCandidatePhoto(file: File): Promise<{ success: boolean; message: string; photoUrl: string; completion: number }> {
    const token = localStorage.getItem('resumio_token');
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE_URL}/candidate/photo`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return handleResponse(res);
  },

  async removeCandidatePhoto(): Promise<{ success: boolean; message: string; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/photo`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Candidate Education
  async addEducation(data: Omit<import('../types').CandidateEducation, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; education: import('../types').CandidateEducation; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/education`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateEducation(id: string, data: Omit<import('../types').CandidateEducation, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; education: import('../types').CandidateEducation; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/education/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteEducation(id: string): Promise<{ success: boolean; message: string; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/education/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Candidate Skills
  async addSkill(data: { name: string; proficiency: import('../types').SkillProficiency }): Promise<{ success: boolean; message: string; skill: import('../types').CandidateSkill; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/skills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateSkill(id: string, data: { name: string; proficiency: import('../types').SkillProficiency }): Promise<{ success: boolean; message: string; skill: import('../types').CandidateSkill; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/skills/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteSkill(id: string): Promise<{ success: boolean; message: string; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/skills/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Candidate Experience
  async addExperience(data: Omit<import('../types').CandidateExperience, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; experience: import('../types').CandidateExperience; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/experience`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateExperience(id: string, data: Omit<import('../types').CandidateExperience, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; experience: import('../types').CandidateExperience; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/experience/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteExperience(id: string): Promise<{ success: boolean; message: string; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/experience/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Candidate Projects
  async addProject(data: Omit<import('../types').CandidateProject, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; project: import('../types').CandidateProject; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateProject(id: string, data: Omit<import('../types').CandidateProject, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; project: import('../types').CandidateProject; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteProject(id: string): Promise<{ success: boolean; message: string; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Candidate Certifications
  async addCertification(data: Omit<import('../types').CandidateCertification, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; certification: import('../types').CandidateCertification; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/certifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateCertification(id: string, data: Omit<import('../types').CandidateCertification, 'id' | 'candidate_profile_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; certification: import('../types').CandidateCertification; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/certifications/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteCertification(id: string): Promise<{ success: boolean; message: string; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/certifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Candidate Resume
  async getResume(): Promise<{ success: boolean; resume: import('../types').CandidateResume | null }> {
    const res = await fetch(`${API_BASE_URL}/candidate/resume`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  uploadResumeWithProgress(file: File, onProgress?: (percent: number) => void): Promise<{ success: boolean; message: string; resume: import('../types').CandidateResume; completion: number }> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('resumio_token');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/candidate/resume/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(json);
          } else {
            reject(new Error(json.message || 'Resume upload failed.'));
          }
        } catch {
          reject(new Error('Invalid response from server.'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload.'));

      const formData = new FormData();
      formData.append('resume', file);
      xhr.send(formData);
    });
  },

  async deleteResume(): Promise<{ success: boolean; message: string; completion: number }> {
    const res = await fetch(`${API_BASE_URL}/candidate/resume`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async downloadResume(): Promise<void> {
    const token = localStorage.getItem('resumio_token');
    const res = await fetch(`${API_BASE_URL}/candidate/resume/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(err.message || 'Download failed');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = 'Resume.pdf';
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = decodeURIComponent(match[1]);
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  getResumePreviewUrl(): string {
    const token = localStorage.getItem('resumio_token');
    return `${API_BASE_URL}/candidate/resume/preview?token=${token}`;
  },

  // Recruiter / Company Profile
  async getRecruiterProfile(): Promise<{ success: boolean; profile: RecruiterProfile; email: string }> {
    const res = await fetch(`${API_BASE_URL}/profile/recruiter`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getCompanyProfile(): Promise<{ success: boolean; data?: any; profile?: RecruiterProfile; email?: string }> {
    const res = await fetch(`${API_BASE_URL}/profile/recruiter`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = (await handleResponse(res)) as any;
    return {
      success: data.success,
      data: data.profile,
      profile: data.profile,
      email: data.email,
    };
  },

  async updateRecruiterProfile(data: { fullName: string; phone?: string; companyName: string; companyLogo?: string; industry?: string; location?: string; website?: string; description?: string }): Promise<{ success: boolean; message: string; profile: RecruiterProfile }> {
    const res = await fetch(`${API_BASE_URL}/profile/recruiter`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Admin
  async getAdminStats(): Promise<{ success: boolean; stats: AdminStats }> {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminUsers(): Promise<{ success: boolean; users: AdminUserItem[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async toggleAdminUserStatus(userId: string, status: 'active' | 'suspended'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async getAdminJobs(): Promise<{ success: boolean; jobs: AdminJobItem[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/jobs`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async toggleAdminJobStatus(jobId: string, status: 'Active' | 'Closed'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async getAdminApplications(): Promise<{ success: boolean; applications: AdminApplicationItem[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/applications`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminSystemHealth(): Promise<{ success: boolean; health: AdminSystemHealth }> {
    const res = await fetch(`${API_BASE_URL}/admin/system`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ============================================================
  // PHASE 3: RECRUITER JOB MANAGEMENT
  // ============================================================
  async getRecruiterJobs(): Promise<{ success: boolean; jobs: JobPosting[]; stats: JobStats }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/jobs`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getRecruiterJobById(id: string): Promise<{ success: boolean; job: JobPosting }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/jobs/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createJob(data: JobFormData, publishImmediately?: boolean): Promise<{ success: boolean; message: string; jobId?: string; job: JobPosting }> {
    const payload = {
      ...data,
      ...(publishImmediately !== undefined ? { publish: publishImmediately, status: publishImmediately ? 'Published' : 'Draft' } : {}),
    };
    const res = await fetch(`${API_BASE_URL}/recruiter/jobs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateJob(id: string, data: JobFormData): Promise<{ success: boolean; message: string; job: JobPosting }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/jobs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async publishJob(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/jobs/${id}/publish`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async closeJob(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/jobs/${id}/close`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async deleteDraftJob(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ============================================================
  // PHASE 3: CANDIDATE & PUBLIC JOB DISCOVERY
  // ============================================================
  async getPublicJobs(params: JobFilterParams = {}): Promise<{
    success: boolean;
    jobs: JobPosting[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    const qVal = params.q || params.search;
    if (qVal) searchParams.set('q', qVal);
    if (params.location) searchParams.set('location', params.location);
    const modeVal = params.work_mode || params.workMode;
    if (modeVal) searchParams.set('work_mode', modeVal);
    const empVal = params.employment_type || params.employmentType;
    if (empVal) searchParams.set('employment_type', empVal);
    const minVal = params.min_exp !== undefined ? params.min_exp : params.minExp;
    if (minVal !== undefined && minVal !== '') searchParams.set('min_exp', String(minVal));
    const maxVal = params.max_exp !== undefined ? params.max_exp : params.maxExp;
    if (maxVal !== undefined && maxVal !== '') searchParams.set('max_exp', String(maxVal));
    const skillVal = params.skills || params.skill;
    if (skillVal) searchParams.set('skills', skillVal);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const queryString = searchParams.toString();
    const url = queryString ? `${API_BASE_URL}/jobs?${queryString}` : `${API_BASE_URL}/jobs`;

    const res = await fetch(url, {
      method: 'GET',
    });
    const result = (await handleResponse(res)) as any;
    return {
      success: result.success,
      jobs: result.jobs || [],
      total: result.total || result.pagination?.total || 0,
      page: result.page || result.pagination?.page || 1,
      limit: result.limit || result.pagination?.limit || 10,
      totalPages: result.totalPages || result.pagination?.totalPages || 1,
      pagination: result.pagination || {
        total: result.total || 0,
        page: result.page || 1,
        limit: result.limit || 10,
        totalPages: result.totalPages || 1,
      },
    };
  },

  async getJobById(id: string): Promise<{ success: boolean; job: JobPosting; companyProfile?: any }> {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'GET',
    });
    return handleResponse(res);
  },

  async getRecommendedJobs(): Promise<{
    success: boolean;
    recommendations: RecommendedJob[];
    candidateProfileComplete: boolean;
    candidateSkillsCount: number;
    completionScore: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/jobs/recommendations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ============================================================
  // PHASE 4: CANDIDATE APPLICATIONS
  // ============================================================
  async applyToJob(data: { jobId: string; resumeId: string; coverLetter?: string }): Promise<{
    success: boolean;
    message: string;
    applicationId: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/candidate/applications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async checkJobApplication(jobId: string): Promise<{
    success: boolean;
    hasApplied: boolean;
    application?: { id: string; status: RealApplicationStatus; applied_at: string; updated_at: string } | null;
  }> {
    const res = await fetch(`${API_BASE_URL}/candidate/applications/check/${jobId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getCandidateApplications(params?: { status?: string; search?: string }): Promise<{
    success: boolean;
    applications: CandidateApplicationItem[];
    stats: CandidateApplicationStats;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
    if (params?.search && params.search.trim()) searchParams.set('search', params.search.trim());

    const queryString = searchParams.toString();
    const url = queryString ? `${API_BASE_URL}/candidate/applications?${queryString}` : `${API_BASE_URL}/candidate/applications`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getCandidateApplicationById(id: string): Promise<{
    success: boolean;
    application: CandidateApplicationDetail;
    timeline: StatusTimelineItem[];
  }> {
    const res = await fetch(`${API_BASE_URL}/candidate/applications/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async withdrawApplication(id: string): Promise<{
    success: boolean;
    message: string;
    status: RealApplicationStatus;
  }> {
    const res = await fetch(`${API_BASE_URL}/candidate/applications/${id}/withdraw`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ============================================================
  // PHASE 4: RECRUITER APPLICANTS MANAGEMENT
  // ============================================================
  async getJobApplicants(
    jobId: string,
    params?: { status?: string; search?: string }
  ): Promise<{
    success: boolean;
    job: { id: string; title: string; companyName: string; status: string };
    applicants: RecruiterApplicantItem[];
    stats: RecruiterPipelineStats;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
    if (params?.search && params.search.trim()) searchParams.set('search', params.search.trim());

    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/recruiter/jobs/${jobId}/applicants?${queryString}`
      : `${API_BASE_URL}/recruiter/jobs/${jobId}/applicants`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAllRecruiterApplicants(params?: { status?: string; search?: string; jobId?: string }): Promise<{
    success: boolean;
    applicants: RecruiterApplicantItem[];
    stats: RecruiterPipelineStats;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
    if (params?.search && params.search.trim()) searchParams.set('search', params.search.trim());
    if (params?.jobId && params.jobId !== 'All') searchParams.set('jobId', params.jobId);

    const queryString = searchParams.toString();
    const url = queryString ? `${API_BASE_URL}/recruiter/applicants?${queryString}` : `${API_BASE_URL}/recruiter/applicants`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getRecruiterApplicationDetail(id: string): Promise<{
    success: boolean;
    application: RecruiterApplicantDetail;
    timeline: StatusTimelineItem[];
  }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/applications/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateApplicantStatus(
    id: string,
    data: { status: 'Under Review' | 'Shortlisted' | 'Rejected' | 'Applied'; note?: string; rejectionReason?: string }
  ): Promise<{
    success: boolean;
    message: string;
    status: RealApplicationStatus;
    oldStatus?: RealApplicationStatus;
  }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/applications/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ============================================================
  // PHASE 5: RESUME PARSING & AI SCREENING
  // ============================================================

  /**
   * Candidate fetches parsed resume data and screening results for active resume
   */
  async getCandidateParsedResume(): Promise<{
    success: boolean;
    hasResume?: boolean;
    resumeId?: string;
    filename?: string;
    status: 'Not Processed' | 'Processing' | 'Processed' | 'Failed';
    errorMessage?: string;
    parsed: any | null;
    screening?: any | null;
    parsedAt?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/candidate/resume/parsed`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Candidate triggers parsing of active resume
   */
  async parseCandidateResume(): Promise<{
    success: boolean;
    message?: string;
    status: 'Not Processed' | 'Processing' | 'Processed' | 'Failed';
    parsed: any | null;
    screening?: any | null;
    errorMessage?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/candidate/resume/parse`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Candidate forces re-parsing of active resume
   */
  async reparseCandidateResume(): Promise<{
    success: boolean;
    message?: string;
    status: 'Not Processed' | 'Processing' | 'Processed' | 'Failed';
    parsed: any | null;
    screening?: any | null;
    errorMessage?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/candidate/resume/reparse`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Recruiter fetches structured parsed resume for a specific applicant/application
   */
  async getRecruiterApplicationParsedResume(applicationId: string): Promise<{
    success: boolean;
    applicationId: string;
    resumeId: string;
    filename: string;
    status: 'Not Processed' | 'Processing' | 'Processed' | 'Failed';
    errorMessage?: string;
    parsed: any | null;
  }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/applications/${applicationId}/parsed-resume`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Recruiter fetches initial AI screening analysis for an applicant
   */
  async getRecruiterApplicationScreening(applicationId: string): Promise<{
    success: boolean;
    applicationId: string;
    resumeId: string;
    status: 'Not Screened' | 'Screening' | 'Screened' | 'Failed';
    errorMessage?: string;
    screening: any | null;
  }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/applications/${applicationId}/screening`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ============================================================
  // Phase 6: AI Resume-Job Matching, Ranking & Skill Gap APIs
  // ============================================================

  /**
   * Candidate retrieves personalized match score and breakdown for a target job
   */
  async getCandidateJobFit(jobId: string): Promise<import('../types').CandidateJobFitApiResponse> {
    const res = await fetch(`${API_BASE_URL}/candidate/jobs/${jobId}/fit`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Candidate retrieves detailed AI skill gap analysis for a job
   */
  async getCandidateSkillGap(jobId: string): Promise<import('../types').CandidateSkillGapApiResponse> {
    const res = await fetch(`${API_BASE_URL}/candidate/jobs/${jobId}/skill-gap`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Recruiter retrieves automatically ranked applicants with match scores and tie-breaking
   */
  async getRecruiterJobApplicantsRanked(
    jobId: string,
    params?: { sortBy?: string; minScore?: number; status?: string; search?: string }
  ): Promise<import('../types').RecruiterRankedApplicantsApiResponse> {
    const query = new URLSearchParams();
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.minScore !== undefined) query.append('minScore', String(params.minScore));
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}/applicants/ranked${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Recruiter fetches full AI matching analysis and candidate summary for an applicant
   */
  async getRecruiterApplicationMatching(applicationId: string): Promise<import('../types').RecruiterApplicationMatchingApiResponse> {
    const res = await fetch(`${API_BASE_URL}/recruiter/applications/${applicationId}/matching`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Recruiter forces recomputation of matching score and AI summary
   */
  async recomputeApplicationMatching(applicationId: string): Promise<{
    success: boolean;
    message: string;
    match: import('../types').ResumeJobMatch;
    summary: import('../types').CandidateJobSummary;
  }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/applications/${applicationId}/recompute-matching`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ============================================================
  // Phase 7: Interviews, Notifications, Dashboards & Analytics
  // ============================================================

  // 1. Interviews
  async scheduleInterview(data: import('../types').ScheduleInterviewInput): Promise<{
    success: boolean;
    message: string;
    interviewId: string;
    title: string;
    interviewType: string;
    scheduledAt: string;
    durationMinutes: number;
    status: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/interviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getInterviewById(interviewId: string): Promise<import('../types').InterviewDetailApiResponse> {
    const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async rescheduleInterview(
    interviewId: string,
    data: import('../types').RescheduleInterviewInput
  ): Promise<{
    success: boolean;
    message: string;
    interviewId: string;
    status: string;
    scheduledAt: string;
    durationMinutes: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}/reschedule`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async cancelInterview(
    interviewId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    interviewId: string;
    status: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  async updateInterviewStatus(
    interviewId: string,
    status: 'Completed' | 'No Show',
    note?: string
  ): Promise<{
    success: boolean;
    message: string;
    interviewId: string;
    status: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, note }),
    });
    return handleResponse(res);
  },

  async getCandidateInterviews(): Promise<import('../types').CandidateInterviewsApiResponse> {
    const res = await fetch(`${API_BASE_URL}/candidate/interviews`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getRecruiterInterviews(params?: {
    status?: string;
    jobId?: string;
    search?: string;
  }): Promise<import('../types').RecruiterInterviewsApiResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.jobId && params.jobId !== 'All') query.append('jobId', params.jobId);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/recruiter/interviews${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // 2. Notifications
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<import('../types').NotificationsApiResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    if (params?.unreadOnly) query.append('unreadOnly', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/notifications${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markNotificationAsRead(notificationId: string): Promise<{
    success: boolean;
    message: string;
    unreadCount: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markAllNotificationsAsRead(): Promise<{
    success: boolean;
    message: string;
    unreadCount: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // 3. Dashboards
  async getCandidateDashboard(): Promise<{
    success: boolean;
    data: import('../types').CandidateDashboardData;
  }> {
    const res = await fetch(`${API_BASE_URL}/candidate/dashboard`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getRecruiterDashboard(): Promise<{
    success: boolean;
    data: import('../types').RecruiterDashboardData;
  }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/dashboard`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // 4. Analytics & Reports
  async getRecruitmentAnalytics(params?: {
    dateRange?: '7d' | '30d' | '90d' | 'all';
    jobId?: string;
  }): Promise<{
    success: boolean;
    data: import('../types').RecruitmentAnalyticsData;
  }> {
    const query = new URLSearchParams();
    if (params?.dateRange) query.append('dateRange', params.dateRange);
    if (params?.jobId) query.append('jobId', params.jobId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/recruiter/analytics${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ============================================================
  // Phase 8: Advanced AI Recruitment Intelligence APIs
  // ============================================================

  // 1. Natural-Language Candidate Search
  async searchCandidates(
    query: string,
    targetJobId?: string
  ): Promise<{
    success: boolean;
    data: import('../types').NaturalLanguageSearchResponse;
  }> {
    const res = await fetch(`${API_BASE_URL}/recruiter/candidate-search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, targetJobId }),
    });
    return handleResponse(res);
  },

  // 2. AI Interview Questions
  async getJobInterviewQuestions(jobId: string): Promise<{
    success: boolean;
    data: import('../types').InterviewQuestionSetResult;
  }> {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/interview-questions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async generateJobInterviewQuestions(
    jobId: string,
    forceRegenerate?: boolean
  ): Promise<{
    success: boolean;
    data: import('../types').InterviewQuestionSetResult;
  }> {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/interview-questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ forceRegenerate }),
    });
    return handleResponse(res);
  },

  async generateCandidateInterviewQuestions(
    applicationId: string,
    forceRegenerate?: boolean
  ): Promise<{
    success: boolean;
    data: import('../types').InterviewQuestionSetResult;
  }> {
    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/interview-questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ forceRegenerate }),
    });
    return handleResponse(res);
  },

  async updateInterviewQuestionSet(
    questionSetId: string,
    questions: import('../types').QuestionSetStructure
  ): Promise<{
    success: boolean;
    data: import('../types').InterviewQuestionSetResult;
  }> {
    const res = await fetch(`${API_BASE_URL}/interview-questions/${questionSetId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ questions }),
    });
    return handleResponse(res);
  },

  // 3. Resume Improvement Suggestions
  async getResumeImprovementAnalysis(
    resumeId: string,
    jobId?: string
  ): Promise<{
    success: boolean;
    data: import('../types').ResumeImprovementResult;
  }> {
    const query = jobId ? `?jobId=${jobId}` : '';
    const res = await fetch(`${API_BASE_URL}/resumes/${resumeId}/improvement-analysis${query}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async generateResumeImprovementAnalysis(
    resumeId: string,
    jobId?: string,
    forceRegenerate?: boolean
  ): Promise<{
    success: boolean;
    data: import('../types').ResumeImprovementResult;
  }> {
    const res = await fetch(`${API_BASE_URL}/resumes/${resumeId}/improvement-analysis`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ jobId, forceRegenerate }),
    });
    return handleResponse(res);
  },

  // 4. Duplicate Resume Detection
  async getResumeDuplicates(resumeId: string): Promise<{
    success: boolean;
    data: import('../types').ResumeDuplicateResponse;
  }> {
    const res = await fetch(`${API_BASE_URL}/resumes/${resumeId}/duplicates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // 5. Explainable AI Match Scoring
  async getApplicationMatchExplanation(applicationId: string): Promise<{
    success: boolean;
    data: import('../types').ExplainableMatchScoreResult;
  }> {
    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/match/explanation`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getMatchExplanation(matchId: string): Promise<{
    success: boolean;
    data: import('../types').ExplainableMatchScoreResult;
  }> {
    const res = await fetch(`${API_BASE_URL}/matches/${matchId}/explanation`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};



