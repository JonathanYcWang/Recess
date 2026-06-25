# Recess design system

Epic: [#111](https://github.com/JonathanYcWang/Recess/issues/111)

## Phases

| Phase | Goal | Issues | Visual change? |
|-------|------|--------|----------------|
| **Infrastructure** | Aliases, primitives, MUI removal, functional shells | #229, #113, #115–#117 | No (pixel parity) |
| **Structural migration** | Adopt primitives per surface; fix a11y gaps | #118–#126 | No (pixel parity) |
| **Visual application** | Apply provisional palette/typography | #230 → #225 | Yes |
| **Stabilize** | Baselines + full docs | #127, #128 Phase 2 | Baselines only |

## Terminology

| Term | Meaning |
|------|---------|
| **Presentation** | Single visual mode — current light appearance, one `:root` token set |
| **Semantic alias token** | New name (e.g. `--ink-selection`) pointing at **current** computed value until #225 |
| **Structural migration** | Adopt primitives/shells; preserve pixels at rest |
| **Visual application** | Palette, typography, fatigue colors — blocked until #230 |
| **Provisional direction** | [ui-audit.md](ui-audit.md) §8–§12 — not execution authority yet |

## Documents

| File | Purpose |
|------|---------|
| [ui-audit.md](ui-audit.md) | Surface inventory, a11y findings, provisional direction |
| [legacy-token-inventory.md](legacy-token-inventory.md) | Old → new token map (#113) |
| [../e2e-accessibility.md](../e2e-accessibility.md) | Playwright + axe gate |

## Deprecation map (Phase 1)

| Legacy surface | Replacement | Owner issue | Status |
|----------------|-------------|-------------|--------|
| `--color-*` palette tokens | Semantic aliases in `tokens.css` | #113 | Aliased |
| `--recess-*`, `--font-patrick`, `--text-size-*` | Semantic / scale aliases | #113 | Aliased |
| MUI `Dialog`, `Slider` | `src/primitives/Dialog`, `Slider` | #116 | Removed |
| Emotion / MUI providers | None (removed) | #116 | Removed |
| `themePreference` settings field | Removed — single presentation | #229 | Removed |
| Inline `sx` / raw hex in components | Primitives + semantic tokens | #118–#126 | Pending |
| Fixed `html { width: 550px }` popup sizing | Responsive shell | #117 | Pending |
| Root `DESIGN_SYSTEM.md` | `docs/design-system/README.md` | #128 | Retired |

## Execution order

```
#229 Remove theme preference
  → #113 Semantic alias tokens (zero visual delta)
  → #115 Primitives (pixel-parity)     ← parallel OK with migrations
  → #116 MUI removal
  → #117 Shell functional fixes
  → #118–#126 Structural migrations (parallel OK)
  → #230 Human re-confirm visual identity
  → #225 Apply provisional palette
  → #127 Visual baselines
  → #128 Phase 2 docs
```

**Start now:** #229, #128 Phase 1, any #118–#126 slice that preserves pixels.

## Agent styling rules

See [.github/instructions/styling.md](../../.github/instructions/styling.md).
