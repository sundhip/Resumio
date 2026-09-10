import { db } from '../database/db';

export class DashboardService {
  /**
   * Consolidated Candidate Dashboard data
   */
  static getCandidateDashboard(candidateUserId: string) {
    // 1. Candidate profile
    const profile = db.prepare(`
      SELECT cp.*, u.email
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.user_id = ?
    `).get(candidateUserId) as any;

    if (!profile) {
      throw new Error('Candidate profile not found.');
    }

    // 2. Active resume
    const activeResume = db.prepare(`
      SELECT id, original_filename, file_type, file_size, created_at
      FROM candidate_resumes
      WHERE candidate_profile_id = ? AND is_active = 1
      ORDER BY created_at DESC LIMIT 1
    `).get(profile.id) as any;

    // 3. Application stats
    const allApps = db.prepare(`
      SELECT status FROM applications WHERE candidate_id = ?
    `).all(candidateUserId) as any[];

    const applicationStats = {
      total: allApps.length,
      applied: allApps.filter((a) => a.status === 'Applied').length,
      under_review: allApps.filter((a) => a.status === 'Under Review').length,
      shortlisted: allApps.filter((a) => a.status === 'Shortlisted').length,
      rejected: allApps.filter((a) => a.status === 'Rejected').length,
      withdrawn: allApps.filter((a) => a.status === 'Withdrawn').length,
    };

    // 4. Recent applications with Phase 6 match score & interview info
    const recentAppsRaw = db.prepare(`
      SELECT 
        a.id, a.job_id, a.status, a.applied_at,
        j.title as job_title, j.company_name, j.location as job_location, j.work_mode, j.employment_type,
        m.match_score, m.required_skills_matched_json, m.required_skills_missing_json,
        i.id as interview_id, i.title as interview_title, i.scheduled_at as interview_scheduled_at, i.status as interview_status, i.meeting_url as interview_meeting_url, i.interview_type
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
      LEFT JOIN interviews i ON a.id = i.application_id AND i.status IN ('Scheduled', 'Rescheduled')
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
      LIMIT 5
    `).all(candidateUserId) as any[];

    const recentApplications = recentAppsRaw.map((app) => ({
      id: app.id,
      jobId: app.job_id,
      jobTitle: app.job_title,
      companyName: app.company_name,
      jobLocation: app.job_location,
      workMode: app.work_mode,
      employmentType: app.employment_type,
      status: app.status,
      appliedAt: app.applied_at,
      matchScore: app.match_score !== null && app.match_score !== undefined ? app.match_score : null,
      matchedSkills: app.required_skills_matched_json ? JSON.parse(app.required_skills_matched_json) : [],
      missingSkills: app.required_skills_missing_json ? JSON.parse(app.required_skills_missing_json) : [],
      interview: app.interview_id
        ? {
            id: app.interview_id,
            title: app.interview_title,
            scheduledAt: app.interview_scheduled_at,
            status: app.interview_status,
            meetingUrl: app.interview_meeting_url,
            interviewType: app.interview_type,
          }
        : null,
    }));

    // 5. Upcoming interviews
    const now = new Date().toISOString();
    const upcomingInterviews = db.prepare(`
      SELECT 
        i.id, i.application_id, i.job_id, i.title, i.interview_type, i.scheduled_at,
        i.duration_minutes, i.location, i.meeting_url, i.status, i.description,
        j.title as job_title, j.company_name,
        rp.full_name as recruiter_name
      FROM interviews i
      JOIN jobs j ON i.job_id = j.id
      JOIN users ru ON i.recruiter_id = ru.id
      LEFT JOIN recruiter_profiles rp ON ru.id = rp.user_id
      WHERE i.candidate_id = ? AND i.status IN ('Scheduled', 'Rescheduled') AND i.scheduled_at >= ?
      ORDER BY i.scheduled_at ASC
      LIMIT 4
    `).all(candidateUserId, now) as any[];

    // 6. Recent notifications
    const recentNotifications = db.prepare(`
      SELECT id, type, title, message, related_entity_type, related_entity_id, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(candidateUserId) as any[];

    // 7. Recommended Jobs from Phase 3 algorithm
    const candidateSkills = db.prepare(`
      SELECT name FROM candidate_skills WHERE candidate_profile_id = ?
    `).all(profile.id).map((s: any) => s.name.toLowerCase());

    const publishedJobs = db.prepare(`
      SELECT j.*, rp.company_logo
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
      WHERE j.status = 'Published'
      ORDER BY j.published_at DESC
      LIMIT 10
    `).all() as any[];

    const recommendedJobs = publishedJobs
      .map((job) => {
        const requiredSkills = db.prepare(`SELECT name FROM job_required_skills WHERE job_id = ?`).all(job.id).map((s: any) => s.name);
        const preferredSkills = db.prepare(`SELECT name FROM job_preferred_skills WHERE job_id = ?`).all(job.id).map((s: any) => s.name);

        const matchedRequired = requiredSkills.filter((s) => candidateSkills.includes(s.toLowerCase()));
        const score = requiredSkills.length > 0 ? Math.round((matchedRequired.length / requiredSkills.length) * 100) : 50;

        return {
          id: job.id,
          title: job.title,
          companyName: job.company_name,
          location: job.location,
          workMode: job.work_mode,
          employmentType: job.employment_type,
          salaryMin: job.salary_min,
          salaryMax: job.salary_max,
          currency: job.currency,
          minExperience: job.min_experience,
          requiredSkills,
          preferredSkills,
          matchedSkills: matchedRequired,
          matchScore: score,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    return {
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        headline: profile.headline,
        location: profile.location,
        photoUrl: profile.photo_url,
        profileCompletion: profile.profile_completion,
        email: profile.email,
      },
      activeResume: activeResume || null,
      applicationStats,
      recentApplications,
      upcomingInterviews,
      recentNotifications,
      recommendedJobs,
    };
  }

  /**
   * Consolidated Recruiter Dashboard data
   */
  static getRecruiterDashboard(recruiterUserId: string) {
    // 1. Recruiter profile
    const profile = db.prepare(`
      SELECT rp.*, u.email
      FROM recruiter_profiles rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.user_id = ?
    `).get(recruiterUserId) as any;

    if (!profile) {
      throw new Error('Recruiter profile not found.');
    }

    // 2. Job stats
    const allJobs = db.prepare(`
      SELECT status FROM jobs WHERE recruiter_id = ?
    `).all(recruiterUserId) as any[];

    const jobStats = {
      total: allJobs.length,
      active: allJobs.filter((j) => j.status === 'Published').length,
      draft: allJobs.filter((j) => j.status === 'Draft').length,
      closed: allJobs.filter((j) => j.status === 'Closed').length,
    };

    // 3. Pipeline stats across all jobs
    const allApps = db.prepare(`
      SELECT a.status
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = ?
    `).all(recruiterUserId) as any[];

    const pipelineStats = {
      total: allApps.length,
      applied: allApps.filter((a) => a.status === 'Applied').length,
      under_review: allApps.filter((a) => a.status === 'Under Review').length,
      shortlisted: allApps.filter((a) => a.status === 'Shortlisted').length,
      rejected: allApps.filter((a) => a.status === 'Rejected').length,
      withdrawn: allApps.filter((a) => a.status === 'Withdrawn').length,
    };

    // 4. Interview stats
    const now = new Date().toISOString();
    const allInterviews = db.prepare(`
      SELECT status, scheduled_at FROM interviews WHERE recruiter_id = ?
    `).all(recruiterUserId) as any[];

    const interviewStats = {
      total: allInterviews.length,
      upcoming: allInterviews.filter((i) => (i.status === 'Scheduled' || i.status === 'Rescheduled') && i.scheduled_at >= now).length,
      completed: allInterviews.filter((i) => i.status === 'Completed').length,
    };

    // 5. Top candidates across all active jobs (reusing Phase 6 match scores)
    const topCandidatesRaw = db.prepare(`
      SELECT 
        a.id as application_id, a.job_id, a.candidate_id, a.status as application_status, a.applied_at,
        j.title as job_title,
        cp.full_name as candidate_name, cp.headline as candidate_headline, cp.photo_url as candidate_photo,
        m.match_score, m.required_skills_matched_json, m.required_skills_missing_json
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      LEFT JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
      WHERE j.recruiter_id = ? AND j.status = 'Published' AND a.status NOT IN ('Rejected', 'Withdrawn')
      ORDER BY COALESCE(m.match_score, 0) DESC, a.applied_at DESC
      LIMIT 5
    `).all(recruiterUserId) as any[];

    const topCandidates = topCandidatesRaw.map((c) => ({
      applicationId: c.application_id,
      jobId: c.job_id,
      jobTitle: c.job_title,
      candidateId: c.candidate_id,
      candidateName: c.candidate_name,
      candidateHeadline: c.candidate_headline,
      candidatePhoto: c.candidate_photo,
      applicationStatus: c.application_status,
      matchScore: c.match_score !== null && c.match_score !== undefined ? c.match_score : 0,
      matchedSkills: c.required_skills_matched_json ? JSON.parse(c.required_skills_matched_json) : [],
    }));

    // 6. Upcoming interviews
    const upcomingInterviews = db.prepare(`
      SELECT 
        i.id, i.application_id, i.candidate_id, i.job_id, i.title, i.interview_type,
        i.scheduled_at, i.duration_minutes, i.location, i.meeting_url, i.status,
        j.title as job_title,
        cp.full_name as candidate_name, cp.photo_url as candidate_photo
      FROM interviews i
      JOIN jobs j ON i.job_id = j.id
      JOIN applications a ON i.application_id = a.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      WHERE i.recruiter_id = ? AND i.status IN ('Scheduled', 'Rescheduled') AND i.scheduled_at >= ?
      ORDER BY i.scheduled_at ASC
      LIMIT 4
    `).all(recruiterUserId, now) as any[];

    // 7. Recent applicants
    const recentApplicantsRaw = db.prepare(`
      SELECT 
        a.id, a.job_id, a.status, a.applied_at,
        j.title as job_title,
        cp.full_name as candidate_name, cp.headline as candidate_headline, cp.photo_url as candidate_photo,
        m.match_score
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      LEFT JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
      WHERE j.recruiter_id = ?
      ORDER BY a.applied_at DESC
      LIMIT 5
    `).all(recruiterUserId) as any[];

    const recentApplicants = recentApplicantsRaw.map((a) => ({
      id: a.id,
      jobId: a.job_id,
      jobTitle: a.job_title,
      candidateName: a.candidate_name,
      candidateHeadline: a.candidate_headline,
      candidatePhoto: a.candidate_photo,
      status: a.status,
      appliedAt: a.applied_at,
      matchScore: a.match_score !== null && a.match_score !== undefined ? a.match_score : null,
    }));

    return {
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        companyName: profile.company_name,
        companyLogo: profile.company_logo,
        industry: profile.industry,
        location: profile.location,
        profileCompletion: profile.profile_completion,
      },
      jobStats,
      pipelineStats,
      interviewStats,
      topCandidates,
      upcomingInterviews,
      recentApplicants,
    };
  }
}
