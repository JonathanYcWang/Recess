# Recess UI Audit and Visual Principles

**Issue:** [#112](https://github.com/JonathanYcWang/Recess/issues/112)  
**Epic:** [#111 Approved design system and UI migration](https://github.com/JonathanYcWang/Recess/issues/111)  
**Status:** Implementation evidence recorded; §8–§12 are **provisional direction** (grilling 2026-06-25). Visual application is **frozen** until #230 (human re-confirm). Themes removed — single presentation (#229).  
**Source of truth:** Current code under `src/` as of this audit. This document does **not** inherit values from `DESIGN_SYSTEM.md` or prototype guidance.

---

## 1. Audit method

Evidence was gathered from:

- Router and page components (`src/App.tsx`, `src/pages/**`)
- Work rhythm state machine (`src/constants/constants.ts`, `src/views/**`, `src/components/WorkPage/**`)
- All 38 CSS modules under `src/`
- Token files (`src/styles/tokens.css`, `src/styles/globals.css`, `src/styles/breakpoints.module.css`)
- Dependency usage (`package.json`, import graph for `@mui/*`, `react-aria-components`)
- Settings persistence (`src/modules/persisted-application-state/settings/settingsDocument.ts`)
- Manual viewport review at **360×640**, **480×800**, and **≥768px** widths in Chromium extension popup and detached tab

Screenshots referenced below are captured during PR review at those viewports (single presentation).

---

## 2. Surface inventory

### 2.1 Routes

| Route | Component | File |
|-------|-----------|------|
| `/` | `HomePage` | `src/pages/HomePage/HomePage.tsx` |
| `/onboarding` | `OnboardingPage` | `src/pages/OnboardingPage/OnboardingPage.tsx` |
| `/quiz` | `PersonalizationQuizPage` | `src/pages/PersonalizationQuizPage/PersonalizationQuizPage.tsx` |
| `/personalization-quiz` | Redirect → `/quiz` | `src/App.tsx` |

**Orphan (not routed):** `QuizPage` at `src/pages/QuizPage/QuizPage.tsx` — legacy MBTI quiz; not reachable in production navigation.

### 2.2 HomePage sections (local state, not routes)

`mainContent: 'focus' | 'schedule' | 'blocked' | 'insights'`:

| Section | Label | Content |
|---------|-------|---------|
| `focus` | Focus | `WorkPage` |
| `schedule` | Schedule | `WorkHoursSettings` |
| `blocked` | Blocked Sites | `BlockedSites` |
| `insights` | Insights | `InsightsSection` → `InsightsPage` |

**Always visible on HomePage:** header placeholder, `InfoWidget`, `FocusPet`, desktop sidebar nav (≥768px).

### 2.3 Work rhythm views (session state machine)

| State constant | View | File |
|----------------|------|------|
| `BEFORE_WORK_SESSION` | `BeforeWorkSessionView` | `src/views/BeforeWorkSessionView/` |
| `ONGOING_FOCUS_SESSION` | `OngoingFocusSessionView` | `src/views/OngoingFocusSessionView/` |
| `REWARD_SELECTION` | `RewardSelectionView` | `src/views/RewardSelectionView/` |
| `ONGOING_BREAK_SESSION` | `OngoingBreakSessionView` | `src/views/OngoingBreakSessionView/` |
| `FOCUS_SESSION_COUNTDOWN` | `FocusSessionCountdownView` | `src/views/FocusSessionCountdownView/` |
| `WORK_SESSION_COMPLETE` | `WorkSessionCompleteView` | `src/views/WorkSessionCompleteView/` |

**Co-mounted in Focus tab:** `TaskList`, `FocusTaskSelection` (focus-block phase), `WorkRhythmProjectionView` (phase label, Hall Pass confirm/revoke).

### 2.4 Onboarding and quiz

| Flow | Steps / modes | File |
|------|---------------|------|
| Required onboarding | energy → cadence → friction → summary (4 steps) | `src/pages/OnboardingPage/` |
| Personalization Quiz | loading → active quiz → completed outcome | `src/pages/PersonalizationQuizPage/` |

### 2.5 Dialogs and overlays

| Surface | Implementation | Trigger |
|---------|----------------|---------|
| `EnergyCheckDialog` | MUI `Dialog` | `FocusSessionCountdownView` (on mount) |
| `DurationInputDialog` | Custom fixed overlay + MUI `Slider` | `BeforeWorkSessionView` |
| Schedule add/edit | MUI `Dialog` wrapping `EditTimeRangeOverlay` | `WorkHoursSettings` |
| Pause confirm | Custom `role="dialog"` `aria-modal="true"` | `OngoingFocusSessionView` |
| Hall Pass prompts | Inline sections (not modal) | `WorkRhythmProjectionView` during time-out |

### 2.6 Game surfaces

| Game | Status | File |
|------|--------|------|
| Card carousel (reward selection) | **Active** in `REWARD_SELECTION` | `src/components/CardCarousel/` |
| Prize wheel | **Built, not mounted** (commented out in `HomePage`) | `src/components/PrizeWheel/` |
| Slots | **Built, not mounted** (commented out in `HomePage`) | `src/components/Slots/` |
| `ParticleBurst` | Active with PrizeWheel only | `src/components/ParticleBurst/` |
| `RefreshButton` (card reroll) | Active in CardCarousel | `src/components/RefreshButton/` |

### 2.7 Supporting components (37 total under `src/components/`)

Key persistent surfaces: `TaskList`, `TaskPlanner`, `FocusTaskSelection`, `FocusTimer`, `PausedTimer`, `BlockedSites`, `InsightsPage`, `WorkHoursSettings`, `WorkWindow`, `FocusPet`, `InfoWidget`, `Button`, `Toggle`, `Icon`, `TimeField`, `RewardLink`.

---

## 3. Compact vs full-tab inventory

### 3.1 Compact extension popup (360×640 – 480×800)

| Surface | Compact behavior | Issues found |
|---------|------------------|--------------|
| HomePage shell | Single column; sidebar hidden below 768px | **Mobile nav commented out** — Schedule, Blocked Sites, and Insights unreachable below 768px |
| `globals.css` popup rule | `max-width: 600px` forces `html` to 550px width, 600–800px height | Fixed 550px assumption conflicts with 360px minimum in issue #117 |
| Work views | Most panels `max-width: 500px` | Usable but tight at 360px |
| CardCarousel | Tighter gap at `max-width: 640px` | OK |
| InsightsPage | Card grid stacks | OK |
| Onboarding / Quiz | Long content scrolls | OK |
| PrizeWheel / Slots | Responsive rules at 480px / 30rem | Not user-visible (dormant) |

### 3.2 Full browser tab (≥768px)

| Surface | Full-tab behavior | Issues found |
|---------|-------------------|--------------|
| HomePage | 12-column grid at ≥1024px; sidebar nav visible | OK |
| InfoWidget + FocusPet | Right column (4/12) | OK |
| Work rhythm views | Centered panels, readable width | OK |
| Insights | Multi-column card grid | OK |

---

## 4. Token vocabulary audit

### 4.1 Canonical token source

`src/styles/tokens.css` defines:

- Typography: `--font-family-primary` (Patrick Hand), `--font-family-secondary` (BenchNine), size scale `--font-size-xs` … `--font-size-5xl`, line heights, weights
- Spacing: `--spacing-0` … `--spacing-16` on a 4px grid (gaps at 7, 9, 11, 13, 14, 15 removed vs legacy)
- Palette: literal names (`--color-green`, `--color-black`, gray scale)
- Semantic: `--color-primary`, `--color-text-*`, `--color-background-*`, `--color-border-*`, fatigue status colors

### 4.2 Competing vocabulary (must consolidate in #113)

| Source | Problem |
|--------|---------|
| `src/styles/globals.css` HSL layer | Parallel shadcn-style tokens (`--background`, `--foreground`, `--ring`, `--primary` as HSL components) used mainly by `TimeField` |
| Undefined aliases in CSS modules | `--font-bench-nine`, `--font-patrick`, `--text-size-14` referenced but not defined in `tokens.css` |
| Raw literals | `rgba(27, 27, 27, …)` shadows in HomePage, OngoingFocusSessionView, CardCarousel, DurationInputDialog, FocusPet; `#b3261e` error color in InsightsPage; hex colors in `useParticles.ts` |
| Inline MUI `sx` | EnergyCheckDialog, WorkHoursSettings, DurationInputDialog bypass token system |
| Fallback in CSS | `var(--color-accent, #2563eb)` in WorkRhythmProjectionView — accent token undefined |

### 4.3 Repeated values worth semantic tokens

| Pattern | Occurrences | Proposed semantic role |
|---------|-------------|------------------------|
| `#1b1b1b` / `rgba(27,27,27,…)` | shadows, ink | `--ink-primary` / `--shadow-elevation-*` |
| `#37eb4f` green | legacy `--color-primary` usages | **Retire** — replace with `--ink-primary` for selection (§8.1) |
| `#d32f2f` / `#e24b4a` | destructive, exhausted | `--fill-destructive` |
| `#f9eadf` / `#d85a30` | legacy fatigue widget | **Retire** — gray fatigue tiers (§8.4) |
| `0.5rem` radius | globals `--radius` | `--radius-control` |
| 4px spacing grid | tokens.css | Keep as core spacing |

---

## 5. Interaction dependency audit

### 5.1 MUI / Emotion (3 files)

| File | Import |
|------|--------|
| `EnergyCheckDialog.tsx` | `Dialog` from `@mui/material` |
| `WorkHoursSettings.tsx` | `Dialog` from `@mui/material` |
| `DurationInputDialog.tsx` | `Slider` from `@mui/material/Slider` |

Emotion is transitive via MUI (`@emotion/react`, `@emotion/styled` in `package.json`). No direct Emotion imports in `src/`.

### 5.2 React Aria (1 file)

| File | Import |
|------|--------|
| `TimeField.tsx` | `DateInput`, `DateSegment`, `TimeField` from `react-aria-components` |

Used in `EditTimeRangeOverlay` for schedule time picking. Focus ring via `[data-focus-within]` + `hsl(var(--ring))`.

### 5.3 Native / custom

| Pattern | Usage |
|---------|-------|
| Native `<button>`, `<input>`, `<select>` | TaskList, BlockedSites, InsightsPage, OnboardingPage, forms |
| `div` + `role="button"` via `pressable.ts` | CardCarousel cards, Toggle, Icon, RewardLink |
| Custom dialog markup | DurationInputDialog overlay, OngoingFocusSessionView pause confirm |

---

## 6. Presentation

Recess uses **one presentation** — current light appearance, single `:root` token set. Light/Dark/System theme preference is **removed** ([#229](https://github.com/JonathanYcWang/Recess/issues/229)): no `themePreference` in settings, no `data-theme`, no `prefers-color-scheme` rules.

---

## 7. Accessibility findings (WCAG-relevant)

### 7.1 Focus

| Finding | Severity | Files |
|---------|----------|-------|
| `Button` has hover only, no `:focus-visible` ring | High | `Button.module.css` |
| `Toggle` is `div[role="button"]` without visible focus | High | `Toggle.tsx`, `Toggle.module.css` |
| Inputs use `outline: none` without replacement ring | Medium | `TaskList.module.css`, `BlockedSites.module.css` |
| Good `:focus-visible` on game buttons | OK | `PrizeWheel.module.css`, `Slots.module.css` |
| React Aria focus-within ring | OK | `TimeField.module.css` |

### 7.2 Keyboard and semantics

| Finding | Severity | Files |
|---------|----------|-------|
| `pressable.ts` adds Enter/Space to div buttons | Partial mitigation | `src/utils/pressable.ts` |
| MUI Dialog focus trap | OK where used | EnergyCheckDialog, WorkHoursSettings |
| Custom DurationInputDialog lacks `role="dialog"` / focus trap | High | `DurationInputDialog.tsx` |
| Mobile nav missing — sections unreachable by keyboard on compact | High | `HomePage.tsx` (commented mobile nav) |
| Insights error color `#b3261e` — verify contrast on white | Medium | `InsightsPage.module.css` |

### 7.3 Motion

| Module | `prefers-reduced-motion` guard |
|--------|-------------------------------|
| FocusPet, PausedTimer, PrizeWheel, Slots, InsightsPage, OngoingFocusSessionView (giftTilt) | Yes |
| HomePage (fadeUp, slideIn), OngoingFocusSessionView (dialogEnter), FocusTimer, CardCarousel, EnergyCheckDialog, ParticleBurst / useParticles | **No** |

### 7.4 Color-only information

| Surface | Risk |
|---------|------|
| Task status / Focus vs Active Task | Partial — text labels exist but emphasis is color-heavy |
| Timer overdue pulse (orange/red glow) | Glow is decorative; numeric time remains visible |
| Insights cards | Textual values present; charts are text/table based |

---

## 8. Provisional visual direction

> Recorded 2026-06-25 via grilling session. **Not applied in code** — visual application frozen until #230. Supersedes draft pale-blue / green proposals in the first audit revision. **No accent color** in the provisional system.

### 8.1 Brand character

| Principle | Approved decision |
|-----------|-------------------|
| Tone | Minimal, warm, playful, grown-up |
| Identity | Black ink on white grounds; handwritten **headings only** (§9) |
| Accent color | **None** — no pale blue, no third brand hue |
| Primary actions | **Black fill + white label** (buttons); not `--color-primary` |
| Secondary actions | **White fill + black label** |
| Selection / active | **Black ink** (nav indicator, selected borders) |
| Focus | **Black ink ring** — 2px solid + 2px offset on `:focus-visible` |
| Links | **Ink + underline**; slightly muted ink on hover; no visited styling |
| Destructive | Red family (`#d32f2f`, `#e24b4a`) for errors and destructive actions |
| Green `#37eb4f` | **Retire after migration** — transitional alias only, then remove |
| Warning orange | **Removed** — no fatigue orange palette |

### 8.2 Palette (single presentation)

| Token role | Value | Notes |
|------------|-------|-------|
| Surface primary | `#ffffff` | `--core-paper` |
| Surface secondary | `#f5f5f4` | `--core-gray-50` |
| Ink primary | `#1b1b1b` | `--core-ink` |
| Ink muted | `#4b5563` | `--core-gray-600` |
| Border default | `#e7e5e4` | `--core-gray-200` |
| Border strong | `#929292` | `--core-gray-400` |
| Action primary fill | `#1b1b1b` | Primary buttons |
| Ink on action primary | `#ffffff` | Primary button labels |
| Action secondary fill | `#ffffff` | Secondary buttons |
| Destructive | `#d32f2f` | Errors, destructive controls |
| Focus ring | `#1b1b1b` | Single presentation |

### 8.3 Fatigue and status (no orange)

| State | Approved treatment |
|-------|-------------------|
| Fatigued | Gray surface + text label (not color-only) |
| Exhausted / worst | Darker gray / ink + text label |
| Overdue timer | Black ink emphasis — no orange/red decorative glow |

### 8.4 Canonical token names

Single-source knobs and semantic aliases for propagation:

```text
--core-ink / --core-paper
--fill-action-primary / --ink-on-action-primary
--fill-action-secondary / --ink-on-action-secondary
--ink-primary / --ink-muted
--surface-primary / --surface-secondary
--border-default / --border-strong
--fill-destructive
--focus-ring
--font-family-heading / --font-family-body
```

**Retire after migration:** `--color-primary`, `--color-green`, `--color-orange-*`, `--color-status-fatigued-*`, pale-blue accent tokens from draft #113 implementation.

**Note:** #113 adds semantic **aliases** to current values (zero visual delta). #225 applies provisional palette values after #230 re-confirm.

---

## 9. Provisional typography

### 9.1 Current implementation (audit evidence)

| Role | Current font | Migration |
|------|--------------|-----------|
| `body` | Patrick Hand on entire `body` | Move to `--font-family-body` (system sans) |
| Headings | Patrick Hand / BenchNine via undefined aliases | `--font-family-heading` only on `h1`–`h6` |
| Loading | Google Fonts in `index.html` | Remove network fetch |

### 9.2 Approved stacks

| Role | Stack |
|------|-------|
| Heading | `'Patrick Hand', 'Segoe Print', 'Bradley Hand', cursive` |
| Body / control / timer / data | `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` |
| Monospace (diagnostics) | `ui-monospace, 'SF Mono', Menlo, Consolas, monospace` |

**Font loading:** System fonts only — no bundled `woff2`, no Google Fonts.

---

## 10. Approved cross-cutting principles

### 10.1 Motion

- Reward/game animations: static outcome immediately under `prefers-reduced-motion: reduce`.
- Decorative motion (HomePage entrance, pet float, dialog enter): **off** under reduced motion.
- Timer SVG progress: **may animate**; numeric time always visible and authoritative.
- Particles / confetti: **disabled** under reduced motion.
- Animation never determines selection outcome or domain timing.

### 10.2 Responsive

- Compact extension: **360×640** through **480×800** — **drop** the 550px forced `html` width in `globals.css`.
- Compact navigation: **reachability** restored below 768px (#117) — bottom tab bar **design** deferred until #230
- Full tab: **≥768px** with **left sidebar** (existing desktop pattern).
- Readable max-width for prose/data: ~`40rem` where applicable.
- Extension popup + detached tab only — no standalone mobile-web product.

### 10.3 Focus

- `:focus-visible`: `--focus-ring`, 2px solid, 2px offset (ink).
- Dialogs trap focus and restore on close (native or React Aria).
- Skip link to main content in full-tab shell (#117).

### 10.4 Contrast and states

- WCAG 2.2 AA: normal text ≥ 4.5:1; large text ≥ 3:1; non-text UI ≥ 3:1.
- Error, disabled, loading, empty: text + icon/shape — not color alone.
- Disabled: reduced opacity + `disabled` / `aria-disabled` + non-interactive cursor.

### 10.5 Data density

- Timers and numeric data: body sans at `--font-size-md` minimum.
- Insights: textual/table encoding primary; charts require table equivalent.

---

## 11. Approved primitive inventory (#115)

Full first slice — no speculative additions:

| Category | Primitives |
|----------|------------|
| Action | Button (primary black / secondary white / destructive / ghost) |
| Link | Ink + underline + focus ring |
| Text input | Text field, textarea |
| Select / switch | Single select, switch |
| Dialog | Modal with focus trap and restore |
| Navigation | Tab list — bottom bar (compact) + sidebar (full-tab) |
| Status | Alert, live region (badge text folded into status) |
| Surface | Card, panel |
| Slider | Duration slider (replaces MUI) |

---

## 12. Provisional direction checklist

- [x] **H1.** Minimal warm/playful/grown-up direction (§8.1).
- [x] **H2.** Black/white identity; handwritten limited to headings (§8.1, §9).
- [x] **H3.** **No accent color**; primary actions are black/white buttons; green retired after migration (§8.1).
- [x] **H4.** Focus rings use ink — not blue (§8.1, §8.2).
- [x] **H5.** Single-presentation palette recorded (§8.2).
- [ ] **H6.** ~~Dark palette~~ — **withdrawn**; themes removed (#229).
- [x] **H7.** Heading cursive stack + body system sans (§9.2) — provisional, not applied.
- [x] **H8.** System fonts only — no bundle, no Google Fonts (§9.2) — provisional, not applied.
- [x] **H9.** Motion, responsive, focus, contrast, data-density (§10).
- [x] **H10.** Full primitive inventory (§11).

**Recorded:** Jon (grilling session 2026-06-25)  
**Visual application:** Blocked until #230 re-confirm

---

## 13. Downstream issue map

| Issue | Depends on this audit | Note |
|-------|----------------------|------|
| #229 Remove theme preference | §6 | Single presentation; unblocks #113 |
| #113 Semantic alias tokens | §4, §8, §9 | Aliases to **current** values; zero visual delta |
| #114 Playwright + axe | §2 surface list, §3 viewports | Viewport matrix only (no theme dimension) |
| #115 Primitives | §11 inventory | Pixel-parity with current UI |
| #116 Remove MUI | §5.1 | After #115; pixel-parity |
| #117 App shells | §3, §10.2 | Functional fixes; nav reachability, not tab-bar redesign |
| #118–#126 Feature migrations | §2 full inventory | Structural migration; pixel parity |
| #230 Visual re-confirm | §8–§12 | Human gate before palette application |
| #225 Apply palette | §8 | After #230; visible changes |
| #127 Visual baselines | §3 viewports | Single presentation |
| #128 Documentation | This document | Phase 1 unblocked; Phase 2 after #127 |

---

## 14. Deliberate exclusions

- Root `DESIGN_SYSTEM.md` is retired; see `docs/design-system/README.md` (#128).
- Dormant PrizeWheel/Slots/HomePage demo code is inventoried but not prioritized for migration ahead of active session flow.
- `QuizPage` orphan is noted; migration decision deferred to #118.
