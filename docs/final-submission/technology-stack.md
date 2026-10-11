# Technology Stack Justification

**Project:** Resumio — AI Resume Screening & Recruitment Portal  
**Academic Level:** Undergraduate / Graduate Capstone Project Evaluation  

This document details the technologies selected, implemented, and verified in the Resumio codebase, providing architectural rationale and engineering trade-offs.

---

## 1. Complete Technology Stack Matrix

| Technology | Layer / Domain | Exact Version | Primary Purpose in Resumio | Architectural Justification & Trade-offs |
|---|---|---|---|---|
| **React** | Frontend Framework | `19.2.8` | Component-based User Interface | Declarative, component-driven architecture enables modular UI development across candidate, recruiter, and admin portals with rapid reactive state updates. |
| **TypeScript** | Programming Language | `~6.0.2` | Static Typing & Contract Safety | Guarantees end-to-end type safety between backend API contracts and frontend client hooks, catching mismatches at compile time rather than runtime. |
| **Vite** | Build Tool & Bundler | `8.3.0` | Frontend Development & Production Bundling | Provides sub-second Hot Module Replacement (HMR) and optimized production Rollup bundling (< 1s build times for 1,900+ modules). |
| **Tailwind CSS** | Styling System | `4.3.3` | Responsive UI & Design Tokens | Utility-first styling with zero CSS bloat, ensuring full accessibility and mobile/tablet/desktop responsive layouts without stylesheet drift. |
| **Lucide React** | UI Icons | `1.44.0` | Accessible Iconography | Lightweight, tree-shakable SVG icon library enhancing visual feedback and dashboard status indicators. |
| **Express.js** | Backend Web Framework | `4.21.2` | RESTful API Routing & Middleware | Mature, minimalist Node.js HTTP server framework supporting structured route pipelines, JWT authentication middleware, and multipart uploads. |
| **Node.js** | Runtime Environment | `v24.16.0` (ESM) | Server-side Execution | Non-blocking, event-driven I/O ideal for concurrent API requests, resume file processing, and asynchronous background scoring. |
| **TSX** | TypeScript Execution | `4.19.3` | Direct TypeScript Execution | Enables native TypeScript execution with ES module support without intermediate compilation steps, accelerating server initialization and automated testing. |
| **SQLite (sql.js / better-sqlite3)** | Relational Database | `1.14.2` / `7.6.12` | ACID-compliant Relational Storage | Enforces strict foreign key constraints, unique indexes, and immediate transactional consistency for relational workflows (user auth, jobs, applications, status history). |
| **MongoDB Atlas & Mongoose** | Document Database & ODM | `7.7.0` / `9.11.1` | Document Data Persistence & Scalability | Provides flexible, highly scalable document storage for unstructured resume texts, complex nested match explanations, and isolated research experiment runs. |
| **JWT (jsonwebtoken)** | Authentication | `9.0.2` | Stateless Token-based Auth | Secure, stateless bearer token authorization with tamper-evident digital signatures and 7-day expiration lifecycles. |
| **Bcrypt.js** | Cryptographic Security | `3.0.2` | Secure Password Hashing | Industry-standard salted password hashing (10 salt rounds) guarding against rainbow table and brute-force credential compromise. |
| **Multer** | Multipart File Handling | `2.3.0` | Secure Resume File Uploads | Streams incoming file uploads with strict file size limits (10MB), MIME-type whitelisting, and localized disk storage. |
| **Google Generative AI SDK** | AI / LLM Provider | `0.24.1` | Generative Intelligence & Augmentation | Interfaces with Google Gemini LLM for semantic candidate search interpretation, interview question generation, and synthetic text augmentation. |
| **Oxlint** | Static Analysis / Linter | `1.81.0` | Rust-based Code Quality & Linting | High-performance linter validating React hooks, dependency arrays, and unreachable code across 160+ files in under 300ms. |

---

## 2. In-Depth Justifications by System Layer

### 2.1 Why Dual-Database Architecture (SQLite + MongoDB)?
- **Relational Integrity for Transactions:** Job postings, candidate applications, and interview appointments require strict foreign key constraints and atomic ACID updates. If an interview is scheduled, the application and job must exist; if an application is submitted, duplicate attempts must be atomically blocked. SQLite provides zero-latency relational guarantees with zero operational overhead.
- **Document Flexibility for Unstructured AI Data:** Resume parsing, extracted skill graphs, detailed 5-component match breakdowns, and synthetic research experiments contain nested structures that evolve rapidly. MongoDB's document model stores these rich JSON structures natively without complex multi-table joins.
- **Dual-Persistence Pattern:** Operational mutations write synchronously to SQLite for transactional integrity while asynchronously dual-persisting to MongoDB Atlas Mongoose models, achieving the benefits of both relational consistency and scalable cloud storage.

### 2.2 Why Deterministic Scoring over Pure LLM Scoring?
- **Auditable & Explainable:** LLM-generated match scores can exhibit non-deterministic variance, hallucinated qualifications, and hidden bias. Resumio employs a deterministic 5-component mathematical scoring algorithm:
  $$\text{Score} = (\text{Req Skills} \times 0.45) + (\text{Pref Skills} \times 0.15) + (\text{Experience} \times 0.20) + (\text{Title} \times 0.10) + (\text{Education} \times 0.10)$$
- **Explainability:** Recruiters can inspect exact point contributions and verify why a candidate scored 92% vs 65%.
- **LLM in Advisory Role Only:** LLM providers are utilized strictly for semantic text comprehension (parsing messy resume text, natural language search queries, and generating customized interview questions), never as an unaccountable black-box decision maker.

### 2.3 Why TypeScript Across Full Stack?
- **Shared Domain Interfaces:** Data structures like `IUser`, `ICandidateProfile`, `IJob`, `IApplication`, and `MatchingEvaluationItem` are declared once and shared across client and server.
- **Refactoring Resilience:** Renaming a property or altering an API response structure triggers immediate compiler warnings across the entire repository, preventing breaking changes from reaching production.
