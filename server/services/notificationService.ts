import crypto from 'crypto';
import { db } from '../database/db';

export type NotificationType =
  | 'application_status'
  | 'interview_scheduled'
  | 'interview_rescheduled'
  | 'interview_cancelled'
  | 'interview_completed'
  | 'interview_noshow'
  | 'system';

export type RelatedEntityType = 'application' | 'interview' | 'job' | 'system';

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_entity_type: RelatedEntityType | null;
  related_entity_id: string | null;
  is_read: number;
  created_at: string;
}

export class NotificationService {
  /**
   * Insert a generic in-app notification for a specific user
   */
  static createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedEntityType?: RelatedEntityType,
    relatedEntityId?: string
  ): string {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, related_entity_type, related_entity_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `).run(
      id,
      userId,
      type,
      title.trim(),
      message.trim(),
      relatedEntityType || null,
      relatedEntityId || null
    );

    return id;
  }

  /**
   * Helper to format scheduled datetime in a clean, human-readable string
   */
  private static formatDateTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  }

  /**
   * Trigger notification when an application status changes
   */
  static notifyApplicationStatus(
    candidateUserId: string,
    jobTitle: string,
    oldStatus: string,
    newStatus: string,
    applicationId: string,
    rejectionReason?: string
  ): string {
    let title = 'Application status updated';
    let message = `Your application for "${jobTitle}" has been moved to ${newStatus}.`;

    if (newStatus === 'Under Review') {
      title = 'Application Under Review';
      message = `Your application for "${jobTitle}" is now being reviewed by the hiring team.`;
    } else if (newStatus === 'Shortlisted') {
      title = 'Application Shortlisted!';
      message = `Congratulations! Your application for "${jobTitle}" has been shortlisted. The recruiter may contact you soon for the next steps.`;
    } else if (newStatus === 'Rejected') {
      title = 'Application Status Update';
      message = rejectionReason && rejectionReason.trim()
        ? `Update on your application for "${jobTitle}": ${rejectionReason.trim()}`
        : `Thank you for your interest in "${jobTitle}". At this time, the employer has decided not to move forward with your application.`;
    }

    return this.createNotification(
      candidateUserId,
      'application_status',
      title,
      message,
      'application',
      applicationId
    );
  }

  /**
   * Trigger notification when an interview is scheduled
   */
  static notifyInterviewScheduled(
    candidateUserId: string,
    jobTitle: string,
    interviewTitle: string,
    scheduledAt: string,
    interviewId: string,
    applicationId: string
  ): string {
    const formattedTime = this.formatDateTime(scheduledAt);
    const title = 'Interview Scheduled';
    const message = `An interview ("${interviewTitle}") for "${jobTitle}" has been scheduled for ${formattedTime}.`;

    return this.createNotification(
      candidateUserId,
      'interview_scheduled',
      title,
      message,
      'interview',
      interviewId
    );
  }

  /**
   * Trigger notification when an interview is rescheduled
   */
  static notifyInterviewRescheduled(
    candidateUserId: string,
    jobTitle: string,
    interviewTitle: string,
    newScheduledAt: string,
    interviewId: string,
    applicationId: string,
    reason?: string
  ): string {
    const formattedTime = this.formatDateTime(newScheduledAt);
    const title = 'Interview Rescheduled';
    let message = `Your interview ("${interviewTitle}") for "${jobTitle}" has been rescheduled to ${formattedTime}.`;
    if (reason && reason.trim()) {
      message += ` Note: ${reason.trim()}`;
    }

    return this.createNotification(
      candidateUserId,
      'interview_rescheduled',
      title,
      message,
      'interview',
      interviewId
    );
  }

  /**
   * Trigger notification when an interview is cancelled
   */
  static notifyInterviewCancelled(
    candidateUserId: string,
    jobTitle: string,
    interviewTitle: string,
    interviewId: string,
    applicationId: string,
    reason?: string
  ): string {
    const title = 'Interview Cancelled';
    let message = `Your interview ("${interviewTitle}") for "${jobTitle}" has been cancelled.`;
    if (reason && reason.trim()) {
      message += ` Reason: ${reason.trim()}`;
    }

    return this.createNotification(
      candidateUserId,
      'interview_cancelled',
      title,
      message,
      'interview',
      interviewId
    );
  }

  /**
   * Trigger notification when an interview status changes (e.g. Completed or No Show)
   */
  static notifyInterviewStatusUpdate(
    candidateUserId: string,
    jobTitle: string,
    interviewTitle: string,
    status: 'Completed' | 'No Show',
    interviewId: string,
    applicationId: string
  ): string {
    const title = status === 'Completed' ? 'Interview Completed' : 'Interview Status Update';
    const message = status === 'Completed'
      ? `Your interview ("${interviewTitle}") for "${jobTitle}" has been marked as completed.`
      : `Your interview ("${interviewTitle}") for "${jobTitle}" has been marked as no show.`;

    const type: NotificationType = status === 'Completed' ? 'interview_completed' : 'interview_noshow';

    return this.createNotification(
      candidateUserId,
      type,
      title,
      message,
      'interview',
      interviewId
    );
  }

  /**
   * Mark a single notification as read, validating user ownership
   */
  static markAsRead(notificationId: string, userId: string): boolean {
    const res = db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(notificationId, userId);

    return res.changes > 0;
  }

  /**
   * Mark all notifications as read for a given user
   */
  static markAllAsRead(userId: string): number {
    const res = db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `).run(userId);

    return res.changes;
  }

  /**
   * Get unread notification count for a user
   */
  static getUnreadCount(userId: string): number {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId) as any;

    return row?.count || 0;
  }

  /**
   * Retrieve paginated notifications for a user
   */
  static getUserNotifications(
    userId: string,
    limitOrOptions: number | { limit?: number; offset?: number; unreadOnly?: boolean } = 20,
    offsetArg: number = 0,
    unreadOnlyArg: boolean = false
  ): { notifications: NotificationRecord[]; total: number; unreadCount: number } {
    let limit = 20;
    let offset = 0;
    let unreadOnly = false;

    if (typeof limitOrOptions === 'object' && limitOrOptions !== null) {
      limit = limitOrOptions.limit ?? 20;
      offset = limitOrOptions.offset ?? 0;
      unreadOnly = limitOrOptions.unreadOnly ?? false;
    } else {
      limit = typeof limitOrOptions === 'number' ? limitOrOptions : 20;
      offset = offsetArg;
      unreadOnly = unreadOnlyArg;
    }

    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (unreadOnly) {
      whereClause += ' AND is_read = 0';
    }

    const totalRow = db.prepare(`
      SELECT COUNT(*) as total
      FROM notifications
      ${whereClause}
    `).get(...params) as any;

    const unreadRow = db.prepare(`
      SELECT COUNT(*) as unread
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId) as any;

    const notifications = db.prepare(`
      SELECT id, user_id, type, title, message, related_entity_type, related_entity_id, is_read, created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as NotificationRecord[];

    return {
      notifications,
      total: totalRow?.total || 0,
      unreadCount: unreadRow?.unread || 0,
    };
  }
}
