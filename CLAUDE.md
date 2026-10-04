# Recess

## Overview

Browser extension (Chrome + Safari, Manifest V3) for focused work through
structured Work Sessions. Enforces a Block List during Focus Blocks, runs a
chance-based Reward Game to pick a Block List entry and Recess duration before
each earned Recess, and adapts Focus Block and Recess durations dynamically
through a Scheduler driven by the user's Energy and Work Session progress.

## Stack

- Language: TypeScript 5.x
- Framework: React 19 + Vite
- Extension: Manifest V3, WebExtension polyfill (`browser.*`, never `chrome.*`)
- Targets: Chromium and Safari (separate packaging paths)
- Test runner: Vitest
- Package manager: npm

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test`
- Lint: `npm run lint`
- Format check: `npm run format:check`
- Dead code: `npm run knip`
- Build: `npm run build`
- **Full gate: `npm run verify`** — format, lint, test, knip, build, and both
  package targets. This runs in the pre-commit hook; it must pass before commit.

## Layers

```
src/
├── Background/    ActionHandlers, Adapters, Broadcasters, Repositories, Services
├── Shared/        ActionBrokers, Constants, Data, Schema, State, Types, Utils
├── UI/            Components, Hooks, Pages, Redux, Styles, Views
└── Assets/
```

The background worker is the single source of truth and the only writer to
storage. State flows one direction: background → ActionBroker → Redux →
components.

## Conventions

Rules are not duplicated here. They load on demand:

- **`.claude/rules/code-style.md`** — type safety, function shape, browser API
  scoping, single-writer rules. Applies to `src/**`.
- **`.claude/rules/testing.md`** — Vitest conventions. Applies to test files.

## Reference

- `docs/architecture.md` — as-built architecture, layer contracts, data flow
- `docs/domain/glossary.md` — canonical product terms
- `docs/domain/rules.md` — product rules
- `docs/release/branch-protection.md` — release process

Read `docs/architecture.md` before changing anything that crosses a layer
boundary. The layer contracts in its Principles section carry rationale that
the mechanical rules depend on.