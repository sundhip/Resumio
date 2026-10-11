/**
 * Preprocessing & Distribution Analysis Engine for Research Datasets
 * Implements reproducible text normalization, provenance tracking, and class imbalance metrics.
 */

export interface PreprocessingReport {
  inputCount: number;
  validCount: number;
  rejectedCount: number;
  duplicateCount: number;
  finalCount: number;
  rejectionReasons: { id: string; reason: string }[];
  classDistribution: Record<string, number>;
  classPercentages: Record<string, number>;
  majorityClass: { label: string; count: number };
  minorityClass: { label: string; count: number };
  imbalanceRatio: number;
}

export interface ValidatedResearchRecord {
  id: string;
  text: string;
  class_label: string;
  source: string;
  provenance: 'original_real' | 'synthetic_llm' | 'manual_authored';
}

/**
 * Normalizes text while preserving domain terms and technical acronyms (e.g. CI/CD, React.js, C#).
 */
export function preprocessResearchText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    .normalize('NFKC') // Unicode compatibility normalization
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Validates, cleans, and deduplicates imported research dataset records.
 */
export function validateAndPreprocessDataset(
  rawRecords: any[],
  allowedLabels: string[]
): { validRecords: ValidatedResearchRecord[]; report: PreprocessingReport } {
  const validRecords: ValidatedResearchRecord[] = [];
  const rejectionReasons: { id: string; reason: string }[] = [];
  const seenTexts = new Set<string>();
  let duplicateCount = 0;

  for (let idx = 0; idx < rawRecords.length; idx++) {
    const raw = rawRecords[idx];
    const recordId = raw.id || `record-${idx + 1}`;

    if (!raw || typeof raw !== 'object') {
      rejectionReasons.push({ id: recordId, reason: 'Record is null or not an object' });
      continue;
    }

    const text = preprocessResearchText(raw.text || '');
    if (!text || text.length < 15) {
      rejectionReasons.push({ id: recordId, reason: 'Text is empty or shorter than 15 characters' });
      continue;
    }

    if (text.length > 5000) {
      rejectionReasons.push({ id: recordId, reason: 'Text exceeds maximum length of 5000 characters' });
      continue;
    }

    const label = (raw.class_label || raw.label || '').trim();
    if (!label) {
      rejectionReasons.push({ id: recordId, reason: 'Missing class label' });
      continue;
    }

    if (!allowedLabels.includes(label)) {
      rejectionReasons.push({ id: recordId, reason: `Class label "${label}" is not in approved target list` });
      continue;
    }

    // Exact and normalized deduplication check
    const normalizedKey = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenTexts.has(normalizedKey)) {
      duplicateCount++;
      rejectionReasons.push({ id: recordId, reason: 'Duplicate text detected within dataset' });
      continue;
    }
    seenTexts.add(normalizedKey);

    validRecords.push({
      id: recordId,
      text,
      class_label: label,
      source: raw.source || 'Imported Research Dataset',
      provenance: raw.provenance || 'original_real',
    });
  }

  // Calculate actual distribution
  const classDistribution: Record<string, number> = {};
  for (const lbl of allowedLabels) {
    classDistribution[lbl] = 0;
  }
  for (const r of validRecords) {
    classDistribution[r.class_label] = (classDistribution[r.class_label] || 0) + 1;
  }

  const finalCount = validRecords.length;
  const classPercentages: Record<string, number> = {};
  for (const [lbl, cnt] of Object.entries(classDistribution)) {
    classPercentages[lbl] = finalCount > 0 ? Number(((cnt / finalCount) * 100).toFixed(1)) : 0;
  }

  // Determine majority, minority and imbalance ratio
  let maxCount = -1;
  let minCount = Infinity;
  let majorityLabel = '';
  let minorityLabel = '';

  for (const [lbl, cnt] of Object.entries(classDistribution)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      majorityLabel = lbl;
    }
    if (cnt < minCount) {
      minCount = cnt;
      minorityLabel = lbl;
    }
  }

  const imbalanceRatio = minCount > 0 ? Number((maxCount / minCount).toFixed(2)) : maxCount;

  return {
    validRecords,
    report: {
      inputCount: rawRecords.length,
      validCount: validRecords.length,
      rejectedCount: rejectionReasons.length,
      duplicateCount,
      finalCount,
      rejectionReasons,
      classDistribution,
      classPercentages,
      majorityClass: { label: majorityLabel, count: maxCount },
      minorityClass: { label: minorityLabel, count: minCount },
      imbalanceRatio,
    },
  };
}
