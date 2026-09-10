import crypto from 'crypto';
import { db } from '../database/db.js';

export interface DuplicateMatchItem {
  id: string;
  resumeId: string;
  matchedResumeId: string;
  candidateId: string;
  matchedCandidateId: string;
  similarityType: 'Exact Duplicate' | 'Likely Duplicate' | 'Not Duplicate';
  similarityScore: number | null;
  detectionMethod: 'SHA-256 Hash' | 'Content Text Cosine/Jaccard' | 'Hybrid';
  createdAt?: string;
  matchedCandidateName?: string;
  isOwnResumeDuplicate?: boolean;
}

/**
 * Normalizes text for robust content-similarity comparison
 */
function normalizeTextForComparison(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Computes Jaccard similarity between two token arrays
 */
function calculateTokenJaccard(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  if (unionCount === 0) return 0;
  return intersectionCount / unionCount;
}

/**
 * Service to detect exact and substantially similar duplicate resumes
 */
export class DuplicateResumeService {
  public static readonly EXACT_MATCH_THRESHOLD = 1.0;
  public static readonly LIKELY_MATCH_THRESHOLD = 0.75;

  /**
   * Evaluates a newly uploaded/processed resume against all existing resumes in the database.
   */
  public static detectDuplicates(
    resumeId: string,
    candidateId: string,
    fileHash: string,
    rawText: string
  ): DuplicateMatchItem[] {
    if (!resumeId || !candidateId) return [];

    const matches: DuplicateMatchItem[] = [];
    const currentTokens = normalizeTextForComparison(rawText);

    // Fetch all other processed resumes
    const otherResumes = db.prepare(`
      SELECT rpd.resume_id, rpd.candidate_id, rpd.file_hash, rpd.raw_text, cp.full_name
      FROM resume_parsed_data rpd
      JOIN candidate_profiles cp ON rpd.candidate_profile_id = cp.id
      WHERE rpd.resume_id != ? AND rpd.status = 'Processed'
    `).all(resumeId) as any[];

    for (const other of otherResumes) {
      let matchType: 'Exact Duplicate' | 'Likely Duplicate' | null = null;
      let score: number = 0;
      let method: 'SHA-256 Hash' | 'Content Text Cosine/Jaccard' | 'Hybrid' = 'SHA-256 Hash';

      // 1. Exact Cryptographic Hash Match
      if (fileHash && other.file_hash && fileHash.trim() === other.file_hash.trim()) {
        matchType = 'Exact Duplicate';
        score = 100;
        method = 'SHA-256 Hash';
      } else if (currentTokens.length >= 5 && other.raw_text) {
        // 2. Tokenized Jaccard Content Similarity
        const otherTokens = normalizeTextForComparison(other.raw_text);
        const jaccard = calculateTokenJaccard(currentTokens, otherTokens);

        if (jaccard >= this.LIKELY_MATCH_THRESHOLD) {
          matchType = 'Likely Duplicate';
          score = Math.round(jaccard * 100);
          method = 'Content Text Cosine/Jaccard';
        }
      }

      if (matchType) {
        const duplicateId = crypto.randomUUID();
        const now = new Date().toISOString();

        // Check if existing record already present
        const existing = db.prepare(`
          SELECT id FROM resume_duplicate_matches
          WHERE (resume_id = ? AND matched_resume_id = ?)
             OR (resume_id = ? AND matched_resume_id = ?)
        `).get(resumeId, other.resume_id, other.resume_id, resumeId) as any;

        if (!existing) {
          db.prepare(`
            INSERT INTO resume_duplicate_matches (
              id, resume_id, matched_resume_id, candidate_id, matched_candidate_id,
              similarity_type, similarity_score, detection_method, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            duplicateId,
            resumeId,
            other.resume_id,
            candidateId,
            other.candidate_id,
            matchType,
            score,
            method,
            now
          );
        }

        matches.push({
          id: existing?.id || duplicateId,
          resumeId,
          matchedResumeId: other.resume_id,
          candidateId,
          matchedCandidateId: other.candidate_id,
          similarityType: matchType,
          similarityScore: score,
          detectionMethod: method,
          createdAt: now,
          matchedCandidateName: other.full_name,
          isOwnResumeDuplicate: candidateId === other.candidate_id,
        });
      }
    }

    return matches;
  }

  /**
   * Retrieves duplicate status for a resume with privacy boundaries
   */
  public static getResumeDuplicates(
    resumeId: string,
    requesterUserId: string,
    requesterRole: string
  ): {
    hasDuplicate: boolean;
    highestSimilarityType: 'Exact Duplicate' | 'Likely Duplicate' | 'Not Duplicate';
    matchesCount: number;
    matches: DuplicateMatchItem[];
    privacySafeMessage: string;
  } {
    const rawMatches = db.prepare(`
      SELECT rdm.*, cp.full_name as matched_name
      FROM resume_duplicate_matches rdm
      LEFT JOIN candidate_profiles cp ON cp.user_id = rdm.matched_candidate_id
      WHERE rdm.resume_id = ? OR rdm.matched_resume_id = ?
      ORDER BY rdm.similarity_score DESC
    `).all(resumeId, resumeId) as any[];

    if (rawMatches.length === 0) {
      return {
        hasDuplicate: false,
        highestSimilarityType: 'Not Duplicate',
        matchesCount: 0,
        matches: [],
        privacySafeMessage: 'No duplicate resume matches detected.',
      };
    }

    const hasExact = rawMatches.some((m) => m.similarity_type === 'Exact Duplicate');
    const highestSimilarityType = hasExact ? 'Exact Duplicate' : 'Likely Duplicate';

    // Sanitize for candidates (do not reveal other candidate identities)
    const sanitizedMatches = rawMatches.map((m) => {
      const isOwn = m.candidate_id === requesterUserId || m.matched_candidate_id === requesterUserId;
      return {
        id: m.id,
        resumeId: m.resume_id,
        matchedResumeId: m.matched_resume_id,
        candidateId: m.candidate_id,
        matchedCandidateId: m.matched_candidate_id,
        similarityType: m.similarity_type as 'Exact Duplicate' | 'Likely Duplicate',
        similarityScore: m.similarity_score,
        detectionMethod: m.detection_method,
        createdAt: m.created_at,
        matchedCandidateName: requesterRole === 'candidate' && !isOwn ? undefined : m.matched_name,
        isOwnResumeDuplicate: isOwn,
      };
    });

    let privacySafeMessage = '';
    if (requesterRole === 'candidate') {
      const isOwnUpload = sanitizedMatches.some((m) => m.isOwnResumeDuplicate);
      privacySafeMessage = isOwnUpload
        ? 'This file matches a previously uploaded resume in your Resumio profile.'
        : 'This document shares substantial similarities with an existing file in the system.';
    } else {
      privacySafeMessage = `Potential ${highestSimilarityType.toLowerCase()} detected across ${rawMatches.length} submission(s). Review candidate applications carefully.`;
    }

    return {
      hasDuplicate: true,
      highestSimilarityType,
      matchesCount: rawMatches.length,
      matches: sanitizedMatches,
      privacySafeMessage,
    };
  }
}
