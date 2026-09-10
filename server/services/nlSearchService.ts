import crypto from 'crypto';
import { db } from '../database/db.js';
import { SkillNormalizationService, CANONICAL_SKILL_CATALOG } from './skillNormalizer.js';

export interface InterpretedSearchFilters {
  skills: string[];
  minExperience: number | null;
  jobTitles: string[];
  locations: string[];
  education: string[];
  matchThreshold: number | null;
  querySummary: string;
}

export interface CandidateSearchResultItem {
  candidateId: string;
  candidateProfileId: string;
  fullName: string;
  headline: string;
  location: string;
  photoUrl: string | null;
  experienceYears: number;
  highestEducation: string;
  skills: string[];
  matchedQuerySkills: string[];
  matchScore: number | null;
  latestApplicationJobTitle?: string;
  latestApplicationStatus?: string;
  profileCompletion: number;
  activeResumeId?: string;
}

export interface NaturalLanguageSearchResponse {
  query: string;
  interpreted: InterpretedSearchFilters;
  isRejected: boolean;
  rejectionReason?: string;
  totalResults: number;
  candidates: CandidateSearchResultItem[];
  searchId: string;
}

// Protected characteristics blacklist for strict AI bias guardrails
const PROTECTED_CHARACTERISTICS_KEYWORDS = [
  'male', 'female', 'man', 'woman', 'gender', 'boy', 'girl',
  'race', 'black', 'white', 'asian', 'caucasian', 'hispanic', 'latino', 'african', 'ethnic',
  'religion', 'christian', 'muslim', 'hindu', 'jewish', 'sikh', 'buddhist', 'atheist',
  'gay', 'lesbian', 'bisexual', 'transgender', 'queer', 'lgbt', 'lgbtq', 'sexual orientation',
  'disability', 'handicapped', 'disabled', 'wheelchair', 'autistic',
  'pregnant', 'pregnancy', 'maternity', 'marital status', 'married', 'single',
  'caste', 'tribe', 'political', 'democrat', 'republican',
];

/**
 * Service to interpret recruiter natural-language queries and execute secure, validated database searches.
 */
export class NaturalLanguageSearchService {
  /**
   * Evaluates query safety against protected-characteristic guardrails
   */
  public static checkQuerySafety(query: string): { isSafe: boolean; rejectionReason?: string } {
    const lower = query.toLowerCase();
    const tokens = lower.replace(/[^\w\s]/g, ' ').split(/\s+/);

    for (const keyword of PROTECTED_CHARACTERISTICS_KEYWORDS) {
      if (tokens.includes(keyword)) {
        return {
          isSafe: false,
          rejectionReason:
            'I can help search by job-relevant qualifications such as skills, experience, education, portfolio, and location. Searches targeting protected personal characteristics are strictly barred.',
        };
      }
    }

    return { isSafe: true };
  }

  /**
   * Interprets natural query into validated structured filters
   */
  public static interpretQuery(query: string): InterpretedSearchFilters {
    const lower = query.toLowerCase();
    const foundSkills: string[] = [];

    // 1. Identify skills from canonical skill normalization dictionary
    for (const def of CANONICAL_SKILL_CATALOG) {
      const skill = def.canonical;
      const normalizedSkill = skill.toLowerCase();
      // Match whole word or exact token
      const regex = new RegExp(`\\b${normalizedSkill.replace(/\+/g, '\\+').replace(/\./g, '\\.')}\\b`, 'i');
      if (regex.test(lower)) {
        foundSkills.push(skill);
      }
    }

    // Check common tech aliases
    if (/\b(python|django|flask|fastapi)\b/i.test(lower) && !foundSkills.includes('Python')) {
      if (/\bpython\b/i.test(lower)) foundSkills.push('Python');
    }
    if (/\b(react|reactjs|react\.js)\b/i.test(lower) && !foundSkills.includes('React')) {
      foundSkills.push('React');
    }
    if (/\b(node|nodejs|node\.js)\b/i.test(lower) && !foundSkills.includes('Node.js')) {
      foundSkills.push('Node.js');
    }
    if (/\b(postgres|postgresql)\b/i.test(lower) && !foundSkills.includes('PostgreSQL')) {
      foundSkills.push('PostgreSQL');
    }
    if (/\b(ts|typescript)\b/i.test(lower) && !foundSkills.includes('TypeScript')) {
      foundSkills.push('TypeScript');
    }
    if (/\b(aws|amazon web services)\b/i.test(lower) && !foundSkills.includes('AWS Cloud')) {
      foundSkills.push('AWS Cloud');
    }
    if (/\b(docker|k8s|kubernetes)\b/i.test(lower)) {
      if (/\bdocker\b/i.test(lower) && !foundSkills.includes('Docker')) foundSkills.push('Docker');
      if (/\b(k8s|kubernetes)\b/i.test(lower) && !foundSkills.includes('Kubernetes')) foundSkills.push('Kubernetes');
    }

    // 2. Extract Minimum Experience Years
    let minExperience: number | null = null;
    const expMatch = lower.match(/(\d+)\+?\s*(?:years?|yrs?|yr)/i);
    if (expMatch && expMatch[1]) {
      const parsed = parseInt(expMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 30) {
        minExperience = parsed;
      }
    }

    // 3. Extract Job Titles / Roles
    const jobTitles: string[] = [];
    const roles = ['backend', 'frontend', 'full stack', 'architect', 'devops', 'machine learning', 'data engineer', 'mobile', 'cloud engineer'];
    for (const role of roles) {
      if (lower.includes(role)) {
        jobTitles.push(role.charAt(0).toUpperCase() + role.slice(1));
      }
    }

    // 4. Extract Locations
    const locations: string[] = [];
    const knownLocations = ['remote', 'bengaluru', 'bangalore', 'chennai', 'hyderabad', 'mumbai', 'delhi', 'pune', 'san francisco', 'london', 'new york'];
    for (const loc of knownLocations) {
      if (lower.includes(loc)) {
        locations.push(loc === 'bangalore' ? 'Bengaluru' : loc.charAt(0).toUpperCase() + loc.slice(1));
      }
    }

    // 5. Extract Education
    const education: string[] = [];
    if (/\b(b\.?tech|bachelor|b\.?e|b\.?s|bca)\b/i.test(lower)) {
      education.push("Bachelor's Degree / B.Tech");
    }
    if (/\b(m\.?tech|master|m\.?s|mca|mba)\b/i.test(lower)) {
      education.push("Master's Degree");
    }
    if (/\b(ph\.?d|doctorate)\b/i.test(lower)) {
      education.push('Doctorate / Ph.D');
    }

    // Build human-friendly interpretation summary
    const summaryParts: string[] = [];
    if (foundSkills.length > 0) summaryParts.push(`Skills: ${foundSkills.join(', ')}`);
    if (minExperience !== null) summaryParts.push(`Experience: ${minExperience}+ years`);
    if (jobTitles.length > 0) summaryParts.push(`Role: ${jobTitles.join(', ')}`);
    if (locations.length > 0) summaryParts.push(`Location: ${locations.join(', ')}`);
    if (education.length > 0) summaryParts.push(`Education: ${education.join(', ')}`);

    const querySummary = summaryParts.length > 0 ? summaryParts.join(' • ') : 'General candidate search';

    return {
      skills: foundSkills,
      minExperience,
      jobTitles,
      locations,
      education,
      matchThreshold: null,
      querySummary,
    };
  }

  /**
   * Executes database candidate search based on structured interpretation
   */
  public static async searchCandidates(
    recruiterUserId: string,
    rawQuery: string,
    targetJobId?: string
  ): Promise<NaturalLanguageSearchResponse> {
    const searchId = crypto.randomUUID();
    const trimmed = (rawQuery || '').trim();

    if (!trimmed) {
      return {
        query: '',
        interpreted: { skills: [], minExperience: null, jobTitles: [], locations: [], education: [], matchThreshold: null, querySummary: 'Empty query' },
        isRejected: false,
        totalResults: 0,
        candidates: [],
        searchId,
      };
    }

    // 1. Guardrail Safety Validation
    const safetyCheck = this.checkQuerySafety(trimmed);
    if (!safetyCheck.isSafe) {
      return {
        query: trimmed,
        interpreted: { skills: [], minExperience: null, jobTitles: [], locations: [], education: [], matchThreshold: null, querySummary: 'Query rejected by safety guardrails' },
        isRejected: true,
        rejectionReason: safetyCheck.rejectionReason,
        totalResults: 0,
        candidates: [],
        searchId,
      };
    }

    // 2. Query Interpretation
    const interpreted = this.interpretQuery(trimmed);

    // 3. Query Candidate Pool from Database
    // Candidates who have applied to any of recruiter's jobs OR all registered candidates in candidate_profiles
    const candidatesDb = db.prepare(`
      SELECT cp.id as profile_id, cp.user_id, cp.full_name, cp.headline, cp.location, cp.photo_url, cp.profile_completion,
             u.email,
             (SELECT cr.id FROM candidate_resumes cr WHERE cr.candidate_profile_id = cp.id AND cr.is_active = 1 LIMIT 1) as active_resume_id
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE u.status = 'active'
    `).all() as any[];

    const candidateResults: CandidateSearchResultItem[] = [];

    for (const cand of candidatesDb) {
      // Fetch skills from candidate_skills table and parsed resume
      const profileSkills = (db.prepare('SELECT name FROM candidate_skills WHERE candidate_profile_id = ?').all(cand.profile_id) as any[]).map((s) => s.name);
      
      let parsedSkills: string[] = [];
      let parsedExpYears = 0;
      let parsedEdu = 'Not Specified';

      if (cand.active_resume_id) {
        const parsed = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(cand.active_resume_id) as any;
        const screening = db.prepare('SELECT * FROM resume_screenings WHERE resume_id = ?').get(cand.active_resume_id) as any;
        if (parsed) {
          try { parsedSkills = JSON.parse(parsed.skills_json || '[]'); } catch {}
        }
        if (screening && typeof screening.experience_years_detected === 'number') {
          parsedExpYears = screening.experience_years_detected;
        }
      }

      // Check experience table if parsed is 0
      if (parsedExpYears === 0) {
        const expRows = db.prepare('SELECT start_date, end_date, currently_working FROM candidate_experience WHERE candidate_profile_id = ?').all(cand.profile_id) as any[];
        if (expRows.length > 0) {
          let totalMonths = 0;
          const now = new Date();
          for (const exp of expRows) {
            if (!exp.start_date) continue;
            const start = new Date(exp.start_date);
            const end = exp.currently_working ? now : (exp.end_date ? new Date(exp.end_date) : now);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              totalMonths += Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
            }
          }
          parsedExpYears = Math.round((totalMonths / 12) * 10) / 10;
        }
      }

      // Highest Education
      const eduRow = db.prepare('SELECT degree, field_of_study FROM candidate_education WHERE candidate_profile_id = ? LIMIT 1').get(cand.profile_id) as any;
      if (eduRow) {
        parsedEdu = eduRow.field_of_study ? `${eduRow.degree} in ${eduRow.field_of_study}` : eduRow.degree;
      }

      const allCandidateSkills = Array.from(new Set([...profileSkills, ...parsedSkills]));

      // Evaluate skill overlap with interpreted query
      let matchedQuerySkills: string[] = [];
      if (interpreted.skills.length > 0) {
        const { matched } = SkillNormalizationService.compareSkillSets(interpreted.skills, allCandidateSkills);
        matchedQuerySkills = matched;
      } else {
        matchedQuerySkills = allCandidateSkills.slice(0, 4);
      }

      // Filter: If query specifically requested skills, require at least 1 matched skill
      if (interpreted.skills.length > 0 && matchedQuerySkills.length === 0) {
        continue;
      }

      // Filter: Minimum experience years
      if (interpreted.minExperience !== null && parsedExpYears < interpreted.minExperience) {
        // Allow slight tolerance if skills match strongly
        if (matchedQuerySkills.length < interpreted.skills.length) {
          continue;
        }
      }

      // Filter: Location matching if specified
      if (interpreted.locations.length > 0) {
        const matchesLoc = interpreted.locations.some((loc) => {
          if (loc.toLowerCase() === 'remote') return true;
          return cand.location && cand.location.toLowerCase().includes(loc.toLowerCase());
        });
        if (!matchesLoc && interpreted.skills.length === 0) {
          continue;
        }
      }

      // Fetch Phase 6 match score if application or target job exists
      let matchScore: number | null = null;
      let latestJobTitle: string | undefined = undefined;
      let latestStatus: string | undefined = undefined;

      const app = db.prepare(`
        SELECT a.id, a.status, j.title as job_title, rjm.match_score
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        LEFT JOIN resume_job_matches rjm ON (rjm.application_id = a.id OR (rjm.resume_id = a.resume_id AND rjm.job_id = a.job_id))
        WHERE a.candidate_profile_id = ?
        ORDER BY a.applied_at DESC LIMIT 1
      `).get(cand.profile_id) as any;

      if (app) {
        latestJobTitle = app.job_title;
        latestStatus = app.status;
        matchScore = typeof app.match_score === 'number' ? app.match_score : null;
      }

      // If targetJobId passed, fetch direct match score
      if (targetJobId && cand.active_resume_id) {
        const targetMatch = db.prepare('SELECT match_score FROM resume_job_matches WHERE resume_id = ? AND job_id = ?').get(cand.active_resume_id, targetJobId) as any;
        if (targetMatch) {
          matchScore = targetMatch.match_score;
        }
      }

      // Compute rank score
      let rank = 0;
      if (interpreted.skills.length > 0) {
        rank += (matchedQuerySkills.length / interpreted.skills.length) * 50;
      } else {
        rank += 30;
      }
      if (interpreted.minExperience !== null && parsedExpYears >= interpreted.minExperience) {
        rank += 20;
      }
      if (matchScore !== null) {
        rank += (matchScore / 100) * 30;
      }

      candidateResults.push({
        candidateId: cand.user_id,
        candidateProfileId: cand.profile_id,
        fullName: cand.full_name || 'Candidate',
        headline: cand.headline || 'Software Engineer',
        location: cand.location || 'Location Not Specified',
        photoUrl: cand.photo_url || null,
        experienceYears: parsedExpYears,
        highestEducation: parsedEdu,
        skills: allCandidateSkills.slice(0, 8),
        matchedQuerySkills,
        matchScore,
        latestApplicationJobTitle: latestJobTitle,
        latestApplicationStatus: latestStatus,
        profileCompletion: cand.profile_completion || 50,
        activeResumeId: cand.active_resume_id || undefined,
      });
    }

    // Sort by matched skills count DESC, then experienceYears DESC
    candidateResults.sort((a, b) => {
      if (b.matchedQuerySkills.length !== a.matchedQuerySkills.length) {
        return b.matchedQuerySkills.length - a.matchedQuerySkills.length;
      }
      if (b.matchScore !== null && a.matchScore !== null && b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return b.experienceYears - a.experienceYears;
    });

    // 4. Record search audit record
    db.prepare(`
      INSERT INTO natural_language_searches (
        id, recruiter_id, query_text, interpreted_filters_json, results_count, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(
      searchId,
      recruiterUserId,
      trimmed,
      JSON.stringify(interpreted),
      candidateResults.length
    );

    return {
      query: trimmed,
      interpreted,
      isRejected: false,
      totalResults: candidateResults.length,
      candidates: candidateResults,
      searchId,
    };
  }
}
