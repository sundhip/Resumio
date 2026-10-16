/**
 * Resumio Phase 8: Ranked Leaderboard, Virtualization Engine & Saved Views
 */

export type ScoreBandTier = 'Tier 1 (Exceptional: 85-100)' | 'Tier 2 (Strong: 70-84)' | 'Tier 3 (Moderate: 50-69)' | 'Tier 4 (Low Fit: <50)';

export interface LeaderboardApplicantItem {
  id: string; // application id
  candidateId: string;
  candidateProfileId: string;
  fullName: string;
  redactedName?: string;
  email: string;
  phone?: string;
  location: string;
  headline?: string;
  experienceYears: number;
  seniorityLevel: string;
  highestEducation: string;
  skills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
  scoreBand: ScoreBandTier;
  componentContributions?: {
    skills: number;
    experience: number;
    projects: number;
    achievements: number;
    education: number;
    semantic: number;
  };
  pipelineStage: string;
  pipelineStageOrder: number;
  tags: string[];
  appliedAt: string;
  resumeId: string;
  hasRedFlags: boolean;
  redFlagsCount: number;
  redFlagSummary?: string[];
  evidenceHighlights?: string[];
  selected?: boolean;
}

export type LeaderboardColumnId =
  | 'candidate'
  | 'matchScore'
  | 'skillsMatch'
  | 'experience'
  | 'seniority'
  | 'education'
  | 'stage'
  | 'tags'
  | 'flags'
  | 'appliedAt'
  | 'actions';

export interface LeaderboardColumnConfig {
  id: LeaderboardColumnId;
  label: string;
  visible: boolean;
  widthPx: number;
  minWidthPx: number;
  sortable: boolean;
}

export const DEFAULT_LEADERBOARD_COLUMNS: LeaderboardColumnConfig[] = [
  { id: 'candidate', label: 'Candidate', visible: true, widthPx: 260, minWidthPx: 200, sortable: true },
  { id: 'matchScore', label: 'Match Score', visible: true, widthPx: 140, minWidthPx: 120, sortable: true },
  { id: 'skillsMatch', label: 'Skills Coverage', visible: true, widthPx: 220, minWidthPx: 160, sortable: false },
  { id: 'experience', label: 'Experience', visible: true, widthPx: 120, minWidthPx: 100, sortable: true },
  { id: 'seniority', label: 'Seniority', visible: true, widthPx: 130, minWidthPx: 100, sortable: true },
  { id: 'education', label: 'Education', visible: false, widthPx: 150, minWidthPx: 120, sortable: false },
  { id: 'stage', label: 'Stage', visible: true, widthPx: 150, minWidthPx: 130, sortable: true },
  { id: 'tags', label: 'Tags', visible: true, widthPx: 180, minWidthPx: 140, sortable: false },
  { id: 'flags', label: 'Flags', visible: true, widthPx: 100, minWidthPx: 80, sortable: false },
  { id: 'appliedAt', label: 'Applied', visible: true, widthPx: 130, minWidthPx: 110, sortable: true },
  { id: 'actions', label: 'Actions', visible: true, widthPx: 140, minWidthPx: 120, sortable: false },
];

export interface SavedLeaderboardView {
  id: string;
  name: string;
  userId: string;
  columns: LeaderboardColumnConfig[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, any>;
  isDefault?: boolean;
}

export interface VirtualWindowResult {
  startIndex: number;
  endIndex: number;
  visibleItems: LeaderboardApplicantItem[];
  totalHeight: number;
  topPadding: number;
  bottomPadding: number;
}

/**
 * Calculates score band chip tier from raw match score (0-100)
 */
export function getScoreBandTier(score: number): ScoreBandTier {
  if (score >= 85) return 'Tier 1 (Exceptional: 85-100)';
  if (score >= 70) return 'Tier 2 (Strong: 70-84)';
  if (score >= 50) return 'Tier 3 (Moderate: 50-69)';
  return 'Tier 4 (Low Fit: <50)';
}

/**
 * High-performance virtualized window calculation for 10,000+ candidates.
 * Maintains zero UI lag with O(1) slice computation.
 */
export function computeVirtualWindow(
  items: LeaderboardApplicantItem[],
  scrollTop: number,
  containerHeight: number,
  rowHeight: number = 64,
  overscan: number = 5
): VirtualWindowResult {
  const totalItems = items.length;
  const totalHeight = totalItems * rowHeight;

  if (totalItems === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      visibleItems: [],
      totalHeight: 0,
      topPadding: 0,
      bottomPadding: 0,
    };
  }

  const rawStartIndex = Math.floor(scrollTop / rowHeight);
  const rawEndIndex = Math.min(totalItems - 1, Math.ceil((scrollTop + containerHeight) / rowHeight));

  const startIndex = Math.max(0, rawStartIndex - overscan);
  const endIndex = Math.min(totalItems - 1, rawEndIndex + overscan);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const topPadding = startIndex * rowHeight;
  const bottomPadding = Math.max(0, (totalItems - 1 - endIndex) * rowHeight);

  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    topPadding,
    bottomPadding,
  };
}

/**
 * Standard keyboard shortcuts definitions for recruiter leaderboard
 */
export interface KeyboardShortcutDefinition {
  key: string;
  description: string;
  category: 'Navigation' | 'Selection' | 'Actions';
}

export const RECRUITER_KEYBOARD_SHORTCUTS: KeyboardShortcutDefinition[] = [
  { key: 'j / ArrowDown', description: 'Navigate to next applicant row', category: 'Navigation' },
  { key: 'k / ArrowUp', description: 'Navigate to previous applicant row', category: 'Navigation' },
  { key: 'x', description: 'Toggle select applicant checkbox', category: 'Selection' },
  { key: 'Shift + x', description: 'Select/deselect all visible applicants', category: 'Selection' },
  { key: 'c', description: 'Compare selected applicants (2-5 candidates)', category: 'Actions' },
  { key: 'm', description: 'Move selected applicants to next pipeline stage', category: 'Actions' },
  { key: 'r', description: 'Reject selected applicants with feedback modal', category: 'Actions' },
  { key: 'o', description: 'Open candidate outreach composer', category: 'Actions' },
  { key: 'b', description: 'Toggle EEOC Blind Screening mode', category: 'Actions' },
  { key: '/', description: 'Focus candidate search bar', category: 'Navigation' },
  { key: '?', description: 'Show keyboard shortcuts reference modal', category: 'Navigation' },
];
