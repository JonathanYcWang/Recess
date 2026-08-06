# App Actions Flow

How user intent travels from the UI to the background worker and how updated state returns to React.

For broader architecture context, see [architecture-v2.md](./architecture-v2.md). For domain terms (Work Session, Focus Block, etc.), see [domain/glossary.md](./domain/glossary.md).

---

## Overview

Recess uses a **command / broadcast** pattern:

1. The UI sends an **app action** — a typed command describing what should happen.
2. The background worker is the **only writer** to browser storage. It applies the action, persists the result, and broadcasts the new state.
3. The UI receives the broadcast, updates Redux, and re-renders from selectors.

The background worker is the source of truth. Redux is a read-only mirror for the UI.

```
User interaction
  → Hook or page calls sendAppAction(action)
  → ActionBroker sends { type: 'APP_ACTION', action } via chrome.runtime.sendMessage
  → background.ts routes to handleAppAction
  → applyAppAction runs domain services, produces next PersistedAppState
  → StorageRepository writes state
  → broadcastAppState pushes { type: 'APP_STATE_CHANGED', state }
  → ActionBroker subscription in main.tsx dispatches setAppState to Redux
  → Components re-render via useSelector / selectors
```

---

## Layers

### UI (`/UI`)

Components and pages do **not** write to storage or dispatch Redux actions for domain changes. They express intent by calling `sendAppAction` — usually from a hook (`useTimer`, `useRewards`) or directly from a page (`QuizPage`, `OnboardingPage`).

Hooks read current state from Redux selectors and send actions when the user acts or when a timer tick requires scheduler evaluation:

| Hook / page        | Example actions                                      |
| ------------------ | ---------------------------------------------------- |
| `useTimer`         | `START_WORK_SESSION`, `START_FOCUS`, `SCHEDULER_EVALUATE`, `END_WORK_SESSION_EARLY` |
| `useRewards`       | `REWARDS_SELECT_REWARD`, `REWARDS_REROLL_REWARD`     |
| `QuizPage`         | `QUIZ_SELECT_OPTION`, `QUIZ_RESTART`                 |
| `OnboardingPage`   | `INITIALIZE_FROM_ONBOARDING`                         |

On startup, `main.tsx` hydrates Redux and keeps it in sync:

1. `getAppState()` — fetches the current persisted state once.
2. `subscribeToAppState(listener)` — receives every `APP_STATE_CHANGED` broadcast.

Both paths dispatch `setAppState` into the Redux store. Components never call `setAppState` themselves.

### ActionBroker (`/Shared/ActionBrokers/ActionBroker.ts`)

ActionBroker is the **only module in the UI layer** that talks to `chrome.runtime` for app state. It exposes three functions:

| Function                 | Direction   | Message type          | Purpose                          |
| ------------------------ | ----------- | --------------------- | -------------------------------- |
| `sendAppAction(action)`  | UI → BG     | `APP_ACTION`          | Request a state change           |
| `getAppState()`          | UI → BG     | `GET_APP_STATE`       | Read current state on boot       |
| `subscribeToAppState(fn)`| BG → UI     | `APP_STATE_CHANGED`   | Listen for state broadcasts      |

`sendAppAction` wraps the action in a message and returns a promise that resolves to `AppActionResponse`:

```ts
{ ok: true } | { ok: false; error: 'invalid-action' }
```

ActionBroker does not contain business logic. It is a thin messaging adapter shared between UI and background types (`RuntimeMessage`, `AppAction`, `PersistedAppState` live in `/Shared/Types/AppState.ts`).

### Background (`/Background`)

**Entrypoint — `background.ts`**

The service worker listens for runtime messages and routes them. It contains no business logic:

- `GET_APP_STATE` → `handleGetAppState()`
- `APP_ACTION` → `handleAppAction(message.action)`

Both handlers return a response to the caller via `sendResponse`. The listener returns `true` to keep the message channel open for async responses.

**Action handler — `ActionHandlers/appStateActionHandler.ts`**

`handleAppAction` is the write path for every app action:

1. Read current state from storage (`getStoredAppState`).
2. Compute next state (`applyAppAction(state, action, now)`).
3. Persist via `StorageRepository`.
4. Broadcast via `broadcastAppState`.
5. Return `{ ok: true }`.

`applyAppAction` is a pure reducer-style function. It delegates to background services (`SchedulerService`, `RewardService`, `BlockListManagementService`, etc.) based on `action.type`. It does not touch browser APIs directly.

**Broadcaster — `Broadcasters/appStateBroadcaster.ts`**

After every successful write, `broadcastAppState` sends `{ type: 'APP_STATE_CHANGED', state }` to:

- All extension contexts via `chrome.runtime.sendMessage` (popup, options pages).
- All tabs via content scripts (`content.ts` currently listens but takes no action).

---

## Message and action types

### Wire messages (`RuntimeMessage`)

Messages sent over `chrome.runtime` are typed as `RuntimeMessage`, split by direction:

**Requests** (`BackgroundRequest`) — UI → background, expect a response:

```ts
| { type: 'GET_APP_STATE' }
| { type: 'APP_ACTION'; action: AppAction }
```

**Events** (`BackgroundEvent`) — background → UI, no response:

```ts
| { type: 'APP_STATE_CHANGED'; state: PersistedAppState }
```

### App actions (`AppAction`)

Action type strings are defined in `APP_ACTION` (`/Shared/Constants/Constants.ts`). Each variant is a discriminated union on `type`:

| Action                      | Payload / notes                                      |
| --------------------------- | ---------------------------------------------------- |
| `ADD_BLOCKED_SITE`          | `hostname`                                           |
| `REMOVE_BLOCKED_SITE`       | `hostname`                                           |
| `START_FOCUS`               | —                                                    |
| `START_WORK_SESSION`        | —                                                    |
| `END_WORK_SESSION_EARLY`    | —                                                    |
| `SCHEDULER_EVALUATE`        | Called on timer ticks; advances scheduler phases     |
| `SET_WORK_START_REMINDER`   | `startsAt` (ISO string)                              |
| `CLEAR_WORK_START_REMINDER` | —                                                    |
| `SET_COIN_BALANCE`          | `balance`                                            |
| `INITIALIZE_FROM_ONBOARDING`| `energy`, `cadence`, `primaryFriction`               |
| `REWARDS_SELECT_REWARD`     | `reward` — also starts Recess via scheduler          |
| `REWARDS_REROLL_REWARD`     | `index` — replaces one reward option                 |
| `QUIZ_SELECT_OPTION`        | `option`                                             |
| `QUIZ_RESTART`              | —                                                    |

Adding a new action requires updating: `APP_ACTION` constant, `AppAction` union, `applyAppAction` branch, and the UI call site.

---

## End-to-end example: starting a work session

1. User clicks "Start" in the UI.
2. `useTimer().startWorkSession()` calls `sendAppAction({ type: APP_ACTION.START_WORK_SESSION })`.
3. ActionBroker sends `{ type: 'APP_ACTION', action: { type: 'START_WORK_SESSION' } }` to the service worker.
4. `background.ts` calls `handleAppAction`.
5. `applyAppAction` runs `startWorkSession(now)` on the scheduler slice and returns updated `PersistedAppState`.
6. State is written to storage under key `appState`.
7. `broadcastAppState` emits `APP_STATE_CHANGED` to all listeners.
8. `subscribeToAppState` in `main.tsx` receives the message and dispatches `setAppState`.
9. `useTimer` reads `selectScheduler(state)`; the UI shows the active Work Session.

The `sendAppAction` promise resolves with `{ ok: true }` once steps 4–6 complete. The UI update from step 9 arrives asynchronously via the broadcast, not from the action response payload.

---

## Rules

- **One writer to storage** — only `StorageRepository` in the background layer persists state.
- **One messaging surface for UI** — hooks and pages call ActionBroker; they do not use `chrome.runtime` directly.
- **No Redux writes from components** — only the bootstrap wiring in `main.tsx` dispatches `setAppState`, triggered by ActionBroker subscriptions.
- **No business logic in adapters** — `background.ts`, ActionBroker, and `appStateBroadcaster` are plumbing only.
- **State flows one direction** — background → ActionBroker → Redux → components. Actions flow UI → ActionBroker → background.

---

## Key files

| File | Role |
| ---- | ---- |
| `src/Shared/ActionBrokers/ActionBroker.ts` | UI ↔ background messaging API |
| `src/Shared/Types/AppState.ts` | `AppAction`, `RuntimeMessage`, `PersistedAppState` |
| `src/Shared/Constants/Constants.ts` | `APP_ACTION` type strings |
| `src/Background/background.ts` | Message router (service worker entry) |
| `src/Background/ActionHandlers/appStateActionHandler.ts` | Action handling and `applyAppAction` |
| `src/Background/Broadcasters/appStateBroadcaster.ts` | State push to UI and content scripts |
| `src/Background/Repositories/StorageRepository.ts` | Persistence |
| `src/UI/main.tsx` | Hydrates Redux; subscribes to state broadcasts |
