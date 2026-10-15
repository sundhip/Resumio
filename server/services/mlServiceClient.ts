import { envConfig } from '../config/env.js';
import { resilience } from './resilienceService.js';

export interface MLMatchPayload {
  resumeText: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  candidateExperienceYears?: number;
  jobMinExperienceYears?: number;
}

export interface MLMatchResult {
  final_score: number;
  breakdown: {
    required_skills_score: number;
    preferred_skills_score: number;
    experience_score: number;
    qualification_score: number;
    semantic_relevance_score: number;
  };
  matched_skills: string[];
  missing_skills: string[];
  evidence_spans: string[];
  model_version: string;
  isDegradedFallback?: boolean;
}

export class MLServiceClient {
  private baseUrl: string;
  private breaker = resilience.getBreaker('ml-service', {
    failureThreshold: 3,
    resetTimeoutMs: 10000,
    timeoutMs: 3000,
  });

  constructor() {
    this.baseUrl = envConfig.ML_SERVICE_URL;
  }

  public async matchResume(payload: MLMatchPayload, fallbackFn: () => MLMatchResult): Promise<MLMatchResult> {
    return this.breaker.execute(
      async () => {
        const res = await fetch(`${this.baseUrl}/v1/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_text: payload.resumeText,
            job_description: payload.jobDescription,
            required_skills: payload.requiredSkills,
            preferred_skills: payload.preferredSkills || [],
            candidate_experience_years: payload.candidateExperienceYears || 0,
            job_min_experience_years: payload.jobMinExperienceYears || 0,
          }),
          signal: AbortSignal.timeout(3000),
        });

        if (!res.ok) {
          throw new Error(`ML service returned status ${res.status}`);
        }

        const data = await res.json();
        return {
          ...data,
          isDegradedFallback: false,
        };
      },
      () => {
        // Deterministic degraded fallback when ML service is down/tripped
        const fallback = fallbackFn();
        return {
          ...fallback,
          isDegradedFallback: true,
        };
      }
    );
  }

  public async getHealth(): Promise<{ status: string; isDegraded: boolean }> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        return { status: 'healthy', isDegraded: false };
      }
      return { status: 'unhealthy', isDegraded: true };
    } catch {
      return { status: 'unavailable', isDegraded: true };
    }
  }
}

export const mlServiceClient = new MLServiceClient();
