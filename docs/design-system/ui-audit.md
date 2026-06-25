# Recess UI Audit and Visual Principles

**Issue:** [#112](https://github.com/JonathanYcWang/Recess/issues/112)  
**Epic:** [#111 Approved design system and UI migration](https://github.com/JonathanYcWang/Recess/issues/111)  
**Status:** Implementation evidence recorded; human approval sections marked below.  
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

Screenshots referenced below are captured during PR review at those viewports in Light mode (Dark mode CSS is not yet implemented; see §6).

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
| `#1b1b1b` / `rgba(27,27,27,…)` | shadows, ink | `--color-ink` / `--elevation-shadow` |
| `#37eb4f` green | primary CTA, timer stroke | `--color-primary-fill` (see §8 palette decision) |
| `#d32f2f` / `#e24b4a` | destructive, exhausted | `--color-destructive` |
| `#f9eadf` / `#d85a30` | fatigue widget | `--color-warning-surface` / `--color-warning-ink` |
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

## 6. Theme and settings

| Layer | Current state |
|-------|---------------|
| Persistence | `themePreference: 'system' \| 'light' \| 'dark'` in settings document; default `'system'` |
| Redux / commands | Read/write pipeline exists |
| UI | **No Settings page** exposes theme control; `useSettings` hook exists but is unused |
| CSS | **Light only** — single `:root` block in `tokens.css` and `globals.css`; no `prefers-color-scheme` rules, no `[data-theme]` attribute |

**Gap:** Theme preference is backend-ready but disconnected from presentation (#113 scope).

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

## 8. Proposed visual direction — **pending human approval**

> These proposals are derived from current implementation patterns and epic intent. They replace the ad-hoc mix documented above. Sign-off is required before #113 implementation.

### 8.1 Brand character

| Principle | Proposal | Current evidence |
|-----------|----------|------------------|
| Tone | Minimal, warm, playful, grown-up | Handwritten headings, soft gray surfaces, companion pet, reward games |
| Identity | Black ink on white grounds; handwritten **accents only** | `--color-black` / `--color-white` dominate; Patrick Hand on `body` today (see typography) |
| Primary accent | **Pale blue** for fills and selection highlights | *Gap:* implementation uses green `#37eb4f` as `--color-primary` today |
| Focus / links | **Darker blue** distinct from pale accent | *Gap:* `#2563eb` appears only as undeclared fallback in Hall Pass button |
| Destructive | Keep existing red family (`#d32f2f`, `#e24b4a`) | Used in timers, status |
| Success / primary action | Resolve green vs pale-blue tension in approval | Green used for CTAs and timer progress today |

**Proposed pale-blue accent (for approval):** `#b8d4f0` fill on white; **proposed focus/link blue:** `#1e5a9e`.

### 8.2 Light palette (proposed)

| Token role | Proposed value | Notes |
|------------|----------------|-------|
| Surface primary | `#ffffff` | Matches `--color-white` |
| Surface secondary | `#f5f5f4` | Matches `--color-gray-50` |
| Ink primary | `#1b1b1b` | Matches `--color-black` |
| Ink muted | `#4b5563` | Matches `--color-gray-600` |
| Border | `#e7e5e4` | Matches `--color-gray-200` |
| Accent fill | `#b8d4f0` | **Pending approval** |
| Link / focus | `#1e5a9e` | **Pending approval** |
| Destructive | `#d32f2f` | Existing |

### 8.3 Dark palette (proposed)

| Token role | Proposed value | Notes |
|------------|----------------|-------|
| Surface primary | `#1b1b1b` | Inverted ink |
| Surface secondary | `#302e2f` | Matches `--color-gray-700` |
| Ink primary | `#f5f5f4` | |
| Ink muted | `#b4b4b4` | `--color-gray-300` |
| Border | `#4b5563` | |
| Accent fill | `#3d6a9e` | Dark-mode accent — **pending approval** |
| Link / focus | `#7eb8e8` | Lighter focus ring for dark — **pending approval** |
| Destructive | `#e24b4a` | Existing |

Contrast evidence for AA will be recorded in #113 with exact computed ratios.

---

## 9. Typography — **pending human approval**

### 9.1 Current implementation

| Role | Current font | Issue |
|------|--------------|-------|
| `body` | Patrick Hand (cursive) on entire `body` | Violates "body, controls, timers, and data are not handwritten" |
| Headings / accents | Patrick Hand, BenchNine mixed via undefined aliases | Inconsistent token references |
| Loaded fonts | Patrick Hand, BenchNine via `index.html` Google Fonts | Not local/system-only |

### 9.2 Proposed stacks (for approval)

| Role | Proposed stack | Rationale |
|------|----------------|-----------|
| Heading / accent | `'Patrick Hand', 'Segoe Print', 'Bradley Hand', cursive` | Keeps handwritten personality for titles and playful moments |
| Body / control / timer / data | `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | Readable at small sizes; no network fetch |
| Monospace data (diagnostics) | `ui-monospace, 'SF Mono', Menlo, Consolas, monospace` | Settings/diagnostics in #126 |

**Decision required:** Confirm Patrick Hand remains heading-only; approve system sans for body. Confirm local bundling strategy (self-host Patrick Hand woff2 vs system cursive fallback).

---

## 10. Cross-cutting principles (proposed for approval)

### 10.1 Motion

- Reward/game animations (wheel spin, slots, particles) honor `prefers-reduced-motion: reduce` — show static outcome immediately.
- Decorative entrance animations (HomePage fadeUp) must be disabled under reduced motion.
- Timer progress may use non-essential motion; remaining time is always visible numerically.
- Animation never determines selection outcome or domain timing (already true in domain code).

### 10.2 Responsive

- Compact extension: support **360×640** through **480×800** without fixed 550px width assumption.
- Full tab: **≥768px** with sidebar navigation; compact uses bottom or top nav (to be built in #117).
- Readable max-width for prose/data: ~`40rem` where applicable.
- Card scaling breakpoints at 700px / 800px / 1000px / 1200px may be retained if audit-proven necessary.

### 10.3 Focus

- All interactive elements expose `:focus-visible` ring using semantic `--color-focus-ring`.
- Dialogs trap focus and restore on close (native or React Aria).
- Skip link to main content in full-tab shell (#117).

### 10.4 Contrast and states

- Normal text ≥ 4.5:1; large text ≥ 3:1; non-text UI components ≥ 3:1 (WCAG 2.2 AA).
- Error, disabled, loading, and empty states use text + icon/shape — not color alone.
- Disabled controls: reduced opacity + `aria-disabled` / `disabled` + non-interactive cursor.

### 10.5 Data density

- Timers and numeric data use body sans at `--font-size-md` minimum.
- Insights tables remain primary textual encoding; any chart must have table equivalent.

---

## 11. Primitive inventory needed (feeds #115)

Based on usage audit — no speculative components:

| Category | Needed primitives | Current stand-in |
|----------|-------------------|------------------|
| Action | Button (primary, secondary, destructive, ghost) | `Button` — needs focus states |
| Link | Text link with focus ring | raw `<a>` / `SecondaryTimerDescription` |
| Text input | Text field, textarea | native inputs in TaskList, BlockedSites |
| Select | Single select | native `<select>` in InsightsPage |
| Checkbox / switch | Toggle, checkbox | `Toggle` (div); native checkboxes sparse |
| Dialog | Modal with focus trap | MUI Dialog ×2; custom overlay ×2 |
| Navigation | Tab list, sidebar nav | HomePage custom nav |
| Status | Alert, badge, live region | ad hoc class names |
| Surface | Card, panel | repeated panel styles across views |
| Slider | Duration slider | MUI Slider |

---

## 12. Human approval checklist

- [ ] **H1.** Confirm minimal warm/playful/grown-up direction (§8.1).
- [ ] **H2.** Confirm black/white handwritten-inspired identity with handwritten limited to headings/accents (§8.1, §9).
- [ ] **H3.** Confirm pale-blue accent values (§8.1, §8.2) and resolve green-vs-blue primary CTA question.
- [ ] **H4.** Confirm darker focus/link blue (§8.1, §8.2).
- [ ] **H5.** Approve Light palette (§8.2).
- [ ] **H6.** Approve Dark palette (§8.3).
- [ ] **H7.** Approve heading font stack and body/control sans stack (§9.2).
- [ ] **H8.** Approve font loading strategy (local bundle vs system fallback).
- [ ] **H9.** Approve motion, responsive, focus, contrast, and data-density principles (§10).
- [ ] **H10.** Approve primitive inventory scope (§11) — no additions without new audit evidence.

**Approver:** _pending_  
**Date:** _pending_

---

## 13. Downstream issue map

| Issue | Depends on this audit |
|-------|----------------------|
| #113 Semantic tokens | §4, §8 palettes, §9 typography |
| #114 Playwright + axe | §2 surface list, §3 viewports |
| #115 Primitives | §11 inventory |
| #116 Remove MUI | §5.1 |
| #117 App shells | §3 compact/full gaps |
| #118–#126 Feature migrations | §2 full inventory |
| #127 Visual baselines | §3 viewports + approved palettes |
| #128 Documentation | This document + implemented artifacts |

---

## 14. Deliberate exclusions

- Values and structures from `DESIGN_SYSTEM.md` at repo root are **not** adopted; that file remains legacy until retired in #128.
- Dormant PrizeWheel/Slots/HomePage demo code is inventoried but not prioritized for migration ahead of active session flow.
- `QuizPage` orphan is noted; migration decision deferred to #118.
