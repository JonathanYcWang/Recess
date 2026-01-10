# Recess Chrome Extension - Developer Onboarding Guide

**Last Updated**: January 9, 2026  
**Target Audience**: Engineers new to the codebase  
**Time to Complete Walkthrough**: 45-60 minutes

---

## 📋 Recommended Walkthrough Agenda (60 minutes)

1. **Orientation** (10 min): Read "What this repo is" and "How to run it"
2. **Architecture Deep Dive** (15 min): Review "Architecture overview" and "Repository map"
3. **Domain Understanding** (10 min): Study "Core concepts + domain model"
4. **Key Workflows** (15 min): Walk through session lifecycle flows
5. **Code Tour** (10 min): Open and skim the "If you only read 5 files" list

---

## What this repo is

This repository contains **Recess**, a Chrome Extension (Manifest V3) that helps users maintain focus and productivity through:

- **Timed focus sessions** with dynamic duration based on user performance
- **Break scheduling** with gamified reward selection
- **Website blocking** during focus periods
- **Work hour reminders** via Chrome notifications
- **Adaptive session sizing** using momentum, fatigue, and progress algorithms

**Tech Stack**:

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit with feature-based architecture
- **Build**: Vite for fast dev/build, esbuild for background/content scripts
- **Chrome APIs**: Manifest V3 (alarms, storage, declarativeNetRequest, notifications)

### What the software does (User perspective)

**Primary User Flow**:

1. User sets daily work goal (e.g., "3 hours of focused work today")
2. User adds distracting websites to blocklist (YouTube, Instagram, etc.)
3. User starts a focus session → extension blocks distracting sites
4. When focus session completes → user selects a break reward (e.g., "15 min on YouTube")
5. During break → selected site is unblocked temporarily
6. After break → countdown starts, then next focus session begins
7. Cycle repeats until daily work goal is met

**Secondary Features**:

- **Work Hours Reminders**: Schedule notifications (e.g., "Start work at 9 AM on weekdays")
- **Adaptive Sessions**: Focus duration adjusts based on:
  - **Momentum**: How often you complete sessions without quitting early
  - **Fatigue**: How much you've already worked today
  - **Progress**: How close you are to your daily goal

### What problem it solves and for whom

**Problem**: Knowledge workers struggle with digital distractions and maintaining consistent focus periods.

**Users**: Remote workers, students, freelancers who:

- Have access to distracting websites during work hours
- Struggle with self-discipline around screen time
- Want structured work/break cycles (Pomodoro-like)
- Need accountability and progress tracking

**Solution**: Enforced website blocking + gamified breaks + intelligent session pacing

### Non-goals / Out of scope

Based on codebase analysis:

- ❌ **Not a productivity analytics dashboard** (no charts, historical data views)
- ❌ **Not cross-browser** (Chrome/Chromium only, uses Manifest V3)
- ❌ **Not a team/social tool** (single-user, no sharing/leaderboards)
- ❌ **Not managing desktop apps** (only web-based distractions)
- ❌ **Not syncing across devices** (uses local Chrome storage)
- ❌ **Not blocking via VPN/network level** (uses browser APIs only)

---

## How to run it

### Prerequisites

Required:

- **Node.js 18+** (check: `node --version`)
- **npm** (comes with Node)
- **Google Chrome** or Chromium-based browser
- **Git** (to clone repo)

Optional:

- **VS Code** (recommended editor, config included in `.vscode/`)

### Setup steps

1. **Clone and install**:

```bash
git clone <repo-url>
cd Recess-Extension
npm install
```

2. **Build the extension**:

```bash
npm run build
```

This runs:

- `tsc` (TypeScript compilation)
- `vite build` (React app bundle)
- `npm run build:scripts` (background/content scripts via esbuild)

Output: `dist/` folder containing the packaged extension

3. **Load in Chrome**:

- Open Chrome → `chrome://extensions/`
- Toggle "Developer mode" (top right)
- Click "Load unpacked"
- Select the `dist/` folder
- Extension icon appears in toolbar

### How to run locally (dev mode)

**For UI development** (popup/settings pages):

```bash
npm run dev
```

- Starts Vite dev server at `http://localhost:5173`
- Hot reload for React components
- **Note**: Chrome APIs won't work in browser (need to load as extension)

**For full extension testing**:

1. Make code changes
2. Run `npm run build`
3. Click "Reload" button for extension in `chrome://extensions/`

**Quick iteration**:

- For UI-only changes: Use `npm run dev` for fast feedback
- For background script changes: Must rebuild and reload extension

### How to run tests

Currently no automated tests present in repository.

**To add tests** (future):

- Consider Vitest for unit tests (already using Vite)
- Consider Playwright for E2E extension testing

### How to build / deploy

**Development build**:

```bash
npm run build
```

**Production build**:

- Same command (no separate prod build configured)
- Output: `dist/` folder ready for Chrome Web Store submission

**Deploy to Chrome Web Store**:

1. Zip the `dist/` folder contents
2. Upload to Chrome Web Store Developer Dashboard
3. Fill out store listing details
4. Submit for review

**Version bumping**:

- Update `version` in both `package.json` and `manifest.json`

### Common "it doesn't run" troubleshooting

| Problem                            | Solution                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **"Module not found" errors**      | Run `npm install` again, delete `node_modules` and reinstall                                                         |
| **Extension won't load**           | Check `dist/` contains `manifest.json`, `background.js`, `content.js`                                                |
| **TypeScript errors during build** | Run `npm run build` and check error output, ensure TS version matches `tsconfig.json`                                |
| **Changes not reflected**          | Click "Reload" in `chrome://extensions/` after rebuild                                                               |
| **Blocked sites not working**      | Check `host_permissions` in manifest, ensure sites format is correct (e.g., `youtube.com` not `https://youtube.com`) |
| **Notifications not showing**      | Check `notifications` permission in manifest, verify Chrome notification settings                                    |
| **Alarms not firing**              | Service worker may be sleeping, check `chrome://serviceworker-internals/`                                            |
| **Storage issues**                 | Check `chrome.storage.local` in DevTools → Application → Storage                                                     |

---

## Architecture overview

### Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────────┐               │
│  │  Popup UI    │◄────►│  Background      │               │
│  │  (React)     │      │  Service Worker  │               │
│  │              │      │                  │               │
│  │  - Main view │      │  - Alarms        │               │
│  │  - Settings  │      │  - State mgmt    │               │
│  │              │      │  - Notifications │               │
│  └──────────────┘      │  - Site blocking │               │
│         │              └────────┬─────────┘               │
│         │                       │                          │
│         │                       │                          │
│         │              ┌────────▼─────────┐               │
│         │              │  Content Scripts │               │
│         │              │                  │               │
│         │              │  (Injected into  │               │
│         │              │   web pages)     │               │
│         │              └──────────────────┘               │
│         │                       │                          │
│         │                       │                          │
│         ▼                       ▼                          │
│  ┌────────────────────────────────────────┐               │
│  │       chrome.storage.local             │               │
│  │  (Persistent state across sessions)    │               │
│  └────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

1. **Chrome Extension Manifest V3 Pattern**:

   - Service worker-based background script (no persistent background page)
   - Content scripts injected into pages
   - Message passing for communication
   - Chrome APIs for storage, alarms, blocking

2. **React + Redux Architecture** (Frontend):

   - **Feature-based structure**: Each domain (timer, workHours, blockedSites) has own slice
   - **Unidirectional data flow**: Actions → Reducers → State → Selectors → Components
   - **Services layer**: Pure business logic (no Redux dependencies)
   - **Thunks**: Async operations and complex action sequences

3. **State Management Pattern**:
   - **Redux store**: Authoritative state for UI
   - **Chrome storage**: Persistence layer (synced via middleware)
   - **Background script memory**: Ephemeral session state
   - **Middleware**: Syncs Redux state to Chrome storage on changes

### Data Flow: Request Lifecycle

**User starts focus session**:

```
1. User clicks "Start Focus Session" button
   ↓
2. Component dispatches Redux action: startFocusSession()
   ↓
3. Reducer updates timerSlice state:
   - sessionState → 'ONGOING_FOCUS_SESSION'
   - Sets timestamps and durations
   ↓
4. Storage middleware persists state to chrome.storage.local
   ↓
5. Background script listens to storage changes
   ↓
6. Background script updates declarativeNetRequest rules
   - Adds redirect rules for blocked sites
   ↓
7. User navigates to YouTube.com
   ↓
8. Chrome intercepts request, redirects to extension popup
   ↓
9. Timer tick effect runs every second (in useTimer hook)
   ↓
10. When timer reaches 0, dispatches transitionToRewardSelection()
```

**Session state transitions**:

```
BEFORE_WORK_SESSION
    ↓ startFocusSession()
ONGOING_FOCUS_SESSION
    ↓ timer expires OR user ends early
REWARD_SELECTION
    ↓ user selects reward
ONGOING_BREAK_SESSION
    ↓ break timer expires
FOCUS_SESSION_COUNTDOWN (10 second prep)
    ↓ countdown expires
ONGOING_FOCUS_SESSION (cycle continues)
    ↓ all work completed
WORK_SESSION_COMPLETE
```

### Where State Lives

| State Type         | Location                             | Lifetime          | Example                         |
| ------------------ | ------------------------------------ | ----------------- | ------------------------------- |
| **User settings**  | `chrome.storage.local`               | Persistent        | Blocked sites list, work hours  |
| **Session state**  | `chrome.storage.local` + Redux store | Until cleared     | Current session type, timers    |
| **UI state**       | React component state                | Until unmount     | Dialog open/closed, form inputs |
| **Timer ticks**    | React hook state (`useTimer`)        | While popup open  | Live countdown display          |
| **Alarms**         | Chrome alarms API                    | Survives restarts | Work hour reminders             |
| **Blocking rules** | `declarativeNetRequest`              | Until updated     | Active site blocks              |

### External Dependencies/Services

**Chrome APIs (no external services)**:

- `chrome.storage.local`: Persistent key-value storage (~5MB limit)
- `chrome.alarms`: Scheduled events (survives browser restart)
- `chrome.declarativeNetRequest`: Dynamic site blocking rules
- `chrome.notifications`: System notifications
- `chrome.tabs`: Tab management (open/close distracting tabs)
- `chrome.runtime`: Message passing between extension parts

**No external APIs**: Entirely offline, no network calls to backends

---

## Repository map (guided tour)

### Top-level structure

```
Recess-Extension/
├── src/                    # All source code
│   ├── App.tsx            # Root React component
│   ├── main.tsx           # React entry point
│   ├── background.ts      # Background service worker (Chrome extension context)
│   ├── content.ts         # Content script (injected into pages)
│   ├── components/        # React UI components
│   ├── pages/             # Full-page views
│   ├── store/             # Redux state management
│   ├── lib/               # Shared utilities, types, constants
│   ├── assets/            # SVG icons
│   └── styles/            # Global CSS, Tailwind config
├── public/                # Static assets (copied to dist/)
├── dist/                  # Build output (git-ignored)
├── docs/                  # Documentation (currently empty, new files added)
├── manifest.json          # Chrome extension manifest
├── index.html             # HTML shell for popup
├── vite.config.ts         # Vite build configuration
├── build-scripts.mjs      # Custom build script for background/content
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

### "Start here" files

**Entry points**:

1. **`manifest.json`** - Declares extension structure, permissions, entry points
2. **`src/main.tsx`** - React app initialization, Redux store setup
3. **`src/App.tsx`** - Root component, routing logic
4. **`src/background.ts`** - Background service worker (alarms, blocking)

### Most Important Modules

| File                                         | Purpose                             | Why it matters                                  |
| -------------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| **`src/store/slices/timerSlice.ts`**         | Timer state machine + session logic | Core business logic for focus/break cycles      |
| **`src/store/hooks/useTimer.ts`**            | Timer coordination hook             | Connects components to timer functionality      |
| **`src/lib/session-duration-calculator.ts`** | Dynamic session sizing formulas     | Implements adaptive AI logic (momentum/fatigue) |
| **`src/background.ts`**                      | Service worker                      | Handles alarms, blocking, persistence           |
| **`src/pages/MainPage.tsx`**                 | Main UI controller                  | Routes to correct view based on session state   |
| **`src/store/services/rewardService.ts`**    | Reward generation logic             | Gamification business logic                     |
| **`src/store/storageMiddleware.ts`**         | Redux ↔ Chrome storage sync         | Persistence layer                               |

### Component Boundaries

**UI Layer** (`src/components/`, `src/pages/`):

- Presentational components (buttons, timers, cards)
- Page-level containers (MainPage, Settings, WelcomePage)
- Views (BeforeWorkSessionView, OngoingFocusSessionView, etc.)

**State Layer** (`src/store/`):

- **Slices**: State + reducers (timerSlice, workHoursSlice, blockedSitesSlice, routingSlice)
- **Selectors**: Memoized state queries
- **Thunks**: Async operations
- **Services**: Pure business logic (no Redux dependencies)
- **Middleware**: Storage sync

**Logic Layer** (`src/lib/`):

- Pure functions (calculations, formatting, validation)
- Shared types and constants
- No UI, no side effects

**Extension Layer**:

- **background.ts**: Chrome service worker context
- **content.ts**: Injected into web pages

---

## Core concepts + domain model

### Glossary

| Term                 | Definition                                                                           |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Work Session**     | The total time goal for a day (e.g., 180 minutes = 3 hours)                          |
| **Focus Session**    | Individual uninterrupted work period (e.g., 25 minutes)                              |
| **Break Session**    | Rest period between focus sessions (e.g., 5-15 minutes)                              |
| **Countdown**        | 10-second transition before resuming focus (time to prepare)                         |
| **Momentum (M)**     | Score 0.0-1.0 tracking session completion reliability (CEWMA algorithm)              |
| **Fatigue (F)**      | Score 0.0-1.0+ measuring mental tiredness (based on work completed + session strain) |
| **Progress (P)**     | Ratio 0.0-1.0+ of completed work vs. daily target (can exceed 1.0)                   |
| **Reward**           | Permission to access a blocked site for a specified duration during break            |
| **Session State**    | Current phase in the work/break cycle (enum with 6 values)                           |
| **Blocker**          | Site in blocklist that gets redirected during focus sessions                         |
| **Work Hours Entry** | Scheduled notification reminder (time + days + enabled flag)                         |
| **Reroll**           | Ability to generate new reward options (limited to 3 per break)                      |

### Core Entities/Models

**TimerState** (src/lib/types.ts):

```typescript
interface TimerState {
  sessionState: SessionState; // Current phase
  isPaused: boolean; // Pause flag

  // Work session (daily goal)
  workSessionDurationRemaining: number; // Seconds left in day's goal
  initialWorkSessionDuration: number; // Daily target in seconds

  // Focus session (individual work period)
  focusSessionDurationRemaining: number;
  initialFocusSessionDuration: number;
  focusSessionEntryTimeStamp?: number; // When session started

  // Break session
  breakSessionDurationRemaining: number;
  initialBreakSessionDuration: number;
  breakSessionEntryTimeStamp?: number;

  // Countdown (transition period)
  focusSessionCountdownTimeRemaining: number;

  // Reward system
  rerolls: number; // Rerolls left (0-3)
  selectedReward: Reward | null; // Chosen break reward
  generatedRewards: Reward[]; // Available rewards
  shownRewardCombinations: string[]; // Prevent duplicate rewards

  // Adaptive logic inputs
  momentum: number; // 0.0-1.0
  completedWorkMinutesToday: number; // Minutes worked today
  targetWorkMinutesToday: number; // Minutes goal for today
  lastCompletedFocusSessionMinutes: number;

  // Weight multipliers (user feedback adjustments)
  fatigueWeightMultiplier: number; // Default 1.0
  momentumWeightMultiplier: number; // Default 1.0

  // Pre-calculated next session durations
  nextFocusDuration: number;
  nextBreakDuration: number;
}
```

**SessionState** (enum):

- `BEFORE_WORK_SESSION`: Initial state, user hasn't started
- `ONGOING_FOCUS_SESSION`: Active work period, sites blocked
- `REWARD_SELECTION`: Choosing break activity
- `ONGOING_BREAK_SESSION`: Break active, selected site unblocked
- `FOCUS_SESSION_COUNTDOWN`: 10-second prep before next focus
- `WORK_SESSION_COMPLETE`: Daily goal reached

**Reward**:

```typescript
interface Reward {
  id: string; // Unique ID
  name: string; // Site name (e.g., "youtube.com")
  duration: string; // Display (e.g., "15 min")
  durationSeconds: number; // Actual duration
}
```

**WorkHoursEntry**:

```typescript
interface WorkHoursEntry {
  id: string; // Timestamp-based ID
  time: string; // Format: "09:00 AM"
  days: boolean[7]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  enabled: boolean; // Toggle on/off
}
```

### Business Rules and Invariants

**MUST be true at all times**:

1. **Session state is atomic**: Only one session state at a time (no overlap)
2. **Timer consistency**: If `sessionState === 'ONGOING_FOCUS_SESSION'`, then `focusSessionEntryTimeStamp` must exist
3. **Momentum bounds**: `0 ≤ momentum ≤ 1` always
4. **Work accounting**: `completedWorkMinutesToday ≤ targetWorkMinutesToday` at session start
5. **Reroll limits**: `0 ≤ rerolls ≤ 3`
6. **Timestamp integrity**: Entry timestamps are set when session starts, cleared when ends
7. **Duration positivity**: All duration values ≥ 0
8. **Break reward coupling**: If `sessionState === 'ONGOING_BREAK_SESSION'`, then `selectedReward !== null`

**Calculated values**:

- **Focus duration**: `BASE + MOMENTUM_WEIGHT * M - FATIGUE_WEIGHT * F - PROGRESS_WEIGHT * P` (clamped to min 5 min)
- **Break duration**: `BASE + FATIGUE_WEIGHT * F + PROGRESS_WEIGHT * P + MOMENTUM_WEIGHT * M`
- **Fatigue**: `(W/T)² + SESSION_STRAIN_WEIGHT * (last_session_minutes / (0.5*T))²`
- **Momentum update**: `CEWMA_ALPHA * outcome + (1 - CEWMA_ALPHA) * current_momentum`

---

## Key workflows (step-by-step)

### Workflow 1: Starting a Focus Session

**Trigger**: User clicks "Start Focus Session" button

**Flow**:

```
1. Component: BeforeWorkSessionView.tsx
   - User clicks <PrimaryButton>
   - Calls: startFocusSession() from useTimer hook

2. Hook: useTimer.ts
   - Dispatches: dispatch(startFocusSession())

3. Redux: timerSlice.ts → startFocusSession reducer
   - Sets: sessionState = 'ONGOING_FOCUS_SESSION'
   - Sets: focusSessionDurationRemaining = nextFocusDuration
   - Sets: focusSessionEntryTimeStamp = Date.now()
   - Sets: isPaused = false

4. Middleware: storageMiddleware.ts
   - Detects state change
   - Writes: chrome.storage.local.set({ timerState: {...} })

5. Background: background.ts → chrome.storage.onChanged listener
   - Detects: timerState.sessionState changed
   - Calls: updateBlockingRules()
   - Gets: blockedSites from storage
   - Creates: declarativeNetRequest rules for each site
   - Updates: chrome.declarativeNetRequest.updateDynamicRules()

6. Component: MainPage.tsx re-renders
   - Selects: sessionState via useAppSelector(selectSessionState)
   - Renders: <OngoingFocusSessionView>

7. View: OngoingFocusSessionView.tsx
   - Shows: Live countdown timer
   - Polls: calculateRemaining() every second (via useTimer effect)
   - Displays: Pause/End Early buttons
```

**Data transformations**:

- `nextFocusDuration` (seconds) → copied to `focusSessionDurationRemaining`
- `Date.now()` (milliseconds) → stored as `focusSessionEntryTimeStamp`
- Blocked sites array → Chrome declarativeNetRequest rules

**Edge cases**:

- If no blocked sites configured → blocking rules are empty (no sites blocked)
- If `workSessionDurationRemaining < nextFocusDuration` → clamps focus duration to remaining work time

**Where bugs often happen**:

- Timer drift (using `Date.now()` diff instead of `setInterval` counters)
- Background service worker sleeping → alarms used for persistence
- Storage sync failures → always check chrome.runtime.lastError

---

### Workflow 2: Completing a Focus Session (Automatic)

**Trigger**: Focus session timer reaches 0

**Flow**:

```
1. Hook: useTimer.ts → useEffect interval
   - Every 1 second:
     remaining = calculateRemaining(initialDuration, entryTimeStamp)
   - When: remaining <= 0

2. Notification: NotificationService.notifyFocusComplete()
   - Sends: chrome.runtime.sendMessage({ type: 'SESSION_NOTIFICATION', ... })

3. Background: background.ts → chrome.runtime.onMessage listener
   - Receives message
   - Calls: chrome.notifications.create({ title: 'Focus Complete', ... })

4. Hook: useTimer.ts
   - Dispatches: transitionToRewardSelection()

5. Redux: timerSlice.ts → transitionToRewardSelection reducer
   - Calculates: completedInSegment (how much work was done)
   - Updates: momentum using updateCEWMA(momentum, true) [true = completed]
   - Updates: completedWorkMinutesToday += secondsToMinutes(completedInSegment)
   - Calculates: new nextFocusDuration and nextBreakDuration (adaptive sizing)
   - Checks: if workSessionDurationRemaining <= 0
     - Yes → sessionState = 'WORK_SESSION_COMPLETE'
     - No → sessionState = 'REWARD_SELECTION'
   - Resets: rerolls = 3, shownRewardCombinations = []

6. Thunk: timerThunks.ts → generateInitialRewards (triggered by useEffect)
   - Calls: RewardService.generateRewards(blockedSites, 3, shownCombinations)
   - Dispatches: setGeneratedRewards(rewards)
   - Dispatches: addShownRewardCombination(key) for each reward

7. Component: MainPage.tsx re-renders
   - Renders: <RewardSelectionView>

8. View: RewardSelectionView.tsx
   - Displays: 3 reward cards
   - Shows: "Re-rolls left: 3"
   - User can: click card to select, or reroll
```

**Important calculations**:

```javascript
// Momentum update (CEWMA algorithm)
newMomentum = CEWMA_ALPHA * 1 + (1 - CEWMA_ALPHA) * currentMomentum
// Example: If current momentum = 0.6, new = 0.5 * 1 + 0.5 * 0.6 = 0.8

// Fatigue calculation
progress = completedWork / targetWork
fatigueBase = progress²
sessionStrain = (lastSessionMinutes / (0.5 * targetWork))²
fatigue = fatigueBase + 0.5 * sessionStrain

// Next focus duration
nextFocus = 10 + 30*momentum - 25*fatigue - 10*progress  [minutes]
// Rounded to nearest 5 min, clamped to ≥5 min
```

---

### Workflow 3: Selecting a Break Reward

**Trigger**: User clicks reward card during REWARD_SELECTION

**Flow**:

```
1. Component: RewardSelectionView.tsx
   - User clicks: <Card onClick={() => selectReward(reward)}>

2. Hook: useTimer.ts
   - Calls: dispatch(selectReward(reward))

3. Redux: timerSlice.ts → selectReward reducer
   - Sets: selectedReward = reward
   - Sets: breakSessionDurationRemaining = reward.durationSeconds
   - Sets: sessionState = 'ONGOING_BREAK_SESSION'
   - Sets: breakSessionEntryTimeStamp = Date.now()
   - Sets: nextBreakDuration = reward.durationSeconds
   - Clears: generatedRewards = []
   - Clears: shownRewardCombinations = []

4. Middleware: storageMiddleware.ts
   - Writes updated state to chrome.storage

5. Background: background.ts
   - Detects: sessionState changed to 'ONGOING_BREAK_SESSION'
   - Calls: updateBlockingRules()
   - Removes: all declarativeNetRequest rules (sites unblocked)

6. Component: MainPage.tsx
   - Renders: <OngoingBreakSessionView>

7. View: OngoingBreakSessionView.tsx
   - Shows: Countdown timer for break
   - Displays: <RewardLink> showing selected site
   - User can: click link to visit site, or end break early
```

**Data flow**:

```
Reward object (in memory)
    ↓
selectReward action
    ↓
Redux store updated
    ↓
Storage middleware persists
    ↓
Background worker reacts
    ↓
Blocking rules removed
    ↓
User can access site
```

---

### Workflow 4: Site Blocking (Background)

**Trigger**: Session state changes to ONGOING_FOCUS_SESSION OR ONGOING_BREAK_SESSION ends

**Flow**:

```
1. Background: background.ts → updateBlockingRules()
   - Reads: chrome.storage.local.get(['blockedSites', 'timerState'])
   - Checks: shouldBlock = timerState.sessionState === 'ONGOING_FOCUS_SESSION'

2. If shouldBlock === true:
   - For each site in blockedSites:
     rule = {
       id: index + 1,
       priority: 1,
       action: {
         type: 'redirect',
         redirect: { url: chrome.runtime.getURL('index.html') }
       },
       condition: {
         urlFilter: `*://*.${site}/*`,
         resourceTypes: ['main_frame']
       }
     }
   - Gets: existing rules via chrome.declarativeNetRequest.getDynamicRules()
   - Updates: chrome.declarativeNetRequest.updateDynamicRules({
       removeRuleIds: [existingIds],
       addRules: [newRules]
     })

3. If shouldBlock === false:
   - Removes: all dynamic rules

4. User navigates to youtube.com:
   - Chrome intercepts: matches rule for *.youtube.com/*
   - Redirects to: chrome-extension://<id>/index.html
   - Extension popup opens, showing current session state
```

**Important edge cases**:

- If blockedSites array is empty → no rules created
- If service worker is asleep → rules persist (declarativeNetRequest is persistent)
- If user disables extension → rules are removed automatically
- URL patterns use wildcards → `*.youtube.com/*` blocks all subdomains

---

### Workflow 5: Adaptive Session Sizing (Momentum Update)

**Trigger**: Focus session ends (completed OR abandoned early)

**Flow**:

```
1. User completes session OR clicks "End early"

2. Redux: Determines outcome
   - Completed: lastFocusSessionCompleted = true
   - Abandoned: lastFocusSessionCompleted = false

3. Calculator: session-duration-calculator.ts → updateCEWMA()
   Input: (currentMomentum, sessionCompleted)
   Formula: newMomentum = CEWMA_ALPHA * outcome + (1 - CEWMA_ALPHA) * currentMomentum
   Where: outcome = 1 if completed, 0 if abandoned

   Example scenarios:
   - Current momentum: 0.6, completed → 0.5*1 + 0.5*0.6 = 0.8 ✓ (improving)
   - Current momentum: 0.8, abandoned → 0.5*0 + 0.5*0.8 = 0.4 ✗ (declining)

4. Calculator: calculateFatigue()
   Input: (completedWorkMinutes, targetWorkMinutes, lastSessionMinutes)

   Step A: Base fatigue from cumulative work
   progress = completedWork / target
   fatigueBase = progress²

   Step B: Session strain from recent intensity
   sessionThreshold = 0.5 * target  [sessions > 50% of daily target are "big"]
   sessionStrainRatio = lastSessionMinutes / sessionThreshold
   sessionStrain = sessionStrainRatio²

   Step C: Combine
   fatigue = fatigueBase + 0.5 * sessionStrain

5. Calculator: calculateFocusSessionDuration()
   Input: (momentum, fatigue, progress, multipliers)

   Formula:
   duration = BASE + MOMENTUM_WEIGHT * momentum
                   - FATIGUE_WEIGHT * fatigue
                   - PROGRESS_WEIGHT * progress

   With defaults:
   duration = 10 + 30*M - 25*F - 10*P  [minutes]

   Then:
   - Round to nearest 5 min
   - Clamp to ≥5 min
   - Clamp to workSessionDurationRemaining

6. Calculator: calculateBreakDuration()
   Formula:
   duration = BASE + FATIGUE_WEIGHT * fatigue
                   + PROGRESS_WEIGHT * progress
                   + MOMENTUM_WEIGHT * momentum

   With defaults:
   duration = 5 + 10*F + 2*P + 4*M  [minutes]

   Then: Round to nearest 5 min

7. Redux: timerSlice stores new values
   - nextFocusDuration (seconds)
   - nextBreakDuration (seconds)

8. UI: Displays new durations before next session starts
```

**Example calculation walkthrough**:

```
Scenario: User completed 60 minutes of 180-minute daily goal
- completedWork = 60 min
- target = 180 min
- lastSession = 25 min
- currentMomentum = 0.7

Step 1: Update momentum (completed session)
newMomentum = 0.5 * 1 + 0.5 * 0.7 = 0.85

Step 2: Calculate fatigue
progress = 60/180 = 0.33
fatigueBase = 0.33² = 0.11
sessionThreshold = 0.5 * 180 = 90 min
sessionStrain = (25/90)² = 0.08
fatigue = 0.11 + 0.5 * 0.08 = 0.15

Step 3: Calculate next focus duration
duration = 10 + 30*0.85 - 25*0.15 - 10*0.33
         = 10 + 25.5 - 3.75 - 3.3
         = 28.45 minutes
Rounded to 30 minutes

Step 4: Calculate break duration
duration = 5 + 10*0.15 + 2*0.33 + 4*0.85
         = 5 + 1.5 + 0.66 + 3.4
         = 10.56 minutes
Rounded to 10 minutes

Result: Next session is 30 min focus, 10 min break
```

---

## Data layer

**No traditional database** - all data stored in Chrome extension storage.

### Storage Schema (chrome.storage.local)

| Key            | Type                | Description                       | Persists |
| -------------- | ------------------- | --------------------------------- | -------- |
| `timerState`   | `TimerState`        | Complete timer state object       | ✓        |
| `workHours`    | `WorkHoursEntry[]`  | Scheduled work reminders          | ✓        |
| `blockedSites` | `BlockedSitesState` | Sites to block + settings         | ✓        |
| `hasOnboarded` | `boolean`           | Whether user completed onboarding | ✓        |

**Storage limits**:

- Chrome sync storage: ~100KB (not used)
- Chrome local storage: ~5MB (used)
- Current data size: <10KB typical

### Key Queries

**Read operations** (via `storageMiddleware.ts`):

```typescript
// Load all state on app start
loadStateFromStorage().then((savedState) => {
  if (savedState.timer) dispatch(updateTimerState(savedState.timer));
  if (savedState.workHours) dispatch(setWorkHours(savedState.workHours));
  // ...
});

// In background.ts
chrome.storage.local.get(['blockedSites', 'timerState'], (result) => {
  const sites = result.blockedSites;
  const timer = result.timerState;
});
```

**Write operations** (automatic via middleware):

```typescript
// Every Redux action triggers storage sync
storageMiddleware: (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();

  // Write to chrome.storage
  chrome.storage.local.set({
    timerState: state.timer,
    workHours: state.workHours.entries,
    blockedSites: state.blockedSites,
    hasOnboarded: state.routing.hasOnboarded,
  });

  return result;
};
```

### Migrations Strategy

**Current approach**: None (breaking changes require user data reset)

**To add migration**:

1. Add version field to stored state
2. Check version on load
3. Transform old format to new format
4. Update version number

**Example**:

```typescript
if (savedState.version === 1) {
  // Migrate v1 → v2
  savedState.timer.newField = defaultValue;
  savedState.version = 2;
}
```

### Seeding/Dev Data

**Default values** (in slice initialState):

- Blocked sites: 11 common sites (YouTube, Instagram, Facebook, etc.)
- Work target: 3 hours (10,800 seconds)
- Momentum: 0.5 (neutral)
- Rerolls: 3

**Reset to defaults**: User must use "Reset All Storage" button in Settings page

---

## API / Interfaces

**No HTTP API** - all interactions via Chrome Extension APIs

### Internal Message Passing

**Popup ↔ Background**:

```typescript
// Send notification request
chrome.runtime.sendMessage({
  type: 'SESSION_NOTIFICATION',
  title: 'Focus Complete',
  message: 'Your focus session has ended!'
});

// Background listens
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SESSION_NOTIFICATION') {
    chrome.notifications.create({ ... });
  }
});
```

**Storage change events**:

```typescript
// Background listens for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.timerState) {
    const newState = changes.timerState.newValue;
    updateBlockingRules();
  }
});
```

### Chrome Extension APIs Used

| API                            | Purpose                   | Permission Required     |
| ------------------------------ | ------------------------- | ----------------------- |
| `chrome.storage.local`         | Persist user data         | `storage`               |
| `chrome.alarms`                | Schedule work reminders   | `alarms`                |
| `chrome.declarativeNetRequest` | Block sites dynamically   | `declarativeNetRequest` |
| `chrome.notifications`         | Show system notifications | `notifications`         |
| `chrome.tabs`                  | Query/close tabs          | `tabs`                  |
| `chrome.runtime`               | Message passing           | (implicit)              |

### AuthN/AuthZ Model

**None** - single-user, local-only extension.

- No accounts
- No login
- No server communication

---

## Frontend

### App Structure

```
src/
├── App.tsx              # Root component, router setup
├── main.tsx             # Entry point, Redux provider
├── pages/               # Full-page routes
│   ├── MainPage.tsx          # Main timer interface (route: /)
│   ├── Settings.tsx          # Settings tabs (route: /settings/*)
│   ├── WelcomePage.tsx       # Onboarding (shown if !hasOnboarded)
│   ├── BlockedSitesPage.tsx  # Blocked sites management
│   ├── WorkHoursPage.tsx     # Work hours settings
│   └── views/                # View components for MainPage states
│       ├── BeforeWorkSessionView.tsx       # BEFORE_WORK_SESSION state
│       ├── OngoingFocusSessionView.tsx     # ONGOING_FOCUS_SESSION state
│       ├── RewardSelectionView.tsx         # REWARD_SELECTION state
│       ├── OngoingBreakSessionView.tsx     # ONGOING_BREAK_SESSION state
│       ├── FocusSessionCountdownView.tsx   # FOCUS_SESSION_COUNTDOWN state
│       └── WorkSessionCompleteView.tsx     # WORK_SESSION_COMPLETE state
└── components/          # Reusable UI components
    ├── NavBar.tsx            # Top navigation
    ├── CountdownTimer.tsx    # Timer display
    ├── Card.tsx              # Reward card
    ├── CardCarousel.tsx      # Multiple cards
    ├── PrimaryButton.tsx     # Button variants
    └── ...
```

### State Management Approach

**Redux Toolkit with feature-based architecture**:

```
src/store/
├── index.ts                 # Store configuration
├── hooks.ts                 # useAppDispatch, useAppSelector
├── storageMiddleware.ts     # Syncs Redux → chrome.storage
├── slices/                  # Feature slices
│   ├── timerSlice.ts             # Timer state machine
│   ├── workHoursSlice.ts         # Work hours CRUD
│   ├── blockedSitesSlice.ts      # Blocked sites CRUD
│   └── routingSlice.ts           # Onboarding state
├── selectors/               # Memoized selectors
│   ├── timerSelectors.ts         # 40+ timer selectors
│   ├── workHoursSelectors.ts     # Work hours queries
│   ├── blockedSitesSelectors.ts  # Blocked sites queries
│   └── routingSelectors.ts       # Routing queries
├── thunks/                  # Async operations
│   └── timerThunks.ts            # generateInitialRewards, rerollReward
├── services/                # Business logic
│   ├── rewardService.ts          # Reward generation (pure)
│   └── notificationService.ts    # Notification helpers
└── hooks/                   # Feature hooks
    └── useTimer.ts               # Timer coordination
```

**Key patterns**:

1. **Selectors for all state access** (no inline `(state) => state.foo.bar`)
2. **Services for business logic** (no Redux dependencies)
3. **Thunks for async/complex operations**
4. **Middleware for side effects** (storage sync)

### Routing

**React Router v6**:

```typescript
<Router>
  <Routes>
    <Route path="/" element={<MainPage />} />
    <Route path="/settings" element={<Navigate to="/settings/work-hours" />} />
    <Route path="/settings/work-hours" element={<WorkHoursPage />} />
    <Route path="/settings/blocked-sites" element={<BlockedSitesPage />} />
  </Routes>
</Router>
```

**Conditional rendering**:

- If `!hasOnboarded` → show `<WelcomeView>` (no routing)
- Else → show router-based pages

### Key Screens and User Flow Mapping

| Session State             | Rendered Component          | User Actions                          |
| ------------------------- | --------------------------- | ------------------------------------- |
| `BEFORE_WORK_SESSION`     | `BeforeWorkSessionView`     | Start session, change duration        |
| `ONGOING_FOCUS_SESSION`   | `OngoingFocusSessionView`   | Pause, resume, end early              |
| `REWARD_SELECTION`        | `RewardSelectionView`       | Select reward, reroll                 |
| `ONGOING_BREAK_SESSION`   | `OngoingBreakSessionView`   | View timer, end early                 |
| `FOCUS_SESSION_COUNTDOWN` | `FocusSessionCountdownView` | Wait (countdown), energy check dialog |
| `WORK_SESSION_COMPLETE`   | `WorkSessionCompleteView`   | Reset for tomorrow                    |

---

## Background jobs / Async work

### Work Hour Reminders (Chrome Alarms)

**Purpose**: Notify user at scheduled times to start work

**Implementation**:

```typescript
// In background.ts
async function scheduleWorkReminders() {
  const { workHours } = await chrome.storage.local.get(['workHours']);

  // Clear existing alarms
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (alarm.name.startsWith('work-reminder-')) {
      chrome.alarms.clear(alarm.name);
    }
  }

  // Schedule new alarms
  for (const entry of workHours) {
    if (!entry.enabled) continue;

    for (let day = 0; day < 7; day++) {
      if (!entry.days[day]) continue;

      const nextOccurrence = calculateNextOccurrence(entry.time, day);
      chrome.alarms.create(`work-reminder-${entry.id}-${day}`, {
        when: nextOccurrence.getTime(),
      });
    }
  }
}

// Listen for alarm firing
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('work-reminder-')) {
    chrome.notifications.create({
      type: 'basic',
      title: 'Recess: Time to Start Work?',
      message: 'Would you like to start your work session now?',
      buttons: [{ title: 'Start Work' }],
      requireInteraction: true,
    });
  }
});
```

**Retry behavior**: Chrome alarms automatically persist across browser restarts

**Idempotency**: Alarms are cleared and recreated on every workHours change

**Failure handling**: If notification fails, alarm is lost (no retry)

---

### Timer Tick (UI Effect)

**Not a background job** - runs only when popup is open:

```typescript
// In useTimer.ts
useEffect(() => {
  if (activeStates.includes(sessionState) && !isPaused) {
    const intervalId = setInterval(() => {
      // Calculate remaining time
      const remaining = calculateRemaining(initialDuration, entryTimeStamp);

      // Check for transitions
      if (remaining <= 0) {
        dispatch(transitionToNextState());
      } else {
        setTick((t) => t + 1); // Force re-render
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }
}, [sessionState, isPaused, ...dependencies]);
```

**Why not use chrome.alarms for timer?**: Need sub-second precision for UI

**Persistence**: Entry timestamps stored, so timer can resume after popup closes

---

## Configuration & Environments

### Config System

**No environment variables** - all configuration is in source code constants:

```typescript
// src/lib/constants.ts
export const DEFAULT_WORK_SESSION_DURATION = 3 * 60 * 60; // 3 hours
export const DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME = 10; // 10 seconds
export const DEFAULT_REROLLS = 3;
export const MAX_REWARD_TIME = 30; // 30 minutes
export const NOTIFY_TIME_LEFT_SECONDS = 300; // 5 minutes

// Algorithm weights
export const CEWMA_ALPHA = 0.5;
export const BASE_WORK_MINUTES = 10;
export const MOMENTUM_WORK_WEIGHT = 30;
export const FATIGUE_WORK_WEIGHT = 25;
// ... etc
```

**To change defaults**: Edit constants.ts and rebuild

### Env Vars

**None used** - pure client-side extension

**Chrome extension ID**: Auto-generated by Chrome, different per install

### Local vs Production

**No distinction** - same build for all environments

**To test in "production-like"**: Load unpacked extension with `dist/` folder

---

## Observability & Operations

### Logging Approach

**Browser console** (all logs visible in popup DevTools):

```typescript
// Sparse logging in production code
console.error('Error updating blocking rules:', error); // Only errors
```

**To add debugging**:

```typescript
// In development, add console.log
console.log('Timer state:', timerState);
console.log('Blocking rules updated:', rules);
```

**Background script logs**: Check `chrome://serviceworker-internals/` → find Recess → "Inspect"

### Metrics/Tracing

**None** - no analytics, telemetry, or monitoring

**User-facing metrics**:

- `completedWorkMinutesToday` (shown in UI)
- `momentum` (used in calculations, not displayed)

### Error Handling Patterns

**Chrome API errors**:

```typescript
chrome.storage.local.set({ key: value }, () => {
  if (chrome.runtime.lastError) {
    console.error('Storage error:', chrome.runtime.lastError);
  }
});
```

**Redux errors**: Caught by React error boundaries (none configured)

**Async errors**: Try-catch in thunks, logged to console

### Where to Look When Debugging Production Issues

1. **Extension popup not loading**:

   - Open DevTools on popup: Right-click extension icon → Inspect popup
   - Check Console tab for errors

2. **Background script issues**:

   - Go to `chrome://extensions/` → Recess → "Service worker" link
   - Or: `chrome://serviceworker-internals/` → find Recess → Inspect

3. **Storage issues**:

   - Open popup DevTools → Application tab → Storage → Extension Storage
   - Check `timerState`, `workHours`, `blockedSites` keys

4. **Blocking not working**:

   - Check `chrome://extensions/` → Recess → verify "On" switch is enabled
   - Check background script console for "Blocking rules updated" logs
   - Verify sites format (no `https://`, no trailing slash)

5. **Notifications not showing**:

   - Check Chrome notification settings: chrome://settings/content/notifications
   - Verify `notifications` permission in manifest

6. **Alarms not firing**:
   - `chrome://serviceworker-internals/` → check if worker is sleeping
   - Check alarm list: Open background console, run `chrome.alarms.getAll().then(console.log)`

---

## Testing Strategy

### Test Types Present

**None** - repository contains no tests

### How to Run Them

N/A

### Mocking/Fakes Approach

**For future tests**, recommended approach:

**Chrome API mocks**:

```typescript
// Mock chrome.storage
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback(mockData)),
      set: jest.fn((data, callback) => callback()),
    },
  },
};
```

**Redux mocks**:

```typescript
// Use @reduxjs/toolkit's configureStore for test store
const testStore = configureStore({
  reducer: { timer: timerReducer },
  preloadedState: { timer: mockTimerState },
});
```

**Service mocks**:

```typescript
// Services are pure functions, easy to test
expect(RewardService.generateReward(sites, [])).toEqual(expectedReward);
```

### Where to Add New Tests for New Features

Recommended test locations:

```
src/
├── store/
│   ├── selectors/__tests__/
│   │   └── timerSelectors.test.ts
│   ├── services/__tests__/
│   │   ├── rewardService.test.ts
│   │   └── notificationService.test.ts
│   ├── slices/__tests__/
│   │   └── timerSlice.test.ts
│   └── thunks/__tests__/
│       └── timerThunks.test.ts
├── lib/__tests__/
│   ├── session-duration-calculator.test.ts
│   └── timer-utils.test.ts
└── components/__tests__/
    └── CountdownTimer.test.tsx
```

---

## Contribution Guide

### Code Style Conventions

**Enforced by Prettier**:

```bash
npm run format        # Auto-format
npm run format:check  # Check without writing
```

**Config**: `.prettierrc` (default settings)

**TypeScript**:

- Strict mode enabled (`tsconfig.json`)
- All function params must be typed
- Avoid `any` types
- Use interfaces for object shapes

**React**:

- Functional components only (no class components)
- Use hooks (useState, useEffect, useCallback, useMemo)
- Props destructured in function signature
- Export component as default

**Redux**:

- Use Redux Toolkit (no plain Redux)
- Slices in `slices/` folder
- Selectors in `selectors/` folder
- No inline state access (use selectors)

### Branching/PR Expectations

**Inferred from commit history**:

- Main branch: `main` (or `master`)
- Feature branches: `feature/description`
- Commit directly to main for small changes
- Use PRs for large features

**Recommended**:

- Branch naming: `feature/add-pause-button`, `fix/timer-drift`
- Commit messages: Descriptive, present tense ("Add pause button", not "Added")
- PR description: What changed, why, testing done

### Common Patterns to Follow

**1. Adding a new selector**:

```typescript
// In selectors/featureSelectors.ts
export const selectNewValue = createSelector(
  [selectFeatureState],
  (feature) => feature.newProperty
);
```

**2. Adding a new action**:

```typescript
// In slices/featureSlice.ts
reducers: {
  newAction: (state, action: PayloadAction<Type>) => {
    state.property = action.payload;
  };
}
```

**3. Reading state in components**:

```typescript
import { useAppSelector } from '../store/hooks';
import { selectFeatureData } from '../store/selectors';

const data = useAppSelector(selectFeatureData);
```

**4. Dispatching actions**:

```typescript
import { useAppDispatch } from '../store/hooks';
import { actionName } from '../store/slices/featureSlice';

const dispatch = useAppDispatch();
dispatch(actionName(payload));
```

**5. Complex async operations**:

```typescript
// Create thunk in thunks/featureThunks.ts
export const complexOperation = createAsyncThunk<void, PayloadType, { state: RootState }>(
  'feature/operation',
  async (payload, { getState, dispatch }) => {
    const state = getState();
    // Business logic
    dispatch(updateState(result));
  }
);

// Use in component
dispatch(complexOperation(data));
```

### Anti-patterns to Avoid

❌ **Don't**: Access state directly

```typescript
const data = useAppSelector((state) => state.feature.data); // BAD
```

✅ **Do**: Use selectors

```typescript
const data = useAppSelector(selectFeatureData); // GOOD
```

❌ **Don't**: Put business logic in components

```typescript
const handleClick = () => {
  const result = complexCalculation(data); // BAD
  dispatch(updateData(result));
};
```

✅ **Do**: Put logic in services/thunks

```typescript
const handleClick = () => {
  dispatch(performComplexOperation(data)); // GOOD
};
```

❌ **Don't**: Mutate state outside reducers

```typescript
timerState.sessionState = 'ONGOING_FOCUS_SESSION'; // BAD
```

✅ **Do**: Dispatch actions

```typescript
dispatch(startFocusSession()); // GOOD
```

❌ **Don't**: Use inline styles

```typescript
<div style={{ color: 'red' }}>Text</div> // BAD
```

✅ **Do**: Use CSS modules

```typescript
<div className={styles.errorText}>Text</div> // GOOD
```

---

## If You Only Read 5 Files

**Essential reading** (in order):

1. **`manifest.json`** (5 min) - Extension structure, permissions, what Chrome APIs are used
2. **`src/lib/types.ts`** (10 min) - Core domain models (TimerState, SessionState, Reward)
3. **`src/store/slices/timerSlice.ts`** (20 min) - State machine logic, session transitions, all actions
4. **`src/background.ts`** (15 min) - Site blocking, alarms, how background script works
5. **`src/store/hooks/useTimer.ts`** (15 min) - How components interact with timer state

**Bonus reads** (if you have more time):

6. **`src/lib/session-duration-calculator.ts`** - Adaptive algorithm formulas
7. **`src/pages/MainPage.tsx`** - How UI switches between views
8. **`src/store/selectors/timerSelectors.ts`** - Available state queries
9. **`src/store/storageMiddleware.ts`** - How Redux syncs to Chrome storage
10. **`src/lib/constants.ts`** - Tunable parameters and weights

**Quick test**: After reading these files, you should be able to answer:

- What happens when a user clicks "Start Focus Session"?
- How does site blocking work?
- How are focus session durations calculated?
- Where is state persisted?
- What are the 6 possible session states?

---

## Open Questions / Assumptions

**Assumptions made** (verify with team):

1. **No backend** - Assumed this is a fully client-side extension (no API calls observed in code)
2. **Single-user only** - No multi-user, team, or sync features inferred
3. **Chrome-only** - Manifest V3 is Chrome-specific, not compatible with Firefox/Safari
4. **No analytics** - No tracking, metrics, or crash reporting observed
5. **Manual updates** - Users must manually update extension from Chrome Web Store
6. **English-only** - No i18n/localization infrastructure present
7. **Free app** - No payment, subscriptions, or monetization features

**Questions for the team**:

1. **Is there a backend planned?** (user accounts, cloud sync, analytics)
2. **What's the deployment frequency?** (how often do we push updates)
3. **Are there known performance issues?** (slow UI, memory leaks)
4. **Is there a roadmap?** (what features are planned next)
5. **Who are the target users?** (students, professionals, specific demographics)
6. **How is user feedback collected?** (Chrome Web Store reviews, support email)
7. **Are there any legal/privacy concerns?** (data collection policies)
8. **What's the browser support plan?** (Firefox, Edge, Safari)
9. **Is there an onboarding flow planned?** (WelcomeView exists but minimal)
10. **How do we handle breaking changes?** (storage schema migrations)

**Code quality questions**:

1. **Why no tests?** (technical debt, time constraints, or intentional decision)
2. **Why manual build for background/content scripts?** (`build-scripts.mjs` vs. Vite)
3. **Why MUI + Tailwind?** (using both UI libraries seems redundant)
4. **What's the icon design story?** (logo.png exists, but no icon variations)
5. **Is there a design system?** (colors, spacing, typography seem ad-hoc)

---

## Additional Resources

**Useful Chrome Extension docs**:

- [Manifest V3 migration guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [declarativeNetRequest API](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/)
- [chrome.alarms API](https://developer.chrome.com/docs/extensions/reference/alarms/)
- [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

**Internal documentation**:

- `README.md` - High-level overview
- `SETUP.md` - Setup instructions
- `docs/redux-architecture.md` - Redux patterns and conventions
- `docs/redux-refactoring-summary.md` - Recent Redux refactoring changes

**Product documentation**:

- `MVP_Product_Requirements_Document.pdf` - Original product requirements
- `Recess User Journey.pdf` - User flow diagrams
- `Recess Designs/` - Design mockups and assets

---

## Glossary (Expanded)

| Term                      | Definition                                                                         | Example                                      |
| ------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| **CEWMA**                 | Completion Exponentially Weighted Moving Average - algorithm for tracking momentum | If you complete 4/5 sessions, momentum ≈ 0.8 |
| **Service Worker**        | Background script that runs independently of any web page (Manifest V3)            | `background.ts` runs as service worker       |
| **Content Script**        | JavaScript injected into web pages by extension                                    | `content.ts` (currently empty)               |
| **declarativeNetRequest** | Chrome API for blocking/redirecting network requests                               | Used to block distracting sites              |
| **Redux Toolkit**         | Official recommended approach for Redux (includes createSlice, thunks)             | All slices use RTK patterns                  |
| **Selector**              | Function that extracts/derives data from Redux state                               | `selectTimerState(state)`                    |
| **Thunk**                 | Redux function for async operations or complex logic                               | `generateInitialRewards`                     |
| **Slice**                 | Redux Toolkit term for feature module (state + reducers + actions)                 | `timerSlice.ts`                              |
| **Middleware**            | Redux function that intercepts actions for side effects                            | `storageMiddleware.ts` syncs to Chrome       |
| **Manifest V3**           | Latest Chrome extension platform (replaced Manifest V2 in 2023)                    | More secure, service worker-based            |

---

**Document version**: 1.0  
**Last reviewed**: January 9, 2026  
**Maintainer**: Engineering team  
**Feedback**: Open an issue or PR to update this document
