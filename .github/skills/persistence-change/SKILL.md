---
name: recess-persistence-change
description: Use when changing Recess persisted Redux state, storage keys, hydration, migrations, or browser/local storage behavior.
---

# Recess Persistence Change Skill

Persistence and hydration are high-risk. Use this skill before planning, implementing, or reviewing persisted state changes.

## Workflow

1. Inspect storage middleware, hydration logic, affected reducers, and selectors.
2. Identify existing stored shape and backward-compatibility needs.
3. Define how old stored data behaves after the change.
4. Keep browser storage API usage behind appropriate boundaries.
5. Add selectors for new state reads.
6. Add or update tests when infrastructure exists.
7. Run `npm run build` whenever feasible.

## Output

Return:

- Stored state affected
- Compatibility approach
- Files expected to change
- Tests or manual checks
- Remaining risks

