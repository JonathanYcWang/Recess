# E2E accessibility gate (#114)

Automated Chromium accessibility and behavior checks run separately from `npm run verify`.

## Commands

```sh
npm run e2e:install   # once per machine/CI image — installs Chromium for Playwright
npm run e2e           # build + vite preview fixture + Playwright projects
```

`npm run verify` does **not** run E2E. CI runs `e2e` as its own macOS job.

## Fixture

Playwright serves the production build via `vite preview` on port 4173. This uses the same bundled popup assets as the Chromium extension (`dist/`) without loading an unpacked extension ID. Hash routes (`/#/`, `/#/onboarding`) mirror popup navigation.

Recess has a **single presentation** — no Light/Dark theme dimension in E2E (#229).

## Viewport matrix

| Playwright project | Viewport | Notes |
|--------------------|----------|-------|
| `compact-light-360` | 360×640 | extension popup |
| `compact-light-480` | 480×800 | extension popup |
| `full-tab-light-768` | 768×900 | detached tab |
| `compact-reduced-motion` | 360×640 | `prefers-reduced-motion: reduce` |

## Routes under axe gate

| Route | Status |
|-------|--------|
| `/#/onboarding` | **Gated** — serious/critical axe violations fail CI |
| `/#/` (home / focus) | **Pending** — known `color-contrast` debt from #112 audit; add after #117 shell migration |

- Package: `@axe-core/playwright@4.11.3` (issue #114 name `axe-playwright` refers to this distribution).
- Tags: WCAG 2.0/2.1 A and AA.
- **Serious** and **critical** violations fail the job with route and project context.
- Moderate/minor violations are reported but do not fail the gate until reviewed.

## Behavior checks (non-screenshot)

- Keyboard Tab reaches a focusable control on home and onboarding routes.
- Reduced-motion project asserts global animation duration collapse.

## Safari

Safari extension accessibility and behavior are **not** inferred from Chromium Playwright runs. Continue real-device checks in `docs/browser-smoke-checks.md`.

## CI artifacts

On failure, CI uploads `playwright-report/` and `e2e/test-results/` (traces, screenshots).
