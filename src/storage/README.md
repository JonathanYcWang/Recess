# Storage Module

This directory contains reusable storage logic for the Recess extension.

## Structure

- `StorageContext.tsx` - React Context provider for Chrome storage API with localStorage fallback
- `useRoutePersistence.ts` - Hook for persisting and restoring route state
- `useTimerState.ts` - **Recommended** Hook for persisting and restoring timer/session state with timestamp-based accuracy
- `types.ts` - Shared types (SessionState, Reward)
- `utils.ts` - Shared utility functions (formatTime)
- `constants.ts` - Timer constants (DEFAULT_FOCUS_TIME, etc.)
- `index.ts` - Barrel export for all storage modules
- `README.md` - This file

## Note on useSessionState vs useTimerState

- **`useTimerState`** (recommended): Uses timestamp-based calculations for accurate time tracking across popup/tab switches. Automatically handles state transitions and persists all timer state.
- **`useSessionState`** (legacy): Now uses storage but uses interval-based countdown. Consider migrating to `useTimerState` for better accuracy.

## Usage

### StorageProvider

Wrap your app with `StorageProvider` to enable storage functionality:

```tsx
import { StorageProvider } from './storage/StorageContext';

function App() {
  return <StorageProvider>{/* Your app */}</StorageProvider>;
}
```

### useStorage Hook

Use the `useStorage` hook to access storage methods:

```tsx
import { useStorage } from './storage/StorageContext';

function MyComponent() {
  const { get, set, remove, getAll, isReady } = useStorage();

  // Get a value
  const value = await get<string>('myKey');

  // Set a value
  await set('myKey', 'myValue');

  // Remove a key
  await remove('myKey');

  // Get all stored values
  const all = await getAll();

  // Check if storage is ready
  if (isReady) {
    // Storage is available
  }
}
```

### useRoutePersistence Hook

Automatically persists and restores the current route:

```tsx
import { useRoutePersistence } from './storage/useRoutePersistence';

function AppRoutes() {
  useRoutePersistence(); // This handles everything automatically

  return <Routes>{/* Your routes */}</Routes>;
}
```

### useTimerState Hook

Persists and restores timer/session state across popup and new tab instances:

```tsx
import { useTimerState } from './storage/useTimerState';

function MyComponent() {
  const { timerState, updateTimerState, resetTimerState, isLoaded } = useTimerState();

  // Access timer state
  const { sessionState, focusTimeRemaining, breakTimeRemaining } = timerState;

  // Update timer state (automatically saved to storage)
  updateTimerState({
    sessionState: 'DURING_SESSION',
    focusTimeRemaining: 1800,
    sessionStartTime: Date.now(),
  });

  // Reset to default state
  resetTimerState();

  // Wait for state to load before rendering
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
}
```

The hook automatically:

- Calculates accurate remaining time based on session start timestamps
- Handles state transitions if time ran out while the extension was closed
- Persists all timer state changes to Chrome storage
- Works seamlessly across popup and new tab instances

## Features

- **Chrome Storage API**: Uses `chrome.storage.local` in Chrome extension environment
- **LocalStorage Fallback**: Falls back to `localStorage` for development/non-Chrome environments
- **Type-safe**: Generic types for type-safe storage operations
- **Async/Await**: All storage operations return Promises for async handling
- **React Integration**: Hooks and Context for easy React integration
