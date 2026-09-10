import crypto from 'crypto';
import { db } from '../database/db.js';

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

/**
 * Service to generate structured, realistic, evidence-based AI interview questions.
 */
export class InterviewQuestionService {
  public static readonly MODEL_VERSION = 'resumio-ai-v1';

  /**
   * Validates structured question set object
   */
  public static validateQuestionStructure(data: any): QuestionSetStructure {
    const fallback: QuestionSetStructure = {
      technical: [],
      behavioral: [],
      experience: [],
      roleSpecific: [],
    };

    if (!data || typeof data !== 'object') return fallback;

    const sanitizeList = (list: any[], cat: QuestionItem['category']): QuestionItem[] => {
      if (!Array.isArray(list)) return [];
      return list
        .filter((item) => item && typeof item.question === 'string' && item.question.trim().length > 5)
        .map((item, idx) => ({
          id: item.id || `q-${cat.toLowerCase()}-${idx + 1}-${crypto.randomUUID().slice(0, 4)}`,
          question: item.question.trim(),
          category: cat,
          targetSkill: typeof item.targetSkill === 'string' ? item.targetSkill : undefined,
          evaluationCriteria: typeof item.evaluationCriteria === 'string' ? item.evaluationCriteria : undefined,
        }));
    };

    return {
      technical: sanitizeList(data.technical, 'Technical'),
      behavioral: sanitizeList(data.behavioral, 'Behavioral'),
      experience: sanitizeList(data.experience, 'Experience'),
      roleSpecific: sanitizeList(data.roleSpecific || data.role_specific, 'Role-Specific'),
    };
  }

  /**
   * Generates or retrieves question set for a specific job posting
   */
  public static async generateJobQuestions(
    recruiterUserId: string,
    jobId: string,
    forceRegenerate: boolean = false
  ): Promise<InterviewQuestionSetResult> {
    // 1. Ownership & existence check
    const job = db.prepare(`
      SELECT j.*, rp.company_name
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
      WHERE j.id = ?
    `).get(jobId) as any;

    if (!job) {
      throw new Error(`Job not found with ID: ${jobId}`);
    }
    if (job.recruiter_id !== recruiterUserId) {
      throw new Error('Forbidden: You can only generate interview questions for jobs you own.');
    }

    // 2. Check cached question set
    if (!forceRegenerate) {
      const cached = db.prepare(`
        SELECT * FROM interview_question_sets
        WHERE job_id = ? AND candidate_id IS NULL
        ORDER BY created_at DESC LIMIT 1
      `).get(jobId) as any;

      if (cached) {
        let questions: QuestionSetStructure = { technical: [], behavioral: [], experience: [], roleSpecific: [] };
        try { questions = JSON.parse(cached.questions_json); } catch {}
        const total = questions.technical.length + questions.behavioral.length + questions.experience.length + questions.roleSpecific.length;

        return {
          id: cached.id,
          jobId: cached.job_id,
          candidateId: null,
          applicationId: null,
          recruiterId: cached.recruiter_id,
          jobTitle: job.title,
          companyName: job.company_name,
          questions,
          totalQuestions: total,
          modelVersion: cached.model_version,
          createdAt: cached.created_at,
          updatedAt: cached.updated_at,
        };
      }
    }

    // 3. Synthesize realistic questions from actual job requirements
    const reqSkills = (db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(jobId) as any[]).map((r) => r.name);
    const prefSkills = (db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ?').all(jobId) as any[]).map((r) => r.name);
    const allSkills = [...reqSkills, ...prefSkills];

    const technical: QuestionItem[] = [];
    const behavioral: QuestionItem[] = [];
    const experience: QuestionItem[] = [];
    const roleSpecific: QuestionItem[] = [];

    // Technical questions tailored to skills
    if (reqSkills.length > 0) {
      reqSkills.forEach((skill, i) => {
        technical.push({
          id: `tech-${i + 1}`,
          question: `How have you utilized ${skill} to design or optimize scalable software architectures? Can you describe an architectural challenge you solved using it?`,
          category: 'Technical',
          targetSkill: skill,
          evaluationCriteria: `Look for concrete practical experience with ${skill}, code clarity, and understanding of error handling / performance trade-offs.`,
        });
      });
    } else {
      technical.push({
        id: 'tech-1',
        question: 'Walk us through your end-to-end software development lifecycle and how you approach automated testing and continuous integration.',
        category: 'Technical',
        targetSkill: 'Software Engineering',
        evaluationCriteria: 'System architecture comprehension, CI/CD awareness, and code quality practices.',
      });
    }

    // Behavioral questions
    behavioral.push(
      {
        id: 'beh-1',
        question: 'Tell us about a time when you disagreed with a product specification or engineering decision. How did you advocate for your point of view while maintaining team alignment?',
        category: 'Behavioral',
        evaluationCriteria: 'Constructive communication, openness to feedback, and collaborative problem solving.',
      },
      {
        id: 'beh-2',
        question: 'Describe a situation where a critical production bug occurred unexpectedly. What steps did you take to triage, resolve, and prevent a recurrence?',
        category: 'Behavioral',
        evaluationCriteria: 'Crisis management, root-cause analysis, post-mortem documentation, and composure under pressure.',
      }
    );

    // Experience questions
    const minExp = job.min_experience || 0;
    experience.push(
      {
        id: 'exp-1',
        question: minExp > 0
          ? `With ${minExp}+ years required for this role, what is the most complex system you have contributed to from conception through production deployment?`
          : 'What is the most rewarding technical project you have built, and what lessons did you learn from its delivery?',
        category: 'Experience',
        evaluationCriteria: 'Depth of hands-on responsibility, ownership of deliverable outcomes, and technical maturity.',
      },
      {
        id: 'exp-2',
        question: 'How do you prioritize technical debt versus shipping new product features when working under tight deadline constraints?',
        category: 'Experience',
        evaluationCriteria: 'Pragmatic balance between code maintainability and business speed-to-market.',
      }
    );

    // Role-Specific questions
    roleSpecific.push({
      id: 'role-1',
      question: `What excites you most about the ${job.title} role at ${job.company_name}, and how does your prior engineering background directly align with this position's goals?`,
      category: 'Role-Specific',
      evaluationCriteria: 'Role motivation, research about company objectives, and clarity of personal strengths.',
    });

    const questionSet: QuestionSetStructure = {
      technical,
      behavioral,
      experience,
      roleSpecific,
    };

    // 4. Persist in database
    const setId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO interview_question_sets (
        id, job_id, candidate_id, application_id, recruiter_id,
        questions_json, model_version, created_at, updated_at
      ) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?)
    `).run(
      setId,
      jobId,
      recruiterUserId,
      JSON.stringify(questionSet),
      this.MODEL_VERSION,
      now,
      now
    );

    const totalQuestions = technical.length + behavioral.length + experience.length + roleSpecific.length;

    return {
      id: setId,
      jobId,
      candidateId: null,
      applicationId: null,
      recruiterId: recruiterUserId,
      jobTitle: job.title,
      companyName: job.company_name,
      questions: questionSet,
      totalQuestions,
      modelVersion: this.MODEL_VERSION,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Generates candidate-specific interview questions grounded in actual candidate resume facts
   */
  public static async generateCandidateQuestions(
    recruiterUserId: string,
    applicationId: string,
    forceRegenerate: boolean = false
  ): Promise<InterviewQuestionSetResult> {
    // 1. Fetch application, job, and candidate profile
    const app = db.prepare(`
      SELECT a.*, j.title as job_title, j.recruiter_id, j.min_experience, j.qualification,
             rp.company_name, cp.full_name as candidate_name, cp.headline
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
      JOIN candidate_profiles cp ON a.candidate_profile_id = cp.id
      WHERE a.id = ?
    `).get(applicationId) as any;

    if (!app) {
      throw new Error(`Application not found with ID: ${applicationId}`);
    }
    if (app.recruiter_id !== recruiterUserId) {
      throw new Error('Forbidden: You can only generate candidate questions for applications on your own job postings.');
    }

    // 2. Check cached candidate-specific set
    if (!forceRegenerate) {
      const cached = db.prepare(`
        SELECT * FROM interview_question_sets
        WHERE application_id = ?
        ORDER BY created_at DESC LIMIT 1
      `).get(applicationId) as any;

      if (cached) {
        let questions: QuestionSetStructure = { technical: [], behavioral: [], experience: [], roleSpecific: [] };
        try { questions = JSON.parse(cached.questions_json); } catch {}
        const total = questions.technical.length + questions.behavioral.length + questions.experience.length + questions.roleSpecific.length;

        return {
          id: cached.id,
          jobId: cached.job_id,
          candidateId: cached.candidate_id,
          applicationId: cached.application_id,
          recruiterId: cached.recruiter_id,
          jobTitle: app.job_title,
          companyName: app.company_name,
          candidateName: app.candidate_name,
          questions,
          totalQuestions: total,
          modelVersion: cached.model_version,
          createdAt: cached.created_at,
          updatedAt: cached.updated_at,
        };
      }
    }

    // 3. Fetch candidate's parsed resume and matching record
    const match = db.prepare(`
      SELECT * FROM resume_job_matches WHERE application_id = ?
    `).get(applicationId) as any;

    let reqMatched: string[] = [];
    let reqMissing: string[] = [];
    if (match) {
      try { reqMatched = JSON.parse(match.required_skills_matched_json || '[]'); } catch {}
      try { reqMissing = JSON.parse(match.required_skills_missing_json || '[]'); } catch {}
    }

    const parsedResume = db.prepare(`
      SELECT * FROM resume_parsed_data WHERE resume_id = ?
    `).get(app.resume_id) as any;

    let parsedProjects: any[] = [];
    let parsedExperience: any[] = [];
    if (parsedResume) {
      try { parsedProjects = JSON.parse(parsedResume.projects_json || '[]'); } catch {}
      try { parsedExperience = JSON.parse(parsedResume.experience_json || '[]'); } catch {}
    }

    const technical: QuestionItem[] = [];
    const behavioral: QuestionItem[] = [];
    const experience: QuestionItem[] = [];
    const roleSpecific: QuestionItem[] = [];

    // Verified skills questions
    if (reqMatched.length > 0) {
      reqMatched.slice(0, 3).forEach((skill, idx) => {
        technical.push({
          id: `cand-tech-${idx + 1}`,
          question: `Your resume highlights strong experience with ${skill}. Can you discuss an advanced implementation where you leveraged ${skill} to solve a critical bottleneck?`,
          category: 'Technical',
          targetSkill: skill,
          evaluationCriteria: `Verify deep hands-on expertise with ${skill} versus surface-level familiarity.`,
        });
      });
    }

    // Probe missing required skills gracefully
    if (reqMissing.length > 0) {
      reqMissing.slice(0, 2).forEach((missingSkill, idx) => {
        technical.push({
          id: `cand-gap-${idx + 1}`,
          question: `Our tech stack relies on ${missingSkill}, which is not explicitly detailed on your resume. Have you worked with ${missingSkill} or analogous technologies, and how do you approach ramping up quickly?`,
          category: 'Technical',
          targetSkill: missingSkill,
          evaluationCriteria: `Assess adaptability, conceptual knowledge transfer, and speed of learning new tools.`,
        });
      });
    }

    // Project & Experience deep dives grounded in resume facts
    if (parsedProjects.length > 0) {
      const topProj = parsedProjects[0];
      const projName = topProj.name || topProj.title || 'recent project';
      experience.push({
        id: 'cand-exp-proj',
        question: `In your resume, you mention developing "${projName}". Can you detail the technical architectural decisions you made, the trade-offs considered, and the final impact?`,
        category: 'Experience',
        evaluationCriteria: 'Verification of genuine project contributions and engineering rationale.',
      });
    } else if (parsedExperience.length > 0) {
      const topExp = parsedExperience[0];
      const title = topExp.title || 'your recent role';
      const company = topExp.company || 'your previous company';
      experience.push({
        id: 'cand-exp-work',
        question: `During your tenure as ${title} at ${company}, what was the most complex feature or system you were directly responsible for building?`,
        category: 'Experience',
        evaluationCriteria: 'Ownership, scale, and clarity of technical communication.',
      });
    } else {
      experience.push({
        id: 'cand-exp-general',
        question: `Can you walk us through a significant software project from your background, detailing how you managed requirements, code architecture, and testing?`,
        category: 'Experience',
        evaluationCriteria: 'End-to-end technical execution and problem-solving methodology.',
      });
    }

    // Behavioral
    behavioral.push({
      id: 'cand-beh-1',
      question: `Describe a scenario where a project timeline shifted unexpectedly. How did you adapt your engineering deliverables and communicate progress with stakeholders?`,
      category: 'Behavioral',
      evaluationCriteria: 'Stakeholder communication, adaptability, and commitment to delivery.',
    });

    // Role-specific alignment
    roleSpecific.push({
      id: 'cand-role-1',
      question: `Considering your background as ${app.headline || 'an engineer'}, what specific technical strengths do you feel will provide the fastest value to our ${app.job_title} team?`,
      category: 'Role-Specific',
      evaluationCriteria: 'Self-awareness, role alignment, and enthusiasm for the position.',
    });

    const questionSet: QuestionSetStructure = {
      technical,
      behavioral,
      experience,
      roleSpecific,
    };

    const setId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO interview_question_sets (
        id, job_id, candidate_id, application_id, recruiter_id,
        questions_json, model_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      setId,
      app.job_id,
      app.candidate_id,
      applicationId,
      recruiterUserId,
      JSON.stringify(questionSet),
      this.MODEL_VERSION,
      now,
      now
    );

    const totalQuestions = technical.length + behavioral.length + experience.length + roleSpecific.length;

    return {
      id: setId,
      jobId: app.job_id,
      candidateId: app.candidate_id,
      applicationId,
      recruiterId: recruiterUserId,
      jobTitle: app.job_title,
      companyName: app.company_name,
      candidateName: app.candidate_name,
      questions: questionSet,
      totalQuestions,
      modelVersion: this.MODEL_VERSION,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Updates an existing question set (e.g. after recruiter edits questions)
   */
  public static updateQuestionSet(
    recruiterUserId: string,
    questionSetId: string,
    updatedQuestions: QuestionSetStructure
  ): InterviewQuestionSetResult {
    const existing = db.prepare(`
      SELECT iqs.*, j.title as job_title, rp.company_name, cp.full_name as candidate_name
      FROM interview_question_sets iqs
      JOIN jobs j ON iqs.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_profile_id = rp.id
      LEFT JOIN candidate_profiles cp ON iqs.candidate_id = cp.user_id
      WHERE iqs.id = ?
    `).get(questionSetId) as any;

    if (!existing) {
      throw new Error(`Interview question set not found: ${questionSetId}`);
    }
    if (existing.recruiter_id !== recruiterUserId) {
      throw new Error('Forbidden: You do not have permission to edit this question set.');
    }

    const validated = this.validateQuestionStructure(updatedQuestions);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE interview_question_sets
      SET questions_json = ?, updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(validated), now, questionSetId);

    const total = validated.technical.length + validated.behavioral.length + validated.experience.length + validated.roleSpecific.length;

    return {
      id: existing.id,
      jobId: existing.job_id,
      candidateId: existing.candidate_id,
      applicationId: existing.application_id,
      recruiterId: existing.recruiter_id,
      jobTitle: existing.job_title,
      companyName: existing.company_name,
      candidateName: existing.candidate_name,
      questions: validated,
      totalQuestions: total,
      modelVersion: existing.model_version,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }
}
