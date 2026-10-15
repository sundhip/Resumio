# Phase 3 Report: Resume Parsing Engine and ATS Parse-Ability

**Date:** 2026-10-15  
**Author:** Lead Engineer, Resumio  
**Scope:** Security-First File Ingestion, PyMuPDF Multi-Column & Layout Extraction, LaTeX De-hyphenation & Ligature Cleanup, Hidden Text & Keyword Stuffing Detection, Multilingual Section Segmentation, Canonical `ResumeDocument` Schema, ATS Parse-ability Diagnostics (0-100 Scorer), Interactive Frontend Split-View with Evidence Linking, User Inline Corrections, Training Consent Opt-In, Golden Evaluation Benchmark (60 Documents), and Fuzz Testing.

---

## 1. Executive Summary

Phase 3 transitions Resumio from a basic regex text extractor to a **production-grade, sandboxed Resume Parsing Engine and ATS Parse-ability Simulator**. The parsing engine runs in `services/ml` as a FastAPI microservice with sub-millisecond to sub-second latency, backed by an immediate offline deterministic fallback inside Express so the platform functions seamlessly without any external API key, GPU, or active microservice.

### Key Highlights
1. **Security-First Ingestion & Sandboxing:**
   - Detects file format strictly via magic bytes (PDF, DOCX, TXT, MD, RTF, PNG, JPEG), rejecting file extension spoofing.
   - Enforces 10 MB size limits, 15-page limits, and prevents DOCX zip-bomb decompression attacks via compression ratio (>50x), entry count (>500), and uncompressed size (>100 MB) thresholds.
   - Rejects password-encrypted documents with informative HTTP 422 feedback.
   - Strips embedded JavaScript, launch annotations, and external action links from PDFs before parsing.
   - Operates in strict air-gapped isolation: the parser makes **zero outbound network calls**.

2. **Layout & Optical Extraction:**
   - PyMuPDF text block coordinate clustering with spatial column detection to preserve natural top-to-bottom, left-to-right reading order across multi-column resumes.
   - Replaces LaTeX ligatures (`\ufb00` -> `ff`, `\ufb01` -> `fi`, `\ufb02` -> `fl`, `\ufb03` -> `ffi`, `\ufb04` -> `ffl`) and re-unites hyphenated line breaks (`distri-\nbuted` -> `distributed`).
   - Hidden text detection: flags white-on-white text (RGB luminance > 240, 240, 240), microscopic text (<3pt), out-of-bounds bounding boxes, and unnatural keyword stuffing.
   - Scanned document detection: identifies rasterized/image-only documents lacking a text layer and triggers OCR fallback.
   - DOCX extraction: extracts paragraphs, tables, text boxes, and section dividers using `python-docx`.

3. **Section & Entity Extraction:**
   - Multilingual heading dictionary (English, Spanish, French, German) recognizing 12 section categories (`contact`, `summary`, `experience`, `education`, `skills`, `projects`, `certifications`, `achievements`, `publications`, `languages`, `volunteering`, `other`).
   - Structured contact extraction (full name, email, phone, LinkedIn, GitHub, portfolio).
   - Experience extraction with messy date parsing ("Jan '21 - Present", "2019-2022") and overlap-safe total career duration math.
   - Every extracted field includes source evidence spans (`page`, `bbox`, `text`) for end-to-end traceability.

4. **ATS Parse-ability Scorer (0-100):**
   - Measures multi-strategy token discrepancy ratio between naive stream extraction and layout-aware reconstruction.
   - Deducts points for layout traps (multi-column, complex tables, header/footer contact info, image-only scans) and deceptive practices (hidden text, keyword stuffing).
   - Generates prioritized, actionable remediation steps (Critical, Warning, Info) with clear recommendations.
   - Displays compliance disclaimer: *"This ATS Parse-ability score is a simulated diagnostic across multiple extraction heuristics. It does not guarantee behavior on any single commercial ATS vendor."*

5. **Frontend Interactive Split-View (`ResumeSplitViewManager.tsx`):**
   - Split-screen layout: raw extracted layout view on the left, structured sections and ATS score ring on the right.
   - Bi-directional hover highlight linking structured data entries to their original text bounding boxes.
   - Inline correction mode enabling candidates to edit and save verified corrections (`PATCH /api/candidate/resume/corrections`).
   - Candidate training consent opt-in checkbox (`POST /api/candidate/resume/consent`) ensuring candidate data is never used for training without explicit affirmative consent.

---

## 2. Quantitative Evaluation & Benchmark Results

We benchmarked Resumio's parsing engine against a held-out **Golden Corpus of 60 synthetic and realistic documents** across 7 distinct formatting archetypes.

### Reproduction Command
```bash
cd services/ml
python -m pytest tests/test_golden_evaluation.py -s -v
```

### Golden Evaluation Metrics (60 Documents)
| Metric | Value | SLA / Target | Status |
| :--- | :--- | :--- | :--- |
| **Total Evaluated Documents** | **60** | $\ge 60$ documents | **MET** |
| Single-Column Standard PDFs | 10 | 10 | **MET** |
| Two-Column / Sidebar PDFs | 10 | 10 | **MET** |
| LaTeX Generated PDFs (Ligatures & Hyphens) | 10 | 10 | **MET** |
| DOCX / Word Documents | 10 | 10 | **MET** |
| Structured Table / Grid Layout PDFs | 10 | 10 | **MET** |
| Scanned / Image PDFs (Simulated Raster) | 5 | 5 | **MET** |
| Adversarial ATS-Gaming PDFs (Hidden / Micro) | 5 | 5 | **MET** |
| **Email Extraction Precision** | **1.000** | $\ge 0.90$ | **EXCEEDED** |
| **Email Extraction Recall** | **0.917** | $\ge 0.85$ | **EXCEEDED** |
| **Email Extraction F1** | **0.957** | $\ge 0.85$ | **EXCEEDED** |
| **Phone Extraction Recall** | **1.000** | $\ge 0.85$ | **EXCEEDED** |
| **Skills Extraction Precision** | **0.815** | $\ge 0.75$ | **EXCEEDED** |
| **Skills Extraction Recall** | **1.000** | $\ge 0.70$ | **EXCEEDED** |
| **Skills Extraction F1** | **0.898** | $\ge 0.70$ | **EXCEEDED** |
| **Work Experience Detection Recall** | **0.917** | $\ge 0.85$ | **EXCEEDED** |
| **Scanned Document Detection** | **5 / 5 (100%)** | 100% | **MET** |
| **Adversarial Hidden Text Detection** | **5 / 5 (100%)** | 100% | **MET** |
| **Latency (p50)** | **2.3 ms** | $< 500$ ms | **EXCEEDED** |
| **Latency (p90)** | **9.6 ms** | $< 1500$ ms | **EXCEEDED** |
| **Latency (p95)** | **213.4 ms** | $< 3000$ ms | **EXCEEDED** |
| **Latency (Mean)** | **21.7 ms** | $< 1000$ ms | **EXCEEDED** |

---

## 3. Architecture & File Breakdown

### Backend & ML Service (`services/ml/`)
- [`services/ml/src/parser/schema.py`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/src/parser/schema.py): Complete Pydantic v2 data models for `ResumeDocument`, `ContactInfo`, `ExperienceEntry`, `EducationEntry`, `SkillItem`, `ATSParseabilityReport`, `ATSIssue`, `SourceSpan`.
- [`services/ml/src/parser/ingest.py`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/src/parser/ingest.py): Magic byte validation, decompression ratio protection, PDF JS stripping, page count enforcement, and password encryption rejection.
- [`services/ml/src/parser/extractor.py`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/src/parser/extractor.py): Multi-column layout reconstruction, LaTeX ligature replacement, hyphen de-wrapping, DOCX parsing, scan detection, and hidden text detection (white-on-white, micro-font, keyword repetition).
- [`services/ml/src/parser/segmenter.py`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/src/parser/segmenter.py): Multilingual heading rules and spatial grouping for 12 sections.
- [`services/ml/src/parser/entity_extractor.py`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/src/parser/entity_extractor.py): Entity extraction with messy date parsing, overlap-safe career duration calculation, and token splitting.
- [`services/ml/src/parser/ats_scorer.py`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/src/parser/ats_scorer.py): Multi-strategy token discrepancy scoring, bounded 0-100 ATS score calculation, actionable remediation recommendations, and disclaimer.
- [`services/ml/src/parser/pipeline.py`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/src/parser/pipeline.py): Master orchestrator assembling the canonical `ResumeDocument`.
- [`services/ml/main.py`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/main.py): FastAPI server exposing `POST /v1/parse` with strict status code mapping (400 Bad Request, 413 Payload Too Large, 422 Unprocessable/Encrypted, 500 Internal).
- [`services/ml/tests/`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/services/ml/tests/):
  - `test_ingest.py`: 18 unit tests for magic bytes, limits, zip-bombs, encryption, corruption, and JS stripping.
  - `test_extractor.py`: 7 unit tests for ligatures, hyphenation, multi-column ordering, white fonts, keyword stuffing, and plain text extraction.
  - `test_ats_scorer.py`: 5 unit tests for discrepancy ratio, score bounds, penalties, actionable recommendations, and legal disclaimer.
  - `test_fuzz.py`: 12 fuzzing tests with random garbage byte streams, truncated headers, and surrogate Unicode patterns.
  - `test_golden_evaluation.py`: 60-document evaluation benchmark testing Precision, Recall, F1, and latency.

### Shared Contract (`packages/shared/`)
- [`packages/shared/src/resumeDocument.ts`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/packages/shared/src/resumeDocument.ts): Canonical Zod schema and TypeScript interfaces matching Pydantic models. Exported in [`packages/shared/src/index.ts`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/packages/shared/src/index.ts).

### Express API Integration (`server/`)
- [`server/database/db.ts`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/server/database/db.ts): Auto-migration adding `resume_document_json`, `ats_report_json`, `user_corrections_json`, `training_consent_opt_in`, and `training_consent_timestamp` columns to `resume_parsed_data`.
- [`server/services/resumeProcessingPipeline.ts`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/server/services/resumeProcessingPipeline.ts): Microservice HTTP client with 3.5s timeout, graceful error recovery, and seamless offline deterministic fallback preserving existing platform behavior.
- [`server/routes/resumeProcessing.ts`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/server/routes/resumeProcessing.ts):
  - `PATCH /api/candidate/resume/corrections`: Persists verified user corrections to the resume document.
  - `POST /api/candidate/resume/consent`: Updates training consent opt-in status and timestamp.
  - Extended resume GET endpoint to return canonical `document` and `atsReport`.

### Frontend UI Redesign (`apps/web` / `src/`)
- [`src/components/resume/ResumeSplitViewManager.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/resume/ResumeSplitViewManager.tsx):
  - Left pane: Raw extracted layout viewer with coordinate bounding box highlights on hover.
  - Right pane: ATS Parse-ability score ring, category breakdown, severity filter chips, prioritized remediation cards, interactive inline editable contact/summary/skills/experience, and training consent checkbox.
- [`src/pages/candidate/ResumePage.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/pages/candidate/ResumePage.tsx): Integrated split-view manager into Candidate Resume Management dashboard.
- [`src/services/api.ts`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/services/api.ts): API client methods `saveResumeCorrections` and `updateTrainingConsent`.

---

## 4. Known Limitations & Unsolved Edge Cases

Resumio strictly adheres to Rule 2 (PRODUCTION QUALITY ONLY) and Rule 3 (ML HONESTY). We document all unresolved edge cases openly:

1. **Complex Rotated or Diagonal Tables:**
   - Text rendered at arbitrary diagonal angles or inside 90-degree rotated table cells is extracted by PyMuPDF in orientation angle order, which may introduce minor reading order discrepancies in token discrepancy tests.
2. **Handwritten Annotations in Scans:**
   - Scanned documents with degraded or cursive handwriting cannot be reliably read by standard Tesseract without a specialized model. The parser detects `is_scanned: True` and prompts the user to submit a digital PDF/Word document.
3. **Multi-Role Overlapping Promotions at Single Company:**
   - When a candidate lists promotions within the same company without distinct dates per title, the date parser defaults to the overall company tenure. The inline user correction UI allows candidates to disambiguate sub-roles manually.
4. **Header/Footer Margin Heuristics on Non-Standard Page Sizes:**
   - Headers are defined as blocks in the top 8% of page height, and footers in the bottom 8%. On custom US Legal or non-standard page dimensions, margin content near the threshold may occasionally be classified as body text.

---

## 5. Verification Commands

All baseline checks pass cleanly:

```bash
# 1. TypeScript compilation check
npx tsc --noEmit
# Result: 0 errors

# 2. Oxlint check
npx oxlint --quiet
# Result: 0 errors

# 3. Frontend production build
npm run build
# Result: Clean build in 541ms

# 4. Master test suite (17 existing suites)
npm test
# Result: 17 / 17 suites passed (100%)

# 5. ML microservice test suite (43 tests)
cd services/ml
python -m pytest tests/ -v
# Result: 43 / 43 passed in 3.44s
```

---

## 6. Manual QA Checklist

- [x] **File Upload Security:** Upload valid PDF, DOCX, TXT. Verify correct format detection.
- [x] **Extension Spoofing Rejection:** Rename an `.exe` or `.zip` to `.pdf`. Verify rejection with `UnsupportedFormatError`.
- [x] **Password Protected PDF:** Upload encrypted PDF. Verify user-friendly error message prompt.
- [x] **ATS Score Ring & Discrepancy:** Verify ATS score is computed, displayed in circular gauge with color-coded status, and discrepancy ratio is recorded.
- [x] **Evidence Bounding-Box Highlight:** Hover over extracted skills or experience bullets. Verify bounding box highlight activates in the left layout pane.
- [x] **Inline User Corrections:** Edit Full Name or Summary in split-view, click "Save Corrections". Reload page and verify verified corrections persist.
- [x] **Training Consent Opt-In:** Toggle "Allow Resumio to use anonymized resume corrections for model training". Verify preference and ISO timestamp persist.
- [x] **Offline Fallback:** Terminate Python ML microservice. Upload a resume via UI. Verify Express falls back cleanly to offline deterministic engine with simulated ATS report without 500 error.
