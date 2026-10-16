import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import db from '../database/db.js';
import { mongo } from '../database/mongo.js';
import mongoose from 'mongoose';
import {
  UserModel,
  CandidateProfileModel,
  ApplicationModel,
  CandidateJobSummaryModel,
  NotificationModel,
} from '../models/index.js';

export interface CandidateConsentSettings {
  talentPoolInclusion: boolean;
  trainingDataInclusion: boolean;
  consentVersion: string;
  consentUpdatedAt: string;
}

export interface ProfileAccessRecord {
  id: string;
  candidateId: string;
  viewerId: string;
  viewerName: string;
  viewerRole: string;
  organizationId: string | null;
  organizationName: string | null;
  purpose: string;
  accessedAt: string;
}

export interface CandidateDataPackage {
  format: 'Resumio-Data-Export-GDPR-CCPA-DPDP';
  version: '1.0.0';
  exportedAt: string;
  candidateId: string;
  account: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  profile: any;
  skills: any[];
  experience: any[];
  education: any[];
  projects: any[];
  certifications: any[];
  resumes: any[];
  resumeBuilderDrafts: any[];
  applications: any[];
  jobPreferences: any;
  externalVerifications: any[];
  skillVerifications: any[];
  privacyConsents: CandidateConsentSettings;
  profileAccessAuditLog: ProfileAccessRecord[];
}

/**
 * Exports all candidate data in a structured, portable JSON package
 * compliant with GDPR Article 20, CCPA, and India DPDP 2023 data portability rights.
 */
export function exportAllCandidateData(userId: string): CandidateDataPackage {
  const user = db.prepare(
    `SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?`
  ).get(userId) as any;

  const profile = db.prepare(
    `SELECT * FROM candidate_profiles WHERE user_id = ?`
  ).get(userId) as any;

  const profileId = profile?.id;

  const skills = profileId
    ? db.prepare(`SELECT * FROM candidate_skills WHERE candidate_profile_id = ?`).all(profileId)
    : [];

  const experience = profileId
    ? db.prepare(`SELECT * FROM candidate_experience WHERE candidate_profile_id = ?`).all(profileId)
    : [];

  const education = profileId
    ? db.prepare(`SELECT * FROM candidate_education WHERE candidate_profile_id = ?`).all(profileId)
    : [];

  const projects = profileId
    ? db.prepare(`SELECT * FROM candidate_projects WHERE candidate_profile_id = ?`).all(profileId)
    : [];

  const certifications = profileId
    ? db.prepare(`SELECT * FROM candidate_certifications WHERE candidate_profile_id = ?`).all(profileId)
    : [];

  const resumes = profileId
    ? db.prepare(
        `SELECT cr.id, cr.original_filename, cr.file_type, cr.file_size, cr.created_at as upload_date, rpd.raw_text, rpd.skills_json
         FROM candidate_resumes cr
         LEFT JOIN resume_parsed_data rpd ON rpd.resume_id = cr.id
         WHERE cr.candidate_profile_id = ?`
      ).all(profileId)
    : [];

  const builderDrafts = db.prepare(
    `SELECT id, title, target_job_id, template_id, resume_data_json, ats_health_score, version, updated_at FROM resume_builder_documents WHERE user_id = ?`
  ).all(userId);

  const applications = db.prepare(`
    SELECT a.*, j.title as job_title, j.company_name, j.location as job_location
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    WHERE a.candidate_id = ?
  `).all(userId);

  for (const app of applications as any[]) {
    app.status_history = db.prepare(
      `SELECT * FROM application_status_history WHERE application_id = ? ORDER BY changed_at ASC`
    ).all(app.id);
  }

  const jobPreferences = db.prepare(
    `SELECT * FROM candidate_job_preferences WHERE candidate_id = ?`
  ).get(userId);

  const externalVerifications = db.prepare(
    `SELECT id, provider, handle_or_url, verification_status, metadata_json, evidence_json, created_at, updated_at FROM candidate_verifications WHERE candidate_id = ?`
  ).all(userId);

  const skillVerifications = db.prepare(
    `SELECT * FROM candidate_skill_verifications WHERE candidate_id = ?`
  ).all(userId);

  const rawConsents = db.prepare(
    `SELECT * FROM candidate_data_retention_consents WHERE candidate_id = ?`
  ).get(userId) as any;

  const privacyConsents: CandidateConsentSettings = {
    talentPoolInclusion: rawConsents ? Boolean(rawConsents.talent_pool_inclusion) : true,
    trainingDataInclusion: rawConsents ? Boolean(rawConsents.training_data_inclusion) : false,
    consentVersion: rawConsents?.consent_version || '1.0',
    consentUpdatedAt: rawConsents?.consent_updated_at || new Date().toISOString(),
  };

  const profileAccessAuditLog = (db.prepare(
    `SELECT * FROM profile_access_logs WHERE candidate_id = ? ORDER BY accessed_at DESC`
  ).all(userId) as any[]).map(row => ({
    id: row.id,
    candidateId: row.candidate_id,
    viewerId: row.viewer_id,
    viewerName: row.viewer_name,
    viewerRole: row.viewer_role,
    organizationId: row.organization_id || null,
    organizationName: row.organization_name || null,
    purpose: row.purpose,
    accessedAt: row.accessed_at,
  }));

  return {
    format: 'Resumio-Data-Export-GDPR-CCPA-DPDP',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    candidateId: userId,
    account: user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    } : null,
    profile,
    skills,
    experience,
    education,
    projects,
    certifications,
    resumes,
    resumeBuilderDrafts: builderDrafts,
    applications,
    jobPreferences,
    externalVerifications,
    skillVerifications,
    privacyConsents,
    profileAccessAuditLog,
  };
}

/**
 * Irreversibly cascades account and data deletion across SQLite, MongoDB,
 * and filesystem uploads to honor GDPR "Right to be Forgotten".
 */
export async function deleteCandidateAccount(userId: string): Promise<{
  success: boolean;
  deletedUserId: string;
  purgedAt: string;
  purgedFilesCount: number;
}> {
  // 1. Collect file paths to delete from disk
  const candidateProfile = db.prepare(
    `SELECT id, photo_url FROM candidate_profiles WHERE user_id = ?`
  ).get(userId) as { id: string; photo_url?: string } | undefined;
  const profileId = candidateProfile?.id;

  const resumeRows = profileId
    ? (db.prepare(
        `SELECT stored_filename FROM candidate_resumes WHERE candidate_profile_id = ?`
      ).all(profileId) as { stored_filename: string }[])
    : [];

  let purgedFilesCount = 0;
  for (const r of resumeRows) {
    if (r.stored_filename) {
      const candidates = [
        path.resolve(process.cwd(), 'uploads', r.stored_filename),
        path.resolve(process.cwd(), 'server', 'uploads', r.stored_filename),
        path.resolve(process.cwd(), r.stored_filename),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            fs.unlinkSync(p);
            purgedFilesCount++;
            break;
          } catch (err) {
            console.warn(`Failed to unlink resume file: ${p}`, err);
          }
        }
      }
    }
  }

  if (candidateProfile?.photo_url && candidateProfile.photo_url.startsWith('server/uploads/')) {
    const photoPath = path.resolve(process.cwd(), candidateProfile.photo_url);
    if (fs.existsSync(photoPath)) {
      try {
        fs.unlinkSync(photoPath);
        purgedFilesCount++;
      } catch (err) {
        console.warn(`Failed to unlink photo file: ${photoPath}`, err);
      }
    }
  }

  // 2. Cascade delete in SQLite
  const appRows = db.prepare(
    `SELECT id FROM applications WHERE candidate_id = ?`
  ).all(userId) as { id: string }[];

  const deleteSqlite = db.transaction(() => {
    // Delete application status history
    for (const app of appRows) {
      db.prepare(`DELETE FROM application_status_history WHERE application_id = ?`).run(app.id);
    }
    // Delete applications
    db.prepare(`DELETE FROM applications WHERE candidate_id = ?`).run(userId);

    // Delete candidate sub-tables
    if (profileId) {
      db.prepare(`DELETE FROM candidate_skills WHERE candidate_profile_id = ?`).run(profileId);
      db.prepare(`DELETE FROM candidate_experience WHERE candidate_profile_id = ?`).run(profileId);
      db.prepare(`DELETE FROM candidate_education WHERE candidate_profile_id = ?`).run(profileId);
      db.prepare(`DELETE FROM candidate_projects WHERE candidate_profile_id = ?`).run(profileId);
      db.prepare(`DELETE FROM candidate_certifications WHERE candidate_profile_id = ?`).run(profileId);
      db.prepare(`DELETE FROM resume_parsed_data WHERE candidate_profile_id = ?`).run(profileId);
      db.prepare(`DELETE FROM resume_screenings WHERE resume_id IN (SELECT id FROM candidate_resumes WHERE candidate_profile_id = ?)`).run(profileId);
      db.prepare(`DELETE FROM resume_job_matches WHERE candidate_profile_id = ?`).run(profileId);
      db.prepare(`DELETE FROM candidate_resumes WHERE candidate_profile_id = ?`).run(profileId);
    }

    db.prepare(`DELETE FROM candidate_skill_verifications WHERE candidate_id = ?`).run(userId);
    db.prepare(`DELETE FROM candidate_verifications WHERE candidate_id = ?`).run(userId);
    db.prepare(`DELETE FROM candidate_job_preferences WHERE candidate_id = ?`).run(userId);
    db.prepare(`DELETE FROM candidate_data_retention_consents WHERE candidate_id = ?`).run(userId);
    db.prepare(`DELETE FROM profile_access_logs WHERE candidate_id = ? OR viewer_id = ?`).run(userId, userId);
    db.prepare(`DELETE FROM resume_builder_documents WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM candidate_profiles WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  });

  deleteSqlite();

  // 3. Cascade delete in MongoDB
  try {
    if (mongo?.users) {
      await mongo.users.deleteMany({ $or: [{ id: userId }, { _id: userId }] });
    }
    if (mongo?.candidate_profiles) {
      await mongo.candidate_profiles.deleteMany({ $or: [{ user_id: userId }, { id: profileId || userId }] });
    }
    if (mongo?.applications) {
      await mongo.applications.deleteMany({ candidate_id: userId });
    }
    if (mongo?.candidate_job_summaries) {
      await mongo.candidate_job_summaries.deleteMany({ candidate_id: userId });
    }
    if (mongo?.notifications) {
      await mongo.notifications.deleteMany({ user_id: userId });
    }

    // If Mongoose is actively connected to Atlas/Local MongoDB, sync through models
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await UserModel.deleteMany({ $or: [{ id: userId }, { _id: userId }] });
      if (profileId) {
        await CandidateProfileModel.deleteMany({ $or: [{ user_id: userId }, { id: profileId }] });
      }
      await ApplicationModel.deleteMany({ candidate_id: userId });
      await CandidateJobSummaryModel.deleteMany({ candidate_id: userId });
      await NotificationModel.deleteMany({ user_id: userId });
    }
  } catch (mongoErr) {
    console.warn('MongoDB cascade purge warning:', mongoErr);
  }

  return {
    success: true,
    deletedUserId: userId,
    purgedAt: new Date().toISOString(),
    purgedFilesCount,
  };
}

/**
 * Get candidate privacy consents
 */
export function getCandidateConsents(candidateId: string): CandidateConsentSettings {
  const row = db.prepare(
    `SELECT talent_pool_inclusion, training_data_inclusion, consent_version, consent_updated_at FROM candidate_data_retention_consents WHERE candidate_id = ?`
  ).get(candidateId) as any;

  if (!row) {
    return {
      talentPoolInclusion: true,
      trainingDataInclusion: false,
      consentVersion: '1.0',
      consentUpdatedAt: new Date().toISOString(),
    };
  }

  return {
    talentPoolInclusion: Boolean(row.talent_pool_inclusion),
    trainingDataInclusion: Boolean(row.training_data_inclusion),
    consentVersion: row.consent_version,
    consentUpdatedAt: row.consent_updated_at,
  };
}

/**
 * Update candidate privacy consents
 */
export function updateCandidateConsents(
  candidateId: string,
  settings: { talentPoolInclusion: boolean; trainingDataInclusion: boolean }
): CandidateConsentSettings {
  const now = new Date().toISOString();
  const existing = db.prepare(`SELECT id FROM candidate_data_retention_consents WHERE candidate_id = ?`).get(candidateId) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE candidate_data_retention_consents SET
        talent_pool_inclusion = ?,
        training_data_inclusion = ?,
        consent_updated_at = ?
      WHERE candidate_id = ?
    `).run(
      settings.talentPoolInclusion ? 1 : 0,
      settings.trainingDataInclusion ? 1 : 0,
      now,
      candidateId
    );
  } else {
    const consentId = `consent_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO candidate_data_retention_consents (
        id, candidate_id, talent_pool_inclusion, training_data_inclusion, consent_version, consent_updated_at
      ) VALUES (?, ?, ?, ?, '1.0', ?)
    `).run(
      consentId,
      candidateId,
      settings.talentPoolInclusion ? 1 : 0,
      settings.trainingDataInclusion ? 1 : 0,
      now
    );
  }

  return {
    talentPoolInclusion: settings.talentPoolInclusion,
    trainingDataInclusion: settings.trainingDataInclusion,
    consentVersion: '1.0',
    consentUpdatedAt: now,
  };
}

/**
 * Log recruiter/viewer access to a candidate profile (GDPR / DPDP audit requirement)
 */
export function logProfileAccess(params: {
  candidateId: string;
  viewerId: string;
  viewerName: string;
  viewerRole: string;
  organizationId?: string | null;
  organizationName?: string | null;
  purpose?: string;
}): void {
  // Avoid self-logging candidate viewing their own profile
  if (params.candidateId === params.viewerId) return;

  const id = `pal_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO profile_access_logs (
      id, candidate_id, viewer_id, viewer_name, viewer_role, organization_id, organization_name, purpose, accessed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    id,
    params.candidateId,
    params.viewerId,
    params.viewerName,
    params.viewerRole,
    params.organizationId || null,
    params.organizationName || null,
    params.purpose || 'Application Review'
  );
}

/**
 * Retrieve profile access audit logs for candidate dashboard
 */
export function getProfileAccessLogs(candidateId: string): ProfileAccessRecord[] {
  const rows = db.prepare(`
    SELECT id, candidate_id, viewer_id, viewer_name, viewer_role, organization_id, organization_name, purpose, accessed_at
    FROM profile_access_logs
    WHERE candidate_id = ?
    ORDER BY accessed_at DESC
    LIMIT 100
  `).all(candidateId) as any[];

  return rows.map(r => ({
    id: r.id,
    candidateId: r.candidate_id,
    viewerId: r.viewer_id,
    viewerName: r.viewer_name,
    viewerRole: r.viewer_role,
    organizationId: r.organization_id,
    organizationName: r.organization_name,
    purpose: r.purpose,
    accessedAt: r.accessed_at,
  }));
}
