# Resumio UI/UX Redesign Master Plan (Phase R0)

**Document Version:** 1.0.0  
**Status:** Approved Architectural Blueprint  
**Design Contract:** [`docs/design/DESIGN_CONTRACT.md`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/docs/design/DESIGN_CONTRACT.md)  
**Execution Order:** Ordered strictly by user impact and workflow value.  

---

## 1. Redesign Principles & Module Architecture

The redesign implements the **Two Themes, One Brand** contract:
- **Obsidian Dark Mode:** Blackish `#050708` canvas, `#0C1113` cards, `#080B0C` shell, 1px borders with inner top highlights, glowing teal accents (`#1F8FA6`), and high-density bento cards.
- **Paper Light Mode:** Calm warm grey `#E9E9E5` canvas, `#F4F4F1` surface, `#FFFFFF` crisp cards, `#E7E7E2` hairline borders, and ink `#111312` primary buttons.
- **Modular Bento Grid:** 12-column responsive layout, 1440px max width, 20px card radii, and 16px grid gap.
- **Data Density:** Space Grotesk / JetBrains Mono tabular figures with left vertical indicator bars, circular score rings, arc gauges, and gradient health bars.

---

## 2. Screen-by-Screen Redesign Blueprint (Ordered by User Impact)

### Priority 1: Recruiter Talent Pipeline & Workspace (User Impact: CRITICAL)
- **Current Screens:** `recruiter-workspace`, `applicants`
- **New Unified Layout:** `Recruiter Pipeline & Candidate Leaderboard`
- **Module Architecture:**
  - **Header:** Role requisition selector, candidate count, filter chips, and primary action buttons (*"Ingest Resumes"*, *"Export CSV"*, *"Compare Selected"*).
  - **View Switcher:** Seamless toggle between **Kanban Stages** (horizontal drag-and-drop columns with candidate density cards) and **Virtualized Table** (10,000+ candidate capacity, sticky header, sortable columns).
  - **Signature Elements:**
    - Circular match score rings with evidence count badges.
    - Status pills with uppercase micro typography (11px, `+0.08em` tracking).
    - Side-by-side comparison matrix drawer opening smoothly on multi-select.
    - Color-coded resume heatmap popover hovering over candidate match scores.

---

### Priority 2: Candidate Dashboard & Career Hub (User Impact: CRITICAL)
- **Current Screens:** `dashboard` (candidate), `candidate-experience`, `recommendations`
- **New Unified Layout:** `Candidate Command Center & Career Hub`
- **Module Architecture:**
  - **Hero Module:** Teal gradient feature card (`#1B8197` to `#176F83`) displaying personalized match status, quick resume update action, and profile strength indicator.
  - **Bento Row 1:**
    - *Card A (8-col):* Active application timeline with hatched progress bars and stage badges.
    - *Card B (4-col):* ATS resume health gauge with section completeness indicators.
  - **Bento Row 2:**
    - *Card C (6-col):* Top job recommendations with matched skill evidence tags and transparent "Why You Match" badges.
    - *Card D (6-col):* Interactive What-If career simulator with skill gap sliders and non-hallucinated learning resource links.
  - **Signature Elements:**
    - Verified by GitHub badges with authenticated commit recency and language distribution bars.
    - Direct 1-click apply drawer from any recommended job tile.

---

### Priority 3: Global Navigation Shell & Topbar (User Impact: HIGH)
- **Current Screens:** `AppLayout.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- **New Unified Layout:** `Executive Bento Shell`
- **Module Architecture:**
  - **Sidebar:** Width 248px (expanded) / 72px (collapsed). Obsidian dark `#080B0C` / Paper light `#FFFFFF` with hairline border. Section headers in 11px uppercase micro font with `+0.08em` tracking.
  - **Topbar:** Sticky 64px header with organization switcher, global Command Palette shortcut (`Cmd+K`), live notification popover, and theme toggle (`Dark` / `Light` / `System`).
  - **Signature Elements:**
    - Radial teal canvas glow originating from the top-right (`rgba(43,179,201,0.10)`).
    - Zero default Tailwind slate or generic blue borders.

---

### Priority 4: Job Description Intelligence & Publishing Studio (User Impact: HIGH)
- **Current Screens:** `recruiter-jobs`, `create-job`, `edit-job`
- **New Unified Layout:** `Job Requisition & Intelligence Studio`
- **Module Architecture:**
  - **Left Pane (7-col):** Structured job specification editor (role title, location, employment type, salary disclosure, responsibilities).
  - **Right Pane (5-col):** Real-time JD Intelligence assistant:
    - Unrealistic requirements detector (e.g. "exceeding technology age").
    - Inclusive language checker with neutral tone recommendations.
    - Required skills vs. preferred nice-to-have skill weighting matrix.
  - **Signature Elements:**
    - Live JD Quality score ring ($0–100\%$) updating on keystroke.
    - Clear action buttons: *"Publish Job Opening"* (ink `#111312` in light / teal `#1F8FA6` in dark) vs *"Save as Draft"*.

---

### Priority 5: Talent Search & Natural-Language Query Compiler (User Impact: MEDIUM-HIGH)
- **Current Screens:** `recruiter-ai-search`
- **New Unified Layout:** `AI Talent Sourcing & Search Compiler`
- **Module Architecture:**
  - **Top Search Bar:** Natural language input with real-time prompt compilation preview.
  - **Compiled Filter Ribbon:** Displays compiled Boolean expression (`(skills: Go AND Kubernetes) OR location: Remote`) with editable chips.
  - **Compliance Banner:** Clear anti-bias notice confirming protected demographic attributes are blocked.
  - **Results Bento:** Two-column grid of candidate summary cards with evidence citations and quick-shortlist buttons.

---

### Priority 6: Interview Hub & Structured Evaluation Rubrics (User Impact: MEDIUM)
- **Current Screens:** `recruiter-interviews`, `interviews` (candidate)
- **New Unified Layout:** `Interview Orchestration Hub`
- **Module Architecture:**
  - **Calendar Bento:** Mini month calendar with colored day dots indicating scheduled interviews.
  - **Upcoming Schedule Table:** Chronological applicant list with format badges (`Video`, `Phone`, `In-person`), meeting links, and calendar sync buttons.
  - **Evaluation Drawer:** Structured interview scorecard with standardized rating sliders and collaborative notes with @mentions.

---

### Priority 7: Analytics & Compliance Dashboard (User Impact: MEDIUM)
- **Current Screens:** `recruiter-analytics`
- **New Unified Layout:** `Recruitment Throughput & EEOC Compliance Center`
- **Module Architecture:**
  - **Stat Row:** 4 stat cards with left colored accent bars and Space Grotesk tabular figures.
  - **Throughput Chart:** Area chart over vertical-bar texture with custom marker tooltip.
  - **Fairness & Adverse Impact Card:** Live Four-Fifths (80%) Rule bar charts across demographic cohorts with NYC LL 144 compliance indicators.

---

### Priority 8: Administrator Governance & ModelOps Registry (User Impact: MAINTENANCE)
- **Current Screens:** `admin-dashboard`, `admin-users`, `research-pipeline`, `platform-integrations`
- **New Unified Layout:** `Platform Governance & ModelOps Center`
- **Module Architecture:**
  - Multi-tenant organization list with usage quota meters and session revocation.
  - Shadow model scoring telemetry with PSI drift gauge and one-click rollback triggers.
  - API key management with granular scope checkboxes and real-time request log stream.

---

## 3. Redesign Phase Sequence & Verification Strategy

| Phase | Target Scope | Key Deliverable | Verification Gate |
| :--- | :--- | :--- | :--- |
| **UI-R1** | Navigation Shell, Theme Tokens & Bento Grid | Updated `Sidebar`, `Topbar`, `AppLayout`, and CSS variables | Dark canvas reads `#050708`; light reads `#F4F4F1`; 1440px/390px screenshots |
| **UI-R2** | Recruiter Workspace & Candidate Pipeline | Unified Kanban & virtualized table with score rings | Smooth drag-and-drop; side-by-side comparison drawer; screenshots |
| **UI-R3** | Candidate Dashboard & Career Hub | Bento hero, application timeline, What-If simulator | Verified GitHub badges; mobile stacking; screenshots |
| **UI-R4** | Job Intelligence Studio & Search Compiler | Split-pane JD editor and Boolean compiled search | Live quality feedback; anti-bias guardrail banners; screenshots |
| **UI-R5** | Interview Hub & Analytics Dashboard | Scorecard drawer, calendar dots, and EEOC charts | Area chart textures; scorecard inputs; screenshots |
| **UI-R6** | Final Polish, Design System Catalog & Wrap-up | Component showcase, empty states, and full audit report | `docs/phases/UI-R-FINAL-REPORT.md`; 25/25 tests passing |
