# State and Storage

## Overview

Recess uses **Redux for state management** and **Chrome Storage API for persistence**. This document explains what state exists, where it lives, how it persists, and how the daily reset works (or doesn't).

---

## State Structure

The Redux store has four slices:

```typescript
{
  timer: TimerState,
  workHours: WorkHoursState,
  blockedSites: BlockedSitesState,
  routing: RoutingState
}
```

---

### 1. Timer State

**Purpose:** Tracks the session lifecycle, work progress, and dynamic calculations

**Shape:**

```typescript
interface TimerState {
  // Session lifecycle
  sessionState:
    | 'BEFORE_WORK_SESSION'
    | 'ONGOING_FOCUS_SESSION'
    | 'REWARD_SELECTION'
    | 'ONGOING_BREAK_SESSION'
    | 'FOCUS_SESSION_COUNTDOWN'
    | 'WORK_SESSION_COMPLETE';
  isPaused: boolean;

  // Daily work tracking
  workSessionDurationRemaining: number; // Seconds left toward daily target
  initialWorkSessionDuration: number; // Starting value (4.5 hours default)

  // Current focus session
  focusSessionDurationRemaining: number; // Seconds left in current session
  initialFocusSessionDuration: number; // Starting value for current session
  focusSessionEntryTimeStamp?: number; // When session started (ms)

  // Current break
  breakSessionDurationRemaining: number; // Seconds left in break
  initialBreakSessionDuration: number; // Starting value for break
  breakSessionEntryTimeStamp?: number; // When break started (ms)

  // Focus Session Countdown - Transition period before returning to focus
  focusSessionCountdownTimeRemaining: number; // Seconds in transition
  initialFocusSessionCountdownDuration: number; // Always 10 seconds
  focusSessionCountdownEntryTimeStamp?: number; // When transition started (ms)

  // Reward system
  rerolls: number; // Rerolls available (3 default)
  selectedReward: Reward | null; // User's chosen reward
  generatedRewards: Reward[]; // Available reward options

  // Dynamic calculation inputs
  momentum: number; // CEWMA score (0-1)
  completedWorkMinutesToday: number; // Total work done (minutes)
  targetWorkMinutesToday: number; // Daily goal (270 min = 4.5 hrs)
  lastCompletedFocusSessionMinutes: number; // Length of last session

  // Pre-calculated durations
  nextFocusDuration: number; // Calculated focus session length (seconds)
  nextBreakDuration: number; // Calculated break length (seconds)
  lastFocusSessionCompleted: boolean; // Whether last session was completed or abandoned
}
```

**Storage key:** `'timerState'`

**Persistence:** Entire state object is saved to chrome.storage.local after every action

**Why so many "duration" fields?**

- `initial*` = Starting value when timer began (for calculating elapsed)
- `*Remaining` = Current remaining time (for display)
- `next*` = Pre-calculated value for next session (before it starts)

**Why timestamps?**

- Used to calculate remaining time accurately: `remaining = initial - (now - timestamp)`
- Survives popup close/reopen
- Immune to missed intervals or sleep mode

---

### 2. Work Hours State

**Purpose:** User's configured work schedule (optional feature)

**Shape:**

```typescript
interface WorkHoursState {
  entries: WorkHoursEntry[];
  isLoaded: boolean;
}

interface WorkHoursEntry {
  id: string; // Unique ID (timestamp-based)
  startTime: string; // e.g., "9:00 AM"
  endTime: string; // e.g., "5:00 PM"
  days: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  enabled: boolean; // Can be toggled on/off
}
```

**Example:**

```typescript
{
  entries: [
    {
      id: "1234567890",
      startTime: "9:00 AM",
      endTime: "12:00 PM",
      days: [false, true, true, true, true, true, false],  // Mon-Fri
      enabled: true
    },
    {
      id: "1234567891",
      startTime: "1:00 PM",
      endTime: "5:00 PM",
      days: [false, true, true, true, true, true, false],
      enabled: true
    }
  ],
  isLoaded: true
}
```

**Storage key:** `'workHours'`

**Persistence:** Array of entries is saved after every add/update/delete/toggle

**Current usage:** Configured by user but not actively enforced (future feature for notifications/reminders)

---

### 3. Blocked Sites State

**Purpose:** Sites to block during focus sessions

**Shape:**

```typescript
interface BlockedSitesState {
  sites: string[];
  isLoaded: boolean;
}
```

**Example:**

```typescript
{
  sites: [
    "youtube.com",
    "instagram.com",
    "facebook.com",
    "reddit.com",
    "netflix.com",
    // ... user's custom sites
  ],
  isLoaded: true
}
```

**Storage key:** `'blockedSites'`

**Persistence:** Array is saved after every add/remove

**Default sites:**

```typescript
const DEFAULT_SITES = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'messenger.com',
  'web.whatsapp.com',
  'discord.com',
  'tiktok.com',
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'reddit.com',
];
```

Loaded on first install, then user can add/remove.

---

### 4. Routing State

**Purpose:** Track whether user has completed onboarding

**Shape:**

```typescript
interface RoutingState {
  hasOnboarded: boolean;
}
```

**Storage key:** `'hasOnboarded'`

**Persistence:** Boolean is saved when user completes onboarding

**Usage:** Controls whether MainPage shows WelcomeView or timer interface

---

## Persistence Strategy

### How It Works

**Automatic persistence via middleware:**

1. User action occurs (e.g., clicks "Start Focus Session")
2. Redux action is dispatched
3. Reducer updates state
4. **Storage middleware** intercepts the action
5. If action type matches a slice (e.g., `timer/*`), saves that slice to chrome.storage.local
6. Background script (if needed) receives storage change event

**Code location:**
`src/store/storageMiddleware.ts`

**Middleware logic:**

```typescript
// After every action, check which slice changed
if (action.type.startsWith('timer/')) {
  chrome.storage.local.set({ timerState: state.timer });
}
if (action.type.startsWith('workHours/')) {
  chrome.storage.local.set({ workHours: state.workHours.entries });
}
// etc.
```

### Initialization (Loading Saved State)

**On extension open:**

1. `main.tsx` runs before React renders
2. Calls `loadStateFromStorage()` - reads all keys from chrome.storage.local
3. Dispatches actions to hydrate Redux store with saved values
4. React renders with loaded state

**Code location:**
`src/main.tsx`

**Logic:**

```typescript
loadStateFromStorage().then((savedState) => {
  if (savedState.timer) {
    store.dispatch(updateTimerState(savedState.timer));
  }
  if (savedState.workHours) {
    store.dispatch(setWorkHours(savedState.workHours));
  }
  // etc.
});
```

**Why this approach?**

- State is loaded before first render (no flash of default state)
- Redux is single source of truth (chrome.storage is just persistence layer)
- Easy to reason about - Redux state always matches storage

---

## What Persists Across Sessions

### Timer State Persistence

**Survives popup close/reopen:**

- Current session state
- Timestamps (for countdown calculation)
- Work completed today
- Momentum, fatigue, progress
- Selected reward

**Example scenario:**

User starts 25-minute focus session, closes popup after 10 minutes.

**Saved state:**

```typescript
{
  sessionState: 'ONGOING_FOCUS_SESSION',
  focusSessionEntryTimeStamp: 1234567890000,  // Absolute time when started
  initialFocusSessionDuration: 1500,          // 25 minutes in seconds
  focusSessionDurationRemaining: 900,         // Not used for calculation
  // ...
}
```

User reopens popup 5 minutes later (15 minutes into session):

**On load:**

```typescript
const elapsed = Math.floor((Date.now() - 1234567890000) / 1000); // 900 seconds
const remaining = 1500 - 900; // 600 seconds = 10 minutes left
```

Timer resumes at 10:00, continues countdown normally.

**Key insight:** We store timestamps, not intervals. This makes persistence trivial.

---

## Daily Reset Behavior

### Current Implementation: **No Automatic Reset**

**What this means:**

- Momentum, fatigue, and completed work persist indefinitely
- If you complete your 4.5-hour goal Monday, then open the extension on Tuesday, it still shows as complete
- No built-in concept of "new day"

**Why?**

- Simplicity - no background timers or date checking
- User can manually reset if desired
- Extension usage patterns vary (some users may not use it daily)

**How to reset manually:**

- Complete your session (reach 0 work remaining) → Shows "Session Complete" view
- Click "Start New Session" or similar → Dispatches `resetTimer()`
- OR: Uninstall/reinstall extension (clears storage)

### Future Improvement: Automatic Daily Reset

**How you would implement it:**

1. **Add `lastResetDate` to timer state:**

   ```typescript
   interface TimerState {
     // ... existing fields
     lastResetDate: string; // ISO date string, e.g., "2024-01-15"
   }
   ```

2. **Check date on initialization in `main.tsx`:**

   ```typescript
   const savedState = await loadStateFromStorage();
   const today = new Date().toISOString().split('T')[0];

   if (savedState.timer?.lastResetDate !== today) {
     // New day detected - reset timer to initial state
     const freshState = getInitialTimerState();
     freshState.lastResetDate = today;
     store.dispatch(updateTimerState(freshState));
   }
   ```

3. **Update `lastResetDate` on every session:**
   ```typescript
   // In timerSlice reducers
   state.lastResetDate = new Date().toISOString().split('T')[0];
   ```

**What gets reset:**

- `momentum` → 0.5 (neutral)
- `completedWorkMinutesToday` → 0
- `workSessionDurationRemaining` → DEFAULT_WORK_SESSION_DURATION
- `sessionState` → 'BEFORE_WORK_SESSION'

**What persists:**

- Work hours configuration
- Blocked sites list
- Onboarding status

---

## Storage Limits

### Chrome Storage Quotas

**chrome.storage.local:**

- Limit: 10 MB total
- Per-key limit: None (but recommend < 1 MB per key)

**Current usage:**

- Timer state: ~1 KB
- Work hours: ~100 bytes per entry
- Blocked sites: ~20 bytes per site
- Total: Comfortably under 10 KB even with extensive configuration

**No need to worry about limits for this extension.**

---

## Debugging Storage Issues

### View Stored Data

**Chrome DevTools:**

1. Right-click extension icon → Inspect popup
2. Open Console
3. Run:
   ```javascript
   chrome.storage.local.get(null, (result) => console.log(result));
   ```

**See all stored keys and values.**

### Clear Storage Manually

**Via code:**

```javascript
chrome.storage.local.clear();
```

**Via Chrome:**

1. Go to `chrome://extensions`
2. Click "Details" on Recess
3. Click "Remove extension" (or keep extension but clear storage via console)

### Check If Persistence Is Working

**Set a breakpoint in `storageMiddleware.ts`:**

```typescript
if (action.type.startsWith('timer/')) {
  debugger; // Pause here
  storageAPI.set(STORAGE_KEYS.timer, state.timer);
}
```

**Verify:**

- Action type matches expected prefix
- State is being written correctly
- `chrome.storage.local.set` is being called

### Check If Loading Is Working

**Set a breakpoint in `main.tsx`:**

```typescript
loadStateFromStorage().then((savedState) => {
  debugger; // Pause here - inspect savedState
  // ...
});
```

**Verify:**

- `savedState` contains expected values
- Dispatch actions are being called
- Store is hydrated before render

---

## Edge Cases & Gotchas

### 1. First Install (No Saved State)

When no saved state exists:

- `loadStateFromStorage()` returns `{ timer: undefined, ... }`
- Redux initializes with default `initialState` from slices
- First render shows onboarding or default timer state

**No special handling needed** - default state is designed to work out of the box.

### 2. Timestamp Mismatch After System Sleep

If computer sleeps during a session:

- Timestamp remains fixed
- When computer wakes, `Date.now()` has jumped forward
- Calculated remaining time is still accurate (timestamp-based calculation)

**No special handling needed** - this is why we use timestamps instead of intervals.

### 3. Storage Change Race Conditions

**Scenario:**
User opens two popup windows, makes changes in both.

**What happens:**

- Both windows read same initial state from storage
- Each makes independent changes
- Both write to storage
- Last write wins (later popup overwrites earlier)

**Mitigation:**

- Extension only allows one popup (clicking icon opens in same tab)
- Background script is single instance
- Race conditions unlikely in practice

**If it becomes an issue:**

- Could add optimistic locking (version numbers)
- Could batch storage writes with debouncing

### 4. Storage Migration (Future Schema Changes)

If you change the shape of state (e.g., add new fields):

**Current behavior:**

- Saved state has old shape
- Reducer expects new shape
- Missing fields will be `undefined`

**Best practice:**

- Add migration logic in `main.tsx`:

  ```typescript
  if (savedState.timer && !savedState.timer.newField) {
    savedState.timer.newField = defaultValue;
  }
  ```

- Or add default value in reducer:
  ```typescript
  state.newField = state.newField ?? defaultValue;
  ```

### 5. Sync Storage vs. Local Storage

**Chrome offers two storage APIs:**

- `chrome.storage.local` - stored on device only
- `chrome.storage.sync` - synced across user's Chrome browsers

**We use `local` because:**

- Timer state is device-specific (time is relative to current device)
- Syncing active sessions across devices would be confusing
- Blocked sites and work hours could theoretically sync, but not critical

**Future consideration:**
Could offer "Sync Settings" toggle to sync blockedSites and workHours via `chrome.storage.sync`.

---

## State Invariants

Things that should always be true:

1. **If state is loaded from storage, it should be valid**

   - No undefined required fields
   - Timestamps are numbers, not strings
   - Arrays are arrays, not objects

2. **Storage and Redux should stay in sync**

   - After any action, storage should reflect Redux state
   - After initialization, Redux should reflect storage

3. **Timestamps should be absolute milliseconds**

   - `Date.now()` format
   - Never relative seconds
   - Never string dates

4. **Work remaining should never be negative**

   - Clamped to 0 in reducers

5. **Momentum should be between 0 and 1**
   - CEWMA formula guarantees this if initial value is in range

If any of these are violated, there's a bug in persistence or state updates.

---

## Testing Persistence

### Manual Test Cases

**Test 1: Session survives popup close**

1. Start focus session
2. Close popup
3. Wait 30 seconds
4. Reopen popup
5. **Verify:** Timer continues from correct remaining time

**Test 2: Configuration persists**

1. Add blocked site
2. Close popup
3. Reopen popup
4. **Verify:** Site still in list

**Test 3: Momentum carries over**

1. Complete 2 sessions (momentum should increase)
2. Close popup
3. Reopen popup
4. Check Redux state
5. **Verify:** Momentum > 0.5

**Test 4: Daily reset (if implemented)**

1. Complete work for "today"
2. Manually change system date to tomorrow
3. Reopen extension
4. **Verify:** Timer reset to BEFORE_SESSION with fresh momentum

---

## Performance Considerations

**Storage writes are async but fast:**

- `chrome.storage.local.set` typically takes < 10ms
- Middleware doesn't block renders (async)
- No noticeable UI lag

**No need to debounce:**

- Timer state updates every second → Could be optimized
- But storage writes are cheap, and state object is small
- Premature optimization not needed

**If performance becomes an issue:**

- Batch storage writes with 5-second debounce
- Only save changed slices, not entire state
- Use `chrome.storage.onChanged` for cross-tab sync instead of polling
