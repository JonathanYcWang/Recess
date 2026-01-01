# Recess Documentation

Welcome to the Recess Chrome extension documentation. These guides explain the system's architecture, behavior, and design decisions.

## Quick Start

**New to the codebase?** Read in this order:

1. **[Architecture Overview](./architecture.md)** - Start here. Understand the big picture.
2. **[Session Lifecycle](./session-lifecycle.md)** - Learn what happens during a focus session.
3. **[Time Calculations](./time-calculations.md)** - Understand momentum, fatigue, and dynamic durations.

**Working on a specific area?**

- **State management:** Read [State and Storage](./state-and-storage.md)
- **Something looks weird:** Check [Developer Notes](./developer-notes.md)

## Document Contents

### [architecture.md](./architecture.md)

**When to read:** First thing, or when making structural changes

**What's inside:**

- High-level system overview
- Chrome extension architecture (background script, UI, storage)
- Redux store structure
- Business logic layer (pure functions)
- Data flow diagrams
- Why we made these architectural choices

**Answers questions like:**

- "How do the background script and UI communicate?"
- "Why use Redux instead of React Context?"
- "Where does time calculation happen?"

---

### [session-lifecycle.md](./session-lifecycle.md)

**When to read:** Understanding the user flow, debugging transitions

**What's inside:**

- Complete walkthrough of a focus/break cycle
- All six session states explained
- What triggers each transition
- Exact state changes at each step
- Code locations for each stage

**Answers questions like:**

- "What happens when a user starts a focus session?"
- "How does the timer survive popup close/reopen?"
- "When does momentum get updated?"

---

### [time-calculations.md](./time-calculations.md)

**When to read:** Understanding or modifying the duration formulas

**What's inside:**

- Plain-language explanation of momentum, fatigue, and progress
- Focus session duration formula breakdown
- Break duration formula breakdown
- Example scenarios with actual numbers
- Why the formulas work this way

**Answers questions like:**

- "Why is my session 23 minutes instead of 25?"
- "How does completing sessions affect future durations?"
- "What makes breaks longer or shorter?"

---

### [state-and-storage.md](./state-and-storage.md)

**When to read:** Working with Redux, debugging persistence, adding new state

**What's inside:**

- Complete Redux state structure
- Chrome storage persistence strategy
- What survives popup close/reopen
- Daily reset behavior (and why there isn't one by default)
- Storage debugging techniques

**Answers questions like:**

- "Where is the timer state stored?"
- "How does state persist across sessions?"
- "Why doesn't momentum reset at midnight?"

---

### [developer-notes.md](./developer-notes.md)

**When to read:** Something looks strange, considering a refactor, onboarding

**What's inside:**

- Non-obvious design decisions explained
- Tradeoffs and why we made them
- Code patterns that might surprise you
- Known limitations and future improvements
- Performance considerations

**Answers questions like:**

- "Why use timestamps instead of interval counting?"
- "Why calculate durations in the reducer instead of a selector?"
- "Why is there no automatic daily reset?"

---

## Common Scenarios

### I want to understand how focus sessions work

1. Read [Session Lifecycle](./session-lifecycle.md) - Stages 1 and 2
2. Check [Time Calculations](./time-calculations.md) - Focus session duration section
3. Look at code: `src/store/slices/timerSlice.ts` → `startFocusSession`, `transitionToRewardSelection`

### I want to modify the duration formulas

1. Read [Time Calculations](./time-calculations.md) - Understand current formulas
2. Update constants in `src/lib/constants.ts`
3. Update formulas in `src/lib/session-duration-calculator.ts`
4. Test with different momentum/fatigue values
5. Update [Time Calculations](./time-calculations.md) with new examples

### I want to add a new feature

1. Identify what state is needed → Check [State and Storage](./state-and-storage.md)
2. Add slice to Redux → Follow pattern in `src/store/slices/`
3. Add storage key to middleware → Update `src/store/storageMiddleware.ts`
4. Update UI → Add component or view
5. Document decision in [Developer Notes](./developer-notes.md)

### Something is broken

1. Check Redux DevTools - Is state what you expect?
2. Check [Session Lifecycle](./session-lifecycle.md) - Are invariants violated?
3. Check [Developer Notes](./developer-notes.md) - Is this a known quirk?
4. Check chrome.storage - Run `chrome.storage.local.get(null, console.log)`

### I want to contribute

1. Read [Architecture](./architecture.md) - Understand the system
2. Check [Developer Notes](./developer-notes.md) - Learn the patterns
3. Look at existing code for similar features
4. Write your feature following the established patterns
5. Update relevant docs if you change behavior

---

## Documentation Philosophy

These docs follow a few principles:

**1. Explain "why", not just "what"**

- Code shows what the system does
- Docs explain why we made these choices

**2. Plain language over jargon**

- Assume reader knows React, not Recess
- Define domain-specific terms (momentum, fatigue, CEWMA)

**3. Concrete examples**

- Show actual numbers in calculations
- Walk through real scenarios
- Include code snippets for context

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
