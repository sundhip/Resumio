import crypto from 'crypto';
import { db } from '../database/db';
import { NotificationService } from './notificationService';

export type InterviewType = 'Video' | 'Phone' | 'In Person';
export type InterviewStatus = 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled' | 'No Show';

export interface ScheduleInterviewInput {
  applicationId: string;
  title: string;
  interviewType: InterviewType;
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

export interface InterviewRecord {
  id: string;
  application_id: string;
  candidate_id: string;
  recruiter_id: string;
  job_id: string;
  title: string;
  interview_type: InterviewType;
  scheduled_at: string;
  duration_minutes: number;
  location: string;
  meeting_url: string;
  description: string;
  status: InterviewStatus;
  cancellation_reason: string;
  reschedule_reason: string;
  created_at: string;
  updated_at: string;
}

export class InterviewService {
  /**
   * Schedule a new interview with strict ownership and relationship validation
   */
  static scheduleInterview(recruiterUserId: string, input: ScheduleInterviewInput) {
    const {
      applicationId,
      title,
      interviewType,
      scheduledAt,
      durationMinutes = 45,
      location = '',
      meetingUrl = '',
      description = '',
    } = input;

    // 1. Basic field validations
    if (!applicationId || !applicationId.trim()) {
      throw new Error('Application ID is required.');
    }
    if (!title || !title.trim()) {
      throw new Error('Interview title is required.');
    }
    if (!['Video', 'Phone', 'In Person'].includes(interviewType)) {
      throw new Error('Invalid interview type. Must be Video, Phone, or In Person.');
    }

    // Validate date / time
    const schedDate = new Date(scheduledAt);
    if (isNaN(schedDate.getTime())) {
      throw new Error('Invalid scheduled date/time format.');
    }

    if (durationMinutes <= 0 || durationMinutes > 480) {
      throw new Error('Duration must be a positive number of minutes (max 480 min).');
    }

    // Type-specific validations
    if (interviewType === 'Video') {
      if (!meetingUrl || !meetingUrl.trim()) {
        throw new Error('Meeting URL is required for Video interviews.');
      }
      try {
        const parsedUrl = new URL(meetingUrl.trim());
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid meeting URL protocol. Must use http or https.');
        }
      } catch {
        throw new Error('Invalid meeting URL format. Please provide a valid web link.');
      }
    }

    if (interviewType === 'In Person' && (!location || !location.trim())) {
      throw new Error('Physical address or office location is required for In Person interviews.');
    }

    // 2. Relationship and Ownership Validation
    const rawApp = db.prepare(`
      SELECT 
        a.id as application_id, 
        a.candidate_id, 
        a.job_id, 
        a.status as application_status,
        j.recruiter_id, 
        j.title as job_title, 
        j.company_name,
        cp.full_name as candidate_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      WHERE a.id = ?
    `).get(applicationId.trim()) as any;

    if (!rawApp) {
      throw new Error('Application not found.');
    }

    if (rawApp.recruiter_id !== recruiterUserId) {
      throw new Error('Forbidden: You do not own the job for this applicant.');
    }

    if (rawApp.application_status === 'Withdrawn') {
      throw new Error('Cannot schedule an interview for a withdrawn application.');
    }

    const interviewId = crypto.randomUUID();
    const historyId = crypto.randomUUID();
    const cleanTitle = title.trim();
    const cleanLocation = (location || '').trim();
    const cleanMeetingUrl = (meetingUrl || '').trim();
    const cleanDescription = (description || '').trim();
    const isoScheduledAt = schedDate.toISOString();

    // 3. Insert Interview Record
    db.prepare(`
      INSERT INTO interviews (
        id, application_id, candidate_id, recruiter_id, job_id,
        title, interview_type, scheduled_at, duration_minutes,
        location, meeting_url, description, status,
        cancellation_reason, reschedule_reason, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', '', '', datetime('now'), datetime('now'))
    `).run(
      interviewId,
      rawApp.application_id,
      rawApp.candidate_id,
      recruiterUserId,
      rawApp.job_id,
      cleanTitle,
      interviewType,
      isoScheduledAt,
      durationMinutes,
      cleanLocation,
      cleanMeetingUrl,
      cleanDescription
    );

    // 4. Insert Audit Trail
    db.prepare(`
      INSERT INTO interview_status_history (
        id, interview_id, old_status, new_status, old_scheduled_at, new_scheduled_at, changed_by, changed_by_role, note, changed_at
      )
      VALUES (?, ?, NULL, 'Scheduled', NULL, ?, ?, 'recruiter', 'Initial interview scheduled', datetime('now'))
    `).run(historyId, interviewId, isoScheduledAt, recruiterUserId);

    // 5. Trigger Candidate In-App Notification
    NotificationService.notifyInterviewScheduled(
      rawApp.candidate_id,
      rawApp.job_title,
      cleanTitle,
      isoScheduledAt,
      interviewId,
      rawApp.application_id
    );

    return {
      interviewId,
      title: cleanTitle,
      interviewType,
      scheduledAt: isoScheduledAt,
      durationMinutes,
      status: 'Scheduled',
    };
  }

  /**
   * Reschedule an existing interview
   */
  static rescheduleInterview(recruiterUserId: string, interviewId: string, input: RescheduleInterviewInput) {
    const interview = db.prepare(`
      SELECT i.*, j.title as job_title, j.recruiter_id
      FROM interviews i
      JOIN jobs j ON i.job_id = j.id
      WHERE i.id = ?
    `).get(interviewId) as any;

    if (!interview) {
      throw new Error('Interview not found.');
    }

    if (interview.recruiter_id !== recruiterUserId) {
      throw new Error('Forbidden: You do not own this interview.');
    }

    if (interview.status === 'Cancelled') {
      throw new Error('Cannot reschedule a cancelled interview.');
    }
    if (interview.status === 'Completed') {
      throw new Error('Cannot reschedule an already completed interview.');
    }

    const { scheduledAt, durationMinutes, location, meetingUrl, reason } = input;
    const schedDate = new Date(scheduledAt);
    if (isNaN(schedDate.getTime())) {
      throw new Error('Invalid scheduled date/time format.');
    }

    const newDuration = durationMinutes && durationMinutes > 0 ? durationMinutes : interview.duration_minutes;
    const newLocation = location !== undefined ? location.trim() : interview.location;
    const newMeetingUrl = meetingUrl !== undefined ? meetingUrl.trim() : interview.meeting_url;
    const cleanReason = (reason || '').trim();
    const isoScheduledAt = schedDate.toISOString();
    const oldScheduledAt = interview.scheduled_at;
    const oldStatus = interview.status;

    if (interview.interview_type === 'Video' && newMeetingUrl) {
      try {
        const parsedUrl = new URL(newMeetingUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid meeting URL protocol.');
        }
      } catch {
        throw new Error('Invalid meeting URL format.');
      }
    }

    // Update Interview Record
    db.prepare(`
      UPDATE interviews
      SET scheduled_at = ?, duration_minutes = ?, location = ?, meeting_url = ?,
          status = 'Rescheduled', reschedule_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(isoScheduledAt, newDuration, newLocation, newMeetingUrl, cleanReason, interviewId);

    // Insert Audit History
    const historyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO interview_status_history (
        id, interview_id, old_status, new_status, old_scheduled_at, new_scheduled_at, changed_by, changed_by_role, note, changed_at
      )
      VALUES (?, ?, ?, 'Rescheduled', ?, ?, ?, 'recruiter', ?, datetime('now'))
    `).run(historyId, interviewId, oldStatus, oldScheduledAt, isoScheduledAt, recruiterUserId, cleanReason || 'Interview rescheduled');

    // Trigger In-App Notification
    NotificationService.notifyInterviewRescheduled(
      interview.candidate_id,
      interview.job_title,
      interview.title,
      isoScheduledAt,
      interviewId,
      interview.application_id,
      cleanReason
    );

    return {
      interviewId,
      status: 'Rescheduled',
      scheduledAt: isoScheduledAt,
      durationMinutes: newDuration,
    };
  }

  /**
   * Cancel an interview
   */
  static cancelInterview(recruiterUserId: string, interviewId: string, reason?: string) {
    const interview = db.prepare(`
      SELECT i.*, j.title as job_title, j.recruiter_id
      FROM interviews i
      JOIN jobs j ON i.job_id = j.id
      WHERE i.id = ?
    `).get(interviewId) as any;

    if (!interview) {
      throw new Error('Interview not found.');
    }

    if (interview.recruiter_id !== recruiterUserId) {
      throw new Error('Forbidden: You do not own this interview.');
    }

    if (interview.status === 'Cancelled') {
      throw new Error('Interview is already cancelled.');
    }
    if (interview.status === 'Completed') {
      throw new Error('Cannot cancel an already completed interview.');
    }

    const cleanReason = (reason || '').trim();
    const oldStatus = interview.status;

    db.prepare(`
      UPDATE interviews
      SET status = 'Cancelled', cancellation_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(cleanReason, interviewId);

    // Insert Audit History
    const historyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO interview_status_history (
        id, interview_id, old_status, new_status, old_scheduled_at, new_scheduled_at, changed_by, changed_by_role, note, changed_at
      )
      VALUES (?, ?, ?, 'Cancelled', ?, ?, ?, 'recruiter', ?, datetime('now'))
    `).run(historyId, interviewId, oldStatus, interview.scheduled_at, interview.scheduled_at, recruiterUserId, cleanReason || 'Interview cancelled');

    // Trigger Notification
    NotificationService.notifyInterviewCancelled(
      interview.candidate_id,
      interview.job_title,
      interview.title,
      interviewId,
      interview.application_id,
      cleanReason
    );

    return {
      interviewId,
      status: 'Cancelled',
    };
  }

  /**
   * Mark interview as Completed or No Show
   */
  static updateInterviewStatus(
    recruiterUserId: string,
    interviewId: string,
    status: 'Completed' | 'No Show',
    note?: string
  ) {
    if (!['Completed', 'No Show'].includes(status)) {
      throw new Error('Invalid status update. Must be Completed or No Show.');
    }

    const interview = db.prepare(`
      SELECT i.*, j.title as job_title, j.recruiter_id
      FROM interviews i
      JOIN jobs j ON i.job_id = j.id
      WHERE i.id = ?
    `).get(interviewId) as any;

    if (!interview) {
      throw new Error('Interview not found.');
    }

    if (interview.recruiter_id !== recruiterUserId) {
      throw new Error('Forbidden: You do not own this interview.');
    }

    const cleanNote = (note || '').trim();
    const oldStatus = interview.status;

    db.prepare(`
      UPDATE interviews
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, interviewId);

    // Insert Audit History
    const historyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO interview_status_history (
        id, interview_id, old_status, new_status, old_scheduled_at, new_scheduled_at, changed_by, changed_by_role, note, changed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'recruiter', ?, datetime('now'))
    `).run(historyId, interviewId, oldStatus, status, interview.scheduled_at, interview.scheduled_at, recruiterUserId, cleanNote || `Interview marked as ${status}`);

    // Trigger Notification
    NotificationService.notifyInterviewStatusUpdate(
      interview.candidate_id,
      interview.job_title,
      interview.title,
      status,
      interviewId,
      interview.application_id
    );

    return {
      interviewId,
      status,
    };
  }

  /**
   * Get Candidate Interviews categorized into Upcoming and Past
   */
  static getCandidateInterviews(candidateUserId: string) {
    const rawRows = db.prepare(`
      SELECT 
        i.id, i.application_id, i.candidate_id, i.job_id,
        i.title, i.interview_type, i.scheduled_at, i.duration_minutes,
        i.location, i.meeting_url, i.description, i.status,
        i.cancellation_reason, i.reschedule_reason, i.created_at, i.updated_at,
        j.title as job_title, j.company_name, j.location as job_location, j.work_mode,
        rp.full_name as recruiter_name,
        a.status as application_status
      FROM interviews i
      JOIN jobs j ON i.job_id = j.id
      JOIN users ru ON i.recruiter_id = ru.id
      LEFT JOIN recruiter_profiles rp ON ru.id = rp.user_id
      JOIN applications a ON i.application_id = a.id
      WHERE i.candidate_id = ?
      ORDER BY i.scheduled_at ASC
    `).all(candidateUserId) as any[];

    const now = new Date().toISOString();

    const upcoming: any[] = [];
    const past: any[] = [];

    for (const r of rawRows) {
      const item = {
        id: r.id,
        applicationId: r.application_id,
        jobId: r.job_id,
        jobTitle: r.job_title,
        companyName: r.company_name,
        jobLocation: r.job_location,
        workMode: r.work_mode,
        recruiterName: r.recruiter_name || 'Hiring Manager',
        applicationStatus: r.application_status,
        title: r.title,
        interviewType: r.interview_type,
        scheduledAt: r.scheduled_at,
        durationMinutes: r.duration_minutes,
        location: r.location,
        meetingUrl: r.meeting_url,
        description: r.description,
        status: r.status,
        cancellationReason: r.cancellation_reason,
        rescheduleReason: r.reschedule_reason,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };

      if ((r.status === 'Scheduled' || r.status === 'Rescheduled') && r.scheduled_at >= now) {
        upcoming.push(item);
      } else {
        past.push(item);
      }
    }

    // Past is sorted newest first
    past.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    return {
      upcoming,
      past,
      total: rawRows.length,
    };
  }

  /**
   * Get Recruiter Interviews across all jobs owned by recruiter
   */
  static getRecruiterInterviews(
    recruiterUserId: string,
    params?: { status?: string; jobId?: string; search?: string }
  ) {
    let query = `
      SELECT 
        i.id, i.application_id, i.candidate_id, i.job_id,
        i.title, i.interview_type, i.scheduled_at, i.duration_minutes,
        i.location, i.meeting_url, i.description, i.status,
        i.cancellation_reason, i.reschedule_reason, i.created_at, i.updated_at,
        j.title as job_title, j.company_name,
        cp.full_name as candidate_name, cp.headline as candidate_headline, cp.phone as candidate_phone, cp.photo_url as candidate_photo,
        u.email as candidate_email,
        a.status as application_status
      FROM interviews i
      JOIN jobs j ON i.job_id = j.id
      JOIN applications a ON i.application_id = a.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      JOIN users u ON i.candidate_id = u.id
      WHERE i.recruiter_id = ?
    `;

    const sqlParams: any[] = [recruiterUserId];

    if (params?.jobId && params.jobId !== 'All') {
      query += ` AND i.job_id = ?`;
      sqlParams.push(params.jobId);
    }

    if (params?.status && params.status !== 'All') {
      query += ` AND i.status = ?`;
      sqlParams.push(params.status);
    }

    if (params?.search && params.search.trim()) {
      const p = `%${params.search.trim()}%`;
      query += ` AND (cp.full_name LIKE ? OR j.title LIKE ? OR i.title LIKE ? OR u.email LIKE ?)`;
      sqlParams.push(p, p, p, p);
    }

    query += ` ORDER BY i.scheduled_at ASC`;

    const rawRows = db.prepare(query).all(...sqlParams) as any[];

    const now = new Date().toISOString();

    const interviews = rawRows.map((r) => ({
      id: r.id,
      applicationId: r.application_id,
      candidateId: r.candidate_id,
      jobId: r.job_id,
      jobTitle: r.job_title,
      companyName: r.company_name,
      candidateName: r.candidate_name,
      candidateHeadline: r.candidate_headline,
      candidateEmail: r.candidate_email,
      candidatePhone: r.candidate_phone,
      candidatePhoto: r.candidate_photo,
      applicationStatus: r.application_status,
      title: r.title,
      interviewType: r.interview_type,
      scheduledAt: r.scheduled_at,
      durationMinutes: r.duration_minutes,
      location: r.location,
      meetingUrl: r.meeting_url,
      description: r.description,
      status: r.status,
      cancellationReason: r.cancellation_reason,
      rescheduleReason: r.reschedule_reason,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      isUpcoming: (r.status === 'Scheduled' || r.status === 'Rescheduled') && r.scheduled_at >= now,
    }));

    // Calculate quick counts
    const allRecruiterInterviews = db.prepare(`
      SELECT status, scheduled_at FROM interviews WHERE recruiter_id = ?
    `).all(recruiterUserId) as any[];

    const stats = {
      total: allRecruiterInterviews.length,
      scheduled: allRecruiterInterviews.filter((i) => (i.status === 'Scheduled' || i.status === 'Rescheduled') && i.scheduled_at >= now).length,
      completed: allRecruiterInterviews.filter((i) => i.status === 'Completed').length,
      cancelled: allRecruiterInterviews.filter((i) => i.status === 'Cancelled').length,
      noShow: allRecruiterInterviews.filter((i) => i.status === 'No Show').length,
    };

    return {
      interviews,
      stats,
    };
  }

  /**
   * Get single interview details with role-based access control
   */
  static getInterviewById(userId: string, userRole: string, interviewId: string) {
    const raw = db.prepare(`
      SELECT 
        i.*,
        j.title as job_title, j.company_name, j.location as job_location, j.work_mode, j.employment_type,
        cp.full_name as candidate_name, cp.headline as candidate_headline, cp.phone as candidate_phone, cp.photo_url as candidate_photo,
        u.email as candidate_email,
        rp.full_name as recruiter_name,
        a.status as application_status
      FROM interviews i
      JOIN jobs j ON i.job_id = j.id
      JOIN applications a ON i.application_id = a.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      JOIN users u ON i.candidate_id = u.id
      JOIN users ru ON i.recruiter_id = ru.id
      LEFT JOIN recruiter_profiles rp ON ru.id = rp.user_id
      WHERE i.id = ?
    `).get(interviewId) as any;

    if (!raw) {
      throw new Error('Interview not found.');
    }

    if (userRole === 'candidate' && raw.candidate_id !== userId) {
      throw new Error('Forbidden: You do not have permission to view this interview.');
    }

    if (userRole === 'recruiter' && raw.recruiter_id !== userId) {
      throw new Error('Forbidden: You do not have permission to view this interview.');
    }

    // Fetch history
    const history = db.prepare(`
      SELECT id, old_status, new_status, old_scheduled_at, new_scheduled_at, changed_by_role, note, changed_at
      FROM interview_status_history
      WHERE interview_id = ?
      ORDER BY changed_at ASC
    `).all(interviewId);

    return {
      interview: {
        id: raw.id,
        applicationId: raw.application_id,
        candidateId: raw.candidate_id,
        recruiterId: raw.recruiter_id,
        jobId: raw.job_id,
        jobTitle: raw.job_title,
        companyName: raw.company_name,
        jobLocation: raw.job_location,
        workMode: raw.work_mode,
        employmentType: raw.employment_type,
        candidateName: raw.candidate_name,
        candidateHeadline: raw.candidate_headline,
        candidateEmail: raw.candidate_email,
        candidatePhone: raw.candidate_phone,
        candidatePhoto: raw.candidate_photo,
        recruiterName: raw.recruiter_name || 'Hiring Manager',
        applicationStatus: raw.application_status,
        title: raw.title,
        interviewType: raw.interview_type,
        scheduledAt: raw.scheduled_at,
        durationMinutes: raw.duration_minutes,
        location: raw.location,
        meetingUrl: raw.meeting_url,
        description: raw.description,
        status: raw.status,
        cancellationReason: raw.cancellation_reason,
        rescheduleReason: raw.reschedule_reason,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      },
      history,
    };
  }
}
