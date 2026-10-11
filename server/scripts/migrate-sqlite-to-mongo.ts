import path from 'path';
import fs from 'fs';
import { DatabaseAdapter as Database } from '../database/sqliteAdapter.js';
import { mongo } from '../database/mongo.js';

interface MigrationStats {
  tableName: string;
  sqliteCount: number;
  migratedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
}

export async function runMigration(): Promise<{
  success: boolean;
  stats: Record<string, MigrationStats>;
  summary: string;
}> {
  console.log('====================================================');
  console.log('🔄 STARTING SQLITE TO MONGODB DATABASE MIGRATION');
  console.log('====================================================\n');

  const dbPath = path.resolve(process.cwd(), 'server', 'data', 'resumio.db');
  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database file not found at ${dbPath}`);
  }

  const sqliteDb = new Database(dbPath);
  await sqliteDb.ensureReady();

  const stats: Record<string, MigrationStats> = {};

  function initTableStats(tableName: string, count: number): MigrationStats {
    const s: MigrationStats = {
      tableName,
      sqliteCount: count,
      migratedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
    };
    stats[tableName] = s;
    return s;
  }

  // 1. Migrate Users
  const sqliteUsers = sqliteDb.prepare('SELECT * FROM users').all() as any[];
  const userStats = initTableStats('users', sqliteUsers.length);
  for (const u of sqliteUsers) {
    try {
      const existing = await mongo.users.findById(u.id);
      if (existing) {
        userStats.skippedCount++;
      } else {
        await mongo.users.insertOne({
          _id: u.id,
          id: u.id,
          email: u.email.toLowerCase().trim(),
          password_hash: u.password_hash || '',
          google_id: u.google_id || null,
          role: u.role,
          status: u.status || 'active',
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.updated_at || new Date().toISOString(),
        });
        userStats.migratedCount++;
      }
    } catch (e: any) {
      userStats.failedCount++;
      userStats.errors.push(`User ${u.id}: ${e.message}`);
    }
  }

  // 2. Migrate Recruiter Profiles
  const sqliteRecruiters = sqliteDb.prepare('SELECT * FROM recruiter_profiles').all() as any[];
  const recStats = initTableStats('recruiter_profiles', sqliteRecruiters.length);
  for (const r of sqliteRecruiters) {
    try {
      const existing = await mongo.recruiter_profiles.findById(r.id);
      if (existing) {
        recStats.skippedCount++;
      } else {
        await mongo.recruiter_profiles.insertOne({
          _id: r.id,
          id: r.id,
          user_id: r.user_id,
          full_name: r.full_name,
          phone: r.phone || '',
          company_name: r.company_name,
          company_logo: r.company_logo || '',
          industry: r.industry || '',
          location: r.location || '',
          website: r.website || '',
          description: r.description || '',
          profile_completion: r.profile_completion || 40,
          created_at: r.created_at || new Date().toISOString(),
          updated_at: r.updated_at || new Date().toISOString(),
        });
        recStats.migratedCount++;
      }
    } catch (e: any) {
      recStats.failedCount++;
      recStats.errors.push(`Recruiter ${r.id}: ${e.message}`);
    }
  }

  // 3. Migrate Candidate Profiles (with embedded education, skills, experience, projects, certifications, resumes)
  const sqliteCandidates = sqliteDb.prepare('SELECT * FROM candidate_profiles').all() as any[];
  const candStats = initTableStats('candidate_profiles', sqliteCandidates.length);

  for (const c of sqliteCandidates) {
    try {
      const education = sqliteDb.prepare('SELECT * FROM candidate_education WHERE candidate_profile_id = ?').all(c.id) as any[];
      const skills = sqliteDb.prepare('SELECT * FROM candidate_skills WHERE candidate_profile_id = ?').all(c.id) as any[];
      const experience = sqliteDb.prepare('SELECT * FROM candidate_experience WHERE candidate_profile_id = ?').all(c.id) as any[];
      const projects = sqliteDb.prepare('SELECT * FROM candidate_projects WHERE candidate_profile_id = ?').all(c.id) as any[];
      const certifications = sqliteDb.prepare('SELECT * FROM candidate_certifications WHERE candidate_profile_id = ?').all(c.id) as any[];
      const resumes = sqliteDb.prepare('SELECT * FROM candidate_resumes WHERE candidate_profile_id = ?').all(c.id) as any[];

      const mappedEducation = education.map((e) => ({
        _id: e.id,
        id: e.id,
        institution: e.institution,
        degree: e.degree,
        field_of_study: e.field_of_study,
        location: e.location || '',
        start_date: e.start_date,
        end_date: e.end_date || '',
        currently_studying: e.currently_studying || 0,
        grade_or_gpa: e.grade_or_gpa || '',
        description: e.description || '',
        created_at: e.created_at || new Date().toISOString(),
        updated_at: e.updated_at || new Date().toISOString(),
      }));

      const mappedSkills = skills.map((s) => ({
        _id: s.id,
        id: s.id,
        name: s.name,
        proficiency: s.proficiency,
        created_at: s.created_at || new Date().toISOString(),
        updated_at: s.updated_at || new Date().toISOString(),
      }));

      const mappedExperience = experience.map((exp) => ({
        _id: exp.id,
        id: exp.id,
        job_title: exp.job_title,
        company: exp.company,
        employment_type: exp.employment_type,
        location: exp.location || '',
        start_date: exp.start_date,
        end_date: exp.end_date || '',
        currently_working: exp.currently_working || 0,
        description: exp.description || '',
        created_at: exp.created_at || new Date().toISOString(),
        updated_at: exp.updated_at || new Date().toISOString(),
      }));

      const mappedProjects = projects.map((p) => ({
        _id: p.id,
        id: p.id,
        name: p.name,
        role: p.role || '',
        technologies: p.technologies || '',
        description: p.description || '',
        project_url: p.project_url || '',
        github_url: p.github_url || '',
        start_date: p.start_date || '',
        end_date: p.end_date || '',
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
      }));

      const mappedCertifications = certifications.map((cert) => ({
        _id: cert.id,
        id: cert.id,
        name: cert.name,
        issuing_organization: cert.issuing_organization,
        issue_date: cert.issue_date,
        expiration_date: cert.expiration_date || '',
        does_not_expire: cert.does_not_expire || 0,
        credential_id: cert.credential_id || '',
        credential_url: cert.credential_url || '',
        created_at: cert.created_at || new Date().toISOString(),
        updated_at: cert.updated_at || new Date().toISOString(),
      }));

      const mappedResumes = resumes.map((res) => ({
        _id: res.id,
        id: res.id,
        original_filename: res.original_filename,
        stored_filename: res.stored_filename,
        file_type: res.file_type,
        file_size: res.file_size,
        is_active: res.is_active !== undefined ? res.is_active : 1,
        created_at: res.created_at || new Date().toISOString(),
        updated_at: res.updated_at || new Date().toISOString(),
      }));

      const existing = await mongo.candidate_profiles.findById(c.id);
      if (existing) {
        await mongo.candidate_profiles.updateOne(
          { _id: c.id },
          {
            $set: {
              full_name: c.full_name,
              phone: c.phone || '',
              location: c.location || '',
              headline: c.headline || '',
              bio: c.bio || '',
              photo_url: c.photo_url || '',
              profile_completion: c.profile_completion || 30,
              education: mappedEducation,
              skills: mappedSkills,
              experience: mappedExperience,
              projects: mappedProjects,
              certifications: mappedCertifications,
              resumes: mappedResumes,
              updated_at: c.updated_at || new Date().toISOString(),
            },
          }
        );
        candStats.skippedCount++;
      } else {
        await mongo.candidate_profiles.insertOne({
          _id: c.id,
          id: c.id,
          user_id: c.user_id,
          full_name: c.full_name,
          phone: c.phone || '',
          location: c.location || '',
          headline: c.headline || '',
          bio: c.bio || '',
          photo_url: c.photo_url || '',
          profile_completion: c.profile_completion || 30,
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(),
          education: mappedEducation,
          skills: mappedSkills,
          experience: mappedExperience,
          projects: mappedProjects,
          certifications: mappedCertifications,
          resumes: mappedResumes,
        });
        candStats.migratedCount++;
      }
    } catch (e: any) {
      candStats.failedCount++;
      candStats.errors.push(`Candidate Profile ${c.id}: ${e.message}`);
    }
  }

  // 4. Migrate Jobs (with embedded required and preferred skills)
  const sqliteJobs = sqliteDb.prepare('SELECT * FROM jobs').all() as any[];
  const jobStats = initTableStats('jobs', sqliteJobs.length);

  for (const j of sqliteJobs) {
    try {
      const requiredSkills = sqliteDb.prepare('SELECT * FROM job_required_skills WHERE job_id = ?').all(j.id) as any[];
      const preferredSkills = sqliteDb.prepare('SELECT * FROM job_preferred_skills WHERE job_id = ?').all(j.id) as any[];

      const mappedRequired = requiredSkills.map((rs) => ({
        _id: rs.id,
        id: rs.id,
        name: rs.name,
        minimum_years: rs.minimum_years || 0,
        created_at: rs.created_at || new Date().toISOString(),
      }));

      const mappedPreferred = preferredSkills.map((ps) => ({
        _id: ps.id,
        id: ps.id,
        name: ps.name,
        created_at: ps.created_at || new Date().toISOString(),
      }));

      const existing = await mongo.jobs.findById(j.id);
      if (existing) {
        jobStats.skippedCount++;
      } else {
        await mongo.jobs.insertOne({
          _id: j.id,
          id: j.id,
          recruiter_id: j.recruiter_id,
          recruiter_profile_id: j.recruiter_profile_id,
          title: j.title,
          description: j.description,
          responsibilities: j.responsibilities || '',
          company_name: j.company_name,
          location: j.location || '',
          employment_type: j.employment_type,
          work_mode: j.work_mode,
          salary_min: j.salary_min !== null ? Number(j.salary_min) : null,
          salary_max: j.salary_max !== null ? Number(j.salary_max) : null,
          currency: j.currency || 'INR',
          salary_period: j.salary_period || 'year',
          salary_disclosed: j.salary_disclosed !== undefined ? j.salary_disclosed : 1,
          min_experience: j.min_experience || 0,
          max_experience: j.max_experience !== null ? Number(j.max_experience) : null,
          qualification: j.qualification || '',
          deadline: j.deadline || '',
          status: j.status || 'Draft',
          created_at: j.created_at || new Date().toISOString(),
          updated_at: j.updated_at || new Date().toISOString(),
          published_at: j.published_at || null,
          closed_at: j.closed_at || null,
          required_skills: mappedRequired,
          preferred_skills: mappedPreferred,
        });
        jobStats.migratedCount++;
      }
    } catch (e: any) {
      jobStats.failedCount++;
      jobStats.errors.push(`Job ${j.id}: ${e.message}`);
    }
  }

  // 5. Migrate Applications (with embedded status history)
  const sqliteApps = sqliteDb.prepare('SELECT * FROM applications').all() as any[];
  const appStats = initTableStats('applications', sqliteApps.length);

  for (const a of sqliteApps) {
    try {
      const history = sqliteDb.prepare('SELECT * FROM application_status_history WHERE application_id = ? ORDER BY changed_at ASC').all(a.id) as any[];
      const mappedHistory = history.map((h) => ({
        _id: h.id,
        id: h.id,
        old_status: h.old_status || null,
        new_status: h.new_status,
        changed_by: h.changed_by,
        changed_by_role: h.changed_by_role,
        note: h.note || '',
        changed_at: h.changed_at || new Date().toISOString(),
      }));

      const existing = await mongo.applications.findById(a.id);
      if (existing) {
        appStats.skippedCount++;
      } else {
        await mongo.applications.insertOne({
          _id: a.id,
          id: a.id,
          candidate_id: a.candidate_id,
          candidate_profile_id: a.candidate_profile_id,
          job_id: a.job_id,
          resume_id: a.resume_id,
          cover_letter: a.cover_letter || '',
          status: a.status || 'Applied',
          rejection_reason: a.rejection_reason || '',
          applied_at: a.applied_at || new Date().toISOString(),
          updated_at: a.updated_at || new Date().toISOString(),
          status_history: mappedHistory,
        });
        appStats.migratedCount++;
      }
    } catch (e: any) {
      appStats.failedCount++;
      appStats.errors.push(`Application ${a.id}: ${e.message}`);
    }
  }

  // 6. Migrate Resume Parsed Data
  const sqliteParsed = sqliteDb.prepare('SELECT * FROM resume_parsed_data').all() as any[];
  const parsedStats = initTableStats('resume_parsed_data', sqliteParsed.length);
  for (const p of sqliteParsed) {
    try {
      const existing = await mongo.resume_parsed_data.findById(p.id);
      if (existing) {
        parsedStats.skippedCount++;
      } else {
        await mongo.resume_parsed_data.insertOne({
          _id: p.id,
          id: p.id,
          resume_id: p.resume_id,
          candidate_id: p.candidate_id,
          candidate_profile_id: p.candidate_profile_id,
          file_hash: p.file_hash,
          parser_version: p.parser_version || '1.0.0',
          status: p.status || 'Not Processed',
          error_message: p.error_message || '',
          raw_text: p.raw_text || '',
          candidate_name: p.candidate_name || '',
          email: p.email || '',
          phone: p.phone || '',
          location: p.location || '',
          headline: p.headline || '',
          summary: p.summary || '',
          skills_json: p.skills_json || '[]',
          education_json: p.education_json || '[]',
          experience_json: p.experience_json || '[]',
          projects_json: p.projects_json || '[]',
          certifications_json: p.certifications_json || '[]',
          languages_json: p.languages_json || '[]',
          achievements_json: p.achievements_json || '[]',
          confidence_json: p.confidence_json || '{}',
          sections_detected_count: p.sections_detected_count || 0,
          started_at: p.started_at || null,
          completed_at: p.completed_at || null,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        });
        parsedStats.migratedCount++;
      }
    } catch (e: any) {
      parsedStats.failedCount++;
      parsedStats.errors.push(`Parsed Data ${p.id}: ${e.message}`);
    }
  }

  // 7. Migrate Resume Screenings
  const sqliteScreenings = sqliteDb.prepare('SELECT * FROM resume_screenings').all() as any[];
  const screenStats = initTableStats('resume_screenings', sqliteScreenings.length);
  for (const sc of sqliteScreenings) {
    try {
      const existing = await mongo.resume_screenings.findById(sc.id);
      if (existing) {
        screenStats.skippedCount++;
      } else {
        await mongo.resume_screenings.insertOne({
          _id: sc.id,
          id: sc.id,
          resume_id: sc.resume_id,
          application_id: sc.application_id || null,
          job_id: sc.job_id || null,
          screening_version: sc.screening_version || '1.0.0',
          status: sc.status || 'Not Screened',
          error_message: sc.error_message || '',
          completeness_score: sc.completeness_score || 0,
          sections_present_json: sc.sections_present_json || '[]',
          sections_missing_json: sc.sections_missing_json || '[]',
          skills_detected_count: sc.skills_detected_count || 0,
          experience_years_detected: sc.experience_years_detected !== null ? Number(sc.experience_years_detected) : null,
          education_level_detected: sc.education_level_detected || '',
          screening_observations_json: sc.screening_observations_json || '[]',
          screening_flags_json: sc.screening_flags_json || '[]',
          overall_notes: sc.overall_notes || '',
          started_at: sc.started_at || null,
          completed_at: sc.completed_at || null,
          created_at: sc.created_at || new Date().toISOString(),
          updated_at: sc.updated_at || new Date().toISOString(),
        });
        screenStats.migratedCount++;
      }
    } catch (e: any) {
      screenStats.failedCount++;
      screenStats.errors.push(`Screening ${sc.id}: ${e.message}`);
    }
  }

  // 8. Migrate Resume Job Matches
  const sqliteMatches = sqliteDb.prepare('SELECT * FROM resume_job_matches').all() as any[];
  const matchStats = initTableStats('resume_job_matches', sqliteMatches.length);
  for (const m of sqliteMatches) {
    try {
      const existing = await mongo.resume_job_matches.findById(m.id);
      if (existing) {
        matchStats.skippedCount++;
      } else {
        await mongo.resume_job_matches.insertOne({
          _id: m.id,
          id: m.id,
          resume_id: m.resume_id,
          job_id: m.job_id,
          application_id: m.application_id || null,
          candidate_id: m.candidate_id,
          candidate_profile_id: m.candidate_profile_id,
          algorithm_version: m.algorithm_version || '1.0.0',
          status: m.status || 'Not Processed',
          error_message: m.error_message || '',
          match_score: m.match_score || 0,
          required_skills_matched_json: m.required_skills_matched_json || '[]',
          required_skills_missing_json: m.required_skills_missing_json || '[]',
          preferred_skills_matched_json: m.preferred_skills_matched_json || '[]',
          preferred_skills_missing_json: m.preferred_skills_missing_json || '[]',
          required_skills_score: m.required_skills_score || 0,
          preferred_skills_score: m.preferred_skills_score || 0,
          experience_score: m.experience_score || 0,
          qualification_score: m.qualification_score || 0,
          relevance_score: m.relevance_score || 0,
          experience_assessment: m.experience_assessment || '',
          qualification_assessment: m.qualification_assessment || '',
          matching_details_json: m.matching_details_json || '{}',
          started_at: m.started_at || null,
          completed_at: m.completed_at || null,
          created_at: m.created_at || new Date().toISOString(),
          updated_at: m.updated_at || new Date().toISOString(),
        });
        matchStats.migratedCount++;
      }
    } catch (e: any) {
      matchStats.failedCount++;
      matchStats.errors.push(`Match ${m.id}: ${e.message}`);
    }
  }

  // 9. Migrate Candidate Job Summaries
  const sqliteSummaries = sqliteDb.prepare('SELECT * FROM candidate_job_summaries').all() as any[];
  const sumStats = initTableStats('candidate_job_summaries', sqliteSummaries.length);
  for (const s of sqliteSummaries) {
    try {
      const existing = await mongo.candidate_job_summaries.findById(s.id);
      if (existing) {
        sumStats.skippedCount++;
      } else {
        await mongo.candidate_job_summaries.insertOne({
          _id: s.id,
          id: s.id,
          match_id: s.match_id,
          candidate_id: s.candidate_id,
          resume_id: s.resume_id,
          job_id: s.job_id,
          application_id: s.application_id || null,
          status: s.status || 'Not Generated',
          error_message: s.error_message || '',
          summary_text: s.summary_text || '',
          strengths_json: s.strengths_json || '[]',
          gaps_json: s.gaps_json || '[]',
          model_version: s.model_version || 'resumio-ai-v1',
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString(),
        });
        sumStats.migratedCount++;
      }
    } catch (e: any) {
      sumStats.failedCount++;
      sumStats.errors.push(`Summary ${s.id}: ${e.message}`);
    }
  }

  // 10. Migrate Skill Gap Analyses
  const sqliteGaps = sqliteDb.prepare('SELECT * FROM skill_gap_analyses').all() as any[];
  const gapStats = initTableStats('skill_gap_analyses', sqliteGaps.length);
  for (const g of sqliteGaps) {
    try {
      const existing = await mongo.skill_gap_analyses.findById(g.id);
      if (existing) {
        gapStats.skippedCount++;
      } else {
        await mongo.skill_gap_analyses.insertOne({
          _id: g.id,
          id: g.id,
          match_id: g.match_id,
          candidate_id: g.candidate_id,
          resume_id: g.resume_id,
          job_id: g.job_id,
          application_id: g.application_id || null,
          status: g.status || 'Not Generated',
          error_message: g.error_message || '',
          overview: g.overview || '',
          priority_gaps_json: g.priority_gaps_json || '[]',
          matched_areas_json: g.matched_areas_json || '[]',
          recommendations_overview: g.recommendations_overview || '',
          model_version: g.model_version || 'resumio-ai-v1',
          created_at: g.created_at || new Date().toISOString(),
          updated_at: g.updated_at || new Date().toISOString(),
        });
        gapStats.migratedCount++;
      }
    } catch (e: any) {
      gapStats.failedCount++;
      gapStats.errors.push(`Skill Gap ${g.id}: ${e.message}`);
    }
  }

  // 11. Migrate Interviews (with embedded status history)
  const sqliteInterviews = sqliteDb.prepare('SELECT * FROM interviews').all() as any[];
  const intStats = initTableStats('interviews', sqliteInterviews.length);
  for (const iv of sqliteInterviews) {
    try {
      const history = sqliteDb.prepare('SELECT * FROM interview_status_history WHERE interview_id = ? ORDER BY changed_at ASC').all(iv.id) as any[];
      const mappedHistory = history.map((h) => ({
        _id: h.id,
        id: h.id,
        old_status: h.old_status || null,
        new_status: h.new_status,
        old_scheduled_at: h.old_scheduled_at || null,
        new_scheduled_at: h.new_scheduled_at || null,
        changed_by: h.changed_by,
        changed_by_role: h.changed_by_role,
        note: h.note || '',
        changed_at: h.changed_at || new Date().toISOString(),
      }));

      const existing = await mongo.interviews.findById(iv.id);
      if (existing) {
        intStats.skippedCount++;
      } else {
        await mongo.interviews.insertOne({
          _id: iv.id,
          id: iv.id,
          application_id: iv.application_id,
          candidate_id: iv.candidate_id,
          recruiter_id: iv.recruiter_id,
          job_id: iv.job_id,
          title: iv.title,
          interview_type: iv.interview_type,
          scheduled_at: iv.scheduled_at,
          duration_minutes: iv.duration_minutes || 45,
          location: iv.location || '',
          meeting_url: iv.meeting_url || '',
          description: iv.description || '',
          status: iv.status || 'Scheduled',
          cancellation_reason: iv.cancellation_reason || '',
          reschedule_reason: iv.reschedule_reason || '',
          created_at: iv.created_at || new Date().toISOString(),
          updated_at: iv.updated_at || new Date().toISOString(),
          status_history: mappedHistory,
        });
        intStats.migratedCount++;
      }
    } catch (e: any) {
      intStats.failedCount++;
      intStats.errors.push(`Interview ${iv.id}: ${e.message}`);
    }
  }

  // 12. Migrate Notifications
  const sqliteNotifications = sqliteDb.prepare('SELECT * FROM notifications').all() as any[];
  const notifStats = initTableStats('notifications', sqliteNotifications.length);
  for (const n of sqliteNotifications) {
    try {
      const existing = await mongo.notifications.findById(n.id);
      if (existing) {
        notifStats.skippedCount++;
      } else {
        await mongo.notifications.insertOne({
          _id: n.id,
          id: n.id,
          user_id: n.user_id,
          type: n.type,
          title: n.title,
          message: n.message,
          related_entity_type: n.related_entity_type || null,
          related_entity_id: n.related_entity_id || null,
          is_read: n.is_read || 0,
          created_at: n.created_at || new Date().toISOString(),
        });
        notifStats.migratedCount++;
      }
    } catch (e: any) {
      notifStats.failedCount++;
      notifStats.errors.push(`Notification ${n.id}: ${e.message}`);
    }
  }

  // 13. Migrate Audit Logs if table exists in SQLite
  try {
    const hasAuditTable = Boolean(sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'").get());
    if (hasAuditTable) {
      const sqliteAudit = sqliteDb.prepare('SELECT * FROM audit_logs').all() as any[];
      const auditStats = initTableStats('audit_logs', sqliteAudit.length);
      for (const al of sqliteAudit) {
        try {
          const existing = await mongo.audit_logs.findById(al.id);
          if (existing) {
            auditStats.skippedCount++;
          } else {
            let details = al.details;
            if (typeof details === 'string') {
              try { details = JSON.parse(details); } catch (e) {}
            }
            await mongo.audit_logs.insertOne({
              _id: al.id,
              id: al.id,
              user_id: al.user_id || null,
              action: al.action,
              resource_type: al.resource_type || '',
              resource_id: al.resource_id || '',
              ip_address: al.ip_address || '',
              details: details || {},
              created_at: al.created_at || new Date().toISOString(),
            });
            auditStats.migratedCount++;
          }
        } catch (e: any) {
          auditStats.failedCount++;
          auditStats.errors.push(`Audit Log ${al.id}: ${e.message}`);
        }
      }
    }
  } catch (e) {}

  // 14. Migrate Advanced AI Intelligence Tables if they exist
  try {
    const sqliteNlSearches = sqliteDb.prepare('SELECT * FROM natural_language_searches').all() as any[];
    const nlStats = initTableStats('natural_language_searches', sqliteNlSearches.length);
    for (const item of sqliteNlSearches) {
      try {
        const existing = await mongo.natural_language_searches.findById(item.id);
        if (existing) nlStats.skippedCount++;
        else {
          await mongo.natural_language_searches.insertOne({
            _id: item.id,
            id: item.id,
            recruiter_id: item.recruiter_id,
            query_text: item.query_text,
            interpreted_filters_json: item.interpreted_filters_json || '{}',
            results_count: item.results_count || 0,
            created_at: item.created_at || new Date().toISOString(),
          });
          nlStats.migratedCount++;
        }
      } catch (e: any) {
        nlStats.failedCount++;
        nlStats.errors.push(`NL Search ${item.id}: ${e.message}`);
      }
    }
  } catch (e) {}

  try {
    const sqliteQuestions = sqliteDb.prepare('SELECT * FROM interview_question_sets').all() as any[];
    const qStats = initTableStats('interview_question_sets', sqliteQuestions.length);
    for (const item of sqliteQuestions) {
      try {
        const existing = await mongo.interview_question_sets.findById(item.id);
        if (existing) qStats.skippedCount++;
        else {
          await mongo.interview_question_sets.insertOne({
            _id: item.id,
            id: item.id,
            job_id: item.job_id,
            candidate_id: item.candidate_id || null,
            application_id: item.application_id || null,
            recruiter_id: item.recruiter_id,
            questions_json: item.questions_json || '{}',
            model_version: item.model_version || 'resumio-ai-v1',
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          });
          qStats.migratedCount++;
        }
      } catch (e: any) {
        qStats.failedCount++;
        qStats.errors.push(`Questions ${item.id}: ${e.message}`);
      }
    }
  } catch (e) {}

  try {
    const sqliteImprovements = sqliteDb.prepare('SELECT * FROM resume_improvement_analyses').all() as any[];
    const riaStats = initTableStats('resume_improvement_analyses', sqliteImprovements.length);
    for (const item of sqliteImprovements) {
      try {
        const existing = await mongo.resume_improvement_analyses.findById(item.id);
        if (existing) riaStats.skippedCount++;
        else {
          await mongo.resume_improvement_analyses.insertOne({
            _id: item.id,
            id: item.id,
            resume_id: item.resume_id,
            candidate_id: item.candidate_id,
            job_id: item.job_id || null,
            overall_feedback: item.overall_feedback || '',
            sections_json: item.sections_json || '[]',
            target_job_comparison_json: item.target_job_comparison_json || null,
            model_version: item.model_version || 'resumio-ai-v1',
            status: item.status || 'Completed',
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          });
          riaStats.migratedCount++;
        }
      } catch (e: any) {
        riaStats.failedCount++;
        riaStats.errors.push(`Resume Improvement ${item.id}: ${e.message}`);
      }
    }
  } catch (e) {}

  try {
    const sqliteDuplicates = sqliteDb.prepare('SELECT * FROM resume_duplicate_matches').all() as any[];
    const dupStats = initTableStats('resume_duplicate_matches', sqliteDuplicates.length);
    for (const item of sqliteDuplicates) {
      try {
        const existing = await mongo.resume_duplicate_matches.findById(item.id);
        if (existing) dupStats.skippedCount++;
        else {
          await mongo.resume_duplicate_matches.insertOne({
            _id: item.id,
            id: item.id,
            resume_id: item.resume_id,
            matched_resume_id: item.matched_resume_id,
            candidate_id: item.candidate_id,
            matched_candidate_id: item.matched_candidate_id,
            similarity_type: item.similarity_type,
            similarity_score: item.similarity_score || null,
            detection_method: item.detection_method,
            created_at: item.created_at || new Date().toISOString(),
          });
          dupStats.migratedCount++;
        }
      } catch (e: any) {
        dupStats.failedCount++;
        dupStats.errors.push(`Duplicate Match ${item.id}: ${e.message}`);
      }
    }
  } catch (e) {}

  // Print Summary Table
  console.log('\n====================================================');
  console.log('📊 MIGRATION SUMMARY & COMPARISON MATRIX');
  console.log('====================================================');
  console.log('Collection/Domain'.padEnd(30) + 'SQLite'.padEnd(10) + 'Migrated'.padEnd(12) + 'Skipped'.padEnd(10) + 'Failed');
  console.log('-'.repeat(68));

  let totalSqlite = 0;
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const s of Object.values(stats)) {
    totalSqlite += s.sqliteCount;
    totalMigrated += s.migratedCount;
    totalSkipped += s.skippedCount;
    totalFailed += s.failedCount;

    console.log(
      s.tableName.padEnd(30) +
      String(s.sqliteCount).padEnd(10) +
      String(s.migratedCount).padEnd(12) +
      String(s.skippedCount).padEnd(10) +
      String(s.failedCount)
    );
  }

  console.log('-'.repeat(68));
  console.log(
    'TOTAL'.padEnd(30) +
    String(totalSqlite).padEnd(10) +
    String(totalMigrated).padEnd(12) +
    String(totalSkipped).padEnd(10) +
    String(totalFailed)
  );
  console.log('====================================================\n');

  const success = totalFailed === 0;
  return {
    success,
    stats,
    summary: `Migration completed. Total SQLite: ${totalSqlite}, Migrated: ${totalMigrated}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`,
  };
}

// Direct CLI Execution
if (process.argv[1]?.includes('migrate-sqlite-to-mongo')) {
  runMigration()
    .then((res) => {
      if (res.success) {
        console.log('🎉 SQLite to MongoDB Migration Succeeded with 0 Errors!');
        process.exit(0);
      } else {
        console.error('❌ Migration finished with errors:', res.stats);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('💥 Fatal Migration Error:', err);
      process.exit(1);
    });
}
