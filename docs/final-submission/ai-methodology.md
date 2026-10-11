# AI Recruitment Intelligence & Screening Methodology

**Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Category:** Automated Talent Acquisition & Information Retrieval  

---

## 1. Executive AI Overview & Design Philosophy

Resumio addresses the primary flaws of traditional Keyword Applicant Tracking Systems (ATS) and unconstrained Large Language Model (LLM) screeners:
1. **Keyword ATS Flaws:** Inflexible exact-match algorithms reject qualified candidates who use valid synonyms or alternative phrasing (e.g., rejecting "Golang" when "Go" is requested).
2. **Unconstrained LLM Screeners Flaws:** Black-box LLMs frequently hallucinate candidate credentials, vary scores across identical runs, and obscure the rationale behind rejection.

**Resumio's Hybrid Architecture:**
- **Deterministic 5-Component Mathematical Scoring:** Core ranking and match evaluation is strictly deterministic, auditable, and reproducible ($0$–$100$ scale).
- **LLM in Advisory Semantic Roles:** Generative AI is utilized strictly for unstructured document parsing, candidate interview question generation, semantic search interpretation, and controlled data augmentation.

---

## 2. Deterministic 5-Component Match Scoring Formula

The matching engine ([`ResumeJobMatchingService`](file:///C:/Users/user/.gemini/antigravity/scratch/Resumio/server/services/matchingService.ts)) evaluates a candidate against a job posting across five weighted dimensions:

$$\text{Final Match Score} = W_{rs} S_{rs} + W_{ps} S_{ps} + W_{exp} S_{exp} + W_{title} S_{title} + W_{edu} S_{edu}$$

Where the weights and scoring components are defined as:

### 1. Required Skills Match ($W_{rs} = 0.45$ — Max 45 Points)
- **Evaluation:** Ratio of job required skills found in candidate profile/resume:
  $$S_{rs} = \frac{|\text{Candidate Skills} \cap \text{Required Skills}|}{|\text{Required Skills}|} \times 100$$
- **Skill Normalization:** All skills are normalized via case-folding and alias mapping (e.g., `NodeJS` $\rightarrow$ `Node.js`, `ReactJS` $\rightarrow$ `React`).

### 2. Preferred Skills Match ($W_{ps} = 0.15$ — Max 15 Points)
- **Evaluation:** Bonus consideration for desirable supplementary skills (e.g., `Docker`, `GraphQL`, `AWS`):
  $$S_{ps} = \frac{|\text{Candidate Skills} \cap \text{Preferred Skills}|}{|\text{Preferred Skills}|} \times 100$$

### 3. Relevant Experience Match ($W_{exp} = 0.20$ — Max 20 Points)
- **Evaluation:** Comparison between candidate's total verified experience years ($E_{cand}$) and the job's minimum experience requirement ($E_{min}$):
  - If $E_{cand} \ge E_{min}$: $S_{exp} = 100\%$ (Full 20 points).
  - If $E_{cand} < E_{min}$: $S_{exp} = \frac{E_{cand}}{E_{min}} \times 100$.

### 4. Job Title & Domain Relevance ($W_{title} = 0.10$ — Max 10 Points)
- **Evaluation:** Jaccard token overlap between candidate's headline/past titles and the target job title:
  $$S_{title} = \frac{|\text{Tokens}_{headline} \cap \text{Tokens}_{jobTitle}|}{|\text{Tokens}_{headline} \cup \text{Tokens}_{jobTitle}|} \times 100$$

### 5. Education & Qualification ($W_{edu} = 0.10$ — Max 10 Points)
- **Evaluation:** Degree level scoring based on verified candidate education credentials (Doctorate/Master's = 100%, Bachelor's = 85%, Associate's/Diploma = 65%).

---

## 3. Explainable AI Score Breakdown & Evidence

The explanation engine ([`MatchExplanationService`](file:///C:/Users/user/.gemini/antigravity/scratch/Resumio/server/services/matchExplanationService.ts)) ensures that every generated match score is completely transparent to recruiters:

```json
{
  "finalScore": 92,
  "isConsistent": true,
  "components": {
    "requiredSkills": {
      "score": 45,
      "maxScore": 45,
      "matched": ["TypeScript", "Node.js", "React", "MongoDB"],
      "missing": []
    },
    "preferredSkills": {
      "score": 15,
      "maxScore": 15,
      "matched": ["Docker", "GraphQL"],
      "missing": []
    },
    "experience": {
      "score": 20,
      "maxScore": 20,
      "candidateYears": 5,
      "requiredMinYears": 3
    },
    "titleRelevance": {
      "score": 7,
      "maxScore": 10
    },
    "education": {
      "score": 5,
      "maxScore": 10
    }
  },
  "factualSummary": "Candidate matched 4/4 required skills and 2/2 preferred skills with 5 years verified experience exceeding the 3-year minimum."
}
```

**Consistency Guarantee:**
The sum of component point contributions mathematically equals the final score. Recruiters never receive unexplained or hallucinated scoring tiers.

---

## 4. Semantic Search & Anti-Bias Guardrails

The Natural Language Search Service ([`NaturalLanguageSearchService`](file:///C:/Users/user/.gemini/antigravity/scratch/Resumio/server/services/nlSearchService.ts)) allows recruiters to search candidates using conversational queries while strictly enforcing ethical hiring standards:

1. **Anti-Bias Interception:** Queries targeting protected personal attributes (age, gender, religion, race, ethnicity, marital status) are intercepted before search execution:
   - *Example Rejected Query:* "Find young male engineers under 30"
   - *Rejection Reason:* "Platform policy prohibits filtering candidates by age, gender, or protected personal characteristics."
2. **Deterministic Fallback Extraction:** In the absence of live LLM availability, queries are parsed using a deterministic regex tokenizer that extracts technical skills, years of experience, and role seniority directly against verified database candidates.

---

## 5. Automated Interview Question Generator

The Interview Question Service ([`InterviewQuestionService`](file:///C:/Users/user/.gemini/antigravity/scratch/Resumio/server/services/interviewQuestionService.ts)) analyzes the applicant's resume against the target job requirements to generate tailored evaluation questions across 4 distinct categories:
- **Technical Competency:** Deep-dive questions testing proficiency in matched skills (e.g., Node.js concurrency, TypeScript generics).
- **Behavioral & Cultural:** Team collaboration and deadline resolution scenarios.
- **Situational & Problem Solving:** Architecture and system degradation handling.
- **Skill Gap Probing:** Targeted questions evaluating aptitude in missing or preferred skills to verify candidate learnability.
