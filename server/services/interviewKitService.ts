import crypto from 'crypto';
import { db } from '../database/db.js';

export interface InterviewKitQuestion {
  id: string;
  category: 'Technical' | 'Behavioral' | 'Experience' | 'Role-Specific';
  question: string;
  targetSkillOrGap: string;
  isGapInvestigation: boolean;
  scoringRubric: {
    poor: string; // 1-2 points
    good: string; // 3-4 points
    exemplary: string; // 5 points
  };
  followUpProbes: string[];
  timeBudgetMinutes: number;
  evidenceSpan?: {
    text: string;
    section: string;
  };
}

export interface InterviewKitTemplate {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId?: string;
  candidateName?: string;
  totalTimeMinutes: number;
  questions: InterviewKitQuestion[];
  createdAt: string;
}

export class InterviewKitService {
  /**
   * Generates a tailored interview kit combining candidate verified skills and identified gaps
   */
  public static generateInterviewKit(
    jobId: string,
    candidateId?: string,
    applicationId?: string
  ): InterviewKitTemplate {
    const job = db.prepare('SELECT id, title, description FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) throw new Error(`Job not found with ID: ${jobId}`);

    const reqSkills = db.prepare('SELECT name FROM job_required_skills WHERE job_id = ?').all(jobId) as { name: string }[];
    const prefSkills = db.prepare('SELECT name FROM job_preferred_skills WHERE job_id = ?').all(jobId) as { name: string }[];

    let candidateName = 'Candidate';
    let matchedSkills: string[] = [];
    let missingSkills: string[] = [];

    if (candidateId) {
      const cand = db.prepare('SELECT full_name FROM candidate_profiles WHERE user_id = ?').get(candidateId) as any;
      if (cand) candidateName = cand.full_name;

      const candSkills = db.prepare('SELECT name FROM candidate_skills WHERE candidate_profile_id = (SELECT id FROM candidate_profiles WHERE user_id = ?)').all(candidateId) as { name: string }[];
      const candSkillSet = new Set(candSkills.map((s) => s.name.toLowerCase()));

      for (const req of reqSkills) {
        if (candSkillSet.has(req.name.toLowerCase())) {
          matchedSkills.push(req.name);
        } else {
          missingSkills.push(req.name);
        }
      }
    } else {
      matchedSkills = reqSkills.slice(0, 3).map((s) => s.name);
      missingSkills = reqSkills.slice(3).map((s) => s.name);
    }

    const questions: InterviewKitQuestion[] = [];

    // 1. Technical In-Depth (Targeted at evidenced skill)
    const primarySkill = matchedSkills[0] || reqSkills[0]?.name || 'System Architecture';
    questions.push({
      id: `q_tech_${crypto.randomUUID().slice(0, 6)}`,
      category: 'Technical',
      question: `Describe a complex distributed production system where you designed and implemented core ${primarySkill} components. How did you handle fault tolerance, concurrency, and performance bottlenecks?`,
      targetSkillOrGap: primarySkill,
      isGapInvestigation: false,
      scoringRubric: {
        poor: 'Gives surface-level textbook definitions without practical production trade-offs; fails to mention telemetry, failure modes, or concurrency controls.',
        good: 'Explains concrete architectural choices, trade-offs between consistency and latency, and demonstrates hands-on implementation experience.',
        exemplary: 'Articulates end-to-end failure domain isolation, real production war stories, quantitative SLA/SLO metrics, and post-mortem learnings.',
      },
      followUpProbes: [
        'How did you simulate or test network partitions or cascading failures?',
        'If traffic spiked 10x unexpectedly, what would have been the first bottleneck to degrade?',
      ],
      timeBudgetMinutes: 12,
      evidenceSpan: {
        text: `Demonstrated ${primarySkill} in previous backend engineering roles with verified proficiency.`,
        section: 'Experience',
      },
    });

    // 2. Gap Investigation (Targeted at missing or weakly evidenced skill)
    const gapSkill = missingSkills[0] || prefSkills[0]?.name || 'Cloud Infrastructure & Kubernetes';
    questions.push({
      id: `q_gap_${crypto.randomUUID().slice(0, 6)}`,
      category: 'Technical',
      question: `Our team relies heavily on ${gapSkill}. While this wasn't explicitly prominent in your recent roles, what adjacent technologies have you mastered, and how do you approach rapidly ramping up on ${gapSkill}?`,
      targetSkillOrGap: gapSkill,
      isGapInvestigation: true,
      scoringRubric: {
        poor: 'Defensive or feigns deep expertise without foundational knowledge; no clear learning strategy.',
        good: 'Acknowledges current depth honestly, highlights transferable skills, and shares a structured, rapid upskilling methodology.',
        exemplary: 'Demonstrates strong conceptual fundamentals, parallels from similar technologies, and discusses a recent technology ramp-up accomplished in weeks.',
      },
      followUpProbes: [
        'What foundational concepts do you consider essential before deploying to production with this technology?',
        'Can you share an example of a tool you had to learn quickly on the job to solve a critical issue?',
      ],
      timeBudgetMinutes: 10,
    });

    // 3. Behavioral / Leadership
    questions.push({
      id: `q_behav_${crypto.randomUUID().slice(0, 6)}`,
      category: 'Behavioral',
      question: 'Tell me about a time you strongly disagreed with a team architectural or product decision. How did you present your case, and how did you proceed once the final decision was made?',
      targetSkillOrGap: 'Collaborative Conflict Resolution',
      isGapInvestigation: false,
      scoringRubric: {
        poor: 'Shows passive aggression or resentment; either yields immediately without rationale or undermines the consensus decision.',
        good: 'Presents data-driven arguments objectively, listens to counterarguments, and commits fully to the team direction once decided.',
        exemplary: 'Exemplifies "disagree and commit", actively supports peer ownership, and proactively establishes criteria to re-evaluate the decision if assumptions fail.',
      },
      followUpProbes: [
        'What specific data or benchmarks did you use to substantiate your perspective?',
        'How did you maintain strong trust and collaboration with the dissenting colleague afterward?',
      ],
      timeBudgetMinutes: 10,
    });

    // 4. Role-Specific Problem Solving
    questions.push({
      id: `q_role_${crypto.randomUUID().slice(0, 6)}`,
      category: 'Role-Specific',
      question: `For our ${job.title} role, how would you design an automated, fault-tolerant telemetry and alert pipeline that prevents alert fatigue while maintaining 99.99% availability?`,
      targetSkillOrGap: 'System Reliability & Observability',
      isGapInvestigation: false,
      scoringRubric: {
        poor: 'Proposes naive thresholds without actionable runbooks; no strategy for de-duplication or triage.',
        good: 'Separates symptoms from causes, establishes SLO-based alerting, and incorporates automated triage and runbooks.',
        exemplary: 'Designs self-healing remediation, tiered escalation policies, comprehensive cardinality controls, and dynamic anomaly detection.',
      },
      followUpProbes: [
        'How do you measure whether your alerts are actionable versus noise?',
        'What is your process for conducting blameless post-mortems?',
      ],
      timeBudgetMinutes: 13,
    });

    const totalTimeMinutes = questions.reduce((sum, q) => sum + q.timeBudgetMinutes, 0);

    return {
      id: `kit_${crypto.randomUUID().slice(0, 8)}`,
      jobId,
      jobTitle: job.title,
      candidateId,
      candidateName,
      totalTimeMinutes,
      questions,
      createdAt: new Date().toISOString(),
    };
  }
}
