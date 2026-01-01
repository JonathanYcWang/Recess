# Recess Architecture

## Overview

Recess is a Chrome extension that helps users maintain focus by managing work/break cycles with dynamic session durations. Unlike traditional Pomodoro timers with fixed intervals, Recess adapts session lengths based on user performance, fatigue, and progress through the day.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │             │    │              │    │               │  │
│  │  Background │◄───┤   Storage    │───►│   UI (Popup)  │  │
│  │   Script    │    │ (Chrome API) │    │   React App   │  │
│  │             │    │              │    │               │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│        │                                        │            │
│        │ Manages blocking                       │ Displays   │
│        │ rules via                              │ state &    │
│        │ declarativeNetRequest                  │ controls   │
│        │                                        │            │
│        ▼                                        ▼            │
│  ┌─────────────────┐                  ┌──────────────────┐ │
│  │ Site Blocking   │                  │  Redux Store     │ │
│  │ (Active during  │                  │  - timer         │ │
│  │  focus sessions)│                  │  - workHours     │ │
│  └─────────────────┘                  │  - blockedSites  │ │
│                                        │  - routing       │ │
│                                        └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Subsystems

### 1. Background Script (`background.ts`)

**Responsibility:** Site blocking enforcement

**How it works:**

- Listens to storage changes for `blockedSites` and `timerState`
- When a focus session is active (`sessionState === 'ONGOING_FOCUS_SESSION'`):
  - Creates `declarativeNetRequest` rules for each blocked site
  - Redirects blocked sites to the extension popup
- When session ends or user is on break:
  - Removes all blocking rules
  - User regains access to blocked sites during breaks

**Why this approach:**

- Chrome's `declarativeNetRequest` API is the modern, performant way to block content
- Blocking happens at the network level, not content script injection
- Minimal performance impact compared to older approaches

### 2. Redux Store (`src/store/`)

**Responsibility:** Centralized state management with persistence

**Structure:**

```
store/
├── index.ts              # Store configuration
├── storageMiddleware.ts  # Auto-sync to chrome.storage.local
└── slices/
    ├── timerSlice.ts         # Session state, momentum, fatigue
    ├── workHoursSlice.ts     # User's work schedule
    ├── blockedSitesSlice.ts  # Sites to block during focus
    └── routingSlice.ts       # Onboarding status
```

**Key patterns:**

- **Redux Toolkit** for simplified reducer creation
- **Storage middleware** automatically persists state changes to `chrome.storage.local`
- **Initialization** happens in `main.tsx` - loads persisted state before first render
- **Single source of truth** - all components read from store, never maintain local timer state

### 3. Business Logic Layer (`src/lib/`)

**Responsibility:** Pure calculation functions, no React dependencies

**Files:**

- `constants.ts` - All magic numbers, grouped by domain
- `session-duration-calculator.ts` - Momentum, fatigue, and duration formulas
- `timer-utils.ts` - Time formatting and countdown calculations
- `types.ts` - TypeScript interfaces for timer/session state

**Design principle:**
These modules are **pure functions** - same inputs always produce same outputs. This makes them:

- Easy to test
- Easy to reason about
- Portable (could be used in other contexts if needed)

### 4. React UI (`src/`)

**Responsibility:** Display state and handle user interactions

**Structure:**

```
src/
├── App.tsx              # Router setup
├── main.tsx             # Entry point, store initialization
├── pages/               # Route-level components
│   ├── MainPage.tsx         # Main timer view (renders different views)
│   ├── BlockedSitesPage.tsx # Settings: manage blocked sites
│   └── WorkHoursPage.tsx    # Settings: configure work schedule
├── components/          # Reusable UI components
├── pages/views/         # State-specific views for main page
    ├── BeforeWorkSessionView.tsx    # Pre-session (start button)
    ├── OngoingFocusSessionView.tsx    # Active focus session
    ├── RewardSelectionView.tsx  # Choose break activity
    ├── OngoingBreakSessionView.tsx            # Active break
    ├── FocusSessionCountdownView.tsx         # Transition back to focus
    └── WorkSessionCompleteView.tsx  # End of work session
```

**Key patterns:**

- **View-based routing within MainPage** - switches between views based on `sessionState`
- **Direct Redux access** - components use `useAppSelector` and `useAppDispatch` directly
- **Minimal local state** - only UI-specific state (like input values) lives in components
- **One major hook: `useTimer`** - encapsulates all timer logic, countdown management, and transitions

## Data Flow

### Starting a Focus Session

```
User clicks "Start"
    ↓
MainPage → useTimer.startFocusSession()
    ↓
dispatch(startFocusSession())
    ↓
timerSlice updates:
  - sessionState → 'ONGOING_FOCUS_SESSION'
  - focusSessionEntryTimeStamp → Date.now()
  - focusSessionDurationRemaining → nextFocusDuration
    ↓
storageMiddleware → chrome.storage.local (persist)
    ↓
background.ts detects storage change
    ↓
background.ts creates blocking rules for all sites
    ↓
useTimer's useEffect detects state change
    ↓
Starts 1-second interval to update countdown
```

### Session Completion Flow

```
Timer countdown reaches 0
    ↓
useTimer detects remaining === 0
    ↓
dispatch(transitionToRewardSelection())
    ↓
timerSlice:
  - Updates momentum (CEWMA) based on completion
  - Calculates new fatigue score
  - Recalculates next session durations
  - sessionState → 'REWARD_SELECTION' or 'WORK_SESSION_COMPLETE'
    ↓
MainPage renders RewardSelectionView
    ↓
User selects reward
    ↓
dispatch(selectReward(reward))
    ↓
timerSlice: sessionState → 'ONGOING_BREAK_SESSION'
    ↓
background.ts removes blocking rules
    ↓
User can access reward site during break
```

## Why This Structure?

### Chrome Extension Boundaries

**Background script is separate from UI** because:

- Background scripts run in a service worker context
- They have access to Chrome APIs that UI doesn't
- Site blocking needs to work even when popup is closed

**Storage as the communication layer:**

- Background script and UI can't directly communicate in MV3
- Both listen to `chrome.storage.onChanged`
- State changes in UI automatically trigger background updates via middleware

### Redux Over Component State

**Chosen because:**

- Timer needs to persist across popup open/close cycles
- Multiple views need access to same timer state
- Storage sync is automatic via middleware
- Time-travel debugging in development

**Not chosen for complexity** - this is intentional:

- Timer state is global by nature
- Session continuity requires persistence
- Redux + middleware is simpler than custom storage sync logic in every component

### Pure Business Logic

**session-duration-calculator.ts is separate because:**

- Formulas are complex and need to be testable in isolation
- Logic should be documented and version-controlled separately from UI
- Can be updated without touching React code
- Makes the "why" of duration changes explicit

### View-Based Main Page

**MainPage switches views rather than routing because:**

- Timer state should never be lost during navigation
- Session flow is linear (session → reward → break → repeat)
- Prevents accidental browser back/forward interference
- Settings are separate routes because they're truly separate features

## Extension Lifecycle

### First Install

1. User installs extension
2. Click extension icon → opens `index.html` in new tab
3. `main.tsx` runs `loadStateFromStorage()` → returns empty
4. Store initializes with default values
5. `MainPage` sees `hasOnboarded === false` → shows `WelcomeView`
6. User completes onboarding → `dispatch(completeOnboarding())`
7. Middleware persists `hasOnboarded: true` to storage

### Subsequent Opens

1. Click extension icon
2. `main.tsx` runs `loadStateFromStorage()` → loads persisted state
3. Store initializes with saved values
4. If session was in progress, timer resumes from saved timestamp
5. Background script checks storage, reapplies blocking rules if needed

### Daily Reset

**Currently:** No automatic reset - state persists indefinitely
**Future consideration:** Could add date checking to reset momentum/fatigue at start of new day

## Performance Considerations

### Why 1-Second Intervals?

The timer uses `setInterval(fn, 1000)` to update countdown displays.

**Why not more frequent?**

- 1 second granularity is sufficient for user perception
- Lower CPU usage
- Lower battery drain on laptops

**Why not less frequent?**

- Users expect real-time countdown feedback
- 1 second is the standard for timer UIs

### Why Calculate Remaining Time Every Tick?

Instead of decrementing a counter, we calculate:

```typescript
remaining = initialDuration - Math.floor((Date.now() - entryTimestamp) / 1000);
```

**Advantages:**

- Accurate even if intervals are delayed (browser throttling, sleep mode)
- Survives popup close/reopen
- Timestamp-based calculation is more reliable than accumulated intervals

## Future Extensibility

### Adding New Session States

1. Add new state to `SessionState` type in `types.ts`
2. Add transition logic in `timerSlice.ts`
3. Create new view component in `pages/views/`
4. Add case in `MainPage.tsx`'s `renderContent()`

### Changing Duration Formulas

1. Update constants in `constants.ts`
2. Adjust formulas in `session-duration-calculator.ts`
3. Document changes in `time-calculations.md`
4. No UI changes needed - formulas are called automatically

### Adding New Persisted State

1. Add slice to `store/slices/`
2. Register reducer in `store/index.ts`
3. Add storage key to `storageMiddleware.ts`
4. Add load logic to `main.tsx`

The architecture is designed to make these common changes localized and predictable.
