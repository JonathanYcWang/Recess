# Legacy token inventory (#113)

Maps pre-semantic vocabulary to canonical tokens. Component migrations in #115–#126 should replace left-column names with semantic tokens; do not add new legacy aliases.

| Legacy token | Canonical target | Migration status |
|--------------|------------------|------------------|
| `--color-primary` | `--core-green` (visual unchanged) | Keep until CTA migration picks `--fill-primary` |
| `--color-text-primary` | `--ink-primary` | Aliased |
| `--color-text-secondary` | `--ink-muted` | Aliased |
| `--color-text-disabled` | `--ink-disabled` | Aliased |
| `--color-background-primary` | `--surface-primary` | Aliased |
| `--color-background-secondary` | `--surface-secondary` | Aliased |
| `--color-border-primary` | `--border-default` | Aliased |
| `--color-border-secondary` | `--border-strong` | Aliased |
| `--font-family-primary` | `--font-family-heading` | Aliased |
| `--font-family-secondary` | `--font-family-body` | Aliased |
| `--font-bench-nine` | `--font-family-heading` | Aliased (was undefined) |
| `--font-patrick` | `--font-family-heading` | Aliased (was undefined) |
| `--text-size-12` … `--text-size-48` | `--font-size-*` scale | Aliased (were undefined) |
| `--color-accent` | `--fill-primary` | Aliased |
| `hsl(var(--background))` etc. | Semantic HSL shims in `tokens.css` | Aliased per theme |
| `globals.css` duplicate `:root` HSL block | Removed; lives in `tokens.css` | Retired |
| Google Fonts Patrick Hand / BenchNine | System stacks in `tokens.css` | Retired (network fetch removed) |
| Raw `rgba(27,27,27,…)` shadows | `--shadow-elevation-*` | **Not migrated** — #115+ |
| Inline MUI `sx` colors | Primitives + tokens | **Not migrated** — #116 |
| `#b3261e` Insights error | `--fill-destructive` / `--ink-on-destructive` | **Not migrated** — #125 |

## Duplicate vocabulary retired

- `DESIGN_SYSTEM.md` at repo root — superseded by implementation docs in Epic #111; retired in #128.
- Parallel HSL block in `globals.css` — merged into themed semantic shims.
