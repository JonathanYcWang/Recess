# Legacy token inventory (#113)

Maps pre-semantic vocabulary to canonical semantic tokens. Issue #113 adds aliases only (zero visual delta). Component migrations in #115–#126 replace left-column names; do not add new legacy aliases.

## Layer model

1. **Core** (`--core-*`) — literal palette values
2. **Semantic** (`--ink-*`, `--fill-*`, `--surface-*`, `--border-*`, `--focus-*`, `--status-*`)
3. **Legacy** (`--color-*`, `--font-family-primary`, `--recess-*`, etc.) — aliases only

## Aliased in #113

| Legacy token | Canonical target | Status |
|--------------|------------------|--------|
| `--color-primary` | `--ink-selection` (`#37eb4f`) | Aliased — retire at #225 |
| `--color-text-primary` | `--ink-primary` | Aliased |
| `--color-text-secondary` | `--ink-muted` | Aliased |
| `--color-text-disabled` | `--ink-disabled` | Aliased |
| `--color-background-primary` | `--surface-primary` | Aliased |
| `--color-background-secondary` | `--surface-secondary` | Aliased |
| `--color-border-primary` | `--border-default` | Aliased |
| `--color-border-secondary` | `--border-strong` | Aliased |
| `--color-status-fatigued-background` | `--status-fatigued-background` | Aliased |
| `--color-status-fatigued-border` | `--status-fatigued-border` | Aliased |
| `--color-status-exhausted-background` | `--status-exhausted-background` | Aliased |
| `--color-destructive` | `--fill-destructive` | Aliased (was undefined) |
| `--color-accent` | `#2563eb` (literal) | Aliased — Hall Pass confirm fallback |
| `--color-surface-elevated` | `--core-gray-100` | Aliased |
| `--color-border` | `--border-default` | Aliased |
| `--font-family-primary` | `--font-family-heading` | Aliased |
| `--font-family-secondary` | `'BenchNine', sans-serif` | Aliased |
| `--font-bench-nine` | `--font-family-secondary` | Aliased (was undefined) |
| `--font-patrick` | `--font-family-primary` | Aliased (was undefined) |
| `--text-size-12` | `--font-size-xs` | Aliased (was undefined) |
| `--text-size-14` | `--font-size-sm` | Aliased (was undefined) |
| `--text-size-20` | `--font-size-xl` | Aliased (was undefined) |
| `--text-size-48` | `--font-size-4xl` | Aliased (was undefined) |
| `--line-height-12` | `--line-height-xs` | Aliased (was undefined) |
| `--line-height-20` | `--line-height-xl` | Aliased (was undefined) |
| `--line-height-48` | `--line-height-4xl` | Aliased (was undefined) |
| `--letter-spacing-small` | `0.04em` | Aliased (was undefined) |
| `--recess-black` | `--ink-primary` | Aliased |
| `--recess-white` | `--surface-primary` | Aliased |
| `--recess-gray-text` | `--ink-muted` | Aliased |
| `--recess-gray-light-bg` | `--core-gray-100` | Aliased |
| `--recess-gray-border` | `--core-gray-250` | Aliased |
| `--text-secondary` | `--ink-muted` | Aliased |
| `--surface-elevated` | `--surface-primary` | Aliased |
| `--border-subtle` | `--core-gray-250` | Aliased |
| HSL shims (`--background`, `--ring`, etc.) | `tokens.css` | Consolidated from `globals.css` |

## Not migrated in #113 (document only)

| Pattern | Canonical target (future) | Owner issue |
|---------|---------------------------|-------------|
| Raw `rgba(27,27,27,…)` shadows | `--shadow-elevation-*` | #115+ |
| Onboarding/quiz raw hex | semantic tokens | #118–#119 |
| `#b3261e` Insights error | `--fill-destructive` | #125 |
| Inline MUI `sx` colors | primitives + tokens | #116 |
| Component-local custom properties | keep local | — |

## Retire after #225 (provisional palette)

- `--color-primary`, `--color-green` (green selection may become black ink)
- `--color-orange-*`, `--color-status-fatigued-*` (gray fatigue tiers)
- `--color-accent` (`#2563eb`)
- `--recess-*` orphan namespace
- `--font-bench-nine`, `--font-patrick`, `--text-size-*` shims

## Reverted #223 lessons

Do **not** reintroduce: `[data-theme]`, `ThemeApplier`, dark palette blocks, blue `--fill-primary` / `--focus-ring`, or system-sans body typography.

## Downstream

- #115 primitives consume semantic names
- #225 changes semantic **values** after #230 human re-confirm
