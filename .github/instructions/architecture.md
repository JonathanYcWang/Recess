# Recess Architecture Instructions

Use when planning or changing file ownership, module boundaries, routing, or cross-cutting app behavior.

## Rules

- Preserve the existing React, TypeScript, Vite, Redux Toolkit, `HashRouter`, CSS Modules, and design-token architecture.
- Keep route-level screens in `src/pages`.
- Keep session-state-specific full-screen UI in `src/views`.
- Keep reusable UI in `src/components`.
- Keep hooks and orchestration boundaries in `src/hooks`.
- Keep reusable services and pure domain logic in `src/services`.
- Keep Redux actions, reducers, and selectors under `src/store`.
- Prefer compatibility-aware browser API boundaries over spreading raw extension API calls through UI code.
- Keep diffs minimal and scoped to the approved task.

