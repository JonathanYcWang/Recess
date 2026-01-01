# Terminology Refactoring Summary

## Overview

Renamed core concepts throughout the codebase for clarity and consistency:

## New Terminology

### Before → After

1. **Work Session** (formerly "total work duration" or "session")

   - The total duration the user aims to work during the day (e.g., 4.5 hours)
   - Represents the daily work target

2. **Focus Session** (formerly "session" or "during session")

   - Individual work periods between breaks (e.g., 15-45 minutes)
   - Dynamic duration based on momentum, fatigue, and progress

3. **Break Session** (formerly "break")

   - Rest periods between focus sessions
   - Not part of focus session; separate concept

4. **Focus Session Countdown** (formerly "back to it")
   - 10-second transition period before re-entering a focus session
   - Gives user time to prepare mentally

## State Name Changes

| Old State          | New State                      |
| ------------------ | ------------------------------ |
| `BEFORE_SESSION`   | `BEFORE_WORK_SESSION`          |
| `DURING_SESSION`   | `ONGOING_FOCUS_SESSION`        |
| `REWARD_SELECTION` | `REWARD_SELECTION` (unchanged) |
| `BREAK`            | `ONGOING_BREAK_SESSION`        |
| `BACK_TO_IT`       | `FOCUS_SESSION_COUNTDOWN`      |
| `SESSION_COMPLETE` | `WORK_SESSION_COMPLETE`        |

## Property Name Changes

### TimerState Interface

| Old Property                  | New Property                           |
| ----------------------------- | -------------------------------------- |
| `backToItTimeRemaining`       | `focusSessionCountdownTimeRemaining`   |
| `initialBackToItDuration`     | `initialFocusSessionCountdownDuration` |
| `backToItEntryTimeStamp`      | `focusSessionCountdownEntryTimeStamp`  |
| `lastCompletedSessionMinutes` | `lastCompletedFocusSessionMinutes`     |

### Constants

| Old Constant                  | New Constant                           |
| ----------------------------- | -------------------------------------- |
| `DEFAULT_BACK_TO_IT_TIME`     | `DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME` |
| `DEFAULT_TOTAL_WORK_DURATION` | `DEFAULT_WORK_SESSION_DURATION`        |

## Action Name Changes

| Old Action             | New Action                          |
| ---------------------- | ----------------------------------- |
| `transitionToBackToIt` | `transitionToFocusSessionCountdown` |

## File Renames

### View Components

| Old File                  | New File                        |
| ------------------------- | ------------------------------- |
| `BeforeSessionView.tsx`   | `BeforeWorkSessionView.tsx`     |
| `DuringSessionView.tsx`   | `OngoingFocusSessionView.tsx`   |
| `BreakView.tsx`           | `OngoingBreakSessionView.tsx`   |
| `BackToItView.tsx`        | `FocusSessionCountdownView.tsx` |
| `SessionCompleteView.tsx` | `WorkSessionCompleteView.tsx`   |

## Files Modified

### Core Logic

- `/src/lib/types.ts` - Updated SessionState enum and TimerState interface
- `/src/lib/constants.ts` - Updated constant names and comments
- `/src/store/slices/timerSlice.ts` - Updated all state management logic
- `/src/store/hooks/useTimer.ts` - Updated hook logic and transitions
- `/src/store/selectors/timerSelectors.ts` - Updated selector logic
- `/src/background.ts` - Updated site blocking check

### UI Components

- `/src/pages/MainPage.tsx` - Updated imports and switch cases
- `/src/pages/views/BeforeWorkSessionView.tsx` - Renamed and updated
- `/src/pages/views/OngoingFocusSessionView.tsx` - Renamed and updated
- `/src/pages/views/OngoingBreakSessionView.tsx` - Renamed and updated
- `/src/pages/views/FocusSessionCountdownView.tsx` - Renamed and updated
- `/src/pages/views/WorkSessionCompleteView.tsx` - Renamed and updated

## Key Clarifications

### Work Session vs Focus Session

**Work Session:**

- Total time goal for the day
- Example: "4.5 hours of work"
- Decreases as focus sessions are completed
- When it reaches zero, `WORK_SESSION_COMPLETE`

**Focus Session:**

- Single uninterrupted work period
- Example: "20 minutes of focused work"
- Followed by a break
- Multiple focus sessions make up a work session

### The Complete Cycle

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

## Why These Changes?

1. **Clarity**: Distinguishes between daily work goal (work session) and individual work periods (focus sessions)
2. **Consistency**: All timing concepts now explicitly named (focus session, break session, countdown)
3. **User-Facing**: Terminology matches how users think about their work
   - "I want to work 4 hours today" = work session
   - "I'm doing a 20-minute focus session" = focus session
   - "I'm taking a 10-minute break" = break session

## Migration Notes

- All old state names and property names have been completely replaced
- No backward compatibility needed (no persisted data uses old names)
- TypeScript will catch any missed references at compile time
- UI text updated to reflect new terminology

## Next Steps

- [ ] Update documentation files (`architecture.md`, `session-lifecycle.md`, etc.)
- [ ] Update any remaining comments that use old terminology
- [ ] Test full session flow with new names
- [ ] Verify site blocking still works with new state name
