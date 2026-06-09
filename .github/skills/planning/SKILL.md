---
name: recess-planning
description: Use for Recess feature, bug-fix, refactor, or high-risk work that needs an implementation plan before code changes.
---

# Recess Planning Skill

Use this skill when a task is non-trivial, ambiguous, high-risk, cross-cutting, or changes user-facing behavior.

## Workflow

1. Start from the original user request.
2. Use Code Explorer findings when available.
3. Load only relevant files from `.github/instructions/`.
4. Identify affected files and ownership boundaries.
5. Define the implementation approach.
6. List edge cases and failure modes.
7. Define testing and verification.
8. Call out high-risk changes requiring user approval.

## Output

Return:

- Implementation approach
- Files expected to change
- Edge cases
- Testing and verification plan
- Risks requiring approval
- Open questions, if any

