# Redux Store Documentation

This directory contains the Redux store configuration and state management for the Recess Extension.

## Architecture Overview

The store uses Redux Toolkit (@reduxjs/toolkit) for simplified Redux setup with the following features:

- **Type-safe** state management with TypeScript
- **Automatic persistence** to chrome.storage.local via middleware
- **Predictable state updates** through actions and reducers
- **Development tools** support for debugging

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
    ├── useTimer.ts            # Timer functionality hook
    ├── useWorkHours.ts        # Work hours functionality hook
    ├── useBlockedSites.ts     # Blocked sites functionality hook
    └── useRoutePersistence.ts # Route persistence hook
```

## State Structure

The Redux store manages four main slices of state:

### 1. Timer State (`timer`)

Manages the focus/break session timer with the following properties:

- `sessionState`: Current state (BEFORE_SESSION, DURING_SESSION, PAUSED, etc.)
- `workSessionDurationRemaining`: Total work time remaining
- `focusSessionDurationRemaining`: Current focus session time
- `breakSessionDurationRemaining`: Current break time
- `rerolls`: Available reward rerolls
- `selectedReward`: Currently selected reward
- `generatedRewards`: Available reward options

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

For convenience, use the custom hooks that wrap Redux logic:

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

````typescript
import { useAppSelector } from '../store/hooks';
import { selectBlockedSites, selectIsSessionActive } from '../store/selectors';

function MyComponent() {
  const sites = useAppSelector(selectBlockedSites);
  const isActive = useAppSelector(selectIsSessionActive);

  return <div>Active: {isActive ? 'Yes' : 'No'}</div>;
}
```## Storage Middleware

The `storageMiddleware.ts` file provides automatic synchronization between Redux state and chrome.storage.local (or localStorage in development).

## Selectors

Selectors are functions that extract and compute derived state from the Redux store. They provide:

### Benefits of Selectors

1. **Memoization**: Selectors created with `createSelector` cache results and only recompute when inputs change
2. **Reusability**: Use the same selector across multiple components
3. **Type Safety**: Full TypeScript support with proper type inference
4. **Testability**: Easy to test in isolation
5. **Performance**: Prevents unnecessary re-renders

### Available Selectors

#### Timer Selectors
- `selectTimerState` - Full timer state
- `selectSessionState` - Current session state
- `selectIsSessionActive` - Whether a session is currently active
- `selectCanPause` - Whether pause is available
- `selectCanResume` - Whether resume is available
- `selectHasRerollsAvailable` - Whether rerolls are available

#### Work Hours Selectors
- `selectWorkHoursEntries` - All work hours entries
- `selectEnabledWorkHours` - Only enabled entries
- `selectWorkHoursCount` - Count of entries
- `selectWorkHoursEntryById(id)` - Specific entry by ID

#### Blocked Sites Selectors
- `selectBlockedSites` - List of blocked sites
- `selectBlockedSitesCount` - Count of blocked sites
- `selectIsBlockedSite(site)` - Check if specific site is blocked

#### Routing Selectors
- `selectHasOnboarded` - Onboarding completion status

### Example Usage

```typescript
import { useAppSelector } from '../store/hooks';
import {
  selectIsSessionActive,
  selectBlockedSitesCount,
  selectEnabledWorkHours
} from '../store/selectors';

function MyComponent() {
  const isActive = useAppSelector(selectIsSessionActive);
  const siteCount = useAppSelector(selectBlockedSitesCount);
  const enabledHours = useAppSelector(selectEnabledWorkHours);

  return (
    <div>
      <p>Session Active: {isActive}</p>
      <p>Blocked Sites: {siteCount}</p>
      <p>Active Work Hours: {enabledHours.length}</p>
    </div>
  );
}
````

## Storage Middleware

The `storageMiddleware.ts` file provides automatic synchronization between Redux state and chrome.storage.local (or localStorage in development).

### How It Works

1. **Automatic Persistence**: Every Redux action triggers the middleware
2. **Selective Sync**: Only relevant state slices are persisted based on action type
3. **Initial Load**: State is loaded from storage on app initialization
4. **Fallback Support**: Uses localStorage when chrome.storage is unavailable

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

1. **Use typed hooks**: Always use `useAppDispatch` and `useAppSelector`
2. **Keep actions small**: Each action should do one thing
3. **Normalize state**: Avoid deeply nested state structures
4. **Use selectors**: Create reusable selector functions for derived state
5. **Avoid side effects in reducers**: Reducers must be pure functions
6. **Use custom hooks**: Wrap Redux logic in custom hooks for cleaner components

## Migration from Old System

If you're updating old code that uses the context-based storage system, see `src/storage/MIGRATION.md` for migration instructions.
