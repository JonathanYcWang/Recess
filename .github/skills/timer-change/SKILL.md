---
name: recess-timer-change
description: Use when changing Recess focus or break timing, pause/resume behavior, session transitions, countdown calculations, or timer-related Redux state.
---

# Recess Timer Change Skill

Timer behavior is high-risk. Use this skill before planning, implementing, or reviewing timer-related changes.

## Workflow

1. Inspect timer-related hooks, reducers, selectors, services, and persistence.
2. Identify current behavior before proposing changes.
3. Preserve the distinction between original duration, remaining snapshot, and live countdown anchor.
4. Consider pause/resume, session transitions, reloads, hydration, and background behavior.
5. Define edge cases before implementation.
6. Add or update tests when infrastructure exists.
7. Run `npm run build` whenever feasible.

## Output

Return:

- Current timer behavior
- Proposed change
- Invariants preserved
- Edge cases
- Tests or manual checks
- Remaining risks

