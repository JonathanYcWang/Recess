# Design System Audit & Migration Plan

This document outlines the plan for auditing the existing Recess frontend codebase and incrementally migrating it to a standardized, scalable design system.

## 1. Audit Findings

### 1.1. Typography

- **Problem:** The current typography system has an inconsistent and overly granular scale. Font sizes like 41px, 28px, 26px, and 22px break a harmonious and predictable typographic rhythm. Line heights are a mix of `px` values, unitless values, and the `normal` keyword, leading to inconsistent vertical spacing.
- **Evidence:** `src/styles/typography.module.css` contains `--text-size-41: 41px;`, `--line-height-22: 28px;`, and `--line-height-26: normal;`.
- **Impact:** Inconsistent UI, difficult maintenance, and a cluttered developer experience when choosing typographic styles.

### 1.2. Spacing

- **Problem:** The spacing system is mostly based on a 4px grid, which is good. However, it includes outlier values (`--spacing-13: 51px;`, `--spacing-14: 55px;`) that deviate from the established scale.
- **Evidence:** `src/styles/spacing.module.css`.
- **Impact:** These magic numbers break the visual consistency of layouts and make it harder for developers to reason about spacing.

### 1.3. Colors

- **Problem:** Color tokens are named by their literal value (e.g., `--recess-green`) instead of their semantic function (e.g., `--color-primary-default`). This makes the system rigid and difficult to theme.
- **Evidence:** `src/styles/colors.module.css`.
- **Impact:** Changing a primary brand color would require a search-and-replace across the codebase, and it's unclear where colors should be used.

## 2. Proposed Design System

### 2.1. Token Philosophy

We will adopt a two-layered token system:

1.  **Core Tokens:** Base values for colors, fonts, and sizes (e.g., `blue-500`, `font-sans`, `size-4`).
2.  **Semantic Tokens:** Aliases that map core tokens to their purpose in the UI (e.g., `color-background-primary`, `font-body-medium`, `spacing-inset-md`).

This approach provides both flexibility and semantic meaning.

### 2.2. Typography System

We will establish a modular scale for typography based on a base font size of 16px.

**New Type Scale (Core Tokens):**

- `xs`: 12px
- `sm`: 14px
- `md`: 16px (base)
- `lg`: 18px
- `xl`: 20px
- `2xl`: 24px
- `3xl`: 32px
- `4xl`: 48px
- `5xl`: 64px

**Semantic Text Styles:**

- `display`: Large, high-impact text.
- `heading`: Section titles.
- `subheading`: Subsection titles.
- `body`: Default paragraph text.
- `caption`: Small, secondary text.
- `label`: UI control labels.

### 2.3. Spacing System

We will enforce a strict 4px grid system.

**New Spacing Scale (Core Tokens):**

- `0`: 0px
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px
- `6`: 24px
- `7`: 28px
- `8`: 32px
- `9`: 36px
- `10`: 40px
- `12`: 48px
- `16`: 64px

## 3. Migration Plan

The migration will be executed incrementally to minimize disruption.

### Phase 1: Establish New Tokens (Current Phase)

1.  **Create `design-tokens.ts`:** A central file to define the new token system using a TypeScript structure.
2.  **Create `theme.ts`:** A file to map design tokens to CSS variables.
3.  **Refactor CSS:** Update the root CSS files (`typography.module.css`, `spacing.module.css`, `colors.module.css`) to use the new token structure.
4.  **Verify:** Ensure no visual regressions have been introduced.

### Phase 2: Incremental Component Migration

1.  **Prioritize Components:** Start with low-level, high-reuse components like `Button`, `Icon`, and `Toggle`.
2.  **Replace Hardcoded Values:** Systematically replace hardcoded pixel values in component CSS modules with the new semantic CSS variables.
3.  **Refactor One by One:** Update one component at a time, verifying its appearance and functionality before moving to the next.

### Phase 3: Linting & Enforcement

1.  **ESLint Plugin:** Introduce an ESLint plugin to detect and flag the use of magic numbers and non-design-system values in CSS.
2.  **Codemods:** Develop or use existing codemods to automate the replacement of deprecated tokens and hardcoded values.

This structured approach will ensure a smooth transition to a more robust and maintainable frontend architecture.
