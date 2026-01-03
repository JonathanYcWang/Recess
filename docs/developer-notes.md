# Developer Notes

## Non-Obvious Decisions & Tradeoffs

This document covers intentional design decisions, tradeoffs, and rationale for patterns in the Recess codebase. All content is current as of the latest production release. Deprecated or removed features are not referenced here.

---

## Architecture Decisions

### 1. Redux Instead of React Context

**Why Redux?**

- **Persistence:** Timer state must persist across popup close/reopen. Redux middleware makes storage sync automatic and reliable. Context would require manual `useEffect` in every component, which is error-prone.
- **Temporal state:** Timer state changes every second. Redux allows "derived" reads without forcing re-renders, and selectors can optimize updates. Context would cause unnecessary re-renders.
- **DevTools:** Redux DevTools enables time-travel debugging and action history. Context does not.
- **Tradeoff:** More boilerplate and Redux concepts to learn, but worth it for complex, persistent timer behavior.

---

### 2. Timestamps Over Interval Counting

**Why timestamps?**

- **Accuracy:** Timestamps ensure timer accuracy even if the popup is closed, the computer sleeps, or the browser throttles intervals. Interval-based counters lose accuracy in these cases.
- **Persistence:** Storing a timestamp allows the timer to recover after popup reopen or background suspension. Counter-based approaches require more complex recovery logic.
- **Sleep mode:** Timestamps allow the timer to continue correctly after sleep; intervals would freeze.
- **Tradeoff:** Slightly more complex math, but much more reliable and robust.

---

### 3. Chrome's declarativeNetRequest Instead of webRequest

**Why declarativeNetRequest?**

- **Manifest V3 requirement:** Chrome deprecates `webRequest` blocking in MV3. `declarativeNetRequest` is required and more performant.
- **Performance:** Rules are evaluated natively, not in JavaScript, for lower CPU and battery usage.
- **Tradeoff:** Less flexible (can't block based on complex logic), but sufficient for our use case (simple URL pattern matching).

---

### 4. No Daily Auto-Reset

**Why not reset at midnight?**

- **Complexity:** Handling time zones, system date changes, and edge cases is error-prone.
- **Usage patterns:** Some users work across midnight or use the extension sporadically. Auto-reset could be disruptive.
- **Current approach:** Manual reset when the work session completes. No edge cases with date handling.
- **Future:** Could add opt-in daily reset, but default is "persist until manually reset."

---

### 5. Reward Selection is Gamification, Not Enforcement

**Why not restrict break access to only the selected reward?**

- **Technical limitation:** `declarativeNetRequest` is all-or-nothing per session state. Can't easily block "all except selected reward."
- **UX consideration:** Users may need to check email or do other tasks during breaks. Restricting to one site is overly punitive.
- **Purpose:** Reward selection is for gamification and motivation, not enforcement. Breaks are trust-based.
- User chose to use focus tool, assume they want to focus
- Don't need to be draconian

**Future consideration:**

- Could add "strict mode" setting
- Block all except reward during break
- Opt-in for users who want stricter enforcement

---

## Code Patterns

### 6. calculateRemaining() Called Every Second

**What you might think:**
"Why recalculate remaining time every tick? Why not store it?"

**Code:**

```typescript
// In useTimer hook
const remaining = calculateRemaining(
  state.initialFocusSessionDuration,
  state.focusSessionEntryTimeStamp
);
```

**Why not stored in state:**

**State would be redundant:**

- `remaining = initial - elapsed`
- `elapsed = (now - timestamp) / 1000`
- Therefore: `remaining = initial - (now - timestamp) / 1000`
- Storing `remaining` would be derived data

**Source of truth principle:**

- Timestamp is source of truth
- Everything else derives from it
- Updating `remaining` in state would require keeping it in sync with time
- Easier to recalculate

**Performance is fine:**

- Simple math operation
- Runs once per second
- No noticeable cost

**Pattern: Store sources of truth, derive everything else**

---

### 7. Two Duration Fields: `initial*` and `*Remaining`

**What you might think:**
"Why store both `initialFocusSessionDuration` and `focusSessionDurationRemaining`?"

**Why we need both:**

**When session is active (not paused):**

- `initial` + `timestamp` → Calculate remaining
- `remaining` field is ignored (derived in `useTimer`)

**When session is paused:**

- Timestamp is cleared (no more "start time")
- `remaining` stores how much time was left when paused
- When resumed, `remaining` becomes new `initial`, timestamp reset to `Date.now()`

**Example:**

```typescript
// Active: 25-minute session, 10 minutes elapsed
initial = 1500;
timestamp = 1234567890000;
remaining = calculateRemaining(1500, timestamp); // 900 seconds

// User pauses
remaining = 900; // Saved
timestamp = undefined; // Cleared

// User resumes
initial = 900; // Restored from remaining
timestamp = Date.now(); // Fresh start time
```

**Both are necessary for pause/resume functionality.**

---

### 8. Momentum Formula: Why 0.5 Alpha?

**What you might think:**
"Why halfway move? Why not fully update to new outcome?"

**Formula:**

```typescript
newMomentum = 0.5 * outcome + 0.5 * oldMomentum;
```

**Why 0.5:**

**Balance between responsiveness and stability:**

**Too high (e.g., 0.9):**

```typescript
newMomentum = 0.9 * outcome + 0.1 * oldMomentum;
```

- Very reactive to single session
- Momentum swings wildly
- User abandons one session → momentum tanks
- Hard to maintain high momentum

**Too low (e.g., 0.1):**

```typescript
newMomentum = 0.1 * outcome + 0.9 * oldMomentum;
```

- Very stable, slow to change
- Takes forever to recover from bad start
- Doesn't reflect current state
- User completes 10 sessions → momentum barely moves

**At 0.5:**

- Moves halfway toward outcome each time
- Responsive but not volatile
- Can recover from early struggles in 3-4 sessions
- Reflects recent performance

**Mathematical properties:**

- Converges to stable value if behavior is consistent
- If user completes every session → momentum → 1.0
- If user abandons every session → momentum → 0.0
- If user alternates → momentum → 0.5 (neutral)

**Empirical tuning:**

- 0.5 feels right for session completion patterns
- Could be configurable in future, but good default

---

### 9. Storage Middleware: Why Not Built-in Redux Persist?

**What you might think:**
"Why custom storage middleware? Redux Persist exists."

**Why custom:**

**Chrome storage API:**

- Redux Persist is designed for web localStorage
- Chrome extensions use `chrome.storage.local`
- Different API, async callback-based
- Would need adapter layer anyway

**Selective persistence:**

- Only persist certain slices
- Only persist certain fields (e.g., `workHours.entries`, not `workHours.isLoaded`)
- Custom middleware gives precise control

**Simplicity:**

- Custom middleware is ~50 lines
- Redux Persist is full library with config
- Our needs are simple (serialize JSON, write to chrome.storage)

**Tradeoff:**

- Maintain our own persistence logic
- But it's simple and works well for our use case

---

### 10. Views Are Separate Components, Not Routes

**What you might think:**
"Why not use React Router for BEFORE_SESSION, DURING_SESSION, etc.?"

**Why views are conditionally rendered:**

**State-driven, not URL-driven:**

- Session state is in Redux, not URL
- Transitioning from DURING_SESSION → BREAK is a state change, not navigation
- No meaningful URL to represent "35 seconds into break with YouTube reward selected"

**Avoid URL interference:**

- User could manually edit URL
- Browser back/forward would break session flow
- No benefit to having URLs for session states

**Settings ARE routes:**

- `/settings/blocked-sites` is a real page
- Can bookmark, share, navigate to
- Makes sense as URL

**Pattern:**

- URLs for user-navigable pages (settings)
- State for linear workflows (session flow)

---

## Performance Optimizations (or Lack Thereof)

### 11. No Memoization in useTimer Hook

**What you might think:**
"useTimer returns lots of functions, shouldn't they be useCallback?"

**Why not (currently):**

**Premature optimization:**

- `useTimer` is called once in MainPage
- Functions are passed down to child views
- Views don't re-render unnecessarily (Redux selectors)
- No noticeable performance impact

**When it WOULD matter:**

- If views were re-rendering on every second tick (they're not)
- If functions were dependencies in child useEffects (they're not)
- If profiling showed this as bottleneck (it doesn't)

**Future optimization:**

- Could add `useCallback` to all returned functions
- Would prevent re-creation on every render
- But currently not needed

**Pattern: Optimize when profiling shows actual issue, not preemptively**

---

### 12. Redux State Updates Every Second

**What you might think:**
"Timer state updating every second seems wasteful, should we debounce?"

**Why we don't:**

**Not actually updating Redux:**

```typescript
// In useTimer hook
const remaining = calculateRemaining(...)  // Calculated, not from Redux

// Redux state only updates when:
// - User clicks pause/resume
// - Session transitions to new state
// - Not on every tick
```

**What updates every second:**

- Local `tick` state in `useTimer` (forces re-render)
- Derived `remaining` calculation
- Not Redux store

**Why this is fine:**

- Re-render of MainPage + child views is cheap
- Virtual DOM diffs are minimal (only time string changes)
- No storage writes (middleware only reacts to Redux actions)

**If we debounced:**

- UI wouldn't update smoothly (countdown would jump)
- User experience would degrade

**Pattern: Update UI frequently, persist state infrequently**

---

## Future Extensibility

### 13. Why Calculate Durations in timerSlice Instead of Selector?

**What you might think:**
"Calculation could be memoized selector, why do it in reducer?"

**Current:**

```typescript
// In timerSlice reducer
transitionToRewardSelection: (state) => {
  const durations = calculateNextSessionDurations(state);
  state.nextFocusDuration = durations.nextFocusDuration;
  state.nextBreakDuration = durations.nextBreakDuration;
};
```

**Alternative (selector):**

```typescript
// Could be:
const selectNextFocusDuration = createSelector(
  [selectMomentum, selectFatigue, selectProgress],
  (m, f, p) => calculateFocusSessionDuration(m, f, p)
);
```

**Why not:**

**Pre-calculation is intentional:**

- Duration is calculated ONCE when session ends
- Locked in for next session
- Doesn't change dynamically during REWARD_SELECTION or BREAK

**If we used selector:**

- Duration would recalculate on every state read
- Would need to "lock" value somehow
- More complex

**Tradeoff:**

- Stored duration is redundant (could be derived)
- But clearer semantics ("this is the next session length, decided now")
- User sees consistent duration in UI

---

### 14. isLoaded Flags in State

**What you might think:**
"Why do blockedSites and workHours have `isLoaded` flags?"

**Purpose:**

**Distinguish between:**

1. State not loaded yet (initial render)
2. State loaded, but empty (user has no entries)

**Without flag:**

```typescript
if (entries.length === 0) {
  // Is this "loading..." or "no entries"?
}
```

**With flag:**

```typescript
if (!isLoaded) {
  return <Loading />;
}
if (entries.length === 0) {
  return <EmptyState />;
}
return <EntryList entries={entries} />;
```

**When it matters:**

- Loading spinner vs. empty state message
- Don't want to show "No blocked sites" before data loads
- Clearer UX

**Alternative:**

- Could use loading slice in Redux
- Could check for `undefined` vs. empty array
- But explicit flag is clearest

---

## Testing Considerations

### 15. Why No Unit Tests (Yet)?

**What you might think:**
"Production code should have tests, where are they?"

**Current state:**

- Time calculation functions (`session-duration-calculator.ts`) are pure, easy to test
- Redux reducers are straightforward, could use Redux testing utilities
- Components could use React Testing Library

**Why not yet:**

- Prototype/MVP phase
- Formulas are well-documented and manually tested
- Comprehensive documentation exists (you're reading it!)

**When tests would be valuable:**

**1. Calculation functions:**

```typescript
describe('calculateFatigue', () => {
  it('returns 0 for no work completed', () => {
    expect(calculateFatigue(0, 270, 0)).toBe(0);
  });

  it('increases quadratically with progress', () => {
    const f1 = calculateFatigue(135, 270, 30); // 50% done
    const f2 = calculateFatigue(270, 270, 30); // 100% done
    expect(f2).toBeGreaterThan(f1 * 2); // More than linear
  });
});
```

**2. Session transitions:**

```typescript
describe('transitionToRewardSelection', () => {
  it('increases momentum when session completed', () => {
    const state = { momentum: 0.5, ... }
    const result = timerReducer(state, transitionToRewardSelection())
    expect(result.momentum).toBeGreaterThan(0.5)
  })
})
```

**3. Integration tests:**

- Test full session flow
- Test pause/resume
- Test early exit

**Future task:**

- Add tests before formula changes
- Regression testing for complex state transitions

---

## Quirks & Edge Cases

### 16. Background Script Logs Don't Persist

**Gotcha:**
Chrome service workers (background scripts) restart frequently.

**What this means:**

```javascript
console.log('Blocking rules updated'); // Logs might disappear
```

**To debug background script:**

1. Go to `chrome://extensions`
2. Enable Developer Mode
3. Click "Service worker" under Recess extension
4. Keep that console open (stays alive)

**Alternatively:**

```javascript
// Log to storage for persistence
chrome.storage.local.set({ lastLog: 'Blocking rules updated' });
```

---

### 17. Popup Dimensions Are Fixed

**Quirk:**
Extension popup has constrained size in browser.

**Current approach:**

- Designed for 400px width
- Height varies by content
- Scrolls if needed

**Why not responsive:**

- Popup is not a full browser tab
- Limited space
- Fixed dimensions simplify layout

**If opened in tab (clicking extension icon):**

- Opens in full tab, more space
- Same UI, just more room

---

### 18. Timer Precision Is ~1 Second, Not Exact

**Reality:**

```typescript
setInterval(fn, 1000); // Runs approximately every 1000ms
```

**Actual timing:**

- Browser may throttle intervals (±100ms variance)
- System sleep pauses intervals
- High CPU load delays intervals

**Why this is OK:**

- Using timestamp-based calculation compensates
- User perception: 1-second granularity is fine
- Don't need millisecond precision for focus timer

**If we needed exact timing:**

- Would use `requestAnimationFrame` + timestamps
- Would use Web Workers for background timing
- But unnecessary for this use case

---

## Lessons Learned

### 19. Don't Fight Chrome's Extension Lifecycle

**Early mistake:**
Tried to keep timer running in background script.

**Problem:**

- Service workers terminate after 5 minutes of inactivity
- Can't rely on long-running background timers
- Chrome kills them aggressively

**Solution:**

- Store timestamps, calculate on-demand
- UI re-renders show live countdown
- Background script only manages blocking rules
- No background timers needed

**Lesson:** Work with the platform, not against it

---

### 20. Documentation Is a Feature

**This might seem obvious, but:**
Complex formulas need plain-language explanation.

**Why these docs exist:**

- Momentum/fatigue formulas are not self-explanatory from code
- Future maintainer (or you in 6 months) will need context
- Users might ask "why is my session X minutes?"

**Investment in docs saves time:**

- Debugging: Check docs before diving into code
- Feature changes: Understand impact before coding
- Onboarding: New contributor reads docs, not entire codebase

**Lesson:** Document the "why", not just the "what"

---

## Known Limitations

### 21. No Cross-Device Sync

**Current:** State is local to device

**Implication:**

- Momentum on laptop ≠ momentum on desktop
- Can't continue session across devices
- Each device is independent

**Why:**

- Timer state is device-specific (timestamp is absolute time)
- Syncing active timer would be complex
- Most users only use one device for focused work

**Possible future feature:**

- Sync blocked sites and work hours via `chrome.storage.sync`
- But NOT active timer state

---

### 22. No Notification Support (Yet)

**Current:** User must have popup open to see timer

**Limitation:**

- If popup closed, user might forget to take break
- No reminder to start next session

**Future improvement:**

- Chrome notifications when session ends
- "Break over, time to focus!" notification
- Requires `notifications` permission

---

### 23. Work Hours Are Configured But Not Enforced

**Current:** User can set work hours, but they don't affect behavior

**Why:**

- Feature was planned but not prioritized
- UI exists, data persists, logic not implemented

**Future use:**

- Show "Outside work hours" message
- Adjust target work duration based on schedule
- Reminder notifications during configured hours

---

## Closing Thoughts

This codebase prioritizes:

1. **Reliability** - Timestamp-based timing, robust persistence
2. **Clarity** - Pure functions, documented formulas, explicit state
3. **Simplicity** - No premature optimization, no over-engineering

Things that might look "simple" (like storage middleware) are intentionally kept simple. Things that look "complex" (like momentum formulas) have that complexity documented and justified.

When in doubt, refer to:

- `architecture.md` for high-level structure
- `session-lifecycle.md` for flow understanding
- `time-calculations.md` for formula details
- This file for "why the weird thing?"

The goal is for any developer to be productive within an hour of reading these docs.
