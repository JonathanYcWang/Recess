---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Code Style & Layer Contracts — Recess

Mechanical rules. Enforceable by inspection or a script. Architectural intent
and rationale live in `docs/architecture.md`.

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

## Layer contracts

Import direction is one-way: `UI` → `Shared`, `Background` → `Shared`.
`Shared` imports from neither.

Violations:

1. `chrome.*` outside `/Background/Adapters`, `/Background/Repositories`, `/Shared/ActionBrokers`
2. `storage.` writes outside `/Background/Repositories`
3. `/UI` importing from `/Background` directly
4. `/Shared` importing from `/UI` or `/Background`
5. `any`, `unknown`, or `as` casts
6. Classes or `function` declarations in `src/`
7. Business logic placed in an adapter, repository, ActionHandlers wiring, util, or Redux layer — logic belongs in services
8. A second path to storage, the Redux store, or browser messaging
9. A reverse hop in the data flow (background → ActionBroker → Redux → components)

1-6 are mechanically checkable. 7-9 need judgment against `docs/architecture.md`.

## Security boundaries

MV3 extension. The threat model that applies here:

- **Everything crossing `browser.runtime` messaging is untrusted input.** Validate
  at the boundary with the Zod schemas in `src/Shared/Schema/`.
- **Persisted state is user-writable.** Any field read back from storage must be
  re-validated, not trusted.
- **Block List entries and UI text are user input.** Unescaped interpolation of
  these into the DOM is an XSS sink.
- **`chrome.*` leaks the polyfill boundary** and bypasses cross-browser safety.
- **Manifest permissions must not exceed** what the feature needs.

Zod schemas are not optional on the storage or messaging paths — they are the
boundary. Route through them rather than hand-rolling guards.