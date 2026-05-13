# Recess Chrome Extension

Recess is a Chrome Extension that helps you stay focused by blocking distracting sites, managing work/break timers, and providing user feedback via UI and notifications. It is built with React, TypeScript, Redux Toolkit, and Tailwind CSS, and leverages Chrome Manifest V3 APIs for robust, reliable session management.

---

## What is Recess?

Recess enforces focused work sessions by:

- Blocking distracting sites during work periods
- Allowing breaks with optional reward selection
- Managing session and break timers
- Providing notifications and visual feedback

It is designed for users who want to maintain productivity by controlling access to certain sites during work hours, with dynamic session durations based on momentum, fatigue, and progress.

---

## Core Concepts & Terminology

- **Work Session**: The total time goal for the day (e.g., 4.5 hours)
- **Focus Session**: An individual uninterrupted work period (e.g., 20 minutes)
- **Break Session**: Rest period between focus sessions
- **Blockers**: Logic to prevent access to specified sites during focus sessions
- **Momentum**: Score (0-1) representing how reliably you complete sessions
- **Fatigue**: Measure of mental tiredness based on work completed
- **Progress**: How close you are to your daily goal
- **Reward Selection**: Optional gamification for breaks
- **Session State**: One of several states (see docs/session-lifecycle.md)

---

## High-Level Architecture (Manifest V3)

```
[Popup/Options UI] ←→ [Background Service Worker] ←→ [Content Scripts]
		↑                   ↑                           ↑
	[React]           [Alarms, State]             [Site Blocking]
		↓                   ↓                           ↓
	[chrome.storage] ←→ [All Parts]
```

### Key Components

- **background.ts**: Service worker, manages alarms, session state, and site blocking
- **content.ts**: Injected into web pages, enforces blocking overlays
- **App.tsx**: Main React UI for popup/options
- **manifest.json**: Declares permissions, scripts, and extension surfaces

### UI Surfaces

- **Popup**: Main user interface for session control and status
- **Options Page**: Settings for blocked sites, work hours, etc.
- **Content Scripts**: Overlays on blocked sites

### Message Passing Flows

- UI ↔ Background: For session control, state queries, and updates
- Background ↔ Content: For enforcing blocks, updating overlays
- All flows use `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`

### Storage & State Ownership

- **chrome.storage**: Persistent user settings, session state, blocked sites
- **Background memory**: Ephemeral state (timers, in-progress session)
- **UI state**: React state, synced with background as needed

### Timers, Alarms, and Lifecycle

- **chrome.alarms**: Used for session/break timing, survives browser restarts
- **In-memory timers**: For UI updates, ephemeral
- **Lifecycle**: Service worker may be suspended; must restore state on wake

---

## Timer Logic Walkthrough

This is the timer model used in the Redux store and the UI.

### The Three Key Timer Values

- `currentTimer`: The original duration of the current stage. This stays the same while the stage is running.
- `currentTimerRemaining`: The remaining time left in the current stage. This is the value we snapshot on pause.
- `currentStartTime`: The timestamp used to calculate live countdown values while the timer is running.

### How the Timer Works At Each Stage

#### 1. Before Work Session

- The app is waiting for the user to start working.
- `totalTimer` is the full work goal for the day.
- `totalRemaining` matches the full work goal at the start.
- `currentTimer` is set to the next focus session length.
- `currentTimerRemaining` matches `currentTimer`.

#### 2. Focus Session Starts

- The user clicks start.
- `sessionState` becomes `ONGOING_FOCUS_SESSION`.
- `currentTimer` stays fixed as the original focus duration.
- `currentTimerRemaining` starts at the same value.
- `currentStartTime` is set to `Date.now()`.
- The UI counts down by calculating:

```text
remaining = currentTimerRemaining - elapsedSeconds
```

#### 3. Timer Runs Live

- The hook recalculates the visible countdown every second.
- Redux does not need to rewrite the timer every second.
- The screen shows the live remaining time using `currentStartTime`.

#### 4. Pause Session

- When the user pauses, the reducer snapshots the visible remaining time into `currentTimerRemaining`.
- `currentStartTime` is cleared.
- `currentTimer` still keeps the original stage duration.
- This is why the paused time shows the exact value the user saw.

#### 5. Resume Session

- When the user resumes, `currentStartTime` is set to `Date.now()` again.
- `currentTimerRemaining` stays frozen at the paused value.
- The countdown continues from that remaining value.

#### 6. Focus Session Ends

- When the timer reaches 0, the app transitions to reward selection.
- `totalRemaining` is reduced by the amount of work completed.
- `currentTimer` and `currentTimerRemaining` are cleared for the next stage.
- `sessionState` becomes either `REWARD_SELECTION` or `WORK_SESSION_COMPLETE`.

#### 7. Break Session

- After the user selects a reward, `sessionState` becomes `ONGOING_BREAK_SESSION`.
- `currentTimer` and `currentTimerRemaining` are set to the break duration.
- The same live countdown logic applies.

#### 8. Countdown Back to Focus

- When the break ends, the app enters `FOCUS_SESSION_COUNTDOWN`.
- This is the short countdown before the next focus session starts.
- Once it reaches 0, the next focus session begins.

### Walkthrough Example

Example: a 60-second focus session.

#### Start

- `currentTimer = 60`
- `currentTimerRemaining = 60`
- `currentStartTime = now`

#### After 20 seconds

- The UI shows `40` seconds remaining.
- `currentTimer` is still `60`.
- `currentTimerRemaining` is still the last snapshot value unless paused.
- The hook calculates the live countdown from `currentStartTime`.

#### Pause

- The reducer snapshots the visible time.
- `currentTimer = 60`
- `currentTimerRemaining = 40`
- `currentStartTime = undefined`

#### Resume

- `currentTimer = 60`
- `currentTimerRemaining = 40`
- `currentStartTime = now`
- The timer continues from 40 seconds.

#### Finish

- When the countdown reaches 0, the session completes.
- `totalRemaining` is reduced by the completed focus time.
- The app moves to reward selection or work session complete.

### Short Version

- `currentTimer` = original stage duration
- `currentTimerRemaining` = paused snapshot of remaining time
- `currentStartTime` = anchor for live countdown math
- Pause stores the visible countdown value
- Resume starts counting again from that stored remaining value

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm (or yarn)

### Install & Build

```bash
npm install
npm run build
```

The built extension will be in the `dist` folder.

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder
5. The extension icon should appear in your Chrome toolbar

### Development Mode

```bash
npm run dev
```

This starts the Vite dev server for rapid UI development. For extension testing, always build and load from `dist`.

---

## Project Structure

```
Recess-Extension/
├── src/
│   ├── assets/          # Images and SVG icons
│   ├── components/      # Reusable React components
│   │   └── ui/         # UI components (TimeField, etc.)
│   ├── lib/            # Business logic and utilities
│   ├── pages/          # Page components
│   │   └── views/      # State-specific views for MainPage
│   ├── store/          # Redux store
│   ├── styles/         # CSS modules and global styles
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # Entry point and store initialization
│   ├── background.ts   # Background service worker for site blocking
│   └── content.ts      # Content script (minimal)
├── docs/               # Comprehensive developer documentation
├── public/             # Static assets (icons)
├── dist/               # Built extension (after build)
├── manifest.json       # Chrome extension manifest (v3)
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

---

## How the System Works

### Execution Flow

- **On Install**: Sets default settings, schedules alarms
- **Session Start**: User triggers session, background sets state, content scripts block sites
- **Session End**: Alarm fires, background updates state, notifications sent
- **Extension Reload/Restart**: State restored from `chrome.storage`, alarms rescheduled

### State & Persistence

- **chrome.storage**: Blocked sites, session settings, work hours, last session state
- **Ephemeral**: In-memory timers, transient UI state

---

## Common Gotchas & Debugging Tips

- **MV3 Service Worker Suspension**: Background scripts may be unloaded; always persist critical state
- **Alarm Reliability**: Chrome alarms are reliable but may be delayed if the browser is sleeping
- **Notification Limitations**: Chrome notification API is limited; test on all platforms
- **Message Passing**: Always handle the case where the background script is not running
- **Styles Not Working**: Ensure Tailwind CSS is properly configured and fonts are loaded
- **Build Fails**: Make sure all dependencies are installed and Node.js version is 18+
- **Extension Won't Load**: Make sure you're loading the `dist` folder, not the project root

---

## Documentation Index

Comprehensive developer documentation is available in the `/docs` directory:

- [docs/README.md](docs/README.md) - Documentation index
- [docs/architecture.md](docs/architecture.md) - System design
- [docs/session-lifecycle.md](docs/session-lifecycle.md) - Session flow
- [docs/time-calculations.md](docs/time-calculations.md) - Duration formulas
- [docs/state-and-storage.md](docs/state-and-storage.md) - Redux state structure
- [docs/developer-notes.md](docs/developer-notes.md) - Design decisions

---

## License

MIT
