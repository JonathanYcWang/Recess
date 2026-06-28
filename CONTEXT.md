# Recess — Context

- Canonical product language: [docs/domain/glossary.md](docs/domain/glossary.md)
- Product rules: [docs/domain/rules.md](docs/domain/rules.md)
- Architecture reference: [docs/architecture-v2.md](docs/architecture-v2.md)
- Legacy blueprint (remove after initial audit is complete): [docs/domain/architecture-cleanup-blueprint.md](docs/domain/architecture-cleanup-blueprint.md)

---

## What Recess is

Recess is a browser extension (Chrome + Safari, Manifest V3) that helps users do focused work through structured Work Sessions. It enforces a Block List during Focus Blocks, runs a chance-based Reward Game to select a Block List entry and Recess duration before each earned Recess, and adapts Focus Block and Recess durations dynamically through a Scheduler based on the user's Energy, Momentum, and Work Session progress.

---

## Key architectural facts

- The background worker is the single source of truth. It is the only writer to storage.
- The UI never writes to storage or dispatches to Redux directly.
- ActionBroker is the only writer to the Redux store.
- State flows one direction: background worker → ActionBroker → Redux → components.
- All browser APIs use `browser.*` via the WebExtension polyfill — never `chrome.*`.
- Plain arrow functions only — no classes, no function declarations.
- No `any` or `unknown` in types or interfaces. No `as` casting — use type guards.

---

## Agent workflow triggers

- `/build` — new feature or refactor. Activates the orchestrator.
- `/audit` — architecture compliance scan. Creates GitHub issues per violation type.

---

## Token discipline

Start every Codex session with:
```bash
headroom wrap codex "build"
# or
headroom wrap codex "audit"
```

Headroom starts automatically with Codex — no separate proxy needed. Cross-agent memory is shared across all subagents automatically.

All agent sessions run with:
- `/caveman` — always on
- Ponytail — always on
