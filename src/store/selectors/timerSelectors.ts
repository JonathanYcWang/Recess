import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { calculateRemaining } from '../../services/timerService';
import { secondsToMinutes } from '../../services/sessionDurationService';

// Base selector - use this when you need the entire timer state
export const selectTimerState = (state: RootState) => state.timer;

// Core state selectors
export const selectSessionState = createSelector([selectTimerState], (timer) => timer.sessionState);

export const selectIsPaused = createSelector([selectTimerState], (timer) => timer.isPaused);

export const selectRerolls = createSelector([selectTimerState], (timer) => timer.rerolls);

export const selectSelectedReward = createSelector(
  [selectTimerState],
  (timer) => timer.selectedReward
);

export const selectGeneratedRewards = createSelector(
  [selectTimerState],
  (timer) => timer.generatedRewards
);

export const selectShownRewardCombinations = createSelector(
  [selectTimerState],
  (timer) => timer.shownRewardCombinations
);

// Work session selectors
export const selectWorkRemaining = createSelector(
  [selectTimerState],
  (timer) => timer.totalRemaining
);

export const selectWorkSessionDuration = createSelector(
  [selectTimerState],
  (timer) => timer.totalTimer
);

export const selectTargetWorkSecondsToday = createSelector(
  [selectTimerState],
  (timer) => timer.totalTimer
);

export const selectTargetWorkMinutesToday = createSelector([selectTimerState], (timer) =>
  secondsToMinutes(timer.totalTimer)
);

// Current stage (focus/break/countdown) timer selectors
export const selectCurrentTimerRemaining = createSelector([selectTimerState], (timer) => {
  const isTimedState =
    timer.sessionState === 'ONGOING_FOCUS_SESSION' ||
    timer.sessionState === 'ONGOING_BREAK_SESSION' ||
    timer.sessionState === 'FOCUS_SESSION_COUNTDOWN';

  if (isTimedState && !timer.isPaused && timer.currentStartTime !== undefined) {
    return calculateRemaining(timer.currentTimerRemaining, timer.currentStartTime);
  }

  return timer.currentTimerRemaining;
});

export const selectCurrentTimer = createSelector([selectTimerState], (timer) => timer.currentTimer);

export const selectCurrentStartTime = createSelector(
  [selectTimerState],
  (timer) => timer.currentStartTime
);

// Backwards compatibility aliases
export const selectStageDurationRemaining = selectCurrentTimerRemaining;
export const selectStageDuration = selectCurrentTimer;
export const selectStageStartTime = selectCurrentStartTime;

// Dynamic session tracking selectors
export const selectMomentum = createSelector([selectTimerState], (timer) => timer.momentum);

export const selectLastCompletedFocusSessionSeconds = createSelector(
  [selectTimerState],
  (timer) => timer.lastCompletedFocusSessionSeconds
);

// Derived state selectors
export const selectIsSessionActive = createSelector([selectSessionState], (sessionState) =>
  ['ONGOING_FOCUS_SESSION', 'ONGOING_BREAK_SESSION', 'FOCUS_SESSION_COUNTDOWN'].includes(
    sessionState
  )
);

export const selectCanPause = createSelector(
  [selectSessionState, selectIsPaused],
  (sessionState, isPaused) =>
    !isPaused && ['ONGOING_FOCUS_SESSION', 'FOCUS_SESSION_COUNTDOWN'].includes(sessionState)
);

export const selectCanResume = createSelector([selectIsPaused], (isPaused) => isPaused);

export const selectIsWorkSessionComplete = createSelector(
  [selectSessionState],
  (sessionState) => sessionState === 'WORK_SESSION_COMPLETE'
);

export const selectIsInRewardSelection = createSelector(
  [selectSessionState],
  (sessionState) => sessionState === 'REWARD_SELECTION'
);

export const selectCanGenerateRewards = createSelector(
  [selectIsInRewardSelection, selectGeneratedRewards],
  (isInRewardSelection, generatedRewards) => isInRewardSelection && generatedRewards.length === 0
);

export const selectWorkProgress = createSelector(
  [selectWorkRemaining, selectTargetWorkSecondsToday],
  (remaining, target) => (target > 0 ? (target - remaining) / target : 0)
);
