import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selector - use this when you need the entire timer state
export const selectTimerState = (state: RootState) => state.timer;

// Derived selectors for specific UI needs
export const selectIsSessionActive = createSelector([selectTimerState], (timer) =>
  ['ONGOING_FOCUS_SESSION', 'ONGOING_BREAK_SESSION', 'FOCUS_SESSION_COUNTDOWN'].includes(
    timer.sessionState
  )
);

export const selectCanPause = createSelector(
  [selectTimerState],
  (timer) =>
    !timer.isPaused &&
    ['ONGOING_FOCUS_SESSION', 'FOCUS_SESSION_COUNTDOWN'].includes(timer.sessionState)
);

export const selectCanResume = createSelector([selectTimerState], (timer) => timer.isPaused);
