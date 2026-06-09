# React Instructions

Use when changing React components, hooks, pages, views, or UI state flow.

## Rules

- Use functional components only.
- Use explicit prop interfaces, usually `ComponentNameProps`.
- Prefer simple components with clear inputs.
- Avoid unnecessary local state.
- Avoid effects unless synchronizing with an external system.
- Keep business logic out of presentational components.
- Keep timer orchestration inside hooks, services, reducers, or dedicated orchestration boundaries.
- Use `@/*` imports for source files.

