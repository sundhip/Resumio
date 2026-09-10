import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';

export interface ExtractedDocument {
  text: string;
  fileHash: string;
  fileSize: number;
  format: 'PDF' | 'DOCX' | 'TXT' | 'UNKNOWN';
}

/**
 * Extracts plain text from a PDF file buffer using pure Node.js zlib decompression
 * and text extraction from PDF stream operators (BT...ET, Tj, TJ).
 */
export function extractTextFromPdf(buffer: Buffer): string {
  try {
    const textPieces: string[] = [];

    // Search for uncompressed text streams: (...) Tj or [(...)] TJ
    const rawContent = buffer.toString('binary');

    // 1. Look for stream ... endstream blocks
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(rawContent)) !== null) {
      const streamData = match[1];
      let decoded: string = '';

      // Attempt FlateDecode decompression with zlib
      try {
        const streamBuffer = Buffer.from(streamData, 'binary');
        const inflated = zlib.inflateSync(streamBuffer);
        decoded = inflated.toString('utf-8');
      } catch {
        try {
          const streamBuffer = Buffer.from(streamData, 'binary');
          const inflated = zlib.inflateRawSync(streamBuffer);
          decoded = inflated.toString('utf-8');
        } catch {
          // Uncompressed text stream
          decoded = streamData;
        }
      }

      // Extract text within BT ... ET blocks
      const btBlocks = decoded.match(/BT[\s\S]*?ET/g) || [decoded];
      for (const block of btBlocks) {
        // Match string literals in parentheses (text) Tj or '
        const tjMatches = block.match(/\(([^)]*)\)\s*(?:Tj|'|")/g);
        if (tjMatches) {
          for (const m of tjMatches) {
            const inner = m.replace(/\)\s*(?:Tj|'|")$/, '').replace(/^\(/, '');
            if (inner.trim()) {
              textPieces.push(unescapePdfString(inner));
            }
          }
        }

        // Match array of strings in brackets [(text) -100 (more text)] TJ
        const arrayMatches = block.match(/\[([\s\S]*?)\]\s*TJ/g);
        if (arrayMatches) {
          for (const arr of arrayMatches) {
            const innerStrings = arr.match(/\(([^)]*)\)/g);
            if (innerStrings) {
              const line = innerStrings
                .map((s) => unescapePdfString(s.slice(1, -1)))
                .join('');
              if (line.trim()) {
                textPieces.push(line);
              }
            }
          }
        }
      }
    }

    // Fallback: If structured stream extraction yielded few tokens, search text literals directly in file
    if (textPieces.length < 5) {
      const fallbackMatches = rawContent.match(/\(([^)]{2,100})\)\s*Tj/g);
      if (fallbackMatches) {
        for (const m of fallbackMatches) {
          const clean = m.replace(/\)\s*Tj$/, '').replace(/^\(/, '');
          if (/^[A-Za-z0-9\s.,;:@_\-–—/()#+&]+$/.test(clean) && clean.trim()) {
            textPieces.push(unescapePdfString(clean));
          }
        }
      }
    }

    // If file is plain text saved with PDF extension
    if (
      textPieces.length === 0 &&
      (rawContent.includes('Resume') || rawContent.includes('Experience') || rawContent.includes('Education'))
    ) {
      const printableLines = buffer.toString('utf-8').split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (printableLines.length > 3) {
        return printableLines.join('\n');
      }
    }

    const fullText = textPieces.join('\n').replace(/[ \t]+/g, ' ').trim();
    if (!fullText || fullText.length < 10) {
      // Return uncompressed readable ASCII strings if present
      const asciiStrings = buffer
        .toString('utf-8')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .split(/\s{2,}/)
        .filter((s) => s.length > 3)
        .join('\n');

      if (asciiStrings.length > 20) {
        return asciiStrings;
      }

      throw new Error('No readable text streams found in PDF');
    }

    return formatExtractedText(fullText);
  } catch (err: any) {
    throw new Error('Unable to read this resume. Please upload a valid PDF or DOCX file.');
  }
}

/**
 * Unescapes standard PDF string escape sequences (e.g. \\n, \\r, \\t, \\(, \\))
 */
function unescapePdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/**
 * Extracts plain text from a DOCX file (extracts word/document.xml from PKZip structure)
 */
export function extractTextFromDocx(buffer: Buffer): string {
  try {
    // DOCX files are zip archives containing 'word/document.xml'
    const binary = buffer.toString('binary');
    const docXmlIndex = binary.indexOf('word/document.xml');

    if (docXmlIndex !== -1) {
      // Extract XML content
      // Search for local file header or inflate
      try {
        const decompressed = zlib.unzipSync(buffer);
        const xml = decompressed.toString('utf-8');
        return parseDocxXml(xml);
      } catch {
        // Fallback: extract XML tags directly from buffer if stored uncompressed
        const xmlMatch = binary.match(/<w:document[\s\S]*?<\/w:document>/);
        if (xmlMatch) {
          return parseDocxXml(xmlMatch[0]);
        }
      }
    }

    // Fallback: search for <w:t> tags
    const wtMatches = buffer.toString('utf-8').match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (wtMatches && wtMatches.length > 0) {
      const words = wtMatches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
      return formatExtractedText(words);
    }

    // Fallback printable text
    const printable = buffer
      .toString('utf-8')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .split(/\s{2,}/)
      .filter((s) => s.length > 3)
      .join('\n');

    if (printable.length > 20) {
      return formatExtractedText(printable);
    }

    throw new Error('No readable DOCX content');
  } catch (err: any) {
    throw new Error('Unable to read this resume. Please upload a valid PDF or DOCX file.');
  }
}

/**
 * Strips XML tags from DOCX word/document.xml while preserving paragraph structure
 */
function parseDocxXml(xml: string): string {
  // Replace paragraph endings with newlines
  const withNewlines = xml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<\/w:tr>/g, '\n')
    .replace(/<w:tab\/>/g, '\t');

  // Strip remaining tags
  const textOnly = withNewlines.replace(/<[^>]+>/g, '');
  return formatExtractedText(textOnly);
}

/**
 * Cleans and normalizes extracted text into clean, structured lines
 */
function formatExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
}

/**
 * Main Document Extractor function
 */
export async function extractDocumentText(filePath: string): Promise<ExtractedDocument> {
  if (!fs.existsSync(filePath)) {
    throw new Error('Unable to read this resume. Please upload a valid PDF or DOCX file.');
  }

  const buffer = fs.readFileSync(filePath);
  const fileSize = buffer.length;
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

  const ext = path.extname(filePath).toLowerCase();

  let text = '';
  let format: ExtractedDocument['format'] = 'UNKNOWN';

  if (ext === '.pdf') {
    format = 'PDF';
    text = extractTextFromPdf(buffer);
  } else if (ext === '.docx' || ext === '.doc') {
    format = 'DOCX';
    text = extractTextFromDocx(buffer);
  } else {
    format = 'TXT';
    text = buffer.toString('utf-8');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Unable to read this resume. Please upload a valid PDF or DOCX file.');
  }

  return {
    text: text.trim(),
    fileHash,
    fileSize,
    format,
  };
}

/**
 * Computes SHA-256 hash of a file on disk
 */
export function computeFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

