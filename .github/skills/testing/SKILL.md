---
name: recess-testing
description: Use for Recess tasks that add, change, fix, or review behavior and need a testing or verification strategy.
---

# Recess Testing Skill

Use this skill whenever behavior is added, changed, fixed, or meaningfully at risk of regression.

## Workflow

1. Identify the behavior under test.
2. Prefer pure service tests for domain logic.
3. Test reducers by dispatching actions and asserting state.
4. Test components through visible behavior and user interactions.
5. Mock browser extension APIs for extension behavior.
6. Prioritize timers, pause/resume, persistence, blocked sites, rewards, and browser extension behavior.
7. Run available checks.

## Rules

- Do not invent test commands.
- If tests are unavailable, report that clearly.
- Recommend the smallest useful testing setup or manual verification path.
- Avoid snapshot tests as the primary behavioral assertion.

