# Recess Documentation Index

Welcome to the Recess Chrome extension documentation. These guides explain the system's architecture, behavior, and design decisions. Start here if you are new to the codebase or need to understand a specific feature or flow.

---

## Quick Start

**New to the codebase?** Read in this order:

1. [Architecture Overview](./architecture.md) — High-level system and data flow
2. [Session Lifecycle](./session-lifecycle.md) — What happens during a focus session
3. [Time Calculations](./time-calculations.md) — How durations are determined

**Working on a specific area?**

- [State and Storage](./state-and-storage.md) — Redux state structure and persistence
- [Developer Notes](./developer-notes.md) — Design decisions and tradeoffs

---

## Document Contents

- [architecture.md](./architecture.md): System overview, Chrome extension architecture, Redux store, business logic, data flow diagrams, and rationale for key decisions
- [session-lifecycle.md](./session-lifecycle.md): Complete walkthrough of a focus/break cycle, session states, transitions, state changes, and code locations
- [time-calculations.md](./time-calculations.md): Plain-language explanation of momentum, fatigue, progress, and duration formulas with real examples
- [state-and-storage.md](./state-and-storage.md): Complete Redux state structure, Chrome storage persistence, and debugging tips
- [developer-notes.md](./developer-notes.md): Non-obvious design decisions, tradeoffs, known limitations, and performance considerations

---

## Common Scenarios

- **Understand focus sessions:**

  1.  Read [Session Lifecycle](./session-lifecycle.md) (Stages 1 and 2)
  2.  Check [Time Calculations](./time-calculations.md) (Focus session duration)
  3.  See code: `src/store/slices/timerSlice.ts` → `startFocusSession`, `transitionToRewardSelection`

- **Modify duration formulas:**

  1.  Read [Time Calculations](./time-calculations.md)
  2.  Update constants in `src/lib/constants.ts`
  3.  Update formulas in `src/lib/session-duration-calculator.ts`
  4.  Test with different values
  5.  Update docs with new examples

- **Add a new feature:**

  1.  Identify required state ([State and Storage](./state-and-storage.md))
  2.  Add slice to Redux (`src/store/slices/`)
  3.  Add storage key to middleware (`src/store/storageMiddleware.ts`)
  4.  Update UI (add component or view)
  5.  Document in [Developer Notes](./developer-notes.md)

- **Debugging:**

  1.  Check Redux DevTools
  2.  Check [Session Lifecycle](./session-lifecycle.md)
  3.  Check [Developer Notes](./developer-notes.md)
  4.  Check chrome.storage: `chrome.storage.local.get(null, console.log)`

- **Contributing:**
  1.  Read [Architecture](./architecture.md)
  2.  Check [Developer Notes](./developer-notes.md)
  3.  Follow established patterns
  4.  Update docs if you change behavior

---

## Documentation Philosophy

1. **Explain "why", not just "what"** — Code shows what the system does; docs explain why choices were made
2. **Plain language over jargon** — Assume reader knows React, not Recess; define domain-specific terms
3. **Concrete examples** — Show actual numbers, walk through real scenarios, include code snippets

**4. Organized by task, not by file**

- Want to understand sessions? Read session-lifecycle.md
- Don't need to know which file contains what

**5. Living documents**

- Update docs when behavior changes
- Add to developer-notes.md when you find something surprising
- Keep examples current

---

## What's NOT Documented Here

**User-facing features:**

- This is developer documentation
- For user guides, see main README.md

**Setup instructions:**

- See SETUP.md in project root
- Covers installation, development, building

**Detailed API references:**

- Code has JSDoc comments
- Redux Toolkit and Chrome APIs have official docs
- We document our usage patterns, not the APIs themselves

---

## Quick Reference

**Key files by concern:**

| Concern         | Files                                                            |
| --------------- | ---------------------------------------------------------------- |
| Session flow    | `src/store/slices/timerSlice.ts`, `src/store/hooks/useTimer.ts`  |
| Calculations    | `src/lib/session-duration-calculator.ts`, `src/lib/constants.ts` |
| Persistence     | `src/store/storageMiddleware.ts`, `src/main.tsx`                 |
| Site blocking   | `src/background.ts`                                              |
| UI views        | `src/pages/views/*.tsx`                                          |
| State structure | `src/lib/types.ts`                                               |

**Constants:**

| Constant                     | Value      | Location       |
| ---------------------------- | ---------- | -------------- |
| Daily work target            | 4.5 hours  | `constants.ts` |
| Focus session countdown time | 10 seconds | `constants.ts` |
| Starting momentum            | 0.5        | `constants.ts` |
| Momentum alpha               | 0.5        | `constants.ts` |
| Base focus duration          | 10 minutes | `constants.ts` |
| Min focus duration           | 5 minutes  | `constants.ts` |
| Base break duration          | 5 minutes  | `constants.ts` |

**State shapes:**

See [State and Storage](./state-and-storage.md) for complete TypeScript interfaces.

---

## Feedback

If you found these docs helpful, or if something is unclear:

- Add clarifications to the relevant doc
- Add new sections to developer-notes.md for things you learned
- Update examples if behavior changes

The goal is for the next developer to have an even easier time than you did.

---

**Happy coding! 🎯**
