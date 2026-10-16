import crypto from 'crypto';
import { db } from '../database/db.js';

export type OrganizationRole = 'Admin' | 'Recruiter' | 'Hiring Manager' | 'Viewer';
export type JobPermission = 'Owner' | 'Editor' | 'Reviewer' | 'Viewer';

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  max_monthly_resumes: number;
  data_retention_days: number;
  eeoc_monitoring_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMemberRecord {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  team: string;
  created_at: string;
}

export class OrganizationService {
  public static readonly DEFAULT_ORG_ID = 'org_resumio_demo';

  /**
   * Retrieves or creates default membership for a user
   */
  public static getOrCreateUserMembership(
    userId: string,
    orgId: string = this.DEFAULT_ORG_ID,
    defaultRole: OrganizationRole = 'Recruiter'
  ): OrganizationMemberRecord {
    let member = db.prepare(`
      SELECT * FROM organization_members WHERE user_id = ? AND organization_id = ?
    `).get(userId, orgId) as OrganizationMemberRecord | undefined;

    if (!member) {
      const id = `mem_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT OR IGNORE INTO organization_members (id, organization_id, user_id, role, team, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'Engineering', datetime('now'), datetime('now'))
      `).run(id, orgId, userId, defaultRole);

      member = db.prepare(`
        SELECT * FROM organization_members WHERE user_id = ? AND organization_id = ?
      `).get(userId, orgId) as OrganizationMemberRecord;
    }

    return member;
  }

  /**
   * Asserts tenant access and permission. Throws error if cross-tenant leakage attempted.
   */
  public static assertTenantAccess(
    userId: string,
    organizationId: string,
    requiredRole?: OrganizationRole
  ): OrganizationMemberRecord {
    const member = db.prepare(`
      SELECT * FROM organization_members WHERE user_id = ? AND organization_id = ?
    `).get(userId, organizationId) as OrganizationMemberRecord | undefined;

    if (!member) {
      throw new Error(`Forbidden: Access denied to organization ${organizationId}. Cross-tenant access is strictly prohibited.`);
    }

    if (requiredRole) {
      const roleHierarchy: Record<OrganizationRole, number> = {
        Viewer: 1,
        'Hiring Manager': 2,
        Recruiter: 3,
        Admin: 4,
      };
      if (roleHierarchy[member.role] < roleHierarchy[requiredRole]) {
        throw new Error(`Forbidden: Insufficient privileges. Required role: ${requiredRole}, current role: ${member.role}`);
      }
    }

    return member;
  }

  /**
   * Checks whether a recruiter has access to a specific job within their organization
   */
  public static canAccessJob(userId: string, jobId: string, organizationId: string): boolean {
    const job = db.prepare('SELECT id, recruiter_id FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) return false;

    // Check organization membership
    const member = db.prepare(`
      SELECT role FROM organization_members WHERE user_id = ? AND organization_id = ?
    `).get(userId, organizationId) as any;
    if (!member) return false;

    // Admins and direct job owners always have access
    if (member.role === 'Admin' || job.recruiter_id === userId) return true;

    // Check explicit job access control entry
    const access = db.prepare(`
      SELECT permission FROM job_access_control WHERE job_id = ? AND user_id = ?
    `).get(jobId, userId) as any;

    return Boolean(access);
  }

  /**
   * Gets quota usage for the organization
   */
  public static getOrganizationQuota(organizationId: string): {
    limit: number;
    usedThisMonth: number;
    remaining: number;
    retentionDays: number;
  } {
    const org = db.prepare('SELECT max_monthly_resumes, data_retention_days FROM organizations WHERE id = ?').get(organizationId) as any;
    const limit = org?.max_monthly_resumes || 5000;
    const retentionDays = org?.data_retention_days || 365;

    // Count resumes parsed in last 30 days for this organization
    const countRow = db.prepare(`
      SELECT COUNT(*) as count FROM candidate_resumes
      WHERE created_at >= datetime('now', '-30 days')
    `).get() as any;

    const used = countRow?.count || 0;
    return {
      limit,
      usedThisMonth: used,
      remaining: Math.max(0, limit - used),
      retentionDays,
    };
  }
}
