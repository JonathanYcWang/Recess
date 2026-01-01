import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Basic selectors
export const selectTimerState = (state: RootState) => state.timer;
export const selectSessionState = (state: RootState) => state.timer.sessionState;
export const selectFocusSessionDurationRemaining = (state: RootState) =>
  state.timer.focusSessionDurationRemaining;
export const selectBreakSessionDurationRemaining = (state: RootState) =>
  state.timer.breakSessionDurationRemaining;
export const selectWorkSessionDurationRemaining = (state: RootState) =>
  state.timer.workSessionDurationRemaining;
export const selectBackToItTimeRemaining = (state: RootState) => state.timer.backToItTimeRemaining;
export const selectRerolls = (state: RootState) => state.timer.rerolls;
export const selectSelectedReward = (state: RootState) => state.timer.selectedReward;
export const selectGeneratedRewards = (state: RootState) => state.timer.generatedRewards;
export const selectPausedFrom = (state: RootState) => state.timer.pausedFrom;

// Memoized selectors
export const selectIsSessionActive = createSelector([selectSessionState], (sessionState) =>
  ['DURING_SESSION', 'BREAK', 'BACK_TO_IT'].includes(sessionState)
);

export const selectCanPause = createSelector([selectSessionState], (sessionState) =>
  ['DURING_SESSION', 'BACK_TO_IT'].includes(sessionState)
);

export const selectCanResume = createSelector(
  [selectSessionState],
  (sessionState) => sessionState === 'PAUSED'
);

export const selectIsBreakTime = createSelector(
  [selectSessionState],
  (sessionState) => sessionState === 'BREAK'
);

export const selectHasRerollsAvailable = createSelector([selectRerolls], (rerolls) => rerolls > 0);
