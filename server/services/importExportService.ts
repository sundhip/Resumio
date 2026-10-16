/**
 * Data Import/Export Service with Dry-Run Validation and Formula Injection Defense
 * Supports CSV and JSON for Candidates, Jobs, and Applications.
 */

import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../database/db.js';

export const CandidateImportSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  skills: z.union([z.string(), z.array(z.string())]).transform(val => {
    if (Array.isArray(val)) return val;
    return val.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  }).default([]),
  experienceYears: z.coerce.number().min(0).default(0),
});

export const JobImportSchema = z.object({
  title: z.string().min(2, 'Job title required'),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  companyName: z.string().min(2, 'Company name required'),
  location: z.string().optional().default('Remote'),
  workMode: z.enum(['On-site', 'Hybrid', 'Remote']).default('Remote'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance']).default('Full-time'),
  requiredSkills: z.union([z.string(), z.array(z.string())]).transform(val => {
    if (Array.isArray(val)) return val;
    return val.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  }).default([]),
  minExperienceYears: z.coerce.number().min(0).default(0),
});

export interface DryRunValidationResult {
  validCount: number;
  invalidCount: number;
  totalCount: number;
  errors: { row: number; field: string; message: string; rawRow: Record<string, any> }[];
  preview: Record<string, any>[];
  dryRun: boolean;
}

/**
 * Sanitizes CSV cell values to prevent Formula Injection (CWE-1236 / CSV Injection)
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // If cell begins with dangerous formula prefixes, neutralize with a leading single quote
  if (/^[=+@\-\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Quote cell if it contains commas, double-quotes, or newlines
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Parses raw CSV text into array of object records
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Simple regex for CSV splitting respecting double quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentVal = '';

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const char = rawLine[charIdx];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || '';
    });
    records.push(record);
  }

  return records;
}

/**
 * Dry-run validates candidate or job imports against schemas without mutating database
 */
export function validateAndPreviewImport(
  type: 'candidates' | 'jobs',
  content: string,
  format: 'csv' | 'json',
  columnMapping?: Record<string, string>
): DryRunValidationResult {
  let rawRecords: Record<string, any>[] = [];

  if (format === 'csv') {
    rawRecords = parseCsv(content);
  } else {
    try {
      const parsed = JSON.parse(content);
      rawRecords = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return {
        validCount: 0,
        invalidCount: 0,
        totalCount: 0,
        errors: [{ row: 0, field: 'format', message: 'Malformed JSON payload', rawRow: {} }],
        preview: [],
        dryRun: true,
      };
    }
  }

  const schema = type === 'candidates' ? CandidateImportSchema : JobImportSchema;
  const errors: DryRunValidationResult['errors'] = [];
  const validPreview: Record<string, any>[] = [];
  let validCount = 0;

  rawRecords.forEach((row, idx) => {
    // Apply column mapping if provided
    const mappedRow: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      const targetField = columnMapping?.[key] || key;
      mappedRow[targetField] = val;
    }

    const parseResult = schema.safeParse(mappedRow);
    if (parseResult.success) {
      validCount++;
      if (validPreview.length < 5) {
        validPreview.push(parseResult.data);
      }
    } else {
      for (const err of parseResult.error.issues) {
        errors.push({
          row: idx + 1,
          field: err.path.join('.'),
          message: err.message,
          rawRow: row,
        });
      }
    }
  });

  return {
    validCount,
    invalidCount: rawRecords.length - validCount,
    totalCount: rawRecords.length,
    errors,
    preview: validPreview,
    dryRun: true,
  };
}

/**
 * Commits pre-validated imported candidates into database.
 */
export function commitCandidateImport(
  candidates: z.infer<typeof CandidateImportSchema>[],
  orgId: string
): { importedCount: number } {
  let count = 0;
  const insertCandidate = db.transaction(() => {
    for (const c of candidates) {
      const userId = `cand_imp_${crypto.randomUUID()}`;
      const profileId = `prof_imp_${crypto.randomUUID()}`;

      // Check duplicate by email
      const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(c.email);
      if (existing) continue;

      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, status)
        VALUES (?, ?, 'imported_account_placeholder_hash', 'candidate', 'active')
      `).run(userId, c.email);

      db.prepare(`
        INSERT INTO candidate_profiles (
          id, user_id, full_name, phone, location, headline, profile_completion
        ) VALUES (?, ?, ?, ?, ?, ?, 60)
      `).run(profileId, userId, c.fullName, c.phone, c.location, c.headline);

      // Insert skills
      for (const skill of c.skills) {
        const skillId = `csk_${crypto.randomUUID()}`;
        db.prepare(`
          INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency)
          VALUES (?, ?, ?, 'Advanced')
        `).run(skillId, profileId, skill);
      }

      count++;
    }
  });

  insertCandidate();
  return { importedCount: count };
}

/**
 * Exports data to CSV or JSON with formula injection protection
 */
export function exportData(
  type: 'candidates' | 'jobs',
  format: 'csv' | 'json'
): { content: string; contentType: string; filename: string } {
  let rows: any[] = [];

  if (type === 'candidates') {
    rows = db.prepare(`
      SELECT cp.full_name as fullName, u.email, cp.phone, cp.location, cp.headline, cp.created_at
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      ORDER BY cp.created_at DESC
      LIMIT 1000
    `).all();
  } else {
    rows = db.prepare(`
      SELECT title, company_name as companyName, location, employment_type as employmentType,
             work_mode as workMode, min_experience as minExperienceYears, created_at
      FROM jobs
      ORDER BY created_at DESC
      LIMIT 1000
    `).all();
  }

  if (format === 'json') {
    return {
      content: JSON.stringify(rows, null, 2),
      contentType: 'application/json',
      filename: `resumio_${type}_export_${Date.now()}.json`,
    };
  }

  if (rows.length === 0) {
    return {
      content: '',
      contentType: 'text/csv',
      filename: `resumio_${type}_export_${Date.now()}.csv`,
    };
  }

  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(h => sanitizeCsvCell(h)).join(',');
  const dataLines = rows.map(r =>
    headers.map(h => sanitizeCsvCell(r[h])).join(',')
  );

  const csvContent = [headerLine, ...dataLines].join('\n');
  return {
    content: csvContent,
    contentType: 'text/csv',
    filename: `resumio_${type}_export_${Date.now()}.csv`,
  };
}
