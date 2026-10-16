/**
 * Resumio Grounded Explanation Validator & Provenance Exporter
 *
 * Enforces:
 * 1. Strict evidence grounding for natural language summaries.
 * 2. Prompt-injection defense: strips instruction override attacks from untrusted candidate text.
 * 3. Citation validation: every summary claim must cite an evidence tag `[EV-k]`.
 * 4. Deterministic fallback when AI is unavailable or fails citation integrity checks.
 * 5. Comprehensive Rationale Export (JSON and printable HTML) with cryptographic audit hash.
 */

import crypto from 'crypto';
import {
  ScoreV2Result,
  ComponentContribution,
  ExplainabilityReportV2,
  SkillEvidenceItem,
  RedFlagAnalysisResult,
} from '../../packages/shared/src/index.js';

export interface GroundedEvidenceItem {
  id: string; // e.g. "EV-1"
  category: 'skill' | 'experience' | 'project' | 'education' | 'flag';
  text: string;
}

export interface GroundedSummaryResult {
  summaryText: string;
  isAiGenerated: boolean;
  citationValidationPassed: boolean;
  evidenceItems: GroundedEvidenceItem[];
  auditHash: string;
}

export class ExplanationValidatorService {
  private static readonly INJECTION_PATTERNS = [
    /ignore (all|previous) (instructions|prompts)/gi,
    /system override/gi,
    /you are now an unrestricted/gi,
    /give (this|me) (a|100%|full) match/gi,
    /dan mode/gi,
    /disregard rules/gi,
    /roleplay as/gi,
  ];

  /**
   * Sanitizes untrusted text extracted from candidate resumes to prevent prompt injection attacks.
   */
  public static sanitizeUntrustedCandidateText(text: string = ''): string {
    if (!text) return '';
    let sanitized = text;
    for (const pattern of this.INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[SUSPICIOUS INSTRUCTION REMOVED]');
    }
    // Strip control characters and excessive escaping
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return sanitized.trim();
  }

  /**
   * Assembles a structured, indexed evidence ledger from the candidate's verified merits.
   */
  public static buildEvidenceLedger(
    report: ExplainabilityReportV2,
    redFlags: RedFlagAnalysisResult
  ): GroundedEvidenceItem[] {
    const items: GroundedEvidenceItem[] = [];
    let counter = 1;

    // Matched skills evidence
    for (const s of report.skillsBreakdown.matchedRequired.slice(0, 5)) {
      items.push({
        id: `EV-${counter++}`,
        category: 'skill',
        text: `Verified core skill: ${s.skillName} (proficiency ${(s.proficiency * 100).toFixed(0)}%, ${s.evidenceCount} evidence anchors).`,
      });
    }

    // Missing skills
    for (const s of report.skillsBreakdown.missingRequired.slice(0, 3)) {
      items.push({
        id: `EV-${counter++}`,
        category: 'skill',
        text: `Unsatisfied requirement: ${s.skillName} has no verifiable evidence on record.`,
      });
    }

    // Waterfall top contributions
    for (const w of report.waterfall) {
      if (w.pointsContributed > 0) {
        items.push({
          id: `EV-${counter++}`,
          category: 'experience',
          text: `${w.label} contributed ${w.pointsContributed.toFixed(1)} / ${w.maxPossiblePoints.toFixed(1)} max points (${w.rawScore.toFixed(0)}% achievement).`,
        });
      }
    }

    // Red flag / Discrepancy notices
    for (const f of redFlags.flags.filter((fl) => fl.severity === 'discrepancy')) {
      items.push({
        id: `EV-${counter++}`,
        category: 'flag',
        text: `Attention: Discrepancy detected in ${f.title}. Clarification suggested for interview.`,
      });
    }

    return items;
  }

  /**
   * Validates that a generated text properly cites valid evidence tags `[EV-k]`.
   * Rejects texts that lack citations or cite non-existent tags.
   */
  public static validateCitations(
    text: string,
    evidenceItems: GroundedEvidenceItem[]
  ): { valid: boolean; reason?: string } {
    if (!text || text.length < 20) {
      return { valid: false, reason: 'Text is too short or empty' };
    }

    const validTagSet = new Set(evidenceItems.map((e) => e.id));
    const citationRegex = /\[(EV-\d+)\]/g;
    const matches = [...text.matchAll(citationRegex)];

    if (matches.length === 0) {
      return { valid: false, reason: 'No evidence citation tags found in generated summary.' };
    }

    for (const m of matches) {
      const tag = m[1];
      if (!validTagSet.has(tag)) {
        return { valid: false, reason: `Hallucinated citation tag [${tag}] not in evidence ledger.` };
      }
    }

    return { valid: true };
  }

  /**
   * Generates a deterministic, strictly grounded evidence summary that is guaranteed
   * never to hallucinate and always includes valid citation tags.
   */
  public static generateDeterministicSummary(
    evidenceItems: GroundedEvidenceItem[],
    finalScore: number,
    confidenceBand: string
  ): string {
    const skillEv = evidenceItems.filter((e) => e.category === 'skill' && e.text.startsWith('Verified'));
    const gapEv = evidenceItems.filter((e) => e.category === 'skill' && e.text.startsWith('Unsatisfied'));
    const expEv = evidenceItems.filter((e) => e.category === 'experience');
    const flagEv = evidenceItems.filter((e) => e.category === 'flag');

    const parts: string[] = [
      `Candidate scored ${finalScore}/100 (${confidenceBand}) under deterministic Score V2 evaluation.`,
    ];

    if (skillEv.length > 0) {
      parts.push(`Demonstrates core technical alignment in key areas [${skillEv.map((e) => e.id).join('], [')}].`);
    }

    if (gapEv.length > 0) {
      parts.push(`Areas requiring technical clarification or upskilling include [${gapEv.map((e) => e.id).join('], [')}].`);
    }

    if (expEv.length > 0) {
      parts.push(`Scoring contributions are validated across duration and project metrics [${expEv[0].id}].`);
    }

    if (flagEv.length > 0) {
      parts.push(`Recruiter review is recommended regarding interview topics [${flagEv[0].id}].`);
    }

    return parts.join(' ');
  }

  /**
   * Computes an immutable cryptographic SHA-256 audit hash over the scoring results.
   */
  public static computeAuditHash(
    candidateId: string,
    jobId: string,
    scoreResult: ScoreV2Result,
    evidenceItems: GroundedEvidenceItem[]
  ): string {
    const payload = JSON.stringify({
      candidateId,
      jobId,
      algorithmVersion: scoreResult.algorithmVersion,
      finalScore: scoreResult.finalScore,
      weightsApplied: scoreResult.weightsApplied,
      isRulesOnly: scoreResult.isRulesOnly,
      blendAlpha: scoreResult.blendAlpha,
      evidenceIds: evidenceItems.map((e) => e.id),
      timestamp: new Date().toISOString().slice(0, 10),
    });

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Generates a printable, self-contained HTML rationale document ready for download or printing.
   */
  public static generatePrintableRationaleHtml(params: {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    scoreResult: ScoreV2Result;
    report: ExplainabilityReportV2;
    redFlags: RedFlagAnalysisResult;
    isBlind: boolean;
    auditHash: string;
  }): string {
    const { candidateName, jobTitle, companyName, scoreResult, report, redFlags, isBlind, auditHash } = params;

    const waterfallRows = report.waterfall
      .map(
        (w) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${w.label}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${w.weight}%</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${w.rawScore.toFixed(0)}%</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">+${w.pointsContributed.toFixed(1)} pts</td>
        </tr>`
      )
      .join('');

    const matchedSkillsHtml = report.skillsBreakdown.matchedRequired
      .map(
        (s) => `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; color: #166534;">
            <span>${s.skillName}</span>
            <span>${(s.proficiency * 100).toFixed(0)}% proficiency</span>
          </div>
          ${s.evidenceSnippet ? `<p style="margin: 4px 0 0; font-size: 12px; color: #374151; font-style: italic;">"${s.evidenceSnippet}"</p>` : ''}
        </div>`
      )
      .join('');

    const missingSkillsHtml = report.skillsBreakdown.missingRequired
      .map(
        (s) => `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #991b1b;">${s.skillName}</span>
          <span style="font-size: 12px; color: #6b7280; margin-left: 8px;">(Not evidenced in profile)</span>
        </div>`
      )
      .join('');

    const flagsHtml = redFlags.flags.length === 0
      ? '<p style="color: #10b981; font-weight: 500;">No critical discrepancies or anomalies identified.</p>'
      : redFlags.flags
          .map(
            (f) => `
          <div style="border-left: 4px solid ${f.severity === 'discrepancy' ? '#ef4444' : '#f59e0b'}; background: #fafafa; padding: 10px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #1e293b;">${f.title} <span style="font-size: 11px; text-transform: uppercase; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${f.severity}</span></div>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;">${f.description}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #2563eb;"><strong>Suggested Recruiter Question:</strong> "${f.suggestedRecruiterQuestion}"</p>
          </div>`
          )
          .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Resumio Match Rationale - ${candidateName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-blind { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .score-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .score-number { font-size: 48px; font-weight: 800; color: #0f172a; }
    h2 { font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 24px;">Resumio Match Rationale Report</h1>
      <p style="margin: 4px 0 0; color: #64748b;">Target Role: <strong>${jobTitle}</strong> at ${companyName}</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0; font-weight: 600;">Candidate: ${candidateName}</p>
      ${isBlind ? '<span class="badge badge-blind">EEOC Blind Screening Active</span>' : ''}
    </div>
  </div>

  <div class="score-box">
    <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600;">Overall Match Score V2</div>
    <div class="score-number">${scoreResult.finalScore}<span style="font-size: 24px; font-weight: 500; color: #94a3b8;">/100</span></div>
    <div style="font-size: 14px; font-weight: 600; color: #2563eb;">${scoreResult.confidenceBand}</div>
    <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Evaluation Engine: ${scoreResult.algorithmVersion} • Mode: ${scoreResult.isRulesOnly ? 'Rules Only' : `Blended (α=${scoreResult.blendAlpha})`}</div>
  </div>

  <h2>1. Component Contribution Waterfall</h2>
  <table>
    <thead>
      <tr style="background: #f1f5f9; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569;">
        <th style="padding: 10px;">Scoring Dimension</th>
        <th style="padding: 10px; text-align: center;">Weight</th>
        <th style="padding: 10px; text-align: center;">Raw Score</th>
        <th style="padding: 10px; text-align: right;">Final Contribution</th>
      </tr>
    </thead>
    <tbody>
      ${waterfallRows}
    </tbody>
  </table>

  <h2>2. Skill Evidence & Gaps</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
    <div>
      <h3 style="font-size: 14px; color: #166534; margin-bottom: 8px;">Matched Required Skills</h3>
      ${matchedSkillsHtml || '<p style="color: #64748b;">None recorded</p>'}
    </div>
    <div>
      <h3 style="font-size: 14px; color: #991b1b; margin-bottom: 8px;">Missing Required Skills</h3>
      ${missingSkillsHtml || '<p style="color: #166534; font-weight: 500;">All required skills satisfied!</p>'}
    </div>
  </div>

  <h2>3. Verifiable Discrepancies & Interview Questions</h2>
  ${flagsHtml}

  <h2>4. Grounded Summary & Fair Hiring Certification</h2>
  <p style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px;">
    ${report.structuredSummary.overview}
  </p>
  <p style="font-size: 12px; color: #475569;">
    ${report.structuredSummary.fairnessVerification}
  </p>

  <div class="footer">
    <p>Resumio AI Recruitment Platform • Document Provenance Hash: <code>${auditHash}</code></p>
    <p>This report is human decision support. Resumio strictly bars automatic candidate rejection.</p>
  </div>
</body>
</html>`;
  }
}
