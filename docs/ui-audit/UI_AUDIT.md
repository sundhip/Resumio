# Resumio UI Audit Report (Phase R0)

**Date:** October 16, 2026  
**Auditor:** Resumio Lead Design Engineer  
**Scope:** Complete baseline visual audit across Candidate, Recruiter, and Admin screens in Obsidian (Dark) and Paper (Light) at 1440px desktop and 390px mobile.  
**Baseline Artifacts:** 148 automated screenshots saved in [`docs/ui-audit/before/`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/docs/ui-audit/before).  
**Target References:**
- **Dark Theme Reference:** FinGlow (near-black `#050708` canvas, soft teal radial glow, glowing teal accent borders, bento grid, monospace tabular figure KPIs).
- **Light Theme Reference:** Vestmark (warm grey `#E9E9E5` canvas, crisp white cards, `#E7E7E2` hairline borders, deep ink `#111312` buttons, green delta pills).
- **Pipeline Reference:** Pipeline Simulator (horizontal stages, clear score badges, structured cards with evidence tooltips).

---

## 1. Executive Evaluation Matrix

Every screen was evaluated on a 1–5 scale across 10 critical UX/UI dimensions:
1. **Visual Hierarchy (VH):** Dominance of primary actions, section heading clarity, typographic scale.
2. **Density & Whitespace (DW):** Spacing efficiency, bento proportions, breathing room without emptiness.
3. **Alignment & Spacing Consistency (AS):** Grid adherence, padding consistency (20–24px card standard).
4. **Colour & Contrast (CC):** Obsidian `#050708` adherence vs. generic slate grey, WCAG 2.2 AA ratios.
5. **Component Consistency (Comp):** Unified card styles, standard button heights (40px/48px), uniform inputs.
6. **Typography (Typo):** UI font scale (40/28/20/14/12/11), Space Grotesk / JetBrains Mono tabular figures.
7. **Data-Visualisation Quality (DV):** Chart palette, tooltip design, bar textures, health gradients.
8. **Empty / Loading / Error States (ELE):** Designed empty cards, skeleton screens, actionable error guidance.
9. **Responsiveness (Resp):** 390px mobile drawer/stacking, zero horizontal overflow, thumb-friendly tap targets.
10. **Overall Perceived Quality (OPQ):** Polish, sophistication, enterprise credibility, executive feel.

---

## 2. Screen-by-Screen Audit Scores & Defect Catalog

### A. Authentication & Onboarding
| Screen | VH | DW | AS | CC | Comp | Typo | DV | ELE | Resp | OPQ | Avg |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Auth Page (`auth-page`)** | 3.5 | 3.0 | 3.5 | 2.5 | 3.0 | 3.0 | N/A | 3.0 | 3.5 | 2.8 | **3.08** |
| **Onboarding Modal (`state-modal-onboarding-tour`)** | 3.8 | 3.2 | 3.5 | 3.0 | 3.5 | 3.5 | 3.0 | 3.5 | 3.2 | 3.2 | **3.38** |

#### Concrete Defects (Scores < 4):
1. **Generic Grey Background in Dark Mode (`auth-page-dark-1440px.png`):**
   - *Defect:* Dark background renders as standard Tailwind slate `#0F172A` rather than Obsidian near-black `#050708`.
   - *Reference Gap:* Lacks the soft teal canvas radial glow from the top-right specified in the contract (`rgba(43,179,201,0.10)`).
2. **Auth Card Outline & Depth:**
   - *Defect:* Card uses heavy border instead of subtle 1px border (`rgba(255,255,255,0.06)`) with `inset 0 1px 0 rgba(255,255,255,0.04)` top highlight.
3. **Typography on Auth:**
   - *Defect:* Headers use default Inter sans rather than calibrated display scale (40/44 or 28/34); lacks micro-uppercase tracking (+0.08em) on form section labels.

---

### B. Candidate Portal Screens
| Screen | VH | DW | AS | CC | Comp | Typo | DV | ELE | Resp | OPQ | Avg |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard (`cand-dashboard`)** | 3.2 | 2.8 | 3.0 | 2.5 | 3.0 | 2.8 | 2.5 | 3.0 | 3.0 | 2.7 | **2.85** |
| **Explore Jobs (`cand-jobs`)** | 3.5 | 3.0 | 3.2 | 2.8 | 3.0 | 3.0 | N/A | 3.2 | 3.0 | 3.0 | **3.08** |
| **Career Hub & Evidence (`cand-candidate-experience`)** | 3.4 | 2.9 | 3.0 | 2.6 | 3.0 | 2.8 | 2.8 | 3.0 | 2.8 | 2.8 | **2.91** |
| **Recommendations (`cand-recommendations`)** | 3.2 | 3.0 | 3.0 | 2.7 | 3.0 | 3.0 | 2.5 | 3.0 | 3.0 | 2.9 | **2.93** |
| **Applications (`cand-applications`)** | 3.5 | 3.2 | 3.4 | 2.8 | 3.2 | 3.0 | N/A | 3.0 | 3.2 | 3.0 | **3.14** |
| **Interviews (`cand-interviews`)** | 3.2 | 3.0 | 3.0 | 2.7 | 3.0 | 3.0 | N/A | 3.0 | 3.0 | 2.9 | **2.98** |
| **Profile Builder (`cand-profile`)** | 3.0 | 2.5 | 2.8 | 2.5 | 2.8 | 2.8 | 2.0 | 2.8 | 2.8 | 2.6 | **2.66** |
| **Resume Manager (`cand-resume`)** | 3.2 | 3.0 | 3.0 | 2.6 | 3.0 | 2.9 | 2.2 | 3.0 | 3.0 | 2.9 | **2.88** |
| **ATS Resume Studio (`cand-resume-builder`)** | 3.4 | 2.8 | 3.0 | 2.7 | 3.0 | 3.0 | 3.0 | 2.8 | 2.8 | 2.9 | **2.94** |

#### Concrete Defects (Scores < 4):
1. **Candidate Dashboard Bento Grid & KPI Figures (`cand-dashboard-dark-1440px.png`):**
   - *Defect:* Metric numbers (e.g., Profile Score "90%", Active Applications "4") render in standard body sans font instead of Space Grotesk / JetBrains Mono tabular figures (`font-numeral`).
   - *Reference Gap:* FinGlow uses high-contrast tabular numerals with colored vertical indicator bars on the left of stat tiles.
2. **Missing Teal Feature Hero Card:**
   - *Defect:* Top summary banner uses dull grey background instead of the signature teal hero gradient card (`#1B8197` to `#176F83`) with white text and quick action pills.
3. **Timeline & Progress Indicators (`cand-applications-dark-1440px.png`):**
   - *Defect:* Status timeline uses simple rounded dots; lacks the signature hatched progress bar and health gradient (`#D98BE8` > `#5FD3E8` > `#7ED957` > `#F2C94C`).
4. **Mobile Stacking & Drawer (`cand-dashboard-dark-390px.png`):**
   - *Defect:* Multi-column stat cards compress horizontally on 390px instead of transitioning into a smooth 1-column scrollable stack with 16px gap.

---

### C. Recruiter Portal Screens
| Screen | VH | DW | AS | CC | Comp | Typo | DV | ELE | Resp | OPQ | Avg |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard (`rec-dashboard`)** | 3.4 | 3.0 | 3.2 | 2.6 | 3.0 | 3.0 | 2.6 | 3.0 | 3.0 | 2.9 | **2.97** |
| **Recruiter Workspace (`rec-recruiter-workspace`)** | 3.5 | 3.0 | 3.2 | 2.7 | 3.2 | 3.0 | 3.0 | 3.0 | 2.8 | 3.0 | **3.04** |
| **Job Postings (`rec-recruiter-jobs`)** | 3.4 | 3.2 | 3.2 | 2.8 | 3.2 | 3.0 | N/A | 3.2 | 3.2 | 3.1 | **3.14** |
| **Applicant Pipeline (`rec-applicants`)** | 3.2 | 2.8 | 3.0 | 2.6 | 3.0 | 2.8 | 2.8 | 2.8 | 2.5 | 2.8 | **2.83** |
| **Skill Ontology & KB (`rec-skills-ontology`)** | 3.0 | 2.6 | 2.8 | 2.5 | 2.8 | 2.8 | 2.4 | 2.8 | 2.6 | 2.7 | **2.70** |
| **Match Lab Simulator (`rec-match-lab`)** | 3.5 | 3.0 | 3.2 | 2.8 | 3.2 | 3.0 | 3.0 | 3.0 | 2.8 | 3.0 | **3.05** |
| **AI Candidate Search (`rec-recruiter-ai-search`)** | 3.4 | 3.0 | 3.2 | 2.7 | 3.0 | 3.0 | 2.8 | 3.0 | 3.0 | 3.0 | **3.01** |
| **Interviews (`rec-recruiter-interviews`)** | 3.2 | 3.0 | 3.0 | 2.6 | 3.0 | 3.0 | N/A | 3.0 | 3.0 | 2.9 | **2.97** |
| **Recruitment Analytics (`rec-recruiter-analytics`)** | 3.0 | 2.8 | 3.0 | 2.4 | 2.8 | 2.8 | 2.2 | 2.8 | 2.7 | 2.7 | **2.72** |
| **Company Profile (`rec-company-profile`)** | 3.2 | 3.0 | 3.2 | 2.8 | 3.0 | 3.0 | N/A | 3.0 | 3.0 | 3.0 | **3.02** |
| **Platform & API Hub (`rec-platform-integrations`)**| 3.4 | 3.2 | 3.4 | 2.8 | 3.2 | 3.2 | 3.0 | 3.0 | 3.0 | 3.1 | **3.21** |
| **ML Benchmark (`rec-public-benchmark`)** | 3.6 | 3.4 | 3.5 | 3.0 | 3.4 | 3.4 | 3.2 | 3.2 | 3.2 | 3.3 | **3.38** |

#### Concrete Defects (Scores < 4):
1. **Applicant Leaderboard Table (`rec-applicants-dark-1440px.png`):**
   - *Defect:* Table rows blend into dark background without visual hierarchy. Lacks alternating subtle card surfaces (`#0C1113` vs `#111719`) and 1px hairline borders (`rgba(255,255,255,0.06)`).
   - *Defect:* Match scores (e.g. "94", "89") are shown as plain colored text instead of circular score rings or miniature arc gauges with tooltip explainers.
2. **Analytics Charts (`rec-recruiter-analytics-dark-1440px.png`):**
   - *Defect:* Time-series graphs use default chart colors rather than the signature category accents (pink `#D98BE8`, yellow `#F2C94C`, green `#7ED957`, aqua `#5FD3E8`, orange `#F29B4B`).
   - *Reference Gap:* Lacks the vertical-bar textured background with floating marker tooltip seen in the FinGlow financial reference.
3. **Light Mode Vestmark Contrast (`rec-recruiter-workspace-light-1440px.png`):**
   - *Defect:* Canvas uses blinding stark white (`#FFFFFF`) throughout, eliminating contrast between cards and background.
   - *Contract Remedy:* Set outer canvas to warm grey `#E9E9E5`, app surface to `#F4F4F1`, and cards to `#FFFFFF` with `#E7E7E2` hairline borders and subtle soft drop shadow (`0 8px 24px rgba(17,19,18,0.05)`).
4. **Primary Action Buttons:**
   - *Defect:* Buttons use purple/indigo gradients (`from-brand-600 to-indigo-500`) which the design contract explicitly forbids.
   - *Contract Remedy:* In light mode, primary buttons must be ink `#111312` with crisp white text; in dark mode, buttons must use brand teal `#1F8FA6` with hover `#2BB3C9` and glowing teal shadow.

---

### D. Administrator Portal Screens
| Screen | VH | DW | AS | CC | Comp | Typo | DV | ELE | Resp | OPQ | Avg |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin Dashboard (`admin-dashboard`)** | 3.4 | 3.0 | 3.2 | 2.6 | 3.0 | 3.0 | 2.5 | 3.0 | 3.0 | 2.9 | **2.96** |
| **Research Pipeline AI (`admin-research-pipeline`)** | 3.2 | 2.8 | 3.0 | 2.5 | 3.0 | 2.8 | 2.8 | 2.8 | 2.8 | 2.8 | **2.85** |
| **Skills Knowledge Base (`admin-skills-ontology`)** | 3.0 | 2.6 | 2.8 | 2.5 | 2.8 | 2.8 | 2.4 | 2.8 | 2.6 | 2.7 | **2.70** |

#### Concrete Defects (Scores < 4):
1. **User Accounts Management Table (`admin-dashboard-dark-1440px.png`):**
   - *Defect:* Role badges use muted slate pills (`bg-slate-700 text-slate-300`) with low contrast.
   - *Contract Remedy:* Replace with uppercase micro-pills (11px, `+0.08em` tracking) using semantic accents (Admin = Teal `#1F8FA6`, Recruiter = Aqua `#5FD3E8`, Candidate = Green `#7ED957`).
2. **Research Pipeline Logs & Telemetry:**
   - *Defect:* Log boxes use generic dark grey `#1E293B` without inner top highlights or monospace alignment.

---

### E. Key States Audit
| State | VH | DW | AS | CC | Comp | Typo | ELE | OPQ | Avg |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Empty Account Dashboard (`state-empty-account-dashboard`)** | 3.2 | 2.8 | 3.2 | 2.6 | 3.0 | 3.0 | 3.2 | 2.9 | **2.99** |
| **Empty Applications (`state-empty-account-applications`)** | 3.2 | 3.0 | 3.2 | 2.7 | 3.0 | 3.0 | 3.2 | 3.0 | **3.04** |
| **Command Palette Modal (`state-modal-command-palette`)** | 3.8 | 3.4 | 3.5 | 3.0 | 3.5 | 3.4 | N/A | 3.4 | **3.43** |
| **Authentication Error Banner (`state-error-auth-invalid`)** | 3.5 | 3.2 | 3.5 | 3.0 | 3.2 | 3.2 | 3.0 | 3.2 | **3.22** |
| **Mobile Drawer (`state-drawer-mobile-sidebar`)** | 3.4 | 3.0 | 3.2 | 2.7 | 3.2 | 3.0 | N/A | 3.0 | **3.07** |

#### Concrete Defects (Scores < 4):
1. **Empty State Presentation:**
   - *Defect:* Empty states show a small icon and plain text ("No applications yet").
   - *Contract Remedy:* Transform into purposeful onboarding modules: explain what the section is for, provide a single high-contrast primary call-to-action button, and display a subtle sample preview outline.
2. **Error Banner Styling:**
   - *Defect:* Authentication error uses default Tailwind red (`bg-red-500/10 text-red-400`).
   - *Contract Remedy:* Standardize on semantic danger `#F2677A` with specific error explanation and next-step remediation action.

---

## 3. Side-by-Side Reference Gap Analysis

| Design Dimension | Target Reference (FinGlow Dark / Vestmark Light) | Current Resumio Implementation | Actionable Gap to Close |
| :--- | :--- | :--- | :--- |
| **Dark Theme Canvas** | Near-black `#050708` with faint teal cast and radial glow | Greyish slate `#080B11` / `#0B0F19` | Switch background to `#050708` and add top-right teal radial glow |
| **Light Theme Canvas** | Warm grey outer canvas `#E9E9E5`, app surface `#F4F4F1` | Monolithic `#FFFFFF` or cool `#F8F9FA` | Separate outer canvas from card surfaces using `#E9E9E5` and `#F4F4F1` |
| **Card Radii & Padding** | `20px` card radius (`24px` hero cards), `20–24px` padding | Inconsistent `8px`, `14px`, `18px`, `p-4` (16px) | Standardize all cards to `rounded-card` (20px) and `p-6` (24px) |
| **Borders & Highlights** | 1px hairline border + inner top highlight `inset 0 1px 0 rgba(255,255,255,0.04)` | Thick `border-slate-700` or no top highlight | Add `.card-highlight` utility across all cards |
| **KPI Typographic Scale** | Space Grotesk / JetBrains Mono tabular numbers with left vertical accent bar | Default Inter body font with no tabular alignment | Wrap all big numbers in `.font-numeral` and add colored left accent bars |
| **Match Scores & Gauges** | Circular score rings, arc gauges, and gradient health bars with markers | Raw text percentages (e.g. "89%") or simple progress bars | Render SVG circular score rings with tooltip breakdowns |
| **Action Buttons** | Dark: Teal `#1F8FA6` with glow. Light: Ink `#111312` with white text | Purple / indigo gradients (`bg-brand-600`) | Remove all purple gradients; deploy ink & teal button tokens |
| **Status Tag Micro-Pills**| Uppercase micro 11px font with `+0.08em` tracking and fully round pill | Mixed 12px/14px sentence case badges | Convert all status tags to fully round uppercase micro-pills |
