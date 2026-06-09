---
name: recess-code-review
description: Use when reviewing Recess code changes against an approved plan, implementation diff, or high-risk behavior.
---

# Recess Code Review Skill

Use this skill after implementation or when the user asks for a review.

## Workflow

1. Review against the original request.
2. Review against Code Explorer findings and approved plan when available.
3. Load relevant `.github/instructions/` files.
4. Prioritize bugs, regressions, missing tests, and architecture risks.
5. Check high-risk areas carefully.
6. Label optional improvements as optional follow-up.

## Output

Return findings first, ordered by severity.

Use:

- Findings
- Open questions
- Optional follow-up
- Verification reviewed

If no issues are found, say so clearly and note remaining test gaps or residual risks.

