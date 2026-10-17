# Resumio Design System & UI Architecture

Welcome to the Resumio Design System documentation. This guide is written for engineers, designers, and contributors to understand the UI architecture, token contract, signature components, accessibility requirements, and visual testing workflows that govern the Resumio platform.

---

## 1. Principles & Design Contract

Resumio's visual system is built on a dual-theme, high-precision aesthetic engineered for high-density information display and instant comprehension:

1. **Obsidian (Dark Theme)**: Inspired by the FinGlow financial dashboard design. Dark surfaces must read as **blackish/charcoal** (`#050708` canvas, `#0C1113` cards, `#111719` raised), **never navy, slate, or murky grey**. Subtle teal radial illumination (`rgba(43,179,201,0.10)`) is reserved exclusively for hero section backdrops.
2. **Paper (Light Theme)**: Inspired by the Vestmark institutional aesthetic. Warm, airy paper tones (`#E9E9E5` outer canvas, `#F4F4F1` app surface, `#FFFFFF` crisp cards) paired with ink-black primary buttons (`#111312`), hairline borders (`#E7E7E2`), and soft ambient shadows.
3. **Brand Accent**: Cohesive cyan-teal (`#1F8FA6`, hover `#2BB3C9`, glow `rgba(43,179,201,0.35)`) provides visual continuity across both light and dark themes.
4. **Information Density & The 12-Column Bento Grid**: Clean layouts with 20px card border radii (24px for hero banners), consistent 16–24px spacing grids, 44px minimum interactive touch targets, and responsive sidebar shells (248px expanded, 72px collapsed).

For the definitive color palette, see [`docs/design/DESIGN_CONTRACT.md`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/docs/design/DESIGN_CONTRACT.md).

---

## 2. Token Architecture & Enforcement

To maintain strict visual integrity, Resumio prohibits standard generic Tailwind color utilities (such as `bg-slate-*`, `bg-zinc-*`, `bg-gray-*`, `bg-neutral-*`) in application code.

### 2.1 CSS Variables & Semantic Colors
All surfaces, borders, text, and brand colors resolve via CSS custom variables defined in `src/index.css`:

```css
/* Dark Mode Tokens (Obsidian) */
:root[data-theme='dark'] {
  --color-canvas: #050708;
  --color-shell: #080B0C;
  --color-card: #0C1113;
  --color-card-raised: #111719;
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-strong: rgba(255, 255, 255, 0.10);
  --color-text-primary: #F2F6F7;
  --color-text-secondary: #9AA7AB;
  --color-text-tertiary: #5F6C70;
  --color-brand-teal: #1F8FA6;
  --color-brand-teal-glow: rgba(43, 179, 201, 0.35);
}

/* Light Mode Tokens (Paper) */
:root[data-theme='light'] {
  --color-canvas: #E9E9E5;
  --color-shell: #F4F4F1;
  --color-card: #FFFFFF;
  --color-card-raised: #F6F6F3;
  --color-border: #E7E7E2;
  --color-border-strong: #D5D5CF;
  --color-text-primary: #111312;
  --color-text-secondary: #5E6460;
  --color-text-tertiary: #8C928E;
  --color-brand-teal: #1F8FA6;
  --color-brand-teal-glow: rgba(31, 143, 166, 0.20);
}
```

### 2.2 Automated Token Compliance Validator
Any PR or commit containing forbidden color classes is rejected by the pre-commit and CI token linter:

```bash
# Run the token compliance scanner
npm run check:tokens
```
*Current status: 0 forbidden token violations across the entire codebase.*

---

## 3. Typography Rules

Resumio typography enforces clear visual hierarchy and tabular alignment for metrics:

1. **Body and Interface Font**: `Geist` or `Inter`, self-hosted with `font-display: swap` to prevent layout shift (CLS = 0.00).
2. **Numeric and Score Font**: `Space Grotesk` or `JetBrains Mono` with `font-variant-numeric: tabular-nums` to guarantee steady tabular alignment in leaderboards, score rings, and currency metrics.
3. **Type Scale**:
   - Display: `text-4xl font-extrabold tracking-tight` (40px/44px)
   - Title / H1: `text-2xl font-bold tracking-tight` (28px/34px)
   - Section / H2: `text-lg font-semibold` (20px/28px)
   - Body: `text-sm font-normal leading-relaxed` (14px/22px)
   - Caption: `text-xs font-medium` (12px/16px)
   - Micro: `text-[11px] font-semibold uppercase tracking-wider` (used for section eyebrows and status chips).

---

## 4. Component Kit Architecture (`src/components/ui/`)

Resumio includes an audited library of signature components engineered specifically for talent intelligence:

| Component | File | Description & Behavior |
| :--- | :--- | :--- |
| `StatTile` | [`StatTile.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/StatTile.tsx) | Bento KPI tile featuring colored vertical accent bars, micro eyebrows, tabular values, delta badges, and sparkline graphics. |
| `ScoreRing` | [`ScoreRing.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/ScoreRing.tsx) | Circular SVG progress ring with animated stroke-dashoffset draw-in and central tabular score. |
| `Gauge` | [`Gauge.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/Gauge.tsx) | Semi-circular arc gauge indicating candidate match tiers (Poor / Moderate / Strong / Exceptional). |
| `GradientHealthBar` | [`GradientHealthBar.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/GradientHealthBar.tsx) | Multi-stop category gradient bar (`#D98BE8` -> `#5FD3E8` -> `#7ED957` -> `#F2C94C`) with an animated glide marker. |
| `HatchedProgress` | [`HatchedProgress.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/HatchedProgress.tsx) | Striped industrial progress indicator showing pipeline capacity and quota utilization. |
| `Badge` | [`Badge.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/Badge.tsx) | Status and tag pill chip with semantic tokens (teal, green, amber, red, purple, neutral). |
| `DataTable` | [`DataTable.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/DataTable.tsx) | High-performance virtualized table supporting sort, search, batch selection, mobile card fallback, and keyboard navigation. |
| `Modal` | [`Modal.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/Modal.tsx) | Accessible dialog with backdrop blur, focus trap, Escape key handling, and focus return. |
| `CommandPalette` | [`CommandPalette.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/CommandPalette.tsx) | Global spotlight navigation invoked via `Ctrl+K` / `Cmd+K`. |
| `Toast` / `ToastContainer` | [`Toast.tsx`](file:///C:/Users/sundhip/.gemini/antigravity/scratch/Resumio/src/components/ui/Toast.tsx) | Non-blocking status notifications featuring an undo grace timer for destructive actions. |

---

## 5. Motion System Guidelines

All animations follow strict performance rules to ensure zero interaction lag:

1. **Durations**:
   - Micro-interactions (hover, button clicks): `120ms`–`150ms`.
   - Card entry & list stagger: `200ms`–`250ms`.
   - Modals and drawers: `250ms`–`300ms`.
   - **Hard Rule**: No routine interface animation exceeds `300ms`.
2. **GPU Acceleration**:
   - Only animate `transform` and `opacity`. Never animate `width`, `height`, `left`, `top`, or `margin` to prevent costly reflows.
3. **Easing Curves**:
   - Ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) for entrances.
   - Ease-in (`cubic-bezier(0.7, 0, 0.84, 0)`) for exits.
4. **Reduced Motion**:
   - All animations respect `@media (prefers-reduced-motion: reduce)` by immediately rendering the completed state with zero transitions.

---

## 6. Accessibility & Keyboard Navigation (WCAG 2.2 AA)

Resumio complies with WCAG 2.2 AA standards across every production view:

- **Contrast Ratios**: Body text achieves $\ge 7:1$, secondary text $\ge 4.5:1$, and large graphical controls $\ge 3:1$ against their respective backgrounds in both Dark and Light themes.
- **Global Keyboard Shortcuts**:
  - `?`: Opens the Keyboard Shortcuts Reference dialog.
  - `Ctrl+K` / `Cmd+K`: Toggles the global Command Palette.
  - `J` / `K`: Navigates down/up through candidate pipeline records.
  - `S`: Shortlists the currently selected candidate.
  - `C`: Adds/removes the selected candidate to the Compare Drawer.
  - `R`: Opens the Rejection Confirmation Modal with undo protection.
  - `/`: Focuses the primary search input on searchable views.
  - `Escape`: Closes any open modal, drawer, or search overlay.
- **Screen Reader Support**: Async screening and filtering operations trigger updates via polite ARIA live regions (`role="status" aria-live="polite"`).

---

## 7. Visual Regression Testing & CI Workflow

To prevent unintended layout drifts or theme regressions, Resumio includes a Playwright-based visual regression test suite:

### 7.1 Running Visual Tests Locally
```bash
# Run visual regression suite against golden baselines (48 snapshots)
npm run test:visual

# Re-capture and update golden baseline snapshots (when design updates are approved)
npm run test:visual:update
```

### 7.2 Coverage Matrix
The visual regression test suite captures 48 distinct snapshots:
- **11 Main Screens**: Landing Page, Auth Split, Candidate Dashboard, Recruiter Dashboard, Jobs List, Applicant Pipeline, Resume Split Inspector, Career Skills Hub, ML Benchmark, Settings & Security, and Match Lab Simulator.
- **Themes**: Dark (Obsidian) and Light (Paper).
- **Viewports**: Desktop (1440×900) and Mobile (390×844).
- **Key Interactive States**: Global Command Palette, Mobile Navigation Drawer, Rejection Confirmation Modal, and Keyboard Shortcuts Sheet.

### 7.3 CI Integration
Visual regression is executed on every GitHub Pull Request via `.github/workflows/ci.yml`. When deliberate UI enhancements are introduced, maintainers can trigger the `.github/workflows/visual-regression-review.yml` workflow dispatch to re-capture and commit updated golden snapshots directly into the repository.
