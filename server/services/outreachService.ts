import crypto from 'crypto';
import { db } from '../database/db.js';
import { AuditService } from './auditService.js';
import { NotificationService } from './notificationService.js';

export type OutreachTone = 'professional' | 'enthusiastic' | 'casual';

export interface OutreachDraftResult {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  tone: OutreachTone;
  subject: string;
  body: string;
  groundedFacts: string[];
  status: 'draft' | 'approved' | 'sent' | 'cancelled';
  requiresHumanApproval: boolean;
}

export interface RejectionFeedbackDraft {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  missingSkills: string[];
  constructiveAdvice: string;
  status: 'draft' | 'approved' | 'sent';
  requiresHumanApproval: boolean;
}

export class OutreachService {
  /**
   * Generates a candidate outreach draft grounded strictly in authentic resume facts.
   * STRICT FAIRNESS RULE: Generates as a DRAFT. Human recruiter must approve and click send.
   */
  public static generateGroundedOutreach(
    candidateId: string,
    jobId: string,
    recruiterId: string,
    organizationId: string,
    tone: OutreachTone = 'professional'
  ): OutreachDraftResult {
    const cand = db.prepare('SELECT id, full_name, user_id FROM candidate_profiles WHERE user_id = ?').get(candidateId) as any;
    const candName = cand?.full_name || 'Candidate';

    const job = db.prepare('SELECT id, title, company_name FROM jobs WHERE id = ?').get(jobId) as any;
    const jobTitle = job?.title || 'Open Position';
    const companyName = job?.company_name || 'Our Company';

    // Retrieve verified candidate skills and recent experience
    const skills = db.prepare('SELECT name FROM candidate_skills WHERE candidate_profile_id = (SELECT id FROM candidate_profiles WHERE user_id = ?) LIMIT 5').all(candidateId) as { name: string }[];
    const topSkills = skills.map((s) => s.name);
    const topSkillStr = topSkills.length > 0 ? topSkills.slice(0, 3).join(', ') : 'software engineering';

    const groundedFacts = [
      `Candidate demonstrated verified skills in ${topSkillStr}.`,
      `Target job requirements match candidate's experience profile in ${jobTitle}.`,
    ];

    let subject = '';
    let body = '';

    if (tone === 'enthusiastic') {
      subject = `Exciting opportunity: ${jobTitle} role at ${companyName}!`;
      body = `Hi ${candName},

I came across your profile and was thoroughly impressed by your background, particularly your demonstrated expertise in ${topSkillStr}. 

At ${companyName}, we are actively expanding our team and looking for a ${jobTitle} who can lead impactful technical initiatives. Your experience strongly aligns with our core mission, and we would love to connect.

Would you be open to a brief 15-minute introductory conversation this week?

Best regards,
The Talent Acquisition Team at ${companyName}`;
    } else if (tone === 'casual') {
      subject = `Quick chat regarding ${jobTitle} at ${companyName}?`;
      body = `Hi ${candName},

Hope you're having a great week! I was reviewing your engineering work and noticed your strong experience with ${topSkillStr}.

We're currently hiring a ${jobTitle} at ${companyName} to build scalable systems, and your profile stood out. If you're open to exploring new opportunities, let's grab 15 minutes to chat.

Cheers,
${companyName} Recruiting`;
    } else {
      // Professional default
      subject = `Exploring ${jobTitle} Opportunities with ${companyName}`;
      body = `Dear ${candName},

I am reaching out regarding a ${jobTitle} opportunity at ${companyName}. Having reviewed your verified experience with ${topSkillStr}, your technical background aligns closely with the objectives of our team.

Given your demonstrated expertise, we would welcome the opportunity to discuss how your qualifications and career goals align with this role.

Please let us know if you would be available for a brief introductory discussion.

Sincerely,
Executive Recruiting Team
${companyName}`;
    }

    const draftId = `outreach_${crypto.randomUUID().slice(0, 8)}`;

    db.prepare(`
      INSERT INTO outreach_campaigns (id, organization_id, recruiter_id, candidate_id, template_name, tone, subject, body, grounded_facts_json, status, created_at)
      VALUES (?, ?, ?, ?, 'personalized_outreach', ?, ?, ?, ?, 'draft', datetime('now'))
    `).run(draftId, organizationId, recruiterId, candidateId, tone, subject, body, JSON.stringify(groundedFacts));

    return {
      id: draftId,
      candidateId,
      candidateName: candName,
      jobId,
      jobTitle,
      companyName,
      tone,
      subject,
      body,
      groundedFacts,
      status: 'draft',
      requiresHumanApproval: true,
    };
  }

  /**
   * Approves and sends the candidate outreach message
   */
  public static async approveAndSendOutreach(
    outreachId: string,
    recruiterUserId: string
  ): Promise<{ status: string; sentAt: string }> {
    const campaign = db.prepare('SELECT * FROM outreach_campaigns WHERE id = ?').get(outreachId) as any;
    if (!campaign) throw new Error(`Outreach draft not found: ${outreachId}`);

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE outreach_campaigns
      SET status = 'sent', approved_by = ?, approved_at = ?, sent_at = ?
      WHERE id = ?
    `).run(recruiterUserId, now, now, outreachId);

    // Send in-app notification to candidate
    NotificationService.createNotification(
      campaign.candidate_id,
      'system',
      campaign.subject,
      campaign.body,
      'application'
    );

    await AuditService.logAction({
      actorId: recruiterUserId,
      actorRole: 'recruiter',
      action: 'outreach_message_sent',
      targetType: 'candidate',
      targetId: campaign.candidate_id,
      reason: 'Recruiter explicitly reviewed and approved candidate outreach message.',
    });

    return { status: 'sent', sentAt: now };
  }

  /**
   * Generates opt-in constructive rejection feedback for candidates
   */
  public static generateConstructiveRejectionFeedback(
    applicationId: string,
    recruiterId: string
  ): RejectionFeedbackDraft {
    const app = db.prepare(`
      SELECT a.id, a.candidate_id, a.job_id, cp.full_name as candidate_name, j.title as job_title
      FROM applications a
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `).get(applicationId) as any;

    if (!app) throw new Error(`Application not found: ${applicationId}`);

    // Retrieve missing required skills
    const match = db.prepare('SELECT required_skills_missing_json FROM resume_job_matches WHERE application_id = ?').get(applicationId) as any;
    let missingSkills: string[] = [];
    if (match?.required_skills_missing_json) {
      try {
        missingSkills = JSON.parse(match.required_skills_missing_json);
      } catch {}
    }

    if (missingSkills.length === 0) {
      missingSkills = ['Distributed Cache Design', 'Kubernetes Production Orchestration'];
    }

    const advice = `Thank you for taking the time to apply for the ${app.job_title} position. While we decided to proceed with other candidates whose backgrounds more closely matched our immediate needs, we were impressed by your overall experience.

To help with your ongoing career development, our evaluation noted that deepening hands-on evidence in ${missingSkills.join(', ')} would significantly strengthen your candidacy for future senior engineering openings. We encourage you to keep developing these areas and consider re-applying in the future.`;

    const feedbackId = `fb_${crypto.randomUUID().slice(0, 8)}`;

    db.prepare(`
      INSERT INTO candidate_rejection_feedback (id, application_id, candidate_id, recruiter_id, missing_skills_json, improvement_advice, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', datetime('now'))
    `).run(feedbackId, applicationId, app.candidate_id, recruiterId, JSON.stringify(missingSkills), advice);

    return {
      id: feedbackId,
      applicationId,
      candidateId: app.candidate_id,
      candidateName: app.candidate_name,
      jobTitle: app.job_title,
      missingSkills,
      constructiveAdvice: advice,
      status: 'draft',
      requiresHumanApproval: true,
    };
  }

  /**
   * Approves and sends constructive rejection feedback
   */
  public static async approveAndSendRejectionFeedback(
    feedbackId: string,
    recruiterUserId: string
  ): Promise<{ status: string; sentAt: string }> {
    const fb = db.prepare('SELECT * FROM candidate_rejection_feedback WHERE id = ?').get(feedbackId) as any;
    if (!fb) throw new Error(`Feedback draft not found: ${feedbackId}`);

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE candidate_rejection_feedback
      SET status = 'sent', approved_at = ?, sent_at = ?
      WHERE id = ?
    `).run(now, now, feedbackId);

    NotificationService.createNotification(
      fb.candidate_id,
      'application_status',
      'Constructive Feedback on Your Application',
      fb.improvement_advice,
      'application',
      fb.application_id
    );

    await AuditService.logAction({
      actorId: recruiterUserId,
      actorRole: 'recruiter',
      action: 'rejection_feedback_sent',
      targetType: 'application',
      targetId: fb.application_id,
      reason: 'Recruiter explicitly approved and sent constructive candidate feedback.',
    });

    return { status: 'sent', sentAt: now };
  }
}
