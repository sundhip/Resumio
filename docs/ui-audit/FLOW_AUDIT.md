# Resumio Navigation & User Flow Audit (Phase R0)

**Date:** October 16, 2026  
**Auditor:** Resumio Lead Product Architect  
**Scope:** Click-stream analysis, screen progression audit, and navigation redesign across Candidate, Recruiter, and Administrator workflows.  

---

## 1. Baseline Task Flow & Click-Count Analysis

We analyzed the 7 primary user workflows under the existing pre-redesign interface:

| Workflow | Role | Current Screen Progression | Current Clicks | Efficiency Bottlenecks | Target Redesign Clicks |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **1. Upload a Resume** | Candidate | Dashboard $\to$ Sidebar (Resume Manager) $\to$ Dropzone $\to$ Upload Confirm $\to$ Wait $\to$ View | **4 clicks** (2 screens) | Separate upload page requires leaving dashboard context. Dropzone lacks instant inline parsing progress. | **2 clicks** (Inline Modal) |
| **2. Apply to a Job** | Candidate | Dashboard $\to$ Explore Jobs $\to$ Search/Filter $\to$ Job Details $\to$ Apply Modal $\to$ Select Resume $\to$ Submit | **6 clicks** (3 screens) | Redundant step forcing full Job Details page navigation before quick 1-click apply drawer. | **3 clicks** (Quick Apply Drawer) |
| **3. Create & Publish a Job** | Recruiter | Dashboard $\to$ Job Postings $\to$ "Create Job" Button $\to$ Multi-section Form $\to$ Add Skills $\to$ Publish Button | **7 clicks** (3 screens) | Fragmented page with skill inputs separated from requirements text. Lacks live JD quality assist inline. | **4 clicks** (Unified Studio) |
| **4. See Top 5 Candidates** | Recruiter | Dashboard $\to$ Workspace $\to$ Select Job $\to$ Applicant Table $\to$ Click Sort by Match Score | **4 clicks** (2 screens) | Dashboard fails to surface top candidates directly on the primary overview bento. | **1 click** (Dashboard Bento Card) |
| **5. Compare Two Candidates** | Recruiter | Workspace $\to$ Table View $\to$ Select Checkbox 1 $\to$ Select Checkbox 2 $\to$ Bulk Actions Dropdown $\to$ Compare | **5 clicks** (1 screen + modal) | Multi-select action buried in secondary dropdown. Comparison matrix is trapped in a restrictive modal. | **2 clicks** (Side-by-Side Split View) |
| **6. Schedule an Interview** | Recruiter | Workspace $\to$ Candidate Row $\to$ View Details $\to$ Action Menu $\to$ "Schedule Interview" $\to$ Form $\to$ Send | **6 clicks** (2 screens + modal) | Interview scheduling requires opening candidate profile before calendar dialog is available. | **2 clicks** (Quick Schedule Action) |
| **7. Understand Why a Score Is What It Is** | Either | Candidate Row $\to$ View Profile $\to$ Match Details Tab $\to$ Scroll to Sub-scores $\to$ Click Breakdown | **5 clicks** (2 screens) | Deeply nested sub-scores. Scores on primary leaderboard lack instant hover popovers and evidence tooltips. | **0 clicks** (Instant Hover Card) |

---

## 2. Key Friction Points in Current Information Architecture

1. **Context Fragmentation:** Navigating between "Recruiter Workspace", "Applicant Pipeline", and "Job Postings" creates disjointed mental models. The recruiter must constantly switch screens to perform related tasks.
2. **Hidden Critical Actions:** High-frequency actions (e.g. comparing candidates, viewing evidence spans, scheduling interviews) are buried under three layers of nested menus and modals.
3. **Overcrowded Legacy Sidebar:** The recruiter sidebar currently displays 14 separate items across 4 sections, overwhelming users with secondary and research tools (`dev-design-system`, `public-benchmark`, `skills-ontology`).
4. **Lack of Instant Feedback:** Score explanations require navigating to a dedicated details view rather than revealing driving evidence through high-fidelity popover cards on hover.

---

## 3. Streamlined Information Architecture & Recommended Sidebars

We propose restructuring the platform around **high-density, role-specific command hubs** inspired by the FinGlow and Vestmark references:
- **Max 6–7 top-level navigation items per role.**
- **Expanded sidebar width:** 248px (expanded) / 72px (collapsed icon-only mode).
- **Secondary tools moved into contextual tabs or the global Command Palette (`Cmd+K`).**

---

### A. Candidate Portal Navigation
*Focus: Personal growth, transparent matching, verified skills, and job discovery.*

```
├── 📊 Dashboard              (Overview bento: match fit, profile health, timeline)
├── 💼 Explore Jobs           (Faceted job discovery, search, 1-click apply drawer)
├── 🧭 Career Hub             (Skill gaps, What-If simulator, verified GitHub badges)
├── 📄 Applications           (Active application stages, interviews, recruiter notes)
├── 📝 Resume Studio          (Resume versions, ATS health optimizer, PDF preview)
└── ⚙️ Settings               (Data export, privacy controls, account security)
```

---

### B. Recruiter / Hiring Manager Portal Navigation
*Focus: Fast candidate triage, bulk processing, pipeline Kanban, and evidence inspection.*

```
├── 📊 Command Center         (Executive KPIs, top talent highlights, urgent actions)
├── ⚡ Talent Pipeline        (Unified Workspace: Kanban stages, virtualized table, bulk actions)
├── 💼 Job Postings           (Requisitions, JD intelligence editor, requirement weights)
├── 🔍 Talent Search          (Natural-language query compiler, semantic pool search)
├── 📅 Interview Hub          (Structured scorecards, calendar schedules, feedback sync)
├── 📈 Recruitment Analytics  (Funnel throughput, time-to-hire, EEOC compliance metrics)
└── ⚙️ Organization Settings  (Multi-tenant team RBAC, integrations, API keys)
```
*(Secondary tools like Match Lab, Design System Catalog, and Public Benchmark move to contextual tabs within the relevant modules or Command Palette).*

---

### C. Platform Administrator Navigation
*Focus: Multi-tenant governance, system security, and ModelOps telemetry.*

```
├── 📊 System Overview        (Tenant activity, active sessions, system health)
├── 👥 Organization & Users   (Tenant management, role assignments, session revoke)
├── 🤖 ModelOps & AI Registry (Shadow evaluation, PSI drift monitor, promotion gate)
├── 🔌 Platform & Webhooks    (REST API metering, outbound webhook logs, rate limits)
├── 🛡️ Compliance & Audits    (NYC LL 144 bias audits, GDPR data subject deletion queue)
└── ⚙️ System Settings        (Security policies, TOTP enforcement, backup drills)
```
