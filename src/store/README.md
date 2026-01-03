src/store/
├── index.ts # Store configuration
├── hooks.ts # Typed Redux hooks
├── storageMiddleware.ts # Chrome storage sync middleware
├── slices/
│ ├── timerSlice.ts # Timer state management
│ ├── workHoursSlice.ts # Work hours settings
│ ├── blockedSitesSlice.ts # Blocked sites list
│ └── routingSlice.ts # App routing/onboarding
├── selectors/
│ ├── timerSelectors.ts # Timer state selectors
│ ├── workHoursSelectors.ts # Work hours selectors
│ ├── blockedSitesSelectors.ts # Blocked sites selectors
│ ├── routingSelectors.ts # Routing selectors
│ └── index.ts # Selector exports
└── hooks/
├── useTimer.ts # Timer functionality hook
├── useWorkHours.ts # Work hours functionality hook
├── useBlockedSites.ts # Blocked sites functionality hook
└── useRoutePersistence.ts # Route persistence hook

# Redux Store Documentation

This directory contains the Redux store configuration and state management for the Recess Extension.

## Architecture Overview

The store uses Redux Toolkit (@reduxjs/toolkit) for type-safe state management, automatic persistence to chrome.storage.local via middleware, predictable state updates, and full support for Redux DevTools.

## Directory Structure

```
src/store/
├── index.ts                    # Store configuration
├── hooks.ts                    # Typed Redux hooks
├── storageMiddleware.ts        # Chrome storage sync middleware
├── slices/
│   ├── timerSlice.ts          # Timer state management
│   ├── workHoursSlice.ts      # Work hours settings
│   ├── blockedSitesSlice.ts   # Blocked sites list
│   └── routingSlice.ts        # App routing/onboarding
├── selectors/
│   ├── timerSelectors.ts      # Timer state selectors
│   ├── workHoursSelectors.ts  # Work hours selectors
│   ├── blockedSitesSelectors.ts # Blocked sites selectors
│   ├── routingSelectors.ts    # Routing selectors
│   └── index.ts               # Selector exports
└── hooks/
  └── useTimer.ts            # Timer functionality hook
```

## State Structure

The Redux store manages four main slices of state:

### 1. Timer State (`timer`)

Manages the focus/break session timer with the following properties:

- `sessionState`: Current state (BEFORE_WORK_SESSION, ONGOING_FOCUS_SESSION, etc.)
- `workSessionDurationRemaining`: Total work time remaining
- `focusSessionDurationRemaining`: Current focus session time
- `breakSessionDurationRemaining`: Current break time
- `rerolls`: Available reward rerolls
- `selectedReward`: Currently selected reward
- `generatedRewards`: Available reward options
- `momentum`, `fatigue`, `progress`: Dynamic session calculation factors

### 2. Work Hours State (`workHours`)

Manages user's work hour configurations:

- `entries`: Array of WorkHoursEntry objects
- `isLoaded`: Loading status flag

### 3. Blocked Sites State (`blockedSites`)

Manages the list of sites to block during focus time:

- `sites`: Array of blocked site URLs
- `isLoaded`: Loading status flag

### 4. Routing State (`routing`)

Manages app navigation and onboarding:

- `hasOnboarded`: Whether user has completed onboarding

### 2. Work Hours State (`workHours`)

Manages user's work hour configurations:

## Using Redux in Components

### Basic Pattern

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { startFocusSession } from '../store/slices/timerSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const timerState = useAppSelector((state) => state.timer);

  const handleStart = () => {
    dispatch(startFocusSession());
  };

  return <button onClick={handleStart}>Start</button>;
}
```

### Using Custom Hooks

For timer logic, use the custom hook:

```typescript
import { useTimer } from '../store/hooks/useTimer';

function MyComponent() {
  const { timerState, startFocusSession, pauseSession } = useTimer();
  return (
    <div>
      <div>Time: {timerState.focusSessionDurationRemaining}</div>
      <button onClick={startFocusSession}>Start</button>
    </div>
  );
}
```

### Using Selectors

For direct state access with memoization, use selectors:

```typescript
import { useAppSelector } from '../store/hooks';
import { selectBlockedSites, selectIsSessionActive } from '../store/selectors';

function MyComponent() {
  const sites = useAppSelector(selectBlockedSites);
  const isActive = useAppSelector(selectIsSessionActive);
  return <div>Active: {isActive ? 'Yes' : 'No'}</div>;
}
```

## Storage Middleware

The `storageMiddleware.ts` file provides automatic synchronization between Redux state and chrome.storage.local (or localStorage in development).

### How It Works

1. **Automatic Persistence:** Every Redux action triggers the middleware
2. **Selective Sync:** Only relevant state slices are persisted based on action type
3. **Initial Load:** State is loaded from storage on app initialization
4. **Fallback Support:** Uses localStorage when chrome.storage is unavailable

### Storage Keys

- `timerState`: Timer state
- `workHours`: Work hours entries
- `blockedSites`: Blocked sites list
- `hasOnboarded`: Onboarding completion status

## Actions and Reducers

### Timer Actions

- `startFocusSession()`: Start a new focus session
- `pauseSession()`: Pause the current session
- `resumeSession()`: Resume from paused state
- `endSessionEarly()`: End session before timer expires
- `selectReward(reward)`: Select a break reward
- `rerollReward({ index, newReward })`: Reroll a specific reward
- `resetTimer()`: Reset timer to initial state
- `updateTimerState(updates)`: Update timer with partial state

### Work Hours Actions

- `setWorkHours(entries)`: Set all work hours entries
- `addWorkHoursEntry({ startTime, endTime, days })`: Add new entry
- `updateWorkHoursEntry({ id, startTime, endTime, days })`: Update entry
- `deleteWorkHoursEntry(id)`: Delete entry
- `toggleWorkHoursEntry(id)`: Toggle enabled status

### Blocked Sites Actions

- `setBlockedSites(sites)`: Set all blocked sites
- `addBlockedSite(site)`: Add new blocked site
- `removeBlockedSite(site)`: Remove blocked site

### Routing Actions

- `setHasOnboarded(value)`: Set onboarding status
- `completeOnboarding()`: Mark onboarding as complete

## Development

### Adding New State

1. Create a new slice in `slices/`
2. Add slice reducer to `store/index.ts`
3. Update `storageMiddleware.ts` to persist the new state
4. Create custom hook in `hooks/` for component usage
5. Update type exports

### Debugging

Install Redux DevTools browser extension to inspect:

- Current state
- Action history
- State diffs
- Time-travel debugging

## Best Practices

1. **Use typed hooks:** Always use `useAppDispatch` and `useAppSelector`
2. **Keep actions small:** Each action should do one thing
3. **Normalize state:** Avoid deeply nested state structures
4. **Use selectors:** Create reusable selector functions for derived state
5. **Avoid side effects in reducers:** Reducers must be pure functions
6. **Use custom hooks:** Wrap Redux logic in custom hooks for cleaner components

## Migration from Old System

If you're updating old code that uses the context-based storage system, see `src/storage/MIGRATION.md` for migration instructions.

- Action history
- State diffs
- Time-travel debugging

## Best Practices

1. **Use typed hooks**: Always use `useAppDispatch` and `useAppSelector`
2. **Keep actions small**: Each action should do one thing
3. **Normalize state**: Avoid deeply nested state structures
4. **Use selectors**: Create reusable selector functions for derived state
5. **Avoid side effects in reducers**: Reducers must be pure functions
6. **Use custom hooks**: Wrap Redux logic in custom hooks for cleaner components

## Migration from Old System

If you're updating old code that uses the context-based storage system, see `src/storage/MIGRATION.md` for migration instructions.
