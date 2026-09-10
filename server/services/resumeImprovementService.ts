import crypto from 'crypto';
import { db } from '../database/db.js';
import { SkillNormalizationService } from './skillNormalizer.js';

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

/**
 * Service to generate truthful, evidence-based, constructive resume improvement reviews.
 */
export class ResumeImprovementService {
  public static readonly MODEL_VERSION = 'resumio-ai-v1';

  /**
   * Generates or retrieves resume improvement suggestions for a candidate's resume
   */
  public static async analyzeResume(
    candidateUserId: string,
    resumeId: string,
    jobId?: string | null,
    forceRegenerate: boolean = false
  ): Promise<ResumeImprovementResult> {
    // 1. Verify candidate ownership & resume existence
    const resume = db.prepare(`
      SELECT cr.*, cp.full_name, cp.user_id, cp.id as profile_id
      FROM candidate_resumes cr
      JOIN candidate_profiles cp ON cr.candidate_profile_id = cp.id
      WHERE cr.id = ?
    `).get(resumeId) as any;

    if (!resume) {
      throw new Error(`Resume not found with ID: ${resumeId}`);
    }
    if (resume.user_id !== candidateUserId) {
      throw new Error('Forbidden: You can only request resume reviews for your own uploaded resumes.');
    }

    // 2. Check cached analysis
    if (!forceRegenerate) {
      const cached = db.prepare(`
        SELECT * FROM resume_improvement_analyses
        WHERE resume_id = ? AND (job_id = ? OR (job_id IS NULL AND ? IS NULL))
        ORDER BY created_at DESC LIMIT 1
      `).get(resumeId, jobId || null, jobId || null) as any;

      if (cached && cached.status === 'Completed') {
        let sections: SectionSuggestionItem[] = [];
        let targetJobComparison: TargetJobAlignmentResult | null = null;
        try { sections = JSON.parse(cached.sections_json); } catch {}
        try { targetJobComparison = cached.target_job_comparison_json ? JSON.parse(cached.target_job_comparison_json) : null; } catch {}

        return {
          id: cached.id,
          resumeId: cached.resume_id,
          candidateId: cached.candidate_id,
          candidateName: resume.full_name,
          jobId: cached.job_id,
          overallFeedback: cached.overall_feedback,
          sections,
          targetJobComparison,
          status: 'Completed',
          modelVersion: cached.model_version,
          createdAt: cached.created_at,
          updatedAt: cached.updated_at,
        };
      }
    }

    // 3. Fetch parsed resume data and screening results
    const parsed = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(resumeId) as any;
    const screening = db.prepare('SELECT * FROM resume_screenings WHERE resume_id = ?').get(resumeId) as any;

    let skills: string[] = [];
    let experience: any[] = [];
    let education: any[] = [];
    let projects: any[] = [];
    let certifications: any[] = [];
    let summaryText = '';

    if (parsed) {
      summaryText = parsed.summary || '';
      try { skills = JSON.parse(parsed.skills_json || '[]'); } catch {}
      try { experience = JSON.parse(parsed.experience_json || '[]'); } catch {}
      try { education = JSON.parse(parsed.education_json || '[]'); } catch {}
      try { projects = JSON.parse(parsed.projects_json || '[]'); } catch {}
      try { certifications = JSON.parse(parsed.certifications_json || '[]'); } catch {}
    }

    // 4. Synthesize truthful, actionable section suggestions
    const sections: SectionSuggestionItem[] = [];

    // Summary Section Suggestions
    if (!summaryText.trim()) {
      sections.push({
        section: 'Professional Summary',
        status: 'Missing',
        suggestions: [
          'Add a concise 2–3 sentence professional summary at the top of your resume highlighting your core engineering focus, primary tech stack, and key career strengths.',
        ],
      });
    } else if (summaryText.length < 60) {
      sections.push({
        section: 'Professional Summary',
        status: 'Needs Improvement',
        suggestions: [
          'Your summary is quite brief. Consider expanding it to clearly outline your specialized domains (e.g. backend systems, full-stack development, cloud architecture).',
        ],
      });
    } else {
      sections.push({
        section: 'Professional Summary',
        status: 'Strong',
        suggestions: [
          'Strong summary that clearly introduces your professional background. Ensure your primary skills mentioned here align with the roles you apply to.',
        ],
      });
    }

    // Skills Section Suggestions
    if (skills.length === 0) {
      sections.push({
        section: 'Skills Presentation',
        status: 'Missing',
        suggestions: [
          'No distinct skills section was detected. Add a clear "Technical Skills" section categorizing languages, frameworks, databases, and DevOps tools.',
        ],
      });
    } else if (skills.length < 5) {
      sections.push({
        section: 'Skills Presentation',
        status: 'Needs Improvement',
        suggestions: [
          `You have listed ${skills.length} skills (${skills.join(', ')}). Group your skills into categories (e.g. Languages, Frameworks, Cloud, Databases) to make them easier for recruiters and automated parsers to screen.`,
        ],
      });
    } else {
      sections.push({
        section: 'Skills Presentation',
        status: 'Strong',
        suggestions: [
          `Good breadth of skills identified (${skills.length} skills). Make sure to list skills you are most confident in first.`,
        ],
      });
    }

    // Experience Section Suggestions
    if (experience.length === 0) {
      sections.push({
        section: 'Work Experience',
        status: 'Missing',
        suggestions: [
          'No professional work experience entries were detected. Include job titles, employer names, dates of employment, and bullet points describing your technical contributions.',
        ],
      });
    } else {
      const suggestions: string[] = [];
      const hasActionBullets = experience.some((e) => e.description && (e.description.includes('Built') || e.description.includes('Designed') || e.description.includes('Optimized') || e.description.includes('Led')));

      if (!hasActionBullets) {
        suggestions.push('Begin each experience bullet point with strong action verbs (e.g., "Architected", "Engineered", "Optimized", "Spearheaded") rather than passive descriptions.');
      }
      suggestions.push('Where truthful and supported by your work, describe the measurable business impact and scale (e.g. daily active users, response time improvements, test coverage increases).');
      suggestions.push('Ensure the technologies used for each role are explicitly mentioned within the project bullet points.');

      sections.push({
        section: 'Work Experience',
        status: 'Strong',
        suggestions,
      });
    }

    // Projects Section Suggestions
    if (projects.length === 0) {
      sections.push({
        section: 'Portfolio & Projects',
        status: 'Needs Improvement',
        suggestions: [
          'Highlighting 1–2 significant software projects with tech stacks and live URLs or GitHub links strengthens your profile, especially for technical evaluations.',
        ],
      });
    } else {
      sections.push({
        section: 'Portfolio & Projects',
        status: 'Strong',
        suggestions: [
          'Projects section is present. Make sure each project lists the problem solved, technologies utilized, and links to verified source code or demo environments.',
        ],
      });
    }

    // Education & Certifications
    if (education.length === 0) {
      sections.push({
        section: 'Education',
        status: 'Missing',
        suggestions: ['Add your formal education, degree title, institution name, and year of graduation.'],
      });
    } else {
      sections.push({
        section: 'Education',
        status: 'Strong',
        suggestions: ['Education details are documented and satisfy standard eligibility verification.'],
      });
    }

    // 5. Target Job Comparison (if target job is provided)
    let targetJobComparison: TargetJobAlignmentResult | null = null;
    if (jobId) {
      const job = db.prepare(`
        SELECT j.*, rp.company_name
        FROM jobs j
        JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
        WHERE j.id = ?
      `).get(jobId) as any;

      if (job) {
        const reqSkillRows = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(jobId) as any[];
        const jobReqSkills = reqSkillRows.map((r) => r.name);

        const { matched, missing } = SkillNormalizationService.compareSkillSets(
          jobReqSkills,
          skills,
          parsed?.raw_text || ''
        );

        const alignmentAdvice: string[] = [];
        if (matched.length > 0) {
          alignmentAdvice.push(`Your resume demonstrates verified alignment in ${matched.join(', ')}.`);
        }
        if (missing.length > 0) {
          alignmentAdvice.push(`The job specifically requires ${missing.join(', ')}. If you have practical experience with any of these technologies, ensure they are clearly reflected in your skills list and work bullet points.`);
        } else {
          alignmentAdvice.push('Excellent alignment! Your resume covers all mandatory skills required for this job.');
        }

        targetJobComparison = {
          jobId,
          jobTitle: job.title,
          companyName: job.company_name,
          matchedSkills: matched,
          missingSkillsToHighlight: missing,
          alignmentAdvice,
        };
      }
    }

    // Overall feedback synthesis
    const completeness = screening?.completeness_score || 70;
    let overallFeedback = '';
    if (completeness >= 85) {
      overallFeedback = 'Your resume is well-structured, comprehensive, and contains the critical technical sections expected by recruitment engineering teams. Focus on refining action-oriented bullet points and highlighting measurable impact.';
    } else if (completeness >= 60) {
      overallFeedback = 'Your resume provides a solid foundation, but adding clearer section organization, expanding on key projects, and ensuring all core skills are explicitly listed will substantially increase your match rates.';
    } else {
      overallFeedback = 'Several foundational sections appear incomplete or missing. Adding a comprehensive summary, detailed work experience with technologies used, and complete project descriptions will optimize your candidate profile.';
    }

    // 6. Persist in database
    const analysisId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO resume_improvement_analyses (
        id, resume_id, candidate_id, job_id, overall_feedback,
        sections_json, target_job_comparison_json, model_version, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Completed', ?, ?)
    `).run(
      analysisId,
      resumeId,
      candidateUserId,
      jobId || null,
      overallFeedback,
      JSON.stringify(sections),
      targetJobComparison ? JSON.stringify(targetJobComparison) : null,
      this.MODEL_VERSION,
      now,
      now
    );

    return {
      id: analysisId,
      resumeId,
      candidateId: candidateUserId,
      candidateName: resume.full_name,
      jobId: jobId || null,
      overallFeedback,
      sections,
      targetJobComparison,
      status: 'Completed',
      modelVersion: this.MODEL_VERSION,
      createdAt: now,
      updatedAt: now,
    };
  }
}
