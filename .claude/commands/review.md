---
description: Review the pending diff, then check docs/architecture.md for drift
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(npm run verify:*), Skill, Read, Grep, Glob
---

Review the pending change on this branch. Runs four passes in order.

Scope: $ARGUMENTS
If no scope given, diff against `main`.

## 1. Minimality gate — `/ponytail`

Invoke the `ponytail` skill (full intensity) against the diff before
reviewing it as correct.

Ask of every changed line: does this need to exist at all? Is it already in
this codebase? Does the stdlib or platform do it? Is the diff bigger than the
problem?

Report as findings:
- Code written that an existing helper already covers
- Abstractions with one implementation, config for a value that never changes
- Boilerplate stashed "for later"
- Churn in lines the change did not need to touch

Deleting a hunk is a valid outcome of this review. Say so when it applies.

## 2. Code review — `/code-review`

Invoke the `code-review` skill at the effort the diff size warrants.

It covers correctness, security, and reuse on its own. Do not restate those
checks by hand here.

## 3. Architecture drift

Read `.claude/rules/code-style.md` §"Layer contracts" — that is the checklist.

For each changed file, check rules 1-9. Distinguish mechanical (1-6,
objectively checkable) from architectural (7-9, need judgment against
`docs/architecture.md`).

Two specific failure modes this catches:

- **A second path to storage, the Redux store, or browser messaging.** The
  single-writer rules exist so state flows one direction. A new writer breaks
  it permanently.
- **Business logic landing outside `/Background/Services`.** Adapters, repositories,
  ActionHandlers wiring, utils, and Redux are for orchestration, not logic.

Do not flag pre-existing violations in unchanged lines unless the change
touches that code.

## 4. Doc drift

Read `docs/architecture.md` §"Follow-up" and compare against the diff.

Flag any item the diff has just implemented but the doc still marks as
Follow-up, or describes differently. Docs that drift from the source are
their own finding — an implemented item still marked Follow-up misleads the
next person to plan against it.

Check the reverse too: did the change invalidate a documented layer contract
or data flow? If so, the doc needs updating in the same change.

## Output

One numbered list, most severe first, each with `file:line` — what it violates,
and what the code actually does.

Group by pass so the origin of each finding stays obvious:

```
1. [minimality] src/… — duplicate of existing util X — Y lines already exist
2. [security]    src/… — storage read without Zod validation — tainted value reaches
3. [layer]       src/… — second writer to Redux — breaks single-writer
4. [doc]         docs/architecture.md:28 — Follow-up now implemented — unmark
```

If a pass is clean, say "no findings" for it and move on. Do not invent
problems to fill a section.

Report only. Do not file issues, and do not fix anything without approval.