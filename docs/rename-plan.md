# Recess Rename and Convergence Plan

- **Status:** Not started. Nothing here is implemented.
- **Updated:** 2026-10-04
- **Scope:** Bringing code identifiers and behaviour in line with `docs/glossary.md`

`docs/glossary.md` is the source of truth for domain intent. This file records where the code disagrees with it, and in what order to close the gap. Work the sections top to bottom: §1 is mechanical and unblocks §2.

Term mapping is summarised in `docs/architecture.md` §1.

---

## 1. Identifier renames

Mechanical, no behaviour change. Safe to land as one commit per table row.

| Old | New | Locations |
| --- | --- | --- |
| `SCHEDULER_PHASE.FOCUS_BLOCK` | `SCHEDULER_PHASE.FOCUS` | `Shared/Constants/Constants.ts`, `SchedulerService.ts` |
| `SCHEDULER_PHASE.REWARD_GAME` | `SCHEDULER_PHASE.REWARD_SELECTION` | same |
| `TimedSchedulerPhase` | `TimedPhase` | `SchedulerService.ts`, `AppState.ts` |
| `WORK_SESSION_DURATION` | `SESSION_DURATION` | `Constants.ts`, `SchedulerService.ts`, `defaults.ts`, `PersistedAppStateSchema.ts` |
| `workSessionTarget` | `sessionTarget` | `AppState.ts`, `PersistedAppStateSchema.ts`, `defaults.ts` |
| `workSessionRemaining` | `sessionRemaining` | same, plus `SchedulerService.test.ts` |
| `startWorkSession` / `endWorkSession` | `startSession` / `endSession` | `SchedulerService.ts` |
| `APP_ACTION.START_WORK_SESSION` | `START_SESSION` | `Constants.ts`, `AppState.ts` |
| `APP_ACTION.END_WORK_SESSION_EARLY` | `END_SESSION_EARLY` | same |
| `BlockListEntry` | `BlockedListEntry` | `AppState.ts`, `PersistedAppStateSchema.ts` |
| `blockList` (state key) | `blockedList` | schema, defaults, reducers, selectors |
| `Services/BlockListManagement/` | `Services/BlockedList/` | directory |
| `WorkStartReminder*` (types, service, actions) | `StartReminder*` | `Shared/Types/`, `Services/WorkStartReminder/`, `Constants.ts`, `AppState.ts` |
| `APP_ACTION.SET_WORK_START_REMINDER` | `SET_START_REMINDER` | `Constants.ts`, `AppState.ts` |

### Resolve before renaming

**`Reward` means two different things.** In code, `Reward` (`AppState.ts`) is `{ id, name, duration }` — a Blocked List entry plus its unlock duration, held in `RecessPickerState`. In the glossary, `Reward Selection Phase` is a Phase type. Renaming `SCHEDULER_PHASE.REWARD_GAME` without first settling this makes the codebase actively more confusing.

Pick one:

- **(a)** Rename the interface to `UnblockedEntry` (or `BlockedListSelection`) and keep `REWARD_SELECTION` for the Phase.
- **(b)** Keep `Reward` for the interface, name the Phase constant `REWARD_SELECTION_PHASE`, and rely on the `SCHEDULER_PHASE` prefix to disambiguate.

Recommendation: (a). The interface's meaning is stable and the Phase is the thing the glossary governs.

### User-facing copy

`Services/WorkStartReminder/WorkStartReminderService.ts` ships the notification body `"Your focus block is ready."` — pre-rename terminology shown to users. Retitle alongside the rename.

### Duplicate type

`WorkStartReminderValue` is declared in **both** `Shared/Types/WorkStartReminder.ts` and `Services/WorkStartReminder/WorkStartReminderService.ts`. Collide these while renaming; one of them should import the other.

---

## 2. Behavioural divergences

Ordered roughly by dependency. Each entry names the glossary rule, the current code, and the change.

### 2.1 Spec-only, no implementation

Specified in the glossary, zero code. Nothing to rename — these are new work.

| Glossary term | Current code |
| --- | --- |
| `Focus Streak` | none |
| `Session Streak` | none |
| `Check-In` | none |
| `Session Timeline` | commented-out scaffolding only, in `AppState.ts` (`SchedulerPhaseTimelineEntry`) and `SchedulerService.ts` (`timeline: []`) |

`Session Timeline` is the only one with a starting point; the other three need design before code.

### 2.2 Session clock runs during Reward Selection Phase

- **Glossary:** "The timer runs during Focus and Recess, and stops during Pause and Reward Selection Phase."
- **Code:** `evaluateScheduler` decrements `workSessionRemaining` for every timed phase, including `REWARD_GAME`.
- **Change:** skip the decrement for the Reward Selection Phase. Affects the projected end of a Session.

### 2.3 Session duration is fixed, not user-declared

- **Glossary:** "A user-declared continuous period... The declared duration must be a multiple of five minutes."
- **Code:** `WORK_SESSION_DURATION = 2 * 60 * 60`, used as both target and remaining at start. No UI to declare a duration.
- **Change:** add a declaration step; validate against Window multiples.

### 2.4 Focus duration is hardcoded

- **Glossary:** silent — it specifies only that Recess is Scheduler-determined and clamped 5–20 minutes. The old 15–60 minute Focus clamp was dropped in the rewrite.
- **Code:** `PHASE_DURATION.FOCUS_BLOCK = 25 * 60`. `MIN_FOCUS_SESSION_DURATION` / `MAX_FOCUS_SESSION_DURATION` exist (15/60 min) but are unused by the Scheduler.
- **Change:** decide whether Focus is Scheduler-determined like Recess, or whether the dropped clamp should return. **Needs a glossary decision first** — do not guess.

### 2.5 Upcoming Notice duration

- **Glossary:** "A cue that appears near the end of a Focus or Recess." No number, by decision.
- **Code:** `NOTIFY_TIME_LEFT_SECONDS = 5 * 60`, gated on `phaseRemaining`.
- **Change:** none required. Recorded so a future reader does not "fix" one side to match the other. If the duration becomes fixed, decide which doc asserts it.

### 2.6 Coin is unwired

- **Glossary:** "Standard Focus time earns one Coin per completed Window." Coins pay for re-rolls, unblocks, and Pet enhancements.
- **Code:** `awardCompletedFocusCoin` exists in `Services/Coin/CoinService.ts` and **has no callers**. `SET_COIN_BALANCE` exists; nothing awards.
- **Change:** wire earning at Window boundaries, and the three spend paths. The earn rate (1 per Window) is a product decision already made in the glossary.

### 2.7 Reroll allowance

- **Glossary:** "Coins may be spent to re-roll." No free allowance stated.
- **Code:** `DEFAULT_REROLLS = 3`.
- **Change:** confirm whether free rerolls remain. If not, remove the constant.

### 2.8 Blocked List edit gating

- **Glossary:** "Users may add and remove entries when no Session is active, and add entries at any point during one."
- **Code:** `ADD_BLOCKED_SITE` / `REMOVE_BLOCKED_SITE` apply unconditionally; no Session-active gate found.
- **Change:** reject removal while a Session is active.

### 2.9 Unimplemented services

`Services/Coin/`, `Services/Reward/`, and `Services/WorkStartReminder/` exist but their actions and persistence are incomplete — see `docs/architecture.md` §7 item 9. Part of this plan's larger work; not separately sequenced here.

---

## 3. Enforcement

Nothing here is mechanically checked. `docs/architecture.md` §1 and §6 can drift from the code again without a signal.

When the work above lands, consider extending `scripts/hooks/check-architecture.sh` to assert that:

- the deleted terms (`Work Session`, `Focus Block`, `Reward Game`, `Recess Pass`, `Block List`, `Wind-Down Signal`, `Back to Work Countdown`) appear nowhere in `src/`
- every path linked from `README.md` and `docs/architecture.md` exists
- the domain-term mapping table in `docs/architecture.md` §1 has no stale identifiers

The pre-commit hook runs that script **warn-only** (`|| true`), so it reports without blocking. A blocking check would need the script's exit handling changed.