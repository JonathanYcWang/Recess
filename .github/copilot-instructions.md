# Copilot Instructions

Primary project guidance is defined in:

`../AGENTS.md`

Before planning, coding, reviewing, testing, or refactoring, consult `AGENTS.md`.

Critical rules to always follow:

- Preserve Chrome MV3 constraints.
- Use `HashRouter`; do not replace it with `BrowserRouter`.
- Preserve timer invariants around `currentTimer`, `currentTimerRemaining`, and `currentStartTime`.
- Keep services pure where possible.
- Use Redux Toolkit patterns already present in the repo.
- Use CSS Modules and design tokens from `src/styles/tokens.css`.
- Prefer minimal diffs.
- Do not modify unrelated files.
- Do not introduce dependencies without explaining why.
- Remove unused imports, variables, and parameters.
