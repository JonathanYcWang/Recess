---
description: Diagnose and fix a GitHub issue
allowed-tools: Bash(gh issue view:*), Read, Edit, Grep, Bash(npm test:*), Bash(npm run verify:*)
---

Issue: $ARGUMENTS

1. `gh issue view` to read the full report and reproduce steps.
2. Find the responsible code. State the file and line before changing anything.
3. Make the smallest fix that resolves the root cause.
4. Run `npm run verify`. Report the actual output, pass or fail.