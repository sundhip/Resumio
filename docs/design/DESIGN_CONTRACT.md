# RESUMIO DESIGN CONTRACT

TWO THEMES, ONE BRAND. Brand accent is teal. Dark theme = "Obsidian" (inspired by the FinGlow reference). Light theme = "Paper" (inspired by the Vestmark reference). System mode follows the OS.

---

## DARK - OBSIDIAN (must read as BLACKISH, not grey, not navy, not slate)
- **canvas:** `#050708` (near-black with a faint teal cast; the page behind everything)
- **canvas glow:** `radial-gradient teal rgba(43,179,201,0.10) from the top-right, fading to transparent by 60%`
- **sidebar/shell:** `#080B0C`
- **card:** `#0C1113`
- **card raised:** `#111719`
- **border:** `rgba(255,255,255,0.06)`; strong `rgba(255,255,255,0.10)`
- **card highlight:** `inset 0 1px 0 rgba(255,255,255,0.04)`
- **text:** `#F2F6F7` / secondary `#9AA7AB` / tertiary `#5F6C70`
- **accent:** `#1F8FA6` (fills, active nav), hover `#2BB3C9`, glow `rgba(43,179,201,0.35)`
- **feature card gradient:** `#1B8197` to `#176F83` (the teal hero card)
- **category accents:** pink `#D98BE8`, yellow `#F2C94C`, green `#7ED957`, aqua `#5FD3E8`, orange `#F29B4B` (used sparingly: thin bars, dots, chips, charts)
- **health gradient:** `#D98BE8` > `#5FD3E8` > `#7ED957` > `#F2C94C`
- **semantic:** success `#4ADE80`, warning `#F5B544`, danger `#F2677A`, info `#5FD3E8`
- **NEVER use:** Tailwind slate/gray/zinc/neutral defaults, navy backgrounds, purple-blue AI gradients, flat `#000` with no depth.

---

## LIGHT - PAPER (calm, airy, premium)
- **outer canvas:** `#E9E9E5` (warm grey)
- **app surface:** `#F4F4F1`
- **card:** `#FFFFFF`
- **muted card:** `#F6F6F3`
- **border:** `#E7E7E2` hairline; no heavy outlines
- **text:** `#111312` / secondary `#5E6460` / tertiary `#8C928E`
- **primary button:** ink `#111312` with white text; secondary = white with hairline border
- **accent:** `#1F8FA6` (same brand teal)
- **delta pill:** green bg `#E3F5EA` / text `#15803D`; info chip bg `#E6EEFF` / text `#2F5BEA`
- **shadow:** `0 1px 2px rgba(17,19,18,0.04), 0 8px 24px rgba(17,19,18,0.05)`

---

## TYPE
- **UI font:** Geist or Inter (self-hosted, font-display swap, no layout shift).
- **FIGURE font for big numbers and scores:** Space Grotesk or JetBrains Mono, `tabular-nums`.
- **Scale:** display `40/44`, h1 `28/34`, h2 `20/28`, body `14/22`, caption `12/16`, micro `11` uppercase `+0.08em` tracking for section labels (like NAVIGATION / ACCOUNT in the dark reference).

---

## SHAPE AND SPACE
- **Card radius:** `20` (hero cards `24`), controls `12`, pills fully round.
- **Card padding:** `20-24`, grid gap `16`.
- **12-column bento grid:** max content width `1440`, sidebar `248` expanded / `72` collapsed.
- **Icons:** Lucide, stroke `1.75`, `18-20px`. NO emoji as UI icons anywhere.

---

## DEPTH
- **Dark:** Depth from 1px borders, inner top highlight, and one soft teal glow behind hero areas. No heavy drop shadows.
- **Light:** Hairline borders plus the soft shadow above.

---

## SIGNATURE ELEMENTS (both themes)
- Gradient health bar with a marker
- Stat tiles with a coloured vertical accent bar
- Hatched progress bar
- Pill chips (uppercase micro for status tags)
- Circular score ring
- Arc gauge
- Area chart over a vertical-bar texture with a marker tooltip
- Mini month calendar with coloured day dots
- Avatar stack
- Sparklines in stat cards

---

## CONTENT RULES
- **Every screen:** A clear title, a one-line purpose subtitle, real specific microcopy, zero lorem ipsum.
- **Sentence-case labels.**
- **Numbers have units.**
- **Every score has a tooltip explaining it.**
- **Empty states:** Say what the screen is for and offer one clear action.
- **Errors:** Say what happened, why, and what to do next.
