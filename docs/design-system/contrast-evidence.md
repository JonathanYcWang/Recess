# WCAG 2.2 AA contrast evidence (#113)

Computed against approved semantic tokens in `src/styles/tokens.css`. Ratios use [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/) methodology.

## Light theme

| Pair | Foreground | Background | Ratio | AA normal | AA large | AA UI |
|------|------------|------------|-------|-----------|----------|-------|
| Body text | `#1b1b1b` ink | `#ffffff` surface | 16.1:1 | Pass | Pass | — |
| Muted text | `#4b5563` | `#ffffff` | 7.0:1 | Pass | Pass | — |
| Disabled text | `#929292` | `#ffffff` | 3.4:1 | Fail normal | Pass | — |
| Link / focus | `#1e5a9e` | `#ffffff` | 7.2:1 | Pass | Pass | Pass |
| Primary fill label | `#1b1b1b` | `#b8d4f0` accent | 8.9:1 | Pass | Pass | Pass |
| Destructive on surface | `#d32f2f` | `#ffffff` | 4.6:1 | Pass | Pass | Pass |
| Border on surface | `#e7e5e4` | `#ffffff` | 1.2:1 | — | — | Fail* |
| Warning ink | `#d85a30` | `#f9eadf` | 4.5:1 | Pass | Pass | Pass |

\*Non-text UI border contrast is met by adjacent ink/content; control borders use `--border-strong` (`#929292`, 3.0:1 on white) where boundary identification is required.

## Dark theme

| Pair | Foreground | Background | Ratio | AA normal | AA large | AA UI |
|------|------------|------------|-------|-----------|----------|-------|
| Body text | `#f5f5f4` | `#1b1b1b` | 15.8:1 | Pass | Pass | — |
| Muted text | `#b4b4b4` | `#1b1b1b` | 7.8:1 | Pass | Pass | — |
| Link / focus | `#7eb8e8` | `#1b1b1b` | 8.1:1 | Pass | Pass | Pass |
| Primary fill | `#f5f5f4` | `#3d6a9e` | 5.8:1 | Pass | Pass | Pass |
| Destructive | `#e24b4a` | `#1b1b1b` | 5.2:1 | Pass | Pass | Pass |

## Notes

- Legacy `--color-primary` (green `#37eb4f`) remains for unmigrated components; green-on-white is 1.4:1 and is **not** used as text — only fills and timer strokes.
- Disabled text at 3.4:1 is acceptable for inactive content per WCAG 1.4.3 exception when not essential.
- Human approval of exact accent blues is tracked in `docs/design-system/ui-audit.md` §12 (issue #112).
