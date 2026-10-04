---
description: Plan and implement a feature or refactor for Recess
allowed-tools: Bash(gh issue view:*), Bash(git diff:*), Bash(git log:*), Bash(npm run verify:*), Bash(npm test:*), Read, Grep, Glob, Edit
---

Work: $ARGUMENTS

Before touching code, read `docs/architecture.md` §"Layer contracts" and
`.claude/rules/code-style.md`.

## 1. Align

State where this change sits in the layers: which layer owns the logic, what
it calls, and what calls it. If it crosses a boundary, say how.

If anything is ambiguous, ask one question. Do not assume.

## 2. Check for an existing issue

Run `gh issue view` if one was named. If not, ask whether one exists before
creating anything.

## 3. Plan

Write the plan as bounded steps. Each step:
- touches one layer
- leaves `npm run verify` passing
- is independently revertible

Apply the minimalism ladder to each: does this need to exist? Is it already in
this codebase? Does the standard library or platform do it? Only then write it.

Wait for approval before implementing.

## 4. Implement

One step at a time. Run `npm run verify` after each. Stop and report on
failure rather than continuing.

## 5. Hand back

Report what changed, which layer contracts it touches, and the actual
`npm run verify` output. Do not commit unless asked.