# Redux Instructions

Use when changing Redux state, actions, reducers, selectors, persistence, or hydration.

## Rules

- Use Redux Toolkit.
- Follow the existing `actions`, `reducers`, and `selectors` folder convention.
- Use `createAction` and `createReducer`.
- Do not introduce switch-based reducers.
- Add selectors for state reads.
- Re-export selectors from `src/store/selectors/index.ts`.
- If a new slice is persisted, update storage keys and hydration logic.
- Consider backward compatibility with existing stored state.
- Preserve TypeScript strictness and avoid `any`.

