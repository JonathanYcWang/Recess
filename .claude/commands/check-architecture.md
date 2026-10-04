---
description: Check a diff against the architecture docs and report deviations
allowed-tools: Bash(git diff:*), Read, Grep, Glob
---

Check whether a change aligns with Recess's documented architecture.

Scope: $ARGUMENTS
If no scope given, review the staged diff (`git diff --staged`), falling back
to the unstaged working diff (`git diff`).

## What to check

Read `docs/architecture.md` §"Layer contracts" and `.claude/rules/code-style.md`
first. Then for each changed file, check the mechanical rules:

1. `chrome.*` outside `/Background/Adapters`, `/Background/Repositories`, `/Shared/ActionBrokers`
2. `storage.` writes outside `/Background/Repositories`
3. `/UI` importing from `/Background` directly
4. `/Shared` importing from `/UI` or `/Background`
5. `any`, `unknown`, or `as` casts
6. Classes or `function` declarations

Then the architectural contracts, which need judgment:

7. Does this add or move business logic into an adapter, repository, ActionHandlers wiring, util, or Redux layer? Logic belongs in services.
8. Does this create a second path to storage, the Redux store, or browser messaging?
9. Does this introduce a reverse hop in the data flow (background → ActionBroker → Redux → components)?

## Output

Report as a numbered list, most severe first, each with `file:line`, the rule
it deviates from, and what the code actually does. Distinguish mechanical
violations (1-6, objectively checkable) from architectural ones (7-9).

If the diff is clean, say "No deviations found" and stop. Do not invent
problems, and do not flag pre-existing violations in unchanged lines unless
the change touches that code.