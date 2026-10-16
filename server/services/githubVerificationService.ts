import db from '../database/db.js';
import crypto from 'node:crypto';

export interface GitHubRepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  isFork: boolean;
  stars: number;
  forksCount: number;
  language: string | null;
  topics: string[];
  pushedAt: string;
  hasCiOrTests: boolean;
}

export interface SkillEvidenceItem {
  repoName: string;
  repoUrl: string;
  isFork: boolean;
  stars: number;
  matchedOn: string;
  lastPushedAt: string;
}

export interface SkillVerificationBadge {
  skillName: string;
  isVerified: boolean;
  badge: 'Verified by evidence' | 'Unverified';
  evidenceSources: SkillEvidenceItem[];
  confidence: number;
}

export interface GitHubVerificationResult {
  username: string;
  profileUrl: string;
  avatarUrl?: string;
  publicReposCount: number;
  analyzedReposCount: number;
  totalStars: number;
  originalReposRatio: number;
  topLanguages: { language: string; repoCount: number }[];
  verifiedSkills: SkillVerificationBadge[];
  authenticityNotes: string[];
  rateLimitRemaining?: number;
}

interface ETagCacheEntry {
  etag: string;
  data: any;
  cachedAt: number;
}

// In-memory ETag cache for rate-limit preservation
const etagCache = new Map<string, ETagCacheEntry>();

// Test hooks for offline testing
let mockFetchHandler: ((url: string, headers: Record<string, string>) => Promise<{ status: number; headers: Record<string, string>; data: any }>) | null = null;

export function setMockGithubHandlerForTesting(handler: typeof mockFetchHandler) {
  mockFetchHandler = handler;
}

export function clearGithubEtagCache() {
  etagCache.clear();
}

export function getGithubEtagCacheSize(): number {
  return etagCache.size;
}

/**
 * Fetch data from GitHub API with ETag conditional GET and rate limit backoff
 */
async function fetchGithubApi(url: string, token?: string): Promise<{ data: any; notModified: boolean; status: number; headers: Headers | Record<string, string> }> {
  const headers: Record<string, string> = {
    'User-Agent': 'Resumio-Candidate-Verification/1.0',
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cached = etagCache.get(url);
  if (cached && cached.etag) {
    headers['If-None-Match'] = cached.etag;
  }

  if (mockFetchHandler) {
    const mockRes = await mockFetchHandler(url, headers);
    if (mockRes.status === 304 && cached) {
      return { data: cached.data, notModified: true, status: 304, headers: mockRes.headers };
    }
    if (mockRes.status >= 200 && mockRes.status < 300) {
      const etag = mockRes.headers['etag'] || mockRes.headers['ETag'];
      if (etag) {
        etagCache.set(url, { etag, data: mockRes.data, cachedAt: Date.now() });
      }
      return { data: mockRes.data, notModified: false, status: mockRes.status, headers: mockRes.headers };
    }
    return { data: mockRes.data, notModified: false, status: mockRes.status, headers: mockRes.headers };
  }

  // Real fetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 304 && cached) {
      return { data: cached.data, notModified: true, status: 304, headers: res.headers };
    }

    if (!res.ok) {
      if (res.status === 403) {
        const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining === '0' && cached) {
          // Serve stale cache if rate-limited
          return { data: cached.data, notModified: true, status: 200, headers: res.headers };
        }
      }
      throw new Error(`GitHub API error: HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const etag = res.headers.get('etag');
    if (etag) {
      etagCache.set(url, { etag, data, cachedAt: Date.now() });
    }

    return { data, notModified: false, status: res.status, headers: res.headers };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (cached) {
      // Graceful fallback to cache
      return { data: cached.data, notModified: true, status: 200, headers: {} };
    }
    throw err;
  }
}

/**
 * Normalizes a skill name for fuzzy matching against language or topic
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Map between common skills and GitHub languages / topics
 */
const SKILL_ALIASES: Record<string, string[]> = {
  typescript: ['typescript', 'ts'],
  javascript: ['javascript', 'js', 'es6', 'node', 'nodejs'],
  python: ['python', 'py', 'django', 'flask', 'fastapi'],
  react: ['react', 'reactjs', 'reactnative', 'redux', 'nextjs'],
  nodejs: ['node', 'nodejs', 'express', 'nestjs'],
  go: ['go', 'golang'],
  rust: ['rust'],
  docker: ['docker', 'dockerfile', 'containers'],
  kubernetes: ['kubernetes', 'k8s', 'helm'],
  postgresql: ['postgresql', 'postgres', 'psql'],
  mongodb: ['mongodb', 'mongo', 'mongoose'],
  graphql: ['graphql', 'apollo'],
  aws: ['aws', 'amazonwebservices', 's3', 'lambda', 'cloudformation'],
  git: ['git', 'githubactions'],
  csharp: ['c#', 'csharp', 'dotnet', 'aspnet'],
  java: ['java', 'spring', 'springboot'],
};

function matchesSkill(skillName: string, repo: GitHubRepoInfo): { matched: boolean; matchedOn: string } {
  const normSkill = normalizeName(skillName);
  const aliases = SKILL_ALIASES[normSkill] || [normSkill];

  // 1. Primary language
  if (repo.language) {
    const normLang = normalizeName(repo.language);
    if (aliases.includes(normLang) || normLang.includes(normSkill)) {
      return { matched: true, matchedOn: `Primary language: ${repo.language}` };
    }
  }

  // 2. Topics
  for (const topic of repo.topics) {
    const normTopic = normalizeName(topic);
    if (aliases.includes(normTopic) || normTopic.includes(normSkill)) {
      return { matched: true, matchedOn: `Topic tag: #${topic}` };
    }
  }

  // 3. Description mentions
  if (repo.description) {
    const normDesc = normalizeName(repo.description);
    for (const alias of aliases) {
      if (alias.length >= 3 && normDesc.includes(alias)) {
        return { matched: true, matchedOn: `Project description mention: "${alias}"` };
      }
    }
  }

  return { matched: false, matchedOn: '' };
}

/**
 * Verifies candidate's claimed skills against public GitHub repositories.
 * Adheres strictly to the FAIRNESS and HONESTY rules:
 * - Badges are given only where real evidence exists.
 * - Absence of evidence is NEVER framed as dishonesty or deficiency.
 * - Fork vs. Original is reported neutrally.
 */
export async function verifyCandidateGitHub(
  candidateId: string,
  githubUsername: string,
  candidateClaimedSkills: string[] = [],
  accessToken?: string
): Promise<GitHubVerificationResult> {
  const cleanUsername = githubUsername.trim().replace(/^@/, '');
  if (!cleanUsername) {
    throw new Error('Valid GitHub username is required');
  }

  // 1. Fetch user profile
  const userUrl = `https://api.github.com/users/${encodeURIComponent(cleanUsername)}`;
  const userRes = await fetchGithubApi(userUrl, accessToken);
  const userData = userRes.data;

  // 2. Fetch public repositories (up to 50 sorted by recent activity)
  const reposUrl = `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?per_page=50&sort=pushed`;
  const reposRes = await fetchGithubApi(reposUrl, accessToken);
  const rawRepos = Array.isArray(reposRes.data) ? reposRes.data : [];

  const repos: GitHubRepoInfo[] = rawRepos.map((r: any) => ({
    name: r.name || '',
    fullName: r.full_name || '',
    description: r.description || null,
    htmlUrl: r.html_url || '',
    isFork: Boolean(r.fork),
    stars: Number(r.stargazers_count || 0),
    forksCount: Number(r.forks_count || 0),
    language: r.language || null,
    topics: Array.isArray(r.topics) ? r.topics : [],
    pushedAt: r.pushed_at || r.updated_at || '',
    hasCiOrTests: (Array.isArray(r.topics) && r.topics.some((t: string) => ['ci', 'test', 'tests', 'github-actions', 'workflow'].includes(t.toLowerCase()))) ||
      (r.description && /test|ci|actions|automated/i.test(r.description)),
  }));

  const originalRepos = repos.filter(r => !r.isFork);
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
  const originalRatio = repos.length > 0 ? Number((originalRepos.length / repos.length).toFixed(2)) : 1.0;

  // Language aggregation
  const langCounts: Record<string, number> = {};
  for (const r of repos) {
    if (r.language) {
      langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    }
  }
  const topLanguages = Object.entries(langCounts)
    .map(([language, repoCount]) => ({ language, repoCount }))
    .sort((a, b) => b.repoCount - a.repoCount);

  // 3. Map repository evidence to claimed skills
  const verifiedSkills: SkillVerificationBadge[] = [];

  for (const skill of candidateClaimedSkills) {
    const evidenceSources: SkillEvidenceItem[] = [];

    for (const r of repos) {
      const match = matchesSkill(skill, r);
      if (match.matched) {
        evidenceSources.push({
          repoName: r.name,
          repoUrl: r.htmlUrl,
          isFork: r.isFork,
          stars: r.stars,
          matchedOn: match.matchedOn,
          lastPushedAt: r.pushedAt,
        });
      }
    }

    if (evidenceSources.length > 0) {
      // Confidence score: original repos give higher signal than forks
      const hasOriginal = evidenceSources.some(e => !e.isFork);
      const maxStars = Math.max(...evidenceSources.map(e => e.stars), 0);
      let confidence = hasOriginal ? 0.9 : 0.6;
      if (maxStars >= 5) confidence = Math.min(1.0, confidence + 0.1);

      verifiedSkills.push({
        skillName: skill,
        isVerified: true,
        badge: 'Verified by evidence',
        evidenceSources,
        confidence: Number(confidence.toFixed(2)),
      });
    } else {
      verifiedSkills.push({
        skillName: skill,
        isVerified: false,
        badge: 'Unverified',
        evidenceSources: [],
        confidence: 0.0,
      });
    }
  }

  // 4. Neutral authenticity observations (no moral judgment)
  const authenticityNotes: string[] = [];
  authenticityNotes.push(
    `Candidate is primary author on ${originalRepos.length} of ${repos.length} analyzed repositories (${Math.round(originalRatio * 100)}% original).`
  );
  if (totalStars > 0) {
    authenticityNotes.push(`Public repositories have earned ${totalStars} total GitHub star(s).`);
  }
  const verifiedCount = verifiedSkills.filter(s => s.isVerified).length;
  authenticityNotes.push(
    `${verifiedCount} of ${candidateClaimedSkills.length} claimed skills correspond directly with public repository evidence.`
  );

  const result: GitHubVerificationResult = {
    username: cleanUsername,
    profileUrl: userData.html_url || `https://github.com/${cleanUsername}`,
    avatarUrl: userData.avatar_url,
    publicReposCount: userData.public_repos ?? repos.length,
    analyzedReposCount: repos.length,
    totalStars,
    originalReposRatio: originalRatio,
    topLanguages,
    verifiedSkills,
    authenticityNotes,
  };

  // 5. Persist to SQLite
  const now = new Date().toISOString();

  // Upsert candidate_verifications
  const existingVerif = db.prepare(
    `SELECT id FROM candidate_verifications WHERE candidate_id = ? AND provider = 'github' AND handle_or_url = ?`
  ).get(candidateId, cleanUsername) as { id: string } | undefined;

  const metadataJson = JSON.stringify({
    username: cleanUsername,
    publicRepos: result.publicReposCount,
    totalStars,
    originalReposRatio: originalRatio,
    topLanguages,
  });
  const evidenceJson = JSON.stringify(verifiedSkills);

  if (existingVerif) {
    db.prepare(`
      UPDATE candidate_verifications SET
        verification_status = 'verified',
        metadata_json = ?,
        evidence_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(metadataJson, evidenceJson, now, existingVerif.id);
  } else {
    const verifId = `verif_gh_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO candidate_verifications (
        id, candidate_id, provider, handle_or_url, verification_status,
        metadata_json, evidence_json, updated_at
      ) VALUES (?, ?, 'github', ?, 'verified', ?, ?, ?)
    `).run(verifId, candidateId, cleanUsername, metadataJson, evidenceJson, now);
  }

  // Upsert candidate_skill_verifications for verified skills
  for (const skill of verifiedSkills) {
    if (skill.isVerified && skill.evidenceSources.length > 0) {
      const topEvidence = skill.evidenceSources[0];
      const snippet = `${topEvidence.matchedOn} (${topEvidence.isFork ? 'Fork' : 'Original'}, ⭐ ${topEvidence.stars})`;

      const existingSkillVerif = db.prepare(
        `SELECT id FROM candidate_skill_verifications WHERE candidate_id = ? AND skill_name = ? AND verification_source = 'github_repo'`
      ).get(candidateId, skill.skillName) as { id: string } | undefined;

      if (existingSkillVerif) {
        db.prepare(`
          UPDATE candidate_skill_verifications SET
            evidence_url = ?,
            evidence_snippet = ?,
            confidence_score = ?,
            verified_at = ?
          WHERE id = ?
        `).run(topEvidence.repoUrl, snippet, skill.confidence, now, existingSkillVerif.id);
      } else {
        const skillVerifId = `sv_gh_${crypto.randomUUID()}`;
        db.prepare(`
          INSERT INTO candidate_skill_verifications (
            id, candidate_id, skill_name, verification_source, evidence_url, evidence_snippet, confidence_score, verified_at
          ) VALUES (?, ?, ?, 'github_repo', ?, ?, ?, ?)
        `).run(skillVerifId, candidateId, skill.skillName, topEvidence.repoUrl, snippet, skill.confidence, now);
      }
    }
  }

  return result;
}
