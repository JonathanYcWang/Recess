---
description: Scan the codebase for architecture violations and improvement opportunities
allowed-tools: Read, Grep, Glob, Bash(git log:*)
---

Scan the whole `src/` tree against Recess's documented architecture.

Read `docs/architecture.md` §"Layer contracts" and
`.claude/rules/code-style.md` first — those are the checklists.

Scope: $ARGUMENTS
If no scope given, audit all of `src/`.

## Mechanical rules

1. `chrome.*` outside `/Background/Adapters`, `/Background/Repositories`, `/Shared/ActionBrokers`
2. `storage.` writes outside `/Background/Repositories`
3. `/UI` importing from `/Background` directly
4. `/Shared` importing from `/UI` or `/Background`
5. `any`, `unknown`, or `as` casts
6. Classes or `function` declarations in `src/`

## Architectural rules

7. Business logic in adapters, repositories, ActionHandlers wiring, utils, or Redux instead of services
8. A second path to storage, the Redux store, or browser messaging
9. A reverse hop in the data flow (background → ActionBroker → Redux → components)

## Also check the docs themselves

Read the "Follow-up" section of `docs/architecture.md` and flag any item
already implemented in the code, or contradicted by it. Docs that drift from
the source are their own finding.

## Output

One finding per line, most severe first:

```
file:line — rule violated — what it actually does
```

Group mechanical findings separately from architectural ones, and separately
from doc-drift findings. If a section is clean, say so.

Do not file issues automatically. Report only.