# System Architecture & Diagrams (Phase 12 Final Documentation)

**Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Architecture Pattern:** Three-Tier Architecture with Dual-Database Persistence & Isolated Research Engine  

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Frontend Client Layer (React 19 + TypeScript + Tailwind CSS)"]
        UI_Cand["Candidate Portal\n(Profile, Resumes, Job Search, Tracker)"]
        UI_Rec["Recruiter Portal\n(Job Posting, Pipeline, AI Screening, Interviews)"]
        UI_Admin["Admin Portal\n(System Analytics, Research Benchmarks)"]
    end

    subgraph APILayer ["Backend Server Layer (Node.js + Express + TypeScript)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
        SecurityShield["Prompt Injection & Path Traversal Shield"]
        
        subgraph Controllers ["API Routers"]
            RouteAuth["/api/auth"]
            RouteJobs["/api/jobs"]
            RouteApps["/api/candidate/applications\n/api/recruiter/applications"]
            RouteMatching["/api/matching & /api/ai"]
            RouteInterviews["/api/interviews"]
            RouteResearch["/api/research/*"]
        end

        subgraph CoreServices ["Business Logic & Intelligence Engines"]
            MatchEngine["Deterministic 5-Component\nMatching Engine"]
            ExplanationEngine["Explainable Score\nBreakdown Service"]
            ResearchPipeline["Research Engine\n(Splitter, Augmenter, MNB Classifier)"]
            EvalEngine["IR Ranking & Metric\nEvaluation Engine (MRR, NDCG)"]
        end
    end

    subgraph DataLayer ["Data & Persistence Layer"]
        subgraph RelationalDB ["Relational Engine (SQLite)"]
            SQL_Users[("users")]
            SQL_Profiles[("candidate_profiles\nrecruiter_profiles")]
            SQL_Jobs[("jobs\njob_skills")]
            SQL_Apps[("applications\nstatus_history")]
            SQL_Interviews[("interviews")]
        end

        subgraph DocumentDB ["Document Engine (MongoDB Atlas Mongoose)"]
            Mongo_Users[("users")]
            Mongo_Profiles[("candidate_profiles")]
            Mongo_Jobs[("jobs")]
            Mongo_Apps[("applications")]
            Mongo_Research[("research_datasets\nresearch_experiments")]
        end
    end

    UI_Cand -->|HTTPS / REST| AuthMiddleware
    UI_Rec -->|HTTPS / REST| AuthMiddleware
    UI_Admin -->|HTTPS / REST| AuthMiddleware

    AuthMiddleware --> SecurityShield
    SecurityShield --> Controllers

    RouteMatching --> MatchEngine
    RouteMatching --> ExplanationEngine
    RouteResearch --> ResearchPipeline
    RouteResearch --> EvalEngine

    Controllers --> RelationalDB
    Controllers -.->|Dual-Persistence| DocumentDB
```

---

## 2. Candidate Journey Flowchart

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate
    participant UI as Candidate Portal (React)
    participant API as Backend API (Express)
    participant DB as SQLite & MongoDB
    participant AI as AI Matching Engine

    Candidate->>UI: Register / Login
    UI->>API: POST /api/auth/login
    API-->>UI: JWT Token + Role (candidate)
    
    Candidate->>UI: Complete Profile (Education, Skills, Experience)
    UI->>API: PUT /api/candidate/profile
    API->>DB: Persist Profile & Skills
    
    Candidate->>UI: Upload Resume (PDF/DOCX)
    UI->>API: POST /api/candidate/resumes (Multipart)
    API->>DB: Store File Metadata & Set Active
    
    Candidate->>UI: Search & Browse Published Jobs
    UI->>API: GET /api/jobs?search=TypeScript
    API-->>UI: Return Matching Active Jobs
    
    Candidate->>UI: Submit Application with Resume
    UI->>API: POST /api/candidate/applications
    API->>DB: Insert Application (Status: Applied)
    API->>AI: Trigger Asynchronous Matching & Screening
    AI->>DB: Persist 5-Component Match Score & Evidence
    API-->>UI: Application Submitted Confirmation
```

---

## 3. Recruiter Screening & Interview Management Flowchart

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Recruiter
    participant UI as Recruiter Portal (React)
    participant API as Backend API (Express)
    participant AI as Matching & Explanation Engine
    participant DB as Dual-Database
    participant Notif as Notification Service

    Recruiter->>UI: Sign in & Open Job Applicants
    UI->>API: GET /api/recruiter/jobs/:id/applicants
    API-->>UI: Return Applicant Pipeline with Match Scores
    
    Recruiter->>UI: Inspect Candidate Deep Profile & Match Explanation
    UI->>API: GET /api/recruiter/applications/:id
    API->>AI: Fetch Explainable Component Breakdown
    AI-->>UI: Return Matched Skills (45%), Experience (20%), Factual Evidence
    
    Recruiter->>UI: Update Applicant Status -> 'Shortlisted'
    UI->>API: PATCH /api/recruiter/applications/:id/status
    API->>DB: Update Status & Application History
    API->>Notif: Create In-App Notification for Candidate
    
    Recruiter->>UI: Schedule Technical Video Interview
    UI->>API: POST /api/interviews
    API->>DB: Insert Interview (Title, Date, Duration, URL)
    API->>Notif: Notify Candidate of Scheduled Interview
    API-->>UI: Interview Confirmed
```

---

## 4. Logical Data Relationships (ER-Style Diagram)

*Note: The following represents the logical entity relationships across Resumio's dual-database persistence architecture.*

```mermaid
erDiagram
    USERS ||--o| CANDIDATE_PROFILES : "has one"
    USERS ||--o| RECRUITER_PROFILES : "has one"
    USERS ||--o{ NOTIFICATIONS : "receives"
    
    CANDIDATE_PROFILES ||--o{ CANDIDATE_EDUCATION : "contains"
    CANDIDATE_PROFILES ||--o{ CANDIDATE_SKILLS : "contains"
    CANDIDATE_PROFILES ||--o{ CANDIDATE_EXPERIENCE : "contains"
    CANDIDATE_PROFILES ||--o{ CANDIDATE_RESUMES : "owns"
    
    RECRUITER_PROFILES ||--o{ JOBS : "posts"
    JOBS ||--o{ JOB_REQUIRED_SKILLS : "specifies"
    JOBS ||--o{ JOB_PREFERRED_SKILLS : "specifies"
    
    JOBS ||--o{ APPLICATIONS : "receives"
    CANDIDATE_PROFILES ||--o{ APPLICATIONS : "submits"
    CANDIDATE_RESUMES ||--o{ APPLICATIONS : "bound to (immutable)"
    
    APPLICATIONS ||--o{ APPLICATION_STATUS_HISTORY : "tracks"
    APPLICATIONS ||--o| RESUME_JOB_MATCHES : "evaluated by"
    APPLICATIONS ||--o{ INTERVIEWS : "scheduled for"

    RESEARCH_DATASETS ||--o{ RESEARCH_EXPERIMENTS : "evaluates"
```

---

## 5. Research Data Augmentation & Evaluation Pipeline Architecture

```mermaid
flowchart LR
    subgraph DataPrep ["1. Dataset Preparation & Hygiene"]
        RawData["Raw Benchmark Dataset\n(33 samples, 4 classes)"] --> Preprocess["Text Normalization\n& Schema Validation"]
        Preprocess --> StratSplit["Stratified Train/Val/Test Split\n(Zero-leakage isolation)"]
    end

    subgraph AugEngine ["2. Quality-Filtered Augmentation"]
        StratSplit -->|Train Split| PromptGen["Domain-Specific LLM Prompting\n(Targeting Minority Class: Security)"]
        PromptGen --> CandidateSynth["Candidate Synthetic Samples"]
        CandidateSynth --> QualityFilter{"Multi-Stage Quality Filter\n- Token length > 10\n- Exact duplicate rejection\n- Near-duplicate cosine check"}
        QualityFilter -->|Accepted| AugmentedTrain["Augmented Training Partition\n(Flagged: provenance='synthetic_llm')"]
        QualityFilter -->|Rejected| DropCount["Logged Rejection Stats"]
    end

    subgraph Evaluation ["3. Comparative Classifier & IR Benchmarking"]
        AugmentedTrain --> TrainModel["Train Multinomial Naive Bayes\nwith TF-IDF Feature Extraction"]
        StratSplit -->|Held-out Test Split| TestModel["Evaluate on Test Split"]
        TrainModel --> TestModel
        TestModel --> Metrics["Output Metrics:\n- Accuracy & Macro F1\n- Confusion Matrix\n- Hypothesis Outcome"]
    end

    subgraph IRRank ["4. Ranking & Retrieval Evaluation"]
        MatchEval["Resume-Job Matching Engine"] --> IR_Calc["IR Metrics Engine\n- Precision@1, 3, 5\n- Recall@1, 3, 5\n- MRR & NDCG@1, 3, 5"]
    end
```
