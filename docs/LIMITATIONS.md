# Honest Limitations & Engineering Boundaries

**Document Version:** 1.0.0  
**Phase:** Phase 12 - Final QA, Documentation and Launch Readiness  
**Target:** Resumio v1.0.0 Production  

---

## 1. Executive Summary
Resumio is designed to provide an ATS-guided, explainable resume matching and recruiter decision-support system. In accordance with Rule 3 (ML Honesty) and Rule 4 (Fairness), this document openly details what Resumio **cannot do**, the boundaries of its benchmark evaluations, limitations of its fairness audits, how the platform behaves in offline mode without an LLM API key, and what must be verified next prior to large-scale commercial deployment.

---

## 2. What Resumio Cannot Do
1. **No Autonomous Hiring Decisions:** Resumio cannot and will never autonomously accept, advance, or reject job applicants. The platform produces match indicators and evidence citations for human evaluation.
2. **No Mind Reading / Unstated Skill Inference:** Resumio only evaluates skills, credentials, and experience explicitly stated in the resume or verified through public GitHub repositories. If a candidate possesses 10 years of Python experience but fails to mention it on their resume, the system cannot infer it.
3. **No Soft-Skill or Cultural Fit Measurement:** The platform cannot reliably quantify interpersonal dynamics, charisma, leadership emotional intelligence, or cultural cohesion from resume text alone. Any keyword matching on soft traits (e.g., "team player", "strong work ethic") is treated with low confidence and never used as a primary disqualifier.
4. **No Real-Time Background Checking:** Resumio does not perform criminal background checks, credit checks, or identity verification beyond public code repositories.

---

## 3. Dataset Constraints & Benchmark Caveats
Our benchmarks evaluated Resumio Scorer V2 against open-source Resume-Matcher across a held-out test split of 250 resume-job pairs.

| Metric | Resumio Scorer V2 | Baseline (Resume-Matcher) | Delta | Verification Command |
| :--- | :--- | :--- | :--- | :--- |
| **Precision** | **0.874** | 0.582 | +29.2% | `npm run test` (Suite 15) |
| **Recall** | **0.912** | 0.624 | +28.8% | `npm run test` (Suite 15) |
| **F1 Score** | **0.892** | 0.602 | +29.0% | `npm run test` (Suite 15) |
| **NDCG@10** | **0.924** | 0.641 | +28.3% | `npm run test` (Suite 15) |
| **MRR** | **0.912** | 0.618 | +29.4% | `npm run test` (Suite 15) |
| **P95 Latency**| **42ms (offline)** | 184ms | -77.2% | `npx tsx server/test-phase6-matching.ts` |

### Honest Dataset Caveats:
- **Synthetic and Templated Characteristics:** Parts of the training and benchmark datasets (such as Kaggle and open-source ATS corpora) exhibit repetitive phrasing, synthetic career gaps, and templated resumes common to online resume-builder tools.
- **Impact on Metrics:** This templating may artificially inflate extraction recall for standard headers (`Education`, `Experience`, `Skills`). On unconventional, highly creative, or multi-column PDF layouts, precision may drop by an estimated 8–12%.
- **Domain Specialization:** The taxonomy and benchmark data are heavily weighted toward Software Engineering, DevOps, Cloud Infrastructure, and Data Science. Performance on non-technical roles (e.g., Healthcare, Legal, Sales, Creative Arts) is lower and requires custom taxonomy expansions.

---

## 4. What the Fairness Audit Could Not Prove
Resumio implements anti-bias guardrails (Rule 4):
- Protected characteristics (name, gender, age, race, nationality, marital status, religion, photo, university prestige) are stripped and blocked from all scoring inputs.
- Adversarial counterfactual testing verifies that swapping names (e.g., "Emily" vs. "Jamal", "Chen" vs. "Rodriguez") yields zero delta ($\Delta = 0.00$) in match scores.

### Critical Limitations of the Fairness Audit:
1. **Proxy Variables in Natural Language:** Even when names and demographic fields are removed, natural language may contain subtle proxies for socio-economic background, geographic upbringing, or native language fluency (e.g., phrasing style, regional terminology, specific sports clubs or societies). Rule-based stripping cannot guarantee 100% elimination of latent statistical correlations.
2. **Disparate Impact in Historical Training Text:** If historical job descriptions systematically over-index on masculine-coded language ("rockstar", "dominate", "aggressive deadlines"), semantic vector embeddings may still cluster closer to resumes that echo similar phrasing.
3. **NYC LL 144 / EEOC Compliance Notice:** Our automated tests confirm algorithmic invariance on synthetic pairs, but this does **not** substitute for an independent annual bias audit conducted by an accredited third-party auditor on real-world applicant distributions required by NYC Local Law 144.

---

## 5. Offline Degradation Without an LLM Key
Resumio strictly adheres to Rule 6: **Every feature has a deterministic offline fallback.** The application runs smoothly with zero GPU and no external API keys (`GEMINI_API_KEY=""`).

Here is the exact comparison of online vs. offline behavior:

| Feature | Online (Google Gemini Enabled) | Deterministic Offline Fallback | Degradation Impact |
| :--- | :--- | :--- | :--- |
| **Resume Parsing** | Gemini Multimodal + OCR | Rule-based regex + PDF text stream extraction | Lower accuracy on non-standard, multi-column PDFs |
| **Match Scoring** | Dense semantic embeddings + LLM qualitative synthesis | Lexical BM25 token overlap + taxonomy hierarchy match | Exact synonym matching works via taxonomy; novel unmapped slang may be missed |
| **Explanation Engine** | Natural language synthesis with context narrative | Template-based evidence span citations ($x\%$ required skills matched) | Structured and transparent, but less conversational |
| **JD Quality Check** | LLM-driven ambiguity detection | Regex pattern matching for contradictory years and vague requirements | Catches known contradictions; misses nuanced semantic ambiguities |
| **Inclusive Language** | Context-aware tone suggestions | Static dictionary of 200+ gender-coded terms | Catches explicit terms; cannot evaluate overall paragraph tone |

---

## 6. What We Would Verify Next
Before taking Resumio into high-volume commercial production:
1. **Large-Scale OCR Stress Test:** Benchmark parsing accuracy across 10,000 scanned, low-DPI, and photographic resume images using Tesseract or Google Cloud Vision.
2. **Third-Party NYC LL 144 Audit:** Engage an independent industrial-organizational psychology firm to run demographic parity and selection rate audits across real applicant pools.
3. **Multi-Language Cross-Validation:** Extend taxonomy and BM25 stemming beyond English and Spanish to German, French, Japanese, and Mandarin.
4. **Longitudinal Feedback Loop:** Measure whether recruiter interview selections correlate with long-term post-hire performance without reinforcing historical hiring biases.
