# Session Lifecycle

## Overview

A "session" in Recess refers to one complete work/break cycle. This document walks through what happens at each stage, where the logic lives, and what state changes occur. All features (sessions, breaks, blockers, notifications) are described in terms of user intent, triggering events, execution flow, state changes, and failure modes.

## The Complete Cycle

```
BEFORE_WORK_SESSION
  ↓
ONGOING_FOCUS_SESSION (e.g., 20 min)
  ↓
REWARD_SELECTION
  ↓
ONGOING_BREAK_SESSION (e.g., 10 min)
  ↓
FOCUS_SESSION_COUNTDOWN (10 sec)
  ↓
ONGOING_FOCUS_SESSION (next focus session)
  ↓
... repeat until work session target met ...
  ↓
WORK_SESSION_COMPLETE
```

---

## Stage 1: BEFORE_WORK_SESSION

**User Intent:** Prepare to start a day’s work session.

**What the user sees:**

- Summary of remaining work time for the day
- Duration of next focus session
- "Start Focus Session" button

**Execution Flow:**

- Timer is idle, waiting for user to begin
- Session durations are pre-calculated based on momentum, fatigue, and progress

**State:**

```typescript
{
  sessionState: 'BEFORE_WORK_SESSION',
  nextFocusDuration: <calculated value>,
  nextBreakDuration: <calculated value>,
  workSessionDurationRemaining: <remaining daily target>,
  momentum: <from previous session or 0.5 for new day>,
  completedWorkMinutesToday: <accumulated work>,
  lastCompletedFocusSessionMinutes: <length of last session>
}
```

**Trigger to next state:** User clicks "Start Focus Session"

**Action dispatched:**

```typescript
dispatch(startFocusSession());
```

**Code location:**

- View: `src/pages/views/BeforeWorkSessionView.tsx`
- Action: `src/store/slices/timerSlice.ts` → `startFocusSession` reducer

**State changes:**

```typescript
sessionState: 'DURING_SESSION';
focusSessionDurationRemaining: nextFocusDuration;
focusSessionEntryTimeStamp: Date.now(); // Countdown starts from now
initialFocusSessionDuration: nextFocusDuration;
isPaused: false;
```

**Side effects:**

- `background.ts` detects state change via storage listener
- Creates blocking rules for all sites in `blockedSites` array using `declarativeNetRequest`
- Blocked sites now redirect to extension popup

---

## Stage 2: ONGOING_FOCUS_SESSION

**What the user sees:**

- Live countdown timer showing focus session time remaining
- "Pause" button
- "End Session" button (for early exit)

**What's happening:**

- `useTimer` hook runs a 1-second interval
- Every second, calculates remaining time:
  ```typescript
  remaining = initialDuration - Math.floor((Date.now() - entryTimestamp) / 1000);
  ```
- When `remaining <= 0`, automatically transitions to next state

**State:**

```typescript
{
  sessionState: 'ONGOING_FOCUS_SESSION',
  focusSessionDurationRemaining: <decreasing value>,
  focusSessionEntryTimeStamp: <timestamp>,
  initialFocusSessionDuration: <starting value>,
  isPaused: false
}
```

**Optional: Pause/Resume**

- User can pause:
  ```typescript
  dispatch(pauseSession());
  // Saves current remaining time, clears timestamp
  isPaused: true;
  ```
- User resumes:
  ```typescript
  dispatch(resumeSession());
  // Restores timestamp to Date.now(), uses saved remaining time as new initial duration
  isPaused: false;
  ```

**Trigger to next state:**
Either:

1. Timer reaches 0 (normal completion)
2. User clicks "End Session" early

**Trigger to next state:**

- Timer reaches 0 (normal completion)
- User clicks "End Session" early

**Normal completion:**

```typescript
// useTimer detects remaining <= 0
// Recalculate durations (will be shorter due to momentum penalty)
```

**Early exit:**

```typescript
// User clicks "End Session"
nextFocusDuration: <recalculated>
```

**Code location:**

- View: `src/pages/views/OngoingFocusSessionView.tsx`
- Actions: `src/store/slices/timerSlice.ts` → `transitionToRewardSelection`, `endSessionEarly`
- Timer logic: `src/store/hooks/useTimer.ts`

**State changes (normal completion):**

```typescript
// Update momentum - session was completed
momentum: updateCEWMA(currentMomentum, true)
// Track work completed (convert to minutes)
completedWorkMinutesToday: += secondsToMinutes(initialFocusSessionDuration)
lastCompletedFocusSessionMinutes: secondsToMinutes(initialFocusSessionDuration)
// Recalculate next session durations with updated momentum/fatigue
nextFocusDuration: calculateFocusSessionDuration(newMomentum, newFatigue, newProgress)
nextBreakDuration: calculateBreakDuration(newFatigue, newProgress, newMomentum)
// Reduce daily work remaining
workSessionDurationRemaining: -= initialFocusSessionDuration
// Transition to reward selection or completion
sessionState: workRemaining > 0 ? 'REWARD_SELECTION' : 'WORK_SESSION_COMPLETE'
focusSessionEntryTimeStamp: undefined  // Clear timestamp
```

**State changes (early exit):**

```typescript
// Update momentum - session was abandoned
nextBreakDuration: <recalculated>

// Reduce daily work by partial amount
workSessionDurationRemaining: -= completedPortion

sessionState: workRemaining > 0 ? 'REWARD_SELECTION' : 'WORK_SESSION_COMPLETE'
```

**Side effects:**

- Interval is cleared when transitioning out
- Blocking rules removed (happens when state !== 'ONGOING_FOCUS_SESSION')

---

## Stage 3: REWARD_SELECTION

**What the user sees:**

- Three randomly generated reward options
- Each reward = a blocked site + duration (5-30 minutes in 5-minute increments)
- Reroll buttons (3 rerolls per session)

**What's happening:**

- `useTimer` generates 3 random rewards on mount
- Each reward is a site from `blockedSites` + random duration
- User chooses which site they want access to during break

**State:**

```typescript
{
  sessionState: 'REWARD_SELECTION',
  generatedRewards: [
    { id: '...', name: 'youtube.com', duration: '15 min', durationSeconds: 900 },
    { id: '...', name: 'reddit.com', duration: '10 min', durationSeconds: 600 },
    { id: '...', name: 'instagram.com', duration: '20 min', durationSeconds: 1200 }
  ],
  rerolls: 3,  // Can reroll individual rewards
  nextFocusDuration: <pre-calculated for next session>,
  nextBreakDuration: <pre-calculated>
}
```

**Trigger to next state:**
User clicks on a reward card

**Action dispatched:**

```typescript
dispatch(selectReward(reward));
```

**Code location:**

- View: `src/pages/views/RewardSelectionView.tsx`
- Action: `src/store/slices/timerSlice.ts` → `selectReward`
- Reward generation: `src/store/hooks/useTimer.ts` → `generateReward`

**State changes:**

```typescript
sessionState: 'BREAK';
selectedReward: reward;
breakSessionDurationRemaining: reward.durationSeconds;
breakSessionEntryTimeStamp: Date.now();
initialBreakSessionDuration: reward.durationSeconds;
nextBreakDuration: reward.durationSeconds; // Overrides pre-calculated value
```

**Side effects:**

- Break timer starts immediately
- **Site blocking is still removed** (happened when focus session ended)
- User can access ALL sites during break, not just the reward site
- Reward selection is more of a motivational/gamification feature than enforcement

---

## Stage 4: ONGOING_BREAK_SESSION

**What the user sees:**

- Live countdown timer showing break time remaining
- "End Break" button (for early exit)
- Display of selected reward

**What's happening:**

- `useTimer` runs 1-second interval (same as focus session)
- Counts down break time
- When reaches 0, transitions to BACK_TO_IT

**State:**

```typescript
{
  sessionState: 'ONGOING_BREAK_SESSION',
  breakSessionDurationRemaining: <decreasing>,
  breakSessionEntryTimeStamp: <timestamp>,
  initialBreakSessionDuration: <starting value>,
  selectedReward: { name: 'youtube.com', ... }
}
```

**Trigger to next state:**
Either:

1. Timer reaches 0 (normal)
2. User clicks "End Break" early

**Action dispatched:**

```typescript
dispatch(transitionToFocusSessionCountdown());
```

**Code location:**

- View: `src/pages/views/OngoingBreakSessionView.tsx`
- Actions: `src/store/slices/timerSlice.ts` → `transitionToFocusSessionCountdown`, `endSessionEarly`

**State changes:**

```typescript
sessionState: 'FOCUS_SESSION_COUNTDOWN';
focusSessionCountdownTimeRemaining: DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME; // Fixed 10 seconds
focusSessionCountdownEntryTimeStamp: Date.now();
initialFocusSessionCountdownDuration: DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME;
breakSessionEntryTimeStamp: undefined;
isPaused: false;
```

---

## Stage 5: FOCUS_SESSION_COUNTDOWN

**What the user sees:**

- 10-second countdown
- "Get ready to focus" message
- Automatic transition (no user input)

**What's happening:**

- Short transition period to mentally prepare for next focus session
- Gives user time to close reward site tabs
- Automatically transitions when countdown reaches 0

**State:**

```typescript
{
  sessionState: 'FOCUS_SESSION_COUNTDOWN',
  focusSessionCountdownTimeRemaining: <10, 9, 8, ...>,
  focusSessionCountdownEntryTimeStamp: <timestamp>,
  initialFocusSessionCountdownDuration: 10,
  nextFocusDuration: <already calculated>,
  nextBreakDuration: <already calculated>
}
```

**Trigger to next state:**
Timer reaches 0 (automatic)

**Action dispatched:**

```typescript
dispatch(transitionToFocusSession());
```

**Code location:**

- View: `src/pages/views/FocusSessionCountdownView.tsx`
- Action: `src/store/slices/timerSlice.ts` → `transitionToFocusSession`

**State changes:**

```typescript
sessionState: 'ONGOING_FOCUS_SESSION';
focusSessionDurationRemaining: nextFocusDuration;
focusSessionEntryTimeStamp: Date.now();
initialFocusSessionDuration: nextFocusDuration;
focusSessionCountdownEntryTimeStamp: undefined;
focusSessionCountdownTimeRemaining: DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME; // Reset for next time
```

**Side effects:**

- `background.ts` detects sessionState change
- Re-enables site blocking for `blockedSites`
- Cycle repeats from Stage 2

---

## Stage 6: WORK_SESSION_COMPLETE

**What the user sees:**

- Congratulations message
- Summary of work completed
- "Done for today" or "Start new session" options

**What's happening:**

- User has completed their daily work target
- Timer is functionally done
- User can either:
  - Close extension (state persists)
  - Reset timer to start fresh session

**State:**

```typescript
{
  sessionState: 'WORK_SESSION_COMPLETE',
  workSessionDurationRemaining: 0,
  completedWorkMinutesToday: <meets or exceeds target>,
  momentum: <final value>,
}
```

**Trigger to next state:**
User can:

1. Close extension (no state change)
2. Manually reset timer

**Action dispatched:**

```typescript
dispatch(resetTimer()); // If user wants to start fresh
```

**Code location:**

- View: `src/pages/views/WorkSessionCompleteView.tsx`
- Action: `src/store/slices/timerSlice.ts` → `resetTimer`

---

## Key Calculation Points

### When durations are calculated:

**Initial load:**

- `timerSlice.ts` calculates initial `nextFocusDuration` and `nextBreakDuration` based on starting state (momentum=0.5, fatigue=0, progress=0)

**After each focus session:**

- `transitionToRewardSelection` or `endSessionEarly` recalculates durations based on updated momentum, fatigue, and progress

**Where:**

- All calculations happen in `timerSlice.ts` using pure functions from `session-duration-calculator.ts`

### When momentum updates:

**Increase:** After successful focus session completion (user didn't end early)

```typescript
momentum = updateCEWMA(momentum, true); // Moves toward 1.0
```

**Decrease:** After early session exit

```typescript
momentum = updateCEWMA(momentum, false); // Moves toward 0.0
```

**Formula:**

```typescript
newMomentum = 0.5 * outcome + 0.5 * oldMomentum;
// outcome = 1 if completed, 0 if abandoned
```

### When fatigue updates:

**After every focus session** (both completed and partial):

```typescript
fatigue = calculateFatigue(
  completedWorkMinutesToday,
  targetWorkMinutesToday,
  lastCompletedSessionMinutes
);
```

**Components:**

- Base fatigue from total work done (squared)
- Session strain from size of last session (squared)

---

## Persistence & Resume

**Timer survives popup close/reopen:**

When popup reopens:

1. `main.tsx` calls `loadStateFromStorage()`
2. Redux store hydrates with saved state
3. If `sessionState === 'ONGOING_FOCUS_SESSION'` and `focusSessionEntryTimeStamp` exists:
   - Timer automatically resumes
   - Calculates remaining time from timestamp
   - No accumulated time is lost

**This works because:**

- We store timestamps, not intervals
- Remaining time is calculated from absolute time, not ticks
- Background script maintains blocking rules independently

---

## State Invariants

Things that should always be true:

1. **If sessionState === 'ONGOING_FOCUS_SESSION'**, then `focusSessionEntryTimeStamp` exists (unless paused)
2. **If sessionState === 'ONGOING_BREAK_SESSION'**, then `breakSessionEntryTimeStamp` exists
3. **If sessionState === 'FOCUS_SESSION_COUNTDOWN'**, then `focusSessionCountdownEntryTimeStamp` exists
4. **`workSessionDurationRemaining`** is always >= 0
5. **`momentum`** is always between 0 and 1
6. **`completedWorkMinutesToday`** is monotonically increasing (never decreases)

If any of these are violated, it indicates a bug in transition logic.

---

## Debugging Tips

**To understand current state:**

1. Open Redux DevTools in the extension popup
2. Look at `timer` slice
3. Check `sessionState` and corresponding timestamp fields

**To trace a transition:**

1. Set breakpoint in `timerSlice.ts` reducer
2. Watch state changes before/after
3. Check if calculations match expected formulas

**If timer seems "stuck":**

- Check if timestamp exists for current state
- Verify `useTimer` interval is running (should tick every second)
- Check if transition condition is being met (remaining <= 0)

**If blocking isn't working:**

- Check `background.ts` console logs
- Verify `blockedSites` array is populated
- Verify `sessionState === 'ONGOING_FOCUS_SESSION'`
- Check Chrome's declarativeNetRequest rules in `chrome://extensions` (Developer mode → Service worker → Network)
