import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { calculateRemaining } from '../../lib/timer-utils';

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
export const selectWorkSessionDurationRemaining = createSelector(
  [selectTimerState],
  (timer) => timer.workSessionDurationRemaining
);

export const selectInitialWorkSessionDuration = createSelector(
  [selectTimerState],
  (timer) => timer.initialWorkSessionDuration
);

export const selectTargetWorkMinutesToday = createSelector(
  [selectTimerState],
  (timer) => timer.targetWorkMinutesToday
);

export const selectCompletedWorkMinutesToday = createSelector(
  [selectTimerState],
  (timer) => timer.completedWorkMinutesToday
);

// Focus session selectors
export const selectNextFocusDuration = createSelector(
  [selectTimerState],
  (timer) => timer.nextFocusDuration
);

export const selectFocusSessionDurationRemaining = createSelector([selectTimerState], (timer) => {
  if (timer.sessionState === 'ONGOING_FOCUS_SESSION' && !timer.isPaused) {
    return calculateRemaining(timer.initialFocusSessionDuration, timer.focusSessionEntryTimeStamp);
  }
  return timer.focusSessionDurationRemaining;
});

export const selectInitialFocusSessionDuration = createSelector(
  [selectTimerState],
  (timer) => timer.initialFocusSessionDuration
);

export const selectFocusSessionEntryTimeStamp = createSelector(
  [selectTimerState],
  (timer) => timer.focusSessionEntryTimeStamp
);

// Break session selectors
export const selectNextBreakDuration = createSelector(
  [selectTimerState],
  (timer) => timer.nextBreakDuration
);

export const selectBreakSessionDurationRemaining = createSelector([selectTimerState], (timer) => {
  if (timer.sessionState === 'ONGOING_BREAK_SESSION') {
    return calculateRemaining(timer.initialBreakSessionDuration, timer.breakSessionEntryTimeStamp);
  }
  return timer.breakSessionDurationRemaining;
});

export const selectInitialBreakSessionDuration = createSelector(
  [selectTimerState],
  (timer) => timer.initialBreakSessionDuration
);

export const selectBreakSessionEntryTimeStamp = createSelector(
  [selectTimerState],
  (timer) => timer.breakSessionEntryTimeStamp
);

// Countdown selectors
export const selectFocusSessionCountdownTimeRemaining = createSelector(
  [selectTimerState],
  (timer) => {
    if (timer.sessionState === 'FOCUS_SESSION_COUNTDOWN' && !timer.isPaused) {
      return calculateRemaining(
        timer.initialFocusSessionCountdownDuration,
        timer.focusSessionCountdownEntryTimeStamp
      );
    }
    return timer.focusSessionCountdownTimeRemaining;
  }
);

// Dynamic session tracking selectors
export const selectMomentum = createSelector([selectTimerState], (timer) => timer.momentum);

export const selectLastCompletedFocusSessionMinutes = createSelector(
  [selectTimerState],
  (timer) => timer.lastCompletedFocusSessionMinutes
);

export const selectFatigueWeightMultiplier = createSelector(
  [selectTimerState],
  (timer) => timer.fatigueWeightMultiplier
);

export const selectMomentumWeightMultiplier = createSelector(
  [selectTimerState],
  (timer) => timer.momentumWeightMultiplier
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
  [selectCompletedWorkMinutesToday, selectTargetWorkMinutesToday],
  (completed, target) => (target > 0 ? completed / target : 0)
);
