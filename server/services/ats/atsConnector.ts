/**
 * ATS Connector Architecture
 * Pluggable interface for bidirectional synchronization between Resumio and enterprise Applicant Tracking Systems.
 */

export interface AtsJob {
  externalId: string;
  title: string;
  department?: string;
  location?: string;
  status: 'open' | 'closed' | 'draft';
  description?: string;
  requiredSkills?: string[];
  minExperienceYears?: number;
  rawPayload: Record<string, any>;
}

export interface AtsCandidate {
  externalId: string;
  fullName: string;
  email: string;
  phone?: string;
  headline?: string;
  tags?: string[];
  appliedJobIds?: string[];
  rawPayload: Record<string, any>;
}

export interface AtsApplicationExportPayload {
  candidateId: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  resumeUrl?: string;
  matchScore?: number;
  notes?: string;
}

export interface AtsConnector {
  readonly vendorName: 'greenhouse' | 'lever';
  readonly displayName: string;
  testConnection(): Promise<{ success: boolean; message: string; latencyMs: number }>;
  fetchJobs(): Promise<AtsJob[]>;
  fetchCandidates(jobId?: string): Promise<AtsCandidate[]>;
  exportApplication(payload: AtsApplicationExportPayload): Promise<{ externalApplicationId: string; status: string }>;
}
