# Recess

Browser extension (Chrome + Safari, MV3) for focus through structured
Sessions. Domain vocabulary is deliberately unusual — "Recess" means a break
period, "Focus" a work interval, and both are in
`docs/glossary.md`. Read it before touching domain logic.

## Architecture

`docs/architecture.md` is authoritative for layer contracts, data flow, and
rationale. Read it before any change that crosses a layer boundary.

State flows one direction: background → ActionBroker → Redux → components.
Three single-writer rules make that work (`StorageRepository` owns storage,
`ActionBroker` owns Redux and messaging). They are load-bearing — a second
writer to any of them breaks the flow permanently, so read
`docs/architecture.md` §1 before touching them.

Code identifiers still carry pre-rename terms (`workSession*`,
`FOCUS_BLOCK`, `REWARD_GAME`, `BlockList*`). `docs/architecture.md` §1 has the
mapping, and `docs/rename-plan.md` has the ordered list to close the gap.

## Conventions

`.claude/rules/code-style.md` loads automatically for `src/**` and covers type
safety, function shape, browser-API scoping, single-writer rules, layer
contracts, and security boundaries. Do not restate it here.

Test conventions live in the `agent-skills:test-driven-development` skill.

## What enforces what

`npm run verify` is the quality gate and runs on commit — a failing step
aborts the commit. It runs, in order: `format:check`, `lint`, `test`, `knip`,
`build`, `package:chromium`, `package:safari`.

The architecture check (`scripts/hooks/check-architecture.sh`) runs after it
on commit and is **warn-only** — it reports and never blocks. Run it yourself
with `sh scripts/hooks/check-architecture.sh --all`.

The `Protect main` ruleset requires a PR and all three CI checks: `verify`,
`package-chromium`, `package-safari`.

## Skills

Use these rather than writing new project commands:

- `/review` — the pending diff: minimality → code review → layer drift → doc drift
- `ponytail:ponytail` — minimality, already on for any code change
- `agent-skills:plan` — planning features and refactors
- `/security-review` — anything touching messaging, storage, or UI rendering
- `agent-skills:test-driven-development` — test strategy

## Reference

- `docs/glossary.md` — canonical domain terms, source of truth for intent
- `docs/architecture.md` — layer contracts, data flow
- `docs/rename-plan.md` — terminology and behaviour gaps between the two
- `README.md` — local run steps, packaging, CI gate details