---
description: Review the pending diff
allowed-tools: Bash(git diff:*), Bash(git log:*), Read, Grep
---

Review the uncommitted changes on the current branch.

1. Run `git diff main` to see what changed.
2. For each changed file, check: correctness, security holes, missing error handling, naming.
3. Report findings as a numbered list, most severe first. Say "no issues found" if clean.

Scope: $ARGUMENTS