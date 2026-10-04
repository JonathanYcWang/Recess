---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Code Style — Recess

Mechanical rules. Enforceable by inspection or a script. Architectural
intent and rationale live in `docs/architecture.md`.

## Type safety

- No `any`, no `unknown`, no `as` casts. Use type guards at every boundary.
- No `I` prefix on interface names.

## Function shape

- Plain arrow functions only. No classes, no function declarations.

## Browser APIs

- Always `browser.*` via the WebExtension polyfill. Never `chrome.*`.
- No browser API outside `/Background/Adapters`, `/Background/Repositories`,
  and `/Shared/ActionBrokers`.

## Single-writer rules

- `StorageRepository` is the only writer to browser storage.
- `ActionBroker` is the only writer to the Redux store.
- `ActionBroker` is the only caller of browser messaging APIs.

These three are the reason state flows one direction. The reasoning behind
that constraint is in `docs/architecture.md` §5 — read it before changing any
of these three.