---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
---

# Testing — Recess

Runner: Vitest. Run with `npm test`. Full gate: `npm run verify`.

- Every new exported function gets at least one test.
- Test behavior through the public API, not private internals.
- Name tests `describe("unit under test")` / `it("does X when Y")`.
- Mock at the network boundary only. Do not mock your own modules.
- Tests must not touch storage or browser APIs directly. Cover those paths
  through the adapter or repository that owns them — all 7 existing test
  files hold this line.